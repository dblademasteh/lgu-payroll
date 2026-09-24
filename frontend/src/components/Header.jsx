import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, ChevronDown, LogOut, Landmark, Clock } from 'lucide-react';
import { useAuth } from '../stores/auth.js';
import { useTheme, toggleTheme } from '../theme.js';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/payroll': 'Payroll Runs',
  '/payslips': 'Payslips',
  '/deductions': 'Deductions',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

function manilaParts(now) {
  const shifted = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return { date: shifted.toISOString().slice(0, 10), time: shifted.toISOString().slice(11, 19) };
}

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [now, setNow] = useState(() => new Date());
  const theme = useTheme();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!userOpen) return undefined;
    const onDown = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [userOpen]);

  const title = TITLES[location.pathname] ?? 'LGU Payroll';
  const { date, time } = manilaParts(now);
  const initial = (user?.fullName ?? user?.username ?? 'U').trim()[0]?.toUpperCase() ?? 'U';

  const signOut = () => {
    logout();
    setUserOpen(false);
    navigate('/');
  };

  return (
    <header className="h-16 shrink-0 bg-surface/90 backdrop-blur-md border-b border-line" style={{ zIndex: 50 }}>
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="btn btn-ghost p-2 md:p-2.5"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-muted">
            <Landmark size={16} aria-hidden="true" />
            <span className="mono-label">/</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-ink text-lg leading-tight truncate">{title}</h1>
            <p className="hidden sm:flex items-center gap-1.5 text-xs text-muted truncate">
              <Clock size={12} aria-hidden="true" className="shrink-0" />
              <span className="font-mono">{time} PHT · {date}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-ghost px-2 md:px-3"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={theme === 'dark'}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>

          <div className="dropdown" ref={userRef}>
            <button
              type="button"
              className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-[12px] hover:bg-bg/60 border border-transparent hover:border-line transition"
              onClick={() => setUserOpen((o) => !o)}
              aria-expanded={userOpen}
              aria-label="User menu"
            >
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-accent/20 to-accent/5 text-accent grid place-items-center shrink-0 ring-1 ring-accent/10">
                <span className="font-display font-bold text-[13px]">{initial}</span>
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-sm font-semibold text-ink truncate max-w-28">{user?.fullName ?? user?.username ?? 'Account'}</p>
                <p className="text-[10px] mono-label text-muted">{user?.role?.replaceAll('_', ' ') ?? '—'}</p>
              </div>
              <ChevronDown size={14} className="text-muted hidden lg:block" aria-hidden="true" />
            </button>
            {userOpen && (
              <div className="dropdown-panel w-64 shadow-lg" role="menu" aria-label="User menu">
                <div className="px-4 py-4 border-b border-line">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-accent/20 to-accent/5 text-accent grid place-items-center ring-1 ring-accent/10">
                      <span className="font-display font-bold">{initial}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink text-sm truncate">{user?.fullName ?? user?.username ?? 'Account'}</p>
                      <p className="mono-label text-[11px] text-muted truncate">{user?.role?.replaceAll('_', ' ')}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-line py-1">
                  <button
                    type="button"
                    className="dropdown-item text-error"
                    onClick={signOut}
                  >
                    <LogOut size={16} aria-hidden="true" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}