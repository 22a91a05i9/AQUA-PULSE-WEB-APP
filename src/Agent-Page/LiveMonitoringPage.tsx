import { useEffect, useState } from 'react';
import {
  Calendar,
  Droplet,
  Thermometer,
  Wind,
  Sun,
  Sunset,
  Cpu,
  Wifi,
  AlertCircle,
  Clock,
  Battery,
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
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';

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

export default function LiveMonitoringPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [selectedPond, setSelectedPond] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10s default
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const session = getAuthSession();
      if (session) {
        const endpoint = session.user.role === 'owner' ? '/owner/overview' : '/agent/overview';
        const res = await apiRequest<any>(endpoint, {
          token: session.token,
        });
        let dataResult = res;
        if (session.user.role === 'owner') {
          dataResult = {
            ...res,
            assigned_sites: res.sites || [],
          };
        }
        setData(dataResult);
      }
    } catch (err) {
      console.error('Failed to load live overview:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      loadData();
    }, refreshInterval);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const siteReadings = data?.recent_readings || [];
  const filteredReadings = selectedPond === 'all' 
    ? siteReadings 
    : siteReadings.filter((r: any) => r.site_id?.toString() === selectedPond);

  const latestReading = filteredReadings[0];
  const getDOValue = (temp: number) => {
    return Number((8.5 - (temp - 20) * 0.15).toFixed(1));
  };

  const parameterDetails = [
    {
      label: 'Temperature',
      value: latestReading ? latestReading.temperature_c.toFixed(1) : '28.1',
      unit: '°C',
      status: latestReading ? (latestReading.temperature_c < 20 || latestReading.temperature_c > 35 ? 'Critical' : 'Normal') : 'Normal',
      color: '#22d3ee',
      icon: Thermometer,
    },
    {
      label: 'pH',
      value: latestReading ? latestReading.ph.toFixed(1) : '8.2',
      unit: '',
      status: latestReading ? (latestReading.ph < 6.5 || latestReading.ph > 8.5 ? 'High' : 'Normal') : 'Normal',
      color: '#10b981',
      icon: Droplet,
    },
    {
      label: 'Dissolved Oxygen',
      value: latestReading ? getDOValue(latestReading.temperature_c).toFixed(1) : '5.4',
      unit: 'mg/L',
      status: latestReading ? (getDOValue(latestReading.temperature_c) < 4.0 ? 'Low' : 'Good') : 'Good',
      color: '#3b82f6',
      icon: Wind,
    },
    {
      label: 'Turbidity',
      value: latestReading ? latestReading.turbidity.toFixed(0) : '24',
      unit: 'NTU',
      status: latestReading ? (latestReading.turbidity > 100 ? 'High' : 'Normal') : 'Normal',
      color: '#a855f7',
      icon: Droplet,
    },
  ];

  const getCoordinates = (index: number) => {
    const coords = [
      { x: 23, y: 35 },
      { x: 42, y: 30 },
      { x: 60, y: 25 },
      { x: 78, y: 38 },
      { x: 18, y: 62 },
      { x: 38, y: 55 },
      { x: 58, y: 68 },
      { x: 82, y: 60 },
    ];
    return coords[index % coords.length];
  };

  const pondStatusMarkers = (data?.assigned_sites || []).map((site: any, idx: number) => {
    const siteAlerts = (data?.alerts || []).filter((a: any) => a.site_id === site.id && a.status === 'open');
    let status = 'healthy';
    if (siteAlerts.some((a: any) => a.severity === 'critical')) {
      status = 'critical';
    } else if (siteAlerts.some((a: any) => a.severity === 'warning')) {
      status = 'warning';
    }
    const coords = getCoordinates(idx);
    return {
      id: site.id.toString(),
      name: site.name,
      status,
      x: coords.x,
      y: coords.y,
    };
  });

  const rawDevicesList = data?.devices || [];
  const filteredDevicesList = selectedPond === 'all'
    ? rawDevicesList
    : rawDevicesList.filter((d: any) => d.site_id?.toString() === selectedPond);

  const liveDeviceFeed = filteredDevicesList.map((dev: any) => {
    const site = (data?.assigned_sites || []).find((s: any) => s.id === dev.site_id);
    const pondName = site ? site.name : `Site #${dev.site_id}`;
    const devReadings = (data?.recent_readings || []).filter((r: any) => r.device_id === dev.id);
    const latestDevReading = dev.latest_reading || devReadings[0];

    let battery = 95;
    if (latestDevReading && latestDevReading.battery_v != null) {
      const v = latestDevReading.battery_v;
      if (v >= 4.2) battery = 100;
      else if (v <= 3.0) battery = 0;
      else battery = Math.round(((v - 3.0) / (4.2 - 3.0)) * 100);
    }

    return {
      id: dev.device_uid,
      type: 'Water Quality Sensor',
      pond: pondName,
      status: dev.status === 'active' || dev.status === 'online' ? 'Online' : 'Offline',
      lastSeen: latestDevReading ? formatSeen(latestDevReading.collected_at) : 'N/A',
      battery,
      signal: latestDevReading && latestDevReading.signal_dbm ? (latestDevReading.signal_dbm > -50 ? 5 : latestDevReading.signal_dbm > -70 ? 4 : 3) : 5,
    };
  });

  const rawAlerts = data?.alerts || [];
  const filteredAlerts = selectedPond === 'all'
    ? rawAlerts
    : rawAlerts.filter((a: any) => a.site_id?.toString() === selectedPond);

  const liveAlerts = filteredAlerts.map((a: any) => ({
    message: a.title || a.message || 'Water quality alert',
    pond: `Site ID #${a.site_id}`,
    time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: a.severity || 'warning',
  }));
  const topLiveAlerts = liveAlerts.slice(0, 4);

  const activeCount = rawDevicesList.filter((d: any) => d.status === 'active' || d.status === 'online').length;
  const maintCount = rawDevicesList.filter((d: any) => d.status === 'maintenance').length;
  const offlineCount = rawDevicesList.filter((d: any) => d.status === 'offline' || d.status === 'inactive').length;

  const deviceStatusData = [
    { name: 'Online', value: activeCount, color: '#10b981' },
    { name: 'Maintenance', value: maintCount, color: '#f59e0b' },
    { name: 'Offline', value: offlineCount, color: '#ef4444' },
  ];

  const chartData = filteredReadings.slice(0, 10).reverse().map((r: any) => ({
    time: new Date(r.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: r.temperature_c,
    pH: r.ph,
    do: getDOValue(r.temperature_c),
    turbidity: r.turbidity,
  }));

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
            <option value="all">All Ponds ({data?.assigned_sites?.length || 0})</option>
            {(data?.assigned_sites || []).map((site: any) => (
              <option key={site.id} value={site.id.toString()}>{site.name}</option>
            ))}
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
            <select
              value={refreshInterval === 10000 ? '10s' : refreshInterval === 30000 ? '30s' : '1m'}
              onChange={(e) => {
                const val = e.target.value;
                setRefreshInterval(val === '10s' ? 10000 : val === '30s' ? 30000 : 60000);
              }}
              className="h-9 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-2 text-xs text-slate-350 focus:outline-none"
            >
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
                  <span className="text-lg font-bold text-white">{rawDevicesList.length}</span>
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
              <button
                onClick={() => onNavigate?.('alerts')}
                className="text-xs text-[#06b6d4] hover:text-[#22d3ee] font-semibold transition"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {topLiveAlerts.map((alert, i) => (
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
              {topLiveAlerts.length === 0 && (
                <div className="rounded-lg border border-slate-850 bg-[#041526]/50 p-3 text-xs text-slate-400">
                  No live alerts for your assigned sites.
                </div>
              )}
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
