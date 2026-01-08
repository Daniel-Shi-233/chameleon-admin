import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemplateApi, clearAuth, getAuth, initTemplateApi } from '../services/api';
import type { TemplateListItem } from '../types/template';

export default function TemplateList() {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if logged in
    const auth = getAuth();
    if (!auth) {
      navigate('/');
      return;
    }

    // Set user email for display
    setUserEmail(auth.user.email);
    // Initialize API client with token
    initTemplateApi(auth.token);

    loadTemplates();
  }, [filter, navigate]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const api = getTemplateApi();
      const response = await api.listTemplates({
        type: filter === 'all' ? undefined : filter,
        page_size: 100,
      });
      setTemplates(response.templates || []);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const api = getTemplateApi();
      await api.deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err) {
      setError('Failed to delete template');
      console.error(err);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/templates/new')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + New Template
            </button>
            <span className="text-sm text-gray-500">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 px-4 py-2"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {(['all', 'image', 'video'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-md ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          /* Template Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="aspect-square relative">
                  {template.type === 'video' && template.preview_video_url ? (
                    <video
                      src={template.preview_video_url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={template.thumbnail_url || 'https://via.placeholder.com/400'}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Type Badge */}
                  <span
                    className={`absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded ${
                      template.type === 'image'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {template.type}
                  </span>
                  {/* Visibility Badge */}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded ${
                      template.is_public
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {template.is_public ? 'Public' : 'Private'}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {template.category || 'Uncategorized'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Order: {template.sort_order}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/templates/${template.id}`)}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && templates.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No templates found</p>
            <button
              onClick={() => navigate('/templates/new')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create your first template
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
