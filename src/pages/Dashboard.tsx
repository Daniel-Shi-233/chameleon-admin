import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDashboardSummary, getAttributionStats, clearAuth, getAuth, type DashboardSummary } from '../services/api';
import type { AttributionStats } from '../types/attribution';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [attributionStats, setAttributionStats] = useState<AttributionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      navigate('/');
      return;
    }
    setUserEmail(auth.user.email);
    loadDashboard(auth.token);
  }, [navigate]);

  const loadDashboard = async (token: string) => {
    try {
      setLoading(true);
      const data = await getDashboardSummary(token);
      setSummary(data);

      // Load attribution stats separately (don't block dashboard if it fails)
      try {
        const statsData = await getAttributionStats(token);
        setAttributionStats(statsData);
      } catch (statsErr) {
        console.error('Failed to load attribution stats:', statsErr);
        setAttributionStats(null);
      }
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const handleRefresh = () => {
    const auth = getAuth();
    if (auth) {
      loadDashboard(auth.token);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <nav className="flex gap-4">
              <Link to="/dashboard" className="text-blue-600 font-medium">
                Dashboard
              </Link>
              <Link to="/templates" className="text-gray-600 hover:text-gray-900">
                Templates
              </Link>
              <Link to="/users" className="text-gray-600 hover:text-gray-900">
                Users
              </Link>
              <Link to="/jobs" className="text-gray-600 hover:text-gray-900">
                Jobs
              </Link>
              <Link to="/attribution" className="text-gray-600 hover:text-gray-900">
                Attribution
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className="text-gray-600 hover:text-gray-900 px-3 py-1 border rounded"
            >
              Refresh
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
        ) : summary && (
          <>
            {/* User Stats */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">User Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-500">Total Users</div>
                  <div className="text-3xl font-bold text-blue-600">{summary.total_users.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-500">Registered</div>
                  <div className="text-3xl font-bold text-green-600">{summary.registered_users.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-500">Guest</div>
                  <div className="text-3xl font-bold text-gray-600">{summary.guest_users.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-500">Total Credits</div>
                  <div className="text-3xl font-bold text-purple-600">{summary.total_credits.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Job Stats */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Job Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-500">Total Jobs</div>
                  <div className="text-3xl font-bold text-blue-600">{summary.total_jobs.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-500">Queued</div>
                  <div className="text-3xl font-bold text-yellow-600">{summary.queued_jobs.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-500">Processing</div>
                  <div className="text-3xl font-bold text-blue-600">{summary.processing_jobs.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-500">Completed</div>
                  <div className="text-3xl font-bold text-green-600">{summary.completed_jobs.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Today's Stats */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Today's Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-500">Jobs Today</div>
                  <div className="text-3xl font-bold text-blue-600">{summary.today_jobs.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-500">Failed Today</div>
                  <div className="text-3xl font-bold text-red-600">{summary.today_failed.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-500">Failure Rate</div>
                  <div className={`text-3xl font-bold ${
                    summary.today_failure_rate > 10 ? 'text-red-600' :
                    summary.today_failure_rate > 5 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {summary.today_failure_rate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Unhandled Failed Jobs */}
            {summary.unhandled_failed_jobs > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-yellow-800 font-medium">Unhandled Failed Jobs</h3>
                    <p className="text-yellow-600 text-sm mt-1">
                      There are {summary.unhandled_failed_jobs} failed jobs that need attention.
                    </p>
                  </div>
                  <Link
                    to="/jobs?status=failed"
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    View & Handle
                  </Link>
                </div>
              </div>
            )}

            {/* Failed Jobs (all handled) */}
            {summary.unhandled_failed_jobs === 0 && summary.failed_jobs > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-green-800 font-medium">Failed Jobs</h3>
                    <p className="text-green-600 text-sm mt-1">
                      All {summary.failed_jobs} failed jobs have been handled.
                    </p>
                  </div>
                  <Link
                    to="/jobs?status=failed"
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    View All
                  </Link>
                </div>
              </div>
            )}

            {/* Attribution Statistics */}
            {attributionStats && (
              <>
                <div className="mt-8">
                  <h2 className="text-lg font-semibold mb-4">Attribution Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-500">Total Users</div>
                      <div className="text-3xl font-bold text-blue-600">{attributionStats.total_users.toLocaleString()}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {attributionStats.organic_users} organic / {attributionStats.paid_ad_users} paid
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-500">Organic Users</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-3xl font-bold text-green-600">
                          {attributionStats.organic_users.toLocaleString()}
                        </div>
                        <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded">
                          {attributionStats.organic_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-500">Paid Ad Users</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-3xl font-bold text-purple-600">
                          {attributionStats.paid_ad_users.toLocaleString()}
                        </div>
                        <span className="text-sm px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          {attributionStats.paid_ad_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-500">Match Rate</div>
                      <div className="text-3xl font-bold text-teal-600">
                        {attributionStats.match_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {attributionStats.matched_fingerprints} / {attributionStats.total_fingerprints} fingerprints
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-lg font-semibold mb-4">Credit Tracking</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-500">Trial Credits Granted</div>
                      <div className="text-3xl font-bold text-orange-600">
                        {attributionStats.trial_credits_granted.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-500">Credit Grant Rate</div>
                      <div className="text-3xl font-bold text-pink-600">
                        {attributionStats.credit_grant_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        of matched fingerprints
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-500">Organic Total Credits</div>
                      <div className="text-3xl font-bold text-green-600">
                        {attributionStats.organic_total_credits.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-500">Paid Ad Total Credits</div>
                      <div className="text-3xl font-bold text-purple-600">
                        {attributionStats.paid_ad_total_credits.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Link
                      to="/attribution"
                      className="inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Detailed Attribution Analytics →
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* Quick Links */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/jobs"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">View All Jobs</div>
                    <div className="text-sm text-gray-500">Monitor generation tasks</div>
                  </div>
                </Link>
                <Link
                  to="/users"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Manage Users</div>
                    <div className="text-sm text-gray-500">Grant credits, view details</div>
                  </div>
                </Link>
                <Link
                  to="/templates"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Edit Templates</div>
                    <div className="text-sm text-gray-500">Create and manage templates</div>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
