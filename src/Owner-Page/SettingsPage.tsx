import { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  ChevronRight,
  Globe2,
  Info,
  LockKeyhole,
  Mail,
  MoreVertical,
  Phone,
  ShieldCheck,
  UserPlus,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const teamMembers = [
  { name: 'Rahul Verma', role: 'Administrator', email: 'rahul.verma@aquapulse.com', phone: '+91 98765 43210', tag: 'You' },
  { name: 'Neha Patel', role: 'Manager', email: 'neha.patel@aquapulse.com', phone: '+91 87654 32109', tag: '5 Agents' },
  { name: 'Arjun Singh', role: 'Operator', email: 'arjun.singh@aquapulse.com', phone: '+91 76543 21098', tag: '2 Agents' },
];

export default function SettingsPage({ onAddAgent }: { onAddAgent: () => void }) {
  const [theme, setTheme] = useState<'Light' | 'Dark' | 'System'>('Dark');
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="glass rounded-xl p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-white">
          My Account <UserRound className="h-4 w-4 text-cyan-300" />
        </h2>
        <button
          onClick={() => setMessage('Profile editor opened.')}
          className="flex w-full items-center gap-5 rounded-lg p-1 text-left transition hover:bg-[#071f35]/50"
        >
          <img className="h-16 w-16 rounded-full" src="https://api.dicebear.com/7.x/avataaars/svg?seed=rahul&backgroundColor=0a2a47" alt="Rahul Verma" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold text-white">Rahul Verma</p>
              <span className="rounded-md bg-cyan-500/15 px-2 py-1 text-xs font-bold text-cyan-300">Administrator</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-8 text-sm text-slate-300">
              <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> rahul.verma@aquapulse.com</span>
              <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 98765 43210</span>
            </div>
          </div>
          <ChevronRight className="h-6 w-6 text-slate-300" />
        </button>
      </section>

      <section className="glass rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase text-white">My Account Team</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setMessage('Invite user flow opened.')}
              className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-300/10"
            >
              <UserPlus className="h-4 w-4" />
              Invite User
            </button>
            <button
              onClick={onAddAgent}
              className="flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-700 px-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,165,233,0.22)] transition hover:brightness-110"
            >
              <UserPlus className="h-4 w-4" />
              Add Agent
            </button>
          </div>
        </div>
        <div className="divide-y divide-[#0d3660]/70">
          {teamMembers.map((member) => (
            <div key={member.email} className="grid grid-cols-[1fr_1.3fr_0.9fr_0.35fr_40px] items-center gap-4 py-4">
              <div className="flex items-center gap-4">
                <img className="h-11 w-11 rounded-full" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}&backgroundColor=0a2a47`} alt={member.name} />
                <div>
                  <p className="font-bold text-white">{member.name} <span className="ml-2 rounded bg-cyan-500/15 px-2 py-1 text-xs text-cyan-300">{member.role}</span></p>
                </div>
              </div>
              <p className="flex items-center gap-2 text-sm text-slate-300"><Mail className="h-4 w-4" /> {member.email}</p>
              <p className="flex items-center gap-2 text-sm text-slate-300"><Phone className="h-4 w-4" /> {member.phone}</p>
              <span className="rounded-md bg-cyan-500/15 px-2 py-1 text-center text-xs font-bold text-cyan-300">{member.tag}</span>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-[#071f35]">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setMessage('Team agents list opened.')} className="mt-3 flex items-center gap-2 text-sm text-white">
          View all team Agents <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <section className="glass rounded-xl p-5">
        <h2 className="mb-3 text-sm font-bold uppercase text-white">Preferences</h2>
        <SettingRow icon={Briefcase} title="Theme" desc="Choose your application theme">
          <div className="flex rounded-lg border border-[#0d3660] p-1">
            {(['Light', 'Dark', 'System'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setTheme(item)}
                className={`h-9 rounded-md px-5 text-sm font-semibold ${theme === item ? 'bg-cyan-500/60 text-white' : 'text-slate-300 hover:bg-[#071f35]'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow icon={Briefcase} title="Units" desc="Select measurement units" value="Metric (deg C, mg/L)" />
        <SettingRow icon={Globe2} title="Language" desc="Select your preferred language" value="English" />
        <SettingRow icon={Globe2} title="Time Zone" desc="Select your current time zone" value="(GMT+05:30) Asia/Kolkata" />
      </section>

      <section className="glass rounded-xl p-5">
        <h2 className="mb-3 text-sm font-bold uppercase text-white">Account & Security</h2>
        <SettingRow icon={LockKeyhole} title="Change Password" desc="Update your account password" />
        <SettingRow icon={ShieldCheck} title="Two-Factor Authentication" desc="Add an extra layer of security" />
      </section>

      <section className="glass rounded-xl p-5">
        <h2 className="mb-3 text-sm font-bold uppercase text-white">About</h2>
        <SettingRow icon={Info} title="App Version" value="v2.3.1" />
      </section>

      {message && <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  desc,
  value,
  children,
}: {
  icon: LucideIcon;
  title: string;
  desc?: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <button className="flex w-full items-center gap-4 border-b border-[#0d3660]/70 py-4 text-left last:border-0">
      <Icon className="h-6 w-6 text-cyan-300" />
      <div className="flex-1">
        <p className="font-semibold text-white">{title}</p>
        {desc && <p className="text-sm text-slate-300">{desc}</p>}
      </div>
      {children || <span className="text-sm text-slate-300">{value}</span>}
      {!children && <ChevronRight className="h-5 w-5 text-slate-300" />}
    </button>
  );
}
