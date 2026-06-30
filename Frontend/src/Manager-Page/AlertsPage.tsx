import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, Bell, CircleDot, Search } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { PageTitle, Panel, StatCard } from './components';

interface ManagerAlert {
  id: number;
  reading_id: number;
  device_id: number;
  site_id: number | null;
  recipient_user_id: number;
  recipient_role: string | null;
  metric: string;
  severity: 'critical' | 'warning' | 'info' | 'safe' | string;
  actual_value: number;
  title: string;
  message: string;
  status: string;
  created_at: string;
}

const severityTone: Record<string, string> = {
  critical: 'text-red-300 bg-red-500/15 border-red-500/35',
  warning: 'text-amber-300 bg-amber-500/15 border-amber-500/35',
  info: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/35',
  safe: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<ManagerAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severity, setSeverity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAlerts() {
      try {
        setError('');
        const session = getAuthSession();
        if (!session) return;

        const res = await apiRequest<ManagerAlert[]>('/manager/alerts', {
          token: session.token,
        });
        setAlerts(res);
      } catch (err) {
        console.error('Failed to load manager alerts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load manager alerts from backend.');
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesSeverity = severity === 'all' || alert.severity === severity;
      const matchesSearch =
        !query ||
        alert.title.toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query) ||
        alert.metric.toLowerCase().includes(query) ||
        String(alert.device_id).includes(query) ||
        String(alert.site_id || '').includes(query);

      return matchesSeverity && matchesSearch;
    });
  }, [alerts, searchTerm, severity]);

  const openAlerts = alerts.filter((alert) => alert.status === 'open').length;
  const criticalAlerts = alerts.filter((alert) => alert.severity === 'critical').length;
  const warningAlerts = alerts.filter((alert) => alert.severity === 'warning').length;

  return (
    <div>
      <PageTitle
        title="Alerts"
        subtitle="All owner device alerts across assigned sites and monitoring devices."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Open Alerts" value={String(openAlerts)} desc="Owner device alerts" icon={Bell} tone="red" />
        <StatCard label="Critical" value={String(criticalAlerts)} desc="Needs immediate attention" icon={AlertTriangle} tone="red" />
        <StatCard label="Warnings" value={String(warningAlerts)} desc="Outside preferred range" icon={AlertCircle} tone="orange" />
      </div>

      <Panel className="mt-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 w-full rounded-md border border-[#0d3660] bg-[#020b18]/60 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300"
              placeholder="Search alerts, device, site..."
            />
          </div>
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className="h-11 rounded-md border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-slate-200 outline-none focus:border-cyan-300"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="safe">Safe</option>
          </select>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            {error}
          </div>
        ) : loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0d3660] text-xs uppercase text-slate-400">
                  <th className="px-4 py-3">Alert</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Site</th>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d3660]/70">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      No owner device alerts found.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="transition hover:bg-[#071f35]/50">
                      <td className="px-4 py-4">
                        <p className="font-bold text-white">{alert.title}</p>
                        <p className="mt-1 max-w-xl text-xs text-slate-400">{alert.message}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold capitalize ${severityTone[alert.severity] || severityTone.info}`}>
                          <CircleDot className="h-3 w-3" />
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-white">Device #{alert.device_id}</td>
                      <td className="px-4 py-4 text-slate-200">{alert.site_id ? `Site #${alert.site_id}` : 'Unassigned'}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">{alert.metric}</p>
                        <p className="text-xs text-slate-400">Value {alert.actual_value}</p>
                      </td>
                      <td className="px-4 py-4 capitalize text-slate-200">{alert.status}</td>
                      <td className="px-4 py-4 text-xs text-slate-400">{formatDate(alert.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
