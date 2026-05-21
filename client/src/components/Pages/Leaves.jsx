/**
 * Leaves Management Page
 * Modern leave request and balance management interface
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiPlus,
  FiCheck,
  FiX,
  FiClock,
  FiMoreVertical,
} from "react-icons/fi";
import API from "../../api/client";
import { LEAVE_ENDPOINTS } from "../../api/endpoints";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { normalizeRole, ROLES } from "../../utils/roles";

const LEAVE_CARD_COLORS = [
  "from-blue-500 to-cyan-500",
  "from-red-500 to-pink-500",
  "from-yellow-500 to-orange-500",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-green-500",
];

const statusColors = {
  approved: "from-green-500 to-emerald-500",
  pending: "from-yellow-500 to-orange-500",
  rejected: "from-red-500 to-pink-500",
  cancelled: "from-slate-500 to-slate-600",
};

const HOLIDAYS_DATA = [
  { occasion: "New Year Day", day: "Thursday", date: "01-01-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Makara Sankranthi", day: "Wednesday", date: "14-01-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Republic Day", day: "Monday", date: "26-01-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Presidents' Day (USA)", day: "Monday", date: "16-02-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "May Day", day: "Friday", date: "01-05-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Memorial day (USA)", day: "Monday", date: "25-05-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Bakrid / EID AI Adha", day: "Wednesday", date: "27-05-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Telangana Formation Day", day: "Tuesday", date: "02-06-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Juneteenth", day: "Friday", date: "19-06-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Independence Day – (USA)", day: "Friday", date: "03-07-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Labor Day - USA", day: "Monday", date: "07-09-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Ganesh Chaturthi", day: "Monday", date: "14-09-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Mahatma Gandhi Jayanthi/Vijayadashami", day: "Friday", date: "02-10-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Dussehra", day: "Tuesday", date: "20-10-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Thanksgiving Day", day: "Thursday", date: "26-11-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Day after Thanksgiving Day", day: "Friday", date: "27-11-2026", category: "Project Development", department: "Technical", division: "IT" },
  { occasion: "Christmas", day: "Friday", date: "25-12-2026", category: "All", department: "All", division: "All" },
];

const LEAVE_TYPES_DATA = [
  { id: 1, type: "Privilege Leave/Earned Leave", code: "PL", totalLeaves: 15.0, paidLeave: "Yes", description: "(1.25 leaves shall be allocated on monthly basis. A minimum of 0.5 and maximum of 15.0 leaves can be applied at a time. A maximum of 60 leaves can be carried forwarded to next year)" },
  { id: 2, type: "Maternity Leave", code: "ML", totalLeaves: 180.0, paidLeave: "Yes", description: "Maternity Leave is a statutory leave is eligible for all married female employees. Women Employees are eligible to avail maternity leave and should have completed 90 working day of service with the company to avail maternity leave." },
  { id: 3, type: "Paternity Leave", code: "PTL", totalLeaves: 5.0, paidLeave: "Yes", description: "(5.0 leaves shall be allocated on yearly basis. All allocated leaves should be applied at a time. These leaves cannot be carried forwarded to next year.)" },
  { id: 4, type: "Miscarriage Leave", code: "MSL", totalLeaves: 7.0, paidLeave: "Yes", description: "(7.0 leaves shall be allocated on yearly basis. All allocated leaves should be applied at a time. These leaves cannot be carried forwarded to next year.)" },
  { id: 5, type: "Wellness leave", code: "WL", totalLeaves: 3.0, paidLeave: "Yes", description: "(3.0 leaves shall be allocated on yearly basis. A maximum of 3.0 can be applied at a time. These leaves cannot be carried forwarded to next year)" },
  { id: 6, type: "Sick Leave", code: "SL", totalLeaves: 6.0, paidLeave: "Yes", description: "6.0 leaves shall be allocated on yearly basis. A minimum of 0.5 and maximum of 15.0 leaves can be applied at a time. These leaves cannot be carried forwarded to next year" },
  { id: 7, type: "Compensatory Off", code: "Comp off", totalLeaves: 0.0, paidLeave: "No", description: "A minimum of 0.5 should be applied at a time. All leaves can be carried forwarded to next year" },
  { id: 8, type: "Optional Holiday", code: "OH", totalLeaves: 1.0, paidLeave: "Yes", description: "1.0 leaves shall be allocated on yearly basis (Jan-Dec) cycle. All allocated leaves should be applied at a time." },
];

const toPayload = (response) => response?.data || {};

const extractRows = (payload, key) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (key && Array.isArray(payload?.[key])) {
    return payload[key];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const Leaves = () => {
  const { colors } = useTheme();
  const { user = {} } = useAuth();
  const role = normalizeRole(user?.role);

  const [showRequestPage, setShowRequestPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [activeTab, setActiveTab] = useState('leave-management');
  const [formValues, setFormValues] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Ensure all leave types are available (API + fallback)
  const allLeaveTypes = useMemo(() => {
    if (leaveTypes.length > 0) {
      return leaveTypes;
    }
    // Fallback to LEAVE_TYPES_DATA if API doesn't return types
    return LEAVE_TYPES_DATA.map(type => ({
      id: type.id,
      name: type.type,
    }));
  }, [leaveTypes]);

  const loadLeaveData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const requestEndpoint =
        role === ROLES.HR_ADMIN || role === ROLES.SUPER_ADMIN
          ? LEAVE_ENDPOINTS.all
          : role === ROLES.MANAGER
            ? LEAVE_ENDPOINTS.team
            : LEAVE_ENDPOINTS.own;

      const [requestResponse, balanceResponse, policyResponse] =
        await Promise.all([
          API.get(requestEndpoint),
          API.get(LEAVE_ENDPOINTS.balance()),
          API.get(LEAVE_ENDPOINTS.policy).catch(() => null),
        ]);

      const requestRows = extractRows(toPayload(requestResponse), "data");
      const balanceRows = extractRows(toPayload(balanceResponse), "data");
      const policyRows = policyResponse
        ? extractRows(toPayload(policyResponse), "data")
        : [];

      const mappedRequests = requestRows.map((request) => {
        const leaveTypeData = request?.leaveTypeId;
        const approvedByData = request?.approvedBy;
        const leaveTypeName =
          typeof leaveTypeData === "object"
            ? leaveTypeData?.name || leaveTypeData?.code || "Leave"
            : request?.leaveTypeName || "Leave";

        const approverName =
          typeof approvedByData === "object"
            ? [approvedByData?.firstName, approvedByData?.lastName]
                .filter(Boolean)
                .join(" ")
                .trim() ||
              approvedByData?.email ||
              ""
            : "";

        const requesterName =
          typeof request?.employeeId === "object"
            ? [request?.employeeId?.firstName, request?.employeeId?.lastName]
                .filter(Boolean)
                .join(" ")
                .trim()
            : "";

        const normalizedStatus = String(
          request?.status || "PENDING",
        ).toLowerCase();

        const leaveTypeId =
          typeof leaveTypeData === "object"
            ? leaveTypeData?._id || leaveTypeData?.id
            : leaveTypeData;

        return {
          id: request?._id || request?.id,
          type: leaveTypeName,
          leaveTypeId,
          startDate: request?.startDate,
          endDate: request?.endDate,
          days: Number(request?.totalDays || 0),
          reason: request?.reason || "-",
          status: normalizedStatus,
          approvedBy:
            approverName ||
            (typeof request?.approvedBy === "string"
              ? request?.approvedBy
              : "-"),
          requesterName: requesterName || "-",
        };
      });

      const mappedBalances = balanceRows.map((balance, index) => {
        const leaveTypeData = balance?.leaveTypeId;
        const leaveTypeName =
          typeof leaveTypeData === "object"
            ? leaveTypeData?.name || leaveTypeData?.code || "Leave"
            : "Leave";

        const leaveTypeId =
          typeof leaveTypeData === "object"
            ? leaveTypeData?._id || leaveTypeData?.id
            : leaveTypeData;

        const total = Number(
          balance?.totalDays ?? leaveTypeData?.totalDays ?? 0,
        );
        const used = Number(balance?.usedDays ?? 0);
        const available = Number(
          balance?.remainingDays ?? Math.max(0, total - used),
        );

        return {
          type: leaveTypeName,
          leaveTypeId,
          total,
          used,
          available,
          color: LEAVE_CARD_COLORS[index % LEAVE_CARD_COLORS.length],
        };
      });

      const policyBalances = policyRows.map((policy, index) => {
        const totalDays = Number(policy?.totalDays || 0);
        return {
          type: policy?.name || policy?.code || "Leave",
          leaveTypeId: policy?._id || policy?.id,
          total: totalDays,
          used: 0,
          available: totalDays,
          color: LEAVE_CARD_COLORS[index % LEAVE_CARD_COLORS.length],
        };
      });

      const balanceByType = new Map();
      [...policyBalances, ...mappedBalances].forEach((entry) => {
        if (!entry?.leaveTypeId) {
          return;
        }
        balanceByType.set(String(entry.leaveTypeId), entry);
      });

      const mergedBalances = Array.from(balanceByType.values());
      const policyTypes = policyRows
        .map((policy) => ({
          id: policy?._id || policy?.id,
          name: policy?.name || policy?.code || "Leave",
        }))
        .filter((item) => item.id && item.name);

      const balanceTypes = mergedBalances
        .map((balance) => ({
          id: balance.leaveTypeId,
          name: balance.type,
        }))
        .filter((item) => item.id && item.name);

      const availableTypes = (
        policyTypes.length > 0 ? policyTypes : balanceTypes
      ).filter(
        (item, index, arr) =>
          arr.findIndex((entry) => String(entry.id) === String(item.id)) ===
          index,
      );

      setLeaveRequests(mappedRequests);
      setLeaveBalance(mergedBalances);
      setLeaveTypes(availableTypes);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load leave data",
      );
      setLeaveRequests([]);
      setLeaveBalance([]);
      setLeaveTypes([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadLeaveData();
  }, [loadLeaveData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".menu-container")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canApproveOrReject = useMemo(() => {
    return (
      role === ROLES.MANAGER ||
      role === ROLES.HR_ADMIN ||
      role === ROLES.SUPER_ADMIN
    );
  }, [role]);

  const handleFormChange = (field) => (event) => {
    setFormValues((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleLeaveRequestSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const { leaveTypeId, startDate, endDate, reason } = formValues;

    if (!leaveTypeId || !startDate || !endDate) {
      setError("Leave type, start date, and end date are required");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date must be before or equal to end date");
      return;
    }

    setSubmitting(true);
    try {
      if (editingRequestId) {
        // Update existing request
        await API.patch(LEAVE_ENDPOINTS.update(editingRequestId), {
          leaveTypeId,
          startDate,
          endDate,
          reason: reason.trim(),
        });
      } else {
        // Create new request
        await API.post(LEAVE_ENDPOINTS.create, {
          leaveTypeId,
          startDate,
          endDate,
          reason: reason.trim(),
        });
      }

      setShowRequestPage(false);
      setEditingRequestId(null);
      setFormValues({
        leaveTypeId: "",
        startDate: "",
        endDate: "",
        reason: "",
      });

      await loadLeaveData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit leave request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveAction = async (requestId, action) => {
    if (!requestId) {
      return;
    }

    setError("");

    try {
      if (action === "approve") {
        await API.patch(LEAVE_ENDPOINTS.approve(requestId));
      } else if (action === "reject") {
        await API.patch(LEAVE_ENDPOINTS.reject(requestId));
      } else if (action === "cancel") {
        await API.post(LEAVE_ENDPOINTS.cancel(requestId));
      }

      await loadLeaveData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update leave request",
      );
    }
  };

  const handleMenuToggle = (requestId) => {
    setOpenMenuId(openMenuId === requestId ? null : requestId);
  };

  const handleEditLeave = (request) => {
    setFormValues({
      leaveTypeId: request.leaveTypeId || "",
      startDate: request.startDate
        ? new Date(request.startDate).toISOString().split("T")[0]
        : "",
      endDate: request.endDate
        ? new Date(request.endDate).toISOString().split("T")[0]
        : "",
      reason: request.reason || "",
    });
    setEditingRequestId(request.id);
    setShowRequestPage(true);
    setOpenMenuId(null);
  };

  const handleCancelLeave = async (requestId) => {
    await handleLeaveAction(requestId, "cancel");
    setOpenMenuId(null);
  };

  return (
    <div className="min-h-screen bg-im5-page p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1
            className={`text-3xl md:text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}
          >
            <FiCalendar className="w-8 w-8 md:w-10 md:h-10" /> Leaves
          </h1>
          <p className={colors.text.tertiary}>
            Manage your leave requests and balance
          </p>
        </div>
        <button
          onClick={() => {
            setError("");
            setShowRequestPage(true);
          }}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center md:justify-start gap-2"
        >
          <FiPlus size={20} /> Request Leave
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-red-700 text-sm font-medium shadow-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex-shrink-0">
        <div className="border-b border-slate-200 bg-white rounded-t-2xl px-4 md:px-6">
          <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('leave-management')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'leave-management'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Leave Management
            </button>
            <button
              onClick={() => setActiveTab('list-holidays')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'list-holidays'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              List Holidays
            </button>
            <button
              onClick={() => setActiveTab('leave-types')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'leave-types'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Leave Types
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
      {activeTab === 'leave-management' && (
        <>
          {/* Leave Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            {leaveBalance.map((leave, idx) => {
              const percentage =
                leave.total > 0 ? (leave.used / leave.total) * 100 : 0;
              return (
                <div
                  key={`${leave.leaveTypeId || leave.type}-${idx}`}
                  className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-200 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-700 font-semibold text-sm">
                      {leave.type}
                    </h3>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full bg-gradient-to-r ${leave.color} rounded-full transition-all duration-500`}
                        style={{
                          width: `${Math.max(0, Math.min(100, percentage))}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-slate-500 text-xs">
                      {leave.used} of {leave.total} used
                    </p>
                  </div>

                  {/* Available Days */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Available</p>
                    <p
                      className={`text-2xl font-bold bg-gradient-to-r ${leave.color} bg-clip-text text-transparent`}
                    >
                      {leave.available}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leave Requests */}
          <div
            className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 transition-all duration-300"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <h2 className={`text-xl md:text-2xl font-bold ${colors.text.primary} mb-4 md:mb-6`}>
              Leave Requests
            </h2>

            {loading && (
              <p className={colors.text.tertiary}>Loading leave requests...</p>
            )}

            {!loading && leaveRequests.length === 0 && (
              <p className={colors.text.tertiary}>No leave requests found.</p>
            )}

<div className="space-y-3 md:space-y-4">
  {leaveRequests.map((request) => (
    <div
      key={request.id}
      className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:bg-slate-100 transition-colors duration-300 relative overflow-visible"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">

        {/* Left Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`${colors.text.primary} font-semibold`}>
              {request.type}
            </h3>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${
                statusColors[request.status] || statusColors.pending
              } text-white`}
            >
              {request.status.charAt(0).toUpperCase() +
                request.status.slice(1)}
            </span>
          </div>

          <p className="text-slate-600 text-sm mb-2">{request.reason}</p>

          <div className="flex flex-wrap items-center gap-4 text-slate-500 text-xs">
            <span className="flex items-center gap-1">
              <FiCalendar size={14} />
              {new Date(request.startDate).toLocaleDateString()} -{" "}
              {new Date(request.endDate).toLocaleDateString()}
            </span>

            <span className="flex items-center gap-1">
              <FiClock size={14} />
              {request.days} day{request.days > 1 ? "s" : ""}
            </span>

            <span>Approved By: {request.approvedBy}</span>

            {canApproveOrReject && request.requesterName && (
              <span>Employee: {request.requesterName}</span>
            )}
          </div>
        </div>

        {/* 3 Dots Menu */}
        <div className="relative menu-container" style={{ zIndex: 10 }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMenuToggle(request.id);
            }}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors duration-200"
            style={{ zIndex: 20 }}
            tabIndex={0}
            aria-label="More options"
          >
            <FiMoreVertical size={16} className="text-slate-500" />
          </button>
          {openMenuId === request.id && (
            <div
              className="absolute right-0 top-full mt-2 w-36 bg-white border border-slate-200 rounded-lg shadow-xl"
              style={{ zIndex: 9999, minHeight: '80px', display: 'block' }}
              onClick={e => e.stopPropagation()}
            >
              {request.status === "pending" && role === ROLES.EMPLOYEE ? (
                <>
                  <button
                    onClick={() => {
                      handleEditLeave(request);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center gap-2"
                    tabIndex={0}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleCancelLeave(request.id);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    tabIndex={0}
                  >
                    Cancel
                  </button>
                </>
              ) : request.status === "approved" && role === ROLES.MANAGER ? (
                <>
                  <button
                    onClick={() => {
                      handleLeaveAction(request.id, 'reject');
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    tabIndex={0}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      handleLeaveAction(request.id, 'cancel');
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2"
                    tabIndex={0}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <div className="px-4 py-2 text-xs text-slate-400">No actions available</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manager / HR Approval Buttons */}
      {request.status === "pending" && canApproveOrReject && (
        <div className="flex gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={() => handleLeaveAction(request.id, "approve")}
            className="flex-1 py-2 px-3 bg-green-500/20 hover:bg-green-500/30 text-green-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <FiCheck size={16} /> Approve
          </button>

          <button
            onClick={() => handleLeaveAction(request.id, "reject")}
            className="flex-1 py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <FiX size={16} /> Reject
          </button>
        </div>
      )}

      {/* Employee Cancel Button */}
      {request.status === "pending" &&
        !canApproveOrReject &&
        role === ROLES.EMPLOYEE && (
          <div className="flex gap-2 pt-3 border-t border-slate-200">
            <button
              onClick={() => handleLeaveAction(request.id, "cancel")}
              className="w-full py-2 px-3 bg-slate-500/20 hover:bg-slate-500/30 text-slate-600 rounded-lg text-sm font-medium"
            >
              Cancel Request
            </button>
          </div>
        )}
    </div>
  ))}
</div>
          </div>
        </>
      )}

      {activeTab === 'list-holidays' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Holidays</h2>
            <p className="text-xs md:text-sm text-slate-500">From: 01-01-2026 To: 31-12-2026</p>
          </div>

          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">Occasion</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">Day</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">Date</th>
                  <th className="hidden md:table-cell px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">Dept Category</th>
                  <th className="hidden lg:table-cell px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">Department</th>
                  <th className="hidden lg:table-cell px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">Division</th>
                </tr>
              </thead>
              <tbody>
                {HOLIDAYS_DATA.map((holiday, idx) => (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-slate-900 font-medium">{holiday.occasion}</td>
                    <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-slate-600">{holiday.day}</td>
                    <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-slate-600">{holiday.date}</td>
                    <td className="hidden md:table-cell px-3 md:px-4 py-3 text-xs md:text-sm text-slate-600">{holiday.category}</td>
                    <td className="hidden lg:table-cell px-3 md:px-4 py-3 text-xs md:text-sm text-slate-600">{holiday.department}</td>
                    <td className="hidden lg:table-cell px-3 md:px-4 py-3 text-xs md:text-sm text-slate-600">{holiday.division}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leave-types' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-8 mb-8" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Leave Types</h2>
            <p className="text-xs md:text-sm text-slate-500">All available leave types and their policies</p>
          </div>

          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">#</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">Leave Type</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">Code</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">Days</th>
                  <th className="hidden md:table-cell px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">Paid</th>
                  <th className="hidden lg:table-cell px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-700">Description</th>
                </tr>
              </thead>
              <tbody>
                {LEAVE_TYPES_DATA.map((leaveType) => (
                  <tr key={leaveType.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-slate-600 font-medium">{leaveType.id}</td>
                    <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-slate-900 font-medium">{leaveType.type}</td>
                    <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-slate-600">{leaveType.code}</td>
                    <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-slate-600 font-semibold">{leaveType.totalLeaves}</td>
                    <td className="hidden md:table-cell px-3 md:px-4 py-3 text-xs md:text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${leaveType.paidLeave === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {leaveType.paidLeave}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-3 md:px-4 py-3 text-xs md:text-sm text-slate-600 max-w-xs">{leaveType.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Leave Request Form Modal */}
      {showRequestPage && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto"
          onClick={() => {
            setShowRequestPage(false);
            setEditingRequestId(null);
            setFormValues({
              leaveTypeId: "",
              startDate: "",
              endDate: "",
              reason: "",
            });
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-2xl my-auto shadow-2xl border border-blue-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingRequestId ? "Edit Leave Request" : "Request Leave"}
              </h2>
              <button
                onClick={() => {
                  setShowRequestPage(false);
                  setEditingRequestId(null);
                  setFormValues({
                    leaveTypeId: "",
                    startDate: "",
                    endDate: "",
                    reason: "",
                  });
                }}
                className="text-slate-400 hover:text-slate-600 text-3xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLeaveRequestSubmit} className="space-y-4">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formValues.leaveTypeId}
                  onChange={handleFormChange("leaveTypeId")}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 text-sm transition-all"
                >
                  <option value="">Select leave type</option>
                  {allLeaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formValues.startDate}
                    onChange={handleFormChange("startDate")}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 text-sm transition-all"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formValues.endDate}
                    onChange={handleFormChange("endDate")}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={formValues.reason}
                  onChange={handleFormChange("reason")}
                  placeholder="Enter reason for leave..."
                  rows="3"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 text-sm resize-none transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestPage(false);
                    setEditingRequestId(null);
                    setFormValues({
                      leaveTypeId: "",
                      startDate: "",
                      endDate: "",
                      reason: "",
                    });
                  }}
                  className="flex-1 py-2.5 px-4 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {submitting ? "Submitting..." : editingRequestId ? "Update Request" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
