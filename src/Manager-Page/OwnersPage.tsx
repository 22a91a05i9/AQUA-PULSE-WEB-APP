import { useMemo, useState } from 'react';
import { Eye, Filter, Grid2X2, Plus, Search, Upload, UserCheck } from 'lucide-react';
import { owners, tableActionsIcon } from './data';
import { Panel, PrimaryButton, StatCard, StatusBadge, TablePager } from './components';

const MoreVertical = tableActionsIcon;

interface OwnerRecord {
  initials: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  joined: string;
  time: string;
}

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
};

export default function OwnersPage() {
  const [ownerList, setOwnerList] = useState<OwnerRecord[]>(owners);
  const [selectedOwner, setSelectedOwner] = useState<OwnerRecord>(owners[0]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const ownerStats = useMemo(() => {
    const active = ownerList.filter((owner) => owner.status === 'Active').length;
    const inactive = ownerList.filter((owner) => owner.status === 'Inactive').length;
    const invited = ownerList.filter((owner) => owner.status === 'Invited').length;

    return { active, inactive, invited, total: ownerList.length };
  }, [ownerList]);

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
  };

  const createOwner = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setMessage('Enter name, email, and phone before creating an owner.');
      return;
    }

    const exists = ownerList.some((owner) => owner.email.toLowerCase() === form.email.trim().toLowerCase());

    if (exists) {
      setMessage('Owner with this email already exists.');
      return;
    }

    const nextOwner: OwnerRecord = {
      initials: form.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: 'Active',
      joined: 'May 17, 2024',
      time: '10:30 AM',
    };

    setOwnerList((current) => [nextOwner, ...current]);
    setSelectedOwner(nextOwner);
    setForm(initialForm);
    setMessage('Owner created and reflected in the directory.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Owners</h1>
          <p className="mt-2 text-slate-300">Manage and view all registered owners in the platform.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input className="h-12 w-80 rounded-lg border border-[#0d3660] bg-[#020b18]/70 pl-12 pr-4 text-sm outline-none" placeholder="Search owners by name, email or phone..." />
          </div>
          <button className="flex h-12 items-center gap-2 rounded-lg border border-[#0d3660] px-4 text-sm font-semibold text-white"><Filter className="h-4 w-4" /> All Status</button>
          <button className="flex h-12 items-center gap-2 rounded-lg border border-[#0d3660] px-4 text-sm font-semibold text-white"><Upload className="h-4 w-4" /> Export</button>
          <button className="flex h-12 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white"><Plus className="h-5 w-5" /> Add Owner</button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        <StatCard label="Total Owners" value={String(ownerStats.total)} desc="Registered owners" icon={Plus} tone="blue" />
        <StatCard label="Active Owners" value={String(ownerStats.active)} desc="Active accounts" icon={Eye} tone="green" />
        <StatCard label="Inactive Owners" value={String(ownerStats.inactive)} desc="Inactive accounts" icon={Plus} tone="orange" />
        <StatCard label="Invited Owners" value={String(ownerStats.invited)} desc="Pending invitations" icon={Upload} tone="purple" />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.72fr_1.8fr]">
        <div className="space-y-5">
          <Panel>
            <h2 className="text-xl font-extrabold text-white">Create Owner</h2>
            <p className="mt-2 text-sm text-slate-300">Add a new owner to the platform.</p>
            <div className="mt-8 space-y-5">
              <OwnerField label="Full Name" value={form.name} onChange={(value) => updateForm('name', value)} placeholder="Enter owner full name" />
              <OwnerField label="Email" value={form.email} onChange={(value) => updateForm('email', value)} placeholder="Enter email address" />
              <OwnerField label="Phone" value={form.phone} onChange={(value) => updateForm('phone', value)} placeholder="Enter phone number" />
              <OwnerField label="Password" value={form.password} onChange={(value) => updateForm('password', value)} placeholder="Enter password" type="password" />
              <PrimaryButton onClick={createOwner}>Create Owner</PrimaryButton>
              {message && <p className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-300/15 text-cyan-200">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Owner Details</h2>
                <p className="mt-1 text-sm text-slate-300">Selected owner preview</p>
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-[#0d3660] bg-[#031426]/70 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-700/50 font-bold text-cyan-200">{selectedOwner.initials}</span>
                <div>
                  <p className="font-bold text-white">{selectedOwner.name}</p>
                  <p className="text-sm text-slate-300">{selectedOwner.email}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Detail label="Phone" value={selectedOwner.phone} />
                <Detail label="Status" value={selectedOwner.status} />
                <Detail label="Joined" value={selectedOwner.joined} />
                <Detail label="Time" value={selectedOwner.time} />
              </div>
            </div>
          </Panel>
        </div>
        <Panel>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white">Owner Directory</h2>
              <p className="mt-2 text-sm text-slate-300">List of all registered owners.</p>
            </div>
            <button className="flex h-11 items-center gap-2 rounded-lg border border-[#0d3660] px-4 text-sm font-semibold text-white"><Grid2X2 className="h-4 w-4" /> Columns</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-[#0d3660] text-slate-400">
                <tr>
                  <th className="py-3 font-medium">Name</th>
                  <th className="py-3 font-medium">Email</th>
                  <th className="py-3 font-medium">Phone</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium">Joined On</th>
                  <th className="py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ownerList.map((owner) => (
                  <tr key={owner.email} className="border-b border-[#0d3660]/60">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700/50 font-bold text-cyan-200">{owner.initials}</span>
                        <span className="text-white">{owner.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-300">{owner.email}</td>
                    <td className="text-slate-300">{owner.phone}</td>
                    <td><StatusBadge status={owner.status} /></td>
                    <td className="text-slate-300">{owner.joined}<br /><span className="text-xs">{owner.time}</span></td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedOwner(owner)}
                        className="ml-auto inline-flex items-center gap-2 rounded-md border border-[#0d3660] px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300"
                      >
                        Details
                        <MoreVertical className="h-4 w-4 text-slate-300" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5"><TablePager /></div>
        </Panel>
      </div>
    </div>
  );
}

function OwnerField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300"
        placeholder={placeholder}
      />
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#0d3660] bg-[#020b18]/50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
