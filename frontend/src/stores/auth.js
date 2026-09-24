import { create } from 'zustand';

const AUTH_KEY = 'lgu-payroll-auth';

function readAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
  } catch {
    return {};
  }
}

export const useAuth = create((set) => ({
  user: readAuth().user ?? null,
  accessToken: readAuth().accessToken ?? null,
  refreshToken: readAuth().refreshToken ?? null,
  setSession: ({ user, accessToken, refreshToken }) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ user, accessToken, refreshToken }));
    set({ user, accessToken, refreshToken });
  },
  setAccessToken: (accessToken) => {
    const current = readAuth();
    localStorage.setItem(AUTH_KEY, JSON.stringify({ ...current, accessToken }));
    set({ accessToken });
  },
  setTokens: ({ accessToken, refreshToken }) => {
    const current = readAuth();
    const next = { ...current, accessToken, refreshToken };
    localStorage.setItem(AUTH_KEY, JSON.stringify(next));
    set({ accessToken, refreshToken });
  },
  logout: () => {
    localStorage.removeItem(AUTH_KEY);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));