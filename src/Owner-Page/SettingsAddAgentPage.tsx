import { useState } from 'react';
import { ArrowLeft, BadgePlus, ChevronDown, Mail, MapPin, Phone, Thermometer, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  agentId: '',
  site: '',
  device: '',
};

export default function SettingsAddAgentPage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
  };

  const submitAgent = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.site || !form.device) {
      setMessage('Enter agent details, select a site, and assign a device before adding the agent.');
      return;
    }

    setMessage(`${form.name.trim()} has been added and assigned successfully.`);
    setForm(initialForm);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-5">
        <button
          onClick={onBack}
          className="flex h-12 w-12 items-center justify-center rounded-lg text-slate-200 transition hover:bg-[#071f35] hover:text-cyan-300"
          aria-label="Back"
        >
          <ArrowLeft className="h-7 w-7" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Add Agent</h1>
          <p className="mt-2 text-slate-300">Add new agent to your team.</p>
        </div>
      </div>

      <FormPanel title="Agent Details">
        <div className="grid grid-cols-1 gap-x-8 gap-y-7 xl:grid-cols-2">
          <Field icon={UserRound} label="Full Name" required value={form.name} onChange={(value) => updateField('name', value)} placeholder="Enter full name" />
          <Field icon={Phone} label="Phone Number" required value={form.phone} onChange={(value) => updateField('phone', value)} placeholder="Enter phone number" />
          <Field icon={Mail} label="Email Address" required value={form.email} onChange={(value) => updateField('email', value)} placeholder="Enter email address" />
          <Field icon={BadgePlus} label="Agent ID (Optional)" value={form.agentId} onChange={(value) => updateField('agentId', value)} placeholder="Enter agent ID" />
        </div>
      </FormPanel>

      <FormPanel title="Assign Site">
        <SelectLike icon={MapPin} label="Select Site" required value={form.site} onChange={(value) => updateField('site', value)} options={['North Farm', 'Blue Farm', 'Central Farmhouse', 'Sunrise Aqua Park']} placeholder="Select a site" />
      </FormPanel>

      <FormPanel title="Assign Device">
        <SelectLike icon={Thermometer} label="Select Device" required value={form.device} onChange={(value) => updateField('device', value)} options={['DVC-001 - Aquasense Pro', 'DVC-003 - Water Quality Monitor', 'DVC-007 - pH Sensor']} placeholder="Select a device" />
        <p className="mt-5 text-sm text-slate-300">You can assign multiple devices after creating the agent.</p>
      </FormPanel>

      {message && <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <button onClick={onBack} className="h-16 rounded-lg border border-slate-500/70 text-base font-bold text-white transition hover:bg-[#071f35]">
          Cancel
        </button>
        <button onClick={submitAgent} className="h-16 rounded-lg bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-700 text-base font-bold text-white shadow-[0_16px_45px_rgba(14,165,233,0.25)] transition hover:brightness-110">
          Add Agent
        </button>
      </div>
    </div>
  );
}

function FormPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#0d3660] bg-[#041526]/72 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <h2 className="mb-7 text-sm font-extrabold uppercase tracking-wide text-cyan-300">{title}</h2>
      {children}
    </section>
  );
}

function Field({ icon: Icon, label, required, value, onChange, placeholder }: { icon: LucideIcon; label: string; required?: boolean; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-base font-semibold text-white">{label} {required && <span className="text-red-400">*</span>}</span>
      <div className="relative mt-3">
        <Icon className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-16 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/50 pl-16 pr-5 text-base text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300" />
      </div>
    </label>
  );
}

function SelectLike({ icon: Icon, label, required, value, onChange, options, placeholder }: { icon: LucideIcon; label: string; required?: boolean; value: string; onChange: (value: string) => void; options: string[]; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-base font-semibold text-white">{label} {required && <span className="text-red-400">*</span>}</span>
      <div className="relative mt-3">
        <Icon className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-16 w-full appearance-none rounded-lg border border-[#0d3660] bg-[#020b18]/50 pl-16 pr-12 text-base text-white outline-none transition focus:border-cyan-300">
          <option value="">{placeholder}</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-200" />
      </div>
    </label>
  );
}
