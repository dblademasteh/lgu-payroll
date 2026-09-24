import { useEffect, useState } from 'react';
import { DollarSign, Users, FileText, Calculator } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import Badge from '../components/Badge.jsx';
import { getDashboardStats, getRecentPayrollRuns } from '../api/dashboard.js';
import { useToast } from '../hooks/useToast.jsx';
import { formatCurrency, formatNumber } from '../lib/format.js';
import { getStatusTone } from '../lib/tones.js';

export default function Dashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsRes, runsRes] = await Promise.all([
          getDashboardStats(),
          getRecentPayrollRuns(5),
        ]);

        // Process stats from reports data
        const reports = statsRes?.reports || [];
        const payrollSummary = reports.find(r => r.type === 'payroll-summary');
        const deductionsSummary = reports.find(r => r.type === 'deductions-summary');
        const govContributions = reports.find(r => r.type === 'government-contributions');
        const taxWithholding = reports.find(r => r.type === 'tax-withholding');

        const totalGross = payrollSummary?.totalGrossPay ? Number(payrollSummary.totalGrossPay) : 0;
        const totalNet = payrollSummary?.totalNetPay ? Number(payrollSummary.totalNetPay) : 0;
        const totalEmployees = payrollSummary?.totalEmployees || 0;
        const avgNet = totalEmployees > 0 ? totalNet / totalEmployees : 0;

        // Get pending payslips count from the latest run
        const latestRun = runsRes?.data?.[0];
        let pendingPayslips = 0;
        if (latestRun?.id) {
          try {
            // We'll just use a reasonable default or fetch separately if needed
            pendingPayslips = 0; // Will be updated when we have payslips API
          } catch (e) {
            // ignore
          }
        }

        setStats([
          { label: 'Total Payroll (Gross)', value: formatCurrency(totalGross), icon: DollarSign, trend: payrollSummary ? `Run: ${payrollSummary.runName}` : 'No data', trendUp: true },
          { label: 'Employees Paid', value: formatNumber(totalEmployees), icon: Users, trend: 'Active employees', trendUp: true },
          { label: 'Net Pay Total', value: formatCurrency(totalNet), icon: Calculator, trend: `Avg: ${formatCurrency(avgNet)}`, trendUp: true },
          { label: 'Withholding Tax', value: formatCurrency(taxWithholding?.totalWithholdingTax || 0), icon: FileText, trend: 'BIR 1601-C', trendUp: false },
        ]);

        setRecentRuns(runsRes?.data || []);
        setError(null);
      } catch (e) {
        console.error('Failed to load dashboard:', e);
        setError('Failed to load dashboard data');
        toast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Overview of payroll operations</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="card p-6 stat animate-pulse">
              <div className="h-4 w-24 bg-line rounded mb-2"></div>
              <div className="h-8 w-32 bg-line rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-6 animate-pulse">
            <div className="h-6 w-48 bg-line rounded mb-4"></div>
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="h-16 bg-line rounded"></div>
              ))}
            </div>
          </div>
          <div className="card p-6 animate-pulse">
            <div className="h-6 w-48 bg-line rounded mb-4"></div>
            <div className="space-y-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-16 bg-line rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && stats.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-error mb-4">Failed to load dashboard</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Overview of payroll operations</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display font-semibold text-ink mb-4">Recent Payroll Runs</h2>
          <div className="space-y-3">
            {recentRuns.length === 0 ? (
              <p className="text-center text-muted py-8">No payroll runs yet</p>
            ) : (
              recentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-4 rounded-lg border border-line hover:bg-bg/60 transition">
                  <div>
                    <p className="font-medium text-ink">{run.name || run.period}</p>
                    <p className="text-sm text-muted">{run.totalEmployees} employees · {formatCurrency(run.totalNetPay)}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={getStatusTone(run.status)}>{run.status}</Badge>
                    <p className="text-xs text-muted mt-1">{run.createdAt ? new Date(run.createdAt).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold text-ink mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            {[
              { title: 'BIR Form 1601-C Filing', date: getNextMonthDate(10), type: 'TAX' },
              { title: 'SSS/PhilHealth/Pag-IBIG Remittance', date: getNextMonthDate(10), type: 'GOVT' },
              { title: 'Next Payroll Run', date: getNextPayrollDate(), type: 'PAYROLL' },
            ].map((deadline) => (
              <div key={deadline.title} className="flex items-center justify-between p-4 rounded-lg border border-line hover:bg-bg/60 transition">
                <div>
                  <p className="font-medium text-ink">{deadline.title}</p>
                  <p className="text-sm text-muted">Due: {deadline.date}</p>
                </div>
                <Badge tone={deadline.type === 'TAX' ? 'error' : deadline.type === 'GOVT' ? 'warning' : deadline.type === 'PAYROLL' ? 'accent' : 'success'}>
                  {deadline.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getNextMonthDate(day) {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, day);
  return nextMonth.toISOString().slice(0, 10);
}

function getNextPayrollDate() {
  const now = new Date();
  // Payroll typically runs end of month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of next month
  return nextMonth.toISOString().slice(0, 10);
}