import { api } from './client.js';

export async function getPayrollRuns(params = {}) {
  const { data } = await api.get('/payroll', { params });
  return data;
}

export async function getPayrollRun(id) {
  const { data } = await api.get(`/payroll/${id}`);
  return data;
}

export async function createPayrollRun(period, name, remarks) {
  const { data } = await api.post('/payroll', { period, name, remarks });
  return data;
}

export async function updatePayrollRun(id, updates) {
  const { data } = await api.patch(`/payroll/${id}`, updates);
  return data;
}

export async function processPayrollRun(id) {
  const { data } = await api.post(`/payroll/${id}/process`);
  return data;
}

export async function approvePayrollRun(id) {
  const { data } = await api.post(`/payroll/${id}/approve`);
  return data;
}

export async function completePayrollRun(id) {
  const { data } = await api.post(`/payroll/${id}/complete`);
  return data;
}

export async function getPayrollRunsForPeriods() {
  const { data } = await api.get('/payroll', { params: { limit: 100, page: 1 } });
  return data.data || [];
}