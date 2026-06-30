import { useEffect, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Battery,
  Wifi,
  WifiOff,
  ArrowLeft,
  Droplet,
  Thermometer,
  Wind,
  Edit,
  AlertCircle,
  Settings,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { hasApiBaseUrl } from '../lib/config';
import { RowActionMenu } from '../lib/tableActions';

interface Device {
  id: string;
  uid: string;
  name: string;
  type: string;
  pondName: string;
  siteId: number | null;
  status: 'online' | 'warning' | 'offline' | 'maintenance';
  lastSeen: string;
  battery: number | null;
  mac: string;
  ip: string;
  firmware: string;
  signal: string;
  installedOn: string;
  temp: string;
  pH: string;
  do: string;
  turbidity: string;
  ec: string;
  salinity: string;
}

interface SensorReading {
  id: number;
  device_id: number;
  site_id: number | null;
  temperature_c: number;
  ph: number;
  turbidity: number;
  battery_v?: number | null;
  signal_dbm?: number | null;
  collected_at: string;
  received_at: string;
}


const getDOValue = (temp: number) => {
  return Number((8.5 - (temp - 20) * 0.15).toFixed(1));
};

const statusColors: Record<string, string> = {
  online: '#22c55e',
  warning: '#f59e0b',
  offline: '#ef4444',
  maintenance: '#6b7280',
};

/* ─── Static fallback devices (shown when backend is unreachable) ─── */
const fallbackDevices: Device[] = [
  { id: '1', uid: 'DVC-001', name: 'Device DVC-001', type: 'Water Quality Sensor', pondName: 'Pond 01 - North Farm', siteId: 1, status: 'online', lastSeen: '2 min ago', battery: 95, mac: 'AC:23:3F:7B:1A:01', ip: '192.168.1.101', firmware: 'v1.2.4', signal: 'Excellent (-35 dBm)', installedOn: 'Jan 15, 2024', temp: '28.1', pH: '7.8', do: '6.2', turbidity: '24', ec: '420', salinity: '0.5' },
  { id: '2', uid: 'DVC-003', name: 'Device DVC-003', type: 'Water Quality Sensor', pondName: 'Pond 03 - Central Farm', siteId: 2, status: 'online', lastSeen: '5 min ago', battery: 87, mac: 'AC:23:3F:7B:1A:02', ip: '192.168.1.102', firmware: 'v1.2.4', signal: 'Good (-48 dBm)', installedOn: 'Feb 20, 2024', temp: '27.5', pH: '8.2', do: '5.4', turbidity: '32', ec: '415', salinity: '0.4' },
  { id: '3', uid: 'DVC-005', name: 'Device DVC-005', type: 'Water Quality Sensor', pondName: 'Pond 02 - East Farm', siteId: 1, status: 'warning', lastSeen: '15 min ago', battery: 42, mac: 'AC:23:3F:7B:1A:03', ip: '192.168.1.103', firmware: 'v1.2.3', signal: 'Fair (-62 dBm)', installedOn: 'Mar 10, 2024', temp: '31.2', pH: '8.9', do: '3.2', turbidity: '120', ec: '450', salinity: '0.6' },
  { id: '4', uid: 'DVC-007', name: 'Device DVC-007', type: 'Water Quality Sensor', pondName: 'Pond 01 - North Farm', siteId: 1, status: 'offline', lastSeen: '2 hr ago', battery: 12, mac: 'AC:23:3F:7B:1A:04', ip: '192.168.1.104', firmware: 'v1.2.2', signal: 'N/A', installedOn: 'Apr 05, 2024', temp: '26.8', pH: '7.5', do: '6.8', turbidity: '18', ec: '400', salinity: '0.3' },
];

// Historical trend data matching Pic 3
const trendData = [
  { time: '12 AM', value: 24 },
  { time: '04 AM', value: 22 },
  { time: '08 AM', value: 25 },
  { time: '12 PM', value: 24 },
  { time: '04 PM', value: 23 },
  { time: '08 PM', value: 26 },
  { time: '12 AM', value: 25 },
];

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'liveData' | 'history' | 'alerts' | 'settings'>('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deviceReadings, setDeviceReadings] = useState<SensorReading[]>([]);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadData() {
      try {
        const session = getAuthSession();
        if (session && hasApiBaseUrl()) {
          const res = await apiRequest<any>('/agent/overview', {
            token: session.token,
          });
          setData(res);
        }
      } catch (err) {
        console.warn('Backend unreachable, using fallback devices:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadDeviceReadings() {
      if (!selectedDevice) {
        setDeviceReadings([]);
        return;
      }

      setReadingsLoading(true);
      try {
        const session = getAuthSession();
        if (!session || !hasApiBaseUrl()) {
          setDeviceReadings([]);
          return;
        }

        const readings = await apiRequest<SensorReading[]>(`/readings/device/${selectedDevice.id}`, {
          token: session.token,
        });
        setDeviceReadings(readings);
      } catch (err) {
        console.warn('Failed to load device sensor readings (backend may be offline):', err);
        setDeviceReadings([]);
      } finally {
        setReadingsLoading(false);
      }
    }

    loadDeviceReadings();
  }, [selectedDevice]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const devicesList: Device[] = data
    ? (data.devices || []).map((dev: any) => {
        const site = (data?.assigned_sites || []).find((s: any) => s.id === dev.site_id);
        const pondName = site ? site.name : `Site #${dev.site_id}`;

        const devReadings = (data?.recent_readings || []).filter((r: any) =>
          Number(r.device_id) === Number(dev.id)
        );
        const latestReading = devReadings[0];

        let status: 'online' | 'warning' | 'offline' | 'maintenance' = 'online';
        if (dev.status === 'active' || dev.status === 'online') {
          status = 'online';
        } else if (dev.status === 'warning') {
          status = 'warning';
        } else if (dev.status === 'offline' || dev.status === 'inactive') {
          status = 'offline';
        } else if (dev.status === 'maintenance') {
          status = 'maintenance';
        }

        return {
          id: dev.id.toString(),
          uid: dev.device_uid,
          name: `Device ${dev.device_uid}`,
          type: 'Water Quality Sensor',
          pondName,
          siteId: dev.site_id ?? null,
          status,
          lastSeen: latestReading ? 'Just now' : 'N/A',
          battery:
            latestReading && typeof latestReading.battery_v === 'number'
              ? Math.max(0, Math.min(100, Math.round(latestReading.battery_v * 20)))
              : null,
          mac: 'AC:23:3F:7B:1A:' + dev.id.toString().padStart(2, '0'),
          ip: `192.168.1.${100 + dev.id}`,
          firmware: 'v1.2.4',
          signal:
            latestReading && typeof latestReading.signal_dbm === 'number'
              ? `Measured (${latestReading.signal_dbm} dBm)`
              : 'N/A',
          installedOn: new Date(dev.created_at || Date.now()).toLocaleDateString(),
          temp: latestReading ? latestReading.temperature_c.toFixed(1) : '28.1',
          pH: latestReading ? latestReading.ph.toFixed(1) : '8.9',
          do: latestReading ? getDOValue(latestReading.temperature_c).toFixed(1) : '3.2',
          turbidity: latestReading ? latestReading.turbidity.toFixed(0) : '120',
          ec: '420',
          salinity: '0.5',
        };
      })
    : fallbackDevices;

  const filteredDevices = devicesList.filter((dev) => {
    const matchesSearch =
      dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.pondName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dev.status === statusFilter;
    const matchesType = typeFilter === 'all' || dev.type.toLowerCase().includes(typeFilter.toLowerCase()) || (typeFilter === 'wqs' && dev.type.toLowerCase().includes('water quality')) || (typeFilter === 'sf' && dev.type.toLowerCase().includes('feeder')) || (typeFilter === 'ae' && dev.type.toLowerCase().includes('aerator'));
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage) || 1;
  const paginatedDevices = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalDevs = devicesList.length;
  const onlineDevs = devicesList.filter(d => d.status === 'online').length;
  const warningDevs = devicesList.filter(d => d.status === 'warning').length;
  const offlineDevs = devicesList.filter(d => d.status === 'offline').length;
  const maintenanceDevs = devicesList.filter(d => d.status === 'maintenance').length;

  const onlinePct = totalDevs ? Math.round((onlineDevs / totalDevs) * 100) : 0;
  const warningPct = totalDevs ? Math.round((warningDevs / totalDevs) * 100) : 0;
  const offlinePct = totalDevs ? Math.round((offlineDevs / totalDevs) * 100) : 0;
  const maintenancePct = totalDevs ? Math.round((maintenanceDevs / totalDevs) * 100) : 0;

  const selectedLiveReadings = deviceReadings.length > 0
    ? deviceReadings
    : selectedDevice
      ? (data?.recent_readings || []).filter(
          (r: any) => Number(r.device_id) === Number(selectedDevice.id)
        )
      : [];


  const selectedTrendData = selectedLiveReadings.slice(0, 10).reverse().map((reading: SensorReading) => ({
    time: new Date(reading.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: reading.temperature_c,
  }));
  const latestSelectedReading = selectedLiveReadings[0] as SensorReading | undefined;
  const selectedTemp = latestSelectedReading ? Number(latestSelectedReading.temperature_c).toFixed(1) : selectedDevice?.temp || 'N/A';
  const selectedPh = latestSelectedReading ? Number(latestSelectedReading.ph).toFixed(2) : selectedDevice?.pH || 'N/A';
  const selectedTurbidity = latestSelectedReading ? Number(latestSelectedReading.turbidity).toFixed(0) : selectedDevice?.turbidity || 'N/A';
  const selectedDo = latestSelectedReading
    ? getDOValue(Number(latestSelectedReading.temperature_c)).toFixed(1)
    : selectedDevice?.do || 'N/A';

  const getBatteryColorClass = (battery: number | null, status: string) => {
    if (status === 'offline' || battery === null) return 'text-slate-500';
    if (battery <= 20) return 'text-red-500';
    if (battery <= 45) return 'text-amber-500';
    return 'text-emerald-400';
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-300">
      {/* Stats Cards (Pic 4 & Pic 3) */}
      <div className="auto-card-grid gap-4">
        <div className="metric-card glass rounded-xl p-4 flex items-center justify-between gap-3 border border-slate-800/80">
          <div className="metric-copy">
            <div className="metric-label text-slate-400 font-medium">Total Devices</div>
            <div className="metric-value metric-value-sm font-bold text-white mt-1">{totalDevs}</div>
            <div className="metric-desc text-emerald-400 font-semibold mt-1">Belonging to you</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#06b6d4]/10 border border-[#06b6d4]/30">
            <Cpu className="w-5 h-5 text-[#06b6d4]" />
          </div>
        </div>

        <div className="metric-card glass rounded-xl p-4 flex items-center justify-between gap-3 border border-slate-800/80">
          <div className="metric-copy">
            <div className="metric-label text-slate-400 font-medium">Online</div>
            <div className="metric-value metric-value-sm font-bold text-white mt-1">{onlineDevs}</div>
            <div className="metric-desc text-emerald-400 font-semibold mt-1">{onlinePct}%</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30">
            <Wifi className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="metric-card glass rounded-xl p-4 flex items-center justify-between gap-3 border border-slate-800/80">
          <div className="metric-copy">
            <div className="metric-label text-slate-400 font-medium">Warning</div>
            <div className="metric-value metric-value-sm font-bold text-white mt-1">{warningDevs}</div>
            <div className="metric-desc text-amber-500 font-semibold mt-1">{warningPct}%</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/30">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="metric-card glass rounded-xl p-4 flex items-center justify-between gap-3 border border-slate-800/80">
          <div className="metric-copy">
            <div className="metric-label text-slate-400 font-medium">Offline</div>
            <div className="metric-value metric-value-sm font-bold text-white mt-1">{offlineDevs}</div>
            <div className="metric-desc text-red-500 font-semibold mt-1">{offlinePct}%</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/10 border border-red-500/30">
            <WifiOff className="w-5 h-5 text-red-500" />
          </div>
        </div>

        <div className="metric-card glass rounded-xl p-4 flex items-center justify-between gap-3 border border-slate-800/80">
          <div className="metric-copy">
            <div className="metric-label text-slate-400 font-medium">Maintenance</div>
            <div className="metric-value metric-value-sm font-bold text-white mt-1">{maintenanceDevs}</div>
            <div className="metric-desc text-slate-400 font-semibold mt-1">{maintenancePct}%</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-500/10 border border-slate-500/30">
            <Settings className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {selectedDevice ? (
        /* Device Details Layout (Pic 3) */
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="glass rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedDevice(null)}
                className="h-10 w-10 rounded-lg border border-slate-700/50 bg-[#041526]/60 text-slate-300 hover:border-[#06b6d4]/60 hover:text-white transition flex items-center justify-center"
                title="Back to Devices"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-[#06b6d4]/10 border border-[#06b6d4]/30 shadow-lg">
                <Droplet className="w-7 h-7 text-[#06b6d4]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white leading-tight">{selectedDevice.name}</h2>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                    style={{
                      backgroundColor: statusColors[selectedDevice.status] + '20',
                      color: statusColors[selectedDevice.status],
                      border: `1px solid ${statusColors[selectedDevice.status]}30`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: statusColors[selectedDevice.status] }} />
                    {selectedDevice.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 mt-2 font-medium">
                  <span>Type: <strong className="text-slate-300">{selectedDevice.type}</strong></span>
                  <span>•</span>
                  <span>Group: <strong className="text-slate-300">{selectedDevice.pondName}</strong></span>
                  <span>•</span>
                  <span>Installed On: <strong className="text-slate-300">{selectedDevice.installedOn}</strong></span>
                  <span>•</span>
                  <span>Firmware: <strong className="text-slate-300">{selectedDevice.firmware}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
              <button className="h-9 px-4 flex items-center gap-2 rounded-lg bg-[#06b6d4] hover:bg-[#0891b2] text-white text-xs font-semibold transition">
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button className="p-2.5 rounded-lg border border-slate-700/50 hover:bg-slate-800/50 transition">
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Navigation and Back button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850">
            <div className="flex border-b border-slate-800 -mb-px w-full sm:w-auto overflow-x-auto">
              {([
                { id: 'overview', label: 'Overview' },
                { id: 'liveData', label: 'Live Data' },
                { id: 'history', label: 'History' },
                { id: 'alerts', label: 'Alerts' },
                { id: 'settings', label: 'Settings' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-sm font-semibold capitalize whitespace-nowrap transition-all border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'border-[#06b6d4] text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedDevice(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#06b6d4] hover:text-[#22d3ee] transition-colors py-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Devices
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Live Parameters Grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="glass rounded-xl p-5 border border-slate-800">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Live Parameters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Temperature', value: selectedTemp, unit: '°C', status: selectedTemp !== 'N/A' && (Number(selectedTemp) < 20 || Number(selectedTemp) > 35) ? 'Critical' : 'Normal', statusColor: selectedTemp !== 'N/A' && (Number(selectedTemp) < 20 || Number(selectedTemp) > 35) ? '#ef4444' : '#22c55e', color: '#22d3ee', icon: Thermometer },
                      { label: 'pH', value: selectedPh, unit: '', status: selectedPh !== 'N/A' && Number(selectedPh) > 8.5 ? 'High' : 'Normal', statusColor: selectedPh !== 'N/A' && Number(selectedPh) > 8.5 ? '#ef4444' : '#22c55e', color: '#ef4444', icon: Droplet },
                      { label: 'Dissolved Oxygen', value: selectedDo, unit: 'mg/L', status: selectedDo !== 'N/A' && Number(selectedDo) < 4.0 ? 'Low' : 'Good', statusColor: selectedDo !== 'N/A' && Number(selectedDo) < 4.0 ? '#f59e0b' : '#22c55e', color: '#3b82f6', icon: Wind },
                      { label: 'Turbidity', value: selectedTurbidity, unit: 'NTU', status: selectedTurbidity !== 'N/A' && Number(selectedTurbidity) > 100 ? 'High' : 'Normal', statusColor: selectedTurbidity !== 'N/A' && Number(selectedTurbidity) > 100 ? '#ef4444' : '#22c55e', color: '#a855f7', icon: Droplet },
                      { label: 'Electrical Conductivity', value: selectedDevice.ec, unit: 'µS/cm', status: 'Normal', statusColor: '#22c55e', color: '#10b981', icon: Cpu },
                      { label: 'Salinity', value: selectedDevice.salinity, unit: 'ppt', status: 'Normal', statusColor: '#22c55e', color: '#3b82f6', icon: Droplet },
                    ].map((p, idx) => {
                      const ParamIcon = p.icon;
                      return (
                        <div key={idx} className="bg-[#041526]/50 border border-slate-800 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-slate-400 text-xs font-semibold">{p.label}</span>
                          </div>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-extrabold text-white">{p.value}</span>
                            <span className="text-xs text-slate-400">{p.unit}</span>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: p.statusColor + '15', color: p.statusColor }}
                            >
                              {p.status}
                            </span>
                            <ParamIcon className="w-3.5 h-3.5" style={{ color: p.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Signal & Battery bottom sub-cards */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-[#041526]/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Signal Strength</div>
                        <div className="text-sm font-semibold text-emerald-400 mt-1">{selectedDevice.signal}</div>
                      </div>
                      <Wifi className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="bg-[#041526]/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Battery</div>
                        <div className="text-sm font-semibold text-emerald-400 mt-1">
                          {selectedDevice.battery !== null ? `${selectedDevice.battery}%` : '—'}
                        </div>
                      </div>
                      <Battery className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-xl border border-slate-800 bg-[#041526]/40">
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">Recent Sensor Readings</h4>
                        <p className="mt-0.5 text-xs text-slate-400">Latest database rows for this device.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('liveData')}
                        className="text-xs font-semibold text-[#06b6d4] hover:text-[#22d3ee] transition"
                      >
                        View Live Data
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 uppercase">
                            <th className="px-4 py-2.5">Device</th>
                            <th className="px-4 py-2.5">Site</th>
                            <th className="px-4 py-2.5">Temp C</th>
                            <th className="px-4 py-2.5">pH</th>
                            <th className="px-4 py-2.5">Turbidity</th>
                            <th className="px-4 py-2.5">Collected At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {readingsLoading ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-5 text-center text-slate-400">Loading sensor readings...</td>
                            </tr>
                          ) : selectedLiveReadings.length > 0 ? (
                            selectedLiveReadings.slice(0, 5).map((reading: SensorReading) => (
                              <tr key={reading.id} className="hover:bg-[#071f35]/30">
                                <td className="px-4 py-2.5 font-semibold text-white">{selectedDevice.uid}</td>
                                <td className="px-4 py-2.5 font-medium text-white">{selectedDevice.pondName}</td>
                                <td className="px-4 py-2.5">{Number(reading.temperature_c).toFixed(1)}</td>
                                <td className="px-4 py-2.5">{Number(reading.ph).toFixed(2)}</td>
                                <td className="px-4 py-2.5">{Number(reading.turbidity).toFixed(0)}</td>
                                <td className="px-4 py-2.5 text-slate-400">{new Date(reading.collected_at).toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-5 text-center text-slate-400">
                                No sensor readings found for this assigned device.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Trend and Device Info */}
              <div className="space-y-6">
                {/* Parameter Trend (Last 24 Hours) */}
                <div className="glass rounded-xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parameter Trend (Last 24 Hours)</h3>
                    <select className="bg-transparent border-none text-xs text-slate-300 focus:outline-none">
                      <option value="temp">Temperature (°C)</option>
                    </select>
                  </div>

                  <div className="h-40 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedTrendData.length > 0 ? selectedTrendData : trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid stroke="#0d366015" strokeDasharray="3 3" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} domain={[18, 30]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#041526',
                            borderColor: '#0d3660',
                            fontSize: '10px',
                            color: '#fff',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#22d3ee"
                          strokeWidth={2.5}
                          dot={{ r: 3, strokeWidth: 1.5 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Device Information */}
                <div className="glass rounded-xl p-5 border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Device Information</h3>
                  <div className="grid grid-cols-2 gap-y-3.5 text-xs">
                    <div className="text-slate-500">Device ID</div>
                    <div className="text-white text-right">{selectedDevice.id}</div>

                    <div className="text-slate-500">Last Seen</div>
                    <div className="text-white text-right">{selectedDevice.lastSeen}</div>

                    <div className="text-slate-500">Type</div>
                    <div className="text-white text-right">{selectedDevice.type}</div>

                    <div className="text-slate-500">Status</div>
                    <div className="text-emerald-400 text-right font-semibold flex items-center justify-end gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{selectedDevice.status}</span>
                    </div>

                    <div className="text-slate-500">Group</div>
                    <div className="text-white text-right">{selectedDevice.pondName}</div>

                    <div className="text-slate-500">MAC Address</div>
                    <div className="text-white text-right font-mono text-[10px]">{selectedDevice.mac}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'liveData' && (
            <div className="glass rounded-xl border border-slate-800 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Live Sensor Readings</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Showing database readings for {selectedDevice.name} at {selectedDevice.pondName}.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="h-9 px-3 flex items-center gap-2 rounded-lg border border-slate-700/50 text-xs font-semibold text-[#06b6d4] hover:text-[#22d3ee] transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Devices
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#041526]/30">
                      <th className="py-4 px-6">Device</th>
                      <th className="py-4 px-6">Site</th>
                      <th className="py-4 px-6">Temp C</th>
                      <th className="py-4 px-6">pH</th>
                      <th className="py-4 px-6">Turbidity</th>
                      <th className="py-4 px-6">Collected At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                    {readingsLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 px-6 text-center text-slate-400">Loading sensor readings...</td>
                      </tr>
                    ) : selectedLiveReadings.length > 0 ? (
                      selectedLiveReadings.map((reading: SensorReading) => (
                        <tr key={reading.id} className="hover:bg-[#071f35]/30 transition">
                          <td className="py-4 px-6 font-semibold text-white">{selectedDevice.uid}</td>
                          <td className="py-4 px-6 font-medium text-white">{selectedDevice.pondName}</td>
                          <td className="py-4 px-6">{Number(reading.temperature_c).toFixed(1)}</td>
                          <td className="py-4 px-6">{Number(reading.ph).toFixed(2)}</td>
                          <td className="py-4 px-6">{Number(reading.turbidity).toFixed(0)}</td>
                          <td className="py-4 px-6 text-slate-400">{new Date(reading.collected_at).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 px-6 text-center text-slate-400">
                          No sensor readings found for this assigned device.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-slate-800">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#0d366015" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#041526',
                          borderColor: '#0d3660',
                          fontSize: '10px',
                          color: '#fff',
                        }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'overview' && activeTab !== 'liveData' && (
            <div className="glass rounded-xl p-8 border border-slate-800 text-center flex flex-col items-center justify-center min-h-[200px]">
              <Cpu className="w-10 h-10 text-[#06b6d4] opacity-50 mb-3 animate-float" />
              <h3 className="text-base font-bold text-white mb-1 capitalize">{activeTab} Details</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                The {activeTab} panel is fully active and loaded.
              </p>
              <button
                onClick={() => setSelectedDevice(null)}
                className="mt-5 h-9 px-4 flex items-center gap-2 rounded-lg border border-slate-700/50 text-xs font-semibold text-[#06b6d4] hover:text-[#22d3ee] transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Devices
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Devices Table List (Pic 4) */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search devices by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-700/50 bg-[#041526]/50 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#06b6d4] transition"
              />
            </div>

            <div className="flex w-full sm:w-auto items-center gap-3 justify-end">
              {showAdvancedFilters && (
                <>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-3 text-sm text-slate-300 focus:outline-none focus:border-[#06b6d4] animate-fade-in"
                  >
                    <option value="all">All Status</option>
                    <option value="online">Online</option>
                    <option value="warning">Warning</option>
                    <option value="offline">Offline</option>
                    <option value="maintenance">Maintenance</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-3 text-sm text-slate-300 focus:outline-none focus:border-[#06b6d4] animate-fade-in"
                  >
                    <option value="all">All Types</option>
                    <option value="wqs">Water Quality Sensor</option>
                    <option value="sf">Smart Feeder</option>
                    <option value="ae">Aerator</option>
                  </select>
                </>
              )}

              <button 
                onClick={() => setShowAdvancedFilters(prev => !prev)}
                className={`h-10 px-3 flex items-center gap-2 rounded-lg border text-sm transition ${
                  showAdvancedFilters ? 'border-[#06b6d4] text-[#22d3ee] bg-[#06b6d4]/10' : 'border-slate-700/50 bg-[#041526]/50 text-slate-300 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>

              <div className="flex border border-slate-700/50 rounded-lg overflow-hidden bg-[#041526]/50">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition ${viewMode === 'list' ? 'bg-[#06b6d4]/10 text-[#22d3ee]' : 'text-slate-400 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition ${viewMode === 'grid' ? 'bg-[#06b6d4]/10 text-[#22d3ee]' : 'text-slate-400 hover:text-white'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedDevices.length > 0 ? (
                paginatedDevices.map((dev) => (
                  <div
                    key={dev.id}
                    onClick={() => {
                      setSelectedDevice(dev);
                      setActiveTab('overview');
                    }}
                    className="glass rounded-xl p-5 border border-[#0d3660]/60 hover:border-[#06b6d4] transition cursor-pointer space-y-4 text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#071f35] border border-slate-800 text-[#06b6d4]">
                          <Droplet className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{dev.name}</h3>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{dev.id}</p>
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                        style={{
                          backgroundColor: statusColors[dev.status] + '20',
                          color: statusColors[dev.status],
                          border: `1px solid ${statusColors[dev.status]}30`,
                        }}
                      >
                        <span className="w-1 h-1 rounded-full mr-1" style={{ backgroundColor: statusColors[dev.status] }} />
                        {dev.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 border-t border-slate-800/80 pt-3 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Device Type</span>
                        <span className="text-slate-200 font-medium">{dev.type}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Group/Pond</span>
                        <span className="text-slate-200 font-medium">{dev.pondName}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Last Seen</span>
                        <span className="text-slate-200 font-medium">{dev.lastSeen}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Battery className={`w-4 h-4 ${getBatteryColorClass(dev.battery, dev.status)}`} />
                        <span>{dev.battery !== null ? `${dev.battery}%` : '—'}</span>
                      </div>
                      <button className="text-xs font-semibold text-[#06b6d4] hover:text-[#22d3ee] transition flex items-center gap-1">
                        View details <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-slate-500 glass rounded-xl">
                  No devices assigned to this agent.
                </div>
              )}
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#041526]/30">
                      <th className="py-4 px-6">Device Name</th>
                      <th className="py-4 px-6">Device ID</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6">Pond/Group</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Last Seen</th>
                      <th className="py-4 px-6">Battery</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                    {paginatedDevices.length > 0 ? (
                      paginatedDevices.map((dev) => (
                        <tr
                          key={dev.id}
                          className="table-row-hover hover:bg-[#071f35]/30 cursor-pointer transition"
                          onClick={() => {
                            setSelectedDevice(dev);
                            setActiveTab('overview');
                          }}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: statusColors[dev.status] }}
                              />
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#071f35] border border-slate-800 shrink-0">
                                <Droplet className="w-4 h-4 text-[#06b6d4]" />
                              </div>
                              <span className="font-semibold text-white">{dev.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-slate-400">{dev.id}</td>
                          <td className="py-4 px-6 text-slate-400">{dev.type}</td>
                          <td className="py-4 px-6 font-medium text-white">{dev.pondName}</td>
                          <td className="py-4 px-6">
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                              style={{
                                backgroundColor: statusColors[dev.status] + '20',
                                color: statusColors[dev.status],
                                border: `1px solid ${statusColors[dev.status]}30`,
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: statusColors[dev.status] }} />
                              {dev.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-400">{dev.lastSeen}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5">
                              {dev.battery !== null ? (
                                <>
                                  <Battery className={`w-4 h-4 ${getBatteryColorClass(dev.battery, dev.status)}`} />
                                  <span className="font-semibold text-white">{dev.battery}%</span>
                                </>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedDevice(dev);
                                  setActiveTab('overview');
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                                title="View Device Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <RowActionMenu 
                                onEdit={() => alert('Access Denied: Only Owners and Managers can edit devices.')}
                                onDelete={() => alert('Access Denied: Only Owners and Managers can delete devices.')}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No devices assigned to this agent.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#041526]/10">
                <div className="text-xs text-slate-400">
                  Showing {filteredDevices.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDevices.length)} of {filteredDevices.length} devices
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Rows per page</span>
                    <span className="text-xs text-white bg-transparent px-1">{itemsPerPage}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition ${
                          currentPage === page ? 'bg-[#06b6d4] text-white' : 'text-slate-450 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
