import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getJobApi, clearAuth, getAuth, initJobApi } from '../services/api';
import type { JobListItem, JobDetail, JobStatus, JobType } from '../types/job';

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

// Job Detail Modal
function JobDetailModal({
  jobId,
  onClose,
}: {
  jobId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadJobDetail();
  }, [jobId]);

  const loadJobDetail = async () => {
    try {
      setLoading(true);
      const api = getJobApi();
      const data = await api.getJob(jobId);
      setDetail(data);
    } catch (err) {
      setError('Failed to load job details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Job Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {detail && !loading && (
          <>
            {/* Basic Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Job ID</span>
                  <p className="font-mono text-sm break-all">{detail.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Type</span>
                  <p>
                    <span className={`px-2 py-1 text-xs rounded ${
                      detail.type === 'image' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {detail.type}
                    </span>
                    {detail.mode && <span className="ml-2 text-sm text-gray-600">{detail.mode}</span>}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status</span>
                  <p>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(detail.status)}`}>
                      {detail.status}
                    </span>
                    {detail.progress > 0 && detail.progress < 100 && (
                      <span className="ml-2 text-sm text-gray-600">{detail.progress}%</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Cost</span>
                  <p className="font-medium">{detail.cost} credits</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Safe Mode</span>
                  <p>{detail.is_safe_mode ? 'Yes' : 'No'}</p>
                </div>
                {detail.provider_job_id && (
                  <div>
                    <span className="text-sm text-gray-500">Provider Job ID</span>
                    <p className="font-mono text-xs break-all">{detail.provider_job_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Timeline</h3>
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Created</span>
                  <p className="text-sm">{formatDate(detail.created_at)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Started</span>
                  <p className="text-sm">{formatDate(detail.started_at)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Completed</span>
                  <p className="text-sm">{formatDate(detail.completed_at)}</p>
                </div>
              </div>
            </div>

            {/* User Info */}
            {detail.user && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-500">User ID</span>
                    <p className="font-mono text-xs break-all">{detail.user.id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email</span>
                    <p className="text-sm">{detail.user.email || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Account Type</span>
                    <p className="text-sm">{detail.user.account_type}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Credits</span>
                    <p className="text-sm">{detail.user.credits}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Generation Parameters */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Generation Parameters</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Prompt</span>
                  <p className="text-sm bg-white p-2 rounded border mt-1 whitespace-pre-wrap">{detail.prompt}</p>
                </div>
                {detail.negative_prompt && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">Negative Prompt</span>
                    <p className="text-sm bg-white p-2 rounded border mt-1 whitespace-pre-wrap">{detail.negative_prompt}</p>
                  </div>
                )}
                {detail.config && Object.keys(detail.config).length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Config</span>
                    <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                      {JSON.stringify(detail.config, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Result */}
            {(detail.result_url || detail.error_message) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Result</h3>
                {detail.error_message && (
                  <div className="bg-red-50 p-4 rounded-lg mb-4">
                    <span className="text-sm text-red-600 font-medium">Error Message</span>
                    <p className="text-sm text-red-800 mt-1">{detail.error_message}</p>
                  </div>
                )}
                {detail.result_url && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <span className="text-sm text-gray-500">Result URL</span>
                    <div className="mt-2">
                      <a
                        href={detail.result_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {detail.result_url}
                      </a>
                    </div>
                    {detail.type === 'image' && (
                      <div className="mt-4">
                        <img
                          src={detail.result_url}
                          alt="Generated result"
                          className="max-w-full max-h-64 rounded border"
                        />
                      </div>
                    )}
                    {detail.type === 'video' && (
                      <div className="mt-4">
                        <video
                          src={detail.result_url}
                          controls
                          className="max-w-full max-h-64 rounded border"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function JobList() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<JobType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [userEmail, setUserEmail] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      navigate('/');
      return;
    }
    setUserEmail(auth.user.email);
    initJobApi(auth.token);
  }, [navigate]);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const api = getJobApi();
      const response = await api.listJobs({
        page,
        page_size: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        user_id: search || undefined,
      });
      setJobs(response.jobs || []);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to load jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, typeFilter, search]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
            <nav className="flex gap-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link to="/templates" className="text-gray-600 hover:text-gray-900">
                Templates
              </Link>
              <Link to="/users" className="text-gray-600 hover:text-gray-900">
                Users
              </Link>
              <Link to="/jobs" className="text-blue-600 font-medium">
                Jobs
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
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
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Status Filter */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">Status:</span>
              <div className="flex gap-1">
                {(['all', 'queued', 'processing', 'completed', 'failed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setPage(1); }}
                    className={`px-3 py-1 text-sm rounded-md ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">Type:</span>
              <div className="flex gap-1">
                {(['all', 'image', 'video'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setTypeFilter(type); setPage(1); }}
                    className={`px-3 py-1 text-sm rounded-md ${
                      typeFilter === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search by user ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear
              </button>
            )}
          </form>
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
            {/* Stats */}
            <div className="mb-4 text-sm text-gray-600">
              Showing {jobs.length} of {total} jobs
              {search && <span className="ml-2">(filtered by user "{search}")</span>}
            </div>

            {/* Job Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{job.id.substring(0, 8)}...</div>
                        <div className="text-xs text-gray-500">User: {job.user_id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          job.type === 'image'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {job.type}
                        </span>
                        {job.mode && (
                          <span className="ml-1 text-xs text-gray-500">{job.mode}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        {job.progress > 0 && job.progress < 100 && (
                          <span className="ml-2 text-xs text-gray-500">{job.progress}%</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.cost}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        {job.error_message ? (
                          <span className="text-xs text-red-600 truncate block" title={job.error_message}>
                            {job.error_message.substring(0, 50)}...
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedJobId(job.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Details
                        </button>
                        {job.result_url && (
                          <a
                            href={job.result_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-3 text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-white border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-1 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-white border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}

            {/* Empty State */}
            {jobs.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">No jobs found</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Job Detail Modal */}
      {selectedJobId && (
        <JobDetailModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
