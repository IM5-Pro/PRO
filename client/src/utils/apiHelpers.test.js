import { unwrapData, extractRows, toErrorMessage, toPayload } from './apiHelpers';

describe('apiHelpers', () => {
  test('unwrapData unwraps nested data envelope', () => {
    expect(unwrapData({ data: { ok: true } })).toEqual({ ok: true });
    expect(unwrapData([1, 2])).toEqual([1, 2]);
  });

  test('extractRows finds list keys', () => {
    expect(extractRows({ leaves: [{ id: 1 }] }, ['leaves'])).toEqual([{ id: 1 }]);
    expect(extractRows([{ id: 1 }])).toEqual([{ id: 1 }]);
  });

  test('toPayload reads axios-like response', () => {
    expect(toPayload({ data: { message: 'ok' } })).toEqual({ message: 'ok' });
  });

  test('toErrorMessage prefers API message', () => {
    expect(
      toErrorMessage({ response: { data: { message: 'Denied' } } }, 'fallback'),
    ).toBe('Denied');
    expect(toErrorMessage({}, 'fallback')).toBe('fallback');
  });
});
