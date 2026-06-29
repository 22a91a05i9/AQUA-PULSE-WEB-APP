import { Calendar, Download } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { readingsTrend, reportStats } from './data';
import { ControlCenter, PageTitle, Panel, StatCard } from './components';
import { DeviceReadingsTable } from './AnalyticsPage';

export default function ReportsPage() {
  const performance = [
    { name: 'Healthy', value: 21, color: '#22c55e' },
    { name: 'Warning', value: 2, color: '#f59e0b' },
    { name: 'Offline', value: 1, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <ControlCenter compact />
      <PageTitle
        title="Reports"
        subtitle="Detailed reports and insights about your aquaculture operations"
        actions={
          <div className="flex flex-wrap gap-3">
            <button className="flex h-12 items-center gap-3 rounded-lg border border-[#0d3660] px-5 text-sm font-semibold text-white"><Calendar className="h-5 w-5" /> May 11 - May 17, 2024</button>
            <button className="flex h-12 items-center gap-3 rounded-lg border border-[#0d3660] px-5 text-sm font-semibold text-white"><Download className="h-5 w-5" /> Export Report</button>
          </div>
        }
      />
      <div className="auto-card-grid gap-5">
        {reportStats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} desc={stat.delta} icon={stat.icon} tone={stat.tone} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel>
          <h2 className="text-xl font-extrabold text-white">Device Status Trend</h2>
          <p className="mt-2 text-sm text-slate-300">Overview of device status over time</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readingsTrend}>
                <CartesianGrid stroke="#0d3660" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip />
                <Line type="monotone" dataKey="active" stroke="#22c55e" strokeWidth={3} />
                <Line type="monotone" dataKey="offline" stroke="#ef4444" strokeWidth={3} />
                <Line type="monotone" dataKey="total" stroke="#1685ff" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <h2 className="text-xl font-extrabold text-white">Data Readings Overview</h2>
          <p className="mt-2 text-sm text-slate-300">Total readings collected</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readingsTrend}>
                <CartesianGrid stroke="#0d3660" />
                <XAxis dataKey="day" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip />
                <Bar dataKey="readings" fill="#1668e8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.78fr_1.3fr]">
        <Panel>
          <h2 className="text-xl font-extrabold text-white">Device Performance Summary</h2>
          <p className="mt-2 text-sm text-slate-300">Performance by device status</p>
          <div className="mt-6 grid grid-cols-1 items-center gap-4 md:grid-cols-[240px_1fr]">
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={performance} innerRadius={64} outerRadius={92} dataKey="value">
                    {performance.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white">24</span>
                <span className="text-sm text-slate-300">Total</span>
              </div>
            </div>
            <div className="space-y-5">
              {performance.map((item) => (
                <div key={item.name} className="flex justify-between text-sm">
                  <span className="flex items-center gap-3 text-white"><span className="h-4 w-4 rounded-full" style={{ background: item.color }} /> {item.name}</span>
                  <span className="text-white">{item.value} ({item.name === 'Healthy' ? '87.5' : item.name === 'Warning' ? '8.3' : '4.2'}%)</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <DeviceReadingsTable />
      </div>
    </div>
  );
}
