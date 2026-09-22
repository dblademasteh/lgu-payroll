import { useState } from 'react';
import { Plus, Search, Filter, Download, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';

export default function Payroll() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const runs = [
    { id: '1', period: 'January 2025', status: 'DRAFT', employees: 284, grossTotal: '₱3,200,000', netTotal: '₱2,847,500', createdAt: '2025-01-15', processedAt: null },
    { id: '2', period: 'December 2024', status: 'COMPLETED', employees: 278, grossTotal: '₱3,120,000', netTotal: '₱2,780,000', createdAt: '2024-12-10', processedAt: '2024-12-20' },
    { id: '3', period: 'November 2024', status: 'COMPLETED', employees: 275, grossTotal: '₱3,050,000', netTotal: '₱2,712,500', createdAt: '2024-11-08', processedAt: '2024-11-29' },
    { id: '4', period: 'October 2024', status: 'COMPLETED', employees: 270, grossTotal: '₱2,980,000', netTotal: '₱2,650,000', createdAt: '2024-10-12', processedAt: '2024-10-25' },
  ];

  const filteredRuns = runs.filter((run) => {
    const matchesSearch = run.period.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED': return 'badge-success';
      case 'PROCESSING': return 'badge-accent';
      case 'DRAFT': return 'badge-muted';
      case 'APPROVED': return 'badge-warning';
      default: return 'badge-muted';
    }
  };

  const handleCreateRun = () => {
    toast('Create payroll run - to be implemented', 'info');
  };

  const handleProcess = (run) => {
    toast(`Process ${run.period} - to be implemented`, 'info');
  };

  const handleView = (run) => {
    toast(`View ${run.period} details - to be implemented`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Payroll Runs</h1>
          <p className="text-sm text-muted mt-0.5">Manage payroll periods and processing</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleCreateRun}>
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
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PROCESSING">Processing</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <button type="button" className="btn btn-outline" title="Export">
              <Download size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Status</th>
                <th>Employees</th>
                <th>Gross Total</th>
                <th>Net Total</th>
                <th>Created</th>
                <th>Processed</th>
                <th className="w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted">No payroll runs found</td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <tr key={run.id} data-selectable="true">
                    <td className="font-medium text-ink">{run.period}</td>
                    <td><span className={`badge ${getStatusBadge(run.status)}`}>{run.status}</span></td>
                    <td>{run.employees}</td>
                    <td className="font-mono">{run.grossTotal}</td>
                    <td className="font-mono font-semibold">{run.netTotal}</td>
                    <td className="font-mono text-sm">{run.createdAt}</td>
                    <td className="font-mono text-sm">{run.processedAt ?? '—'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost p-1.5"
                          onClick={() => handleView(run)}
                          title="View"
                          disabled={loading}
                        >
                          <Calendar size={14} aria-hidden="true" />
                        </button>
                        {run.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm px-2 py-1.5 text-xs"
                            onClick={() => handleProcess(run)}
                            disabled={loading}
                          >
                            {loading && <Loader2 size={12} className="animate-spin" />}
                            Process
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}