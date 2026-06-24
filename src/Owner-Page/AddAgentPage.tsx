import { useState } from 'react';
import { BadgePlus, BarChart3, ChevronDown, Mail, Phone, UserPlus, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  role: 'Agent',
  reportingTo: '',
  division: '',
  region: '',
  status: 'Active',
  sites: '',
};

export default function AddAgentPage({ onBack: _onBack }: { onBack: () => void }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
  };

  const submitAgent = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.reportingTo) {
      setMessage('Enter agent details and reporting information before creating the agent.');
      return;
    }

    setMessage(`${form.name.trim()} has been created successfully.`);
    setForm(initialForm);
  };

  return (
    <div className="animate-fade-in">
      <section className="glass rounded-lg p-5">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full border border-[#0d3660] bg-cyan-400/5">
            <UserPlus className="h-12 w-12 text-cyan-300" />
          </div>
          <h2 className="text-xl font-bold text-white">Add New Agent</h2>
          <p className="mt-2 text-sm text-slate-300">Fill in the details below to create a new agent.</p>
        </div>

        <FormPanel number="1" title="Basic Information">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 xl:grid-cols-2">
            <Field
              icon={UserRound}
              label="Full Name"
              required
              value={form.name}
              onChange={(value) => updateField('name', value)}
              placeholder="Enter agent name"
            />
            <Field
              icon={Phone}
              label="Phone"
              required
              value={form.phone}
              onChange={(value) => updateField('phone', value)}
              placeholder="Enter phone number"
            />
            <Field
              icon={Mail}
              label="Email"
              required
              value={form.email}
              onChange={(value) => updateField('email', value)}
              placeholder="agent@example.com"
            />
          </div>
        </FormPanel>

        <FormPanel number="2" title="Address">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 xl:grid-cols-2">
            <SelectLike
              icon={UserRound}
              label="Role"
              required
              value={form.role}
              onChange={(value) => updateField('role', value)}
              options={['Agent', 'Senior Agent', 'Field Lead']}
              placeholder="Agent"
            />
            <SelectLike
              icon={BarChart3}
              label="Reporting To"
              required
              value={form.reportingTo}
              onChange={(value) => updateField('reportingTo', value)}
              options={['Rahul Verma', 'Operations Manager', 'Regional Head']}
              placeholder="Select reporting type"
            />
          </div>
        </FormPanel>

        <FormPanel number="3" title="Access">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 xl:grid-cols-2">
            <SelectLike
              icon={BadgePlus}
              label="Division"
              value={form.division}
              onChange={(value) => updateField('division', value)}
              options={['South India', 'North Division', 'East Coast']}
              placeholder="Select division"
            />
            <SelectLike
              icon={BadgePlus}
              label="Region"
              value={form.region}
              onChange={(value) => updateField('region', value)}
              options={['Andhra Pradesh', 'Tamil Nadu', 'Odisha']}
              placeholder="Select region"
            />
          </div>
        </FormPanel>

        <FormPanel number="4" title="Status">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 xl:grid-cols-2">
            <SelectLike
              icon={UserRound}
              label="Status"
              required
              value={form.status}
              onChange={(value) => updateField('status', value)}
              options={['Active', 'Pending', 'Inactive']}
              placeholder="Active"
              accentDot
            />
            <SelectLike
              icon={BadgePlus}
              label="Assign Sites (Optional)"
              value={form.sites}
              onChange={(value) => updateField('sites', value)}
              options={['Green Valley Farm', 'Blue Lake Aquafarms', 'Sunrise Aqua Park']}
              placeholder="Select sites"
            />
          </div>
        </FormPanel>

        {message && <p className="mb-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}

        <button
          onClick={submitAgent}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-700 text-base font-bold text-white shadow-[0_16px_45px_rgba(14,165,233,0.25)] transition hover:brightness-110"
        >
          <UserPlus className="h-5 w-5" />
          Create Agent
        </button>
      </section>
    </div>
  );
}

function FormPanel({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-lg border border-[#0d3660] bg-[#041526]/45 p-4">
      <h3 className="mb-4 flex items-center gap-3 text-sm font-bold text-white">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300 text-xs text-cyan-300">{number}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/* old form shape intentionally replaced by screenshot-matching sections */

function Field({
  icon: Icon,
  label,
  required,
  value,
  onChange,
  placeholder,
}: {
  icon: LucideIcon;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-white">{label} {required && <span className="text-red-400">*</span>}</span>
      <div className="relative mt-2">
        <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300"
        />
      </div>
    </label>
  );
}

function SelectLike({
  icon: Icon,
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
  accentDot,
}: {
  icon: LucideIcon;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  accentDot?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-white">{label} {required && <span className="text-red-400">*</span>}</span>
      <div className="relative mt-2">
        {accentDot ? <span className="absolute left-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-emerald-500" /> : <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-md border border-[#0d3660] bg-[#020b18]/50 pl-12 pr-12 text-sm text-white outline-none transition focus:border-cyan-300"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-200" />
      </div>
    </label>
  );
}
