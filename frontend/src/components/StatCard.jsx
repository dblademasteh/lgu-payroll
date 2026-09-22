import { forwardRef } from 'react';

const StatCard = forwardRef(({ label, value, icon: Icon, trend, trendUp }, ref) => (
  <div className="card stat" ref={ref}>
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="mono-label text-[10px] truncate">{label}</p>
        <p className="stat-value truncate">{value}</p>
      </div>
      <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent grid place-items-center shrink-0 ring-1 ring-accent/10">
        <Icon size={18} aria-hidden="true" />
      </div>
    </div>
    {trend && (
      <p className={`text-xs font-medium ${trendUp ? 'text-success' : 'text-warning'}`}>
        {trend}
      </p>
    )}
  </div>
));

StatCard.displayName = 'StatCard';

export default StatCard;