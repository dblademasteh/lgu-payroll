import { useState } from 'react';
import { Download, FileText, BarChart3, Calculator, Calendar, RefreshCw } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';

export default function Reports() {
  const toast = useToast();
  const [period, setPeriod] = useState('January 2025');
  const [reportType, setReportType] = useState('payroll-summary');

  const periods = ['January 2025', 'December 2024', 'November 2024', 'October 2024', 'September 2024', 'August 2024'];

  const reports = [
    { id: 'payroll-summary', name: 'Payroll Summary', description: 'Overview of gross pay, deductions, and net pay for the period', icon: FileText, category: 'PAYROLL' },
    { id: 'payslip-register', name: 'Payslip Register', description: 'Detailed list of all employee payslips with breakdown', icon: FileText, category: 'PAYROLL' },
    { id: 'deductions-summary', name: 'Deductions Summary', description: 'Summary of all deductions by type and employee', icon: Calculator, category: 'DEDUCTIONS' },
    { id: 'government-contributions', name: 'Government Contributions', description: 'SSS, PhilHealth, Pag-IBIG remittance report', icon: Calculator, category: 'GOVERNMENT' },
    { id: 'tax-withholding', name: 'Tax Withholding Report', description: 'BIR Form 1601-C / 2316 data for tax filing', icon: FileText, category: 'TAX' },
    { id: 'department-cost', name: 'Department Cost Analysis', description: 'Payroll costs broken down by department', icon: BarChart3, category: 'ANALYSIS' },
    { id: 'overtime-report', name: 'Overtime Report', description: 'Overtime hours and pay by employee and department', icon: Clock, category: 'PAYROLL' },
    { id: 'leave-liability', name: 'Leave Liability', description: 'Accrued leave balances and monetary value', icon: Calendar, category: 'ANALYSIS' },
    { id: 'year-end', name: 'Year-End Reports (13th Month, 2316)', description: 'Annual reports for BIR compliance', icon: FileText, category: 'TAX' },
  ];

  const categoryColors = {
    PAYROLL: 'badge-accent',
    DEDUCTIONS: 'badge-warning',
    GOVERNMENT: 'badge-success',
    TAX: 'badge-error',
    ANALYSIS: 'badge-muted',
  };

  const handleGenerate = (report) => {
    toast(`Generating ${report.name} for ${period}...`, 'info');
    setTimeout(() => {
      toast(`${report.name} generated successfully`, 'success');
    }, 1500);
  };

  const handleDownload = (report) => {
    toast(`Downloading ${report.name}...`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Reports</h1>
          <p className="text-sm text-muted mt-0.5">Generate and export payroll reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="text-muted" size={16} aria-hidden="true" />
          <select className="select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {periods.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div key={report.id} className="card p-5 hover:shadow-lg transition-shadow" onClick={() => handleGenerate(report)}>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent grid place-items-center shrink-0 ring-1 ring-accent/10">
                <report.icon size={18} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink truncate">{report.name}</h3>
                  <span className={`badge ${categoryColors[report.category]}`}>{report.category}</span>
                </div>
                <p className="text-sm text-muted mt-1 line-clamp-2">{report.description}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-line">
                  <button type="button" className="btn btn-primary btn-sm text-xs flex-1" onClick={(e) => { e.stopPropagation(); handleGenerate(report); }}>
                    <RefreshCw size={12} aria-hidden="true" /> Generate
                  </button>
                  <button type="button" className="btn btn-outline btn-sm text-xs" onClick={(e) => { e.stopPropagation(); handleDownload(report); }}>
                    <Download size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}