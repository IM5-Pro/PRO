import API from '../api/client';
import { INSURANCE_ENDPOINTS } from '../api/endpoints';

const unwrap = (res) => {
  const body = res?.data;
  if (body?.success === false) {
    const err = new Error(body.message || 'Request failed');
    err.response = res;
    throw err;
  }
  return body;
};

export const fetchMyInsuranceContext = async () => {
  const res = await API.get(INSURANCE_ENDPOINTS.myContext);
  const body = unwrap(res);
  return body?.context || body?.data?.context || null;
};

export const saveMyInsuranceSubmission = async (
  { nominees, selectedAddonIds },
  { submitForApproval = false } = {},
) => {
  const res = await API.put(INSURANCE_ENDPOINTS.mySubmission, {
    nominees,
    selectedAddonIds,
    submitForApproval,
  });
  const body = unwrap(res);
  return {
    submission: body?.submission || null,
    cycle: body?.cycle || null,
    message: body?.message,
  };
};

export const updateInsuranceSubmissionByHr = async (
  submissionId,
  { nominees, selectedAddonIds },
) => {
  const res = await API.put(INSURANCE_ENDPOINTS.submissionUpdate(submissionId), {
    nominees,
    selectedAddonIds,
  });
  const body = unwrap(res);
  return body?.submission || null;
};

export const INSURANCE_RELATION_OPTIONS = [
  { value: 'FATHER', label: 'Father' },
  { value: 'MOTHER', label: 'Mother' },
  { value: 'FATHER_IN_LAW', label: 'Father-in-law' },
  { value: 'MOTHER_IN_LAW', label: 'Mother-in-law' },
  { value: 'SPOUSE', label: 'Spouse' },
  { value: 'CHILD_1', label: 'Child 1' },
  { value: 'CHILD_2', label: 'Child 2' },
];

export const fetchPendingInsuranceSubmissions = async () => {
  const res = await API.get(INSURANCE_ENDPOINTS.submissionsPending);
  const body = unwrap(res);
  return body?.submissions || [];
};

export const approveInsuranceSubmission = async (submissionId, remarks = '') => {
  const res = await API.post(INSURANCE_ENDPOINTS.submissionApprove(submissionId), { remarks });
  return unwrap(res);
};

export const rejectInsuranceSubmission = async (submissionId, remarks = '') => {
  const res = await API.post(INSURANCE_ENDPOINTS.submissionReject(submissionId), { remarks });
  return unwrap(res);
};

export const fetchInsuranceCycles = async () => {
  const res = await API.get(INSURANCE_ENDPOINTS.cycles);
  const body = unwrap(res);
  return body?.cycles || [];
};

export const createInsuranceCycle = async (payload) => {
  const res = await API.post(INSURANCE_ENDPOINTS.cycles, payload);
  const body = unwrap(res);
  return { cycle: body?.cycle || null, message: body?.message };
};

export const updateInsuranceCycle = async (cycleId, payload) => {
  const res = await API.put(INSURANCE_ENDPOINTS.cycleUpdate(cycleId), payload);
  const body = unwrap(res);
  return { cycle: body?.cycle || null, message: body?.message };
};

export const cycleToFormState = (cycle) => ({
  title: cycle?.title || '',
  description: cycle?.description || '',
  cycleType: cycle?.cycleType || 'INITIAL',
  baseCoverageAmount: cycle?.baseCoverageAmount ?? 300000,
  addons:
    cycle?.addons?.length > 0
      ? cycle.addons.map((a) => ({
          _id: a._id,
          key: a.key || '',
          label: a.label || '',
          amount: a.amount ?? '',
          description: a.description || '',
        }))
      : [{ key: '', label: '', amount: '', description: '' }],
});

export const formToCyclePayload = (form) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  cycleType: form.cycleType,
  baseCoverageAmount: Number(form.baseCoverageAmount) || 300000,
  addons: form.addons
    .filter((a) => a.label?.trim())
    .map((a, i) => ({
      _id: a._id,
      key: a.key?.trim() || `addon-${i + 1}`,
      label: a.label.trim(),
      amount: Number(a.amount) || 0,
      description: a.description?.trim() || '',
    })),
});

export const closeInsuranceCycle = async (cycleId) => {
  const res = await API.post(INSURANCE_ENDPOINTS.cycleClose(cycleId));
  return unwrap(res);
};

export const fetchInsuranceCycleSummary = async (cycleId) => {
  const res = await API.get(INSURANCE_ENDPOINTS.cycleSummary(cycleId));
  const body = unwrap(res);
  return {
    cycle: body?.cycle || null,
    roster: body?.roster || [],
    submissions: body?.submissions || [],
    stats: body?.stats || {},
  };
};

export const downloadInsuranceCycleExport = async (
  cycleId,
  { status = 'APPROVED', scope = 'nominees' } = {},
) => {
  const res = await API.get(INSURANCE_ENDPOINTS.cycleExport(cycleId, { status, scope }), {
    responseType: 'blob',
  });
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || `insurance-export-${status.toLowerCase()}.csv`;
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const formatInr = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const formatNomineeDob = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export const nomineesToFormRows = (nominees = [], relationOptions = []) => {
  if (!nominees.length) {
    return [{ name: '', dateOfBirth: '', relation: relationOptions[0]?.value || 'FATHER' }];
  }
  return nominees.map((n) => ({
    name: n.name || '',
    dateOfBirth: formatNomineeDob(n.dateOfBirth),
    relation: n.relation || '',
  }));
};
