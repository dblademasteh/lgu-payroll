import { api } from './client.js';

export async function login(username, password) {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
}

export async function refresh(refreshToken) {
  const { data } = await api.post('/auth/refresh', { refreshToken });
  return data;
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
  return data;
}