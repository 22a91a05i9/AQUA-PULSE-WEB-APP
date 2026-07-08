import { useEffect, useState } from 'react';
import {
  Waves,
  Wifi,
  AlertTriangle,
  AlertCircle,
  Droplets,
  ArrowRight,
  MapPin,
  CircleDot,
  Thermometer,
  Droplet,
  Wind,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';



const statusColors: Record<string, string> = {
  healthy: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
  offline: '#6b7280',
};

const alertColors: Record<string, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

const alertIcons: Record<string, typeof AlertTriangle> = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: CircleDot,
};

const pageMap: Record<string, string> = {
  'Total Ponds': 'sites',
  'Devices Online': 'devices',
  'Total Alerts': 'alerts',
  'Critical Alerts': 'alerts',
  'Water Quality Score': 'live',
};

export default function DashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [hoveredPond, setHoveredPond] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAgentOverview() {
      try {
        const session = getAuthSession();
        if (session) {
          const res = await apiRequest<any>('/agent/overview', {
            token: session.token,
          });
          setData(res);
        }
      } catch (err) {
        console.error('Failed to connect to Agent overview API:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAgentOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const totalSites = data?.assigned_sites ? data.assigned_sites.length : 0;
  const onlineDevices = data?.devices ? data.devices.filter((d: any) => d.status === 'active' || d.status === 'online').length : 0;
  const activeAlerts = data?.alerts ? data.alerts.filter((a: any) => a.status === 'open').length : 0;
  const criticalAlertsCount = data?.alerts ? data.alerts.filter((a: any) => a.severity === 'critical' && a.status === 'open').length : 0;

  // Compute average Water Quality Score based on readings (normally 0-100)
  let waterQualityScore = 85;
  const recentReadings = data?.recent_readings || [];
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

  const statsData = [
    { label: 'Total Ponds', value: totalSites, icon: Waves, color: '#22d3ee', subtext: 'Active assignments', subColor: '#22c55e' },
    { label: 'Devices Online', value: onlineDevices, icon: Wifi, color: '#34d399', subtext: `${onlineDevices} active in field`, subColor: '#34d399' },
    { label: 'Total Alerts', value: activeAlerts, icon: AlertCircle, color: '#f59e0b', subtext: 'Awaiting inspection', subColor: '#f59e0b' },
    { label: 'Critical Alerts', value: criticalAlertsCount, icon: AlertTriangle, color: '#ef4444', subtext: 'Immediate action', subColor: '#ef4444' },
    { label: 'Water Quality Score', value: waterQualityScore, icon: Droplets, color: '#22d3ee', subtext: waterQualityScore >= 80 ? 'Good' : 'Needs attention', subColor: waterQualityScore >= 80 ? '#22c55e' : '#f59e0b' },
  ];

  const getCoordinates = (index: number) => {
    const coords = [
      { x: 25, y: 30 },
      { x: 55, y: 25 },
      { x: 80, y: 35 },
      { x: 20, y: 60 },
      { x: 45, y: 55 },
      { x: 75, y: 65 },
      { x: 35, y: 80 },
      { x: 65, y: 85 },
    ];
    return coords[index % coords.length];
  };

  const pondStatus = (data?.assigned_sites || []).map((site: any, idx: number) => {
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

  const healthyCount = pondStatus.filter((p: any) => p.status === 'healthy').length;
  const warningCount = pondStatus.filter((p: any) => p.status === 'warning').length;
  const criticalCount = pondStatus.filter((p: any) => p.status === 'critical').length;
  const offlineCount = (data?.devices || []).filter((d: any) => d.status === 'offline' || d.status === 'inactive').length;

  const statusSummary = [
    { label: 'Healthy', count: healthyCount, color: '#22c55e' },
    { label: 'Warning', count: warningCount, color: '#f59e0b' },
    { label: 'Critical', count: criticalCount, color: '#ef4444' },
    { label: 'Offline', count: offlineCount, color: '#6b7280' },
  ];

  const alerts = data?.alerts && data.alerts.length > 0
    ? data.alerts.map((a: any) => ({
        type: a.severity || 'warning',
        message: a.title || a.message || 'Water quality alert',
        pond: `Site ID #${a.site_id}`,
        time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }))
    : [];

  const devicesList = data?.devices || [];
  const totalDevs = devicesList.length;
  const activeDevs = devicesList.filter((d: any) => d.status === 'active' || d.status === 'online').length;
  const warningDevs = devicesList.filter((d: any) => d.status === 'warning').length;
  const offlineDevs = devicesList.filter((d: any) => d.status === 'offline' || d.status === 'inactive').length;
  const maintenanceDevs = devicesList.filter((d: any) => d.status === 'maintenance').length;

  const deviceStatus = [
    { label: 'Online', value: activeDevs, color: '#22c55e', percent: totalDevs ? Math.round((activeDevs / totalDevs) * 100) : 0 },
    { label: 'Warning', value: warningDevs, color: '#f59e0b', percent: totalDevs ? Math.round((warningDevs / totalDevs) * 100) : 0 },
    { label: 'Offline', value: offlineDevs, color: '#6b7280', percent: totalDevs ? Math.round((offlineDevs / totalDevs) * 100) : 0 },
    { label: 'Maintenance', value: maintenanceDevs, color: '#a855f7', percent: totalDevs ? Math.round((maintenanceDevs / totalDevs) * 100) : 0 },
  ];

  // Dynamic water quality metrics
  const latestReading = recentReadings[0];
  const wqSparkline = (key: string, defaultVals: number[]) => {
    if (recentReadings.length === 0) return defaultVals;
    return recentReadings.slice(0, 10).reverse().map((r: any) => r[key]);
  };

  const getDOValue = (temp: number) => {
    return Number((8.5 - (temp - 20) * 0.15).toFixed(1));
  };

  const waterQuality = [
    {
      label: 'Temperature',
      value: latestReading ? latestReading.temperature_c.toFixed(1) : '28.1',
      unit: '°C',
      status: latestReading ? (latestReading.temperature_c < 20 || latestReading.temperature_c > 35 ? 'Critical' : 'Normal') : 'Normal',
      color: latestReading ? (latestReading.temperature_c < 20 || latestReading.temperature_c > 35 ? '#ef4444' : '#22c55e') : '#22c55e',
      sparkline: wqSparkline('temperature_c', [28, 28.2, 27.8, 28.1, 28.5, 28.1, 28.3]),
    },
    {
      label: 'pH',
      value: latestReading ? latestReading.ph.toFixed(1) : '8.9',
      unit: '',
      status: latestReading ? (latestReading.ph < 6.5 || latestReading.ph > 8.5 ? 'High' : 'Normal') : 'High',
      color: latestReading ? (latestReading.ph < 6.5 || latestReading.ph > 8.5 ? '#ef4444' : '#22c55e') : '#ef4444',
      sparkline: wqSparkline('ph', [8.2, 8.4, 8.5, 8.7, 8.9, 8.9, 8.8]),
    },
    {
      label: 'Dissolved Oxygen',
      value: latestReading ? getDOValue(latestReading.temperature_c).toString() : '3.2',
      unit: 'mg/L',
      status: latestReading ? (getDOValue(latestReading.temperature_c) < 4.0 ? 'Low' : 'Normal') : 'Low',
      color: latestReading ? (getDOValue(latestReading.temperature_c) < 4.0 ? '#f59e0b' : '#22c55e') : '#f59e0b',
      sparkline: recentReadings.length > 0 
        ? recentReadings.slice(0, 10).reverse().map((r: any) => getDOValue(r.temperature_c))
        : [4.2, 3.8, 3.5, 3.2, 3.2, 3.4, 3.2],
    },
    {
      label: 'Turbidity',
      value: latestReading ? latestReading.turbidity.toFixed(0) : '120',
      unit: 'NTU',
      status: latestReading ? (latestReading.turbidity > 150 ? 'Critical' : latestReading.turbidity > 100 ? 'High' : 'Normal') : 'High',
      color: latestReading ? (latestReading.turbidity > 150 ? '#ef4444' : latestReading.turbidity > 100 ? '#f59e0b' : '#22c55e') : '#ef4444',
      sparkline: wqSparkline('turbidity', [80, 90, 100, 110, 115, 118, 120]),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Stats Cards */}
      <div className="auto-card-grid gap-4">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          const targetPage = pageMap[stat.label] || 'dashboard';
          return (
            <div
              key={stat.label}
              onClick={() => onNavigate?.(targetPage)}
              className="metric-card glass rounded-xl p-4 card-hover animate-slide-in-up cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="metric-card-row mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <span className="metric-label text-slate-400">{stat.label}</span>
              </div>
              <div className="metric-value font-bold text-white">{stat.value}</div>
              <div className="metric-desc mt-1" style={{ color: stat.subColor }}>{stat.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pond Overview */}
        <div className="lg:col-span-2 glass rounded-xl p-5 card-hover">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="safe-text text-lg font-semibold text-white">Pond Overview</h3>
            <button 
              onClick={() => onNavigate?.('sites')}
              className="flex items-center gap-1 text-sm text-[#06b6d4] hover:text-[#22d3ee] transition-colors"
            >
              View All Ponds <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative h-72 rounded-lg overflow-hidden cursor-pointer" onClick={() => onNavigate?.('sites')}>
            {/* Exact pond background image */}
            <div className="absolute inset-0 z-0">
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
              {/* Dark overlay so the markers pop */}
              <div className="absolute inset-0 bg-[#020b18]/45" />
            </div>
            {/* Ponds */}
            {pondStatus.map((pond) => (
              <div
                key={pond.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10"
                style={{ left: `${pond.x}%`, top: `${pond.y}%` }}
                onMouseEnter={() => setHoveredPond(pond.id)}
                onMouseLeave={() => setHoveredPond(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.('sites');
                }}
              >
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${hoveredPond === pond.id ? 'scale-125' : ''}`}
                  style={{ backgroundColor: statusColors[pond.status] + '30', border: `2px solid ${statusColors[pond.status]}` }}
                >
                  <MapPin className="w-5 h-5" style={{ color: statusColors[pond.status] }} />
                </div>
                {hoveredPond === pond.id && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#071f35] border border-[#0d3660] rounded-lg px-2 py-1 text-xs text-white z-10 shadow-lg">
                    {pond.name} - {pond.status}
                  </div>
                )}
              </div>
            ))}
            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-3 z-10">
              {statusSummary.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-400">{item.label} <span className="text-white">{item.count}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="glass rounded-xl p-5 card-hover">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="safe-text text-lg font-semibold text-white">Recent Alerts</h3>
            <button 
              onClick={() => onNavigate?.('alerts')}
              className="text-sm text-[#06b6d4] hover:text-[#22d3ee] transition-colors"
            >
              View All Alerts
            </button>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No active alerts found.</p>
            ) : (
              alerts.slice(0, 5).map((alert: any, i: number) => {
                const Icon = alertIcons[alert.type] || AlertCircle;
                return (
                  <div
                    key={i}
                    onClick={() => onNavigate?.('alerts')}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[#071f35]/50 hover:bg-[#071f35] transition-all animate-slide-in-up cursor-pointer hover:border-amber-500/20"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (alertColors[alert.type] || '#f59e0b') + '20' }}>
                      <Icon className="w-4 h-4" style={{ color: alertColors[alert.type] || '#f59e0b' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{alert.message}</p>
                      <p className="text-xs text-slate-400">{alert.pond}</p>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{alert.time}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Devices Status */}
        <div className="glass rounded-xl p-5 card-hover cursor-pointer" onClick={() => onNavigate?.('devices')}>
          <h3 className="text-lg font-semibold text-white mb-4">Devices Status</h3>
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="percent"
                    stroke="none"
                  >
                    {deviceStatus.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{onlineDevices}</span>
                <span className="text-[10px] text-slate-400">Total Devices</span>
              </div>
            </div>
            <div className="min-w-[12rem] flex-1 space-y-2">
              {deviceStatus.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-slate-300 flex-1">{d.label}</span>
                  <span className="text-sm font-medium text-white">{d.label === 'Online' ? onlineDevices : d.value}</span>
                  <span className="text-xs text-slate-400 w-10">{d.percent}%</span>
                </div>
              ))}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.('devices');
                }}
                className="flex items-center gap-1 text-sm text-[#06b6d4] mt-3 hover:text-[#22d3ee] transition-colors"
              >
                View All Devices <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Water Quality */}
        <div className="glass rounded-xl p-5 card-hover cursor-pointer" onClick={() => onNavigate?.('live')}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="safe-text text-lg font-semibold text-white">Water Quality (All Ponds)</h3>
          </div>
          <div className="auto-card-grid-sm gap-4">
            {waterQuality.map((wq, i) => {
              const sparklineData = wq.sparkline.map((v, idx) => ({ v, idx }));
              return (
                <div key={i} className="metric-card p-3 rounded-lg bg-[#071f35]/50 animate-slide-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: wq.color + '20' }}>
                      <Droplet className="w-3 h-3" style={{ color: wq.color }} />
                    </div>
                    <span className="metric-label text-slate-400">{wq.label}</span>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-baseline gap-1">
                    <span className="metric-value metric-value-sm font-bold text-white">{wq.value}</span>
                    <span className="text-xs text-slate-400">{wq.unit}</span>
                    <span className="text-xs ml-2" style={{ color: wq.color }}>{wq.status}</span>
                  </div>
                  <div className="h-8 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparklineData}>
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke={wq.color}
                          strokeWidth={2}
                          dot={false}
                        />
                        <YAxis hide domain={['dataMin', 'dataMax']} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.('live');
            }}
            className="flex items-center gap-1 text-sm text-[#06b6d4] mt-4 hover:text-[#22d3ee] transition-colors"
          >
            View Live Monitoring <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
