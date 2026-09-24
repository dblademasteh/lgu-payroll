import { api } from './client.js';

export async function getDeductions(params = {}) {
  const { data } = await api.get('/deductions', { params });
  return data;
}

export async function getDeduction(id) {
  const { data } = await api.get(`/deductions/${id}`);
  return data;
}

export async function createDeduction(deduction) {
  const { data } = await api.post('/deductions', deduction);
  return data;
}

export async function updateDeduction(id, deduction) {
  const { data } = await api.patch(`/deductions/${id}`, deduction);
  return data;
}

export async function deleteDeduction(id) {
  const { data } = await api.delete(`/deductions/${id}`);
  return data;
}