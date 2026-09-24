import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Loader2, Send, CheckCheck } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { getPayslips, getPayslip, distributePayslip, bulkDistributePayslips, downloadPayslipPDF } from '../api/payslips.js';
import { getPayrollRunsForPeriods } from '../api/payroll.js';
import { formatCurrency } from '../lib/format.js';
import { getStatusTone } from '../lib/tones.js';

export default function Payslips() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [payslips, setPayslips] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [actionLoading, setActionLoading] = useState(null);
  const [viewData, setViewData] = useState(null);

  // Load periods (payroll runs) for filter dropdown
  useEffect(() => {
    async function loadPeriods() {
      try {
        const runs = await getPayrollRunsForPeriods();
        setPeriods(runs.map(r => ({ value: r.id, label: r.name || r.period, period: r.period })));
      } catch (e) {
        console.error('Failed to load periods:', e);
      }
    }
    loadPeriods();
  }, []);

  // Load payslips when filters change
  useEffect(() => {
    loadPayslips();
  }, [pagination.page, periodFilter, statusFilter]);

  async function loadPayslips() {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (periodFilter && periodFilter !== 'all') params.runId = periodFilter;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const res = await getPayslips(params);
      setPayslips(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      console.error('Failed to load payslips:', e);
      toast('Failed to load payslips', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredPayslips = payslips.filter((p) => {
    const matchesSearch = (p.employee?.firstName + ' ' + p.employee?.lastName).toLowerCase().includes(search.toLowerCase()) ||
      p.employee?.employeeNumber?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  async function handleView(payslip) {
    try {
      const res = await getPayslip(payslip.id);
      setViewData(res.data);
    } catch (e) {
      toast('Failed to load payslip details', 'error');
    }
  }

  async function handleDistribute(payslip) {
    if (payslip.status !== 'GENERATED') {
      toast('Only generated payslips can be distributed', 'warning');
      return;
    }
    setActionLoading(payslip.id);
    try {
      await distributePayslip(payslip.id);
      toast(`Payslip for ${payslip.employee?.firstName} ${payslip.employee?.lastName} distributed`, 'success');
      loadPayslips();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Failed to distribute payslip';
      toast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkDistribute() {
    if (!periodFilter || periodFilter === 'all') {
      toast('Please select a payroll period first', 'warning');
      return;
    }
    setActionLoading('bulk');
    try {
      await bulkDistributePayslips(periodFilter);
      toast('All generated payslips for this period distributed', 'success');
      loadPayslips();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Failed to bulk distribute';
      toast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDownload(payslip) {
    try {
      const blob = await downloadPayslipPDF(payslip.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslip.employee?.employeeNumber}-${payslip.payrollRun?.period}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast('Payslip downloaded', 'success');
    } catch (e) {
      toast('Failed to download payslip', 'error');
    }
  }

  const hasGeneratedPayslips = payslips.some(p => p.status === 'GENERATED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Payslips</h1>
          <p className="text-sm text-muted mt-0.5">View and distribute employee payslips</p>
        </div>
        <div className="flex gap-2">
          {periodFilter && periodFilter !== 'all' && hasGeneratedPayslips && (
            <button
              type="button"
              className="btn btn-accent"
              onClick={handleBulkDistribute}
              disabled={actionLoading === 'bulk'}
            >
              <CheckCheck size={16} aria-hidden="true" /> Distribute All
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search employee..."
              className="input pl-9 pr-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="text-muted" size={16} aria-hidden="true" />
            <select
              className="select pr-8"
              value={periodFilter}
              onChange={(e) => { setPeriodFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="all">All Periods</option>
              {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select
              className="select pr-8"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="GENERATED">Generated</option>
              <option value="DISTRIBUTED">Distributed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button type="button" className="btn btn-outline" title="Export" disabled={loading}>
              <Download size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <table className="data-table min-w-[1100px]">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee No.</th>
                <th>Department</th>
                <th>Period</th>
                <th>Gross Pay</th>
                <th>Deductions</th>
                <th>Tax</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th className="w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-muted">
                      <Loader2 size={20} className="animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState title="No payslips found" />
                  </td>
                </tr>
              ) : (
                filteredPayslips.map((p) => {
                  const record = p.payrollRecord;
                  const emp = p.employee;
                  const run = p.payrollRun;
                  return (
                    <tr key={p.id} data-selectable="true">
                      <td className="font-medium text-ink">{emp?.firstName} {emp?.lastName}</td>
                      <td className="font-mono text-sm">{emp?.employeeNumber}</td>
                      <td>{emp?.department || '—'}</td>
                      <td>{run?.name || run?.period}</td>
                      <td className="font-mono">{formatCurrency(record?.grossPay)}</td>
                      <td className="font-mono text-error">{formatCurrency(record?.totalDeductions)}</td>
                      <td className="font-mono text-warning">{formatCurrency(record?.withholdingTax)}</td>
                      <td className="font-mono font-semibold text-success">{formatCurrency(record?.netPay)}</td>
                      <td><Badge tone={getStatusTone(p.status, 'payslip')}>{p.status}</Badge></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost p-1.5"
                            onClick={() => handleView(p)}
                            title="View Details"
                            disabled={actionLoading === p.id}
                          >
                            <Eye size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm px-2 py-1.5 text-xs"
                            onClick={() => handleDownload(p)}
                            disabled={loading}
                          >
                            <Download size={12} aria-hidden="true" />
                          </button>
                          {p.status === 'GENERATED' && (
                            <button
                              type="button"
                              className="btn btn-accent btn-sm px-2 py-1.5 text-xs"
                              onClick={() => handleDistribute(p)}
                              disabled={actionLoading === p.id}
                            >
                              {actionLoading === p.id && <Loader2 size={12} className="animate-spin" />}
                              <Send size={12} aria-hidden="true" /> Distribute
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          loading={loading}
          onPageChange={(page) => setPagination(p => ({ ...p, page }))}
        />
      </div>

      {/* Payslip Details Modal */}
      <Modal
        open={!!viewData}
        onClose={() => setViewData(null)}
        title="Payslip Details"
        size="lg"
        footer={
          <button type="button" className="btn btn-primary" onClick={() => setViewData(null)}>Close</button>
        }
      >
        {viewData && (() => {
          const emp = viewData.employee;
          const record = viewData.payrollRecord;
          const run = viewData.payrollRun;
          const details = record?.details || [];
          return (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div>
                  <p className="font-medium text-ink text-lg">{emp?.firstName} {emp?.lastName}</p>
                  <p className="text-sm text-muted mt-0.5">{emp?.employeeNumber} · {emp?.department || 'No department'}</p>
                </div>
                <Badge tone={getStatusTone(viewData.status, 'payslip')}>{viewData.status}</Badge>
              </div>
              <div className="rounded-xl border border-line bg-bg/50 p-4">
                <p className="mono-label">Payroll Period</p>
                <p className="text-sm text-ink mt-1">{run?.name || run?.period}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="mono-label">Gross Pay</p>
                  <p className="font-mono text-ink mt-0.5">{formatCurrency(record?.grossPay)}</p>
                </div>
                <div>
                  <p className="mono-label">Deductions</p>
                  <p className="font-mono text-error mt-0.5">{formatCurrency(record?.totalDeductions)}</p>
                </div>
                <div>
                  <p className="mono-label">Withholding Tax</p>
                  <p className="font-mono text-warning mt-0.5">{formatCurrency(record?.withholdingTax)}</p>
                </div>
                <div>
                  <p className="mono-label">Net Pay</p>
                  <p className="font-mono font-semibold text-success mt-0.5">{formatCurrency(record?.netPay)}</p>
                </div>
              </div>
              {details.length > 0 && (
                <div className="rounded-xl border border-line overflow-hidden">
                  <div className="px-4 py-2.5 bg-bg/50 border-b border-line">
                    <p className="mono-label">Deduction Breakdown</p>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Deduction</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((d, i) => (
                        <tr key={i}>
                          <td>{d.name}</td>
                          <td className="font-mono text-right">{formatCurrency(d.computedAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}