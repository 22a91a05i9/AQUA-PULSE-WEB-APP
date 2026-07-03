import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Cpu,
  Download,
  FileText,
  Filter,
  Folder,
  Info,
  Mail,
  MapPin,
  Microscope,
  Search,
  Send,
  Shield,
  UserRound,
  Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { exportRowsToCsv } from '../lib/tableActions';

type AlertTone = 'Critical' | 'Warning' | 'Info' | 'Resolved';

type AlertRow = {
  id: number;
  title: string;
  site: string;
  metric: string;
  time: string;
  tone: AlertTone;
  deviceId: string;
  alertType: string;
  deviceType: string;
  pond: string;
  farm: string;
  firmware: string;
  description: string;
};

const toneStyles: Record<AlertTone, { text: string; bg: string; border: string; icon: LucideIcon }> = {
  Critical: { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/50', icon: Bell },
  Warning: { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/50', icon: AlertTriangle },
  Info: { text: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/50', icon: Info },
  Resolved: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/50', icon: CheckCircle2 },
};

export default function AlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<AlertRow | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  async function loadAlerts() {
    try {
      const session = getAuthSession();
      if (!session) return;

      const res = await apiRequest<any[]>('/readings/alerts/me', {
        token: session.token,
      });

      const mapped: AlertRow[] = res.map((a: any) => {
        let tone: AlertTone = 'Info';
        if (a.status === 'resolved' || a.status === 'acknowledged') {
          tone = 'Resolved';
        } else if (a.severity === 'critical') {
          tone = 'Critical';
        } else if (a.severity === 'warning') {
          tone = 'Warning';
        }

        return {
          id: a.id,
          title: a.title || 'Water Quality Alert',
          site: a.site_id ? `Site ID #${a.site_id}` : 'System Alert',
          metric: `${a.metric || 'Value'}: ${a.actual_value !== undefined ? a.actual_value.toFixed(1) : 'N/A'}`,
          time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          tone,
          deviceId: String(a.device_id),
          alertType: a.title || 'Alert',
          deviceType: `${a.metric || 'Sensor'} Monitor`,
          pond: a.site_id ? `Site #${a.site_id}` : 'System-wide',
          farm: a.site_id ? `Farm Site #${a.site_id}` : 'System-wide',
          firmware: 'v2.0.0',
          description: a.message || 'Water parameter limit exceeded.',
        };
      });

      setAlerts(mapped);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (selectedAlert) {
    return <AlertDetails alert={selectedAlert} onBack={() => setSelectedAlert(null)} onAlertUpdated={loadAlerts} />;
  }

  const filtered = alerts.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || a.tone.toLowerCase() === severityFilter.toLowerCase();
    const matchesSite = siteFilter === 'all' || a.site.toLowerCase().includes(siteFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? (a.tone !== 'Resolved') : (a.tone === 'Resolved'));
    return matchesSearch && matchesSeverity && matchesSite && matchesStatus;
  });

  const activeAlerts = filtered.filter(a => a.tone === 'Critical' || a.tone === 'Warning' || a.tone === 'Info');
  const occurredAlerts = filtered.filter(a => a.tone === 'Resolved');

  const criticalCount = alerts.filter(a => a.tone === 'Critical').length;
  const warningCount = alerts.filter(a => a.tone === 'Warning').length;
  const infoCount = alerts.filter(a => a.tone === 'Info').length;
  const resolvedCount = alerts.filter(a => a.tone === 'Resolved').length;

  const exportAlerts = () => {
    exportRowsToCsv(
      'aqua-pulse-owner-alerts.csv',
      filtered.map((a) => ({
        ID: a.id,
        Title: a.title,
        Site: a.site,
        Metric: a.metric,
        Time: a.time,
        Severity: a.tone,
        DeviceID: a.deviceId,
        Description: a.description,
      })),
    );
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="auto-card-grid gap-4">
        <AlertSummary tone="Critical" label="Critical Alerts" value={String(criticalCount)} desc="Immediate action required" />
        <AlertSummary tone="Warning" label="Warnings" value={String(warningCount)} desc="Attention needed" />
        <AlertSummary tone="Info" label="Info Alerts" value={String(infoCount)} desc="For your information" />
        <AlertSummary tone="Resolved" label="Resolved" value={String(resolvedCount)} desc="Active & archived alerts" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[min(100%,20rem)] flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/55 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-400" 
            placeholder="Search alerts by device, pond or site..." 
          />
        </div>
        {showAdvancedFilters && (
          <>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-12 min-w-48 rounded-lg border border-[#0d3660] bg-[#020b18]/55 px-4 text-sm font-semibold text-white outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="h-12 min-w-48 rounded-lg border border-[#0d3660] bg-[#020b18]/55 px-4 text-sm font-semibold text-white outline-none"
            >
              <option value="all">All Sites</option>
              {Array.from(new Set(alerts.map(a => a.site).filter(Boolean))).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 min-w-48 rounded-lg border border-[#0d3660] bg-[#020b18]/55 px-4 text-sm font-semibold text-white outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </>
        )}
        <button 
          onClick={() => setShowAdvancedFilters(prev => !prev)}
          className={`flex h-12 items-center gap-3 rounded-lg border px-7 text-sm font-semibold transition ${
            showAdvancedFilters ? 'border-[#06b6d4] text-[#22d3ee] bg-[#06b6d4]/10' : 'border-[#0d3660] text-white hover:bg-[#071f35]'
          }`}
        >
          <Filter className="h-5 w-5" /> Filter
        </button>
        <button onClick={exportAlerts} className="flex h-12 items-center gap-3 rounded-lg border border-[#0d3660] px-7 text-sm font-semibold text-white">
          <Download className="h-5 w-5" /> Export
        </button>
      </div>

      <section className="glass overflow-hidden rounded-lg">
        <h2 className="border-b border-[#0d3660] px-5 py-4 text-sm font-bold text-red-400">ACTIVE ALERTS ({activeAlerts.length})</h2>
        <div className="divide-y divide-[#0d3660]/60 px-5">
          {activeAlerts.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No active alerts</p>
          ) : (
            activeAlerts.map((alert) => (
              <AlertListRow key={alert.id} alert={alert} onClick={() => setSelectedAlert(alert)} />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="px-5 pb-1 text-sm font-bold text-cyan-300">HISTORICAL / RESOLVED ({occurredAlerts.length})</h2>
        <div className="glass divide-y divide-[#0d3660]/60 rounded-lg px-5">
          {occurredAlerts.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No historical alerts</p>
          ) : (
            occurredAlerts.map((alert) => (
              <AlertListRow key={alert.id} alert={alert} onClick={() => setSelectedAlert(alert)} />
            ))
          )}
        </div>
      </section>

      <div className="flex items-center justify-between text-sm text-white">
        <span>Showing {filtered.length} of {alerts.length} alerts</span>
        <div className="flex items-center gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-md border border-[#0d3660] text-slate-400"><ChevronLeft className="h-4 w-4" /></button>
          <button className="h-10 w-10 bg-blue-600 font-bold rounded-md">1</button>
          <button className="flex h-10 w-10 items-center justify-center rounded-md border border-[#0d3660] text-slate-400"><ChevronRight className="h-4 w-4" /></button>
          <span className="ml-8">Rows per page</span>
          <button className="h-10 rounded-md border border-[#0d3660] px-4">10</button>
        </div>
      </div>
    </div>
  );
}

function AlertSummary({ tone, label, value, desc }: { tone: AlertTone; label: string; value: string; desc: string }) {
  const style = toneStyles[tone];
  const Icon = style.icon;

  return (
    <section className="metric-card glass rounded-lg p-5">
      <div className="metric-card-row items-start">
        <div className={`metric-icon flex shrink-0 items-center justify-center rounded-full border ${style.border} ${style.bg}`}>
          <Icon className={`h-7 w-7 ${style.text}`} />
        </div>
        <div className="metric-copy">
          <p className="metric-label font-bold text-white">{label}</p>
          <p className="metric-value mt-2 font-bold text-white">{value}</p>
          <p className="metric-desc mt-3 text-white">{desc}</p>
        </div>
      </div>
    </section>
  );
}

function AlertListRow({ alert, onClick }: { alert: AlertRow; onClick?: () => void }) {
  const style = toneStyles[alert.tone];
  const Icon = style.icon;

  return (
    <button onClick={onClick} className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-5 py-4 text-left transition hover:bg-[#071f35]/35">
      <div className="flex items-center gap-5">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${style.border} ${style.bg}`}>
          <Icon className={`h-7 w-7 ${style.text}`} />
        </div>
        <div>
          <p className="font-bold text-white">{alert.title}</p>
          <p className="mt-1 text-slate-350 text-xs">{alert.site}</p>
          <p className={`mt-1 font-bold ${style.text}`}>{alert.metric}</p>
        </div>
      </div>
      <span className={`font-semibold text-xs ${style.text}`}>{alert.time}</span>
      <div className="flex items-center gap-8">
        <span className={`rounded-md border px-3 py-1 text-sm font-bold ${style.border} ${style.text}`}>{alert.tone}</span>
        <ChevronRight className="h-5 w-5 text-white" />
      </div>
    </button>
  );
}

function AlertDetails({ alert, onBack, onAlertUpdated }: { alert: AlertRow; onBack: () => void; onAlertUpdated?: () => void }) {
  const style = toneStyles[alert.tone];
  const AlertIcon = style.icon;
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const handleAcknowledge = async () => {
    try {
      setIsAcknowledging(true);
      const session = getAuthSession();
      if (!session) return;
      
      await apiRequest(`/readings/alerts/${alert.id}/acknowledge`, {
        method: 'PUT',
        token: session.token,
      });
      
      alert.tone = 'Resolved';
      if (onAlertUpdated) onAlertUpdated();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      alert('Failed to acknowledge alert');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleResolve = async () => {
    try {
      setIsResolving(true);
      const session = getAuthSession();
      if (!session) return;
      
      await apiRequest(`/readings/alerts/${alert.id}/resolve`, {
        method: 'PUT',
        token: session.token,
      });
      
      alert.tone = 'Resolved';
      if (onAlertUpdated) onAlertUpdated();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      alert('Failed to resolve alert');
    } finally {
      setIsResolving(false);
    }
  };

  const details: Array<[string, string, LucideIcon]> = [
    ['Alert Type', alert.alertType, AlertTriangle],
    ['Severity', alert.tone, Shield],
    ['Status', alert.tone === 'Resolved' ? 'Resolved' : 'Active', Waves],
    ['Triggered At', alert.time, Clock3],
    ['Category', alert.deviceId === 'SYSTEM' ? 'Maintenance' : 'Water Quality', Folder],
    ['Description', alert.description, FileText],
  ];

  const deviceInfo: Array<[string, string, LucideIcon]> = [
    ['Device ID', alert.deviceId, Cpu],
    ['Device Type', alert.deviceType, Microscope],
    ['Site', alert.farm, MapPin],
    ['Pond', alert.pond, Waves],
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-[#071f35]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Alert Details</h2>
          <p className="mt-1 text-sm text-white">View detailed information about the alert and related device.</p>
        </div>
      </div>

      <section className={`rounded-lg border p-5 ${style.border} ${alert.tone === 'Critical' ? 'bg-red-950/25' : 'bg-[#071f35]/70'}`}>
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-5 flex-1">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full ${style.bg} ${style.text}`}>
              <AlertIcon className="h-12 w-12" />
            </div>
            <div className="flex-1">
              <p className={`font-bold ${style.text}`}><span className="mr-2 inline-block h-3 w-3 rounded-full bg-current" />{alert.tone}</p>
              <h3 className="mt-4 text-2xl font-bold text-white">{alert.title}</h3>
              <p className="mt-2 text-white">{alert.pond} <span className="mx-4">-</span> {alert.farm}</p>
              <p className={`mt-4 font-bold ${style.text}`}>{alert.metric}</p>
            </div>
          </div>
          {alert.tone !== 'Resolved' && (
            <div className="flex gap-2 flex-col">
              <button
                onClick={handleAcknowledge}
                disabled={isAcknowledging || isResolving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-400 font-semibold text-sm hover:bg-amber-500/30 disabled:opacity-50"
              >
                {isAcknowledging ? '...' : '✓ Acknowledge'}
              </button>
              <button
                onClick={handleResolve}
                disabled={isAcknowledging || isResolving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {isResolving ? '...' : '✓ Resolve'}
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 border-t border-[#0d3660]/60 pt-4 flex items-center justify-between text-sm">
          <span className="text-slate-300">Status: <span className={`font-bold ${style.text}`}>{alert.tone}</span></span>
          <span className={`text-sm font-bold ${style.text}`}>{alert.time}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1fr]">
        <section className="glass rounded-lg p-5">
          <h3 className="mb-4 text-lg font-bold text-white">Alert Details</h3>
          <InfoList items={details} />
        </section>

        <div className="space-y-4">
          <section className="glass rounded-lg p-5">
            <h3 className="mb-4 text-lg font-bold text-white">Device Information</h3>
            <InfoList items={deviceInfo} />
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoList({ items }: { items: Array<[string, string, LucideIcon]> }) {
  return (
    <div className="divide-y divide-[#0d3660]/60">
      {items.map(([label, value, Icon]) => (
        <div key={label} className="grid grid-cols-[32px_1fr_1.1fr] items-start gap-4 py-3 text-sm">
          <Icon className="h-5 w-5 text-cyan-300" />
          <span className="text-white">{label}</span>
          <span className="text-right text-white font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}
