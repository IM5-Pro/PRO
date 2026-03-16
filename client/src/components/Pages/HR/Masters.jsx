import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiPlus, FiRefreshCw, FiSettings, FiTrash2, FiXCircle } from 'react-icons/fi';
import {
  createDepartment,
  createDesignation,
  createLeavePolicy,
  deactivateDepartment,
  deactivateDesignation,
  deleteLeavePolicy,
  fetchDepartments,
  fetchDesignations,
  fetchLeavePolicies,
  toErrorMessage,
} from '../../../services/adminOperationsApi';

const Masters = () => {
  const [activeSection, setActiveSection] = useState('departments');
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState('');

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [leavePolicies, setLeavePolicies] = useState([]);

  const [departmentForm, setDepartmentForm] = useState({ name: '', code: '' });
  const [designationForm, setDesignationForm] = useState({
    name: '',
    code: '',
    level: 1,
    department: '',
    minSalary: '',
    maxSalary: '',
    maxHeadcount: '',
  });
  const [policyForm, setPolicyForm] = useState({ name: '', code: '', totalDays: 0, reasonRequired: false });

  const loadMasters = useCallback(async () => {
    setLoading(true);
    try {
      const [departmentRows, designationRows, policyRows] = await Promise.all([
        fetchDepartments(),
        fetchDesignations(),
        fetchLeavePolicies(),
      ]);

      setDepartments(departmentRows);
      setDesignations(designationRows);
      setLeavePolicies(policyRows);
      setBanner({ type: '', text: '' });
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to load masters data') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMasters();
  }, [loadMasters]);

  const statusClass = useMemo(() => {
    return {
      success: 'bg-green-50 border-green-200 text-green-700',
      error: 'bg-red-50 border-red-200 text-red-700',
    };
  }, []);

  const updateForm = (setter, key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setter((previous) => ({ ...previous, [key]: value }));
  };

  const handleCreateDepartment = async (event) => {
    event.preventDefault();
    setActionLoading('create-department');
    setBanner({ type: '', text: '' });

    try {
      await createDepartment({
        name: departmentForm.name.trim(),
        code: departmentForm.code.trim(),
      });
      setBanner({ type: 'success', text: 'Department created successfully.' });
      setDepartmentForm({ name: '', code: '' });
      await loadMasters();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to create department') });
    } finally {
      setActionLoading('');
    }
  };

  const handleCreateDesignation = async (event) => {
    event.preventDefault();
    setActionLoading('create-designation');
    setBanner({ type: '', text: '' });

    try {
      await createDesignation({
        name: designationForm.name.trim(),
        code: designationForm.code.trim(),
        level: Number(designationForm.level),
        department: designationForm.department || undefined,
        minSalary: designationForm.minSalary ? Number(designationForm.minSalary) : undefined,
        maxSalary: designationForm.maxSalary ? Number(designationForm.maxSalary) : undefined,
        maxHeadcount: designationForm.maxHeadcount ? Number(designationForm.maxHeadcount) : undefined,
      });

      setBanner({ type: 'success', text: 'Designation created successfully.' });
      setDesignationForm({
        name: '',
        code: '',
        level: 1,
        department: '',
        minSalary: '',
        maxSalary: '',
        maxHeadcount: '',
      });
      await loadMasters();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to create designation') });
    } finally {
      setActionLoading('');
    }
  };

  const handleCreatePolicy = async (event) => {
    event.preventDefault();
    setActionLoading('create-policy');
    setBanner({ type: '', text: '' });

    try {
      await createLeavePolicy({
        name: policyForm.name.trim(),
        code: policyForm.code.trim(),
        totalDays: Number(policyForm.totalDays),
        reasonRequired: policyForm.reasonRequired,
      });

      setBanner({ type: 'success', text: 'Leave policy created successfully.' });
      setPolicyForm({ name: '', code: '', totalDays: 0, reasonRequired: false });
      await loadMasters();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to create leave policy') });
    } finally {
      setActionLoading('');
    }
  };

  const handleDeactivateDepartment = async (departmentId) => {
    setActionLoading(`department-${departmentId}`);
    setBanner({ type: '', text: '' });
    try {
      await deactivateDepartment(departmentId);
      setBanner({ type: 'success', text: 'Department marked inactive.' });
      await loadMasters();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to update department') });
    } finally {
      setActionLoading('');
    }
  };

  const handleDeactivateDesignation = async (designationId) => {
    setActionLoading(`designation-${designationId}`);
    setBanner({ type: '', text: '' });
    try {
      await deactivateDesignation(designationId);
      setBanner({ type: 'success', text: 'Designation marked inactive.' });
      await loadMasters();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to update designation') });
    } finally {
      setActionLoading('');
    }
  };

  const handleDeletePolicy = async (policyId) => {
    setActionLoading(`policy-${policyId}`);
    setBanner({ type: '', text: '' });
    try {
      await deleteLeavePolicy(policyId);
      setBanner({ type: 'success', text: 'Leave policy deleted successfully.' });
      await loadMasters();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to delete leave policy') });
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FiSettings size={30} /> Masters Configuration
            </h1>
            <p className="text-slate-600 mt-1">Manage departments, designations, and leave policies</p>
          </div>
          <button
            onClick={loadMasters}
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
        <div className={`mb-6 rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${statusClass[banner.type] || statusClass.error}`}>
          {banner.type === 'success' ? <FiCheckCircle size={16} /> : <FiXCircle size={16} />}
          {banner.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl mb-6 p-2 flex gap-2 overflow-x-auto">
        {['departments', 'designations', 'policies'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSection === section
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      {activeSection === 'departments' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Departments</h2>
          <form onSubmit={handleCreateDepartment} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <input required value={departmentForm.name} onChange={updateForm(setDepartmentForm, 'name')} placeholder="Department name" className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={departmentForm.code} onChange={updateForm(setDepartmentForm, 'code')} placeholder="Code (optional)" className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={actionLoading === 'create-department'} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50">
              <span className="inline-flex items-center gap-2">
                <FiPlus size={14} /> Add Department
              </span>
            </button>
          </form>

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
                {departments.map((department) => (
                  <tr key={department?._id || department?.id} className="border-b border-slate-100">
                    <td className="py-3 px-3 text-slate-800 font-medium">{department?.name || '-'}</td>
                    <td className="py-3 px-3 text-slate-700">{department?.code || '-'}</td>
                    <td className="py-3 px-3 text-slate-700">{department?.status || 'active'}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleDeactivateDepartment(department?._id || department?.id)}
                        disabled={actionLoading === `department-${department?._id || department?.id}` || department?.status === 'inactive'}
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'designations' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Designations</h2>
          <form onSubmit={handleCreateDesignation} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <input required value={designationForm.name} onChange={updateForm(setDesignationForm, 'name')} placeholder="Designation name" className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={designationForm.code} onChange={updateForm(setDesignationForm, 'code')} placeholder="Code (optional)" className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" min="1" max="10" value={designationForm.level} onChange={updateForm(setDesignationForm, 'level')} placeholder="Level (1-10)" className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={designationForm.department} onChange={updateForm(setDesignationForm, 'department')} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Department (optional)</option>
              {departments.map((department) => (
                <option key={department?._id || department?.id} value={department?._id || department?.id}>
                  {department?.name}
                </option>
              ))}
            </select>
            <input type="number" min="0" value={designationForm.minSalary} onChange={updateForm(setDesignationForm, 'minSalary')} placeholder="Min salary" className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" min="0" value={designationForm.maxSalary} onChange={updateForm(setDesignationForm, 'maxSalary')} placeholder="Max salary" className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" min="0" value={designationForm.maxHeadcount} onChange={updateForm(setDesignationForm, 'maxHeadcount')} placeholder="Max headcount" className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={actionLoading === 'create-designation'} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50">
              <span className="inline-flex items-center gap-2">
                <FiPlus size={14} /> Add Designation
              </span>
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-3 text-slate-600">Name</th>
                  <th className="text-left py-3 px-3 text-slate-600">Code</th>
                  <th className="text-left py-3 px-3 text-slate-600">Level</th>
                  <th className="text-left py-3 px-3 text-slate-600">Department</th>
                  <th className="text-left py-3 px-3 text-slate-600">Status</th>
                  <th className="text-left py-3 px-3 text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {designations.map((designation) => (
                  <tr key={designation?._id || designation?.id} className="border-b border-slate-100">
                    <td className="py-3 px-3 text-slate-800 font-medium">{designation?.name || '-'}</td>
                    <td className="py-3 px-3 text-slate-700">{designation?.code || '-'}</td>
                    <td className="py-3 px-3 text-slate-700">{designation?.level || '-'}</td>
                    <td className="py-3 px-3 text-slate-700">{designation?.department?.name || '-'}</td>
                    <td className="py-3 px-3 text-slate-700">{designation?.isActive === false ? 'inactive' : 'active'}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleDeactivateDesignation(designation?._id || designation?.id)}
                        disabled={actionLoading === `designation-${designation?._id || designation?.id}` || designation?.isActive === false}
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'policies' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Leave Policies</h2>
          <form onSubmit={handleCreatePolicy} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <input required value={policyForm.name} onChange={updateForm(setPolicyForm, 'name')} placeholder="Policy name" className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={policyForm.code} onChange={updateForm(setPolicyForm, 'code')} placeholder="Policy code" className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" min="0" step="0.5" value={policyForm.totalDays} onChange={updateForm(setPolicyForm, 'totalDays')} placeholder="Total days" className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 px-3 py-2 border border-slate-300 rounded-lg">
              <input type="checkbox" checked={policyForm.reasonRequired} onChange={updateForm(setPolicyForm, 'reasonRequired')} />
              Reason required
            </label>
            <button type="submit" disabled={actionLoading === 'create-policy'} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 md:col-span-1">
              <span className="inline-flex items-center gap-2">
                <FiPlus size={14} /> Add Policy
              </span>
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-3 text-slate-600">Name</th>
                  <th className="text-left py-3 px-3 text-slate-600">Code</th>
                  <th className="text-left py-3 px-3 text-slate-600">Total Days</th>
                  <th className="text-left py-3 px-3 text-slate-600">Reason Required</th>
                  <th className="text-left py-3 px-3 text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {leavePolicies.map((policy) => (
                  <tr key={policy?._id || policy?.id} className="border-b border-slate-100">
                    <td className="py-3 px-3 text-slate-800 font-medium">{policy?.name || '-'}</td>
                    <td className="py-3 px-3 text-slate-700">{policy?.code || '-'}</td>
                    <td className="py-3 px-3 text-slate-700">{policy?.totalDays ?? '-'}</td>
                    <td className="py-3 px-3 text-slate-700">{policy?.reasonRequired ? 'Yes' : 'No'}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleDeletePolicy(policy?._id || policy?.id)}
                        disabled={actionLoading === `policy-${policy?._id || policy?.id}`}
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        <span className="inline-flex items-center gap-1">
                          <FiTrash2 size={12} /> Delete
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Masters;
