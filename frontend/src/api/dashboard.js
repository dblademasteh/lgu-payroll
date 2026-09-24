import { api } from './client.js';

export async function getDashboardStats() {
  const { data } = await api.get('/reports', { params: { type: 'all' } });
  return data;
}

export async function getRecentPayrollRuns(limit = 5) {
  const { data } = await api.get('/payroll', { params: { limit, page: 1 } });
  return data;
}

export async function getUpcomingDeadlines() {
  // This could be computed from payroll runs, holidays, and tax deadlines
  // For now, return static data that could be enhanced later
  return { data: [] };
}