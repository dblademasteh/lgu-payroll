/* Shared empty-state — used for card-level and table-cell empty rows. */
export default function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-12'} px-4`}>
      {Icon && <Icon size={28} className="text-muted mb-3" aria-hidden="true" />}
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="text-sm text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}