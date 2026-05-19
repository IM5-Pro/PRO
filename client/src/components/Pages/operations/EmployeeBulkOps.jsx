import React, { useState } from 'react';
import { FiUpload, FiUsers } from 'react-icons/fi';
import ModulePageLayout from './ModulePageLayout';
import {
  bulkImportEmployees,
  fetchEmployeesForSelect,
  toErrorMessage,
  transferEmployeeDepartment,
} from '../../../services/operationsModulesApi';

const EmployeeBulkOps = () => {
  const [jsonText, setJsonText] = useState(
    '[\n  {\n    "firstName": "Jane",\n    "lastName": "Doe",\n    "email": "jane.doe@ispace.com",\n    "department": "Engineering",\n    "designation": "Developer"\n  }\n]',
  );
  const [transfer, setTransfer] = useState({ employeeId: '', department: '' });
  const [employees, setEmployees] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState({ type: '', text: '' });

  const loadEmployees = async () => {
    try {
      setEmployees(await fetchEmployeesForSelect());
    } catch {
      /* ignore */
    }
  };

  React.useEffect(() => {
    loadEmployees();
  }, []);

  const handleImport = async (e) => {
    e.preventDefault();
    setBusy(true);
    setBanner({ type: '', text: '' });
    try {
      const employeesPayload = JSON.parse(jsonText);
      if (!Array.isArray(employeesPayload)) {
        throw new Error('JSON must be an array of employee objects');
      }
      const data = await bulkImportEmployees(employeesPayload);
      setResult(data);
      setBanner({
        type: 'success',
        text: `Imported ${data?.created ?? data?.createdEmployees?.length ?? 0} employee(s).`,
      });
      await loadEmployees();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err, 'Import failed') });
    } finally {
      setBusy(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await transferEmployeeDepartment(transfer.employeeId, transfer.department);
      setBanner({ type: 'success', text: 'Employee transferred to new department.' });
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModulePageLayout title="Bulk employee operations" subtitle="Import employees and transfer departments" icon={FiUsers}>
      {banner.text ? (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${banner.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
          {banner.text}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleImport} className="bg-white rounded-xl border p-6 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <FiUpload /> Bulk import
          </h2>
          <p className="text-xs text-slate-500">Paste a JSON array matching your employee import schema.</p>
          <textarea
            rows={14}
            className="w-full border rounded-lg px-3 py-2 text-xs font-mono"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <button type="submit" disabled={busy} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium">
            {busy ? 'Importing…' : 'Run import'}
          </button>
          {result ? (
            <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>
          ) : null}
        </form>

        <form onSubmit={handleTransfer} className="bg-white rounded-xl border p-6 space-y-3">
          <h2 className="font-semibold">Transfer department</h2>
          <select
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={transfer.employeeId}
            onChange={(e) => setTransfer((p) => ({ ...p, employeeId: e.target.value }))}
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {[emp.firstName, emp.lastName, emp.employeeCode].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="New department name"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={transfer.department}
            onChange={(e) => setTransfer((p) => ({ ...p, department: e.target.value }))}
          />
          <button type="submit" disabled={busy} className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-medium">
            Transfer
          </button>
        </form>
      </div>
    </ModulePageLayout>
  );
};

export default EmployeeBulkOps;
