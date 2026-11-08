import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.js';
import { getToken, setToken, UNAUTHORIZED_EVENT } from '../api/client.js';

// The session is a JWT (kept in localStorage and attached by api/client.js)
// plus the user object { id, name, email, role } that came with it.

const USER_KEY = 'xm_bakery_user';
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw && getToken() ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    } catch {
      /* storage unavailable: session lives in memory only */
    }
  }, [user]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Refresh the profile on load so a role change (e.g. promoted to admin)
  // shows up without re-login, and drop dead sessions.
  useEffect(() => {
    if (!getToken()) return;
    authApi
      .me()
      .then((data) => setUser(data.user))
      .catch((err) => {
        if (err.status === 401) logout();
      });
  }, [logout]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const data = await authApi.register(details);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
