import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTemplateApi, getAuth, initTemplateApi } from '../services/api';
import type { Template, TemplateType, TemplateParams } from '../types/template';

// Tooltip component
function Tooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-1">
      <span className="cursor-help text-gray-400 hover:text-gray-600">
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
      <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-sm text-white bg-gray-800 rounded-lg shadow-lg -left-28 top-6">
        {text}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
      </div>
    </div>
  );
}

// Parameter options based on BytePlus API
const RATIO_OPTIONS = [
  { value: '16:9', label: '16:9 (Landscape)' },
  { value: '9:16', label: '9:16 (Portrait)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
  { value: '21:9', label: '21:9 (Ultrawide)' },
];

const RESOLUTION_OPTIONS = [
  { value: '480p', label: '480p (SD)' },
  { value: '720p', label: '720p (HD)' },
  { value: '1080p', label: '1080p (Full HD)' },
];

const IMAGE_SIZE_OPTIONS = [
  { value: '512x512', label: '512x512' },
  { value: '768x768', label: '768x768' },
  { value: '1024x1024', label: '1024x1024' },
  { value: '1024x576', label: '1024x576 (16:9)' },
  { value: '576x1024', label: '576x1024 (9:16)' },
];

const DURATION_OPTIONS = [
  { value: '5', label: '5 seconds' },
  { value: '10', label: '10 seconds' },
];

const STYLE_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'anime', label: 'Anime' },
  { value: 'illustration', label: 'Illustration' },
  { value: '3d', label: '3D Render' },
];

export default function TemplateEdit() {
  const { id } = useParams<{ id: string }>();
  // id is undefined for /templates/new route, or 'new' if using /templates/:id with 'new'
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<TemplateType>('image');
  const [category, setCategory] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [targetCampaigns, setTargetCampaigns] = useState('');
  const [abTestGroup, setAbTestGroup] = useState('');
  const [params, setParams] = useState<TemplateParams>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      navigate('/');
      return;
    }

    // Initialize API client with token
    initTemplateApi(auth.token);

    // Load categories
    loadCategories();

    if (!isNew && id) {
      loadTemplate(id);
    }
  }, [id, isNew, navigate]);

  const loadCategories = async () => {
    try {
      const api = getTemplateApi();
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const api = getTemplateApi();
      const template = await api.getTemplate(templateId);
      populateForm(template);
    } catch (err) {
      setError('Failed to load template');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (template: Template) => {
    setName(template.name);
    setType(template.type);
    setCategory(template.category);
    setThumbnailUrl(template.thumbnail_url);
    setThumbnailPreview(template.thumbnail_url);
    setPreviewVideoUrl(template.preview_video_url || '');
    setPrompt(template.prompt);
    setNegativePrompt(template.negative_prompt || '');
    setIsActive(template.is_active);
    setSortOrder(template.sort_order);
    setIsPublic(template.is_public);
    setTargetCampaigns(template.target_campaigns?.join(', ') || '');
    setAbTestGroup(template.ab_test_group || '');
    setParams(template.params || {});
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      setError('Please select an image (JPG, PNG, GIF, WebP) or video (MP4, WebM)');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to R2 storage
    setUploading(true);
    setError('');
    try {
      const api = getTemplateApi();
      const result = await api.uploadFile(file);
      setThumbnailUrl(result.url);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload file. Please try again or enter URL manually.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const api = getTemplateApi();
      const data = {
        name,
        type,
        category,
        thumbnail_url: thumbnailUrl,
        preview_video_url: previewVideoUrl || undefined,
        prompt,
        negative_prompt: negativePrompt || undefined,
        is_active: isActive,
        sort_order: sortOrder,
        is_public: isPublic,
        target_campaigns: targetCampaigns
          ? targetCampaigns.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        ab_test_group: abTestGroup || undefined,
        params: Object.keys(params).length > 0 ? params : undefined,
      };

      if (isNew) {
        await api.createTemplate(data);
      } else if (id) {
        await api.updateTemplate(id, data);
      }

      navigate('/templates');
    } catch (err) {
      setError('Failed to save template');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Create Template' : 'Edit Template'}
          </h1>
          <button
            onClick={() => navigate('/templates')}
            className="text-gray-600 hover:text-gray-900 px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                  <Tooltip text="Display name shown to users in the app. Should be clear and descriptive." />
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Professional Headshot"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                  <Tooltip text="Image templates generate static images. Video templates create animated content." />
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TemplateType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                  <Tooltip text="Used to group templates in the app. Users can filter by category." />
                </label>
                {showCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new category name"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryInput(false);
                        if (!category) setCategory(categories[0] || '');
                      }}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setShowCategoryInput(true);
                          setCategory('');
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__new__">+ Create new category</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                  <Tooltip text="Templates are displayed in ascending order. Lower numbers appear first. Use 0 for default sorting." />
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Thumbnail
              <Tooltip text="Preview image shown in the template list. Supports JPG, PNG, GIF, WebP. Recommended size: 512x512." />
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {thumbnailPreview && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {thumbnailPreview.includes('video') ? (
                      <video src={thumbnailPreview} className="w-full h-full object-cover" />
                    ) : (
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </button>
                  <span className="text-gray-500 text-sm ml-2">or enter URL below</span>
                </div>
              </div>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => {
                  setThumbnailUrl(e.target.value);
                  setThumbnailPreview(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/thumbnail.jpg"
                required
              />
            </div>

            {type === 'video' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview Video URL
                  <Tooltip text="Optional video preview shown when users tap on the template. Should be a short clip demonstrating the effect." />
                </label>
                <input
                  type="url"
                  value={previewVideoUrl}
                  onChange={(e) => setPreviewVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/preview.mp4"
                />
              </div>
            )}
          </div>

          {/* Prompts */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Prompts</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt *
                  <Tooltip text="Main instruction sent to the AI. Describe what you want to generate. Use {input} placeholder for user-provided content." />
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="A professional portrait photo of {input}, studio lighting, high quality..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Negative Prompt
                  <Tooltip text="Things to avoid in the generation. Common examples: blurry, low quality, distorted, watermark." />
                </label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="blurry, low quality, distorted, watermark, ugly..."
                />
              </div>
            </div>
          </div>

          {/* Generation Parameters */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Generation Parameters
              <Tooltip text="These parameters control how the AI generates content. They override user selections when set." />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ratio
                  <Tooltip text="Aspect ratio of the output. 16:9 for landscape, 9:16 for portrait (TikTok/Reels), 1:1 for square." />
                </label>
                <select
                  value={params.ratio || ''}
                  onChange={(e) => setParams({ ...params, ratio: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default (User Choice)</option>
                  {RATIO_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === 'video' ? 'Resolution' : 'Size'}
                  <Tooltip text={type === 'video' ? 'Video resolution. Higher = better quality but longer generation time.' : 'Output image dimensions in pixels.'} />
                </label>
                <select
                  value={params.resolution || ''}
                  onChange={(e) => setParams({ ...params, resolution: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default (User Choice)</option>
                  {(type === 'video' ? RESOLUTION_OPTIONS : IMAGE_SIZE_OPTIONS).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Style
                  <Tooltip text="Visual style of the output. Affects the overall look and feel of generated content." />
                </label>
                <select
                  value={params.style || ''}
                  onChange={(e) => setParams({ ...params, style: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STYLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                    <Tooltip text="Length of the generated video. Longer videos take more time and credits to generate." />
                  </label>
                  <select
                    value={params.duration || ''}
                    onChange={(e) => setParams({ ...params, duration: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Default (User Choice)</option>
                    {DURATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                  <Tooltip text="AI model to use. Leave empty to use the default model. Advanced users only." />
                </label>
                <input
                  type="text"
                  value={params.model || ''}
                  onChange={(e) => setParams({ ...params, model: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty for default"
                />
              </div>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Visibility & Targeting</h3>
            <p className="text-sm text-gray-500 mb-4">Control who can see and use this template.</p>

            <div className="space-y-4">
              <div className="flex items-start gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Active</span>
                    <p className="text-xs text-gray-500">Inactive templates are hidden from all users</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Public</span>
                    <p className="text-xs text-gray-500">Visible to all users. Uncheck to restrict access.</p>
                  </div>
                </label>
              </div>

              {!isPublic && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Campaigns
                    <Tooltip text="Comma-separated list of campaign IDs. Only users acquired through these campaigns can see this template." />
                  </label>
                  <input
                    type="text"
                    value={targetCampaigns}
                    onChange={(e) => setTargetCampaigns(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., fb_summer2024, ig_promo, tiktok_q1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to show to all paid users only.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  A/B Test Group
                  <Tooltip text="Assign template to a test group. Users are randomly assigned to groups. Use to compare template performance." />
                </label>
                <input
                  type="text"
                  value={abTestGroup}
                  onChange={(e) => setAbTestGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
                  placeholder="e.g., A, B, control"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isNew ? 'Create Template' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
