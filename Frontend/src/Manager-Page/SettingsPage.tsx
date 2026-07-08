import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, ChevronDown, Database, LockKeyhole, RefreshCw, Save, Shield, Upload, Users } from 'lucide-react';
import { PageTitle, Panel, ToneIcon } from './components';
import { changePassword as changeAccountPassword } from '../lib/auth';
import { isAllowedPassword, PASSWORD_POLICY_MESSAGE } from '../lib/passwordPolicy';

const logRows = [
  { user: 'Manager', action: 'Opened device registry', time: 'Today, 10:20 AM' },
  { user: 'Manager', action: 'Updated owner contact validation', time: 'Today, 09:45 AM' },
  { user: 'System', action: 'Generated storage snapshot', time: 'Yesterday, 06:10 PM' },
];

export default function SettingsPage() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    account: true,
    system: false,
    security: false,
  });
  const [profile, setProfile] = useState({
    name: 'Default Manager',
    email: 'manager@gmail.com',
    phone: '9876543210',
    avatar: '',
  });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [notifications, setNotifications] = useState({ alerts: true, reports: true, deviceOffline: true });
  const [preferences, setPreferences] = useState({ theme: 'Dark', language: 'English', refresh: '30 sec' });
  const [roles, setRoles] = useState({ ownerEdit: true, deviceAssign: true, reportExport: true });
  const [logFilter, setLogFilter] = useState('');
  const [message, setMessage] = useState('');

  const filteredLogs = useMemo(
    () => logRows.filter((row) => [row.user, row.action, row.time].join(' ').toLowerCase().includes(logFilter.toLowerCase())),
    [logFilter],
  );

  const toggleSection = (section: string) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
    setMessage('');
  };

  const saveProfile = () => {
    if (!profile.name.trim() || !/^[^\s@]+@gmail\.com$/i.test(profile.email) || !/^\d{10}$/.test(profile.phone)) {
      setMessage('Enter name, a valid @gmail.com email, and a 10-digit phone number.');
      return;
    }
    setMessage('Profile settings saved successfully.');
  };

  const changePassword = async () => {
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setMessage('Please fill current password, new password, and confirm password.');
      return;
    }
    if (!isAllowedPassword(passwords.next)) {
      setMessage(PASSWORD_POLICY_MESSAGE);
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setMessage('New password and confirm password do not match.');
      return;
    }
    try {
      const response = await changeAccountPassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      setMessage(response.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to change password.');
    }
  };

  const Section = ({
    id,
    title,
    icon,
    tone,
    children,
  }: {
    id: string;
    title: string;
    icon: any;
    tone: 'cyan' | 'green' | 'red';
    children: ReactNode;
  }) => (
    <Panel>
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="flex w-full items-center gap-4 text-left"
      >
        <ToneIcon icon={icon} tone={tone} />
        <div className="flex-1">
          <h2 className="text-lg font-extrabold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-300">Click to expand or collapse this settings group.</p>
        </div>
        <ChevronDown className={`h-5 w-5 text-slate-300 transition ${openSections[id] ? 'rotate-180' : ''}`} />
      </button>
      {openSections[id] && <div className="mt-6 border-t border-[#0d3660]/60 pt-6">{children}</div>}
    </Panel>
  );

  return (
    <div>
      <PageTitle
        title="Settings"
        subtitle="Manage manager account, system preferences, and security controls."
      />

      {message && (
        <div className={`mb-5 rounded-lg border p-4 text-sm font-semibold ${message.includes('success') ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
          {message}
        </div>
      )}

      <div className="space-y-5">
        <Section id="account" title="Account Settings" icon={Users} tone="cyan">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
            <div className="rounded-lg border border-[#0d3660] bg-[#031426]/70 p-5 text-center">
              <img
                src={profile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager'}
                alt={profile.name}
                className="mx-auto h-24 w-24 rounded-full bg-[#020b18]"
              />
              <label className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#0d3660] px-4 text-sm font-bold text-white">
                <Upload className="h-4 w-4" />
                Picture
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setProfile((current) => ({ ...current, avatar: URL.createObjectURL(file) }));
                  }}
                />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="h-12 rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300" placeholder="Full name" />
              <input value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} className="h-12 rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300" placeholder="manager@gmail.com" />
              <input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })} className="h-12 rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300" placeholder="10-digit phone" />
              <button onClick={saveProfile} className="flex h-12 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-500"><Save className="h-4 w-4" /> Save Profile</button>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[#0d3660] bg-[#031426]/50 p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-white"><LockKeyhole className="h-5 w-5 text-cyan-300" /> Change Password</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <input type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} className="h-11 rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none" placeholder="Current password" />
              <input type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} className="h-11 rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none" placeholder="New password" />
              <input type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} className="h-11 rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none" placeholder="Confirm password" />
              <button onClick={changePassword} className="h-11 rounded-md border border-cyan-400/50 px-4 text-sm font-bold text-cyan-200">Update Password</button>
            </div>
          </div>
        </Section>

        <Section id="system" title="System Settings" icon={Database} tone="green">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="rounded-lg border border-[#0d3660] bg-[#031426]/50 p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-white"><Bell className="h-5 w-5 text-emerald-300" /> Notifications</h3>
              {Object.entries(notifications).map(([key, value]) => (
                <label key={key} className="mb-3 flex items-center justify-between text-sm text-slate-200">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input type="checkbox" checked={value} onChange={(event) => setNotifications({ ...notifications, [key as keyof typeof notifications]: event.target.checked })} className="h-5 w-5 accent-cyan-400" />
                </label>
              ))}
            </div>
            <div className="rounded-lg border border-[#0d3660] bg-[#031426]/50 p-5">
              <h3 className="mb-4 font-bold text-white">System Preferences</h3>
              <select value={preferences.theme} onChange={(event) => setPreferences({ ...preferences, theme: event.target.value })} className="mb-3 h-11 w-full rounded-md border border-[#0d3660] bg-[#020b18] px-3 text-sm text-white"><option>Dark</option><option>Light</option></select>
              <select value={preferences.language} onChange={(event) => setPreferences({ ...preferences, language: event.target.value })} className="mb-3 h-11 w-full rounded-md border border-[#0d3660] bg-[#020b18] px-3 text-sm text-white"><option>English</option><option>Hindi</option><option>Telugu</option></select>
              <select value={preferences.refresh} onChange={(event) => setPreferences({ ...preferences, refresh: event.target.value })} className="h-11 w-full rounded-md border border-[#0d3660] bg-[#020b18] px-3 text-sm text-white"><option>10 sec</option><option>30 sec</option><option>1 min</option></select>
            </div>
            <div className="rounded-lg border border-[#0d3660] bg-[#031426]/50 p-5">
              <h3 className="mb-4 font-bold text-white">Data & Storage</h3>
              <p className="text-3xl font-extrabold text-white">68%</p>
              <p className="mt-2 text-sm text-slate-300">Database storage used</p>
              <button onClick={() => setMessage('Storage details refreshed successfully.')} className="mt-5 flex h-10 items-center gap-2 rounded-md border border-[#0d3660] px-4 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" /> Refresh Details</button>
            </div>
          </div>
          <button onClick={() => setMessage('System preferences saved successfully.')} className="mt-5 h-11 rounded-md bg-emerald-600 px-5 text-sm font-bold text-white">Save System Settings</button>
        </Section>

        <Section id="security" title="Security Settings" icon={Shield} tone="red">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-[#0d3660] bg-[#031426]/50 p-5">
              <h3 className="mb-4 font-bold text-white">Access Control</h3>
              {Object.entries(roles).map(([key, value]) => (
                <label key={key} className="mb-3 flex items-center justify-between text-sm text-slate-200">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input type="checkbox" checked={value} onChange={(event) => setRoles({ ...roles, [key as keyof typeof roles]: event.target.checked })} className="h-5 w-5 accent-cyan-400" />
                </label>
              ))}
              <button onClick={() => setMessage('Access permissions saved successfully.')} className="mt-3 h-10 rounded-md border border-[#0d3660] px-4 text-sm font-bold text-white">Save Permissions</button>
            </div>
            <div className="rounded-lg border border-[#0d3660] bg-[#031426]/50 p-5">
              <h3 className="mb-4 font-bold text-white">Activity Logs</h3>
              <input value={logFilter} onChange={(event) => setLogFilter(event.target.value)} className="mb-4 h-10 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-3 text-sm text-white outline-none" placeholder="Filter activity logs..." />
              <div className="space-y-3">
                {filteredLogs.map((row) => (
                  <div key={`${row.action}-${row.time}`} className="rounded-md border border-[#0d3660]/60 p-3 text-sm">
                    <p className="font-bold text-white">{row.action}</p>
                    <p className="mt-1 text-xs text-slate-400">{row.user} - {row.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
