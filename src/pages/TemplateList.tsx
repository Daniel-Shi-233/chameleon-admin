import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemplateApi, clearAuth, getAuth, initTemplateApi } from '../services/api';
import type { TemplateListItem } from '../types/template';

// Toast component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`}>
      {message}
    </div>
  );
}

// Confirmation Modal
function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  danger = false
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Preview Modal
function PreviewModal({
  template,
  onClose
}: {
  template: TemplateListItem;
  onClose: () => void;
}) {
  const isVideo = template.type === 'video' && template.preview_video_url;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {isVideo ? (
          <video
            src={template.preview_video_url}
            className="max-w-full max-h-[85vh] rounded-lg"
            controls
            autoPlay
          />
        ) : (
          <img
            src={template.thumbnail_url || 'https://via.placeholder.com/800'}
            alt={template.name}
            className="max-w-full max-h-[85vh] rounded-lg object-contain"
          />
        )}
        <div className="mt-2 text-center text-white">
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <p className="text-sm text-gray-300">{template.category}</p>
        </div>
      </div>
    </div>
  );
}

export default function TemplateList() {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [userEmail, setUserEmail] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewTemplate, setPreviewTemplate] = useState<TemplateListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateListItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      navigate('/');
      return;
    }
    setUserEmail(auth.user.email);
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
      setSelectedIds(new Set());
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === templates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(templates.map(t => t.id)));
    }
  };

  const handleBatchToggle = async (isActive: boolean) => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    try {
      const api = getTemplateApi();
      const count = await api.batchUpdateTemplates(Array.from(selectedIds), { is_active: isActive });
      showToast(`${count} templates ${isActive ? 'enabled' : 'disabled'}`, 'success');
      loadTemplates();
    } catch (err) {
      showToast('Failed to update templates', 'error');
      console.error(err);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const api = getTemplateApi();
      await api.duplicateTemplate(id);
      showToast('Template duplicated', 'success');
      loadTemplates();
    } catch (err) {
      showToast('Failed to duplicate template', 'error');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const api = getTemplateApi();
      await api.deleteTemplate(deleteTarget.id);
      setTemplates(templates.filter((t) => t.id !== deleteTarget.id));
      showToast('Template deleted', 'success');
    } catch (err) {
      showToast('Failed to delete template', 'error');
      console.error(err);
    } finally {
      setDeleteTarget(null);
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
        {/* Filters & Batch Actions */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
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

          {/* Batch Actions */}
          {selectedIds.size > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
              <button
                onClick={() => handleBatchToggle(true)}
                disabled={batchLoading}
                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
              >
                Enable
              </button>
              <button
                onClick={() => handleBatchToggle(false)}
                disabled={batchLoading}
                className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
              >
                Disable
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
              >
                Clear
              </button>
            </div>
          )}
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
          <>
            {/* Select All */}
            {templates.length > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === templates.length && templates.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            )}

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white rounded-lg shadow overflow-hidden relative ${
                    !template.is_active ? 'opacity-60' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(template.id)}
                      onChange={() => toggleSelect(template.id)}
                      className="w-5 h-5 text-blue-600 rounded bg-white shadow"
                    />
                  </div>

                  {/* Thumbnail - Clickable for preview */}
                  <div
                    className="aspect-square relative cursor-pointer overflow-hidden bg-gray-200 group"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    {template.type === 'video' && template.preview_video_url ? (
                      <video
                        src={template.preview_video_url}
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <img
                        src={template.thumbnail_url || 'https://via.placeholder.com/400'}
                        alt={template.name}
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Error';
                        }}
                      />
                    )}
                    {/* Hover overlay - only visible on hover */}
                    <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                    {/* Type Badge */}
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded ${
                        template.type === 'image'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {template.type}
                    </span>
                    {/* Status Badge */}
                    {!template.is_active && (
                      <span className="absolute bottom-2 right-2 px-2 py-1 text-xs font-semibold rounded bg-gray-800 text-gray-200">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {template.category || 'Uncategorized'}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        template.is_public ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {template.is_public ? 'Public' : 'Private'}
                      </span>
                      <span className="text-xs text-gray-400">
                        #{template.sort_order}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/templates/${template.id}`)}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicate(template.id)}
                        className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded text-sm"
                        title="Duplicate"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(template)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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

      {/* Modals */}
      {previewTemplate && (
        <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Template"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          confirmText="Delete"
          danger
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
