import { useMemo, useState, useEffect } from 'react';
import { Eye, Grid2X2, Plus, Search, Upload, UserCheck } from 'lucide-react';
import { owners as defaultOwners } from './data';
import { Panel, PrimaryButton, StatCard, StatusBadge, TablePager } from './components';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { isAllowedPassword, PASSWORD_POLICY_MESSAGE } from '../lib/passwordPolicy';
import { exportRowsToCsv, rowMatchesSearch, RowActionMenu } from '../lib/tableActions';

interface OwnerRecord {
  id: number | null;
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
  const [ownerList, setOwnerList] = useState<OwnerRecord[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<OwnerRecord | null>(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Status');
  const [editingOwnerId, setEditingOwnerId] = useState<number | null>(null);

  const loadOwners = async () => {
    try {
      const session = getAuthSession();
      if (session) {
        const apiOwners = await apiRequest<any[]>('/manager/owners', {
          token: session.token,
        });

        const normalized: OwnerRecord[] = apiOwners.map((o: any) => {
          const created = o.created_at ? new Date(o.created_at) : null;
          const joinedStr = created ? created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';
          const timeStr = created ? created.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
          return {
            id: o.id,
            initials: (o.full_name || 'U').split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            name: o.full_name || 'Unnamed Owner',
            email: o.email,
            phone: o.phone || 'No phone',
            status: o.is_active ? 'Active' : 'Inactive',
            joined: joinedStr,
            time: timeStr,
          };
        });

        setOwnerList(normalized);
        setSelectedOwner(normalized[0] || null);
      } else {
        const fallbackOwners = defaultOwners.map((owner, index) => ({ ...owner, id: index + 1 }));
        setOwnerList(fallbackOwners);
        setSelectedOwner(fallbackOwners[0] || null);
      }
    } catch (err) {
      console.error('Failed to load owners from DB, using fallback defaults:', err);
      const fallbackOwners = defaultOwners.map((owner, index) => ({ ...owner, id: index + 1 }));
      setOwnerList(fallbackOwners);
      setSelectedOwner(fallbackOwners[0] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, []);

  const ownerStats = useMemo(() => {
    const active = ownerList.filter((owner) => owner.status === 'Active').length;
    const inactive = ownerList.filter((owner) => owner.status === 'Inactive').length;
    const invited = ownerList.filter((owner) => owner.status === 'Invited').length;

    return { active, inactive, invited, total: ownerList.length };
  }, [ownerList]);

  const filteredOwners = useMemo(
    () =>
      ownerList.filter((owner) => {
        const matchesSearch = rowMatchesSearch([owner.name, owner.email, owner.phone, owner.status, owner.joined], search);
        const matchesStatus = status === 'All Status' || owner.status === status;
        return matchesSearch && matchesStatus;
      }),
    [ownerList, search, status],
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }


  const updateForm = (field: keyof typeof form, value: string) => {
    const nextValue = field === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    setMessage('');
  };

  const saveOwner = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setMessage('Enter name, email, and phone before saving an owner.');
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setMessage('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!/^[^\s@]+@gmail\.com$/i.test(form.email.trim())) {
      setMessage('Please enter a valid @gmail.com email address.');
      return;
    }
    const normalizedEmail = form.email.trim().toLowerCase();
    const duplicateEmail = ownerList.some((owner) => owner.id !== editingOwnerId && owner.email.toLowerCase() === normalizedEmail);
    if (duplicateEmail) {
      setMessage('Email already exists.');
      return;
    }
    const duplicatePhone = ownerList.some((owner) => owner.id !== editingOwnerId && owner.phone === form.phone.trim());
    if (duplicatePhone) {
      setMessage('Phone number already exists.');
      return;
    }

    const password = form.password.trim() || 'AquaOwner@2026';
    if (!isAllowedPassword(password)) {
      setMessage(PASSWORD_POLICY_MESSAGE);
      return;
    }

    try {
      const session = getAuthSession();
      if (session) {
        await apiRequest(editingOwnerId ? `/manager/owners/${editingOwnerId}` : '/manager/owners', {
          method: editingOwnerId ? 'PUT' : 'POST',
          token: session.token,
          body: JSON.stringify({
            full_name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            password: editingOwnerId && !form.password.trim() ? undefined : password,
          }),
        });

        setForm(initialForm);
        setEditingOwnerId(null);
        setMessage(editingOwnerId ? 'Owner updated successfully in database!' : 'Owner created and saved successfully in database!');
        loadOwners();
      }
    } catch (err: any) {
      setMessage('Failed to save owner to database: ' + (err.message || String(err)));
    }
  };

  const editOwner = (owner: OwnerRecord) => {
    setEditingOwnerId(owner.id);
    setSelectedOwner(owner);
    setForm({ name: owner.name, email: owner.email, phone: owner.phone, password: '' });
    setMessage('Editing selected owner.');
  };

  const deleteOwner = async (owner: OwnerRecord) => {
    if (!window.confirm(`Delete ${owner.name}? This removes the owner from the database.`)) return;

    const session = getAuthSession();
    if (session && owner.id) {
      await apiRequest(`/manager/owners/${owner.id}`, {
        method: 'DELETE',
        token: session.token,
      });
      loadOwners();
    } else {
      setOwnerList((current) => current.filter((item) => item.email !== owner.email));
    }

    if (selectedOwner?.email === owner.email) setSelectedOwner(null);
    setMessage('Owner deleted successfully.');
  };

  const exportOwners = () => {
    exportRowsToCsv(
      'aqua-pulse-owners.csv',
      filteredOwners.map((owner) => ({
        Name: owner.name,
        Email: owner.email,
        Phone: owner.phone,
        Status: owner.status,
        Joined: owner.joined,
      })),
    );
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="safe-text text-[clamp(1.5rem,2.4vw,2rem)] font-extrabold text-white">Owners</h1>
          <p className="safe-text mt-2 text-slate-300">Manage and view all registered owners in the platform.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-12 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/70 pl-12 pr-4 text-sm outline-none" placeholder="Search owners by name, email or phone..." />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 rounded-lg border border-[#0d3660] bg-[#020b18]/70 px-4 text-sm font-semibold text-white outline-none">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Invited</option>
          </select>
          <button onClick={exportOwners} className="flex h-12 items-center gap-2 rounded-lg border border-[#0d3660] px-4 text-sm font-semibold text-white"><Upload className="h-4 w-4" /> Export</button>
        </div>
      </div>
      <div className="auto-card-grid gap-5">
        <StatCard label="Total Owners" value={String(ownerStats.total)} desc="Registered owners" icon={Plus} tone="blue" />
        <StatCard label="Active Owners" value={String(ownerStats.active)} desc="Active accounts" icon={Eye} tone="green" />
        <StatCard label="Inactive Owners" value={String(ownerStats.inactive)} desc="Inactive accounts" icon={Plus} tone="orange" />
        <StatCard label="Invited Owners" value={String(ownerStats.invited)} desc="Pending invitations" icon={Upload} tone="purple" />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <Panel>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Owners Directory</h2>
            <div className="flex gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-[#071f35] text-cyan-400"><Grid2X2 className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-[#071f35]/50 text-slate-300">
                <tr>
                  <th className="px-4 py-3.5 font-medium">Owner</th>
                  <th className="px-4 py-3.5 font-medium">Email Address</th>
                  <th className="px-4 py-3.5 font-medium">Contact Phone</th>
                  <th className="px-4 py-3.5 font-medium">Onboarding Status</th>
                  <th className="px-4 py-3.5 font-medium">Joined On</th>
                  <th className="px-4 py-3.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d3660]/40">
                {filteredOwners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">No owners match the current search.</td>
                  </tr>
                ) : (
                  filteredOwners.map((owner) => (
                    <tr
                      key={owner.email}
                      onClick={() => setSelectedOwner(owner)}
                      className={`cursor-pointer transition hover:bg-[#071f35]/30 ${
                        selectedOwner?.email === owner.email ? 'bg-[#06b6d4]/10' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700/40 text-sm font-extrabold text-blue-300">
                            {owner.initials}
                          </div>
                          <span className="font-bold text-white">{owner.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-200">{owner.email}</td>
                      <td className="px-4 py-4 text-slate-200">{owner.phone}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={owner.status} />
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        <div>
                          <p className="font-medium">{owner.joined}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{owner.time}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <RowActionMenu onEdit={() => editOwner(owner)} onDelete={() => deleteOwner(owner)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-5">
            <TablePager />
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel>
            <h2 className="mb-6 text-xl font-bold text-white">{editingOwnerId ? 'Edit Owner' : 'Create New Owner'}</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-white">Full Name</span>
                <input
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-white">Email Address</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  placeholder="e.g. anand@gmail.com"
                  className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-white">Contact Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder="e.g. 9876543212"
                  maxLength={10}
                  inputMode="numeric"
                  className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-white">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  placeholder="Leave blank for default: AquaOwner@2026"
                  className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300"
                />
              </label>
              {message && (
                <p className={`text-sm font-semibold ${message.includes('success') ? 'text-emerald-400' : 'text-red-300'}`}>
                  {message}
                </p>
              )}
              <div className="pt-2">
                <PrimaryButton onClick={saveOwner}>{editingOwnerId ? 'Update Owner' : 'Register Owner'}</PrimaryButton>
                {editingOwnerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOwnerId(null);
                      setForm(initialForm);
                      setMessage('');
                    }}
                    className="ml-3 h-12 rounded-md border border-[#0d3660] px-5 text-sm font-bold text-white"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </Panel>
          {selectedOwner && (
            <Panel>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700/40 text-2xl font-extrabold text-blue-300">
                  {selectedOwner.initials}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg leading-tight">{selectedOwner.name}</h3>
                  <p className="mt-1 text-sm text-slate-300">{selectedOwner.email}</p>
                </div>
              </div>
              <div className="mt-6 border-t border-[#0d3660]/40 pt-5 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <UserCheck className="h-5 w-5 text-cyan-300" />
                  <span className="text-slate-350 flex-1">Status:</span>
                  <StatusBadge status={selectedOwner.status} />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Upload className="h-5 w-5 text-cyan-300" />
                  <span className="text-slate-350 flex-1">Phone:</span>
                  <span className="text-white font-bold">{selectedOwner.phone}</span>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
