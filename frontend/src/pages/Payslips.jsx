import { useState } from 'react';
import { Search, Filter, Download, Eye, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';

export default function Payslips() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const periods = ['January 2025', 'December 2024', 'November 2024', 'October 2024'];

  const payslips = [
    { id: '1', employee: 'Juan Dela Cruz', employeeNo: 'EMP-001', department: 'Admin', period: 'January 2025', grossPay: '₱25,000', deductions: '₱3,500', netPay: '₱21,500', status: 'GENERATED' },
    { id: '2', employee: 'Maria Santos', employeeNo: 'EMP-002', department: 'HR', period: 'January 2025', grossPay: '₱30,000', deductions: '₱4,200', netPay: '₱25,800', status: 'GENERATED' },
    { id: '3', employee: 'Pedro Garcia', employeeNo: 'EMP-003', department: 'Engineering', period: 'January 2025', grossPay: '₱35,000', deductions: '₱5,100', netPay: '₱29,900', status: 'GENERATED' },
    { id: '4', employee: 'Ana Reyes', employeeNo: 'EMP-004', department: 'Finance', period: 'January 2025', grossPay: '₱28,000', deductions: '₱3,800', netPay: '₱24,200', status: 'PENDING' },
    { id: '5', employee: 'Jose Mendoza', employeeNo: 'EMP-005', department: 'Operations', period: 'January 2025', grossPay: '₱22,000', deductions: '₱2,900', netPay: '₱19,100', status: 'GENERATED' },
  ];

  const filteredPayslips = payslips.filter((p) => {
    const matchesSearch = p.employee.toLowerCase().includes(search.toLowerCase()) ||
      p.employeeNo.toLowerCase().includes(search.toLowerCase());
    const matchesPeriod = periodFilter === 'all' || p.period === periodFilter;
    return matchesSearch && matchesPeriod;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'GENERATED': return 'badge-success';
      case 'PENDING': return 'badge-warning';
      case 'DISTRIBUTED': return 'badge-accent';
      default: return 'badge-muted';
    }
  };

  const handleView = (payslip) => {
    toast(`View payslip for ${payslip.employee} - to be implemented`, 'info');
  };

  const handleDownload = (payslip) => {
    toast(`Download payslip for ${payslip.employee} - to be implemented`, 'info');
  };

  const handleGenerate = () => {
    toast('Generate payslips - to be implemented', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Payslips</h1>
          <p className="text-sm text-muted mt-0.5">View and distribute employee payslips</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleGenerate}>
          <Download size={16} aria-hidden="true" /> Generate Payslips
        </button>
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
          <div className="flex items-center gap-2">
            <Filter className="text-muted" size={16} aria-hidden="true" />
            <select
              className="select pr-8"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="all">All Periods</option>
              {periods.map((p) => <option key={p} value={p}>{p}</option>)}
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
                <th>Employee</th>
                <th>Employee No.</th>
                <th>Department</th>
                <th>Period</th>
                <th>Gross Pay</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th className="w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted">No payslips found</td>
                </tr>
              ) : (
                filteredPayslips.map((p) => (
                  <tr key={p.id} data-selectable="true">
                    <td className="font-medium text-ink">{p.employee}</td>
                    <td className="font-mono text-sm">{p.employeeNo}</td>
                    <td>{p.department}</td>
                    <td>{p.period}</td>
                    <td className="font-mono">{p.grossPay}</td>
                    <td className="font-mono text-error">{p.deductions}</td>
                    <td className="font-mono font-semibold text-success">{p.netPay}</td>
                    <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost p-1.5"
                          onClick={() => handleView(p)}
                          title="View"
                          disabled={loading}
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