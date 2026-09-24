import { useState, useEffect } from 'react';
import {
  Moon, Sun, Bell, ShieldCheck, Database, Info, KeyRound, Palette, Save, Loader2, Check,
  Wifi, Server, Type, Layout, Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../stores/auth.js';
import { useTheme, applyTheme } from '../theme.js';
import { useToast } from '../hooks/useToast.jsx';
import { getPreferences, updatePreferences, getIntegrationConfig, updateIntegrationConfig, testIntegration, changePassword } from '../api/settings.js';

const PRIVILEGED_ROLES = ['ADMIN', 'HR_MANAGER'];

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'integration', label: 'HRMS Integration', icon: Wifi, privileged: true },
  { id: 'system', label: 'System', icon: Database },
];

const NOTIF_CATEGORIES = [
  { key: 'payroll', label: 'Payroll Runs', desc: 'New payroll runs, processing status' },
  { key: 'deductions', label: 'Deductions', desc: 'Deduction changes, loan updates' },
  { key: 'reports', label: 'Reports', desc: 'Report generation completion' },
  { key: 'system', label: 'System', desc: 'Maintenance, updates, announcements' },
];

/* A titled settings block — icon tile header + hairline-divided body (suite pattern). */
function Panel({ icon: Icon, title, desc, children, action }) {
  return (
    <section className="rounded-2xl border border-line bg-surface">
      <header className="px-5 md:px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-line">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent grid place-items-center shrink-0 ring-1 ring-accent/10">
            <Icon size={17} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-ink text-sm md:text-base">{title}</h2>
            <p className="text-xs text-muted mt-0.5">{desc}</p>
          </div>
        </div>
        {action}
      </header>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function ThemeTile({ mode, active, themeLabel }) {
  const isDark = mode === 'dark';
  return (
    <button
      type="button"
      onClick={() => applyTheme(mode)}
      className={`flex-1 rounded-xl border px-4 py-4 flex flex-col items-center gap-2 transition ${
        active
          ? 'border-accent ring-1 ring-accent bg-accent/5 text-ink'
          : 'border-line text-muted hover:border-line hover:bg-bg/60 hover:text-ink'
      }`}
      aria-pressed={active}
    >
      {isDark ? <Moon size={20} aria-hidden="true" /> : <Sun size={20} aria-hidden="true" />}
      <span className="text-sm font-medium">{themeLabel}</span>
      {active && <Check size={14} className="text-accent" aria-hidden="true" />}
    </button>
  );
}

function SettingRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <div className="flex items-center gap-2 shrink-0 text-sm text-ink">{children}</div>
    </div>
  );
}

function SecretField({ id, label, hint, value, shown, onToggleShow, onValue, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="mono-label">{label}</label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          className="input pr-12"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValue(e.target.value)}
          autoComplete="off"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-3 grid place-items-center text-muted hover:text-ink"
          onClick={onToggleShow}
          aria-label={shown ? `Hide ${label}` : `Show ${label}`}
        >
          {shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      <p className="text-xs text-muted mt-1">{hint}</p>
    </div>
  );
}

export default function Settings() {
  const user = useAuth((s) => s.user);
  const theme = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('appearance');
  const privileged = PRIVILEGED_ROLES.includes(user?.role);
  const visibleTabs = TABS.filter((t) => !t.privileged || privileged);

  // Appearance
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [fontScale, setFontScale] = useState(100);
  const [uiScale, setUiScale] = useState(100);

  // Notifications
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    inApp: true,
    email: false,
    payroll: true,
    deductions: true,
    reports: true,
    system: false,
  });

  // HRMS Integration
  const [integrationConfig, setIntegrationConfig] = useState({
    hrmsBaseUrl: '',
    hrmsApiKey: '',
    hrmsWebhookSecret: '',
    pollerEnabled: false,
    intervalMin: 15,
    timeoutMs: 15000,
    ingestPath: '/integrations/attendance',
    forwardingEnabled: false,
  });
  const [integrationSaving, setIntegrationSaving] = useState(false);
  const [integrationTesting, setIntegrationTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Security
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Load persisted settings
  useEffect(() => {
    loadPreferences();
    if (privileged) loadIntegrationConfig();
  }, [privileged]);

  async function loadPreferences() {
    try {
      const res = await getPreferences();
      const data = res.data;
      if (data) {
        if (typeof data.display?.fontScale === 'number') setFontScale(data.display.fontScale);
        if (typeof data.display?.uiScale === 'number') setUiScale(data.display.uiScale);
        if (typeof data.inApp === 'boolean') {
          setNotifPrefs((prev) => ({
            ...prev,
            inApp: data.inApp,
            email: typeof data.email === 'boolean' ? data.email : prev.email,
            payroll: typeof data.payroll === 'boolean' ? data.payroll : prev.payroll,
            deductions: typeof data.deductions === 'boolean' ? data.deductions : prev.deductions,
            reports: typeof data.reports === 'boolean' ? data.reports : prev.reports,
            system: typeof data.system === 'boolean' ? data.system : prev.system,
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load preferences:', e);
      try {
        const saved = JSON.parse(localStorage.getItem('lgu-payroll-settings') || '{}');
        if (saved.fontScale) setFontScale(saved.fontScale);
        if (saved.uiScale) setUiScale(saved.uiScale);
        if (saved.notifPrefs) setNotifPrefs((prev) => ({ ...prev, ...saved.notifPrefs }));
      } catch {
        /* ignore */
      }
    }
  }

  async function loadIntegrationConfig() {
    try {
      const res = await getIntegrationConfig();
      const config = res.data;
      if (config) {
        setIntegrationConfig({
          hrmsBaseUrl: config.hrmsBaseUrl || '',
          hrmsApiKey: '', // Don't show encrypted value
          hrmsWebhookSecret: '',
          pollerEnabled: config.pollerEnabled || false,
          intervalMin: config.intervalMin || 15,
          timeoutMs: config.timeoutMs || 15000,
          ingestPath: config.ingestPath || '/integrations/attendance',
          forwardingEnabled: config.forwardingEnabled || false,
        });
      }
    } catch (e) {
      console.error('Failed to load integration config:', e);
    }
  }

  // Apply font/ui scale
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', `${fontScale}%`);
    document.documentElement.style.setProperty('--ui-scale', `${uiScale}%`);
  }, [fontScale, uiScale]);

  const persistPrefs = (extra) => {
    localStorage.setItem('lgu-payroll-settings', JSON.stringify({ fontScale, uiScale, notifPrefs }));
    return updatePreferences({ fontScale, uiScale, notifPrefs, ...extra });
  };

  const saveAppearance = async () => {
    setSavingAppearance(true);
    try {
      await persistPrefs();
      toast('Appearance saved', 'success');
    } catch (e) {
      toast('Failed to save settings', 'error');
      console.error('Save settings error:', e);
    } finally {
      setSavingAppearance(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotifs(true);
    try {
      await persistPrefs();
      toast('Notification preferences saved', 'success');
    } catch (e) {
      toast('Failed to save settings', 'error');
      console.error('Save settings error:', e);
    } finally {
      setSavingNotifs(false);
    }
  };

  const saveIntegrationConfig = async () => {
    setIntegrationSaving(true);
    try {
      await updateIntegrationConfig(integrationConfig);
      toast('Integration settings saved', 'success');
      loadIntegrationConfig(); // Reload to get masked values
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Failed to save integration settings';
      toast(msg, 'error');
    } finally {
      setIntegrationSaving(false);
    }
  };

  const handleTestIntegration = async () => {
    setIntegrationTesting(true);
    try {
      const res = await testIntegration();
      toast(`Connection successful - ${res.data?.employeeCount || 0} employees found`, 'success');
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Connection failed';
      toast(msg, 'error');
    } finally {
      setIntegrationTesting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast('New password must be at least 8 characters', 'error');
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast('Password updated successfully', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Failed to change password';
      toast(msg, 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const setIntegration = (patch) => setIntegrationConfig((c) => ({ ...c, ...patch }));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent grid place-items-center ring-1 ring-accent/10">
          <Server size={19} aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display font-bold text-ink text-lg leading-tight">Settings</h2>
          <p className="text-xs text-muted">Workspace, security, and system preferences</p>
        </div>
      </div>

      <div className="tabbar" role="tablist" aria-label="Settings sections">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={`tab flex items-center gap-1.5 ${activeTab === t.id ? 'tab-active' : ''}`}
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
          >
            <t.icon size={14} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'appearance' && (
        <div className="space-y-4">
          <Panel icon={theme === 'dark' ? Moon : Sun} title="Theme" desc="Light and dark mode inherit the house token system.">
            <div className="flex gap-3">
              <ThemeTile mode="light" active={theme === 'light'} themeLabel="Light" />
              <ThemeTile mode="dark" active={theme === 'dark'} themeLabel="Dark" />
            </div>
          </Panel>

          <Panel icon={Layout} title="Display scaling" desc="Scales base spacing and type across the app.">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="font-scale" className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Type size={15} aria-hidden="true" /> Font size
                  </label>
                  <span className="mono-label tabular-nums">{fontScale}%</span>
                </div>
                <input
                  id="font-scale"
                  type="range"
                  min="80"
                  max="130"
                  step="5"
                  value={fontScale}
                  onChange={(e) => setFontScale(Number(e.target.value))}
                  className="w-full accent-[color:var(--accent)]"
                  aria-label="Font size scale"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="ui-scale" className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Layout size={15} aria-hidden="true" /> UI scale
                  </label>
                  <span className="mono-label tabular-nums">{uiScale}%</span>
                </div>
                <input
                  id="ui-scale"
                  type="range"
                  min="80"
                  max="130"
                  step="5"
                  value={uiScale}
                  onChange={(e) => setUiScale(Number(e.target.value))}
                  className="w-full accent-[color:var(--accent)]"
                  aria-label="UI scale"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">Changes apply immediately. Default is 100%.</p>
                <button type="button" className="btn btn-primary" onClick={saveAppearance} disabled={savingAppearance}>
                  {savingAppearance ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
                  Save appearance
                </button>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <Panel icon={Bell} title="In-app notifications" desc="Toast alerts for payroll events inside this workspace.">
            <div className="flex items-start justify-between gap-4 py-1">
              <div>
                <label htmlFor="inapp-toggle" className="text-sm font-medium text-ink cursor-pointer">In-app</label>
                <p className="text-xs text-muted mt-0.5">
                  When off, the notification categories below are silenced.
                </p>
              </div>
              <input
                id="inapp-toggle"
                type="checkbox"
                checked={notifPrefs.inApp}
                onChange={(e) => setNotifPrefs((p) => ({ ...p, inApp: e.target.checked }))}
                className="w-4 h-4 mt-1 shrink-0 accent-[color:var(--accent)]"
              />
            </div>
          </Panel>

          <Panel icon={Bell} title="Notification categories" desc="Choose which events surface as toasts.">
            <div className="divide-y divide-line">
              {NOTIF_CATEGORIES.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between gap-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink">{cat.label}</p>
                    <p className="text-xs text-muted">{cat.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs[cat.key]}
                    onChange={(e) => setNotifPrefs((p) => ({ ...p, [cat.key]: e.target.checked }))}
                    disabled={!notifPrefs.inApp}
                    aria-label={`${cat.label} notifications`}
                    className="w-4 h-4 shrink-0 accent-[color:var(--accent)] disabled:opacity-40"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-line">
              <button type="button" className="btn btn-primary" onClick={saveNotifications} disabled={savingNotifs}>
                {savingNotifs ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
                Save notifications
              </button>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          <Panel icon={KeyRound} title="Change password" desc="Rotate the password for your workspace account.">
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label htmlFor="current-password" className="mono-label">Current password</label>
                <input
                  id="current-password"
                  type="password"
                  className="input mt-1.5"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="mono-label">New password</label>
                <input
                  id="new-password"
                  type="password"
                  className="input mt-1.5"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="mono-label">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="input mt-1.5"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                {passwordSaving ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
                Update password
              </button>
            </form>
          </Panel>

          <Panel icon={ShieldCheck} title="Access & session" desc="How this workspace authenticates your sign-in.">
            <div className="divide-y divide-line">
              <SettingRow label="Sign in">
                <span className="mono-label">Username + password</span>
              </SettingRow>
              <SettingRow label="Passwords stored">
                <span className="mono-label">bcrypt hashed</span>
              </SettingRow>
              <SettingRow label="Access token">
                <span className="mono-label">JWT · 15 min</span>
              </SettingRow>
              <SettingRow label="Session refresh">
                <span className="mono-label">Rotating JWT · 7 days</span>
              </SettingRow>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'integration' && privileged && (
        <div className="space-y-4">
          <Panel
            icon={Wifi}
            title="HRMS connection"
            desc="Link to LGU-HRMS for employee data synchronization."
            action={
              <button
                type="button"
                className="btn btn-ghost px-2.5 py-1.5 text-xs"
                onClick={handleTestIntegration}
                disabled={integrationTesting || !integrationConfig.hrmsBaseUrl}
              >
                {integrationTesting ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />}
                Test
              </button>
            }
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="hrms-base-url" className="mono-label">HRMS base URL</label>
                <input
                  id="hrms-base-url"
                  type="url"
                  className="input mt-1.5"
                  placeholder="https://hrms.lgu.gov.ph"
                  value={integrationConfig.hrmsBaseUrl}
                  onChange={(e) => setIntegration({ hrmsBaseUrl: e.target.value })}
                  autoComplete="off"
                />
                <p className="text-xs text-muted mt-1">Base URL of the HRMS API (must include https://)</p>
              </div>

              <SecretField
                id="hrms-api-key"
                label="API key"
                hint="Leave blank to keep the existing key. Values are encrypted at rest."
                value={integrationConfig.hrmsApiKey}
                shown={showApiKey}
                onToggleShow={() => setShowApiKey((s) => !s)}
                onValue={(v) => setIntegration({ hrmsApiKey: v })}
                placeholder="Enter API key"
              />

              <SecretField
                id="hrms-webhook-secret"
                label="Webhook secret"
                hint="Verifies HRMS webhook signatures. Leave blank to keep the existing value."
                value={integrationConfig.hrmsWebhookSecret}
                shown={showWebhookSecret}
                onToggleShow={() => setShowWebhookSecret((s) => !s)}
                onValue={(v) => setIntegration({ hrmsWebhookSecret: v })}
                placeholder="Enter webhook secret"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrationConfig.pollerEnabled}
                    onChange={(e) => setIntegration({ pollerEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[color:var(--accent)]"
                  />
                  Poller enabled
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrationConfig.forwardingEnabled}
                    onChange={(e) => setIntegration({ forwardingEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[color:var(--accent)]"
                  />
                  Forwarding enabled
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="poll-interval" className="mono-label">Poll interval (minutes)</label>
                  <input
                    id="poll-interval"
                    type="number"
                    className="input mt-1.5"
                    min="1"
                    max="1440"
                    value={integrationConfig.intervalMin}
                    onChange={(e) => setIntegration({ intervalMin: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label htmlFor="timeout-ms" className="mono-label">Timeout (ms)</label>
                  <input
                    id="timeout-ms"
                    type="number"
                    className="input mt-1.5"
                    min="1000"
                    max="60000"
                    step="1000"
                    value={integrationConfig.timeoutMs}
                    onChange={(e) => setIntegration({ timeoutMs: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label htmlFor="ingest-path" className="mono-label">Ingest path</label>
                  <input
                    id="ingest-path"
                    type="text"
                    className="input mt-1.5"
                    value={integrationConfig.ingestPath}
                    onChange={(e) => setIntegration({ ingestPath: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveIntegrationConfig}
                  disabled={integrationSaving}
                >
                  {integrationSaving ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
                  Save integration
                </button>
                <p className="text-xs text-muted">Credential changes apply on the next sync.</p>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-4">
          <Panel icon={Info} title="About" desc="Deployment and privacy at a glance.">
            <div className="divide-y divide-line">
              <SettingRow label="Application"><span className="mono-label">LGU Payroll</span></SettingRow>
              <SettingRow label="Version"><span className="mono-label">v1.0.0</span></SettingRow>
              <SettingRow label="Stack"><span className="mono-label">Express 5 · React 19 · Prisma · Postgres</span></SettingRow>
              <SettingRow label="Deployment"><span className="mono-label">On-premise</span></SettingRow>
            </div>
            <p className="text-xs text-muted leading-relaxed mt-4">
              Salary and payroll data is processed as personal information in line with the Data Privacy Act
              of 2012 (RA 10173). Access to this workspace is role-scoped and fully audited.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
}