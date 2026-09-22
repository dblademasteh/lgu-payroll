import { DollarSign, Users, FileText, Calculator, TrendingUp, Clock } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';

export default function Dashboard() {
  const stats = [
    { label: 'Total Payroll', value: '₱2,847,500', icon: DollarSign, trend: '+12.5%', trendUp: true },
    { label: 'Employees Paid', value: '284', icon: Users, trend: '+3 this month', trendUp: true },
    { label: 'Pending Payslips', value: '12', icon: FileText, trend: 'Due Friday', trendUp: false },
    { label: 'Avg. Net Pay', value: '₱10,026', icon: Calculator, trend: '+2.1% vs last run', trendUp: true },
  ];

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
            {[
              { period: 'January 2025', status: 'COMPLETED', employees: 284, total: '₱2,847,500', date: '2025-01-31' },
              { period: 'December 2024', status: 'COMPLETED', employees: 278, total: '₱2,780,000', date: '2024-12-20' },
              { period: 'November 2024', status: 'COMPLETED', employees: 275, total: '₱2,712,500', date: '2024-11-29' },
            ].map((run) => (
              <div key={run.period} className="flex items-center justify-between p-4 rounded-lg border border-line hover:bg-bg/60 transition">
                <div>
                  <p className="font-medium text-ink">{run.period}</p>
                  <p className="text-sm text-muted">{run.employees} employees · {run.total}</p>
                </div>
                <div className="text-right">
                  <span className={`badge ${run.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{run.status}</span>
                  <p className="text-xs text-muted mt-1">{run.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold text-ink mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            {[
              { title: 'January 2025 Payroll Run', date: '2025-01-30', type: 'PAYROLL' },
              { title: 'BIR Form 1601-C Filing', date: '2025-02-10', type: 'TAX' },
              { title: 'SSS/PhilHealth/Pag-IBIG Remittance', date: '2025-02-10', type: 'GOVT' },
              { title: '13th Month Pay Release', date: '2024-12-20', type: 'SPECIAL' },
            ].map((deadline) => (
              <div key={deadline.title} className="flex items-center justify-between p-4 rounded-lg border border-line hover:bg-bg/60 transition">
                <div>
                  <p className="font-medium text-ink">{deadline.title}</p>
                  <p className="text-sm text-muted">Due: {deadline.date}</p>
                </div>
                <span className={`badge ${deadline.type === 'TAX' ? 'badge-error' : deadline.type === 'GOVT' ? 'badge-warning' : deadline.type === 'SPECIAL' ? 'badge-accent' : 'badge-success'}`}>
                  {deadline.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}