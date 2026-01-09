import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAttributionStats, getFunnelStats, clearAuth, getAuth } from '../services/api';
import type { AttributionStats, FunnelStatsResponse } from '../types/attribution';

export default function Attribution() {
  const [stats, setStats] = useState<AttributionStats | null>(null);
  const [funnelStats, setFunnelStats] = useState<FunnelStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [period, setPeriod] = useState('7d');
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      navigate('/');
      return;
    }
    setUserEmail(auth.user.email);
    loadAllStats(auth.token, period);
  }, [navigate, period]);

  const loadAllStats = async (token: string, selectedPeriod: string) => {
    try {
      setLoading(true);
      const [attrData, funnelData] = await Promise.all([
        getAttributionStats(token),
        getFunnelStats(token, selectedPeriod),
      ]);
      setStats(attrData);
      setFunnelStats(funnelData);
    } catch (err) {
      setError('Failed to load attribution statistics');
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
      loadAllStats(auth.token, period);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900">Attribution Analytics</h1>
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
              <Link to="/jobs" className="text-gray-600 hover:text-gray-900">
                Jobs
              </Link>
              <Link to="/attribution" className="text-blue-600 font-medium">
                Attribution
              </Link>
              <Link to="/matching-rules" className="text-gray-600 hover:text-gray-900">
                Rules
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
        {/* Page Title and Controls */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Attribution Statistics</h2>
            <p className="text-gray-600 mt-1">Track user acquisition sources and campaign performance</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !stats && (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Funnel Statistics */}
        {funnelStats && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-6">Landing Page Funnel ({funnelStats.period})</h3>

            {/* Funnel Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Page Views</div>
                <div className="text-3xl font-bold text-blue-600">
                  {funnelStats.funnel.page_views.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">Landing page visits</div>
              </div>

              <div className="bg-cyan-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Download Clicks</div>
                <div className="text-3xl font-bold text-cyan-600">
                  {funnelStats.funnel.download_clicks.toLocaleString()}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {funnelStats.conversion_rates.click_rate.toFixed(1)}% click rate
                </div>
              </div>

              <div className="bg-teal-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">App Opens</div>
                <div className="text-3xl font-bold text-teal-600">
                  {funnelStats.funnel.app_opens.toLocaleString()}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {funnelStats.conversion_rates.install_rate.toFixed(1)}% install rate
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Attributions</div>
                <div className="text-3xl font-bold text-purple-600">
                  {funnelStats.funnel.attributions.toLocaleString()}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {funnelStats.conversion_rates.attribution_rate.toFixed(1)}% attribution rate
                </div>
              </div>
            </div>

            {/* Funnel Visualization */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-24 text-xs text-gray-500 text-right">Page Views</div>
                <div className="flex-grow bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-blue-500 h-6 rounded-full transition-all"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="w-16 text-sm font-semibold text-gray-700">
                  {funnelStats.funnel.page_views.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-24 text-xs text-gray-500 text-right">Clicks</div>
                <div className="flex-grow bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-cyan-500 h-6 rounded-full transition-all"
                    style={{
                      width: `${funnelStats.funnel.page_views > 0
                        ? (funnelStats.funnel.download_clicks / funnelStats.funnel.page_views * 100)
                        : 0}%`
                    }}
                  />
                </div>
                <div className="w-16 text-sm font-semibold text-gray-700">
                  {funnelStats.funnel.download_clicks.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-24 text-xs text-gray-500 text-right">Installs</div>
                <div className="flex-grow bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-teal-500 h-6 rounded-full transition-all"
                    style={{
                      width: `${funnelStats.funnel.page_views > 0
                        ? (funnelStats.funnel.app_opens / funnelStats.funnel.page_views * 100)
                        : 0}%`
                    }}
                  />
                </div>
                <div className="w-16 text-sm font-semibold text-gray-700">
                  {funnelStats.funnel.app_opens.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-24 text-xs text-gray-500 text-right">Attributed</div>
                <div className="flex-grow bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-purple-500 h-6 rounded-full transition-all"
                    style={{
                      width: `${funnelStats.funnel.page_views > 0
                        ? (funnelStats.funnel.attributions / funnelStats.funnel.page_views * 100)
                        : 0}%`
                    }}
                  />
                </div>
                <div className="w-16 text-sm font-semibold text-gray-700">
                  {funnelStats.funnel.attributions.toLocaleString()}
                </div>
              </div>
            </div>

            {/* By Source Table */}
            {funnelStats.by_source.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">By Source</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Clicks</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Installs</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Attributed</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {funnelStats.by_source.map((source) => (
                        <tr key={source.source}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {source.source}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">
                            {source.page_views.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">
                            {source.download_clicks.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">
                            {source.app_opens.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-purple-600 font-semibold text-right">
                            {source.attributions.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 text-right">
                            {source.click_rate.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* By Campaign Table */}
            {funnelStats.by_campaign.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">By Campaign</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Clicks</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Installs</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Attributed</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {funnelStats.by_campaign.map((campaign) => (
                        <tr key={campaign.campaign_id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {campaign.campaign_id || 'Unknown'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">
                            {campaign.page_views.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">
                            {campaign.download_clicks.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">
                            {campaign.app_opens.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-purple-600 font-semibold text-right">
                            {campaign.attributions.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 text-right">
                            {campaign.click_rate.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attribution Stats */}
        {stats && (
          <>
            {/* Overview Cards */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-gray-500 mb-2">Total Users</div>
                  <div className="text-4xl font-bold text-blue-600">
                    {stats.total_users.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Registered app users
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-gray-500 mb-2">Organic Users</div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-4xl font-bold text-green-600">
                      {stats.organic_users.toLocaleString()}
                    </div>
                    <span className="text-lg px-3 py-1 bg-green-100 text-green-700 rounded font-semibold">
                      {stats.organic_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Natural growth & referrals
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-gray-500 mb-2">Paid Ad Users</div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-4xl font-bold text-purple-600">
                      {stats.paid_ad_users.toLocaleString()}
                    </div>
                    <span className="text-lg px-3 py-1 bg-purple-100 text-purple-700 rounded font-semibold">
                      {stats.paid_ad_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Campaign attributed users
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-gray-500 mb-2">Match Rate</div>
                  <div className="text-4xl font-bold text-teal-600 mb-2">
                    {stats.match_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {stats.matched_fingerprints} / {stats.total_fingerprints} fingerprints matched
                  </div>
                </div>
              </div>
            </div>

            {/* User Source Distribution */}
            <div className="mb-8 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-6">User Source Distribution</h3>

              {/* Progress Bars */}
              <div className="space-y-6 mb-8">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Organic Users</span>
                    <span className="text-sm font-medium text-green-600">
                      {stats.organic_users.toLocaleString()} ({stats.organic_percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-6 w-full">
                    <div
                      className="bg-green-600 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${stats.organic_percentage}%` }}
                    >
                      {stats.organic_percentage > 10 && (
                        <span className="text-xs text-white font-semibold">
                          {stats.organic_percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Paid Ad Users</span>
                    <span className="text-sm font-medium text-purple-600">
                      {stats.paid_ad_users.toLocaleString()} ({stats.paid_ad_percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-6 w-full">
                    <div
                      className="bg-purple-600 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${stats.paid_ad_percentage}%` }}
                    >
                      {stats.paid_ad_percentage > 10 && (
                        <span className="text-xs text-white font-semibold">
                          {stats.paid_ad_percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid Ad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Users
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        {stats.organic_users.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">
                        {stats.paid_ad_users.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {stats.total_users.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Total Credits
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        {stats.organic_total_credits.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">
                        {stats.paid_ad_total_credits.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {(stats.organic_total_credits + stats.paid_ad_total_credits).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Avg Credits per User
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {stats.organic_users > 0
                          ? (stats.organic_total_credits / stats.organic_users).toFixed(1)
                          : '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                        {stats.paid_ad_users > 0
                          ? (stats.paid_ad_total_credits / stats.paid_ad_users).toFixed(1)
                          : '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stats.total_users > 0
                          ? ((stats.organic_total_credits + stats.paid_ad_total_credits) / stats.total_users).toFixed(1)
                          : '0'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fingerprint Conversion Funnel */}
            <div className="mb-8 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-6">Fingerprint Conversion Funnel</h3>

              <div className="space-y-6">
                {/* Total Fingerprints */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-48 text-right">
                    <div className="text-sm text-gray-600">Total Fingerprints</div>
                  </div>
                  <div className="flex-grow">
                    <div className="bg-blue-100 rounded-lg p-4 inline-block min-w-[200px]">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.total_fingerprints.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-500">Device visits</div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-48"></div>
                  <div className="text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <div className="text-xs font-medium mt-1">
                      {stats.match_rate.toFixed(1)}% match rate
                    </div>
                  </div>
                </div>

                {/* Matched Fingerprints */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-48 text-right">
                    <div className="text-sm text-gray-600">Matched Fingerprints</div>
                  </div>
                  <div className="flex-grow">
                    <div className="bg-teal-100 rounded-lg p-4 inline-block min-w-[200px]">
                      <div className="text-2xl font-bold text-teal-600">
                        {stats.matched_fingerprints.toLocaleString()}
                      </div>
                      <div className="text-xs text-teal-500">Attributed to users</div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-48"></div>
                  <div className="text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <div className="text-xs font-medium mt-1">
                      {stats.credit_grant_rate.toFixed(1)}% grant rate
                    </div>
                  </div>
                </div>

                {/* Trial Credits Granted */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-48 text-right">
                    <div className="text-sm text-gray-600">Trial Credits Granted</div>
                  </div>
                  <div className="flex-grow">
                    <div className="bg-orange-100 rounded-lg p-4 inline-block min-w-[200px]">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.trial_credits_granted.toLocaleString()}
                      </div>
                      <div className="text-xs text-orange-500">One-time trial credits</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-6">Credit Distribution</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-3">Organic Users</div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {stats.organic_total_credits.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total credits ({stats.organic_users.toLocaleString()} users)
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="text-2xl font-semibold text-green-700">
                        {stats.organic_users > 0
                          ? (stats.organic_total_credits / stats.organic_users).toFixed(1)
                          : '0'}
                      </div>
                      <div className="text-xs text-gray-500">Credits per user (avg)</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-3">Paid Ad Users</div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {stats.paid_ad_total_credits.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total credits ({stats.paid_ad_users.toLocaleString()} users)
                    </div>
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <div className="text-2xl font-semibold text-purple-700">
                        {stats.paid_ad_users > 0
                          ? (stats.paid_ad_total_credits / stats.paid_ad_users).toFixed(1)
                          : '0'}
                      </div>
                      <div className="text-xs text-gray-500">Credits per user (avg)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
