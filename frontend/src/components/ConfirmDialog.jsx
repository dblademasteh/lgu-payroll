import Modal from './Modal.jsx';

/* Destructive/branching confirmation. Props: message | confirmLabel | danger (AGENTS.md). */
export default function ConfirmDialog({ open, title = 'Confirm', message, confirmLabel = 'Confirm', onConfirm, onCancel, danger }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink leading-relaxed">{message}</p>
    </Modal>
  );
}