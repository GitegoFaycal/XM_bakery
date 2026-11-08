// Thin fetch wrapper around the XM Bakery backend.
// Every backend error response has the shape { message: string }.

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export const TOKEN_KEY = 'xm_bakery_token';
export const UNAUTHORIZED_EVENT = 'xm:unauthorized';

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

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const init = {
    method,
    headers: { Accept: 'application/json', ...headers },
  };

  const token = getToken();
  if (token) init.headers.Authorization = `Bearer ${token}`;

  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0, null);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    // A rejected token means the session is dead: let AuthContext log out.
    if (response.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const message =
      (data && data.message) ||
      (response.status === 404
        ? 'This feature is not available on the server yet.'
        : `Request failed (${response.status})`);
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
