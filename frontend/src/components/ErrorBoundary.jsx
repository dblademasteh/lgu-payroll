import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast.jsx';

export default function ErrorBoundary({ children }) {
  const toast = useToast();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setHasError(true);
      toast('Something went wrong. Please refresh the page.', 'error');
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', handler);
    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', handler);
    };
  }, [toast]);

  if (hasError) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <p className="text-lg font-semibold text-ink">Something went wrong</p>
          <p className="text-sm text-muted mt-2">Please refresh the page to continue.</p>
          <button
            type="button"
            className="btn btn-primary mt-6"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return children;
}