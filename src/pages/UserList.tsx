import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUserApi, clearAuth, getAuth, initUserApi } from '../services/api';
import type { UserListItem, UserDetail, JobListItem } from '../types/user';

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

// User Detail Modal
function UserDetailModal({
  userId,
  onClose,
  onCreditsUpdated,
}: {
  userId: string;
  onClose: () => void;
  onCreditsUpdated: () => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creditsAmount, setCreditsAmount] = useState('');
  const [creditsReason, setCreditsReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadUserDetail();
  }, [userId]);

  const loadUserDetail = async () => {
    try {
      setLoading(true);
      const api = getUserApi();
      const data = await api.getUser(userId);
      setDetail(data);
    } catch (err) {
      setError('Failed to load user details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(creditsAmount);
    if (isNaN(amount) || amount <= 0) {
      setToast({ message: 'Amount must be a positive number', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const api = getUserApi();
      await api.grantCredits(userId, amount, creditsReason || undefined);
      setToast({ message: `Successfully granted ${amount} credits`, type: 'success' });
      setCreditsAmount('');
      setCreditsReason('');
      loadUserDetail();
      onCreditsUpdated();
    } catch (err) {
      setToast({ message: 'Failed to grant credits', type: 'error' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">User Details</h2>
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
            {/* User Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">User Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">ID</span>
                  <p className="font-mono text-sm break-all">{detail.user.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email</span>
                  <p className="font-medium">{detail.user.email || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Account Type</span>
                  <p>
                    <span className={`px-2 py-1 text-xs rounded ${
                      detail.user.account_type === 'registered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {detail.user.account_type}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Feature Level</span>
                  <p>
                    <span className={`px-2 py-1 text-xs rounded ${
                      detail.user.feature_level === 'pro' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {detail.user.feature_level}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Subscription</span>
                  <p>
                    <span className={`px-2 py-1 text-xs rounded ${
                      detail.user.subscription_tier !== 'free' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {detail.user.subscription_tier}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Created At</span>
                  <p className="text-sm">{formatDate(detail.user.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Credits Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Credits</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{detail.user.credits}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">{detail.user.credits_frozen}</p>
                  <p className="text-sm text-gray-600">Frozen</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{detail.user.available_credits}</p>
                  <p className="text-sm text-gray-600">Available</p>
                </div>
              </div>

              {/* Grant Credits Form */}
              <form onSubmit={handleGrantCredits} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Grant Credits</h4>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={creditsAmount}
                    onChange={(e) => setCreditsAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={creditsReason}
                    onChange={(e) => setCreditsReason(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Granting...' : 'Grant'}
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Jobs */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Recent Jobs <span className="text-sm font-normal text-gray-500">({detail.job_count} total)</span>
              </h3>
              {detail.recent_jobs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No jobs yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Cost</th>
                        <th className="px-3 py-2 text-left">Created</th>
                        <th className="px-3 py-2 text-left">Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detail.recent_jobs.map((job: JobListItem) => (
                        <tr key={job.id}>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              job.type === 'image' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {job.type}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(job.status)}`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">{job.cost}</td>
                          <td className="px-3 py-2 text-gray-600">{formatDate(job.created_at)}</td>
                          <td className="px-3 py-2">
                            {job.result_url ? (
                              <a
                                href={job.result_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  );
}

export default function UserList() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'guest' | 'registered'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'organic' | 'paid_ad'>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [userEmail, setUserEmail] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      navigate('/');
      return;
    }
    setUserEmail(auth.user.email);
    initUserApi(auth.token);
  }, [navigate]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const api = getUserApi();
      const response = await api.listUsers({
        page,
        page_size: pageSize,
        email: search || undefined,
        account_type: filter === 'all' ? undefined : filter,
        acquisition_source: sourceFilter === 'all' ? undefined : sourceFilter,
      });
      setUsers(response.users || []);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, filter, sourceFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <nav className="flex gap-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link to="/templates" className="text-gray-600 hover:text-gray-900">
                Templates
              </Link>
              <Link to="/users" className="text-blue-600 font-medium">
                Users
              </Link>
              <Link to="/jobs" className="text-gray-600 hover:text-gray-900">
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
          {/* Account Type Filters */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-700 self-center mr-2">Account Type:</span>
              {(['all', 'guest', 'registered'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => { setFilter(type); setPage(1); }}
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

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Search by email..."
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

          {/* Attribution Source Filters */}
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">Attribution:</span>
            {(['all', 'organic', 'paid_ad'] as const).map((type) => (
              <button
                key={type}
                onClick={() => { setSourceFilter(type); setPage(1); }}
                className={`px-4 py-2 rounded-md ${
                  sourceFilter === type
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {type === 'paid_ad' ? 'Paid Ad' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
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
              Showing {users.length} of {total} users
              {search && <span className="ml-2">(filtered by "{search}")</span>}
            </div>

            {/* User Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.email || <span className="text-gray-400 italic">No email</span>}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{user.id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          user.account_type === 'registered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.account_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            user.acquisition_source === 'paid_ad'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                          title={user.campaign_id ? `Campaign: ${user.campaign_id}` : undefined}
                        >
                          {user.acquisition_source === 'paid_ad' ? 'Paid Ad' : 'Organic'}
                        </span>
                        {user.campaign_id && (
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            {user.campaign_id.substring(0, 12)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.available_credits}</div>
                        {user.credits_frozen > 0 && (
                          <div className="text-xs text-orange-600">({user.credits_frozen} frozen)</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          user.feature_level === 'pro'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.feature_level}
                        </span>
                        {user.subscription_tier !== 'free' && (
                          <span className="ml-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {user.subscription_tier}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedUserId(user.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Details
                        </button>
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
            {users.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onCreditsUpdated={loadUsers}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
