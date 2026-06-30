import { useEffect, useState } from 'react';
import {
  Settings,
  Wrench,
  MessageSquare,
  Image,
  Clock,
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
  MoreVertical,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { useTheme, useTranslation } from '../lib/i18n';
import { RowActionMenu } from '../lib/tableActions';

const securityItems = [
  { label: 'Change Password', desc: 'Update your account password', icon: Lock },
  { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security', icon: Shield },
  { label: 'Privacy Policy', desc: 'View our privacy policy', icon: FileText, external: true },
];

const alertContacts = [
  { name: 'Rahul Verma', email: 'rahul.verma@aquapulse.com', phone: '+91 98765 43210', tag: 'Primary Contact' },
  { name: 'Priya Sharma', email: 'priya.sharma@aquapulse.com', phone: '+91 87654 32109', tag: null },
  { name: 'Arjun Mehta', email: 'arjun.mehta@aquapulse.com', phone: '+91 76543 21098', tag: null },
  { name: 'Sneha Reddy', email: 'sneha.reddy@aquapulse.com', phone: '+91 65432 10987', tag: null },
];

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

  async function loadSettings() {
    try {
      const session = getAuthSession();
      if (session) {
        const res = await apiRequest<any>('/settings', {
          token: session.token,
        });
        setData(res);
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
    { label: 'Email Notifications', desc: 'Receive alerts and updates via email', icon: Mail, enabled: prefs.email_alerts, key: 'email_alerts' },
    { label: 'SMS Notifications', desc: 'Receive critical alerts via SMS', icon: MessageCircle, enabled: prefs.sms_alerts, key: 'sms_alerts' },
    { label: 'System Updates', desc: 'Important system updates and announcements', icon: Info, enabled: prefs.push_alerts, key: 'push_alerts' },
    { label: 'Marketing Communications', desc: 'Product updates and other communications', icon: Megaphone, enabled: prefs.weekly_report, key: 'weekly_report' },
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
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-[#071f35] hover:bg-[#0a2a47] transition-all group">
            <div className="flex items-center gap-4">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'rahul'}&backgroundColor=0a2a47`}
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
                {(['Light', 'Dark', 'System'] as const).map((item) => (
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
                  { code: 'es', name: 'Español' },
                  { code: 'fr', name: 'Français' },
                  { code: 'te', name: 'తెలుగు' }
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
        {/* My Alerts */}
        <div className="glass rounded-xl p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-[#22d3ee] uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4" /> My Alerts
            </h3>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#071f35] border border-[#0d3660] text-xs text-white hover:border-[#06b6d4] transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Contact
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#071f35] border border-[#0d3660] text-xs text-white hover:border-[#06b6d4] transition-all">
                <Settings className="w-3.5 h-3.5" /> Manage
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {alertContacts.map((contact, i) => (
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
                  <RowActionMenu 
                    onEdit={() => alert(`Editing alert contact: ${contact.name}`)}
                    onDelete={() => alert(`Deleting alert contact: ${contact.name}`)}
                  />
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
            <Settings className="w-4 h-4" /> Notifications
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
    </div>
  );
}
