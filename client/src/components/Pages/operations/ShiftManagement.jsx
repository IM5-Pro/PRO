import React, { useCallback, useEffect, useState } from 'react';
import { FiClock, FiPlus, FiRefreshCw } from 'react-icons/fi';
import ModulePageLayout from './ModulePageLayout';
import {
  assignShiftToEmployee,
  createShiftRecord,
  fetchEmployeesForSelect,
  fetchShiftsList,
  toErrorMessage,
} from '../../../services/operationsModulesApi';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shiftForm, setShiftForm] = useState({
    name: '',
    code: '',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriodMinutes: 15,
  });
  const [assignForm, setAssignForm] = useState({ employeeId: '', shiftId: '', effectiveFrom: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [shiftRows, empRows] = await Promise.all([fetchShiftsList(100), fetchEmployeesForSelect()]);
      setShifts(shiftRows);
      setEmployees(empRows);
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateShift = async (e) => {
    e.preventDefault();
    setBusy('shift');
    try {
      await createShiftRecord(shiftForm);
      setShiftForm({ name: '', code: '', startTime: '09:00', endTime: '18:00', gracePeriodMinutes: 15 });
      setBanner({ type: 'success', text: 'Shift created.' });
      await load();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setBusy('assign');
    try {
      await assignShiftToEmployee({
        employeeId: assignForm.employeeId,
        shiftId: assignForm.shiftId,
        effectiveFrom: assignForm.effectiveFrom || new Date().toISOString(),
      });
      setBanner({ type: 'success', text: 'Shift assigned.' });
      setAssignForm({ employeeId: '', shiftId: '', effectiveFrom: '' });
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const empLabel = (e) =>
    [e.firstName, e.lastName, e.employeeCode ? `(${e.employeeCode})` : ''].filter(Boolean).join(' ');

  return (
    <ModulePageLayout
      title="Shift management"
      subtitle="Define work shifts and assign them to employees"
      icon={FiClock}
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={handleCreateShift} className="bg-white rounded-xl border p-6 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <FiPlus /> Create shift
          </h2>
          <input required placeholder="Name" className="w-full border rounded-lg px-3 py-2 text-sm" value={shiftForm.name} onChange={(e) => setShiftForm((p) => ({ ...p, name: e.target.value }))} />
          <input placeholder="Code" className="w-full border rounded-lg px-3 py-2 text-sm" value={shiftForm.code} onChange={(e) => setShiftForm((p) => ({ ...p, code: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <input type="time" className="border rounded-lg px-3 py-2 text-sm" value={shiftForm.startTime} onChange={(e) => setShiftForm((p) => ({ ...p, startTime: e.target.value }))} />
            <input type="time" className="border rounded-lg px-3 py-2 text-sm" value={shiftForm.endTime} onChange={(e) => setShiftForm((p) => ({ ...p, endTime: e.target.value }))} />
          </div>
          <button type="submit" disabled={busy === 'shift'} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium">
            {busy === 'shift' ? 'Saving…' : 'Save shift'}
          </button>
        </form>

        <form onSubmit={handleAssign} className="bg-white rounded-xl border p-6 space-y-3">
          <h2 className="font-semibold">Assign to employee</h2>
          <select required className="w-full border rounded-lg px-3 py-2 text-sm" value={assignForm.employeeId} onChange={(e) => setAssignForm((p) => ({ ...p, employeeId: e.target.value }))}>
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {empLabel(e)}
              </option>
            ))}
          </select>
          <select required className="w-full border rounded-lg px-3 py-2 text-sm" value={assignForm.shiftId} onChange={(e) => setAssignForm((p) => ({ ...p, shiftId: e.target.value }))}>
            <option value="">Select shift</option>
            {shifts.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.startTime}–{s.endTime})
              </option>
            ))}
          </select>
          <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={assignForm.effectiveFrom} onChange={(e) => setAssignForm((p) => ({ ...p, effectiveFrom: e.target.value }))} />
          <button type="submit" disabled={busy === 'assign'} className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-medium">
            Assign
          </button>
        </form>

        <div className="xl:col-span-1 bg-white rounded-xl border overflow-hidden xl:row-span-2">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Shift</th>
                <th className="text-left px-4 py-3">Hours</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">
                    {s.startTime} – {s.endTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModulePageLayout>
  );
};

export default ShiftManagement;
