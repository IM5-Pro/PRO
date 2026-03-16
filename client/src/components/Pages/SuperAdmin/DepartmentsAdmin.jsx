import React, { useCallback, useEffect, useState } from 'react';
import { FiBriefcase, FiCheckCircle, FiPlus, FiRefreshCw, FiXCircle } from 'react-icons/fi';
import {
  createDepartment,
  deactivateDepartment,
  fetchDepartments,
  toErrorMessage,
} from '../../../services/adminOperationsApi';

const DepartmentsAdmin = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ name: '', code: '' });

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchDepartments();
      setDepartments(rows);
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to load departments') });
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setActionLoading('create');
    setBanner({ type: '', text: '' });

    try {
      await createDepartment({ name: form.name.trim(), code: form.code.trim() });
      setForm({ name: '', code: '' });
      setBanner({ type: 'success', text: 'Department created successfully.' });
      await loadDepartments();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to create department') });
    } finally {
      setActionLoading('');
    }
  };

  const handleDeactivate = async (departmentId) => {
    setActionLoading(`deactivate-${departmentId}`);
    setBanner({ type: '', text: '' });

    try {
      await deactivateDepartment(departmentId);
      setBanner({ type: 'success', text: 'Department marked inactive.' });
      await loadDepartments();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to update department') });
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FiBriefcase size={28} /> Department Administration
            </h1>
            <p className="text-slate-600 mt-1">Create, monitor, and deactivate departments</p>
          </div>
          <button
            onClick={loadDepartments}
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

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Create Department</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            required
            value={form.name}
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
            placeholder="Department name"
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={form.code}
            onChange={(event) => setForm((previous) => ({ ...previous, code: event.target.value }))}
            placeholder="Code (optional)"
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={actionLoading === 'create'}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <FiPlus size={14} /> Add Department
            </span>
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Departments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-3 text-slate-600">Name</th>
                <th className="text-left py-3 px-3 text-slate-600">Code</th>
                <th className="text-left py-3 px-3 text-slate-600">Status</th>
                <th className="text-left py-3 px-3 text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 px-3 text-center text-slate-500">Loading departments...</td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 px-3 text-center text-slate-500">No departments found</td>
                </tr>
              ) : (
                departments.map((department) => {
                  const departmentId = department?._id || department?.id;
                  return (
                    <tr key={departmentId} className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-800 font-medium">{department?.name || '-'}</td>
                      <td className="py-3 px-3 text-slate-700">{department?.code || '-'}</td>
                      <td className="py-3 px-3 text-slate-700">{department?.status || 'active'}</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleDeactivate(departmentId)}
                          disabled={actionLoading === `deactivate-${departmentId}` || department?.status === 'inactive'}
                          className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsAdmin;
