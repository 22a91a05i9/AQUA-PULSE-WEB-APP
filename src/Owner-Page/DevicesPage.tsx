import { useState } from 'react';
import {
  ArrowLeft,
  Battery,
  ChevronRight,
  Cpu,
  Download,
  Filter,
  MapPin,
  MoreVertical,
  Search,
  SignalHigh,
  UserRound,
  Wifi,
  WifiOff,
  Wrench,
  Zap,
} from 'lucide-react';

type DeviceStatus = 'Online' | 'Warning' | 'Offline';

type Device = {
  id: string;
  name: string;
  version: string;
  status: DeviceStatus;
  site: string;
  pond: string;
  agent: string;
  area: string;
  seen: string;
  battery: number;
  batteryLabel: string;
};

const devices: Device[] = [
  { id: 'DVC-001', name: 'Temperature Sensor 1', version: 'v2', status: 'Online', site: 'North Farm', pond: 'Pond 01', agent: 'Agent-001', area: 'Area 1', seen: '2 min ago', battery: 96, batteryLabel: 'Excellent' },
  { id: 'DVC-002', name: 'pH Sensor 1', version: 'v2', status: 'Online', site: 'East Farm', pond: 'Pond 02', agent: 'Agent-002', area: 'Area 1', seen: '3 min ago', battery: 92, batteryLabel: 'Excellent' },
  { id: 'DVC-003', name: 'DO Sensor 1', version: 'v1', status: 'Online', site: 'Central Farm', pond: 'Pond 03', agent: 'Agent-003', area: 'Area 2', seen: '5 min ago', battery: 88, batteryLabel: 'Good' },
  { id: 'DVC-004', name: 'Turbidity Sensor 1', version: 'v1', status: 'Warning', site: 'South Farm', pond: 'Pond 04', agent: 'Agent-004', area: 'Area 2', seen: '11 min ago', battery: 72, batteryLabel: 'Fair' },
  { id: 'DVC-005', name: 'Water Level Sensor', version: 'v2', status: 'Offline', site: 'West Farm', pond: 'Pond 05', agent: 'Agent-005', area: 'Area 3', seen: '1 hr ago', battery: 0, batteryLabel: 'Offline' },
  { id: 'DVC-006', name: 'Ammonia Sensor', version: 'v1', status: 'Online', site: 'North Farm', pond: 'Pond 06', agent: 'Agent-001', area: 'Area 1', seen: '2 min ago', battery: 94, batteryLabel: 'Excellent' },
  { id: 'DVC-007', name: 'Temperature Sensor 2', version: 'v2', status: 'Online', site: 'East Farm', pond: 'Pond 07', agent: 'Agent-002', area: 'Area 1', seen: '4 min ago', battery: 90, batteryLabel: 'Excellent' },
  { id: 'DVC-008', name: 'pH Sensor 2', version: 'v1', status: 'Warning', site: 'Central Farm', pond: 'Pond 08', agent: 'Agent-003', area: 'Area 2', seen: '8 min ago', battery: 68, batteryLabel: 'Fair' },
];

const statusClass: Record<DeviceStatus, string> = {
  Online: 'text-emerald-400',
  Warning: 'text-amber-400',
  Offline: 'text-red-400',
};

export default function DevicesPage() {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  if (selectedDevice) {
    return <DeviceDetails device={selectedDevice} onBack={() => setSelectedDevice(null)} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <StatCard icon={Cpu} label="Total Devices" value="32" tone="cyan" desc="+18% vs last month" />
        <StatCard icon={Wifi} label="Online" value="24" tone="green" desc="+20% vs last month" />
        <StatCard icon={Zap} label="Warning" value="3" tone="amber" desc="-25% vs last month" />
        <StatCard icon={WifiOff} label="Offline" value="3" tone="purple" desc="-25% vs last month" />
        <StatCard icon={Wrench} label="Maintenance" value="2" tone="slate" desc="-33% vs last month" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#0d3660]/60 pt-5">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input className="h-12 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/60 pl-12 pr-4 text-sm text-white outline-none" placeholder="Search devices..." />
        </div>
        <div className="flex flex-wrap gap-3">
          {['All Types', 'All Sites', 'All Status'].map((label) => (
            <button key={label} className="flex h-12 min-w-40 items-center justify-between gap-8 rounded-lg border border-[#0d3660] bg-[#020b18]/60 px-4 text-sm text-white">
              {label}
              <ChevronRight className="h-4 w-4 rotate-90" />
            </button>
          ))}
          <button className="flex h-12 items-center gap-2 rounded-lg border border-[#0d3660] px-5 text-sm font-semibold text-white">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="flex h-12 items-center gap-2 rounded-lg border border-[#0d3660] px-5 text-sm font-semibold text-white">
            <Download className="h-4 w-4" /> Sort
          </button>
        </div>
      </div>

      <section className="glass overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-[#071f35]/70 text-xs uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-5 py-4">Device ID</th>
                <th>Device Name</th>
                <th>Status</th>
                <th>Site</th>
                <th>Last Seen</th>
                <th>Battery</th>
                <th className="text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0d3660]/60">
              {devices.map((device) => (
                <tr key={device.id} onClick={() => setSelectedDevice(device)} className="cursor-pointer transition hover:bg-[#071f35]/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                        <Cpu className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{device.id} <span className="ml-2 rounded bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">{device.version}</span></p>
                        <p className="mt-1 text-slate-300">{device.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-white">{device.name}</td>
                  <td>
                    <p className={`font-bold ${statusClass[device.status]}`}><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-current" />{device.status}</p>
                    <p className="mt-1 text-slate-300">{device.status === 'Warning' ? 'Medium' : device.status === 'Offline' ? 'Weak' : 'Strong'}</p>
                  </td>
                  <td>
                    <p className="text-white">{device.site}</p>
                    <p className="mt-1">
                      <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">{device.pond}</span>
                      <span className="ml-3 inline-flex items-center gap-1 text-slate-300"><UserRound className="h-4 w-4" />{device.agent}</span>
                      <span className="ml-3 rounded bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">{device.area}</span>
                    </p>
                  </td>
                  <td>
                    <p className={device.status === 'Offline' ? 'font-bold text-red-400' : 'font-bold text-emerald-400'}>{device.seen}</p>
                    <p className="mt-1 text-slate-300">May 18, 10:32 AM</p>
                  </td>
                  <td>
                    <p className={device.battery === 0 ? 'text-red-400' : device.battery < 75 ? 'text-amber-400' : 'text-white'}>
                      <Battery className="mr-2 inline h-5 w-5" />{device.battery}%
                    </p>
                    <p className="mt-1 text-slate-300">{device.batteryLabel}</p>
                  </td>
                  <td className="pr-5 text-right">
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-[#071f35]">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DeviceDetails({ device, onBack }: { device: Device; onBack: () => void }) {
  const metrics = [
    ['Temperature', '23.5 deg C', 'Normal'],
    ['pH', '7.25', 'Normal'],
    ['Dissolved Oxygen', '8.2 mg/L', 'Normal'],
    ['Turbidity', '86 NTU', 'Normal'],
    ['Conductivity', '520 uS/cm', 'Normal'],
    ['Salinity', '0.5 PSU', 'Normal'],
    ['Battery Level', '78%', 'Good'],
    ['Data Interval', '10 min', ''],
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-[#071f35]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-white">{device.id} <span className="text-base text-emerald-400">● Online</span></h2>
          <p className="mt-2 text-slate-300">Devices &gt; {device.id}</p>
        </div>
      </div>

      <section className="glass grid grid-cols-1 gap-6 rounded-xl p-6 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr]">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-blue-500/25 text-cyan-200">
            <Cpu className="h-10 w-10" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white">{device.id} <span className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">v2.5.1</span></p>
            <p className="mt-2 text-slate-300">Aquasense Pro</p>
            <p className="mt-1 text-slate-400">AS-PRO-1001</p>
          </div>
        </div>
        <DetailTop label="Status" value="Online" tone="text-emerald-400" />
        <DetailTop label="Signal Strength" value="85%" icon={SignalHigh} />
        <DetailTop label="Last Seen" value="2 min ago" />
        <DetailTop label="Firmware" value="v2.5.1" />
        <DetailTop label="Agent" value="Agent-001" icon={UserRound} />
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1fr]">
        <section className="glass rounded-xl p-6">
          <h3 className="mb-5 text-xl font-bold text-white">Device Metrics</h3>
          <div className="divide-y divide-[#0d3660]/60">
            {metrics.map(([label, value, status]) => (
              <div key={label} className="grid grid-cols-[1fr_1fr_0.6fr] py-3 text-base">
                <span className="text-slate-300">{label}</span>
                <span className="text-white">{value}</span>
                <span className="text-right text-emerald-400">{status}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <section className="glass rounded-xl p-6">
            <h3 className="mb-5 text-xl font-bold text-white">Location</h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[260px_1fr]">
              <div className="relative h-52 overflow-hidden rounded-lg bg-cover bg-center" style={{ backgroundImage: "url('/images/dashboard_attached.png')" }}>
                <MapPin className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-blue-500" />
              </div>
              <div className="space-y-4 text-slate-300">
                <p className="text-xl font-bold text-white">North Farm</p>
                <p>Pond 3, Section B</p>
                <p>North Farm</p>
                <p>Site 1</p>
                <p>28.5678 N, 77.1234 E</p>
              </div>
            </div>
          </section>

          <section className="glass rounded-xl p-6">
            <h3 className="mb-5 text-xl font-bold text-white">Device Info</h3>
            {[
              ['Device Model', 'AquaSense Pro'],
              ['Serial Number', 'AS-PRO-1001'],
              ['MAC Address', 'AC:23:F4:8D:1A:2B'],
              ['IMEI', '8643 2587 9631 547'],
              ['Firmware Version', 'v2.5.1'],
              ['Activated On', 'May 02, 2024'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-[#0d3660]/60 py-3 text-slate-300 last:border-0">
                <span>{label}</span>
                <span className="text-white">{value}</span>
              </div>
            ))}
          </section>
        </div>
      </div>

      <button className="h-14 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-blue-700 font-bold text-white">Save Changes</button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, desc, tone }: { icon: typeof Cpu; label: string; value: string; desc: string; tone: 'cyan' | 'green' | 'amber' | 'purple' | 'slate' }) {
  const toneClass = {
    cyan: 'bg-cyan-500/15 text-cyan-300',
    green: 'bg-emerald-500/15 text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-300',
    purple: 'bg-purple-500/15 text-purple-300',
    slate: 'bg-slate-500/15 text-slate-300',
  }[tone];

  return (
    <section className="glass rounded-xl p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${toneClass}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm text-white">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{value}</p>
          <p className="mt-1 text-xs text-emerald-400">{desc}</p>
        </div>
      </div>
    </section>
  );
}

function DetailTop({ label, value, tone = 'text-white', icon: Icon }: { label: string; value: string; tone?: string; icon?: typeof Cpu }) {
  return (
    <div className="flex flex-col justify-center border-l border-[#0d3660]/60 pl-6">
      <p className="text-slate-300">{label}</p>
      <p className={`mt-4 text-xl font-bold ${tone}`}>
        {Icon && <Icon className="mr-2 inline h-5 w-5" />}
        {value}
      </p>
    </div>
  );
}
