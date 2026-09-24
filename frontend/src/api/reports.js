import { api } from './client.js';

export async function getReports(params = {}) {
  const { data } = await api.get('/reports', { params });
  return data;
}

export async function generateReport(params) {
  const { data } = await api.post('/reports/generate', params);
  return data;
}

export async function getPayrollRunsForPeriods() {
  const { data } = await api.get('/payroll', { params: { limit: 100, page: 1 } });
  return data.data || [];
}