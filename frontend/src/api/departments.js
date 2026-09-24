import { api } from './client.js';

export async function getDepartments(params = {}) {
  const { data } = await api.get('/departments', { params });
  return data;
}

export async function getDepartment(id) {
  const { data } = await api.get(`/departments/${id}`);
  return data;
}

export async function createDepartment(department) {
  const { data } = await api.post('/departments', department);
  return data;
}

export async function updateDepartment(id, department) {
  const { data } = await api.patch(`/departments/${id}`, department);
  return data;
}

export async function deleteDepartment(id) {
  const { data } = await api.delete(`/departments/${id}`);
  return data;
}

export async function getEmployeesForHead() {
  // Get active employees for department head selection
  const { data } = await api.get('/employees', { params: { status: 'ACTIVE', limit: 1000 } });
  return data.data || [];
}