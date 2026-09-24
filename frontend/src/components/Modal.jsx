import { X } from 'lucide-react';

/* Shared modal wrapper — design follows index.css (modal-overlay/box/head/body/foot).
   DESIGN.md: persists until explicitly closed — no overlay-click close. */
const SIZES = {
  sm: 'modal-sm',
  md: 'modal-md',
  lg: 'modal-lg',
};

export default function Modal({ open, onClose, title, size = 'md', children, footer, ariaLabel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className={`modal-box ${SIZES[size] || SIZES.md}`} role="dialog" aria-modal="true" aria-label={ariaLabel || title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}