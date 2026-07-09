import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  Bell,
  Users,
  CheckCircle,
  Phone,
  MapPin,
  FileText,
  Mail,
  User,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession, type AuthSession } from '../lib/auth';

interface TeamMember {
  name: string;
  role: string;
  status: 'Notified' | 'Pending';
  time: string;
  email?: string;
}

interface AssignedSite {
  id: number;
  name: string;
  location_text?: string | null;
  owner?: {
    name: string;
    email: string;
    phone?: string | null;
  } | null;
}

interface EmergencyIncident {
  id: number;
  site_id?: number | null;
  priority: string;
  status: string;
  description: string;
  created_at: string;
  owner_viewed_at?: string | null;
  accepted_at?: string | null;
  accepted_by_name?: string | null;
  accepted_by_email?: string | null;
  resolved_at?: string | null;
  triggered_by_name?: string | null;
  triggered_by_email?: string | null;
  site_name?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  deliveries?: NotificationDelivery[];
}

interface NotificationDelivery {
  id: number;
  channel?: string;
  recipient_email: string;
  status: string;
  sent_at?: string | null;
  error_message?: string | null;
}

type RecentReading = {
  ph?: number | null;
  temperature_c?: number | null;
  turbidity?: number | null;
  ammonia?: number | null;
  dissolved_oxygen?: number | null;
};

interface AgentOverview {
  owner?: { id?: number | string; full_name?: string; name?: string; email?: string; phone?: string | null };
  sites?: AssignedSite[];
  assigned_sites?: AssignedSite[];
  devices?: Array<{ status?: string | null }>;
  alerts?: Array<{ status?: string | null; severity?: string | null }>;
  recent_readings?: RecentReading[];
}

export default function SosEmergencyPage({ onBackToDashboard }: { onBackToDashboard?: () => void }) {
  const session = getAuthSession();
  const role = session?.user.role || 'agent';
  const canTriggerSos = role === 'agent';
  const canRespondToSos = role === 'owner' || role === 'manager';
  const [assignedSites, setAssignedSites] = useState<AssignedSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | ''>('');
  const [description, setDescription] = useState('SOS emergency triggered from agent portal.');
  const [incident, setIncident] = useState<EmergencyIncident | null>(null);
  const [emergencies, setEmergencies] = useState<EmergencyIncident[]>([]);
  const [overview, setOverview] = useState<AgentOverview | null>(null);
  const [sending, setSending] = useState(false);
  const [sosAttempted, setSosAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    async function loadSosData() {
      const session = getAuthSession();
      if (!session) {
        return;
      }

      try {
        const overviewPath = session.user.role === 'owner' ? '/owner/overview' : session.user.role === 'agent' ? '/agent/sos-context' : null;
        const [overviewRes, emergencyRes] = await Promise.all([
          overviewPath
            ? apiRequest<AgentOverview>(overviewPath, { token: session.token })
            : Promise.resolve({} as AgentOverview),
          apiRequest<EmergencyIncident[]>('/emergencies/details', { token: session.token }),
        ]);
        const sites = normalizeSitesForRole(overviewRes, session);
        setOverview(overviewRes);
        setEmergencies(emergencyRes);
        setIncident(emergencyRes[0] || null);
        setAssignedSites(sites);
        if (sites.length > 0) {
          setSelectedSiteId((current) => current || sites[0].id);
        }
      } catch (err) {
        console.error('Failed to load SOS data:', err);
      }
    }

    loadSosData();
  }, []);

  async function refreshEmergencies(preferredId?: number) {
    const session = getAuthSession();
    if (!session) return;

    const refreshed = await apiRequest<EmergencyIncident[]>('/emergencies/details', {
      token: session.token,
    });
    setEmergencies(refreshed);
    setIncident((current) => refreshed.find((item) => item.id === (preferredId || current?.id)) || refreshed[0] || null);
  }

  async function triggerSos() {
    const session = getAuthSession();
    if (!session) {
      setSosAttempted(true);
      setError('Please log in again before sending SOS.');
      return;
    }
    if (!selectedSiteId) {
      setSosAttempted(true);
      setError('SOS button pressed, but it failed because no owner site is selected.');
      return;
    }

    setSending(true);
    setSosAttempted(true);
    setError(null);
    try {
      const created = await apiRequest<EmergencyIncident>('/emergencies', {
        method: 'POST',
        token: session.token,
        body: {
          site_id: selectedSiteId || null,
          priority: 'critical',
          description: description.trim() || 'SOS emergency triggered from agent portal.',
        },
      });
      const refreshed = await apiRequest<EmergencyIncident[]>('/emergencies/details', {
        token: session.token,
      });
      setEmergencies(refreshed);
      const createdDetail = refreshed.find((item) => item.id === created.id) || created;
      setIncident(createdDetail);
      const deliveries = createdDetail.deliveries || [];
      const requiredDeliveries = deliveries.filter((delivery) => {
        const channel = String(delivery.channel || '').toLowerCase();
        const reason = String(delivery.error_message || '').toLowerCase();
        return !(channel === 'push' && reason.includes('onesignal'));
      });
      const failedDeliveries = requiredDeliveries.filter((delivery) => ['failed', 'skipped'].includes(String(delivery.status).toLowerCase()));
      if (requiredDeliveries.length === 0) {
        setError('SOS button pressed and SOS was created, but notification status was not recorded.');
      } else if (failedDeliveries.length === requiredDeliveries.length) {
        const reason = failedDeliveries[0]?.error_message ? ` Reason: ${failedDeliveries[0].error_message}` : '';
        setError(`SOS button pressed and SOS was created, but all notifications failed or were skipped.${reason}`);
      } else if (failedDeliveries.length > 0) {
        const reason = failedDeliveries[0]?.error_message ? ` Reason: ${failedDeliveries[0].error_message}` : '';
        setActionMessage(`SOS was created, but one or more notifications failed or were skipped.${reason}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send SOS emergency.';
      setError(`SOS button pressed, but it failed: ${message}`);
    } finally {
      setSending(false);
    }
  }

  async function acceptEmergency(target?: EmergencyIncident | null) {
    const session = getAuthSession();
    if (!session || !target) {
      setError('No SOS is selected to accept.');
      return;
    }

    setError(null);
    try {
      await apiRequest<EmergencyIncident>(`/emergencies/${target.id}/accept`, {
        method: 'PUT',
        token: session.token,
      });
      await refreshEmergencies(target.id);
      setActionMessage(`SOS-${target.id} accepted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept SOS.');
    }
  }

  async function resolveEmergency(target?: EmergencyIncident | null) {
    const session = getAuthSession();
    if (!session || !target) {
      setError('No SOS is selected to resolve.');
      return;
    }

    setError(null);
    try {
      await apiRequest<EmergencyIncident>(`/emergencies/${target.id}/resolve`, {
        method: 'PUT',
        token: session.token,
      });
      await refreshEmergencies(target.id);
      setActionMessage(`SOS-${target.id} resolved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resolve SOS.');
    }
  }

  const selectedSite = assignedSites.find((site) => site.id === selectedSiteId);
  const selectedSiteLabel = selectedSite ? `${selectedSite.name}${selectedSite.location_text ? ` - ${selectedSite.location_text}` : ''}` : '';
  const activatedAt = incident ? new Date(incident.created_at).toLocaleString() : 'Not triggered yet';
  const ownerDelivery = incident?.deliveries?.find((delivery) => {
    const ownerEmail = incident.owner_email || selectedSite?.owner?.email;
    return ownerEmail ? delivery.recipient_email.toLowerCase() === ownerEmail.toLowerCase() : false;
  });
  const latestStatusLabel = incident ? statusLabel(incident.status) : 'Ready';
  const viewedAtLabel = incident?.owner_viewed_at ? new Date(incident.owner_viewed_at).toLocaleString() : 'Not viewed in app';
  const notifiedTime = incident ? new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const activeAlerts = overview?.alerts?.filter((alert) => !['safe', 'resolved'].includes(String(alert.status || '').toLowerCase())) || [];
  const criticalAlerts = activeAlerts.filter((alert) => String(alert.severity || '').toLowerCase() === 'critical');
  const onlineDevices = overview?.devices?.filter((device) => String(device.status || '').toLowerCase() === 'active').length || 0;
  const totalDevices = overview?.devices?.length || 0;
  const waterQuality = calculateWaterQuality(overview?.recent_readings?.[0]);
  const systemHealth = criticalAlerts.length > 0 ? 'Critical' : activeAlerts.length > 0 ? 'Attention' : 'Good';
  const currentIncidentSiteName = incident ? incidentSiteName(incident, assignedSites) : selectedSiteLabel;
  const team: TeamMember[] = [
    {
      name: selectedSite?.owner?.name || 'Site Owner',
      role: 'Owner',
      email: selectedSite?.owner?.email || incident?.owner_email || undefined,
      status: ownerDelivery && ownerDelivery.status !== 'failed' ? 'Notified' : 'Pending',
      time: notifiedTime,
    },
    {
      name: 'Manager Team',
      role: 'Manager',
      status: incident ? 'Notified' : 'Pending',
      time: notifiedTime,
    },
  ];

  function callEmergencyContact() {
    const phone = selectedSite?.owner?.phone;
    if (!phone) {
      setActionMessage('No owner phone number is registered for the selected site.');
      return;
    }
    window.location.href = `tel:${phone}`;
    setActionMessage(`Calling owner contact ${phone}.`);
  }

  function shareLiveLocation() {
    if (!navigator.geolocation) {
      setActionMessage('Location sharing is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const mapsUrl = `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
        const recipient = selectedSite?.owner?.email || '';
        const subject = 'Aqua Pulse SOS live location';
        const body = `Live location for ${incident ? `SOS-${incident.id}` : 'SOS'}: ${mapsUrl}`;
        window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setActionMessage('Live location prepared for email sharing.');
      },
      () => setActionMessage('Unable to read current location. Check browser location permission.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function sendSystemSnapshot() {
    const snapshot = [
      `SOS: ${incident ? `SOS-${incident.id}` : 'Not triggered yet'}`,
      `Site: ${currentIncidentSiteName || 'Not selected'}`,
      `Owner: ${selectedSite?.owner?.name || 'Unknown'}`,
      `Devices Online: ${onlineDevices}/${totalDevices}`,
      `Water Quality: ${waterQuality.score} (${waterQuality.label})`,
      `Active Alerts: ${activeAlerts.length}`,
      `Critical Alerts: ${criticalAlerts.length}`,
      `System Health: ${systemHealth}`,
      `Generated At: ${new Date().toLocaleString()}`,
    ].join('\n');
    const blob = new Blob([snapshot], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aqua-pulse-sos-snapshot-${incident?.id || 'draft'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage('System snapshot downloaded.');
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-300">
      {/* Top Header controls bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-semibold text-[#06b6d4] hover:text-[#22d3ee] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-400 font-semibold">System Status: <strong className="text-emerald-400">All Systems Operational</strong></span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Emergency Summary */}
          <div className="glass rounded-xl p-5 border border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-450 uppercase tracking-wider mb-4">Emergency Summary</h3>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Status</span>
                <span className="text-red-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${incident ? 'bg-red-600 animate-ping' : 'bg-slate-600'} inline-block`} />
                  {latestStatusLabel}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Emergency ID</span>
                <span className="font-mono text-white text-xs font-semibold">{incident ? `SOS-${incident.id}` : '--'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Triggered At</span>
                <span className="text-white font-medium text-right">{activatedAt}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Triggered By</span>
                <span className="text-white font-semibold">{incident?.triggered_by_name || session?.user.name || 'Current user'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Owner Viewed</span>
                <span className="text-white font-medium text-right">{viewedAtLabel}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Accepted</span>
                <span className={`font-bold ${incident?.accepted_at ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {incident?.accepted_at ? 'Accepted' : 'Not accepted'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Owner Mail</span>
                <span className={`font-bold ${ownerDelivery?.status === 'sent' ? 'text-emerald-400' : ownerDelivery?.status === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>
                  {ownerDelivery ? statusLabel(ownerDelivery.status) : 'No delivery row'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Priority</span>
                <span className="text-xs text-red-500 font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                  CRITICAL
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Location</span>
                <span className="text-slate-400 font-medium text-right">{currentIncidentSiteName || 'Not selected'}</span>
              </div>
            </div>
          </div>

          {/* Live System Status */}
          <div className="glass rounded-xl p-5 border border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-455 uppercase tracking-wider mb-4">Live System Status</h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-450">Devices Online</span>
                <span className="text-white font-bold">{onlineDevices} / {totalDevices}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-455">Water Quality</span>
                <span className={`${waterQuality.tone} font-bold`}>{waterQuality.score} ({waterQuality.label})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-455">Active Alerts</span>
                <span className="text-amber-500 font-bold">{activeAlerts.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-455">Critical Alerts</span>
                <span className="text-red-500 font-bold">{criticalAlerts.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-455">System Health</span>
                <span className={`${systemHealth === 'Good' ? 'text-emerald-400' : systemHealth === 'Attention' ? 'text-amber-400' : 'text-red-400'} font-semibold flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${systemHealth === 'Good' ? 'bg-emerald-500' : systemHealth === 'Attention' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  {systemHealth}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column */}
        <div className="space-y-6">
          {/* Emergency Activated (SOS button and wave radar) */}
          <div className="glass rounded-xl p-5 border border-slate-800/80 flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-6">
              {incident ? 'Emergency Activated' : 'Emergency Ready'}
            </h3>
            
            {/* Pulsing SOS Button */}
            <div className="relative w-44 h-44 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full bg-red-600/10 animate-ping duration-1000" />
              <div className="absolute inset-4 rounded-full bg-red-600/15 animate-pulse duration-700" />
              <div className="absolute inset-8 rounded-full bg-red-600/20 border border-red-500/30" />
              
              {canTriggerSos ? (
                <button
                  type="button"
                  onClick={triggerSos}
                  disabled={sending}
                  className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 shadow-2xl border-4 border-red-400/30 disabled:cursor-not-allowed disabled:opacity-70"
                  title="Send SOS emergency email to owner and manager"
                >
                  <span className="text-2xl font-extrabold text-white tracking-widest animate-pulse">{sending ? '...' : 'SOS'}</span>
                </button>
              ) : (
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 shadow-2xl border-4 border-red-400/30">
                  <ShieldAlert className="h-10 w-10 text-white" />
                </div>
              )}
            </div>

            {canTriggerSos && (
            <div className="mb-4 grid w-full gap-3 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Site
                <select
                  value={selectedSiteId}
                  onChange={(event) => setSelectedSiteId(event.target.value ? Number(event.target.value) : '')}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-800 bg-[#041526] px-3 text-xs font-semibold text-white outline-none focus:border-red-400"
                >
                  <option value="">{assignedSites.length === 0 ? 'No owner sites assigned' : 'Select owner site'}</option>
                  {assignedSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}{site.location_text ? ` - ${site.location_text}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Message
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-[#041526] px-3 py-2 text-xs font-medium text-white outline-none focus:border-red-400"
                />
              </label>
            </div>
            )}

            {canRespondToSos && incident && (
              <div className="mb-4 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => acceptEmergency(incident)}
                  disabled={Boolean(incident.accepted_at)}
                  className="h-10 rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {incident.accepted_at ? 'Accepted' : 'Accept SOS'}
                </button>
                <button
                  type="button"
                  onClick={() => resolveEmergency(incident)}
                  disabled={incident.status === 'resolved'}
                  className="h-10 rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-xs font-bold text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {incident.status === 'resolved' ? 'Resolved' : 'Resolve SOS'}
                </button>
              </div>
            )}

            {/* Alert Sent notification box */}
            <div className={`w-full p-4 rounded-xl border text-left flex items-start gap-3 ${error ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 shrink-0">
                <Bell className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-red-400">
                  {error ? (sosAttempted ? 'SOS Button Pressed - Failed' : 'Emergency Alert Failed') : incident ? 'Emergency Alert Sent' : 'Press SOS To Notify'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {error || (incident
                    ? `${ownerDelivery ? `Owner mail ${ownerDelivery.status}. ` : ''}${incident.owner_viewed_at ? 'Owner viewed this SOS in app.' : 'Waiting for owner app view.'}`
                    : canTriggerSos ? 'Owner and manager will be notified by email for this SOS.' : 'Open SOS incidents appear here for owner response.')}
                </div>
              </div>
            </div>
          </div>

          {/* What Happens Next? flowchart */}
          <div className="glass rounded-xl p-5 border border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-4">What Happens Next?</h3>
            <div className="relative flex items-center justify-between mt-6 px-4">
              {/* Dotted connector line */}
              <div className="absolute top-4 left-10 right-10 border-t border-dashed border-slate-700/60 z-0" />
              
              {[
                { step: '1', label: 'Alert Sent', icon: Bell, active: Boolean(incident) },
                { step: '2', label: 'Owner Viewed', icon: Users, active: Boolean(incident?.owner_viewed_at) },
                { step: '3', label: 'Accepted', icon: CheckCircle, active: Boolean(incident?.accepted_at) },
              ].map((flow) => {
                const FlowIcon = flow.icon;
                return (
                  <div key={flow.step} className="flex flex-col items-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      flow.active
                        ? 'bg-[#06b6d4]/10 border-[#06b6d4] text-[#22d3ee] shadow-[0_0_10px_#06b6d430]'
                        : 'bg-[#041526] border-slate-700 text-slate-500'
                    }`}>
                      <FlowIcon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold mt-2.5 ${flow.active ? 'text-white' : 'text-slate-500'}`}>
                      {flow.step}. {flow.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Notified */}
          <div className="glass rounded-xl p-5 border border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-450 uppercase tracking-wider mb-4">Team Notified</h3>
            <div className="space-y-3.5">
              {team.map((member) => (
                <div key={member.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-850/20">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-red-500/10 text-[10px] font-extrabold text-red-200">
                    {member.role.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{member.name}</div>
                    <div className="text-[10px] text-slate-550 mt-0.5 truncate">{member.email || member.role}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      member.status === 'Notified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-450'
                    }`}>
                      {member.status}
                    </span>
                    <div className="text-[8px] text-slate-500 mt-1">{member.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-xl p-5 border border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-450 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Call Emergency Contact', icon: Phone, onClick: callEmergencyContact },
                { label: 'Share Live Location', icon: MapPin, onClick: shareLiveLocation },
                { label: 'Send System Snapshot', icon: FileText, onClick: sendSystemSnapshot },
                ...(canRespondToSos && incident ? [
                  { label: incident.accepted_at ? 'SOS Already Accepted' : 'Accept Current SOS', icon: CheckCircle, onClick: () => acceptEmergency(incident) },
                ] : []),
              ].map((act, i) => {
                const ActIcon = act.icon;
                return (
                  <button
                    key={i}
                    onClick={act.onClick}
                    className="w-full h-10 px-4 flex items-center justify-between rounded-lg border border-slate-800 hover:border-slate-700 bg-[#041526]/50 text-xs font-semibold text-slate-300 hover:text-white transition-all text-left"
                  >
                    <span className="flex items-center gap-2.5">
                      <ActIcon className="w-4 h-4 text-[#06b6d4]" />
                      <span>{act.label}</span>
                    </span>
                    <span aria-hidden="true">-&gt;</span>
                  </button>
                );
              })}
            </div>
            {actionMessage && (
              <p className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-semibold text-cyan-100">
                {actionMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5 border border-slate-800/80">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-450 uppercase tracking-wider">SOS Sent History</h3>
          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
            {emergencies.length} SOS created
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left text-xs">
            <thead className="text-slate-500">
              <tr className="border-b border-slate-800">
                <th className="py-2 pr-3">SOS</th>
                <th className="py-2 pr-3">Site</th>
                <th className="py-2 pr-3">Mail Notification</th>
                <th className="py-2 pr-3">Owner Viewed</th>
                <th className="py-2 pr-3">Accepted</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Actions</th>
                <th className="py-2 pr-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {emergencies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">No SOS emergencies sent yet.</td>
                </tr>
              ) : emergencies.map((item) => (
                <tr key={item.id} className="border-b border-slate-800/70 text-slate-300">
                  <td className="py-3 pr-3 font-mono font-bold text-white">SOS-{item.id}</td>
                  <td className="py-3 pr-3">{incidentSiteName(item, assignedSites)}</td>
                  <td className="py-3 pr-3">
                    <DeliverySummary deliveries={item.deliveries || []} ownerEmail={item.owner_email || selectedSite?.owner?.email} />
                  </td>
                  <td className="py-3 pr-3">
                    <StatusPill
                      tone={item.owner_viewed_at ? 'good' : 'warn'}
                      label={item.owner_viewed_at ? `Viewed ${new Date(item.owner_viewed_at).toLocaleString()}` : 'Not viewed in app'}
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <StatusPill
                      tone={item.accepted_at ? 'good' : 'warn'}
                      label={item.accepted_at ? `Accepted by ${item.accepted_by_name || item.accepted_by_email || 'responder'}` : 'Pending acceptance'}
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <StatusPill tone={item.status === 'resolved' ? 'good' : item.status === 'accepted' ? 'info' : 'danger'} label={statusLabel(item.status)} />
                  </td>
                  <td className="py-3 pr-3">
                    {canRespondToSos ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => acceptEmergency(item)}
                          disabled={Boolean(item.accepted_at)}
                          className="rounded-md border border-emerald-400/30 px-2 py-1 text-[10px] font-bold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveEmergency(item)}
                          disabled={item.status === 'resolved'}
                          className="rounded-md border border-cyan-300/30 px-2 py-1 text-[10px] font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500">Tracking only</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Emergency Timeline */}
      <div className="glass rounded-xl p-5 border border-slate-800/80">
        <h3 className="text-sm font-bold text-slate-450 uppercase tracking-wider mb-4">Emergency Timeline</h3>
        <div className="space-y-4 text-xs font-medium text-slate-350 relative pl-4 border-l border-slate-800 ml-2">
          {[
            { time: incident ? new Date(incident.created_at).toLocaleTimeString() : '--:--:--', desc: 'SOS Emergency triggered by current agent', icon: ShieldAlert, active: Boolean(incident) },
            { time: incident ? new Date(incident.created_at).toLocaleTimeString() : '--:--:--', desc: 'Emergency alert sent to owner and manager', icon: Bell, active: Boolean(incident) },
            { time: ownerDelivery?.sent_at ? new Date(ownerDelivery.sent_at).toLocaleTimeString() : '--:--:--', desc: `Owner mail ${ownerDelivery ? statusLabel(ownerDelivery.status).toLowerCase() : 'not recorded'}`, icon: Mail, active: Boolean(ownerDelivery) },
            { time: incident?.owner_viewed_at ? new Date(incident.owner_viewed_at).toLocaleTimeString() : '--:--:--', desc: 'Owner viewed SOS in app', icon: User, active: Boolean(incident?.owner_viewed_at) },
            { time: incident?.accepted_at ? new Date(incident.accepted_at).toLocaleTimeString() : '--:--:--', desc: 'Owner or manager accepted SOS', icon: CheckCircle, active: Boolean(incident?.accepted_at) },
          ].map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <div key={idx} className="relative flex items-center justify-between">
                {/* Timeline node dot */}
                <div className={`absolute -left-[20.5px] w-2.5 h-2.5 rounded-full border ${
                  item.active ? 'bg-red-500 border-red-300 shadow-[0_0_5px_#ef4444]' : 'bg-slate-850 border-slate-700'
                }`} />
                <div className="flex items-center gap-3">
                  <ItemIcon className={`w-4 h-4 ${item.active ? 'text-red-400' : 'text-slate-600'}`} />
                  <span className={item.active ? 'text-white' : 'text-slate-500'}>{item.desc}</span>
                </div>
                <span className="text-slate-500 text-[10px] font-bold">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function normalizeSitesForRole(overview: AgentOverview, session: AuthSession): AssignedSite[] {
  if (session.user.role === 'agent') {
    return overview.assigned_sites || [];
  }

  const owner = overview.owner;
  return (overview.sites || []).map((site) => ({
    ...site,
    owner: site.owner || {
      name: owner?.full_name || owner?.name || session.user.name,
      email: owner?.email || session.user.email,
      phone: owner?.phone || null,
    },
  }));
}

function statusLabel(status: string) {
  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ') || 'Unknown';
}

function incidentSiteName(incident: EmergencyIncident, sites: AssignedSite[]) {
  if (incident.site_name) {
    return incident.site_name;
  }

  const matchingSite = sites.find((site) => site.id === incident.site_id);
  if (matchingSite) {
    return `${matchingSite.name}${matchingSite.location_text ? ` - ${matchingSite.location_text}` : ''}`;
  }

  return 'No site recorded';
}

function StatusPill({ label, tone }: { label: string; tone: 'good' | 'warn' | 'danger' | 'info' }) {
  const toneClass = {
    good: 'bg-emerald-500/10 text-emerald-300',
    warn: 'bg-amber-500/10 text-amber-300',
    danger: 'bg-red-500/10 text-red-300',
    info: 'bg-cyan-300/10 text-cyan-100',
  }[tone];

  return (
    <span className={`inline-flex max-w-[220px] rounded-full px-2 py-1 text-[10px] font-bold ${toneClass}`}>
      <span className="truncate">{label}</span>
    </span>
  );
}

function DeliverySummary({ deliveries, ownerEmail }: { deliveries: NotificationDelivery[]; ownerEmail?: string | null }) {
  if (deliveries.length === 0) {
    return <StatusPill tone="warn" label="No delivery rows" />;
  }

  const ownerDelivery = ownerEmail
    ? deliveries.find((delivery) => delivery.recipient_email.toLowerCase() === ownerEmail.toLowerCase())
    : undefined;
  const primary = ownerDelivery || deliveries[0];
  const tone = primary.status === 'sent' ? 'good' : primary.status === 'failed' ? 'danger' : 'warn';
  const label = `${ownerDelivery ? 'Owner mail' : primary.recipient_email}: ${statusLabel(primary.status)}`;

  return (
    <div className="flex flex-col gap-1">
      <StatusPill tone={tone} label={label} />
      {primary.error_message && (
        <span className="max-w-[260px] truncate text-[10px] font-semibold text-red-300" title={primary.error_message}>
          {primary.error_message}
        </span>
      )}
      {deliveries.length > 1 && (
        <span className="text-[10px] font-semibold text-slate-500">{deliveries.length} recipients recorded</span>
      )}
    </div>
  );
}

function calculateWaterQuality(reading?: RecentReading) {
  if (!reading) {
    return { score: 0, label: 'No Data', tone: 'text-slate-400' };
  }

  let score = 100;
  if (reading.ph != null && (reading.ph < 6.5 || reading.ph > 8.5)) score -= 20;
  if (reading.temperature_c != null && (reading.temperature_c < 20 || reading.temperature_c > 32)) score -= 15;
  if (reading.turbidity != null && reading.turbidity > 80) score -= 15;
  if (reading.ammonia != null && reading.ammonia > 0.5) score -= 25;
  if (reading.dissolved_oxygen != null && reading.dissolved_oxygen < 5) score -= 25;

  const boundedScore = Math.max(0, Math.min(100, score));
  if (boundedScore >= 80) return { score: boundedScore, label: 'Good', tone: 'text-emerald-400' };
  if (boundedScore >= 55) return { score: boundedScore, label: 'Fair', tone: 'text-amber-400' };
  return { score: boundedScore, label: 'Poor', tone: 'text-red-400' };
}
