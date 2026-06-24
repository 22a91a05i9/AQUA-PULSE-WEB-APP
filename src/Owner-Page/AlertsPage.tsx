import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Cpu,
  Download,
  FileText,
  Filter,
  Folder,
  Info,
  Mail,
  MapPin,
  Microscope,
  Search,
  Send,
  Shield,
  UserRound,
  Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type AlertTone = 'Critical' | 'Warning' | 'Info' | 'Resolved';

type AlertRow = {
  title: string;
  site: string;
  metric: string;
  time: string;
  tone: AlertTone;
  deviceId: string;
  alertType: string;
  deviceType: string;
  pond: string;
  farm: string;
  firmware: string;
  description: string;
};

const activeAlerts: AlertRow[] = [
  { title: 'DVC-003 - Dissolved Oxygen Low', site: 'Pond 03  -  Central Farm', metric: 'DO: 2.1 mg/L    down 52%', time: '10 min ago', tone: 'Critical', deviceId: 'DVC-003', alertType: 'Dissolved Oxygen Low', deviceType: 'Water Quality Monitor', pond: 'Pond 03', farm: 'Central Farm', firmware: 'v2.4.1', description: 'Dissolved Oxygen level is below the threshold limit. Immediate action required.' },
  { title: 'DVC-007 - pH Level High', site: 'Pond 01  -  North Lake Farm', metric: 'pH: 8.9    up 15%', time: '25 min ago', tone: 'Critical', deviceId: 'DVC-007', alertType: 'pH Level High', deviceType: 'pH Sensor', pond: 'Pond 01', farm: 'North Lake Farm', firmware: 'v2.2.0', description: 'pH level is above the safe operating range. Check water treatment and buffering schedule.' },
  { title: 'DVC-005 - High Turbidity', site: 'Pond 02  -  Sunrise Aqua Park', metric: 'Turbidity: 86 NTU', time: '1 hr ago', tone: 'Warning', deviceId: 'DVC-005', alertType: 'High Turbidity', deviceType: 'Turbidity Sensor', pond: 'Pond 02', farm: 'Sunrise Aqua Park', firmware: 'v2.3.4', description: 'Turbidity has exceeded the preferred range. Inspect aeration, feed residue, and pond inflow.' },
];

const occurredAlerts: AlertRow[] = [
  { title: 'DVC-001 - Device Battery Low', site: 'Pond 01  -  North Farm', metric: 'Battery: 15%', time: '2 hr ago', tone: 'Info', deviceId: 'DVC-001', alertType: 'Device Battery Low', deviceType: 'Temperature Sensor', pond: 'Pond 01', farm: 'North Farm', firmware: 'v2.5.1', description: 'Battery has dropped below the recommended reserve level. Schedule replacement or recharge.' },
  { title: 'DVC-004 - Water Quality Normal', site: 'Pond 04  -  West Farm', metric: 'All parameters normal', time: '3 hr ago', tone: 'Resolved', deviceId: 'DVC-004', alertType: 'Water Quality Normal', deviceType: 'Water Quality Sensor', pond: 'Pond 04', farm: 'West Farm', firmware: 'v2.4.2', description: 'All monitored parameters returned to normal operating limits.' },
  { title: 'System - Maintenance Scheduled', site: 'All Sites', metric: 'Maintenance window', time: 'May 17, 09:00 PM', tone: 'Info', deviceId: 'SYSTEM', alertType: 'Maintenance Scheduled', deviceType: 'System Notice', pond: 'All Sites', farm: 'All Sites', firmware: 'Platform', description: 'Scheduled maintenance window has been created for device inspection and calibration.' },
];

const toneStyles: Record<AlertTone, { text: string; bg: string; border: string; icon: LucideIcon }> = {
  Critical: { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/50', icon: Bell },
  Warning: { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/50', icon: AlertTriangle },
  Info: { text: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/50', icon: Info },
  Resolved: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/50', icon: CheckCircle2 },
};

export default function AlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<AlertRow | null>(null);

  if (selectedAlert) {
    return <AlertDetails alert={selectedAlert} onBack={() => setSelectedAlert(null)} />;
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <AlertSummary tone="Critical" label="Critical Alerts" value="8" desc="Immediate action required" />
        <AlertSummary tone="Warning" label="Warnings" value="12" desc="Attention needed" />
        <AlertSummary tone="Info" label="Info Alerts" value="6" desc="For your information" />
        <AlertSummary tone="Resolved" label="Resolved" value="24" desc="Last 7 days" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[320px] flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
          <input className="h-12 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/55 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-400" placeholder="Search alerts by device, pond or site..." />
        </div>
        {['All Severities', 'All Sites', 'All Statuses'].map((label) => (
          <button key={label} className="flex h-12 min-w-48 items-center justify-between rounded-lg border border-[#0d3660] bg-[#020b18]/55 px-4 text-sm font-semibold text-white">
            {label}
            <ChevronRight className="h-4 w-4 rotate-90" />
          </button>
        ))}
        <button className="flex h-12 items-center gap-3 rounded-lg border border-[#0d3660] px-7 text-sm font-semibold text-white">
          <Filter className="h-5 w-5" /> Filter
        </button>
        <button className="flex h-12 items-center gap-3 rounded-lg border border-[#0d3660] px-7 text-sm font-semibold text-white">
          <Download className="h-5 w-5" /> Export
        </button>
      </div>

      <section className="glass overflow-hidden rounded-lg">
        <h2 className="border-b border-[#0d3660] px-5 py-4 text-sm font-bold text-red-400">ACTIVE ALERTS (3)</h2>
        <div className="divide-y divide-[#0d3660]/60 px-5">
          {activeAlerts.map((alert) => (
            <AlertListRow key={alert.title} alert={alert} onClick={() => setSelectedAlert(alert)} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="px-5 pb-1 text-sm font-bold text-cyan-300">OCCURRED (3)</h2>
        <div className="glass divide-y divide-[#0d3660]/60 rounded-lg px-5">
          {occurredAlerts.map((alert) => (
            <AlertListRow key={alert.title} alert={alert} onClick={() => setSelectedAlert(alert)} />
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between text-sm text-white">
        <span>Showing 1 to 6 of 6 alerts</span>
        <div className="flex items-center gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-md border border-[#0d3660] text-slate-400"><ChevronLeft className="h-4 w-4" /></button>
          <button className="h-10 w-10 rounded-md bg-blue-600 font-bold">1</button>
          <button className="flex h-10 w-10 items-center justify-center rounded-md border border-[#0d3660] text-slate-400"><ChevronRight className="h-4 w-4" /></button>
          <span className="ml-8">Rows per page</span>
          <button className="h-10 rounded-md border border-[#0d3660] px-4">10</button>
        </div>
      </div>
    </div>
  );
}

function AlertSummary({ tone, label, value, desc }: { tone: AlertTone; label: string; value: string; desc: string }) {
  const style = toneStyles[tone];
  const Icon = style.icon;

  return (
    <section className="glass rounded-lg p-5">
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${style.border} ${style.bg}`}>
          <Icon className={`h-7 w-7 ${style.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          <p className="mt-3 text-sm text-white">{desc}</p>
        </div>
        <svg viewBox="0 0 90 36" className={`mt-12 h-9 w-24 ${style.text}`} fill="none">
          <path d="M2 28 L12 27 L22 18 L32 23 L42 12 L52 31 L62 15 L72 7 L82 18 L90 10" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </section>
  );
}

function AlertListRow({ alert, onClick }: { alert: AlertRow; onClick?: () => void }) {
  const style = toneStyles[alert.tone];
  const Icon = style.icon;

  return (
    <button onClick={onClick} className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-5 py-4 text-left transition hover:bg-[#071f35]/35">
      <div className="flex items-center gap-5">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${style.border} ${style.bg}`}>
          <Icon className={`h-7 w-7 ${style.text}`} />
        </div>
        <div>
          <p className="font-bold text-white">{alert.title}</p>
          <p className="mt-1 text-slate-300">{alert.site}</p>
          <p className={`mt-1 font-bold ${style.text}`}>{alert.metric}</p>
        </div>
      </div>
      <span className={`font-semibold ${style.text}`}>{alert.time}</span>
      <div className="flex items-center gap-8">
        <span className={`rounded-md border px-3 py-1 text-sm font-bold ${style.border} ${style.text}`}>{alert.tone}</span>
        <ChevronRight className="h-5 w-5 text-white" />
      </div>
    </button>
  );
}

function AlertDetails({ alert, onBack }: { alert: AlertRow; onBack: () => void }) {
  const style = toneStyles[alert.tone];
  const AlertIcon = style.icon;
  const details: Array<[string, string, LucideIcon]> = [
    ['Alert Type', alert.alertType, AlertTriangle],
    ['Severity', alert.tone, Shield],
    ['Status', alert.tone === 'Resolved' ? 'Resolved' : 'Active', Waves],
    ['Triggered At', 'May 18, 2024 - 10:21 AM', Clock3],
    ['Acknowledged At', alert.tone === 'Info' ? 'Pending' : 'May 18, 2024 - 10:31 AM', CheckCircle2],
    ['Acknowledged By', 'Rahul Verma', UserRound],
    ['Category', alert.deviceId === 'SYSTEM' ? 'Maintenance' : 'Water Quality', Folder],
    ['Description', alert.description, FileText],
  ];

  const deviceInfo: Array<[string, string, LucideIcon]> = [
    ['Device ID', alert.deviceId, Cpu],
    ['Device Type', alert.deviceType, Microscope],
    ['Site', alert.farm, MapPin],
    ['Pond', alert.pond, Waves],
    ['Last Seen', 'May 18, 2024 - 10:21 AM', Clock3],
    ['Firmware Version', alert.firmware, Cpu],
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-[#071f35]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Alert Details</h2>
          <p className="mt-1 text-sm text-white">View detailed information about the alert and related device.</p>
        </div>
      </div>

      <section className={`rounded-lg border p-5 ${style.border} ${alert.tone === 'Critical' ? 'bg-red-950/25' : 'bg-[#071f35]/70'}`}>
        <div className="flex items-center gap-5">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full ${style.bg} ${style.text}`}>
            <AlertIcon className="h-12 w-12" />
          </div>
          <div className="flex-1">
            <p className={`font-bold ${style.text}`}><span className="mr-2 inline-block h-3 w-3 rounded-full bg-current" />{alert.tone}</p>
            <h3 className="mt-4 text-2xl font-bold text-white">{alert.title}</h3>
            <p className="mt-2 text-white">{alert.pond} <span className="mx-4">-</span> {alert.farm}</p>
            <p className={`mt-4 font-bold ${style.text}`}>{alert.metric}</p>
          </div>
          <span className={`text-lg font-bold ${style.text}`}>{alert.time}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1fr]">
        <section className="glass rounded-lg p-5">
          <h3 className="mb-4 text-lg font-bold text-white">Alert Details</h3>
          <InfoList items={details} />
        </section>

        <div className="space-y-4">
          <section className="glass rounded-lg p-5">
            <h3 className="mb-4 text-lg font-bold text-white">Device Information</h3>
            <InfoList items={deviceInfo} />
          </section>
          <section className="glass rounded-lg p-5">
            <h3 className="mb-4 text-lg font-bold text-white">Additional Actions</h3>
            <button className="flex w-full items-center justify-between border-t border-[#0d3660]/60 py-4 text-white"><span className="flex items-center gap-4"><Cpu className="h-5 w-5 text-cyan-300" />View Device Dashboard</span><ChevronRight /></button>
            <button className="flex w-full items-center justify-between border-t border-[#0d3660]/60 py-4 text-white"><span className="flex items-center gap-4"><Waves className="h-5 w-5 text-cyan-300" />View Live Monitoring</span><ChevronRight /></button>
          </section>
          <section className="glass flex items-center justify-between rounded-lg p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/40">
                <Mail className="h-7 w-7 text-white" />
              </div>
              <p className="max-w-md text-lg text-white">Got a tele call or SMS and Email to assigned contacts immediately.</p>
            </div>
            <button className="rounded-lg border border-cyan-400 px-5 py-3 font-semibold text-cyan-300">Manage Contacts</button>
          </section>
        </div>
      </div>

      <section className="glass rounded-lg p-5">
        <h3 className="mb-5 text-lg font-bold text-white">Alert Timeline</h3>
        {[
          ['Alert Triggered', 'Dissolved Oxygen level dropped below threshold (2.5 mg/L)', '10:21 AM'],
          ['Alert Acknowledged', 'Acknowledged by Rahul Verma', '10:31 AM'],
          ['Investigating', 'Issue is under investigation', '10:35 AM'],
        ].map(([title, desc, time], index) => (
          <div key={title} className="grid grid-cols-[36px_1fr_auto] gap-4 pb-4 text-sm">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full ${index === 0 ? 'bg-red-500 text-white' : index === 1 ? 'bg-amber-500 text-black' : 'bg-sky-500 text-white'}`}>{index + 1}</div>
            <div>
              <p className="font-bold text-white">{title}</p>
              <p className="mt-1 text-slate-300">{desc}</p>
            </div>
            <p className="text-right text-white">{time}<br />May 18, 2024</p>
          </div>
        ))}
      </section>

      <button className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-sky-500 to-blue-700 font-bold text-white">
        <Send className="h-5 w-5" />
        Send Tele Alert
      </button>
    </div>
  );
}

function InfoList({ items }: { items: Array<[string, string, LucideIcon]> }) {
  return (
    <div className="divide-y divide-[#0d3660]/60">
      {items.map(([label, value, Icon]) => (
        <div key={label} className="grid grid-cols-[32px_1fr_1.1fr] items-start gap-4 py-3 text-sm">
          <Icon className="h-5 w-5 text-cyan-300" />
          <span className="text-white">{label}</span>
          <span className="text-right text-white">{value}</span>
        </div>
      ))}
    </div>
  );
}
