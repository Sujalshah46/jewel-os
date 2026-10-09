/**
 * Session handling for API mode.
 * The backend issues opaque bearer tokens (POST /v1/auth/login, /v1/auth/signup).
 * Only the token is stored locally; the server owns the session.
 */

export const TOKEN_KEY = 'JOS_API_TOKEN';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function clearToken() {
  setToken(null);
}

export async function login(api, { email, password }) {
  const res = await api.post('/v1/auth/login', { email, password });
  // Backend returns { token, tokenType: 'Bearer', tenantId, userId }
  if (res && res.token) setToken(res.token);
  return res;
}

export async function signup(api, { email, password, tenantName }) {
  // Backend contract: { email, password, tenantName, businessName }.
  // For self-serve signup the workspace name and the legal-entity business
  // name are the same value collected from the "Business / firm name" field.
  const res = await api.post('/v1/auth/signup', { email, password, tenantName, businessName: tenantName });
  if (res && res.token) setToken(res.token);
  return res;
}

export async function fetchMe(api) {
  return api.get('/v1/auth/me');
}

export async function logout(api) {
  try {
    await api.post('/v1/auth/logout', {});
  } catch {
    /* best effort — token is cleared regardless */
  }
  clearToken();
}
