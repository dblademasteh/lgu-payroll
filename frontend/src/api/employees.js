import { api } from './client.js';

export async function getEmployees(params = {}) {
  const { data } = await api.get('/employees', { params });
  return data;
}

export async function getEmployeeDepartments() {
  const { data } = await api.get('/employees/departments');
  return data;
}

export async function getEmployee(id) {
  const { data } = await api.get(`/employees/${id}`);
  return data;
}

export async function createEmployee(employee) {
  const { data } = await api.post('/employees', employee);
  return data;
}

export async function updateEmployee(id, employee) {
  const { data } = await api.patch(`/employees/${id}`, employee);
  return data;
}

export async function deleteEmployee(id) {
  const { data } = await api.delete(`/employees/${id}`);
  return data;
}