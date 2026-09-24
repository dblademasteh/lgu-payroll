import { api } from './client.js';

export async function getPreferences() {
  const { data } = await api.get('/settings/preferences');
  return data;
}

export async function updatePreferences(preferences) {
  const { data } = await api.patch('/settings/preferences', preferences);
  return data;
}

export async function getIntegrationConfig() {
  const { data } = await api.get('/settings/integration');
  return data;
}

export async function updateIntegrationConfig(config) {
  const { data } = await api.patch('/settings/integration', config);
  return data;
}

export async function testIntegration() {
  const { data } = await api.post('/settings/integration/test');
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
  return data;
}