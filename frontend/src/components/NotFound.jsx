import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="card p-8 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-warning/10 text-warning grid place-items-center mx-auto mb-4 ring-1 ring-warning/20">
          <AlertTriangle size={32} aria-hidden="true" />
        </div>
        <h1 className="font-display font-bold text-ink text-2xl">Page Not Found</h1>
        <p className="text-sm text-muted mt-2">The page you're looking for doesn't exist or you don't have permission to access it.</p>
        <Link to="/dashboard" className="btn btn-primary mt-6 inline-flex">
          <Home size={16} aria-hidden="true" className="mr-2" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}