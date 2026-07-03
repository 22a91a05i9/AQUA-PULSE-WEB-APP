import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Info,
  Languages,
  LockKeyhole,
  Mail,
  Palette,
  Phone,
  Ruler,
  UserCog,
  UserPlus,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { useTheme, useTranslation } from '../lib/i18n';
import { RowActionMenu } from '../lib/tableActions';

type SettingsPanel = 'profile' | 'units' | 'timezone' | 'password' | null;

const SENSOR_UNITS = [
  { label: 'Temperature', unit: 'deg C' },
  { label: 'pH', unit: 'pH scale' },
  { label: 'Turbidity', unit: 'NTU' },
  { label: 'Ammonia', unit: 'mg/L' },
  { label: 'Dissolved Oxygen', unit: 'mg/L' },
  { label: 'Nitrate', unit: 'mg/L' },
  { label: 'Salinity', unit: 'ppt' },
  { label: 'Conductivity', unit: 'uS/cm' },
];

export default function SettingsPage({ onAddAgent }: { onAddAgent: () => void }) {
  const session = getAuthSession();
  const [ownerData, setOwnerData] = useState<any>(session?.user || null);
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [openPanel, setOpenPanel] = useState<SettingsPanel>(null);
  const detectedTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', []);
  const [selectedTimeZone, setSelectedTimeZone] = useState(detectedTimeZone);
  const { theme, changeTheme } = useTheme();
  const { t, lang, changeLanguage } = useTranslation();

  useEffect(() => {
    async function loadSettingsData() {
      try {
        const session = getAuthSession();
        if (session) {
          const res = await apiRequest<any>('/owner/overview', {
            token: session.token,
          });
          if (res.owner) {
            setOwnerData(res.owner);
          }
          if (res.agents) {
            setAgentsList(res.agents);
          }
        }
      } catch (err) {
        console.error('Failed to load settings data:', err);
      }
    }
    loadSettingsData();
  }, []);

  const handleDeleteAgent = async (agent: any) => {
    if (!window.confirm(`Are you sure you want to delete agent "${agent.full_name || agent.name}"?`)) {
      return;
    }
    try {
      const session = getAuthSession();
      if (!session) return;
      await apiRequest(`/owner/agents/${agent.id}`, {
        method: 'DELETE',
        token: session.token,
      });
      setAgentsList((prev) => prev.filter((a) => a.id !== agent.id));
      setMessage(`Agent "${agent.full_name || agent.name}" deleted successfully.`);
    } catch (err: any) {
      console.error('Failed to delete agent:', err);
      alert(err?.detail || err?.message || 'Failed to delete agent.');
    }
  };

  const handleEditAgent = async (agent: any) => {
    const newName = window.prompt('Edit name for agent:', agent.full_name || agent.name);
    if (newName === null) return;
    const newPhone = window.prompt('Edit phone for agent:', agent.phone || '');
    if (newPhone === null) return;

    try {
      const session = getAuthSession();
      if (!session) return;
      const updated = await apiRequest<any>(`/owner/agents/${agent.id}`, {
        method: 'PUT',
        token: session.token,
        body: {
          full_name: newName.trim(),
          phone: newPhone.trim(),
        },
      });
      setAgentsList((prev) => prev.map((a) => (a.id === agent.id ? updated : a)));
      setMessage('Agent profile updated successfully.');
    } catch (err: any) {
      console.error('Failed to update agent:', err);
      alert(err?.detail || err?.message || 'Failed to update agent.');
    }
  };

  const ownerName = ownerData?.full_name || ownerData?.name || 'Owner User';
  const ownerEmail = ownerData?.email || '';
  const ownerPhone = ownerData?.phone || 'No phone registered';
  const ownerRole = ownerData?.role ? ownerData.role.charAt(0).toUpperCase() + ownerData.role.slice(1) : 'Owner';
  const timeZoneOptions = [
    detectedTimeZone,
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Singapore',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
  ].filter((zone, index, zones) => zones.indexOf(zone) === index);

  const togglePanel = (panel: Exclude<SettingsPanel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="glass rounded-xl p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-white">
          {t('My Account')} <UserRound className="h-4 w-4 text-cyan-300" />
        </h2>
        <button
          onClick={() => togglePanel('profile')}
          className="flex w-full items-center gap-5 rounded-lg p-1 text-left transition hover:bg-[#071f35]/50"
        >
          <img className="h-16 w-16 rounded-full" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ownerName}&backgroundColor=0a2a47`} alt={ownerName} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold text-white">{ownerName}</p>
              <span className="rounded-md bg-cyan-500/15 px-2 py-1 text-xs font-bold text-cyan-300">{ownerRole}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-8 text-sm text-slate-300">
              <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> {ownerEmail}</span>
              <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> {ownerPhone}</span>
            </div>
          </div>
          <ChevronRight className={`h-6 w-6 text-slate-300 transition ${openPanel === 'profile' ? 'rotate-90' : ''}`} />
        </button>
        {openPanel === 'profile' && (
          <div className="mt-5 rounded-lg border border-[#0d3660] bg-[#031528]/60 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-cyan-200">
              <UserCog className="h-4 w-4" />
              Edit Profile
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full Name" value={ownerName} />
              <Field label="Role" value={ownerRole} />
              <Field label="Email" value={ownerEmail || 'No email registered'} />
              <Field label="Phone" value={ownerPhone} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button onClick={() => setMessage('Profile edit form is ready to connect.')} className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700">
                Save Profile
              </button>
              <p className="text-sm text-slate-400">Connect this form to the owner profile API when available.</p>
            </div>
          </div>
        )}
      </section>

      <section className="glass rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase text-white">{t('My Account Team')}</h2>
          <button
            onClick={onAddAgent}
            className="flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-700 px-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,165,233,0.22)] transition hover:brightness-110"
          >
            <UserPlus className="h-4 w-4" />
            {t('Add Agent')}
          </button>
        </div>
        <div className="divide-y divide-[#0d3660]/70">
          {agentsList.map((member) => (
            <div key={member.email} className="grid grid-cols-[1fr_1.3fr_0.9fr_0.35fr_40px] items-center gap-4 py-4">
              <div className="flex items-center gap-4">
                <img className="h-11 w-11 rounded-full" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.full_name || member.name}&backgroundColor=0a2a47`} alt={member.full_name || member.name} />
                <div>
                  <p className="font-bold text-white">{member.full_name || member.name} <span className="ml-2 rounded bg-cyan-500/15 px-2 py-1 text-xs text-cyan-300">{member.role ? member.role.toUpperCase() : 'AGENT'}</span></p>
                </div>
              </div>
              <p className="flex items-center gap-2 text-sm text-slate-300"><Mail className="h-4 w-4" /> {member.email}</p>
              <p className="flex items-center gap-2 text-sm text-slate-300"><Phone className="h-4 w-4" /> {member.phone || 'No phone'}</p>
              <span className="rounded-md bg-cyan-500/15 px-2 py-1 text-center text-xs font-bold text-cyan-300">Agent</span>
              <RowActionMenu onEdit={() => handleEditAgent(member)} onDelete={() => handleDeleteAgent(member)} />
            </div>
          ))}
          {agentsList.length === 0 && (
            <p className="py-4 text-sm text-slate-400">No agents registered under this owner yet.</p>
          )}
        </div>
        <button onClick={() => setMessage('Team agents list opened.')} className="mt-3 flex items-center gap-2 text-sm text-white">
          {t('View all team Agents')} <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <section className="glass rounded-xl p-5">
        <h2 className="mb-3 text-sm font-bold uppercase text-white">{t('Preferences')}</h2>
        <SettingRow icon={Palette} title={t('Theme')} desc="Choose your application theme">
          <div className="flex rounded-lg border border-[#0d3660] p-1">
            {(['Light', 'Dark'] as const).map((item) => (
              <button
                key={item}
                onClick={() => changeTheme(item)}
                className={`h-9 rounded-md px-5 text-sm font-semibold ${theme === item ? 'bg-cyan-500/60 text-white' : 'text-slate-300 hover:bg-[#071f35]'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow
          icon={Ruler}
          title={t('Units')}
          desc="Select measurement units"
          value="Metric (deg C, mg/L)"
          expanded={openPanel === 'units'}
          onClick={() => togglePanel('units')}
        />
        {openPanel === 'units' && (
          <div className="border-b border-[#0d3660]/70 px-10 pb-5">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {SENSOR_UNITS.map((sensor) => (
                <div key={sensor.label} className="rounded-lg border border-[#0d3660] bg-[#031528]/60 p-3">
                  <p className="text-sm font-semibold text-white">{sensor.label}</p>
                  <p className="text-sm text-cyan-200">{sensor.unit}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <SettingRow icon={Languages} title={t('Language')} desc="Select your preferred language">
          <div className="flex rounded-lg border border-[#0d3660] p-1">
            {([
              { code: 'en', name: 'English' },
              { code: 'te', name: 'తెలుగు' },
              { code: 'hi', name: 'हिंदी' },
            ] as const).map((item) => (
              <button
                key={item.code}
                onClick={() => changeLanguage(item.code)}
                className={`h-9 rounded-md px-3.5 text-xs font-semibold ${lang === item.code ? 'bg-cyan-500/60 text-white' : 'text-slate-300 hover:bg-[#071f35]'}`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow
          icon={Clock}
          title={t('Time Zone')}
          desc="Select your current time zone"
          value={selectedTimeZone}
          expanded={openPanel === 'timezone'}
          onClick={() => togglePanel('timezone')}
        />
        {openPanel === 'timezone' && (
          <div className="border-b border-[#0d3660]/70 px-10 pb-5">
            <div className="rounded-lg border border-[#0d3660] bg-[#031528]/60 p-4">
              <p className="text-sm text-slate-300">Automatically detected</p>
              <p className="mt-1 font-semibold text-white">{detectedTimeZone}</p>
              <select
                value={selectedTimeZone}
                onChange={(event) => setSelectedTimeZone(event.target.value)}
                className="mt-4 h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18] px-3 text-sm text-white outline-none md:w-80"
              >
                {timeZoneOptions.map((zone) => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      <section className="glass rounded-xl p-5">
        <h2 className="mb-3 text-sm font-bold uppercase text-white">{t('Account & Security')}</h2>
        <SettingRow
          icon={LockKeyhole}
          title={t('Change Password')}
          desc="Update your account password"
          expanded={openPanel === 'password'}
          onClick={() => togglePanel('password')}
        />
        {openPanel === 'password' && (
          <div className="px-10 pb-5">
            <div className="grid gap-4 rounded-lg border border-[#0d3660] bg-[#031528]/60 p-5 md:grid-cols-3">
              <PasswordField label="Current Password" />
              <PasswordField label="New Password" />
              <PasswordField label="Confirm Password" />
              <button onClick={() => setMessage('Password change form is ready to connect.')} className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 md:w-fit">
                Update Password
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="glass rounded-xl p-5">
        <h2 className="mb-3 text-sm font-bold uppercase text-white">{t('About')}</h2>
        <SettingRow icon={Info} title={t('App Version')} value="v2.3.1" />
      </section>

      {message && <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      {label}
      <input defaultValue={value} className="h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/70 px-3 text-white outline-none focus:border-cyan-400" />
    </label>
  );
}

function PasswordField({ label }: { label: string }) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      {label}
      <input type="password" className="h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/70 px-3 text-white outline-none" />
    </label>
  );
}

function SettingRow({
  icon: Icon,
  title,
  desc,
  value,
  children,
  expanded,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  desc?: string;
  value?: string;
  children?: ReactNode;
  expanded?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <Icon className="h-6 w-6 text-cyan-300" />
      <div className="flex-1">
        <p className="font-semibold text-white">{title}</p>
        {desc && <p className="text-sm text-slate-300">{desc}</p>}
      </div>
      {children || <span className="text-sm text-slate-300">{value}</span>}
      {!children && <ChevronRight className={`h-5 w-5 text-slate-300 transition ${expanded ? 'rotate-90' : ''}`} />}
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="flex w-full items-center gap-4 border-b border-[#0d3660]/70 py-4 text-left last:border-0">
        {content}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center gap-4 border-b border-[#0d3660]/70 py-4 text-left last:border-0">
      {content}
    </div>
  );
}
