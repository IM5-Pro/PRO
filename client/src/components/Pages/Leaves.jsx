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
  FiArrowLeft,
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
  const [formValues, setFormValues] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

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
  }, [role, user?.employeeId]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}
          >
            <FiCalendar className="w-10 h-10" /> Leaves
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
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
        >
          <FiPlus size={20} /> Request Leave
        </button>
      </div>

      {error && (
        <div className="glass rounded-2xl p-4 mb-6 border border-red-500/30 bg-red-500/10 text-red-300">
          {error}
        </div>
      )}

      {showRequestPage ? (
        <div
          className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {editingRequestId ? "Edit Leave Request" : "Leave Request Page"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {editingRequestId
                  ? "Update your leave request details."
                  : "Submit your leave request and track the approval status."}
              </p>
            </div>
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <FiArrowLeft size={16} /> Back to Leaves
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleLeaveRequestSubmit}>
            <div>
              <label className="block text-slate-700 font-medium mb-2 text-sm">
                Leave Type
              </label>
              <select
                value={formValues.leaveTypeId}
                onChange={handleFormChange("leaveTypeId")}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 transition-all duration-300"
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-2 text-sm">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formValues.startDate}
                  onChange={handleFormChange("startDate")}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-2 text-sm">
                  End Date
                </label>
                <input
                  type="date"
                  value={formValues.endDate}
                  onChange={handleFormChange("endDate")}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-2 text-sm">
                Reason
              </label>
              <textarea
                rows="4"
                value={formValues.reason}
                onChange={handleFormChange("reason")}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                placeholder="Enter reason..."
              ></textarea>
            </div>

            <div className="flex gap-3 pt-1">
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
                className="flex-1 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all duration-300 font-medium"
              >
                {submitting
                  ? "Submitting..."
                  : editingRequestId
                    ? "Update Request"
                    : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Leave Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            className="bg-white rounded-2xl border border-slate-200 p-6 transition-all duration-300"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>
              Leave Requests
            </h2>

            {loading && (
              <p className={colors.text.tertiary}>Loading leave requests...</p>
            )}

            {!loading && leaveRequests.length === 0 && (
              <p className={colors.text.tertiary}>No leave requests found.</p>
            )}

            <div className="space-y-4">
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
    </div>
  );
};

export default Leaves;
