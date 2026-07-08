import { useEffect, useState } from 'react';
import { ArrowLeft, BadgePlus, ChevronDown, Mail, MapPin, Phone, Thermometer, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { isAllowedPassword, PASSWORD_POLICY_MESSAGE } from '../lib/passwordPolicy';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  password: '12345678',
  siteId: '',
  deviceId: '',
};

const phoneErrorMessage = 'Please enter a valid 10-digit phone number.';

export default function SettingsAddAgentPage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const session = getAuthSession();
        if (session) {
          const res = await apiRequest<any>('/owner/overview', {
            token: session.token,
          });
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load owner overview for Add Agent:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: field === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value }));
    setMessage(null);
  };

  const submitAgent = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.siteId || !form.deviceId) {
      setMessage({ text: 'Enter agent details, select a site, and assign a device before adding the agent.', type: 'error' });
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setMessage({ text: phoneErrorMessage, type: 'error' });
      return;
    }
    if (!isAllowedPassword(form.password)) {
      setMessage({ text: PASSWORD_POLICY_MESSAGE, type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const session = getAuthSession();
      if (!session) return;

      const selectedSite = (data?.sites || []).find((s: any) => s.id === Number(form.siteId));
      if (!selectedSite) {
        throw new Error('Selected site not found');
      }

      // 1. Create Agent
      const agent = await apiRequest<any>('/owner/agents', {
        method: 'POST',
        token: session.token,
        body: {
          full_name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          farm_type_id: selectedSite.farm_type_id,
          species_id: selectedSite.species_id,
        },
      });

      // 2. Assign Agent to Site
      await apiRequest<any>(`/owner/sites/${form.siteId}/assign-agent`, {
        method: 'POST',
        token: session.token,
        body: {
          agent_user_id: agent.id,
        },
      });

      // 3. Assign Device to Site
      await apiRequest<any>(`/owner/devices/${form.deviceId}/assign-site`, {
        method: 'POST',
        token: session.token,
        body: {
          site_id: Number(form.siteId),
        },
      });

      setMessage({
        text: `Agent "${form.name.trim()}" created and assigned to Site "${selectedSite.name}" successfully! (Temporary Password: ${form.password})`,
        type: 'success',
      });
      setForm(initialForm);
    } catch (err: any) {
      console.error('Failed to create and assign agent:', err);
      setMessage({ text: err?.detail || err?.message || 'Failed to add and assign agent.', type: 'error' });
    } finally {
      setSubmitting(false);
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
          <Field icon={Phone} label="Phone Number" required value={form.phone} onChange={(value) => updateField('phone', value)} placeholder="Enter phone number" inputMode="numeric" maxLength={10} />
          <Field icon={Mail} label="Email Address" required value={form.email} onChange={(value) => updateField('email', value)} placeholder="Enter email address" />
          <Field icon={BadgePlus} label="Agent temporary Password" required value={form.password} onChange={(value) => updateField('password', value)} placeholder="Enter agent password" />
        </div>
      </FormPanel>

      <FormPanel title="Assign Site">
        <label className="block">
          <span className="text-base font-semibold text-white">Select Site <span className="text-red-400">*</span></span>
          <div className="relative mt-3">
            <MapPin className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
            <select
              value={form.siteId}
              onChange={(e) => updateField('siteId', e.target.value)}
              className="h-16 w-full appearance-none rounded-lg border border-[#0d3660] bg-[#020b18]/50 pl-16 pr-12 text-base text-white outline-none transition focus:border-cyan-300"
            >
              <option value="">Select a site</option>
              {(data?.sites || []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} ({s.site_type})</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-200" />
          </div>
        </label>
      </FormPanel>

      <FormPanel title="Assign Device">
        <label className="block">
          <span className="text-base font-semibold text-white">Select Device <span className="text-red-400">*</span></span>
          <div className="relative mt-3">
            <Thermometer className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
            <select
              value={form.deviceId}
              onChange={(e) => updateField('deviceId', e.target.value)}
              className="h-16 w-full appearance-none rounded-lg border border-[#0d3660] bg-[#020b18]/50 pl-16 pr-12 text-base text-white outline-none transition focus:border-cyan-300"
            >
              <option value="">Select a device</option>
              {(data?.devices || []).map((d: any) => (
                <option key={d.id} value={d.id}>{d.device_uid} - {d.status}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-200" />
          </div>
        </label>
        <p className="mt-5 text-sm text-slate-300">You can assign multiple devices after creating the agent.</p>
      </FormPanel>

      {message && (
        <p className={`rounded-lg border px-4 py-3 text-sm ${
          message.type === 'success' ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-red-300/20 bg-red-300/10 text-red-100'
        }`}>
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <button onClick={onBack} className="h-16 rounded-lg border border-slate-500/70 text-base font-bold text-white transition hover:bg-[#071f35]">
          Cancel
        </button>
        <button onClick={submitAgent} disabled={submitting} className="h-16 rounded-lg bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-700 text-base font-bold text-white shadow-[0_16px_45px_rgba(14,165,233,0.25)] transition hover:brightness-110 disabled:opacity-50">
          {submitting ? 'Adding...' : 'Add Agent'}
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

function Field({ icon: Icon, label, required, value, onChange, placeholder, inputMode, maxLength }: { icon: LucideIcon; label: string; required?: boolean; value: string; onChange: (value: string) => void; placeholder: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; maxLength?: number }) {
  return (
    <label className="block">
      <span className="text-base font-semibold text-white">{label} {required && <span className="text-red-400">*</span>}</span>
      <div className="relative mt-3">
        <Icon className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode={inputMode} maxLength={maxLength} className="h-16 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/50 pl-16 pr-5 text-base text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300" />
      </div>
    </label>
  );
}
