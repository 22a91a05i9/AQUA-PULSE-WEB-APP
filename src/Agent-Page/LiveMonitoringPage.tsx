import { useState } from 'react';
import {
  Calendar,
  Droplet,
  Thermometer,
  Wind,
  Sun,
  Sunset,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock live data for parameters
const parameterDetails = [
  { label: 'Temperature', value: '28.1', unit: '°C', status: 'Normal', color: '#22d3ee', icon: Thermometer },
  { label: 'pH', value: '8.2', unit: '', status: 'Normal', color: '#10b981', icon: Droplet },
  { label: 'Dissolved Oxygen', value: '5.4', unit: 'mg/L', status: 'Good', color: '#3b82f6', icon: Wind },
  { label: 'Turbidity', value: '24', unit: 'NTU', status: 'Normal', color: '#a855f7', icon: Droplet },
];

const pondStatusMarkers = [
  { id: '01', status: 'healthy', x: 23, y: 35 },
  { id: '02', status: 'critical', x: 42, y: 30 },
  { id: '03', status: 'healthy', x: 60, y: 25 },
  { id: '04', status: 'healthy', x: 78, y: 38 },
  { id: '05', status: 'warning', x: 18, y: 62 },
  { id: '06', status: 'healthy', x: 38, y: 55 },
  { id: '07', status: 'warning', x: 58, y: 68 },
  { id: '08', status: 'healthy', x: 82, y: 60 },
];

const liveDeviceFeed = [
  { id: 'DFX-001', type: 'Temperature Sensor', pond: 'Pond 01', status: 'Online', lastSeen: '2 min ago', battery: 75, signal: 5 },
  { id: 'DFX-002', type: 'pH Sensor', pond: 'Pond 02', status: 'Online', lastSeen: '3 min ago', battery: 68, signal: 4 },
  { id: 'DFX-003', type: 'DO Sensor', pond: 'Pond 03', status: 'Online', lastSeen: '2 min ago', battery: 82, signal: 5 },
  { id: 'DFX-004', type: 'Turbidity Sensor', pond: 'Pond 04', status: 'Online', lastSeen: '1 min ago', battery: 7, signal: 2 },
  { id: 'DFX-005', type: 'Water Pump', pond: 'Pond 05', status: 'Online', lastSeen: '3 min ago', battery: 63, signal: 4 },
];

const liveAlerts = [
  { message: 'Low Dissolved Oxygen', pond: 'Pond 07', time: '1 min ago', type: 'critical' },
  { message: 'High Turbidity', pond: 'Pond 02', time: '3 min ago', type: 'warning' },
  { message: 'Temperature Spike', pond: 'Pond 01', time: '5 min ago', type: 'critical' },
  { message: 'Device Battery Low (20%)', pond: 'Pond 05 - Water Pump', time: '8 min ago', type: 'info' },
];

const envConditions = [
  { label: 'Air Temperature', value: '31.2', unit: '°C', icon: Thermometer },
  { label: 'Humidity', value: '68', unit: '%', icon: Droplet },
  { label: 'Wind Speed', value: '12', unit: 'km/h', icon: Wind },
  { label: 'Solar Radiation', value: '6.3', unit: 'kWh', icon: Sun },
];

const statusColors: Record<string, string> = {
  healthy: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
  offline: '#6b7280',
};

const deviceStatusData = [
  { name: 'Online', value: 24, color: '#10b981' },
  { name: 'Maintenance', value: 3, color: '#f59e0b' },
  { name: 'Offline', value: 5, color: '#ef4444' },
];

const chartData = [
  { time: '10:00', temp: 28.0, pH: 8.1, do: 5.5, turbidity: 23 },
  { time: '10:05', temp: 28.1, pH: 8.2, do: 5.4, turbidity: 24 },
  { time: '10:10', temp: 28.1, pH: 8.2, do: 5.3, turbidity: 25 },
  { time: '10:15', temp: 28.2, pH: 8.1, do: 5.4, turbidity: 24 },
  { time: '10:20', temp: 28.1, pH: 8.2, do: 5.4, turbidity: 24 },
];

export default function LiveMonitoringPage() {
  const [selectedPond, setSelectedPond] = useState('All Ponds (10)');
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="space-y-6 animate-fade-in text-slate-300">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedPond}
            onChange={(e) => setSelectedPond(e.target.value)}
            className="h-10 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-4 text-sm text-white focus:outline-none focus:border-[#06b6d4]"
          >
            <option value="All Ponds (10)">All Ponds (10)</option>
            <option value="Pond 01">Pond 01</option>
            <option value="Pond 02">Pond 02</option>
            <option value="Pond 03">Pond 03</option>
          </select>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-4 justify-end shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold">Auto Refresh</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative w-9 h-5 rounded-full transition-all duration-350 cursor-pointer ${
                autoRefresh ? 'bg-emerald-500' : 'bg-slate-750'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-350 ${
                  autoRefresh ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
            <select className="h-9 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-2 text-xs text-slate-350 focus:outline-none">
              <option value="10s">10 sec</option>
              <option value="30s">30 sec</option>
              <option value="1m">1 min</option>
            </select>
          </div>

          <button className="h-9 px-4 flex items-center gap-2 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 text-[#22d3ee] text-xs font-semibold transition">
            <Calendar className="w-3.5 h-3.5" />
            <span>View Historical Data</span>
          </button>
        </div>
      </div>

      {/* Parameters Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {parameterDetails.map((param, idx) => {
          const ParamIcon = param.icon;
          return (
            <div key={idx} className="glass rounded-xl p-4 border border-slate-800/80 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: param.color + '15' }}>
                <ParamIcon className="w-5 h-5" style={{ color: param.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase">{param.label}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-white">{param.value}</span>
                  <span className="text-xs text-slate-450">{param.unit}</span>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10">
                {param.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pond Map (Live Status) */}
          <div className="glass rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3">Pond Map (Live Status)</h3>
            <div className="relative h-60 rounded-lg overflow-hidden border border-slate-850">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: "url('/images/dashboard_attached.png')",
                  backgroundSize: '265%',
                  backgroundPosition: '23.4% 32.5%',
                  backgroundRepeat: 'no-repeat',
                  filter: 'brightness(0.85) contrast(1.1)'
                }}
              />
              <div className="absolute inset-0 bg-[#020b18]/45" />

              {/* Positioned Pond Status Markers */}
              {pondStatusMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300"
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-lg border"
                    style={{
                      backgroundColor: statusColors[marker.status],
                      borderColor: '#fff',
                    }}
                  >
                    {marker.id}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend row */}
            <div className="flex items-center justify-between mt-4 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Online <strong className="text-white">14</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Warning <strong className="text-white">6</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Critical <strong className="text-white">4</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span>Offline <strong className="text-white">0</strong></span>
              </div>
            </div>
          </div>

          {/* Live Device Feed Table */}
          <div className="glass rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3">Live Device Feed</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase font-semibold">
                    <th className="py-2.5">Device ID</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Pond</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Last Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-350">
                  {liveDeviceFeed.map((feed) => (
                    <tr key={feed.id} className="hover:bg-slate-850/20">
                      <td className="py-2.5 font-semibold text-slate-200">{feed.id}</td>
                      <td className="py-2.5 text-slate-400">{feed.type.split(' ')[0]}</td>
                      <td className="py-2.5 font-medium text-slate-200">{feed.pond}</td>
                      <td className="py-2.5">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {feed.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">{feed.lastSeen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Center Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Live Water Quality (Line Chart) */}
          <div className="glass rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Live Water Quality</h3>
              <select className="bg-transparent border-none text-xs text-slate-400 focus:outline-none">
                <option value="all">All Parameters</option>
              </select>
            </div>

            {/* Quick stats indicators */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              {parameterDetails.map((param, idx) => (
                <div key={idx} className="bg-[#041526]/50 border border-slate-800 p-2 rounded-lg">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">{param.label.substring(0, 4)}</div>
                  <div className="text-xs font-bold text-white mt-0.5">{param.value}</div>
                  <div className="text-[8px] text-emerald-400 font-semibold mt-0.5">{param.status}</div>
                </div>
              ))}
            </div>

            <div className="h-44 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#0d366015" strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#041526',
                      borderColor: '#0d3660',
                      fontSize: '10px',
                    }}
                  />
                  <Line type="monotone" dataKey="temp" stroke="#22d3ee" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="pH" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="do" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Status Donut Chart */}
          <div className="glass rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4">Device Status (Total)</h3>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {deviceStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-white">32</span>
                  <span className="text-[8px] text-slate-500">Total</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-xs">
                {deviceStatusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-450">{d.name}</span>
                    </div>
                    <span className="text-white font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Live Alerts list */}
          <div className="glass rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Live Alerts</h3>
              <button className="text-xs text-[#06b6d4] hover:text-[#22d3ee] font-semibold transition">View All</button>
            </div>
            <div className="space-y-3">
              {liveAlerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#041526]/50 border border-slate-850">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    alert.type === 'critical' ? 'bg-red-500 animate-pulse' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{alert.message}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{alert.pond}</div>
                  </div>
                  <span className="text-[9px] text-slate-450 shrink-0">{alert.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="glass rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4">Environmental Conditions</h3>
            <div className="grid grid-cols-2 gap-4">
              {envConditions.map((cond, i) => {
                const Icon = cond.icon;
                return (
                  <div key={i} className="p-3.5 rounded-lg bg-[#041526]/40 border border-slate-850 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#071f35]" style={{ color: '#22d3ee' }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">{cond.label}</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">
                        {cond.value} <span className="text-[10px] font-medium text-slate-450">{cond.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sunrise / Sunset row */}
            <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-850 pt-4">
              <div className="flex items-center gap-2.5 text-xs">
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase">Sunrise</div>
                  <div className="font-bold text-white mt-0.5">06:15 AM</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <Sunset className="w-4 h-4 text-orange-400 shrink-0" />
                <div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase">Sunset</div>
                  <div className="font-bold text-white mt-0.5">06:45 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
