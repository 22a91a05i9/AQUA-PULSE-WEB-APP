import { useEffect, useState } from 'react';
import { ChevronDown, Cpu, MapPin, Settings, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { DialogButton, ProjectDialog } from '../lib/projectDialog';

const initialAssignments = {
  deviceId: '',
  deviceSiteId: '',
  agentSiteId: '',
  agentUserId: '',
};

export default function AssignmentsPage() {
  const [form, setForm] = useState(initialAssignments);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [agentAssignments, setAgentAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeviceMove, setPendingDeviceMove] = useState<{
    device: any;
    currentSite: any | null;
    nextSite: any;
  } | null>(null);

  const assignedAgentIdsForSite = form.agentSiteId
    ? new Set(
        agentAssignments
          .filter((assignment) => String(assignment.site_id) === form.agentSiteId)
          .map((assignment) => Number(assignment.agent_user_id)),
      )
    : new Set<number>();
  const availableAgentsForSelectedSite = form.agentSiteId
    ? agents.filter((agent) => !assignedAgentIdsForSite.has(Number(agent.id)))
    : agents;

  async function loadData() {
    try {
      const session = getAuthSession();
      if (!session) return;

      const res = await apiRequest<any>('/owner/overview', {
        token: session.token,
      });

      setDevices(res.devices || []);
      setSites(res.sites || []);
      setAgents(res.agents || []);
      setAgentAssignments(res.agent_assignments || []);
    } catch (err) {
      console.error('Failed to load assignments overview data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
    setErrorMsg('');
  };

  const performAssignDevice = async () => {
    if (!form.deviceId || !form.deviceSiteId) {
      setErrorMsg('Select a device and site before assigning.');
      return;
    }

    try {
      const session = getAuthSession();
      if (!session) return;

      await apiRequest(`/owner/devices/${form.deviceId}/assign-site`, {
        method: 'POST',
        token: session.token,
        body: {
          site_id: Number(form.deviceSiteId),
        },
      });

      const dev = devices.find(d => String(d.id) === form.deviceId);
      const site = sites.find(s => String(s.id) === form.deviceSiteId);
      setMessage(`Device "${dev?.device_uid || form.deviceId}" assigned to site "${site?.name || form.deviceSiteId}" successfully.`);
      setErrorMsg('');
      setForm(prev => ({ ...prev, deviceId: '', deviceSiteId: '' }));
      loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to assign device.');
    }
  };

  const assignDevice = async () => {
    if (!form.deviceId || !form.deviceSiteId) {
      setErrorMsg('Select a device and site before assigning.');
      return;
    }

    const dev = devices.find(d => String(d.id) === form.deviceId);
    const nextSite = sites.find(s => String(s.id) === form.deviceSiteId);
    const currentSiteId = dev?.site_id == null ? '' : String(dev.site_id);
    const nextSiteId = String(form.deviceSiteId);

    if (dev && nextSite && currentSiteId && currentSiteId !== nextSiteId) {
      const currentSite = sites.find(s => String(s.id) === currentSiteId) || null;
      setPendingDeviceMove({ device: dev, currentSite, nextSite });
      return;
    }

    if (dev && currentSiteId === nextSiteId) {
      setErrorMsg(`Device "${dev.device_uid || dev.id}" is already assigned to this site.`);
      return;
    }

    await performAssignDevice();
  };

  const assignAgent = async () => {
    if (!form.agentSiteId || !form.agentUserId) {
      setErrorMsg('Select a site and agent before assigning.');
      return;
    }

    try {
      const session = getAuthSession();
      if (!session) return;

      await apiRequest(`/owner/sites/${form.agentSiteId}/assign-agent`, {
        method: 'POST',
        token: session.token,
        body: {
          agent_user_id: Number(form.agentUserId),
        },
      });

      const agent = agents.find(a => String(a.id) === form.agentUserId);
      const site = sites.find(s => String(s.id) === form.agentSiteId);
      setMessage(`Agent "${agent?.full_name || form.agentUserId}" assigned to site "${site?.name || form.agentSiteId}" successfully.`);
      setErrorMsg('');
      setForm(prev => ({ ...prev, agentSiteId: '', agentUserId: '' }));
      loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to assign agent.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <AssignmentPanel title="Assign Device To Site">
        <SelectLike
          icon={Cpu}
          label="Device"
          value={form.deviceId}
          onChange={(value) => updateField('deviceId', value)}
          options={devices.map(d => ({ value: String(d.id), label: `${d.device_uid} (${d.status})` }))}
          placeholder="Select device"
        />
        <SelectLike
          icon={Settings}
          label="Site"
          value={form.deviceSiteId}
          onChange={(value) => updateField('deviceSiteId', value)}
          options={sites.map(s => ({ value: String(s.id), label: s.name }))}
          placeholder="Select site"
        />
        <button
          onClick={assignDevice}
          className="mt-8 h-16 w-full rounded-lg bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-700 text-base font-bold text-white shadow-[0_16px_45px_rgba(14,165,233,0.24)] transition hover:brightness-110"
        >
          Assign Device
        </button>
      </AssignmentPanel>

      <AssignmentPanel title="Assign Agent To Site">
        <SelectLike
          icon={MapPin}
          label="Site"
          value={form.agentSiteId}
          onChange={(value) => {
            setForm((current) => ({ ...current, agentSiteId: value, agentUserId: '' }));
            setMessage('');
            setErrorMsg('');
          }}
          options={sites.map(s => ({ value: String(s.id), label: s.name }))}
          placeholder="Select site"
        />
        <SelectLike
          icon={UserRound}
          label="Agent"
          value={form.agentUserId}
          onChange={(value) => updateField('agentUserId', value)}
          options={availableAgentsForSelectedSite.map(a => ({ value: String(a.id), label: `${a.full_name} (${a.email})` }))}
          placeholder={form.agentSiteId ? 'Select agent' : 'Select site first'}
        />
        {form.agentSiteId && availableAgentsForSelectedSite.length === 0 && (
          <p className="-mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            All agents are already assigned to this site.
          </p>
        )}
        <button
          onClick={assignAgent}
          className="mt-8 h-16 w-full rounded-lg bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-700 text-base font-bold text-white shadow-[0_16px_45px_rgba(14,165,233,0.24)] transition hover:brightness-110"
        >
          Assign Agent
        </button>
      </AssignmentPanel>

      {message && <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}
      {errorMsg && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorMsg}</p>}
      {pendingDeviceMove && (
        <ProjectDialog
          title="Change Device Site?"
          description={`Device "${pendingDeviceMove.device.device_uid || pendingDeviceMove.device.id}" is already assigned to "${pendingDeviceMove.currentSite?.name || `Site #${pendingDeviceMove.device.site_id}`}". Do you want to move it to "${pendingDeviceMove.nextSite.name}"?`}
          onClose={() => setPendingDeviceMove(null)}
          footer={
            <>
              <DialogButton onClick={() => setPendingDeviceMove(null)}>Cancel</DialogButton>
              <DialogButton
                tone="primary"
                onClick={async () => {
                  setPendingDeviceMove(null);
                  await performAssignDevice();
                }}
              >
                Confirm Change
              </DialogButton>
            </>
          }
        />
      )}
    </div>
  );
}

function AssignmentPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#0d3660] bg-[#041526]/72 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <h2 className="text-2xl font-extrabold text-white">{title}</h2>
      <div className="mt-7 space-y-7">{children}</div>
    </section>
  );
}

function SelectLike({
  icon: Icon,
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-base font-semibold text-white">{label}</span>
      <div className="relative mt-3">
        <Icon className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-16 w-full appearance-none rounded-lg border border-[#0d3660] bg-[#020b18]/50 pl-16 pr-12 text-base text-white outline-none transition focus:border-cyan-300"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-200" />
      </div>
    </label>
  );
}
