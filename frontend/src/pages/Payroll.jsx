import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Loader2, Eye, Play, Check, CheckCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { getPayrollRuns, createPayrollRun, processPayrollRun, approvePayrollRun, completePayrollRun, getPayrollRun } from '../api/payroll.js';
import { formatCurrency } from '../lib/format.js';
import { getStatusTone } from '../lib/tones.js';

function getStatusIcon(status) {
  switch (status) {
    case 'COMPLETED': return CheckCheck;
    case 'PROCESSING': return Loader2;
    case 'APPROVED': return Check;
    case 'DRAFT': return AlertTriangle;
    default: return AlertTriangle;
  }
}

export default function Payroll() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ period: '', name: '', remarks: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [viewRun, setViewRun] = useState(null);

  useEffect(() => {
    loadRuns();
  }, [pagination.page, statusFilter]);

  async function loadRuns() {
    setLoading(true);
    try {
      const res = await getPayrollRuns({ page: pagination.page, limit: pagination.limit, status: statusFilter });
      setRuns(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      console.error('Failed to load payroll runs:', e);
      toast('Failed to load payroll runs', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredRuns = runs.filter((run) => {
    const matchesSearch = (run.name || run.period).toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  async function handleCreateRun(e) {
    e.preventDefault();
    if (!createForm.period || !createForm.name) {
      toast('Period and name are required', 'error');
      return;
    }
    setCreateLoading(true);
    try {
      await createPayrollRun(createForm.period, createForm.name, createForm.remarks);
      toast('Payroll run created', 'success');
      setShowCreateModal(false);
      setCreateForm({ period: '', name: '', remarks: '' });
      loadRuns();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Failed to create payroll run';
      toast(msg, 'error');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleAction(run, action) {
    setActionLoading(run.id);
    try {
      if (action === 'process') {
        await processPayrollRun(run.id);
        toast(`${run.name || run.period} processed`, 'success');
      } else if (action === 'approve') {
        await approvePayrollRun(run.id);
        toast(`${run.name || run.period} approved`, 'success');
      } else if (action === 'complete') {
        await completePayrollRun(run.id);
        toast(`${run.name || run.period} completed and payslips generated`, 'success');
      }
      loadRuns();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || `Failed to ${action} payroll run`;
      toast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleView(run) {
    try {
      const res = await getPayrollRun(run.id);
      setViewRun(res.data);
    } catch (e) {
      toast('Failed to load payroll run details', 'error');
    }
  }

  const canProcess = (run) => run.status === 'DRAFT' || run.status === 'APPROVED';
  const canApprove = (run) => run.status === 'PROCESSING';
  const canComplete = (run) => run.status === 'APPROVED';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Payroll Runs</h1>
          <p className="text-sm text-muted mt-0.5">Manage payroll periods and processing</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} aria-hidden="true" /> New Payroll Run
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search payroll runs..."
              className="input pl-9 pr-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-muted" size={16} aria-hidden="true" />
            <select
              className="select pr-8"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PROCESSING">Processing</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button type="button" className="btn btn-outline" title="Export" disabled={loading}>
              <Download size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>Period</th>
                <th>Name</th>
                <th>Status</th>
                <th>Employees</th>
                <th>Gross Total</th>
                <th>Net Total</th>
                <th>Created</th>
                <th>Processed</th>
                <th className="w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-muted">
                      <Loader2 size={20} className="animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState title="No payroll runs found" />
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <tr key={run.id} data-selectable="true">
                    <td className="font-medium text-ink">{run.period}</td>
                    <td className="text-sm">{run.name}</td>
                    <td>
                      <Badge tone={getStatusTone(run.status)} className="flex items-center gap-1">
                        {(() => {
                          const Icon = getStatusIcon(run.status);
                          return <Icon size={10} aria-hidden="true" />;
                        })()}
                        {run.status}
                      </Badge>
                    </td>
                    <td>{run.totalEmployees}</td>
                    <td className="font-mono">{formatCurrency(run.totalGrossPay)}</td>
                    <td className="font-mono font-semibold">{formatCurrency(run.totalNetPay)}</td>
                    <td className="font-mono text-sm">{run.createdAt ? new Date(run.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="font-mono text-sm">{run.processedAt ? new Date(run.processedAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost p-1.5"
                          onClick={() => handleView(run)}
                          title="View Details"
                          disabled={actionLoading === run.id}
                        >
                          <Eye size={14} aria-hidden="true" />
                        </button>
                        {canProcess(run) && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm px-2 py-1.5 text-xs"
                            onClick={() => handleAction(run, 'process')}
                            disabled={actionLoading === run.id}
                          >
                            {actionLoading === run.id && <Loader2 size={12} className="animate-spin" />}
                            <Play size={12} aria-hidden="true" /> Process
                          </button>
                        )}
                        {canApprove(run) && (
                          <button
                            type="button"
                            className="btn btn-accent btn-sm px-2 py-1.5 text-xs"
                            onClick={() => handleAction(run, 'approve')}
                            disabled={actionLoading === run.id}
                          >
                            {actionLoading === run.id && <Loader2 size={12} className="animate-spin" />}
                            <Check size={12} aria-hidden="true" /> Approve
                          </button>
                        )}
                        {canComplete(run) && (
                          <button
                            type="button"
                            className="btn btn-success btn-sm px-2 py-1.5 text-xs"
                            onClick={() => handleAction(run, 'complete')}
                            disabled={actionLoading === run.id}
                          >
                            {actionLoading === run.id && <Loader2 size={12} className="animate-spin" />}
                            <CheckCheck size={12} aria-hidden="true" /> Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Create Payroll Run Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Payroll Run"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)} disabled={createLoading}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleCreateRun} disabled={createLoading}>
              {createLoading && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateRun} className="space-y-4">
          <div>
            <label className="mono-label">Period (YYYY-MM)</label>
            <input
              type="text"
              className="input mt-1.5"
              placeholder="2025-01"
              value={createForm.period}
              onChange={(e) => setCreateForm({ ...createForm, period: e.target.value })}
              pattern="^\d{4}-\d{2}$"
              required
              maxLength={7}
            />
            <p className="text-xs text-muted mt-1">Format: YYYY-MM (e.g., 2025-01)</p>
          </div>
          <div>
            <label className="mono-label">Name</label>
            <input
              type="text"
              className="input mt-1.5"
              placeholder="January 2025 Payroll"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="mono-label">Remarks (optional)</label>
            <textarea
              className="input mt-1.5 min-h-[80px]"
              placeholder="Additional notes..."
              value={createForm.remarks}
              onChange={(e) => setCreateForm({ ...createForm, remarks: e.target.value })}
              maxLength={1000}
            />
          </div>
        </form>
      </Modal>

      {/* Payroll Run Details Modal */}
      <Modal
        open={!!viewRun}
        onClose={() => setViewRun(null)}
        title={viewRun?.name || 'Payroll Run'}
        size="md"
        footer={
          <button type="button" className="btn btn-primary" onClick={() => setViewRun(null)}>Close</button>
        }
      >
        {viewRun && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="mono-label">Period · {viewRun.period}</p>
              <Badge tone={getStatusTone(viewRun.status)}>{viewRun.status}</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="mono-label">Employees</p>
                <p className="font-mono text-lg text-ink mt-0.5">{viewRun.totalEmployees}</p>
              </div>
              <div>
                <p className="mono-label">Gross Pay</p>
                <p className="font-mono text-lg text-ink mt-0.5">{formatCurrency(viewRun.totalGrossPay)}</p>
              </div>
              <div>
                <p className="mono-label">Net Pay</p>
                <p className="font-mono text-lg text-ink mt-0.5">{formatCurrency(viewRun.totalNetPay)}</p>
              </div>
            </div>
            {viewRun.remarks && (
              <div className="rounded-xl bg-bg/60 border border-line p-4">
                <p className="mono-label">Remarks</p>
                <p className="text-sm text-ink mt-1">{viewRun.remarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}