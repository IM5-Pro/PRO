/**
 * Resolve dashboard page id for a notification type.
 */
export const getPageIdForNotificationType = (type) => {
  const normalized = String(type || '');

  if (normalized === 'onboarding_task') {
    return 'profile-approvals';
  }

  if (normalized.startsWith('tool_provisioning')) {
    return 'tool-provisioning';
  }

  const leaveTypes = new Set([
    'leave_request',
    'leave_approval',
    'leave_rejection',
    'leave_cancelled',
  ]);
  if (leaveTypes.has(normalized) || normalized.includes('leave')) {
    return 'leaves';
  }

  if (normalized.includes('attendance')) {
    return 'attendance';
  }

  if (normalized.includes('payroll')) {
    return 'payroll';
  }

  if (
    normalized.includes('performance') ||
    normalized.includes('goal') ||
    normalized.includes('okr')
  ) {
    return 'performance';
  }

  if (normalized === 'announcement') {
    return 'announcements';
  }

  if (
    normalized.includes('resignation') ||
    normalized.includes('exit') ||
    normalized.includes('offboarding')
  ) {
    return 'resignation';
  }

  if (normalized === 'document_approval' || normalized === 'document_rejection') {
    return 'employee-profile';
  }

  if (
    normalized.includes('meeting') ||
    normalized.includes('one_on_one') ||
    normalized.includes('asset') ||
    normalized.includes('system_access') ||
    normalized.includes('training') ||
    normalized.includes('certification')
  ) {
    return 'team-collaboration';
  }

  if (normalized.includes('insurance')) {
    if (normalized.includes('submitted') || normalized.includes('pending')) {
      return 'insurance-approvals';
    }
    return 'insurance-details';
  }

  if (
    normalized.includes('role') ||
    normalized.includes('designation') ||
    normalized.includes('department') ||
    normalized.includes('team_membership')
  ) {
    return 'employee-profile';
  }

  return 'dashboard';
};
