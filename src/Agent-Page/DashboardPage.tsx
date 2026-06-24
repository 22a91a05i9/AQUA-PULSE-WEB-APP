import { useState } from 'react';
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

const statsData = [
  { label: 'Total Ponds', value: 24, icon: Waves, color: '#22d3ee', subtext: '6 Healthy', subColor: '#22c55e' },
  { label: 'Devices Online', value: 24, icon: Wifi, color: '#34d399', subtext: '96% Online', subColor: '#34d399' },
  { label: 'Total Alerts', value: 128, icon: AlertCircle, color: '#f59e0b', subtext: '15 New', subColor: '#f59e0b' },
  { label: 'Critical Alerts', value: 8, icon: AlertTriangle, color: '#ef4444', subtext: 'Immediate action', subColor: '#ef4444' },
  { label: 'Water Quality Score', value: 85, icon: Droplets, color: '#22d3ee', subtext: 'Good', subColor: '#22c55e' },
];

const pondStatus = [
  { id: 'P01', name: 'Pond 01', status: 'warning', x: 25, y: 30 },
  { id: 'P02', name: 'Pond 02', status: 'critical', x: 55, y: 25 },
  { id: 'P03', name: 'Pond 03', status: 'healthy', x: 80, y: 35 },
  { id: 'P04', name: 'Pond 04', status: 'healthy', x: 20, y: 60 },
  { id: 'P05', name: 'Pond 05', status: 'warning', x: 45, y: 55 },
  { id: 'P06', name: 'Pond 06', status: 'healthy', x: 75, y: 65 },
  { id: 'P07', name: 'Pond 07', status: 'healthy', x: 35, y: 80 },
  { id: 'P08', name: 'Pond 08', status: 'critical', x: 65, y: 85 },
];

const alerts = [
  { type: 'critical', message: 'pH level high', pond: 'Pond 03', time: '10 min ago', icon: Droplet },
  { type: 'critical', message: 'Low Dissolved Oxygen', pond: 'Pond 02', time: '25 min ago', icon: Wind },
  { type: 'warning', message: 'High Turbidity', pond: 'Pond 01', time: '1 hr ago', icon: Droplet },
  { type: 'warning', message: 'Temperature high', pond: 'Pond 06', time: '2 hr ago', icon: Thermometer },
  { type: 'info', message: 'Device battery low (20%)', pond: 'Pond 07', time: '3 hr ago', icon: CircleDot },
];

const deviceStatus = [
  { label: 'Online', value: 24, color: '#22c55e', percent: 75 },
  { label: 'Warning', value: 5, color: '#f59e0b', percent: 16 },
  { label: 'Offline', value: 2, color: '#ef4444', percent: 6 },
  { label: 'Maintenance', value: 1, color: '#6b7280', percent: 3 },
];

const waterQuality = [
  { label: 'Temperature', value: '28.1', unit: '°C', status: 'Normal', color: '#22c55e', sparkline: [28, 28.2, 27.8, 28.1, 28.5, 28.1, 28.3] },
  { label: 'pH', value: '8.9', unit: '', status: 'High', color: '#ef4444', sparkline: [8.2, 8.4, 8.5, 8.7, 8.9, 8.9, 8.8] },
  { label: 'Dissolved Oxygen', value: '3.2', unit: 'mg/L', status: 'Low', color: '#f59e0b', sparkline: [4.2, 3.8, 3.5, 3.2, 3.2, 3.4, 3.2] },
  { label: 'Turbidity', value: '120', unit: 'NTU', status: 'High', color: '#ef4444', sparkline: [80, 90, 100, 110, 115, 118, 120] },
];

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

  const statusSummary = [
    { label: 'Healthy', count: 14, color: '#22c55e' },
    { label: 'Warning', count: 6, color: '#f59e0b' },
    { label: 'Critical', count: 4, color: '#ef4444' },
    { label: 'Offline', count: 0, color: '#6b7280' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          const targetPage = pageMap[stat.label] || 'dashboard';
          return (
            <div
              key={stat.label}
              onClick={() => onNavigate?.(targetPage)}
              className="glass rounded-xl p-4 card-hover animate-slide-in-up cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <span className="text-xs text-slate-400">{stat.label}</span>
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-xs mt-1" style={{ color: stat.subColor }}>{stat.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pond Overview */}
        <div className="lg:col-span-2 glass rounded-xl p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Pond Overview</h3>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
            <button 
              onClick={() => onNavigate?.('alerts')}
              className="text-sm text-[#06b6d4] hover:text-[#22d3ee] transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, i) => {
              const Icon = alertIcons[alert.type] || AlertCircle;
              return (
                <div
                  key={i}
                  onClick={() => onNavigate?.('alerts')}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#071f35]/50 hover:bg-[#071f35] transition-all animate-slide-in-up cursor-pointer hover:border-amber-500/20"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: alertColors[alert.type] + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: alertColors[alert.type] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{alert.message}</p>
                    <p className="text-xs text-slate-400">{alert.pond}</p>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{alert.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Devices Status */}
        <div className="glass rounded-xl p-5 card-hover cursor-pointer" onClick={() => onNavigate?.('devices')}>
          <h3 className="text-lg font-semibold text-white mb-4">Devices Status</h3>
          <div className="flex items-center gap-6">
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
                <span className="text-2xl font-bold text-white">32</span>
                <span className="text-[10px] text-slate-400">Total Devices</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {deviceStatus.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-slate-300 flex-1">{d.label}</span>
                  <span className="text-sm font-medium text-white">{d.value}</span>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Water Quality (All Ponds)</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {waterQuality.map((wq, i) => {
              const sparklineData = wq.sparkline.map((v, idx) => ({ v, idx }));
              return (
                <div key={i} className="p-3 rounded-lg bg-[#071f35]/50 animate-slide-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: wq.color + '20' }}>
                      <Droplet className="w-3 h-3" style={{ color: wq.color }} />
                    </div>
                    <span className="text-xs text-slate-400">{wq.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white">{wq.value}</span>
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
