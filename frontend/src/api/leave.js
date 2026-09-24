import { api } from './client.js';

export async function getLeaveRequests(params = {}) {
  const { data } = await api.get('/leave', { params });
  return data;
}

export async function getLeaveRequest(id) {
  const { data } = await api.get(`/leave/${id}`);
  return data;
}

export async function createLeaveRequest(leave) {
  const { data } = await api.post('/leave', leave);
  return data;
}

export async function updateLeaveRequest(id, leave) {
  const { data } = await api.patch(`/leave/${id}`, leave);
  return data;
}

export async function deleteLeaveRequest(id) {
  const { data } = await api.delete(`/leave/${id}`);
  return data;
}

export async function getHolidays() {
  const { data } = await api.get('/leave/holidays');
  return data;
}

export async function createHoliday(holiday) {
  const { data } = await api.post('/leave/holidays', holiday);
  return data;
}

export async function deleteHoliday(id) {
  const { data } = await api.delete(`/leave/holidays/${id}`);
  return data;
}