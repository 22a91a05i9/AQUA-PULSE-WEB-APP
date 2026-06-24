import {
  AlertTriangle,
  Bell,
  Box,
  Droplet,
  Fish,
  Gauge,
  MapPin,
  Thermometer,
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

const topStats = [
  { label: 'Aquaculture Sites', value: '12', desc: '15% from yesterday', icon: MapPin, color: '#0ea5e9' },
  { label: 'Devices Online', value: '24', desc: '20% uptime', icon: Box, color: '#22c55e' },
  { label: 'Total Alerts', value: '128', desc: '8% new', icon: Bell, color: '#f59e0b' },
  { label: 'Critical Alerts', value: '8', desc: 'Immediate Action', icon: AlertTriangle, color: '#ef4444' },
];

const spark = [
  { v: 4 },
  { v: 8 },
  { v: 6 },
  { v: 12 },
  { v: 9 },
  { v: 15 },
  { v: 13 },
  { v: 18 },
  { v: 16 },
  { v: 22 },
];

const liveFeed = [
  { label: 'Temperature', value: '28.1', unit: 'deg C', color: '#22c55e', icon: Thermometer, values: [2, 3, 2, 4, 5, 3, 6] },
  { label: 'pH', value: '8.2', unit: '', color: '#0ea5e9', icon: Droplet, values: [2, 2, 4, 3, 5, 4, 6] },
  { label: 'Dissolved Oxygen', value: '5.4', unit: 'mg/L', color: '#f59e0b', icon: Gauge, values: [3, 4, 3, 5, 4, 6, 5] },
  { label: 'Turbidity', value: '24', unit: 'NTU', color: '#22d3ee', icon: Fish, values: [1, 2, 2, 4, 3, 5, 4] },
];

const recentAlerts = [
  { type: 'Low Dissolved Oxygen', site: 'Oceanic Fisheries', pond: 'Pond 07', time: '10 min ago', status: 'Critical' },
  { type: 'pH level high', site: 'Blue Lake Aquafarms', pond: 'Pond 03', time: '25 min ago', status: 'Critical' },
  { type: 'High Turbidity', site: 'Green Valley Farm', pond: 'Pond 02', time: '1 hr ago', status: 'Warning' },
  { type: 'Device Maintenance', site: 'Silver Springs', pond: 'Pond 01', time: '2 hr ago', status: 'Info' },
];

const deviceRows = [
  { id: 'DVC-001', pond: 'Pond 01', status: 'Online', battery: '86%', signal: 4, seen: '1 min ago' },
  { id: 'DVC-002', pond: 'Pond 02', status: 'Online', battery: '72%', signal: 4, seen: '1 min ago' },
  { id: 'DVC-003', pond: 'Pond 03', status: 'Offline', battery: '20%', signal: 2, seen: '2 min ago' },
  { id: 'DVC-004', pond: 'Pond 04', status: 'Online', battery: '90%', signal: 5, seen: '10 sec ago' },
];

const feedData = [
  { day: 'May 12', kg: 950 },
  { day: 'May 13', kg: 1050 },
  { day: 'May 14', kg: 1200 },
  { day: 'May 15', kg: 1150 },
  { day: 'May 16', kg: 1320 },
  { day: 'May 17', kg: 1160 },
  { day: 'May 18', kg: 1330 },
];

const pageMap: Record<string, string> = {
  'Aquaculture Sites': 'sites',
  'Devices Online': 'devices',
  'Total Alerts': 'alerts',
  'Critical Alerts': 'alerts',
};

export default function DashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {topStats.map((stat) => {
          const Icon = stat.icon;
          const targetPage = pageMap[stat.label] || 'dashboard';
          return (
            <section 
              key={stat.label} 
              onClick={() => onNavigate?.(targetPage)}
              className="glass rounded-xl p-5 cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${stat.color}22` }}>
                    <Icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-sm text-white">{stat.label}</p>
                    <p className="mt-4 text-3xl font-extrabold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-emerald-400">{stat.desc}</p>
                  </div>
                </div>
                <div className="h-14 w-28">
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
                <Pie data={[{ value: 85 }, { value: 15 }]} dataKey="value" innerRadius={68} outerRadius={82} startAngle={90} endAngle={-270} stroke="none">
                  <Cell fill="#22c55e" />
                  <Cell fill="#0d3660" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-white">85</span>
              <span className="text-lg text-emerald-400">Good</span>
            </div>
          </div>
          <p className="text-center text-sm text-emerald-400">5% from yesterday</p>
        </section>

        <section className="glass rounded-xl p-5 cursor-pointer hover:border-cyan-500/30 transition-all" onClick={() => onNavigate?.('sites')}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Ponds Overview</h2>
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Recent Alerts</h2>
            <button onClick={() => onNavigate?.('alerts')} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">View All</button>
          </div>
          <div className="space-y-4">
            {recentAlerts.slice(0, 3).map((alert) => (
              <div 
                key={alert.type} 
                onClick={() => onNavigate?.('alerts')}
                className="flex items-center gap-4 border-b border-[#0d3660]/60 pb-4 last:border-0 cursor-pointer hover:border-cyan-500/20"
              >
                <AlertTriangle className={`h-7 w-7 ${alert.status === 'Warning' ? 'text-amber-400' : 'text-red-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{alert.type}</p>
                  <p className="text-sm text-slate-300">{alert.pond}</p>
                </div>
                <span className="text-sm text-slate-300">{alert.time}</span>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {liveFeed.map((item) => {
              const Icon = item.icon;
              const data = item.values.map((v) => ({ v }));
              return (
                <div key={item.label} className="rounded-lg border border-[#0d3660] bg-[#031426]/70 p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-8 w-8" style={{ color: item.color }} />
                    <div>
                      <p className="text-2xl font-bold text-white">{item.value} <span className="text-xs font-medium text-slate-300">{item.unit}</span></p>
                      <p className="text-sm text-slate-300">{item.label}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Devices Status</h2>
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
            {deviceRows.map((device) => (
              <div key={device.id} className="grid grid-cols-[0.9fr_0.8fr_0.8fr_0.6fr_0.7fr] items-center gap-2 text-sm">
                <span className="font-semibold text-white">{device.id}</span>
                <span className="text-slate-300">{device.pond}</span>
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
                {recentAlerts.map((alert) => (
                  <tr key={`${alert.type}-${alert.pond}`} className="hover:bg-[#071f35]/30 transition-all">
                    <td className="py-3 text-white">{alert.type}</td>
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
          <p className="mb-4 text-3xl font-extrabold text-white">1,245 <span className="text-lg">kg</span> <span className="text-sm text-emerald-400">7% vs last week</span></p>
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
