import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getMatchingRules,
  getActiveMatchingRule,
  createMatchingRule,
  activateMatchingRule,
  testMatchingRule,
  clearAuth,
  getAuth
} from '../services/api';
import type { MatchingRuleConfig, CreateMatchingRuleRequest, TestMatchingRuleResponse } from '../types/attribution';

export default function MatchingRules() {
  const [rules, setRules] = useState<MatchingRuleConfig[]>([]);
  const [activeRule, setActiveRule] = useState<MatchingRuleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  // Form state for new/edit rule
  const [formData, setFormData] = useState<CreateMatchingRuleRequest>({
    threshold: 50,
    device_model_score: 30,
    screen_score: 25,
    timezone_score: 20,
    language_score: 15,
    country_score: 10,
    screen_tolerance: 5,
    description: '',
  });

  // Test state
  const [testData, setTestData] = useState({
    device_model: 'iPhone17,5',
    screen_width: 1170,
    screen_height: 2532,
    timezone: 'Asia/Shanghai',
    language: 'en',
    country: 'CN',
  });
  const [testResult, setTestResult] = useState<TestMatchingRuleResponse | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      navigate('/');
      return;
    }
    setUserEmail(auth.user.email);
    loadRules(auth.token);
  }, [navigate]);

  const loadRules = async (token: string) => {
    try {
      setLoading(true);
      const [rulesData, activeRuleData] = await Promise.all([
        getMatchingRules(token),
        getActiveMatchingRule(token),
      ]);
      setRules(rulesData);
      setActiveRule(activeRuleData);

      // If there's an active rule, populate form with its values
      if (activeRuleData) {
        setFormData({
          threshold: activeRuleData.threshold,
          device_model_score: activeRuleData.device_model_score,
          screen_score: activeRuleData.screen_score,
          timezone_score: activeRuleData.timezone_score,
          language_score: activeRuleData.language_score,
          country_score: activeRuleData.country_score,
          screen_tolerance: activeRuleData.screen_tolerance,
          description: activeRuleData.description || '',
        });
      }
    } catch (err) {
      setError('Failed to load matching rules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const handleSaveRule = async () => {
    const auth = getAuth();
    if (!auth) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Create new rule
      const newRule = await createMatchingRule(auth.token, formData);

      // Activate it
      await activateMatchingRule(auth.token, newRule.id);

      setSuccess('Rule saved and activated successfully!');

      // Reload rules
      await loadRules(auth.token);
    } catch (err) {
      setError('Failed to save rule');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleActivateRule = async (ruleId: string) => {
    const auth = getAuth();
    if (!auth) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await activateMatchingRule(auth.token, ruleId);
      setSuccess('Rule activated successfully!');

      // Reload rules
      await loadRules(auth.token);
    } catch (err) {
      setError('Failed to activate rule');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestRule = async () => {
    const auth = getAuth();
    if (!auth) return;

    try {
      setTesting(true);
      setTestResult(null);

      const result = await testMatchingRule(auth.token, {
        rule: formData,
        data: testData,
      });

      setTestResult(result);
    } catch (err) {
      setError('Failed to test rule');
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  const totalScore = formData.device_model_score + formData.screen_score +
    formData.timezone_score + formData.language_score + formData.country_score;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900">Matching Rules</h1>
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
              <Link to="/attribution" className="text-gray-600 hover:text-gray-900">
                Attribution
              </Link>
              <Link to="/matching-rules" className="text-blue-600 font-medium">
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
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Attribution Matching Rules</h2>
          <p className="text-gray-600 mt-1">Configure scoring weights for fingerprint matching</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Current Rule & Editor */}
            <div className="space-y-6">
              {/* Current Active Rule */}
              {activeRule && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Current Active Rule</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Threshold:</span>
                      <span className="ml-2 font-semibold">{activeRule.threshold} points</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Screen Tolerance:</span>
                      <span className="ml-2 font-semibold">{activeRule.screen_tolerance}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Device Model:</span>
                      <span className="ml-2 font-semibold">{activeRule.device_model_score} pts</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Screen:</span>
                      <span className="ml-2 font-semibold">{activeRule.screen_score} pts</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Timezone:</span>
                      <span className="ml-2 font-semibold">{activeRule.timezone_score} pts</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Language:</span>
                      <span className="ml-2 font-semibold">{activeRule.language_score} pts</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Country:</span>
                      <span className="ml-2 font-semibold">{activeRule.country_score} pts</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Max Score:</span>
                      <span className="ml-2 font-semibold">
                        {activeRule.device_model_score + activeRule.screen_score +
                         activeRule.timezone_score + activeRule.language_score + activeRule.country_score} pts
                      </span>
                    </div>
                  </div>
                  {activeRule.description && (
                    <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                      {activeRule.description}
                    </div>
                  )}
                </div>
              )}

              {/* Rule Editor */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Edit Matching Rule</h3>

                <div className="space-y-6">
                  {/* Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Threshold: {formData.threshold} points
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0 (Easy)</span>
                      <span>100 (Strict)</span>
                    </div>
                  </div>

                  {/* Device Model Score */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Device Model Score: {formData.device_model_score} points
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={formData.device_model_score}
                      onChange={(e) => setFormData({ ...formData, device_model_score: parseInt(e.target.value) })}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Screen Score */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Screen Resolution Score: {formData.screen_score} points
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={formData.screen_score}
                      onChange={(e) => setFormData({ ...formData, screen_score: parseInt(e.target.value) })}
                      className="w-full h-2 bg-cyan-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Screen Tolerance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Screen Tolerance: {formData.screen_tolerance}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={formData.screen_tolerance}
                      onChange={(e) => setFormData({ ...formData, screen_tolerance: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Timezone Score */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone Score: {formData.timezone_score} points
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={formData.timezone_score}
                      onChange={(e) => setFormData({ ...formData, timezone_score: parseInt(e.target.value) })}
                      className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Language Score */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language Score: {formData.language_score} points
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={formData.language_score}
                      onChange={(e) => setFormData({ ...formData, language_score: parseInt(e.target.value) })}
                      className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Country Score */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country Score: {formData.country_score} points
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={formData.country_score}
                      onChange={(e) => setFormData({ ...formData, country_score: parseInt(e.target.value) })}
                      className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g., Stricter matching for iOS"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Maximum Possible Score:</span>
                      <span className="text-xl font-bold text-blue-600">{totalScore} points</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-medium">Threshold:</span>
                      <span className="text-xl font-bold text-green-600">{formData.threshold} points</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {formData.threshold <= totalScore
                        ? `Matching requires at least ${Math.ceil(formData.threshold / totalScore * 100)}% of max score`
                        : <span className="text-red-600">Warning: Threshold exceeds max possible score!</span>
                      }
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveRule}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {saving ? 'Saving...' : 'Save & Activate Rule'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Test Tool & History */}
            <div className="space-y-6">
              {/* Test Tool */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Test Rule</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter device fingerprint data to test how the current rule would score it.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Device Model
                    </label>
                    <input
                      type="text"
                      value={testData.device_model}
                      onChange={(e) => setTestData({ ...testData, device_model: e.target.value })}
                      placeholder="e.g., iPhone17,5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Screen Width
                      </label>
                      <input
                        type="number"
                        value={testData.screen_width}
                        onChange={(e) => setTestData({ ...testData, screen_width: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Screen Height
                      </label>
                      <input
                        type="number"
                        value={testData.screen_height}
                        onChange={(e) => setTestData({ ...testData, screen_height: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={testData.timezone}
                      onChange={(e) => setTestData({ ...testData, timezone: e.target.value })}
                      placeholder="e.g., Asia/Shanghai"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Language
                      </label>
                      <input
                        type="text"
                        value={testData.language}
                        onChange={(e) => setTestData({ ...testData, language: e.target.value })}
                        placeholder="e.g., en"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={testData.country}
                        onChange={(e) => setTestData({ ...testData, country: e.target.value })}
                        placeholder="e.g., CN"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleTestRule}
                    disabled={testing}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                  >
                    {testing ? 'Testing...' : 'Calculate Score'}
                  </button>

                  {/* Test Result */}
                  {testResult && (
                    <div className={`mt-4 p-4 rounded-lg ${testResult.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-semibold">
                          Score: {testResult.score} / {totalScore}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${testResult.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {testResult.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Device Model:</span>
                          <span className="font-medium">{testResult.breakdown.device_model} pts</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Screen:</span>
                          <span className="font-medium">{testResult.breakdown.screen} pts</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Timezone:</span>
                          <span className="font-medium">{testResult.breakdown.timezone} pts</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Language:</span>
                          <span className="font-medium">{testResult.breakdown.language} pts</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Country:</span>
                          <span className="font-medium">{testResult.breakdown.country} pts</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Historical Rules */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Rule History</h3>

                {rules.length === 0 ? (
                  <p className="text-gray-500 text-sm">No rules created yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rules.map((rule) => (
                          <tr key={rule.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                              {new Date(rule.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {rule.threshold} pts
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {rule.is_active ? (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {!rule.is_active && (
                                <button
                                  onClick={() => handleActivateRule(rule.id)}
                                  disabled={saving}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Activate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
