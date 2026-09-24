export default function Pagination({ page, totalPages, total, loading, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="p-4 border-t border-line flex items-center justify-between">
      <p className="text-sm text-muted">
        Page {page} of {totalPages} ({total} total)
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}