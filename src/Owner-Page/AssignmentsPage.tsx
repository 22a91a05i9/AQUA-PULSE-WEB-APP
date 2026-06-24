import { useState } from 'react';
import { ChevronDown, Cpu, MapPin, Settings, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const initialAssignments = {
  device: '',
  deviceSite: '',
  agentSite: '',
  agent: '',
};

export default function AssignmentsPage() {
  const [form, setForm] = useState(initialAssignments);
  const [message, setMessage] = useState('');

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
  };

  const assignDevice = () => {
    if (!form.device || !form.deviceSite) {
      setMessage('Select a device and site before assigning the device.');
      return;
    }

    setMessage(`${form.device} assigned to ${form.deviceSite}.`);
  };

  const assignAgent = () => {
    if (!form.agentSite || !form.agent) {
      setMessage('Select a site and agent before assigning the agent.');
      return;
    }

    setMessage(`${form.agent} assigned to ${form.agentSite}.`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AssignmentPanel title="Assign Device To Site">
        <SelectLike
          icon={Cpu}
          label="Device"
          value={form.device}
          onChange={(value) => updateField('device', value)}
          options={['DVC-001 - Aquasense Pro', 'DVC-003 - Water Quality Monitor', 'DVC-007 - pH Sensor']}
          placeholder="Select device"
        />
        <SelectLike
          icon={Settings}
          label="Site"
          value={form.deviceSite}
          onChange={(value) => updateField('deviceSite', value)}
          options={['North Farm', 'Blue Farm', 'Central Farmhouse', 'Sunrise Aqua Park']}
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
          value={form.agentSite}
          onChange={(value) => updateField('agentSite', value)}
          options={['North Farm', 'Blue Farm', 'Central Farmhouse', 'Sunrise Aqua Park']}
          placeholder="Select site"
        />
        <SelectLike
          icon={UserRound}
          label="Agent"
          value={form.agent}
          onChange={(value) => updateField('agent', value)}
          options={['Agent-001', 'Agent-003', 'Agent-006', 'Agent-008']}
          placeholder="Select agent"
        />
        <button
          onClick={assignAgent}
          className="mt-8 h-16 w-full rounded-lg bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-700 text-base font-bold text-white shadow-[0_16px_45px_rgba(14,165,233,0.24)] transition hover:brightness-110"
        >
          Assign Agent
        </button>
      </AssignmentPanel>

      {message && <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}
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
  options: string[];
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
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-200" />
      </div>
    </label>
  );
}
