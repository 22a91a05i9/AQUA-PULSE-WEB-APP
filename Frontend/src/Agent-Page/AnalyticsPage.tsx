import { useEffect, useState } from 'react';
import {
  Info,
  ChevronDown,
  Thermometer,
  Droplet,
  Wind,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';

const topStats = [
  { label: 'Total Ponds', value: 24, change: '+8% vs last week', color: '#22d3ee', icon: '🌊' },
  { label: 'Avg Water Quality Index', value: 78, change: 'Good', color: '#22c55e', icon: '💧' },
  { label: 'DO Level', value: '7.2', change: 'Normal', color: '#22d3ee', icon: 'O₂' },
  { label: 'Active Alerts', value: 8, change: '+2 vs last week', color: '#f59e0b', icon: '⚠️' },
  { label: 'Online Devices', value: 32, change: '91% vs total devices', color: '#22c55e', icon: '📡' },
];

const waterQualityData = [
  { date: 'May 12', temperature: 52, ph: 7.0, do: 18, turbidity: 5 },
  { date: 'May 13', temperature: 55, ph: 7.1, do: 20, turbidity: 6 },
  { date: 'May 14', temperature: 58, ph: 7.2, do: 19, turbidity: 7 },
  { date: 'May 15', temperature: 60, ph: 7.0, do: 18, turbidity: 5 },
  { date: 'May 16', temperature: 62, ph: 7.1, do: 20, turbidity: 6 },
  { date: 'May 17', temperature: 60, ph: 7.0, do: 18, turbidity: 5 },
  { date: 'May 18', temperature: 65, ph: 7.2, do: 21, turbidity: 7 },
];

const monthlySummary = [
  { name: 'Critical', value: 8, color: '#ef4444' },
  { name: 'Warning', value: 16, color: '#f59e0b' },
  { name: 'Normal', value: 40, color: '#22c55e' },
  { name: 'Unmonitored', value: 8, color: '#6b7280' },
];

const parameterInsights = [
  { label: 'Temperature (°C)', value: '28.1', unit: '°C', status: 'Normal', color: '#22c55e', sparkline: [27, 28, 28.5, 27.8, 28.1, 28.3, 28.1] },
  { label: 'pH Level', value: '8.2', unit: '', status: 'Normal', color: '#22c55e', sparkline: [7.8, 8.0, 8.1, 8.2, 8.2, 8.1, 8.2] },
  { label: 'Dissolved Oxygen (mg/L)', value: '5.4', unit: 'mg/L', status: 'Good', color: '#22c55e', sparkline: [4.8, 5.0, 5.2, 5.3, 5.4, 5.4, 5.4] },
  { label: 'Turbidity (NTU)', value: '24', unit: 'NTU', status: 'Normal', color: '#22c55e', sparkline: [22, 23, 25, 24, 26, 24, 24] },
];

const incidentTrend = [
  { date: 'May 13', critical: 3, warning: 5, resolved: 8 },
  { date: 'May 14', critical: 2, warning: 4, resolved: 9 },
  { date: 'May 15', critical: 4, warning: 6, resolved: 7 },
  { date: 'May 16', critical: 3, warning: 5, resolved: 8 },
  { date: 'May 18', critical: 2, warning: 4, resolved: 10 },
];

const topAlerts = [
  { label: 'Low Dissolved Oxygen', count: 12, icon: Wind, color: '#ef4444' },
  { label: 'pH Level High', count: 8, icon: Droplet, color: '#f59e0b' },
  { label: 'Temperature Spike', count: 6, icon: Thermometer, color: '#ef4444' },
  { label: 'Device Offline', count: 5, icon: AlertTriangle, color: '#f59e0b' },
  { label: 'Water Level Deviation High', count: 4, icon: Droplet, color: '#3b82f6' },
];

type TooltipEntry = {
  color?: string;
  name?: string;
  value?: string | number;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 border border-[#0d3660]">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-white flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [waterQualityPond] = useState('All Ponds');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalyticsData() {
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
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalyticsData();
  }, []);

  const assignedSites = data?.assigned_sites || [];
  const liveDevices = data?.devices || [];
  const liveReadings = data?.recent_readings || [];
  const liveAlerts = data?.alerts || [];
  const activeAlerts = liveAlerts.filter((alert: any) => alert.status === 'open' || alert.status === 'acknowledged');
  const onlineDevices = liveDevices.filter((device: any) => device.status === 'active' || device.status === 'online');
  const latestReading = liveReadings[0];

  const getDOValue = (temp: number) => Number((8.5 - (temp - 20) * 0.15).toFixed(1));
  const avg = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const waterQualityIndex = liveReadings.length
    ? Math.round(
        100 -
          Math.min(
            50,
            avg(
              liveReadings.map(
                (r: any) => Math.abs((r.ph || 7.5) - 7.5) * 12 + Math.max(0, (r.turbidity || 0) - 50) * 0.15,
              ),
            ),
          ),
      )
    : 0;

  const dynamicTopStats = [
    { label: 'Total Ponds', value: assignedSites.length, change: 'Assigned to you', color: '#22d3ee', icon: '🌊' },
    { label: 'Avg Water Quality Index', value: waterQualityIndex, change: liveReadings.length ? 'From live readings' : 'No readings', color: '#22c55e', icon: '💧' },
    { label: 'DO Level', value: latestReading ? getDOValue(latestReading.temperature_c).toFixed(1) : 'N/A', change: latestReading ? 'Latest reading' : 'No readings', color: '#22d3ee', icon: 'O₂' },
    { label: 'Active Alerts', value: activeAlerts.length, change: `${liveAlerts.length} total alerts`, color: '#f59e0b', icon: '⚠' },
    { label: 'Online Devices', value: onlineDevices.length, change: `${liveDevices.length} total devices`, color: '#22c55e', icon: '📡' },
  ];

  const dynamicWaterQualityData = liveReadings.slice(0, 12).reverse().map((reading: any) => ({
    date: new Date(reading.collected_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    temperature: Number(reading.temperature_c),
    ph: Number(reading.ph),
    do: getDOValue(Number(reading.temperature_c)),
    turbidity: Number(reading.turbidity),
  }));

  const monthlySummaryTotal = Math.max(liveDevices.length, 1);
  const criticalCount = activeAlerts.filter((alert: any) => alert.severity === 'critical').length;
  const warningCount = activeAlerts.filter((alert: any) => alert.severity === 'warning').length;
  const normalCount = Math.max(onlineDevices.length - criticalCount - warningCount, 0);
  const unmonitoredCount = Math.max(assignedSites.length - new Set(liveDevices.map((device: any) => device.site_id)).size, 0);
  const dynamicMonthlySummary = [
    { name: 'Critical', value: criticalCount, color: '#ef4444' },
    { name: 'Warning', value: warningCount, color: '#f59e0b' },
    { name: 'Normal', value: normalCount, color: '#22c55e' },
    { name: 'Unmonitored', value: unmonitoredCount, color: '#6b7280' },
  ];
  const dynamicMonthlyTotal = dynamicMonthlySummary.reduce((sum, item) => sum + item.value, 0) || monthlySummaryTotal;

  const dynamicParameterInsights = [
    {
      label: 'Temperature (°C)',
      value: latestReading ? Number(latestReading.temperature_c).toFixed(1) : 'N/A',
      unit: '°C',
      status: latestReading && (latestReading.temperature_c < 20 || latestReading.temperature_c > 35) ? 'Critical' : 'Normal',
      color: latestReading && (latestReading.temperature_c < 20 || latestReading.temperature_c > 35) ? '#ef4444' : '#22c55e',
      sparkline: liveReadings.slice(0, 7).reverse().map((r: any) => Number(r.temperature_c)),
    },
    {
      label: 'pH Level',
      value: latestReading ? Number(latestReading.ph).toFixed(2) : 'N/A',
      unit: '',
      status: latestReading && (latestReading.ph < 6.5 || latestReading.ph > 8.5) ? 'High' : 'Normal',
      color: latestReading && (latestReading.ph < 6.5 || latestReading.ph > 8.5) ? '#ef4444' : '#22c55e',
      sparkline: liveReadings.slice(0, 7).reverse().map((r: any) => Number(r.ph)),
    },
    {
      label: 'Dissolved Oxygen (mg/L)',
      value: latestReading ? getDOValue(Number(latestReading.temperature_c)).toFixed(1) : 'N/A',
      unit: 'mg/L',
      status: latestReading && getDOValue(Number(latestReading.temperature_c)) < 4 ? 'Low' : 'Good',
      color: latestReading && getDOValue(Number(latestReading.temperature_c)) < 4 ? '#f59e0b' : '#22c55e',
      sparkline: liveReadings.slice(0, 7).reverse().map((r: any) => getDOValue(Number(r.temperature_c))),
    },
    {
      label: 'Turbidity (NTU)',
      value: latestReading ? Number(latestReading.turbidity).toFixed(0) : 'N/A',
      unit: 'NTU',
      status: latestReading && latestReading.turbidity > 100 ? 'High' : 'Normal',
      color: latestReading && latestReading.turbidity > 100 ? '#ef4444' : '#22c55e',
      sparkline: liveReadings.slice(0, 7).reverse().map((r: any) => Number(r.turbidity)),
    },
  ];

  const alertDays = Array.from(
    liveAlerts.reduce((map: Map<string, any>, alert: any) => {
      const date = new Date(alert.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
      const current = map.get(date) || { date, critical: 0, warning: 0, resolved: 0 };
      if (alert.status === 'resolved' || alert.status === 'safe') {
        current.resolved += 1;
      } else if (alert.severity === 'critical') {
        current.critical += 1;
      } else {
        current.warning += 1;
      }
      map.set(date, current);
      return map;
    }, new Map()).values()
  ).slice(-7);

  const alertCounts = liveAlerts.reduce((map: Map<string, number>, alert: any) => {
    const key = alert.title || alert.metric || 'Water Quality Alert';
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());
  const dynamicTopAlerts = Array.from(alertCounts.entries()).slice(0, 5).map(([label, count]) => ({
    label,
    count,
    icon: label.toLowerCase().includes('temperature') ? Thermometer : label.toLowerCase().includes('oxygen') ? Wind : label.toLowerCase().includes('ph') ? Droplet : AlertTriangle,
    color: label.toLowerCase().includes('critical') ? '#ef4444' : '#f59e0b',
  }));

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats */}
      <div className="auto-card-grid gap-4">
        {dynamicTopStats.map((stat, i) => (
          <div key={i} className="metric-card glass rounded-xl p-4 card-hover animate-slide-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="metric-card-row mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <span className="metric-label text-slate-400">{stat.label}</span>
            </div>
            <div className="metric-value metric-value-sm font-bold text-white">{stat.value}</div>
            <div className="metric-desc mt-1" style={{ color: stat.color }}>{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Water Quality Trend + Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-xl p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Water Quality Trend</h3>
              <Info className="w-4 h-4 text-slate-400" />
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071f35] border border-[#0d3660] text-xs text-white">
                {waterQualityPond} <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-5 mb-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-1 rounded-full bg-[#3b82f6]" />Temperature (°C)</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-1 rounded-full bg-[#22c55e]" />pH</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-1 rounded-full bg-[#22d3ee]" />DO (mg/L)</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-1 rounded-full bg-[#a78bfa]" />Turbidity (NTU)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicWaterQualityData.length > 0 ? dynamicWaterQualityData : waterQualityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d3660" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#0d3660' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="temperature" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="ph" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="do" stackId="3" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="turbidity" stackId="4" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Monthly Summary</h3>
            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071f35] border border-[#0d3660] text-xs text-white">
                May 2024 <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dynamicMonthlySummary} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none">
                    {dynamicMonthlySummary.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{dynamicMonthlyTotal}</span>
                <span className="text-xs text-slate-400">Total</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {dynamicMonthlySummary.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-300 flex-1">{item.name}</span>
                  <span className="text-xs text-white font-medium">{item.value}</span>
                  <span className="text-xs text-slate-400 w-10">({Math.round((item.value / dynamicMonthlyTotal) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameter Insights */}
        <div className="glass rounded-xl p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Parameter Insights</h3>
              <Info className="w-4 h-4 text-slate-400" />
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071f35] border border-[#0d3660] text-xs text-white">
                All Parameters <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {dynamicParameterInsights.map((pi, i) => {
              const data = (pi.sparkline.length > 0 ? pi.sparkline : [0]).map((v, idx) => ({ v, idx }));
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#071f35]/50 animate-slide-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: pi.color + '20' }}>
                    <Droplet className="w-4 h-4" style={{ color: pi.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{pi.label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: pi.color, backgroundColor: pi.color + '20' }}>{pi.status}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold text-white">{pi.value}</span>
                      <span className="text-xs text-slate-400">{pi.unit}</span>
                    </div>
                  </div>
                  <div className="w-16 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <Line type="monotone" dataKey="v" stroke={pi.color} strokeWidth={2} dot={false} />
                        <YAxis hide domain={['dataMin', 'dataMax']} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="flex items-center gap-1 text-sm text-[#06b6d4] mt-4 hover:text-[#22d3ee] transition-colors">
            View All Parameters <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Incident Trend */}
        <div className="glass rounded-xl p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Incident Trend</h3>
              <Info className="w-4 h-4 text-slate-400" />
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071f35] border border-[#0d3660] text-xs text-white">
                Last 7 Days <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]" /> Critical</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" /> Warning</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-[#22c55e]" /> Resolved</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertDays.length > 0 ? alertDays : incidentTrend} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d3660" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="critical" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} />
                <Bar dataKey="warning" stackId="a" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="resolved" stackId="a" fill="#22c55e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button className="flex items-center gap-1 text-sm text-[#06b6d4] mt-4 hover:text-[#22d3ee] transition-colors">
            View Incident Report <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Top Alerts */}
        <div className="glass rounded-xl p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Top Alerts</h3>
              <Info className="w-4 h-4 text-slate-400" />
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071f35] border border-[#0d3660] text-xs text-white">
                Last 7 Days <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {(dynamicTopAlerts.length > 0 ? dynamicTopAlerts : topAlerts).map((alert, i) => {
              const Icon = alert.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#071f35]/50 hover:bg-[#071f35] transition-all animate-slide-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: alert.color + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: alert.color }} />
                  </div>
                  <span className="text-sm text-white flex-1">{alert.label}</span>
                  <span className="text-sm font-medium text-white">{alert.count}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => onNavigate?.('alerts')}
            className="flex items-center gap-1 text-sm text-[#06b6d4] mt-4 hover:text-[#22d3ee] transition-colors"
          >
            View All Alerts <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
