import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertApi, getAuth, clearAuth } from '../services/api';
import type { JobAlert, AlertStatus, AlertListParams } from '../types/job';

export default function AlertList() {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<AlertStatus | ''>('pending');
  const [userEmail, setUserEmail] = useState('');
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedAlertForTicket, setSelectedAlertForTicket] = useState<JobAlert | null>(null);
  const [notes, setNotes] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      navigate('/');
      return;
    }
    setUserEmail(auth.user.email);
  }, [navigate]);

  useEffect(() => {
    loadAlerts();
  }, [page, statusFilter]);

  const loadAlerts = async () => {
    const auth = getAuth();
    if (!auth) return;

    try {
      setLoading(true);
      const api = new AlertApi(auth.token);
      const params: AlertListParams = {
        page,
        page_size: pageSize,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const data = await api.listAlerts(params);
      setAlerts(data.alerts || []);
      setTotal(data.total);
    } catch (err) {
      setError('Failed to load alerts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const handleSelectAll = () => {
    if (selectedAlerts.size === alerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(alerts.map(a => a.id)));
    }
  };

  const handleSelectAlert = (id: string) => {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAlerts(newSelected);
  };

  const handleBatchAcknowledge = async () => {
    const auth = getAuth();
    if (!auth || selectedAlerts.size === 0) return;

    try {
      const api = new AlertApi(auth.token);
      await api.acknowledgeBatch(Array.from(selectedAlerts), notes);
      setShowAcknowledgeModal(false);
      setNotes('');
      setSelectedAlerts(new Set());
      loadAlerts();
    } catch (err) {
      setError('Failed to acknowledge alerts');
      console.error(err);
    }
  };

  const handleAcknowledgeSingle = async (id: string) => {
    const auth = getAuth();
    if (!auth) return;

    try {
      const api = new AlertApi(auth.token);
      await api.acknowledgeAlert(id, notes);
      setShowAcknowledgeModal(false);
      setNotes('');
      loadAlerts();
    } catch (err) {
      setError('Failed to acknowledge alert');
      console.error(err);
    }
  };

  const handleCreateTicket = async () => {
    const auth = getAuth();
    if (!auth || !selectedAlertForTicket) return;

    try {
      const api = new AlertApi(auth.token);
      await api.createTicket(selectedAlertForTicket.id, ticketId, ticketUrl, notes);
      setShowTicketModal(false);
      setSelectedAlertForTicket(null);
      setTicketId('');
      setTicketUrl('');
      setNotes('');
      loadAlerts();
    } catch (err) {
      setError('Failed to create ticket');
      console.error(err);
    }
  };

  const openTicketModal = (alert: JobAlert) => {
    setSelectedAlertForTicket(alert);
    setShowTicketModal(true);
  };

  const getStatusBadge = (status: AlertStatus) => {
    const styles: Record<AlertStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      acknowledged: 'bg-green-100 text-green-800',
      ticketed: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
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
              <Link to="/alerts" className="text-blue-600 font-medium">
                Alerts
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
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">x</button>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as AlertStatus | '');
                setPage(1);
              }}
              className="border rounded px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="ticketed">Ticketed</option>
            </select>
            <span className="text-sm text-gray-500">
              Total: {total} alerts
            </span>
          </div>

          {selectedAlerts.size > 0 && statusFilter === 'pending' && (
            <button
              onClick={() => setShowAcknowledgeModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Acknowledge Selected ({selectedAlerts.size})
            </button>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Alerts Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {statusFilter === 'pending' && (
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedAlerts.size === alerts.length && alerts.length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error Message</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50">
                      {statusFilter === 'pending' && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedAlerts.has(alert.id)}
                            onChange={() => handleSelectAlert(alert.id)}
                            className="rounded"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <Link
                          to={`/jobs?search=${alert.job_id}`}
                          className="text-blue-600 hover:underline font-mono text-sm"
                        >
                          {alert.job_id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(alert.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {alert.job?.error_message || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(alert.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {alert.admin_notes || '-'}
                        {alert.ticket_id && (
                          <a
                            href={alert.ticket_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:underline"
                          >
                            [{alert.ticket_id}]
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {alert.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedAlerts(new Set([alert.id]));
                                setShowAcknowledgeModal(true);
                              }}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Acknowledge
                            </button>
                            <button
                              onClick={() => openTicketModal(alert)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Create Ticket
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {alerts.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  No alerts found
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Acknowledge Modal */}
      {showAcknowledgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Acknowledge {selectedAlerts.size > 1 ? `${selectedAlerts.size} Alerts` : 'Alert'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded px-3 py-2 h-24"
                placeholder="Add notes about why you're acknowledging this alert..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAcknowledgeModal(false);
                  setNotes('');
                  setSelectedAlerts(new Set());
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={selectedAlerts.size > 1 ? handleBatchAcknowledge : () => handleAcknowledgeSingle(Array.from(selectedAlerts)[0])}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicketModal && selectedAlertForTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Ticket</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket ID *
              </label>
              <input
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., PROJ-123"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket URL (optional)
              </label>
              <input
                type="text"
                value={ticketUrl}
                onChange={(e) => setTicketUrl(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., https://..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded px-3 py-2 h-24"
                placeholder="Add notes..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTicketModal(false);
                  setSelectedAlertForTicket(null);
                  setTicketId('');
                  setTicketUrl('');
                  setNotes('');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={!ticketId}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
