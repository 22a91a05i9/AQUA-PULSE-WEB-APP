import { Droplet } from 'lucide-react';
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
} from 'recharts';
import { analyticsStats, devices, readingsTrend } from './data';
import { ControlCenter, PageTitle, Panel, StatusBadge, TablePager, ToneIcon } from './components';

export default function AnalyticsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const healthData = [
    { name: 'Healthy', value: 24, color: '#10b981' },
    { name: 'Warning', value: 0, color: '#f59e0b' },
    { name: 'Offline', value: 0, color: '#a855f7' },
  ];

  return (
    <div className="space-y-6">
      <ControlCenter />
      <PageTitle
        title="Analytics"
        subtitle="Insights and analytics overview"
        actions={<button className="h-12 rounded-lg border border-[#0d3660] px-5 text-sm font-semibold text-white">Last 7 Days</button>}
      />
      <div className="auto-card-grid gap-5">
        {analyticsStats.map((stat) => (
          <Panel key={stat.label} className="metric-card">
            <div className="metric-card-row">
            <ToneIcon icon={stat.icon} tone={stat.tone} />
            <div className="metric-copy">
              <p className="metric-label font-bold text-cyan-300">{stat.label}</p>
              <p className="metric-value mt-4 font-extrabold text-white">{stat.value}</p>
              <p className={`metric-desc mt-3 ${stat.positive === false ? 'text-orange-400' : 'text-emerald-300'}`}>{stat.delta}</p>
            </div>
            </div>
          </Panel>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.1fr]">
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-4">
                <ToneIcon icon={Droplet} tone="blue" />
                <div>
                  <h2 className="safe-text text-xl font-extrabold text-cyan-300">Water Quality Overview</h2>
                  <p className="mt-3 text-sm text-slate-300">Average water quality index</p>
                </div>
              </div>
              <p className="safe-text mt-6 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-blue-400">Good</p>
              <p className="mt-4 text-sm text-emerald-300">5% vs last 7 days</p>
            </div>
            <div className="h-32 min-w-[12rem] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readingsTrend}>
                  <Line type="monotone" dataKey="quality" stroke="#1685ff" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_260px_220px]">
            <div>
              <h2 className="safe-text text-xl font-extrabold text-cyan-300">Device Health Summary</h2>
              <p className="mt-3 text-sm text-slate-300">Total devices monitored</p>
              <p className="safe-text mt-7 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-white">24</p>
              <p className="mt-4 text-sm text-emerald-300">4 vs last 7 days</p>
            </div>
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={healthData} innerRadius={56} outerRadius={76} dataKey="value">
                    {healthData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-white">100%</div>
            </div>
            <div className="space-y-4">
              {healthData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-white"><span className="h-3 w-3 rounded-full" style={{ background: item.color }} />{item.name}</span>
                  <span className="text-white">{item.value} ({item.name === 'Healthy' ? '100' : '0'}%)</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.1fr]">
        <Panel>
          <h2 className="text-xl font-extrabold text-cyan-300">Recent Alerts Summary</h2>
          <p className="mt-3 text-sm text-slate-300">Compared to previous 7 days</p>
          <div className="auto-card-grid-sm mt-8 gap-0 divide-x divide-[#0d3660] text-center">
            {['Total Alerts', 'Warning Alerts', 'Critical Alerts'].map((label, index) => (
              <div key={label} className="metric-card px-2">
                <p className="metric-label text-slate-300">{label}</p>
                <p className="metric-value metric-value-sm mt-4 font-extrabold text-white">{index === 2 ? '0' : '8'} <span className="text-base text-orange-400">{index === 2 ? '-' : '2'}</span></p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button onClick={() => onNavigate('alerts')} className="inline-flex h-12 min-w-48 items-center justify-center rounded-lg border border-[#0d3660] text-lg font-semibold text-blue-400">
              View All Alerts
            </button>
          </div>
        </Panel>
        <DeviceReadingsTable />
      </div>
    </div>
  );
}

export function DeviceReadingsTable() {
  return (
    <Panel>
      <h2 className="text-xl font-extrabold text-white">Top Devices by Data Readings</h2>
      <p className="mt-2 text-sm text-slate-300">Most active devices in selected period</p>
      <table className="mt-4 w-full text-left text-sm">
        <thead className="border-b border-[#0d3660] text-slate-300">
          <tr>
            <th className="py-3 font-medium">Device ID</th>
            <th className="py-3 font-medium">Owner</th>
            <th className="py-3 font-medium">Total Readings</th>
            <th className="py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.shortId} className="border-b border-[#0d3660]/60">
              <td className="py-3 text-white">{device.shortId}</td>
              <td className="text-slate-300">{device.owner}</td>
              <td className="text-white">{device.readings}</td>
              <td><StatusBadge status={device.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-slate-400">Showing 1 to 5 of 5 devices</p>
        <TablePager />
      </div>
    </Panel>
  );
}
