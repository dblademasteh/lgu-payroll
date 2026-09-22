import { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Shield, Database, User, Palette, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../stores/auth.js';
import { useTheme, toggleTheme, applyTheme, getTheme } from '../theme.js';
import { useToast } from '../hooks/useToast.jsx';

const SETTINGS_TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'system', label: 'System', icon: Database },
];

export default function Settings() {
  const user = useAuth((s) => s.user);
  const theme = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('appearance');
  const [saving, setSaving] = useState(false);
  const [fontScale, setFontScale] = useState(100);
  const [uiScale, setUiScale] = useState(100);
  const [notifPrefs, setNotifPrefs] = useState({
    inApp: true,
    email: false,
    payroll: true,
    deductions: true,
    reports: true,
    system: false,
  });

  // Load persisted settings
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lgu-payroll-settings') || '{}');
      if (saved.fontScale) setFontScale(saved.fontScale);
      if (saved.uiScale) setUiScale(saved.uiScale);
      if (saved.notifPrefs) setNotifPrefs(saved.notifPrefs);
    } catch { /* ignore */ }
  }, []);

  // Apply font/ui scale
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', `${fontScale}%`);
    document.documentElement.style.setProperty('--ui-scale', `${uiScale}%`);
  }, [fontScale, uiScale]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settings = { fontScale, uiScale, notifPrefs };
      localStorage.setItem('lgu-payroll-settings', JSON.stringify(settings));
      toast('Settings saved', 'success');
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = () => {
    const next = toggleTheme();
    toast(`Switched to ${next} theme`, 'info');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-ink text-2xl">Settings</h1>
        <p className="text-sm text-muted mt-0.5">Manage your preferences and system configuration</p>
      </div>

      <div className="card">
        <div className="tabbar" role="tablist">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} aria-hidden="true" className="mr-1" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appearance */}
        <div role="tabpanel" id="appearance-panel" aria-labelledby="appearance-tab" className={activeTab === 'appearance' ? '' : 'hidden'}>
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-display font-semibold text-ink mb-4">Theme</h3>
              <div className="flex items-center justify-between p-4 rounded-lg border border-line">
                <div>
                  <p className="font-medium text-ink">Dark Mode</p>
                  <p className="text-sm text-muted">Switch between light and dark appearance</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={theme === 'dark'}
                  onClick={handleThemeToggle}
                  className={`relative w-12 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-accent' : 'bg-line'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`}
                    aria-hidden="true"
                  >
                    {theme === 'dark' ? <Moon size={14} className="text-ink" /> : <Sun size={14} className="text-ink" />}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-display font-semibold text-ink mb-4">Display Scaling</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-ink">Font Size</p>
                    <span className="font-mono text-sm text-muted">{fontScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="130"
                    step="5"
                    value={fontScale}
                    onChange={(e) => setFontScale(Number(e.target.value))}
                    className="w-full accent-accent"
                    aria-label="Font size scale"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-ink">UI Scale</p>
                    <span className="font-mono text-sm text-muted">{uiScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="130"
                    step="5"
                    value={uiScale}
                    onChange={(e) => setUiScale(Number(e.target.value))}
                    className="w-full accent-accent"
                    aria-label="UI scale"
                  />
                </div>
                <p className="text-xs text-muted">Changes apply immediately. Default is 100%.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div role="tabpanel" id="notifications-panel" aria-labelledby="notifications-tab" className={activeTab === 'notifications' ? '' : 'hidden'}>
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-display font-semibold text-ink mb-4">In-App Notifications</h3>
              <label className="flex items-center justify-between p-4 rounded-lg border border-line cursor-pointer hover:bg-bg/60">
                <div>
                  <p className="font-medium text-ink">Enable in-app notifications</p>
                  <p className="text-sm text-muted">Show toast notifications for payroll events</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-accent"
                  checked={notifPrefs.inApp}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, inApp: e.target.checked })}
                />
              </label>
            </div>

            <div>
              <h3 className="font-display font-semibold text-ink mb-4">Notification Categories</h3>
              <div className="space-y-2">
                {[
                  { key: 'payroll', label: 'Payroll Runs', desc: 'New payroll runs, processing status' },
                  { key: 'deductions', label: 'Deductions', desc: 'Deduction changes, loan updates' },
                  { key: 'reports', label: 'Reports', desc: 'Report generation completion' },
                  { key: 'system', label: 'System', desc: 'Maintenance, updates, announcements' },
                ].map((cat) => (
                  <label key={cat.key} className="flex items-center justify-between p-4 rounded-lg border border-line cursor-pointer hover:bg-bg/60">
                    <div>
                      <p className="font-medium text-ink">{cat.label}</p>
                      <p className="text-sm text-muted">{cat.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-accent"
                      checked={notifPrefs[cat.key]}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, [cat.key]: e.target.checked })}
                      disabled={!notifPrefs.inApp}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div role="tabpanel" id="security-panel" aria-labelledby="security-tab" className={activeTab === 'security' ? '' : 'hidden'}>
          <div className="space-y-6 py-4">
            <div className="card p-5">
              <h3 className="font-display font-semibold text-ink mb-4">Change Password</h3>
              <form className="space-y-4 max-w-md" onSubmit={(e) => { e.preventDefault(); toast('Password change - to be implemented', 'info'); }}>
                <div>
                  <label className="mono-label">Current Password</label>
                  <input type="password" className="input mt-1.5" required />
                </div>
                <div>
                  <label className="mono-label">New Password</label>
                  <input type="password" className="input mt-1.5" required minLength={8} />
                </div>
                <div>
                  <label className="mono-label">Confirm New Password</label>
                  <input type="password" className="input mt-1.5" required minLength={8} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : 'Update Password'}
                </button>
              </form>
            </div>

            <div className="card p-5">
              <h3 className="font-display font-semibold text-ink mb-4">Session</h3>
              <p className="text-sm text-muted mb-4">Manage active sessions and security settings</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-outline" onClick={() => toast('Revoke all sessions - to be implemented', 'info')}>
                  Revoke All Other Sessions
                </button>
                <button type="button" className="btn btn-outline" onClick={() => toast('2FA setup - to be implemented', 'info')}>
                  Enable Two-Factor Auth
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System */}
        <div role="tabpanel" id="system-panel" aria-labelledby="system-tab" className={activeTab === 'system' ? '' : 'hidden'}>
          <div className="space-y-6 py-4">
            <div className="card p-5">
              <h3 className="font-display font-semibold text-ink mb-4">Data Management</h3>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-outline" onClick={() => toast('Export data - to be implemented', 'info')}>
                  <Download size={14} aria-hidden="true" className="mr-1" /> Export Data
                </button>
                <button type="button" className="btn btn-outline" onClick={() => toast('Import data - to be implemented', 'info')}>
                  <Upload size={14} aria-hidden="true" className="mr-1" /> Import Data
                </button>
                <button type="button" className="btn btn-danger" onClick={() => toast('Clear cache - to be implemented', 'info')}>
                  Clear Cache
                </button>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-display font-semibold text-ink mb-4">About</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Application</dt><dd className="font-mono text-ink">LGU Payroll</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Version</dt><dd className="font-mono text-ink">1.0.0</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Environment</dt><dd className="font-mono text-ink">Development</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Build</dt><dd className="font-mono text-ink">{new Date().toISOString().split('T')[0]}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-line">
        <button type="button" className="btn btn-primary" onClick={saveSettings} disabled={saving}>
          {saving && <Loader2 size={15} className="animate-spin mr-2" />}
          Save All Settings
        </button>
      </div>
    </div>
  );
}

import { Upload, Download } from 'lucide-react';