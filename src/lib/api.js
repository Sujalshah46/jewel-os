/**
 * Typed HTTP client for the Jewellery OS backend API.
 *
 * - Base URL from `VITE_API_URL` (e.g. https://api.example.com)
 * - Bearer token from localStorage (see ./auth.js)
 * - Backend error envelope { code, message, correlationId, retryable } is
 *   surfaced as ApiError with the same fields.
 * - Optional Idempotency-Key header for finalize/payment calls.
 */

export class ApiError extends Error {
  constructor({ code, message, status, retryable, correlationId }) {
    super(message || code || 'Request failed');
    this.name = 'ApiError';
    this.code = code || 'UNKNOWN';
    this.status = status || 0;
    this.retryable = !!retryable;
    this.correlationId = correlationId || null;
  }
}

function joinUrl(base, path) {
  return base.replace(/\/+$/, '') + '/' + String(path).replace(/^\/+/, '');
}

export function createApiClient({ baseUrl, getToken, onUnauthorized }) {
  async function request(method, path, { body, query, idempotencyKey, signal } = {}) {
    const url = new URL(joinUrl(baseUrl, path));
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
      }
    }
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken ? getToken() : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    let res;
    try {
      res = await fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });
    } catch (err) {
      throw new ApiError({ code: 'NETWORK_ERROR', message: 'Could not reach the server. Check your connection.', retryable: true });
    }

    let payload = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (!res.ok) {
      if (res.status === 401 && onUnauthorized) onUnauthorized();
      const env = payload && typeof payload === 'object' ? payload : {};
      throw new ApiError({
        code: env.code || `HTTP_${res.status}`,
        message: env.message || `Request failed (${res.status})`,
        status: res.status,
        retryable: env.retryable ?? res.status >= 500,
        correlationId: env.correlationId || null,
      });
    }
    return payload;
  }

  return {
    request,
    get: (path, opts) => request('GET', path, opts),
    post: (path, body, opts) => request('POST', path, { ...opts, body }),
    patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
    put: (path, body, opts) => request('PUT', path, { ...opts, body }),
    delete: (path, opts) => request('DELETE', path, opts),
  };
}

/** Stable idempotency key for a user-initiated finalize/payment action. */
export function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'key-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}
