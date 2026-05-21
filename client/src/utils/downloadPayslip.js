import API from '../api/client';
import { PAYROLL_ENDPOINTS } from '../api/endpoints';

const parseBlobErrorMessage = async (blob) => {
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return parsed?.message || parsed?.errors || text;
  } catch {
    return 'Failed to download payslip';
  }
};

/**
 * Download a payslip PDF via authenticated API (avoids opening API URL in browser).
 */
export const downloadPayslipPdf = async (detailId, monthLabel = 'payslip') => {
  if (!detailId) {
    throw new Error('Payslip is not available for download yet');
  }

  const response = await API.get(PAYROLL_ENDPOINTS.download(detailId), {
    responseType: 'blob',
    skipAuthRedirect: true,
  });

  const contentType = String(response?.headers?.['content-type'] || '');
  if (!contentType.includes('pdf')) {
    const message = await parseBlobErrorMessage(response.data);
    throw new Error(
      typeof message === 'string' ? message : 'Failed to download payslip',
    );
  }

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeMonth = String(monthLabel || 'payslip').replace(/[^a-zA-Z0-9_-]/g, '_');

  link.href = blobUrl;
  link.download = `${safeMonth}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};
