/**
 * Shared API response helpers for the React client.
 */

export const toPayload = (response) => response?.data ?? response ?? {};

export const unwrapData = (payload) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.data !== undefined) {
    return payload.data;
  }
  return payload;
};

export const extractRows = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  const inner = payload.data;
  if (inner && typeof inner === 'object') {
    for (const key of keys) {
      if (Array.isArray(inner[key])) return inner[key];
    }
    if (Array.isArray(inner)) return inner;
  }

  return [];
};

export const toErrorMessage = (error, fallback = 'Request failed') => {
  const message = error?.response?.data?.message || error?.message;
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
};

export const apiGetRows = async (apiClient, url, config = {}, keys = []) => {
  const response = await apiClient.get(url, config);
  const payload = toPayload(response);
  return extractRows(unwrapData(payload), keys) || extractRows(payload, keys);
};
