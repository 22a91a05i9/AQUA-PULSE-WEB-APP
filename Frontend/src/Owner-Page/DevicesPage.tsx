import { useEffect, useState, useMemo } from 'react';
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
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { RowActionMenu, exportRowsToCsv } from '../lib/tableActions';

type DeviceStatus = 'Online' | 'Warning' | 'Offline';

type Device = {
  id: string;
  dbId: number;
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
  latest_reading?: {
    temperature_c: number;
    ph: number;
    turbidity: number;
    collected_at: string;
    battery_v: number | null;
    signal_dbm: number | null;
  } | null;
};

const defaultDevices: Device[] = [];

const statusClass: Record<DeviceStatus, string> = {
  Online: 'text-emerald-400',
  Warning: 'text-amber-400',
  Offline: 'text-red-400',
};

function formatSeen(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export default function DevicesPage() {
  const [deviceList, setDeviceList] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    async function fetchDevices() {
      try {
        const session = getAuthSession();
        if (session) {
          const res = await apiRequest<any>('/owner/overview', {
            token: session.token,
          });
          const mappedDevices: Device[] = (res.devices || []).map((d: any) => {
            const siteObj = (res.sites || []).find((s: any) => s.id === d.site_id);
            const siteName = siteObj ? siteObj.name : 'Unassigned';
            
            let battery = 95;
            if (d.latest_reading && d.latest_reading.battery_v != null) {
              const v = d.latest_reading.battery_v;
              if (v >= 4.2) battery = 100;
              else if (v <= 3.0) battery = 0;
              else battery = Math.round(((v - 3.0) / (4.2 - 3.0)) * 100);
            }
            
            let batteryLabel = 'Excellent';
            if (battery < 20) batteryLabel = 'Critical';
            else if (battery < 50) batteryLabel = 'Fair';
            else if (battery < 80) batteryLabel = 'Good';

            return {
              id: d.device_uid || 'DVC-UNKNOWN',
              dbId: d.id,
              name: `Sensor Device ${(d.device_uid || '').slice(-4)}`,
              version: d.firmware_version || 'v2',
              status: d.status === 'active' ? 'Online' : 'Offline',
              site: siteName,
              pond: siteName,
              agent: 'Unassigned',
              area: 'Area 1',
              seen: formatSeen(d.latest_reading?.collected_at),
              battery,
              batteryLabel,
              latest_reading: d.latest_reading,
            };
          });
          setDeviceList(mappedDevices);
        }
      } catch (err) {
        console.error('Failed to load devices: ', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDevices();
  }, []);

  const handleDeleteDevice = async (device: Device) => {
    if (!window.confirm(`Are you sure you want to delete and unassign device "${device.id}"?`)) {
      return;
    }
    try {
      const session = getAuthSession();
      if (!session) return;
      await apiRequest(`/owner/devices/${device.dbId}`, {
        method: 'DELETE',
        token: session.token,
      });
      setDeviceList((prev) => prev.filter((d) => d.dbId !== device.dbId));
      alert(`Device "${device.id}" unassigned and deleted successfully.`);
    } catch (err: any) {
      console.error('Failed to delete device:', err);
      alert(err?.detail || err?.message || 'Failed to delete device.');
    }
  };

  const handleEditDevice = async (device: Device) => {
    const newStatus = window.prompt(`Edit device status (active/inactive):`, device.status === 'Online' ? 'active' : 'inactive');
    if (newStatus === null) return;
    try {
      const session = getAuthSession();
      if (!session) return;
      const updated = await apiRequest<any>(`/owner/devices/${device.dbId}`, {
        method: 'PUT',
        token: session.token,
        body: {
          status: newStatus.trim().toLowerCase(),
        },
      });
      setDeviceList((prev) =>
        prev.map((d) =>
          d.dbId === device.dbId
            ? { ...d, status: updated.status === 'active' ? 'Online' : 'Offline' }
            : d
        )
      );
      alert(`Device status updated successfully.`);
    } catch (err: any) {
      console.error('Failed to update device:', err);
      alert(err?.detail || err?.message || 'Failed to update device.');
    }
  };

  const filteredDevices = useMemo(() => {
    return deviceList
      .filter((dev) => {
        const matchesSearch = dev.id.toLowerCase().includes(search.toLowerCase()) || dev.name.toLowerCase().includes(search.toLowerCase()) || dev.site.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'all' || dev.name.toLowerCase().includes(typeFilter.toLowerCase()) || (typeFilter === 'sensor' && dev.name.toLowerCase().includes('sensor'));
        const matchesSite = siteFilter === 'all' || dev.site === siteFilter;
        const matchesStatus = statusFilter === 'all' || dev.status === statusFilter;
        return matchesSearch && matchesType && matchesSite && matchesStatus;
      })
      .sort((a, b) => {
        return sortOrder === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
      });
  }, [deviceList, search, typeFilter, siteFilter, statusFilter, sortOrder]);

  if (selectedDevice) {
    return <DeviceDetails device={selectedDevice} onBack={() => setSelectedDevice(null)} />;
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const onlineCount = deviceList.filter((d) => d.status === 'Online').length;
  const offlineCount = deviceList.filter((d) => d.status === 'Offline').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="auto-card-grid gap-4">
        <StatCard icon={Cpu} label="Total Devices" value={String(deviceList.length)} tone="cyan" desc="From database" />
        <StatCard icon={Wifi} label="Online" value={String(onlineCount)} tone="green" desc="Active status" />
        <StatCard icon={Zap} label="Warning" value="0" tone="amber" desc="0 warnings" />
        <StatCard icon={WifiOff} label="Offline" value={String(offlineCount)} tone="purple" desc="Inactive status" />
        <StatCard icon={Wrench} label="Maintenance" value="0" tone="slate" desc="0 queued" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#0d3660]/60 pt-5">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="h-12 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/60 pl-12 pr-4 text-sm text-white outline-none" 
            placeholder="Search devices by ID, name or site..." 
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {showAdvancedFilters && (
            <>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-12 min-w-40 rounded-lg border border-[#0d3660] bg-[#020b18]/60 px-4 text-sm text-white outline-none animate-fade-in"
              >
                <option value="all">All Types</option>
                <option value="sensor">Sensor Devices</option>
              </select>
              <select 
                value={siteFilter} 
                onChange={(e) => setSiteFilter(e.target.value)}
                className="h-12 min-w-40 rounded-lg border border-[#0d3660] bg-[#020b18]/60 px-4 text-sm text-white outline-none animate-fade-in"
              >
                <option value="all">All Sites</option>
                {Array.from(new Set(deviceList.map(d => d.site))).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 min-w-40 rounded-lg border border-[#0d3660] bg-[#020b18]/60 px-4 text-sm text-white outline-none animate-fade-in"
              >
                <option value="all">All Status</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Warning">Warning</option>
              </select>
            </>
          )}
          <button 
            onClick={() => setShowAdvancedFilters(prev => !prev)}
            className={`flex h-12 items-center gap-2 rounded-lg border px-5 text-sm font-semibold transition ${
              showAdvancedFilters ? 'border-[#06b6d4] text-[#22d3ee] bg-[#06b6d4]/10' : 'border-[#0d3660] text-white hover:bg-[#071f35]'
            }`}
          >
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
            className="flex h-12 items-center gap-2 rounded-lg border border-[#0d3660] px-5 text-sm font-semibold text-white transition hover:bg-[#071f35]"
          >
            Sort: {sortOrder.toUpperCase()}
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
              {filteredDevices.map((device) => (
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
                    <p className="mt-1 text-slate-300">Just now</p>
                  </td>
                  <td>
                    <p className={device.battery === 0 ? 'text-red-400' : device.battery < 75 ? 'text-amber-400' : 'text-white'}>
                      <Battery className="mr-2 inline h-5 w-5" />{device.battery}%
                    </p>
                    <p className="mt-1 text-slate-300">{device.batteryLabel}</p>
                  </td>
                  <td className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActionMenu onEdit={() => handleEditDevice(device)} onDelete={() => handleDeleteDevice(device)} />
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
  const latest = device.latest_reading;
  const metrics = [
    ['Temperature', latest ? `${latest.temperature_c} °C` : 'N/A', latest ? 'Normal' : 'No Data'],
    ['pH', latest ? `${latest.ph}` : 'N/A', latest ? 'Normal' : 'No Data'],
    ['Turbidity', latest ? `${latest.turbidity} NTU` : 'N/A', latest ? 'Normal' : 'No Data'],
    ['Battery Level', `${device.battery}%`, device.batteryLabel],
    ['Signal Strength', latest?.signal_dbm != null ? `${latest.signal_dbm} dBm` : 'N/A', latest?.signal_dbm != null ? 'Strong' : ''],
    ['Dissolved Oxygen', 'Not Equipped', 'N/A'],
    ['Conductivity', 'Not Equipped', 'N/A'],
    ['Salinity', 'Not Equipped', 'N/A'],
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-[#071f35]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h2 className="safe-text text-[clamp(1.5rem,2.4vw,2rem)] font-extrabold text-white">
            {device.id} <span className={device.status === 'Online' ? 'text-emerald-400 text-base' : 'text-red-400 text-base'}>● {device.status}</span>
          </h2>
          <p className="mt-2 text-slate-300">Devices &gt; {device.id}</p>
        </div>
      </div>

      <section className="glass grid grid-cols-1 gap-6 rounded-xl p-6 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr]">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-blue-500/25 text-cyan-200">
            <Cpu className="h-10 w-10" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white">{device.id} <span className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">{device.version}</span></p>
            <p className="mt-2 text-slate-300">Aquasense Pro</p>
            <p className="mt-1 text-slate-400">AS-PRO-{(device.id || '').slice(-4)}</p>
          </div>
        </div>
        <DetailTop label="Status" value={device.status} tone={device.status === 'Online' ? 'text-emerald-400' : 'text-red-400'} />
        <DetailTop label="Temperature" value={latest ? `${latest.temperature_c} °C` : 'N/A'} tone={latest ? 'text-cyan-300' : 'text-slate-400'} />
        <DetailTop label="pH" value={latest ? `${latest.ph}` : 'N/A'} tone={latest ? 'text-lime-300' : 'text-slate-400'} />
        <DetailTop label="Turbidity" value={latest ? `${latest.turbidity} NTU` : 'N/A'} tone={latest ? 'text-purple-300' : 'text-slate-400'} />
        <DetailTop label="Battery Level" value={`${device.battery}%`} tone="text-white" />
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
    <section className="metric-card glass rounded-xl p-5">
      <div className="metric-card-row">
        <div className={`metric-icon flex items-center justify-center rounded-full ${toneClass}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="metric-copy">
          <p className="metric-label text-white">{label}</p>
          <p className="metric-value mt-2 font-extrabold text-white">{value}</p>
          <p className="metric-desc mt-1 text-emerald-400">{desc}</p>
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
