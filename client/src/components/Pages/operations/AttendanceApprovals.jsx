import React, { useCallback, useEffect, useState } from 'react';
import { FiCalendar, FiRefreshCw } from 'react-icons/fi';
import API from '../../../api/client';
import { ATTENDANCE_ENDPOINTS } from '../../../api/endpoints';
import AttendanceApprovalPanel from '../../Attendance/AttendanceApprovalPanel';
import ModulePageLayout from './ModulePageLayout';
import { toErrorMessage } from '../../../services/operationsModulesApi';
import {
  formatAttendanceRecordDate,
  getAttendanceEmployeeLabel,
} from '../../../utils/attendanceDisplay';

const unwrap = (res) => {
  const body = res?.data;
  if (body?.data !== undefined) return body.data;
  return body;
};

const AttendanceApprovals = () => {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let list = [];
      try {
        const pendingRes = await API.get(ATTENDANCE_ENDPOINTS.pendingApprovals);
        const pendingData = unwrap(pendingRes);
        list = Array.isArray(pendingData) ? pendingData : pendingData?.records || [];
      } catch {
        /* fall back to team list */
      }
      if (!list.length) {
        const res = await API.get(ATTENDANCE_ENDPOINTS.team(200));
        const data = unwrap(res);
        const teamList = Array.isArray(data) ? data : data?.records || data?.attendance || [];
        list = teamList.filter(
          (r) =>
            String(r.approvalStatus || r.status || '').toLowerCase().includes('pending') ||
            r.requiresApproval === true,
        );
        if (!list.length) list = teamList.slice(0, 50);
      }
      setRows(list);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to load attendance records'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ModulePageLayout
      title="Attendance approvals"
      subtitle="Review and approve team attendance corrections"
      icon={FiCalendar}
      actions={
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm">
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      }
    >
      {error ? <div className="mb-4 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">{error}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Employee</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r._id}
                  className={`border-t cursor-pointer hover:bg-slate-50 ${selected?._id === r._id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelected(r)}
                >
                  <td className="px-4 py-3">{getAttendanceEmployeeLabel(r)}</td>
                  <td className="px-4 py-3">{formatAttendanceRecordDate(r)}</td>
                  <td className="px-4 py-3">{r.approvalStatus || r.status || '—'}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No records to review
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          {selected ? (
            <AttendanceApprovalPanel
              attendanceRecord={selected}
              onClose={() => setSelected(null)}
              onSuccess={() => {
                setSelected(null);
                load();
              }}
            />
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center text-slate-500 text-sm">
              Select a record to approve or reject
            </div>
          )}
        </div>
      </div>
    </ModulePageLayout>
  );
};

export default AttendanceApprovals;
