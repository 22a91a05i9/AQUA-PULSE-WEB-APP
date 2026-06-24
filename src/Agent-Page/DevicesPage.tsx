import { useState } from 'react';
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

interface Device {
  id: string;
  name: string;
  type: string;
  pondName: string;
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

const initialDevices: Device[] = [
  {
    id: 'WQS-001',
    name: 'Water Quality Sensor 01',
    type: 'Water Quality Sensor',
    pondName: 'Pond 03',
    status: 'online',
    lastSeen: '2 min ago',
    battery: 85,
    mac: 'AC:23:3F:7B:1A:9C',
    ip: '192.168.1.101',
    firmware: 'v1.2.4',
    signal: 'Strong (-45 dBm)',
    installedOn: 'May 10, 2024',
    temp: '28.1',
    pH: '8.9',
    do: '3.2',
    turbidity: '120',
    ec: '420',
    salinity: '0.5',
  },
  {
    id: 'WQS-002',
    name: 'Water Quality Sensor 02',
    type: 'Water Quality Sensor',
    pondName: 'Pond 07',
    status: 'online',
    lastSeen: '5 min ago',
    battery: 76,
    mac: 'AC:23:3F:7B:1A:9D',
    ip: '192.168.1.102',
    firmware: 'v1.2.4',
    signal: 'Strong (-48 dBm)',
    installedOn: 'May 11, 2024',
    temp: '27.4',
    pH: '7.8',
    do: '5.2',
    turbidity: '45',
    ec: '390',
    salinity: '0.4',
  },
  {
    id: 'SF-001',
    name: 'Smart Feeder 01',
    type: 'Smart Feeder',
    pondName: 'Pond 02',
    status: 'warning',
    lastSeen: '10 min ago',
    battery: 42,
    mac: 'AC:23:3F:7B:1B:01',
    ip: '192.168.1.110',
    firmware: 'v1.1.2',
    signal: 'Medium (-65 dBm)',
    installedOn: 'May 12, 2024',
    temp: '26.8',
    pH: '8.1',
    do: '4.8',
    turbidity: '60',
    ec: '410',
    salinity: '0.5',
  },
  {
    id: 'SF-002',
    name: 'Smart Feeder 02',
    type: 'Smart Feeder',
    pondName: 'Pond 04',
    status: 'online',
    lastSeen: '12 min ago',
    battery: 64,
    mac: 'AC:23:3F:7B:1B:02',
    ip: '192.168.1.111',
    firmware: 'v1.1.2',
    signal: 'Strong (-50 dBm)',
    installedOn: 'May 12, 2024',
    temp: '27.9',
    pH: '8.3',
    do: '5.1',
    turbidity: '35',
    ec: '405',
    salinity: '0.4',
  },
  {
    id: 'AE-001',
    name: 'Aerator 01',
    type: 'Aerator',
    pondName: 'Pond 01',
    status: 'online',
    lastSeen: '3 min ago',
    battery: 92,
    mac: 'AC:23:3F:7B:1C:11',
    ip: '192.168.1.120',
    firmware: 'v2.0.1',
    signal: 'Strong (-47 dBm)',
    installedOn: 'May 14, 2024',
    temp: '28.2',
    pH: '8.2',
    do: '6.0',
    turbidity: '25',
    ec: '400',
    salinity: '0.4',
  },
  {
    id: 'AE-002',
    name: 'Aerator 02',
    type: 'Aerator',
    pondName: 'Pond 04',
    status: 'offline',
    lastSeen: '1 hr ago',
    battery: 30,
    mac: 'AC:23:3F:7B:1C:12',
    ip: '192.168.1.121',
    firmware: 'v2.0.1',
    signal: 'Disconnected',
    installedOn: 'May 14, 2024',
    temp: '27.1',
    pH: '7.9',
    do: '3.0',
    turbidity: '110',
    ec: '415',
    salinity: '0.5',
  },
  {
    id: 'PH-001',
    name: 'pH Sensor 01',
    type: 'pH Sensor',
    pondName: 'Pond 06',
    status: 'online',
    lastSeen: '4 min ago',
    battery: 88,
    mac: 'AC:23:3F:7B:1A:80',
    ip: '192.168.1.105',
    firmware: 'v1.2.1',
    signal: 'Strong (-52 dBm)',
    installedOn: 'May 15, 2024',
    temp: '28.5',
    pH: '6.4',
    do: '4.2',
    turbidity: '80',
    ec: '430',
    salinity: '0.6',
  },
  {
    id: 'DO-001',
    name: 'Dissolved Oxygen Sensor',
    type: 'DO Sensor',
    pondName: 'Pond 03',
    status: 'warning',
    lastSeen: '8 min ago',
    battery: 35,
    mac: 'AC:23:3F:7B:1A:85',
    ip: '192.168.1.106',
    firmware: 'v1.2.2',
    signal: 'Medium (-68 dBm)',
    installedOn: 'May 16, 2024',
    temp: '27.8',
    pH: '8.0',
    do: '2.8',
    turbidity: '95',
    ec: '425',
    salinity: '0.5',
  },
  {
    id: 'TB-001',
    name: 'Turbidity Sensor',
    type: 'Turbidity Sensor',
    pondName: 'Pond 07',
    status: 'online',
    lastSeen: '5 min ago',
    battery: 70,
    mac: 'AC:23:3F:7B:1A:90',
    ip: '192.168.1.107',
    firmware: 'v1.2.2',
    signal: 'Strong (-55 dBm)',
    installedOn: 'May 16, 2024',
    temp: '28.0',
    pH: '8.1',
    do: '4.9',
    turbidity: '135',
    ec: '420',
    salinity: '0.5',
  },
  {
    id: 'WQS-003',
    name: 'Water Quality Sensor 03',
    type: 'Water Quality Sensor',
    pondName: 'Pond 01',
    status: 'maintenance',
    lastSeen: '2 hrs ago',
    battery: null,
    mac: 'AC:23:3F:7B:1A:9F',
    ip: '192.168.1.103',
    firmware: 'v1.2.4',
    signal: 'Weak (-80 dBm)',
    installedOn: 'May 17, 2024',
    temp: '27.6',
    pH: '7.9',
    do: '4.5',
    turbidity: '50',
    ec: '395',
    salinity: '0.4',
  },
];

const statusColors: Record<string, string> = {
  online: '#22c55e',
  warning: '#f59e0b',
  offline: '#ef4444',
  maintenance: '#6b7280',
};

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

  const filteredDevices = initialDevices.filter((dev) => {
    const matchesSearch =
      dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.pondName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getBatteryColorClass = (battery: number | null, status: string) => {
    if (status === 'offline' || battery === null) return 'text-slate-500';
    if (battery <= 20) return 'text-red-500';
    if (battery <= 45) return 'text-amber-500';
    return 'text-emerald-400';
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-300">
      {/* Stats Cards (Pic 4 & Pic 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass rounded-xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Devices</div>
            <div className="text-2xl font-bold text-white mt-1">32</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">↑ 4 from yesterday</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#06b6d4]/10 border border-[#06b6d4]/30">
            <Cpu className="w-5 h-5 text-[#06b6d4]" />
          </div>
        </div>

        <div className="glass rounded-xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <div className="text-xs text-slate-400 font-medium">Online</div>
            <div className="text-2xl font-bold text-white mt-1">24</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">75%</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30">
            <Wifi className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass rounded-xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <div className="text-xs text-slate-400 font-medium">Warning</div>
            <div className="text-2xl font-bold text-white mt-1">5</div>
            <div className="text-[10px] text-amber-500 font-semibold mt-1">16%</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/30">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="glass rounded-xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <div className="text-xs text-slate-400 font-medium">Offline</div>
            <div className="text-2xl font-bold text-white mt-1">2</div>
            <div className="text-[10px] text-red-500 font-semibold mt-1">6%</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/10 border border-red-500/30">
            <WifiOff className="w-5 h-5 text-red-500" />
          </div>
        </div>

        <div className="glass rounded-xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <div className="text-xs text-slate-400 font-medium">Maintenance</div>
            <div className="text-2xl font-bold text-white mt-1">1</div>
            <div className="text-[10px] text-slate-400 font-semibold mt-1">3%</div>
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
                      { label: 'Temperature', value: selectedDevice.temp, unit: '°C', status: 'Normal', statusColor: '#22c55e', color: '#22d3ee', icon: Thermometer },
                      { label: 'pH', value: selectedDevice.pH, unit: '', status: parseFloat(selectedDevice.pH) > 8.5 ? 'High' : 'Normal', statusColor: parseFloat(selectedDevice.pH) > 8.5 ? '#ef4444' : '#22c55e', color: '#ef4444', icon: Droplet },
                      { label: 'Dissolved Oxygen', value: selectedDevice.do, unit: 'mg/L', status: parseFloat(selectedDevice.do) < 4.0 ? 'Low' : 'Good', statusColor: parseFloat(selectedDevice.do) < 4.0 ? '#f59e0b' : '#22c55e', color: '#3b82f6', icon: Wind },
                      { label: 'Turbidity', value: selectedDevice.turbidity, unit: 'NTU', status: parseFloat(selectedDevice.turbidity) > 100 ? 'High' : 'Normal', statusColor: parseFloat(selectedDevice.turbidity) > 100 ? '#ef4444' : '#22c55e', color: '#a855f7', icon: Droplet },
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
                      <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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

          {activeTab !== 'overview' && (
            <div className="glass rounded-xl p-8 border border-slate-800 text-center flex flex-col items-center justify-center min-h-[200px]">
              <Cpu className="w-10 h-10 text-[#06b6d4] opacity-50 mb-3 animate-float" />
              <h3 className="text-base font-bold text-white mb-1 capitalize">{activeTab} Details</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                The {activeTab} panel is fully active and loaded.
              </p>
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-3 text-sm text-slate-300 focus:outline-none focus:border-[#06b6d4]"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="warning">Warning</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <select
                className="h-10 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-3 text-sm text-slate-300 focus:outline-none focus:border-[#06b6d4]"
              >
                <option value="all">All Types</option>
                <option value="wqs">Water Quality Sensor</option>
                <option value="sf">Smart Feeder</option>
                <option value="ae">Aerator</option>
              </select>

              <button className="h-10 px-3 flex items-center gap-2 rounded-lg border border-slate-700/50 bg-[#041526]/50 text-sm text-slate-300 hover:text-white transition">
                <SlidersHorizontal className="w-4 h-4" />
                <span>More Filters</span>
              </button>

              <div className="flex border border-slate-700/50 rounded-lg overflow-hidden bg-[#041526]/50">
                <button className="p-2.5 text-slate-400 hover:text-white bg-[#06b6d4]/10 text-[#22d3ee]">
                  <List className="w-4 h-4" />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-white">
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

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
                  {filteredDevices.map((dev) => (
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
                          <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#041526]/10">
              <div className="text-xs text-slate-400">
                Showing 1 to {filteredDevices.length} of {initialDevices.length} devices
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Rows per page</span>
                  <select className="bg-transparent border-none text-xs text-white focus:outline-none">
                    <option value="10">10</option>
                    <option value="20">20</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50" disabled>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-7 h-7 rounded-lg text-xs font-medium bg-[#06b6d4] text-white">1</button>
                  <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50" disabled>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
