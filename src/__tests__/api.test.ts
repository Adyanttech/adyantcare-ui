import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, getToken, setToken, setUnauthorizedHandler } from '../api';

const ok = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as Response;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  setUnauthorizedHandler(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('token storage', () => {
  it('stores, reads and clears the token', () => {
    expect(getToken()).toBeNull();
    setToken('abc');
    expect(getToken()).toBe('abc');
    setToken(null);
    expect(getToken()).toBeNull();
  });
});

describe('requests', () => {
  it('sends a GET to /api with JSON headers and no body', async () => {
    fetchMock.mockResolvedValue(ok({ hello: 'world' }));
    const r = await api.get<{ hello: string }>('/things');
    expect(r).toEqual({ hello: 'world' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/api\/things$/);
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('adds the bearer token when signed in and omits it when not', async () => {
    fetchMock.mockResolvedValue(ok({}));
    await api.get('/a');
    expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBeUndefined();
    setToken('tok');
    await api.get('/a');
    expect(fetchMock.mock.calls[1]![1].headers.Authorization).toBe('Bearer tok');
  });

  it.each([
    ['post', 'POST'],
    ['put', 'PUT'],
    ['patch', 'PATCH'],
  ] as const)('%s sends the JSON body with method %s', async (fn, method) => {
    fetchMock.mockResolvedValue(ok({ ok: true }));
    await api[fn]('/x', { a: 1 });
    const init = fetchMock.mock.calls[0]![1];
    expect(init.method).toBe(method);
    expect(JSON.parse(init.body)).toEqual({ a: 1 });
  });

  it('post sends an empty object when no body is given', async () => {
    fetchMock.mockResolvedValue(ok({}));
    await api.post('/x');
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({});
  });

  it('del sends a DELETE with no body', async () => {
    fetchMock.mockResolvedValue(ok({ ok: true }));
    await api.del('/schedule/plans/1');
    const init = fetchMock.mock.calls[0]![1];
    expect(init.method).toBe('DELETE');
    expect(init.body).toBeUndefined();
  });
});

describe('errors', () => {
  it("throws the server's error message", async () => {
    fetchMock.mockResolvedValue(ok({ error: 'Sorry, that slot was just taken.' }, 409));
    await expect(api.post('/appointments', {})).rejects.toThrow('Sorry, that slot was just taken.');
  });

  it('falls back to the status code when the server gives no message', async () => {
    fetchMock.mockResolvedValue(ok({}, 500));
    await expect(api.get('/boom')).rejects.toThrow('Request failed (500)');
  });

  it('copes with a reply that is not JSON', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('not json'); } } as unknown as Response);
    await expect(api.get('/bad')).rejects.toThrow('Request failed (502)');
  });

  it('explains when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.get('/x')).rejects.toThrow(/Cannot reach the server/);
  });

  it('signs the user out on a 401 from a normal request', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockResolvedValue(ok({ error: 'Not signed in.' }, 401));
    await expect(api.get('/patients')).rejects.toThrow('Not signed in.');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it.each(['/auth/login', '/auth/otp/request', '/auth/otp/login', '/auth/password/reset'])('does not sign out on a 401 from %s', async (path) => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockResolvedValue(ok({ error: 'Mobile number, email or password is incorrect.' }, 401));
    await expect(api.post(path, {})).rejects.toThrow('incorrect');
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not sign out on other error codes', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockResolvedValue(ok({ error: 'No' }, 403));
    await expect(api.get('/x')).rejects.toThrow('No');
    expect(handler).not.toHaveBeenCalled();
  });
});
