import { useEffect, useState } from 'react';
import { Mail, Phone, UserPlus, UserRound, KeyRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { isAllowedPassword, PASSWORD_POLICY_MESSAGE } from '../lib/passwordPolicy';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  password: '',
};

const phoneErrorMessage = 'Please enter a valid 10-digit phone number.';

export default function AddAgentPage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [existingAgents, setExistingAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMeta() {
    try {
      const session = getAuthSession();
      if (!session) return;

      const [agentsRes] = await Promise.all([
        apiRequest<any[]>('/owner/agents', { token: session.token }),
      ]);

      setExistingAgents(agentsRes);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeta();
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    const nextValue = field === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    setMessage('');
    setErrorMsg('');
  };

  const submitAgent = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.password.trim()) {
      setErrorMsg('Please enter all required fields.');
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setErrorMsg(phoneErrorMessage);
      return;
    }
    if (!isAllowedPassword(form.password)) {
      setErrorMsg(PASSWORD_POLICY_MESSAGE);
      return;
    }
    const email = form.email.trim();
    if (email !== email.toLowerCase()) {
      setErrorMsg('Email must be lowercase.');
      return;
    }
    if (existingAgents.some((agent) => String(agent.email || '').trim().toLowerCase() === email)) {
      setErrorMsg('Email already exists.');
      return;
    }

    try {
      const session = getAuthSession();
      if (!session) return;

      await apiRequest('/owner/agents', {
        method: 'POST',
        token: session.token,
        body: {
          full_name: form.name.trim(),
          email,
          phone: form.phone.trim(),
          password: form.password.trim(),
        },
      });

      setMessage(`Agent "${form.name.trim()}" has been created successfully.`);
      setErrorMsg('');
      setForm(initialForm);
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message === 'Phone number already exists.' ? 'Phone number already exists.' : err.message || 'Failed to create agent.');
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
    <div className="animate-fade-in text-left max-w-4xl mx-auto">
      <button 
        onClick={onBack}
        className="mb-4 text-sm font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
      >
        &larr; Back to Agents
      </button>

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
              inputMode="numeric"
              maxLength={10}
            />
            <Field
              icon={Mail}
              label="Email"
              required
              value={form.email}
              onChange={(value) => updateField('email', value)}
              placeholder="agent@example.com"
            />
            <Field
              icon={KeyRound}
              label="Password"
              required
              value={form.password}
              onChange={(value) => updateField('password', value)}
              placeholder="12345678 or Aqua@123"
            />
          </div>
        </FormPanel>

        {message && <p className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}
        {errorMsg && <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorMsg}</p>}

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

function Field({
  icon: Icon,
  label,
  required,
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
}: {
  icon: LucideIcon;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
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
          inputMode={inputMode}
          maxLength={maxLength}
          className="h-11 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300"
        />
      </div>
    </label>
  );
}
