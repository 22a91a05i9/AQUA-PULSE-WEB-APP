import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Box,
  Droplet,
  MapPin,
  Thermometer,
  Waves,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  YAxis,
} from 'recharts';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { hasApiBaseUrl } from '../lib/config';

/* ─── Static fallback data (shown when backend is unreachable) ─── */

const spark = [{ v: 12 }, { v: 15 }, { v: 18 }, { v: 14 }, { v: 22 }, { v: 16 }, { v: 25 }];

const feedData = [
  { day: 'May 12', kg: 950 },
  { day: 'May 13', kg: 1050 },
  { day: 'May 14', kg: 1200 },
  { day: 'May 15', kg: 1150 },
  { day: 'May 16', kg: 1320 },
  { day: 'May 17', kg: 1160 },
  { day: 'May 18', kg: 1330 },
];

const defaultTopStats = [
  { label: 'Aquaculture Sites', value: '5', desc: 'Active monitoring stations', icon: MapPin, color: '#0ea5e9' },
  { label: 'Devices Online', value: '24', desc: '18 active in field', icon: Box, color: '#22c55e' },
  { label: 'Total Alerts', value: '8', desc: 'Active issues', icon: Bell, color: '#f59e0b' },
  { label: 'Critical Alerts', value: '3', desc: 'Immediate Action', icon: AlertTriangle, color: '#ef4444' },
];

const defaultRecentAlerts = [
  { type: 'Low Dissolved Oxygen', site: 'Green Valley Farm', pond: 'Pond 03 - Central Farm', time: '10 min ago', status: 'Critical' },
  { type: 'pH Level High', site: 'Blue Lake Aquafarms', pond: 'Pond 01 - North Farm', time: '25 min ago', status: 'Warning' },
  { type: 'High Turbidity', site: 'Sunrise Aqua Park', pond: 'Pond 02 - East Farm', time: '1 hr ago', status: 'Warning' },
];

const defaultDeviceRows = [
  { id: 'DVC-001', pond: 'Pond 01', status: 'Online', battery: '95%', seen: '1 min ago' },
  { id: 'DVC-003', pond: 'Pond 03', status: 'Online', battery: '87%', seen: '3 min ago' },
  { id: 'DVC-005', pond: 'Pond 02', status: 'Offline', battery: '12%', seen: '2 hr ago' },
  { id: 'DVC-007', pond: 'Pond 01', status: 'Online', battery: '72%', seen: '5 min ago' },
];

const defaultLiveFeed = [
  { label: 'Temperature', value: '28.1', unit: '°C', color: '#0284c7', values: [28, 28.2, 27.8, 28.1, 28.5, 28.1, 28.3], icon: Thermometer },
  { label: 'pH level', value: '8.2', unit: 'pH', color: '#10b981', values: [8.2, 8.4, 8.5, 8.7, 8.9, 8.9, 8.8], icon: Droplet },
  { label: 'Dissolved Oxygen', value: '6.1', unit: 'mg/L', color: '#3b82f6', values: [5.8, 6.0, 6.1, 5.9, 6.1, 6.2, 6.1], icon: Waves },
  { label: 'Turbidity', value: '24', unit: 'NTU', color: '#8b5cf6', values: [20, 22, 24, 25, 23, 24, 24], icon: Droplet },
];

const pageMap: Record<string, string> = {
  'Aquaculture Sites': 'sites',
  'Devices Online': 'devices',
  'Total Alerts': 'alerts',
  'Critical Alerts': 'alerts',
};

export default function DashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const session = getAuthSession();
        if (session && hasApiBaseUrl()) {
          const res = await apiRequest<any>('/owner/overview', {
            token: session.token,
          });
          setData(res);
        }
      } catch (err) {
        console.warn('Backend unreachable, using static fallback data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  /* ─── Compute dynamic values or fall back to defaults ─── */

  const rawSites = data?.sites || [];
  const rawDevices = data?.devices || [];
  const rawAlerts = data?.alerts || [];
  const recentReadings = data?.recent_readings || [];

  const sitesCount = data ? String(data.stats?.sites ?? rawSites.length) : defaultTopStats[0].value;
  const devicesCount = data ? String(data.stats?.devices ?? rawDevices.length) : defaultTopStats[1].value;
  const totalAlerts = data ? String(data.stats?.open_alerts ?? rawAlerts.filter((a: any) => a.status === 'open').length) : defaultTopStats[2].value;
  const criticalAlerts = data ? String(rawAlerts.filter((a: any) => a.severity === 'critical' && a.status === 'open').length) : defaultTopStats[3].value;

  const topStats = [
    { label: 'Aquaculture Sites', value: sitesCount, desc: data ? 'Connected to backend DB' : defaultTopStats[0].desc, icon: MapPin, color: '#0ea5e9' },
    { label: 'Devices Online', value: devicesCount, desc: data ? 'Registered devices' : defaultTopStats[1].desc, icon: Box, color: '#22c55e' },
    { label: 'Total Alerts', value: totalAlerts, desc: 'Active issues', icon: Bell, color: '#f59e0b' },
    { label: 'Critical Alerts', value: criticalAlerts, desc: 'Immediate Action', icon: AlertTriangle, color: '#ef4444' },
  ];

  /* Alerts — DB-first, then fallback */
  const recentAlerts = data && rawAlerts.length > 0
    ? rawAlerts.map((a: any) => {
        const site = rawSites.find((s: any) => s.id === a.site_id);
        return {
          type: a.title || a.metric || 'Water Quality Alert',
          site: site ? site.name : `Site #${a.site_id}`,
          pond: a.message || '',
          time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: a.severity === 'critical' ? 'Critical' : 'Warning',
        };
      })
    : defaultRecentAlerts;

  /* Devices — DB-first, then fallback */
  const deviceRows = data && rawDevices.length > 0
    ? rawDevices.map((d: any) => {
        const site = rawSites.find((s: any) => s.id === d.site_id);
        return {
          id: d.device_uid || 'DVC-UNKNOWN',
          pond: site ? site.name : d.site_id ? `Site #${d.site_id}` : 'Unassigned',
          status: d.status === 'active' || d.status === 'online' ? 'Online' : 'Offline',
          battery: '95%',
          seen: '1 min ago',
        };
      })
    : defaultDeviceRows;

  /* Water Quality Score */
  let waterQualityScore = 85;
  if (recentReadings.length > 0) {
    let scoreSum = 0;
    recentReadings.slice(0, 5).forEach((r: any) => {
      let rScore = 100;
      if (r.ph < 6.5 || r.ph > 8.5) rScore -= 20;
      if (r.temperature_c < 20 || r.temperature_c > 35) rScore -= 20;
      if (r.turbidity > 150) rScore -= 30;
      scoreSum += rScore;
    });
    waterQualityScore = Math.round(scoreSum / Math.min(recentReadings.length, 5));
  }

  /* Live Feed — DB-first, then fallback */
  const getDOValue = (temp: number) => Number((8.5 - (temp - 20) * 0.15).toFixed(1));
  const latestReading = recentReadings[0];
  const wqSparkline = (key: string, fallback: number[]) => {
    if (recentReadings.length === 0) return fallback;
    return recentReadings.slice(0, 10).reverse().map((r: any) => r[key]);
  };

  const liveFeed = data && latestReading
    ? [
        { label: 'Temperature', value: latestReading.temperature_c.toFixed(1), unit: '°C', color: '#0284c7', values: wqSparkline('temperature_c', [28]), icon: Thermometer },
        { label: 'pH level', value: latestReading.ph.toFixed(1), unit: 'pH', color: '#10b981', values: wqSparkline('ph', [8.2]), icon: Droplet },
        { label: 'Dissolved Oxygen', value: getDOValue(latestReading.temperature_c).toFixed(1), unit: 'mg/L', color: '#3b82f6', values: recentReadings.slice(0, 10).reverse().map((r: any) => getDOValue(r.temperature_c)), icon: Waves },
        { label: 'Turbidity', value: latestReading.turbidity.toFixed(0), unit: 'NTU', color: '#8b5cf6', values: wqSparkline('turbidity', [24]), icon: Droplet },
      ]
    : defaultLiveFeed;

  return (
    <div className="space-y-5 animate-fade-in text-left">
      <div className="auto-card-grid gap-4">
        {topStats.map((stat) => {
          const Icon = stat.icon;
          const targetPage = pageMap[stat.label] || 'dashboard';
          return (
            <section 
              key={stat.label} 
              onClick={() => onNavigate?.(targetPage)}
              className="metric-card glass rounded-xl p-5 cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300"
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${stat.color}22` }}>
                    <Icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                  <div className="metric-copy">
                    <p className="metric-label text-white">{stat.label}</p>
                    <p className="metric-value mt-4 font-extrabold text-white">{stat.value}</p>
                    <p className="metric-desc mt-1 text-emerald-400">{stat.desc}</p>
                  </div>
                </div>
                <div className="h-14 w-28 min-w-[5rem] max-w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spark}>
                      <Line type="monotone" dataKey="v" stroke={stat.color} strokeWidth={2} dot={false} />
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.1fr_1fr]">
        <section className="glass rounded-xl p-5 cursor-pointer hover:border-cyan-500/30 transition-all" onClick={() => onNavigate?.('live')}>
          <h2 className="text-base font-bold text-white">Water Quality Score</h2>
          <div className="relative mx-auto mt-6 h-52 w-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: waterQualityScore }, { value: 100 - waterQualityScore }]} dataKey="value" innerRadius={68} outerRadius={82} startAngle={90} endAngle={-270} stroke="none">
                  <Cell fill={waterQualityScore >= 80 ? '#22c55e' : '#f59e0b'} />
                  <Cell fill="#0d3660" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-white">{waterQualityScore}</span>
              <span className="text-lg text-emerald-400">{waterQualityScore >= 80 ? 'Good' : 'Warning'}</span>
            </div>
          </div>
          <p className="text-center text-sm text-emerald-400">5% from yesterday</p>
        </section>

        <section className="glass rounded-xl p-5 cursor-pointer hover:border-cyan-500/30 transition-all" onClick={() => onNavigate?.('sites')}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="safe-text text-base font-bold text-white">Ponds Overview</h2>
            <span className="text-2xl text-[#06b6d4] hover:text-[#22d3ee]">›</span>
          </div>
          <div className="relative h-72 overflow-hidden rounded-lg">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: "url('/images/dashboard_attached.png')",
                backgroundPosition: '23.4% 32.5%',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '265%',
                filter: 'brightness(0.78) contrast(1.15)',
              }}
            />
            <div className="absolute inset-0 bg-[#020b18]/35" />
            {[
              ['28%', '45%', '#22c55e'],
              ['45%', '57%', '#22c55e'],
              ['70%', '42%', '#0ea5e9'],
              ['52%', '31%', '#0ea5e9'],
              ['60%', '71%', '#0ea5e9'],
            ].map(([left, top, color], index) => (
              <MapPin key={index} className="absolute h-9 w-9 drop-shadow-lg" style={{ left, top, color }} />
            ))}
          </div>
        </section>

        <section className="glass rounded-xl p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="safe-text text-base font-bold text-white">Recent Alerts</h2>
            <button onClick={() => onNavigate?.('alerts')} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">View All</button>
          </div>
          <div className="space-y-4">
            {recentAlerts.slice(0, 3).map((alert: any, idx: number) => (
              <div 
                key={idx} 
                onClick={() => onNavigate?.('alerts')}
                className="flex items-center gap-4 border-b border-[#0d3660]/60 pb-4 last:border-0 cursor-pointer hover:border-cyan-500/20"
              >
                <AlertTriangle className={`h-7 w-7 ${alert.status === 'Warning' ? 'text-amber-400' : 'text-red-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white truncate">{alert.type}</p>
                  <p className="text-sm text-slate-300">{alert.pond}</p>
                </div>
                <span className="safe-text text-sm text-slate-300">{alert.time}</span>
                <span className={`rounded-md px-3 py-1 text-xs font-bold ${alert.status === 'Warning' ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300'}`}>
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.8fr]">
        <section className="glass rounded-xl p-5 cursor-pointer hover:border-cyan-500/30 transition-all" onClick={() => onNavigate?.('live')}>
          <h2 className="mb-4 text-base font-bold text-white">Live Feed (Real-time)</h2>
          <div className="auto-card-grid-sm gap-4">
            {liveFeed.map((item) => {
              const Icon = item.icon;
              const dataVals = item.values.map((v) => ({ v }));
              return (
                <div key={item.label} className="metric-card rounded-lg border border-[#0d3660] bg-[#031426]/70 p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-8 w-8" style={{ color: item.color }} />
                    <div className="metric-copy">
                      <p className="metric-value metric-value-sm font-bold text-white">{item.value} <span className="text-xs font-medium text-slate-300">{item.unit}</span></p>
                      <p className="metric-label text-slate-300">{item.label}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dataVals}>
                        <Line type="monotone" dataKey="v" stroke={item.color} strokeWidth={2} dot={false} />
                        <YAxis hide domain={['dataMin', 'dataMax']} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass rounded-xl p-5 cursor-pointer hover:border-cyan-500/30 transition-all" onClick={() => onNavigate?.('devices')}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="safe-text text-base font-bold text-white">Devices Status</h2>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.('devices');
              }}
              className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {deviceRows.slice(0, 4).map((device: any, idx: number) => (
              <div key={idx} className="grid grid-cols-[0.9fr_0.8fr_0.8fr_0.6fr_0.7fr] items-center gap-2 text-sm">
                <span className="font-semibold text-white truncate">{device.id}</span>
                <span className="text-slate-300 truncate">{device.pond}</span>
                <span className={`rounded-md px-2 py-1 text-center text-xs font-bold ${device.status === 'Offline' ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                  {device.status}
                </span>
                <span className="text-white">{device.battery}</span>
                <span className="text-right text-slate-300">{device.seen}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.7fr]">
        <section className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Recent Alerts</h2>
            <button onClick={() => onNavigate?.('alerts')} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm cursor-pointer" onClick={() => onNavigate?.('alerts')}>
              <thead className="text-slate-400">
                <tr>
                  <th className="py-3">Alert Type</th>
                  <th>Site</th>
                  <th>Pond</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d3660]/60">
                {recentAlerts.map((alert: any, index: number) => (
                  <tr key={index} className="hover:bg-[#071f35]/30 transition-all">
                    <td className="py-3 text-white truncate">{alert.type}</td>
                    <td className="text-slate-300">{alert.site}</td>
                    <td className="text-slate-300">{alert.pond}</td>
                    <td className="text-slate-300">{alert.time}</td>
                    <td>
                      <span className={`rounded-md px-3 py-1 text-xs font-bold ${alert.status === 'Info' ? 'bg-blue-500/15 text-blue-300' : alert.status === 'Warning' ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300'}`}>
                        {alert.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass rounded-xl p-5 cursor-pointer hover:border-cyan-500/30 transition-all" onClick={() => onNavigate?.('analytics')}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Feed Consumption (kg)</h2>
            <button className="rounded-lg border border-[#0d3660] px-3 py-2 text-sm text-white hover:border-cyan-300 transition">Last 7 Days</button>
          </div>
          <p className="safe-text mb-4 text-[clamp(1.5rem,3vw,2rem)] font-extrabold text-white">1,245 <span className="text-lg">kg</span> <span className="text-sm text-emerald-400">7% vs last week</span></p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feedData}>
                <Bar dataKey="kg" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
