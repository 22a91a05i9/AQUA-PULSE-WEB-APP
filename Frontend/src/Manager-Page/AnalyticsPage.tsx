import { useEffect, useMemo, useState } from 'react';
import { Droplet } from 'lucide-react';
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
} from 'recharts';
import { analyticsStats, readingsTrend } from './data';
import { ControlCenter, PageTitle, Panel, StatusBadge, TablePager, ToneIcon } from './components';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';

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
  water_quality: {
    avg_ph: number;
    avg_temp: number;
    avg_turbidity: number;
    reading_count: number;
  };
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

interface ManagerAlert {
  severity: string;
  status: string;
}

export interface DeviceReadingRow {
  shortId: string;
  owner: string;
  readings: number;
  status: string;
}

function formatStatus(status: string | null | undefined) {
  if (!status) return 'Inactive';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function countAlerts(alerts: ManagerAlert[]) {
  return alerts.reduce(
    (counts, alert) => {
      const status = (alert.status || '').trim().toLowerCase();
      const severity = (alert.severity || '').trim().toLowerCase();

      if (status === 'resolved' || status === 'verified' || status === 'safe' || severity === 'safe') {
        return counts;
      }

      if (severity === 'critical' || severity === 'high') {
        counts.critical += 1;
      } else if (severity === 'warning' || severity === 'medium') {
        counts.warning += 1;
      }

      return counts;
    },
    { warning: 0, critical: 0 },
  );
}

export default function AnalyticsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [overview, setOverview] = useState<ManagerOverview | null>(null);
  const [alerts, setAlerts] = useState<ManagerAlert[] | null>(null);

  useEffect(() => {
    async function loadManagerData() {
      try {
        const session = getAuthSession();
        if (!session) return;

        const [summaryResult, overviewResult, alertsResult] = await Promise.allSettled([
          apiRequest<AnalyticsSummary>('/analytics/summary', { token: session.token }),
          apiRequest<ManagerOverview>('/manager/overview', { token: session.token }),
          apiRequest<ManagerAlert[]>('/manager/alerts', { token: session.token }),
        ]);

        if (summaryResult.status === 'fulfilled') {
          setSummary(summaryResult.value);
        }

        if (overviewResult.status === 'fulfilled') {
          setOverview(overviewResult.value);
        }

        if (alertsResult.status === 'fulfilled') {
          setAlerts(alertsResult.value);
        }
      } catch (err) {
        console.error('Failed to load manager analytics data:', err);
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
  const alertBreakdown = alerts ? countAlerts(alerts) : null;
  const warningAlerts = alertBreakdown?.warning ?? summary?.alert_counts?.warning ?? 0;
  const criticalAlerts = alertBreakdown?.critical ?? summary?.alert_counts?.critical ?? 0;
  const totalOwners = overview?.stats?.owners ?? summary?.total_owners ?? 0;
  const totalAgents = overview?.stats?.agents ?? summary?.total_agents ?? 0;
  const totalDevices = overview?.stats?.devices ?? summary?.total_devices ?? 0;
  const totalSites = overview?.stats?.sites ?? summary?.total_sites ?? 0;
  const totalAlerts = alerts?.filter((alert) => !['resolved', 'verified', 'safe'].includes((alert.status || '').toLowerCase())).length
    ?? overview?.stats?.open_alerts
    ?? summary?.total_alerts
    ?? 0;
  const healthTotal = totalDevices;
  const healthyPercent = healthTotal ? Math.round((activeDevices / healthTotal) * 100) : 0;

  const healthData = [
    { name: 'Healthy', value: activeDevices, color: '#10b981' },
    { name: 'Warning', value: maintenanceDevices, color: '#f59e0b' },
    { name: 'Offline', value: inactiveDevices, color: '#a855f7' },
  ];

  const statCards = useMemo(() => {
    const [owners, active, sites, alerts] = analyticsStats;
    return [
      { ...owners, label: 'Registered Owners', value: String(totalOwners), delta: `${totalAgents} agents connected` },
      { ...active, label: 'Connected Devices', value: String(activeDevices), delta: `${totalDevices} total devices` },
      { ...sites, label: 'Farming Sites', value: String(totalSites), delta: 'Connected from backend' },
      { ...alerts, label: 'Alerts', value: String(totalAlerts), delta: `${warningAlerts} warnings, ${criticalAlerts} critical` },
    ];
  }, [activeDevices, criticalAlerts, totalAgents, totalAlerts, totalDevices, totalOwners, totalSites, warningAlerts]);

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

  const trendData = (summary?.water_quality_trend || []).map((item) => ({
    day: item.date,
    quality: Math.round(((item.ph || 0) * 10 + (item.temp || 0) + Math.max(0, 100 - (item.turbidity || 0))) / 3),
  }));
  const chartData = trendData.some((item) => item.quality > 0) ? trendData : readingsTrend;

  return (
    <div className="space-y-6">
      <ControlCenter onOpen={() => onNavigate('assignments')} />
      <PageTitle
        title="Analytics"
        subtitle="Insights and analytics overview"
        actions={<button className="h-12 rounded-lg border border-[#0d3660] px-5 text-sm font-semibold text-white">Last 7 Days</button>}
      />
      <div className="auto-card-grid gap-5">
        {statCards.map((stat) => (
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
              <LineChart data={chartData}>
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
              <p className="safe-text mt-7 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-white">{totalDevices}</p>
              <p className="mt-4 text-sm text-emerald-300">{activeDevices} active devices</p>
            </div>
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={healthData} innerRadius={56} outerRadius={76} dataKey="value">
                    {healthData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-white">{healthyPercent}%</div>
            </div>
            <div className="space-y-4">
              {healthData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-white"><span className="h-3 w-3 rounded-full" style={{ background: item.color }} />{item.name}</span>
                  <span className="text-white">{item.value} ({healthTotal ? Math.round((item.value / healthTotal) * 100) : 0}%)</span>
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
                <p className="metric-value metric-value-sm mt-4 font-extrabold text-white">
                  {index === 0 ? totalAlerts : index === 1 ? warningAlerts : criticalAlerts}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button onClick={() => onNavigate('alerts')} className="inline-flex h-12 min-w-48 items-center justify-center rounded-lg border border-[#0d3660] text-lg font-semibold text-blue-400">
              View All Alerts
            </button>
          </div>
        </Panel>
        <DeviceReadingsTable rows={deviceRows} isLoaded={overview !== null || summary !== null} />
      </div>
    </div>
  );
}

export function DeviceReadingsTable({
  rows: backendRows,
  topDevices,
  isLoaded,
}: {
  rows?: DeviceReadingRow[];
  topDevices?: AnalyticsSummary['top_devices_by_readings'];
  isLoaded?: boolean;
}) {
  const rows = backendRows || (isLoaded
    ? (topDevices || []).map((device) => ({
        shortId: device.device_uid,
        owner: device.owner,
        readings: device.readings,
        status: formatStatus(device.status),
      }))
    : []);

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
          {rows.length > 0 ? (
            rows.map((device) => (
              <tr key={device.shortId} className="border-b border-[#0d3660]/60">
                <td className="py-3 text-white">{device.shortId}</td>
                <td className="text-slate-300">{device.owner}</td>
                <td className="text-white">{device.readings}</td>
                <td><StatusBadge status={device.status} /></td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="py-8 text-center text-slate-500">
                No active devices found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-slate-400">Showing {rows.length ? 1 : 0} to {rows.length} of {rows.length} devices</p>
        <TablePager />
      </div>
    </Panel>
  );
}
