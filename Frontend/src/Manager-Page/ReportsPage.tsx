import { useEffect, useMemo, useState } from 'react';
import { Calendar, Download, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { readingsTrend, reportStats } from './data';
import { ControlCenter, PageTitle, Panel, StatCard } from './components';
import { DeviceReadingsTable, type DeviceReadingRow } from './AnalyticsPage';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { exportRowsToCsv } from '../lib/tableActions';

interface AnalyticsSummary {
  total_devices: number;
  total_owners: number;
  total_agents: number;
  total_sites: number;
  total_alerts: number;
  total_readings: number;
  assigned_devices: number;
  unassigned_devices: number;
  device_status: Record<string, number>;
  alert_counts: Record<string, number>;
  water_quality_trend: Array<{ date: string; ph: number; temp: number; turbidity: number }>;
  top_devices_by_readings: Array<{
    id: number;
    device_uid: string;
    owner: string;
    status: string;
    readings: number;
  }>;
}

interface ManagerOverview {
  stats?: {
    owners?: number;
    agents?: number;
    devices?: number;
    sites?: number;
    open_alerts?: number;
  };
  owners?: Array<{ id: number; full_name: string }>;
  devices?: Array<{
    id: number;
    device_uid: string;
    status: string;
    owner_user_id: number | null;
    site_id: number | null;
  }>;
}

function formatStatus(status: string | null | undefined) {
  if (!status) return 'Inactive';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [overview, setOverview] = useState<ManagerOverview | null>(null);
  const todayIso = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(() => {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return from.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(todayIso);

  useEffect(() => {
    async function loadManagerData() {
      try {
        const session = getAuthSession();
        if (!session) return;

        const [summaryResult, overviewResult] = await Promise.allSettled([
          apiRequest<AnalyticsSummary>('/analytics/summary', { token: session.token }),
          apiRequest<ManagerOverview>('/manager/overview', { token: session.token }),
        ]);

        if (summaryResult.status === 'fulfilled') {
          setSummary(summaryResult.value);
        }

        if (overviewResult.status === 'fulfilled') {
          setOverview(overviewResult.value);
        }
      } catch (err) {
        console.error('Failed to load manager report data:', err);
      }
    }

    loadManagerData();
  }, []);

  const overviewDevices = overview?.devices || [];
  const activeDevices = overview
    ? overviewDevices.filter((device) => ['active', 'online'].includes((device.status || '').toLowerCase())).length
    : summary?.device_status?.active || 0;
  const inactiveDevices = overview
    ? overviewDevices.filter((device) => !['active', 'online', 'maintenance'].includes((device.status || '').toLowerCase())).length
    : summary?.device_status?.inactive || 0;
  const maintenanceDevices = overview
    ? overviewDevices.filter((device) => (device.status || '').toLowerCase() === 'maintenance').length
    : summary?.device_status?.maintenance || 0;
  const totalDevices = overview?.stats?.devices ?? summary?.total_devices ?? 0;
  const totalOwners = overview?.stats?.owners ?? summary?.total_owners ?? 0;
  const totalAgents = overview?.stats?.agents ?? summary?.total_agents ?? 0;

  const performance = [
    { name: 'Healthy', value: activeDevices, color: '#22c55e' },
    { name: 'Warning', value: maintenanceDevices, color: '#f59e0b' },
    { name: 'Offline', value: inactiveDevices, color: '#ef4444' },
  ];

  const dynamicReportStats = useMemo(() => {
    const [total, active, offline, readings] = reportStats;
    return [
      { ...total, value: String(totalDevices), delta: 'Total registered devices' },
      { ...active, label: 'Connected Devices', value: String(activeDevices), delta: 'Active right now' },
      { ...offline, label: 'Registered Owners', value: String(totalOwners), delta: `${totalAgents} agents connected`, icon: Users, tone: 'green' },
      { ...readings, value: String(summary?.total_readings ?? 0), delta: 'Total backend readings' },
    ];
  }, [activeDevices, summary?.total_readings, totalAgents, totalDevices, totalOwners]);

  const deviceRows = useMemo<DeviceReadingRow[]>(() => {
    if (!overview) return [];

    const ownersById = new Map((overview.owners || []).map((owner) => [owner.id, owner.full_name]));
    const readingsByDeviceId = new Map((summary?.top_devices_by_readings || []).map((device) => [device.id, device.readings]));

    return overviewDevices.map((device) => ({
      shortId: device.device_uid,
      owner: device.owner_user_id ? ownersById.get(device.owner_user_id) || `Owner #${device.owner_user_id}` : 'Unassigned',
      readings: readingsByDeviceId.get(device.id) || 0,
      status: formatStatus(device.status),
    }));
  }, [overview, overviewDevices, summary?.top_devices_by_readings]);

  const readingsData = (summary?.water_quality_trend || []).map((item) => ({
    day: item.date,
    active: activeDevices,
    offline: inactiveDevices,
    total: totalDevices,
    readings: Math.round((item.ph || 0) + (item.temp || 0) + (item.turbidity || 0)),
  }));
  const statusChartData = readingsData.some((item) => item.active > 0 || item.offline > 0 || item.total > 0)
    ? readingsData
    : readingsTrend;
  const readingsChartData = readingsData.some((item) => item.readings > 0)
    ? readingsData
    : readingsTrend;

  const exportReport = () => {
    exportRowsToCsv('aqua-pulse-manager-report.csv', [
      {
        TotalDevices: totalDevices,
        ConnectedDevices: activeDevices,
        OfflineDevices: inactiveDevices,
        MaintenanceDevices: maintenanceDevices,
        TotalOwners: totalOwners,
        TotalAgents: totalAgents,
        TotalReadings: summary?.total_readings ?? 0,
        FromDate: dateFrom,
        ToDate: dateTo,
      },
      ...deviceRows.map((device) => ({
        Device: device.shortId,
        Owner: device.owner,
        Readings: device.readings,
        Status: device.status,
      })),
    ]);
  };

  return (
    <div className="space-y-6">
      <ControlCenter compact />
      <PageTitle
        title="Reports"
        subtitle="Detailed reports and insights about your aquaculture operations"
        actions={
          <div className="flex flex-wrap gap-3">
            <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-[#0d3660] px-3 py-2 text-sm font-semibold text-white">
              <Calendar className="h-5 w-5 text-cyan-300" />
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-8 rounded border border-[#0d3660] bg-[#020b18] px-2 text-sm text-white outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-8 rounded border border-[#0d3660] bg-[#020b18] px-2 text-sm text-white outline-none"
              />
            </div>
            <button onClick={exportReport} className="flex h-12 items-center gap-3 rounded-lg border border-[#0d3660] px-5 text-sm font-semibold text-white"><Download className="h-5 w-5" /> Export Report</button>
          </div>
        }
      />
      <div className="auto-card-grid gap-5">
        {dynamicReportStats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} desc={stat.delta} icon={stat.icon} tone={stat.tone} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel>
          <h2 className="text-xl font-extrabold text-white">Device Status Trend</h2>
          <p className="mt-2 text-sm text-slate-300">Overview of device status over time</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statusChartData}>
                <CartesianGrid stroke="#0d3660" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="active" name="Active" stroke="#22c55e" strokeWidth={3} />
                <Line type="monotone" dataKey="offline" name="Offline" stroke="#ef4444" strokeWidth={3} />
                <Line type="monotone" dataKey="total" name="Total" stroke="#1685ff" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <h2 className="text-xl font-extrabold text-white">Data Readings Overview</h2>
          <p className="mt-2 text-sm text-slate-300">Total readings collected</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readingsChartData}>
                <CartesianGrid stroke="#0d3660" />
                <XAxis dataKey="day" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip />
                <Legend />
                <Bar dataKey="readings" name="Readings" fill="#1668e8" radius={[4, 4, 0, 0]} />
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
                <span className="text-2xl font-extrabold text-white">{totalDevices}</span>
                <span className="text-sm text-slate-300">Total</span>
              </div>
            </div>
            <div className="space-y-5">
              {performance.map((item) => (
                <div key={item.name} className="flex justify-between text-sm">
                  <span className="flex items-center gap-3 text-white"><span className="h-4 w-4 rounded-full" style={{ background: item.color }} /> {item.name}</span>
                  <span className="text-white">{item.value} ({totalDevices ? Math.round((item.value / totalDevices) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <DeviceReadingsTable rows={deviceRows} isLoaded={overview !== null || summary !== null} />
      </div>
    </div>
  );
}
