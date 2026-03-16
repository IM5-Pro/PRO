import React, { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiFileText, FiRefreshCw, FiSearch, FiXCircle } from 'react-icons/fi';
import { fetchAuditLogs, toErrorMessage } from '../../../services/adminOperationsApi';

const AuditLogsAdmin = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 25 });
  const [banner, setBanner] = useState({ type: '', text: '' });

  const loadLogs = useCallback(async (page = 1, query = '') => {
    setLoading(true);
    try {
      const result = await fetchAuditLogs({ page, limit: 25, search: query });
      setLogs(result.logs || []);
      setPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: 25 });
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to load audit logs') });
      setLogs([]);
      setPagination({ page: 1, pages: 1, total: 0, limit: 25 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs(currentPage, searchQuery);
  }, [currentPage, loadLogs, searchQuery]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setCurrentPage(1);
    loadLogs(1, searchQuery);
  };

  const handleRefresh = () => {
    setBanner({ type: '', text: '' });
    loadLogs(currentPage, searchQuery);
  };

  const formatUser = (log) => {
    const user = log?.userId;
    if (!user) {
      return 'System';
    }

    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    return fullName || user?.email || String(user?._id || user?.id || 'Unknown');
  };

  const formatTimestamp = (value) => {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FiFileText size={28} /> Audit Logs
            </h1>
            <p className="text-slate-600 mt-1">Track system and governance activity trails across modules</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <FiRefreshCw size={15} /> Refresh
            </span>
          </button>
        </div>
      </div>

      {banner.text && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm inline-flex items-center gap-2 ${
            banner.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {banner.type === 'success' ? <FiCheckCircle size={16} /> : <FiXCircle size={16} />}
          {banner.text}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Audit Event Stream</h2>
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search action, entity, description"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-3 text-slate-600">Timestamp</th>
                <th className="text-left py-3 px-3 text-slate-600">User</th>
                <th className="text-left py-3 px-3 text-slate-600">Description</th>
                <th className="text-left py-3 px-3 text-slate-600">Entity</th>
                <th className="text-left py-3 px-3 text-slate-600">Entity ID</th>
                <th className="text-left py-3 px-3 text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 px-3 text-center text-slate-500">Loading audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 px-3 text-center text-slate-500">No audit logs found</td>
                </tr>
              ) : (
                logs.map((log) => {
                  const logId = log?._id || log?.id || 'unknown';
                  return (
                    <tr key={logId} className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">{formatTimestamp(log?.createdAt || log?.timestamp)}</td>
                      <td className="py-3 px-3 text-slate-700">{formatUser(log)}</td>
                      <td className="py-3 px-3 text-slate-800 font-medium">{log?.action || '-'}</td>
                      <td className="py-3 px-3 text-slate-700">{log?.entity || log?.entityType || '-'}</td>
                      <td className="py-3 px-3 text-slate-700 font-mono text-xs">{log?.entityId || '-'}</td>
                      <td className="py-3 px-3 text-slate-700">{log?.description || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <p>Total logs: {pagination.total || logs.length}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
              disabled={loading || currentPage <= 1}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} / {pagination.pages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((previous) => Math.min(pagination.pages || 1, previous + 1))}
              disabled={loading || currentPage >= (pagination.pages || 1)}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsAdmin;
