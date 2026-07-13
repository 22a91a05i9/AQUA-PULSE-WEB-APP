import { useEffect, useState } from 'react';
import {
  Settings,
  Lock,
  Shield,
  FileText,
  Info,
  ArrowRight,
  ExternalLink,
  Plus,
  Cpu,
  Mail,
  MessageCircle,
  Megaphone,
  Phone,
  Trash2,
  Upload,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { changePassword as changeAccountPassword, getAuthSession, updateStoredAuthUser } from '../lib/auth';
import { useTheme, useTranslation } from '../lib/i18n';
import { isAllowedPassword, PASSWORD_POLICY_MESSAGE } from '../lib/passwordPolicy';
import { RowActionMenu } from '../lib/tableActions';

const securityItems = [
  { label: 'Change Password', desc: 'Update your account password', icon: Lock },
  { label: 'Privacy Policy', desc: 'View our privacy policy', icon: FileText, external: true },
];

interface ContactItem {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  tag?: string | null;
  readonly?: boolean;
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-all toggle-switch ${enabled ? 'toggle-on' : 'bg-[#0d3660]'}`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${enabled ? 'left-5' : 'left-0.5'}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [alertMode, setAlertMode] = useState<'sms' | 'email'>('sms');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme, changeTheme } = useTheme();
  const { t, lang, changeLanguage } = useTranslation();
  const [policyOpen, setPolicyOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '', avatarUrl: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState('');

  async function loadSettings() {
    try {
      const session = getAuthSession();
      if (session) {
        const res = await apiRequest<any>('/settings', {
          token: session.token,
        });
        setData(res);
        setProfileForm({
          full_name: res.profile_json?.full_name || session.user.name || '',
          email: res.profile_json?.email || session.user.email || '',
          phone: res.profile_json?.phone || '',
          avatarUrl: res.profile_json?.avatarUrl || session.user.avatarUrl || '',
        });
        const contactRows = await apiRequest<ContactItem[]>('/settings/contacts', {
          token: session.token,
        });
        setContacts(contactRows);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggle = async (key: string, currentVal: boolean) => {
    try {
      const session = getAuthSession();
      if (session && data) {
        const updatedPrefs = {
          ...data.notification_prefs,
          [key]: !currentVal,
        };
        const updated = await apiRequest<any>('/settings', {
          method: 'PUT',
          token: session.token,
          body: {
            notification_prefs: updatedPrefs,
          },
        });
        setData(updated);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  const saveProfile = async () => {
    try {
      const session = getAuthSession();
      if (!session || !data) return;
      const updated = await apiRequest<any>('/settings', {
        method: 'PUT',
        token: session.token,
        body: {
          profile_json: {
            ...data.profile_json,
            ...profileForm,
            role: session.user.role,
          },
        },
      });
      setData(updated);
      updateStoredAuthUser({
        name: profileForm.full_name,
        email: profileForm.email,
        avatarUrl: profileForm.avatarUrl || undefined,
      });
      setProfileOpen(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile.');
    }
  };

  const handleProfileImage = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((current) => ({ ...current, avatarUrl: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const createContact = async () => {
    const name = window.prompt('Contact name');
    if (!name) return;
    const email = window.prompt('Contact email') || '';
    const phone = window.prompt('Contact phone') || '';
    try {
      const session = getAuthSession();
      if (!session) return;
      const contact = await apiRequest<ContactItem>('/settings/contacts', {
        method: 'POST',
        token: session.token,
        body: { name, email, phone, tag: 'Added Contact' },
      });
      setContacts((current) => [...current, contact]);
    } catch (err) {
      console.error('Failed to add contact:', err);
      alert('Failed to add contact.');
    }
  };

  const updateContact = async (contact: ContactItem) => {
    if (contact.readonly) return;
    const name = window.prompt('Edit contact name:', contact.name);
    if (!name) return;
    const email = window.prompt('Edit contact email:', contact.email || '') || '';
    const phone = window.prompt('Edit contact phone:', contact.phone || '') || '';
    try {
      const session = getAuthSession();
      if (!session) return;
      const updated = await apiRequest<ContactItem>(`/settings/contacts/${contact.id}`, {
        method: 'PUT',
        token: session.token,
        body: { name, email, phone },
      });
      setContacts((current) => current.map((item) => item.id === contact.id ? updated : item));
    } catch (err) {
      console.error('Failed to update contact:', err);
      alert('Failed to update contact.');
    }
  };

  const deleteContact = async (contact: ContactItem) => {
    if (contact.readonly) return;
    try {
      const session = getAuthSession();
      if (!session) return;
      await apiRequest(`/settings/contacts/${contact.id}`, {
        method: 'DELETE',
        token: session.token,
      });
      setContacts((current) => current.filter((item) => item.id !== contact.id));
    } catch (err) {
      console.error('Failed to delete contact:', err);
      alert('Failed to delete contact.');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordMessage('Please fill current password, new password, and confirm password.');
      return;
    }
    if (!isAllowedPassword(passwordForm.next)) {
      setPasswordMessage(PASSWORD_POLICY_MESSAGE);
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage('New password and confirm password do not match.');
      return;
    }
    try {
      const response = await changeAccountPassword(passwordForm.current, passwordForm.next);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setPasswordMessage(response.message);
      setTimeout(() => setPasswordOpen(false), 1000);
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Failed to change password.');
    }
  };

  const session = getAuthSession();
  const user = session?.user;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const prefs = data?.notification_prefs || {
    email_alerts: true,
    sms_alerts: false,
    push_alerts: true,
    weekly_report: true,
  };

  const notifications = [
    { label: t('Email Notifications'), desc: 'Receive alerts and updates via email', icon: Mail, enabled: prefs.email_alerts, key: 'email_alerts' },
    { label: t('SMS Notifications'), desc: 'Receive critical alerts via SMS', icon: MessageCircle, enabled: prefs.sms_alerts, key: 'sms_alerts' },
    { label: t('System Updates'), desc: 'Important system updates and announcements', icon: Info, enabled: prefs.push_alerts, key: 'push_alerts' },
    { label: t('Marketing Communications'), desc: 'Product updates and other communications', icon: Megaphone, enabled: prefs.weekly_report, key: 'weekly_report' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in text-left">
      {/* Left Column */}
      <div className="space-y-5">
        {/* Profile & Account */}
        <div className="glass rounded-xl p-5 card-hover">
          <h3 className="text-xs font-semibold text-[#22d3ee] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" /> {t('Profile & Account')}
          </h3>
          <button onClick={() => setProfileOpen(true)} className="w-full flex items-center justify-between p-4 rounded-xl bg-[#071f35] hover:bg-[#0a2a47] transition-all group">
            <div className="flex items-center gap-4">
              <img
                src={profileForm.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'rahul'}&backgroundColor=0a2a47`}
                alt="Profile"
                className="w-14 h-14 rounded-full ring-2 ring-[#06b6d4]/30"
              />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{user?.name || 'Rahul Verma'}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#06b6d4]/20 text-[#22d3ee] capitalize">{user?.role || 'Agent'}</span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">{user?.email || 'rahul.verma@aquapulse.com'}</p>
                <p className="text-sm text-slate-400">{data?.profile_json?.phone || '+91 98765 43210'}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#22d3ee] transition-colors" />
          </button>
        </div>

        {/* Preferences */}
        <div className="glass rounded-xl p-5 card-hover">
          <h3 className="text-xs font-semibold text-[#22d3ee] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> {t('Preferences')}
          </h3>
          <div className="space-y-4">
            {/* Theme Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#0d3660]/40 pb-3">
              <div>
                <p className="text-sm font-semibold text-white">{t('Theme')}</p>
                <p className="text-xs text-slate-400">Choose your application theme</p>
              </div>
              <div className="flex rounded-lg border border-[#0d3660] p-1 self-start md:self-auto bg-[#020b18]/60">
                {(['Light', 'Dark'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => changeTheme(item)}
                    className={`h-8 rounded-md px-3.5 text-xs font-semibold ${theme === item ? 'bg-cyan-500/60 text-white' : 'text-slate-300 hover:bg-[#071f35]'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-1">
              <div>
                <p className="text-sm font-semibold text-white">{t('Language')}</p>
                <p className="text-xs text-slate-400">Select your preferred language</p>
              </div>
              <div className="flex rounded-lg border border-[#0d3660] p-1 self-start md:self-auto bg-[#020b18]/60">
                {([
                  { code: 'en', name: 'English' },
                  { code: 'hi', name: 'Hindi' },
                  { code: 'te', name: 'Telugu' }
                ] as const).map((item) => (
                  <button
                    key={item.code}
                    onClick={() => changeLanguage(item.code)}
                    className={`h-8 rounded-md px-3 text-xs font-semibold ${lang === item.code ? 'bg-cyan-500/60 text-white' : 'text-slate-300 hover:bg-[#071f35]'}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy */}
        <div className="glass rounded-xl p-5 card-hover">
          <h3 className="text-xs font-semibold text-[#22d3ee] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> {t('Security & Privacy')}
          </h3>
          <div className="space-y-1">
            {securityItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => item.label === 'Change Password' ? setPasswordOpen(true) : item.label === 'Privacy Policy' ? setPolicyOpen(true) : undefined}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#071f35] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0d3660] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#22d3ee]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{t(item.label)}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  {item.external ? (
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-[#22d3ee] transition-colors" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#22d3ee] transition-colors" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* About */}
        <div className="glass rounded-xl p-5 card-hover">
          <h3 className="text-xs font-semibold text-[#22d3ee] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" /> {t('About')}
          </h3>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#071f35]">
            <div>
              <p className="text-sm font-medium text-white">Aqua Pulse</p>
              <p className="text-xs text-slate-400">Smart Aquaculture Monitoring System</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white">1.2.0</p>
              <p className="text-xs text-slate-400">© 2024 Aqua Pulse</p>
            </div>
          </div>
        </div>
      </div>


      {/* Right Column */}
      <div className="space-y-5">
        {/* My Contacts */}
        <div className="glass rounded-xl p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-[#22d3ee] uppercase tracking-widest flex items-center gap-2">
              <Phone className="w-4 h-4" /> My Contacts
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={createContact}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#071f35] border border-[#0d3660] text-xs text-white hover:border-[#06b6d4] transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Contact
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {contacts.map((contact, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#071f35]/50 hover:bg-[#071f35] transition-all animate-slide-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}&backgroundColor=0a2a47`}
                  alt={contact.name}
                  className="w-10 h-10 rounded-full ring-1 ring-[#0d3660]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{contact.name}</span>
                    {contact.tag && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] shrink-0">{contact.tag}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{contact.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-slate-300">
                    <Phone className="w-3 h-3 text-[#22d3ee]" />
                    {contact.phone}
                  </div>
                  {!contact.readonly && (
                    <RowActionMenu 
                      onEdit={() => updateContact(contact)}
                      onDelete={() => deleteContact(contact)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Alert mode */}
          <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-[#071f35]/50">
            <span className="text-sm text-slate-300">Receive alerts & notifications via</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAlertMode('sms')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${alertMode === 'sms' ? 'bg-[#06b6d4] text-white' : 'bg-[#0d3660] text-slate-400 hover:text-white'}`}
              >
                <MessageCircle className="w-3.5 h-3.5" /> SMS
              </button>
              <button
                onClick={() => setAlertMode('email')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${alertMode === 'email' ? 'bg-[#06b6d4] text-white' : 'bg-[#0d3660] text-slate-400 hover:text-white'}`}
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass rounded-xl p-5 card-hover">
          <h3 className="text-xs font-semibold text-[#22d3ee] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" /> {t('Notifications')}
          </h3>
          <div className="space-y-3">
            {notifications.map((notif, i) => {
              const Icon = notif.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#071f35]/50 hover:bg-[#071f35] transition-all animate-slide-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#0d3660] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#22d3ee]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{notif.label}</p>
                    <p className="text-xs text-slate-400">{notif.desc}</p>
                  </div>
                  <Toggle
                    enabled={notif.enabled}
                    onChange={() => handleToggle(notif.key, notif.enabled)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#0d3660] bg-[#031426] p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Edit Profile</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-[#0d3660] bg-[#020b18] p-3">
                <img
                  src={profileForm.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileForm.full_name || 'agent'}&backgroundColor=0a2a47`}
                  alt={profileForm.full_name || 'Profile'}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-cyan-300/40 px-3 text-sm font-bold text-cyan-100 hover:bg-cyan-300/10">
                  <Upload className="h-4 w-4" />
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => handleProfileImage(event.target.files?.[0] || null)} />
                </label>
                {profileForm.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setProfileForm((current) => ({ ...current, avatarUrl: '' }))}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-400/40 px-3 text-sm font-bold text-red-200 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>
              <input
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                placeholder="Full name"
                className="h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18] px-3 text-sm text-white"
              />
              <input
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="Email"
                className="h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18] px-3 text-sm text-white"
              />
              <input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="Mobile number"
                className="h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18] px-3 text-sm text-white"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setProfileOpen(false)} className="h-10 rounded-lg border border-[#0d3660] px-4 text-sm text-slate-200">Cancel</button>
              <button onClick={saveProfile} className="h-10 rounded-lg bg-[#06b6d4] px-4 text-sm font-semibold text-white">Save</button>
            </div>
          </div>
        </div>
      )}
      {passwordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#0d3660] bg-[#031426] p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Change Password</h3>
            <div className="mt-4 space-y-3">
              <input type="password" value={passwordForm.current} onChange={(event) => setPasswordForm((current) => ({ ...current, current: event.target.value }))} placeholder="Current password" className="h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18] px-3 text-sm text-white" />
              <input type="password" value={passwordForm.next} onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))} placeholder="New password" className="h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18] px-3 text-sm text-white" />
              <input type="password" value={passwordForm.confirm} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm: event.target.value }))} placeholder="Confirm password" className="h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18] px-3 text-sm text-white" />
              {passwordMessage && (
                <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">{passwordMessage}</p>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => { setPasswordOpen(false); setPasswordMessage(''); }} className="h-10 rounded-lg border border-[#0d3660] px-4 text-sm text-slate-200">Cancel</button>
              <button onClick={handleChangePassword} className="h-10 rounded-lg bg-[#06b6d4] px-4 text-sm font-semibold text-white">Update</button>
            </div>
          </div>
        </div>
      )}
      {policyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-[#0d3660] bg-[#031426] p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Privacy Policy</h3>
            <div className="mt-4 max-h-[55vh] overflow-y-auto text-sm leading-6 text-slate-300">
              Aqua Pulse stores account, device, site, readings, alerts, emergency, and report data needed to operate aquaculture monitoring. Data is used for live monitoring, notifications, audit history, and owner or manager reporting. Access is role-based, and agents only see assigned sites and related operational contacts.
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setPolicyOpen(false)} className="h-10 rounded-lg bg-[#06b6d4] px-4 text-sm font-semibold text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
