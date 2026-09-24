import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

const COLLAPSE_KEY = 'lgu-payroll-sidebar-collapsed';
const MD_QUERY = '(min-width: 768px)';

/* Data-dense routes inherit a wider canvas; the rest stay at the 6xl baseline. */
const ROUTE_WIDTHS = {
  '/dashboard': 'max-w-7xl',
  '/reports': 'max-w-7xl',
};

export default function Layout({ maxWidth }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === 'true'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const widthClass = ROUTE_WIDTHS[location.pathname] ?? maxWidth ?? 'max-w-6xl';

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, String(collapsed)); } catch { /* ignore */ }
  }, [collapsed]);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close the drawer when the viewport grows to md+ (e.g. rotate/resize).
  useEffect(() => {
    const mq = window.matchMedia(MD_QUERY);
    const onChange = () => {
      if (mq.matches) setMobileOpen(false);
    };
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const handleToggleSidebar = () => {
    if (window.matchMedia(MD_QUERY).matches) {
      setCollapsed((c) => !c);
    } else {
      setMobileOpen((o) => !o);
    }
  };

  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="h-screen flex bg-bg">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 overflow-auto px-4 py-3 md:px-6 md:py-6 flex items-start justify-center">
          <div className={`w-full ${widthClass}`}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}