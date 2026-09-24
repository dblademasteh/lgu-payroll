import { api } from './client.js';

export async function getPayslips(params = {}) {
  const { data } = await api.get('/payslips', { params });
  return data;
}

export async function getPayslip(id) {
  const { data } = await api.get(`/payslips/${id}`);
  return data;
}

export async function distributePayslip(id) {
  const { data } = await api.post(`/payslips/${id}/distribute`);
  return data;
}

export async function bulkDistributePayslips(runId) {
  const { data } = await api.post('/payslips/bulk-distribute', { runId });
  return data;
}

export async function downloadPayslipPDF(id) {
  const response = await api.get(`/payslips/${id}/pdf`, { responseType: 'blob' });
  return response.data;
}