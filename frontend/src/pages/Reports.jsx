import { useState, useEffect } from 'react';
import { Download, FileText, BarChart3, Calculator, Calendar, RefreshCw, Loader2, ChevronRight, DollarSign, Users } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import Badge from '../components/Badge.jsx';
import { getReports, generateReport, getPayrollRunsForPeriods } from '../api/reports.js';
import StatCard from '../components/StatCard.jsx';
import { formatCurrency, formatNumber } from '../lib/format.js';
import { getCategoryTone } from '../lib/tones.js';

const REPORT_TYPES = [
  { id: 'payroll-summary', name: 'Payroll Summary', description: 'Overview of gross pay, deductions, and net pay for the period', icon: FileText, category: 'PAYROLL' },
  { id: 'payslip-register', name: 'Payslip Register', description: 'Detailed list of all employee payslips with breakdown', icon: FileText, category: 'PAYROLL' },
  { id: 'deductions-summary', name: 'Deductions Summary', description: 'Summary of all deductions by type and employee', icon: Calculator, category: 'DEDUCTIONS' },
  { id: 'government-contributions', name: 'Government Contributions', description: 'SSS, PhilHealth, Pag-IBIG remittance report', icon: Calculator, category: 'GOVERNMENT' },
  { id: 'tax-withholding', name: 'Tax Withholding Report', description: 'BIR Form 1601-C / 2316 data for tax filing', icon: FileText, category: 'TAX' },
  { id: 'department-cost', name: 'Department Cost Analysis', description: 'Payroll costs broken down by department', icon: BarChart3, category: 'ANALYSIS' },
  { id: 'overtime-report', name: 'Overtime Report', description: 'Overtime hours and pay by employee and department', icon: Calendar, category: 'PAYROLL' },
  { id: 'leave-liability', name: 'Leave Liability', description: 'Accrued leave balances and monetary value', icon: Calendar, category: 'ANALYSIS' },
  { id: 'year-end', name: 'Year-End Reports (13th Month, 2316)', description: 'Annual reports for BIR compliance', icon: FileText, category: 'TAX' },
];

export default function Reports() {
  const toast = useToast();
  const [period, setPeriod] = useState('');
  const [reportType, setReportType] = useState('all');
  const [periods, setPeriods] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Load available periods (payroll runs)
  useEffect(() => {
    async function loadPeriods() {
      try {
        const runs = await getPayrollRunsForPeriods();
        const periodOptions = runs.map(r => ({ value: r.period, label: r.name || r.period }));
        setPeriods(periodOptions);
        if (periodOptions.length > 0 && !period) {
          setPeriod(periodOptions[0].value);
        }
      } catch (e) {
        console.error('Failed to load periods:', e);
      }
    }
    loadPeriods();
  }, []);

  // Load report when period or type changes
  useEffect(() => {
    if (!period) return;
    loadReport();
  }, [period, reportType]);

  async function loadReport() {
    setLoading(true);
    try {
      const params = { period };
      if (reportType && reportType !== 'all') params.type = reportType;
      const res = await getReports(params);
      setReportData(res.data);
      setShowDetail(true);
    } catch (e) {
      console.error('Failed to load report:', e);
      toast('Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(report) {
    setGenerating(report.id);
    try {
      await generateReport({ period, type: report.id, format: 'json' });
      toast(`${report.name} generated`, 'success');
      loadReport();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Failed to generate report';
      toast(msg, 'error');
    } finally {
      setGenerating(null);
    }
  }

  async function handleDownload(report) {
    toast('PDF/Excel download - to be implemented', 'info');
  }

  function renderReportContent() {
    if (!reportData) return null;

    if (reportType === 'all' || !reportType) {
      // Show all report summaries
      const reports = reportData.reports || [];
      return (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.type} className="card p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-ink capitalize">{r.type.replace(/-/g, ' ')}</h4>
                <Badge tone={getCategoryTone(r.type?.split('-')[1]?.toUpperCase() || 'ANALYSIS')}>{r.type}</Badge>
              </div>
              <pre className="mt-2 text-xs text-muted overflow-auto max-h-64">{JSON.stringify(r, null, 2)}</pre>
            </div>
          ))}
        </div>
      );
    }

    // Render specific report type
    switch (reportType) {
      case 'payroll-summary': {
        const r = reportData;
        if (!r || r.message) return <p className="text-center text-muted py-8">{r.message || 'No data'}</p>;
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <StatCard label="Total Employees" value={formatNumber(r.totalEmployees)} icon={Users} />
              <StatCard label="Total Gross Pay" value={formatCurrency(r.totalGrossPay)} icon={DollarSign} />
              <StatCard label="Total Deductions" value={formatCurrency(r.totalDeductions)} icon={Calculator} />
              <StatCard label="Total Net Pay" value={formatCurrency(r.totalNetPay)} icon={FileText} />
            </div>
            {r.employees && r.employees.length > 0 && (
              <div className="card">
                <h4 className="font-semibold text-ink mb-3 p-4 border-b border-line">Employee Breakdown</h4>
                <table className="data-table min-w-[1000px]">
                  <thead>
                    <tr>
                      <th>Employee No.</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Basic Salary</th>
                      <th>Gross Pay</th>
                      <th>Deductions</th>
                      <th>Tax</th>
                      <th>Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.employees.map((emp) => (
                      <tr key={emp.employeeNumber}>
                        <td className="font-mono text-sm">{emp.employeeNumber}</td>
                        <td className="font-medium text-ink">{emp.name}</td>
                        <td>{emp.department}</td>
                        <td className="font-mono">{formatCurrency(emp.basicSalary)}</td>
                        <td className="font-mono">{formatCurrency(emp.grossPay)}</td>
                        <td className="font-mono text-error">{formatCurrency(emp.totalDeductions)}</td>
                        <td className="font-mono text-warning">{formatCurrency(emp.withholdingTax)}</td>
                        <td className="font-mono font-semibold text-success">{formatCurrency(emp.netPay)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }

      case 'deductions-summary': {
        const r = reportData;
        if (!r || !r.deductions) return <p className="text-center text-muted py-8">No data</p>;
        return (
          <div className="card">
            <h4 className="font-semibold text-ink mb-3 p-4 border-b border-line">Deductions Summary</h4>
            <table className="data-table min-w-[700px]">
              <thead>
                <tr>
                  <th>Deduction</th>
                  <th>Type</th>
                  <th>Total Amount</th>
                  <th>Employee Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(r.deductions).map(([name, data]) => (
                  <tr key={name}>
                    <td className="font-medium text-ink">{name}</td>
                    <td><Badge tone={getCategoryTone(data.type)}>{data.type}</Badge></td>
                    <td className="font-mono text-error">{formatCurrency(data.total)}</td>
                    <td>{data.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'government-contributions': {
        const r = reportData;
        if (!r || !r.contributions) return <p className="text-center text-muted py-8">No data</p>;
        return (
          <div className="space-y-4">
            {Object.entries(r.contributions).map(([name, data]) => (
              <div key={name} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-ink">{name}</h4>
                  <span className="font-mono text-success">{formatCurrency(data.total)}</span>
                </div>
                <table className="data-table min-w-[600px]">
                  <thead>
                    <tr>
                      <th>Employee No.</th>
                      <th>Name</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.employees.map((emp) => (
                      <tr key={emp.employeeNumber}>
                        <td className="font-mono text-sm">{emp.employeeNumber}</td>
                        <td>{emp.name}</td>
                        <td className="font-mono">{formatCurrency(emp.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        );
      }

      case 'tax-withholding': {
        const r = reportData;
        if (!r || r.message) return <p className="text-center text-muted py-8">{r.message || 'No data'}</p>;
        return (
          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-ink">Total Withholding Tax</h4>
                <span className="font-mono text-2xl text-error">{formatCurrency(r.totalWithholdingTax)}</span>
              </div>
            </div>
            {r.employees && r.employees.length > 0 && (
              <div className="card">
                <h4 className="font-semibold text-ink mb-3 p-4 border-b border-line">Employee Tax Breakdown</h4>
                <table className="data-table min-w-[700px]">
                  <thead>
                    <tr>
                      <th>Employee No.</th>
                      <th>Name</th>
                      <th>Taxable Income</th>
                      <th>Withholding Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.employees.map((emp) => (
                      <tr key={emp.employeeNumber}>
                        <td className="font-mono text-sm">{emp.employeeNumber}</td>
                        <td className="font-medium text-ink">{emp.name}</td>
                        <td className="font-mono">{formatCurrency(emp.taxableIncome)}</td>
                        <td className="font-mono text-error">{formatCurrency(emp.withholdingTax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }

      case 'department-cost': {
        const r = reportData;
        if (!r || !r.departments) return <p className="text-center text-muted py-8">No data</p>;
        return (
          <div className="card">
            <h4 className="font-semibold text-ink mb-3 p-4 border-b border-line">Department Cost Analysis</h4>
            <table className="data-table min-w-[700px]">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(r.departments).map(([dept, data]) => (
                  <tr key={dept}>
                    <td className="font-medium text-ink">{dept}</td>
                    <td>{data.employees}</td>
                    <td className="font-mono">{formatCurrency(data.grossPay)}</td>
                    <td className="font-mono text-error">{formatCurrency(data.deductions)}</td>
                    <td className="font-mono font-semibold text-success">{formatCurrency(data.netPay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      default:
        return (
          <div className="card p-8">
            <pre className="text-xs text-muted overflow-auto max-h-96">{JSON.stringify(reportData, null, 2)}</pre>
          </div>
        );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Reports</h1>
          <p className="text-sm text-muted mt-0.5">Generate and export payroll reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="text-muted" size={16} aria-hidden="true" />
          <select
            className="select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            disabled={periods.length === 0}
          >
            {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            {periods.length === 0 && <option value="">No payroll periods available</option>}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_TYPES.map((report) => (
          <div
            key={report.id}
            className="card p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => { setReportType(report.id); setShowDetail(true); }}
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent grid place-items-center shrink-0 ring-1 ring-accent/10">
                <report.icon size={18} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink truncate">{report.name}</h3>
                  <span><Badge tone={getCategoryTone(report.category)}>{report.category}</Badge></span>
                </div>
                <p className="text-sm text-muted mt-1 line-clamp-2">{report.description}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-line">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm text-xs flex-1"
                    onClick={(e) => { e.stopPropagation(); handleGenerate(report); }}
                    disabled={generating === report.id || !period}
                  >
                    {generating === report.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} aria-hidden="true" />}
                    {generating === report.id ? 'Generating...' : 'Generate'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm text-xs"
                    onClick={(e) => { e.stopPropagation(); handleDownload(report); }}
                    disabled={!period}
                  >
                    <Download size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showDetail && (
        <div className="card">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink">
              {REPORT_TYPES.find(r => r.id === reportType)?.name || 'Report'}
              {period && <span className="text-sm text-muted ml-2">({period})</span>}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setReportType('all')}
              >
                <ChevronRight size={14} aria-hidden="true" /> View All
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={loadReport}
                disabled={loading}
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} aria-hidden="true" />}
                Refresh
              </button>
            </div>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-accent" />
              </div>
            ) : (
              renderReportContent()
            )}
          </div>
        </div>
      )}
    </div>
  );
}