import { useEffect, useState } from 'react';
import { ControlCenter, Panel, PrimaryButton } from './components';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';

interface Owner {
  id: number;
  full_name: string;
  email: string;
}

interface Device {
  id: number;
  device_uid: string;
  status: string;
  owner_user_id: number | null;
}

export default function AssignmentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  async function loadData() {
    try {
      const session = getAuthSession();
      if (session) {
        const res = await apiRequest<any>('/manager/overview', {
          token: session.token,
        });
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load assignments overview:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async () => {
    if (!selectedDeviceId || !selectedOwnerId) {
      setMessage({ text: 'Please select both a device and an owner.', type: 'error' });
      return;
    }

    setSubmitLoading(true);
    setMessage(null);
    try {
      const session = getAuthSession();
      if (!session) return;

      await apiRequest<any>(`/manager/devices/${selectedDeviceId}/assign-owner`, {
        method: 'POST',
        token: session.token,
        body: {
          owner_user_id: Number(selectedOwnerId),
        },
      });

      setMessage({ text: 'Device successfully assigned to owner!', type: 'success' });
      setSelectedDeviceId('');
      setSelectedOwnerId('');
      // Reload overview data to refresh the lists
      await loadData();
    } catch (err: any) {
      console.error('Failed to assign device:', err);
      setMessage({ text: err?.detail || err?.message || 'Failed to assign device.', type: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const devices: Device[] = data?.devices || [];
  const owners: Owner[] = data?.owners || [];
  const assignedDevices = devices.filter((d) => d.owner_user_id !== null);

  return (
    <div className="space-y-8">
      <ControlCenter compact />
      
      {message && (
        <div className={`p-4 rounded-lg text-sm font-semibold border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <Panel>
        <div className="grid grid-cols-1 gap-12 xl:grid-cols-[0.85fr_1fr]">
          <div className="text-left">
            <h2 className="text-2xl font-extrabold text-white">Assign Device To Owner</h2>
            <div className="mt-7 space-y-7">
              <label className="block">
                <span className="text-sm font-semibold text-white">Device</span>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300"
                >
                  <option value="">Select device</option>
                  {devices.map((d) => {
                    const owner = owners.find((o) => o.id === d.owner_user_id);
                    const labelSuffix = owner ? ` (Assigned to ${owner.full_name})` : ' (Unassigned)';
                    return (
                      <option key={d.id} value={d.id}>
                        {d.device_uid}{labelSuffix}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-white">Owner</span>
                <select
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                  className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300"
                >
                  <option value="">Select owner</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.full_name} ({o.email})
                    </option>
                  ))}
                </select>
              </label>

              <PrimaryButton onClick={handleAssign}>
                {submitLoading ? 'Assigning...' : 'Assign Device'}
              </PrimaryButton>
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-extrabold text-white">Assignment Overview</h2>
            <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2">
              {assignedDevices.length === 0 ? (
                <div className="col-span-2 rounded-lg border border-[#0d3660]/50 bg-[#031426]/30 p-8 text-center text-slate-400">
                  No active assignments found.
                </div>
              ) : (
                assignedDevices.map((item) => {
                  const owner = owners.find((o) => o.id === item.owner_user_id);
                  return (
                    <div key={item.id} className="rounded-lg border border-[#0d3660] bg-[#031426]/70 p-6">
                      <p className="text-3xl font-extrabold text-white">{item.device_uid}</p>
                      <p className="mt-3 text-lg text-lime-300 capitalize">{item.status}</p>
                      <p className="mt-4 text-slate-300">
                        Assigned to {owner ? owner.full_name : `Owner ID: ${item.owner_user_id}`}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
