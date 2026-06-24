import React, { useCallback, useEffect, useState } from 'react';
import { FiGitBranch, FiRefreshCw } from 'react-icons/fi';
import ModulePageLayout from './ModulePageLayout';
import {
  assignDepartmentManager,
  assignDesignationToEmployee,
  fetchDesignationHierarchy,
  fetchEmployeesForSelect,
  fetchOrgChart,
  toErrorMessage,
} from '../../../services/operationsModulesApi';
import { fetchDepartments as fetchDeptList } from '../../../services/adminOperationsApi';
const TreeNode = ({ node }) => {
  if (!node) return null;

  const label =
    node.name ||
    node.title ||
    node.designation ||
    node.employeeName ||
    'Unknown';

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3 min-w-[180px] text-center">
        <div className="font-medium text-slate-800">{label}</div>

        {node.department && (
          <div className="text-xs text-slate-500 mt-1">
            {node.department}
          </div>
        )}

        {node.email && (
          <div className="text-xs text-slate-400 mt-1">
            {node.email}
          </div>
        )}
      </div>

      {node.children?.length > 0 && (
        <>
          <div className="w-px h-6 bg-slate-300" />

          <div className="flex flex-wrap justify-center gap-8 relative">
            {node.children.map((child, index) => (
              <TreeNode
                key={child._id || child.id || index}
                node={child}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const OrgStructurePage = () => {
  const [hierarchy, setHierarchy] = useState(null);
  const [orgChart, setOrgChart] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [assignDept, setAssignDept] = useState({ departmentId: '', managerId: '' });
  const [assignDes, setAssignDes] = useState({ designationId: '', employeeId: '' });
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, o, d, e] = await Promise.all([
        fetchDesignationHierarchy(),
        fetchOrgChart(),
        fetchDeptList(),
        fetchEmployeesForSelect(),
      ]);
      setHierarchy(h);
      setOrgChart(o);
      setDepartments(d);
      setEmployees(e);
      setDesignations(Array.isArray(h?.designations) ? h.designations : h?.tree || []);
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);
  console.log(orgChart);

  useEffect(() => {
    load();
  }, [load]);

  const renderNode = (node, depth = 0) => {
    if (!node) return null;
    const label = node.name || node.title || node.designation || JSON.stringify(node).slice(0, 40);
    return (
      <div key={`${label}-${depth}`} style={{ marginLeft: depth * 16 }} className="py-1 text-sm text-slate-700">
        • {label}
        {Array.isArray(node.children) && node.children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  const handleAssignManager = async (e) => {
    e.preventDefault();
    try {
      await assignDepartmentManager(assignDept.departmentId, assignDept.managerId);
      setBanner({ type: 'success', text: 'Department manager assigned.' });
      await load();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    }
  };

  const handleAssignDesignation = async (e) => {
    e.preventDefault();
    try {
      await assignDesignationToEmployee(assignDes.designationId, assignDes.employeeId);
      setBanner({ type: 'success', text: 'Designation assigned to employee.' });
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    }
  };

  const flatDesignations = Array.isArray(hierarchy)
    ? hierarchy
    : hierarchy?.designations || hierarchy?.data || [];

  return (
    <ModulePageLayout
      title="Organization structure"
      subtitle="Designation hierarchy, org chart, and assignments"
      icon={FiGitBranch}
      actions={
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm">
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      }
    >
      {banner.text ? (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${banner.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
          {banner.text}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <form onSubmit={handleAssignManager} className="bg-white rounded-xl border p-6 space-y-3">
          <h2 className="font-semibold text-slate-800">Assign department manager</h2>
          <select required className="w-full border rounded-lg px-3 py-2 text-sm" value={assignDept.departmentId} onChange={(e) => setAssignDept((p) => ({ ...p, departmentId: e.target.value }))}>
            <option value="">Department</option>
            {departments.map((d) => (
              <option key={d._id || d.id} value={d._id || d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select required className="w-full border rounded-lg px-3 py-2 text-sm" value={assignDept.managerId} onChange={(e) => setAssignDept((p) => ({ ...p, managerId: e.target.value }))}>
            <option value="">Manager (employee)</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {[e.firstName, e.lastName].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            Assign manager
          </button>
        </form>

        <form onSubmit={handleAssignDesignation} className="bg-white rounded-xl border p-6 space-y-3">
          <h2 className="font-semibold text-slate-800">Assign designation to employee</h2>
          <select required className="w-full border rounded-lg px-3 py-2 text-sm" value={assignDes.designationId} onChange={(e) => setAssignDes((p) => ({ ...p, designationId: e.target.value }))}>
            <option value="">Designation</option>
            {(flatDesignations.length ? flatDesignations : designations).map((d) => (
              <option key={d._id || d.id} value={d._id || d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select required className="w-full border rounded-lg px-3 py-2 text-sm" value={assignDes.employeeId} onChange={(e) => setAssignDes((p) => ({ ...p, employeeId: e.target.value }))}>
            <option value="">Employee</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {[e.firstName, e.lastName].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>
          <button type="submit" className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-medium">
            Assign designation
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
  <h2 className="font-semibold mb-4">Designation hierarchy</h2>

  <div className="overflow-auto">
    <div className="min-w-max flex justify-center p-4">
      {hierarchy?.tree ? (
        <TreeNode node={hierarchy.tree} />
      ) : (
        <div className="text-slate-500">
          No hierarchy data available
        </div>
      )}
    </div>
  </div>
</div>
        <div className="bg-white rounded-xl border p-6">
  <h2 className="font-semibold mb-4">Org chart</h2>

  <div className="overflow-auto">
    <div className="min-w-max flex justify-center p-4">
      {orgChart ? (
        <TreeNode node={orgChart} />
      ) : (
        <div className="text-slate-500">
          No org chart data available
        </div>
      )}
    </div>
  </div>
  
</div>
      </div>
    </ModulePageLayout>
  );
};


export default OrgStructurePage;
