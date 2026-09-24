const TONES = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  accent: 'badge-accent',
  muted: 'badge-muted',
};

export default function Badge({ tone = 'muted', className = '', children, ...rest }) {
  return (
    <span className={`badge ${TONES[tone] || TONES.muted} ${className}`} {...rest}>
      {children}
    </span>
  );
}