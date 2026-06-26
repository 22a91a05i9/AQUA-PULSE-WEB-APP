import { useEffect, useState } from 'react';
import { Monitor, Save, Search } from 'lucide-react';
import { devices as defaultDevices, tableActionsIcon } from './data';
import { Panel, SelectField, StatusBadge, TablePager, ToneIcon } from './components';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';

const MoreVertical = tableActionsIcon;

export default function DevicesPage() {
  const [deviceList, setDeviceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [deviceUid, setDeviceUid] = useState('');
  const [imei, setImei] = useState('');
  const [simNumber, setSimNumber] = useState('');
  const [status, setStatus] = useState('inactive');
  const [deviceType, setDeviceType] = useState('Water Quality');
  const [message, setMessage] = useState('');

  const loadDevices = async () => {
    try {
      const session = getAuthSession();
      if (session) {
        const apiDevices = await apiRequest<any[]>('/manager/devices', {
          token: session.token,
        });

        const normalized = apiDevices.map((d: any) => ({
          id: d.device_uid || 'DVC-UNKNOWN',
          name: `Device ${(d.device_uid || '').slice(-4)}`,
          type: d.firmware_version || 'Sensor',
          site: d.site_id ? `Site #${d.site_id}` : 'Warehouse',
          status: d.status === 'active' ? 'Active' : 'Inactive',
          registered: 'May 17, 2024',
          time: '10:30 AM',
        }));

        setDeviceList(normalized);
      } else {
        setDeviceList(defaultDevices);
      }
    } catch (err) {
      console.error('Failed to load devices from DB, using fallback defaults:', err);
      setDeviceList(defaultDevices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deviceUid.trim()) {
      setMessage('Device Name and Device ID are required.');
      return;
    }

    try {
      const session = getAuthSession();
      if (session) {
        await apiRequest('/manager/devices', {
          method: 'POST',
          token: session.token,
          body: JSON.stringify({
            device_uid: deviceUid.trim(),
            imei: imei.trim() || null,
            sim_number: simNumber.trim() || null,
            gsm_number: null,
            firmware_version: deviceType,
            status: status,
          }),
        });

        setName('');
        setDeviceUid('');
        setImei('');
        setSimNumber('');
        setStatus('inactive');
        setMessage('Device successfully registered in database!');
        loadDevices();
      }
    } catch (err: any) {
      setMessage('Failed to register device: ' + (err.message || String(err)));
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Add Device</h1>
        <p className="mt-3 text-sm text-slate-300"><span className="text-cyan-300">Devices</span> <span className="mx-2">/</span> Add Device</p>
      </div>
      
      <form onSubmit={handleRegisterDevice}>
        <Panel>
          <div className="mb-6 flex items-center gap-4">
            <ToneIcon icon={Monitor} tone="cyan" />
            <div>
              <h2 className="text-lg font-extrabold text-white">Register Device</h2>
              <p className="mt-1 text-sm text-slate-300">Enter the device details to register a new device in the platform.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-white">Device Name</span>
              <input required value={name} onChange={e => { setName(e.target.value); setMessage(''); }} placeholder="e.g. pH Sensor 4" className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-white">Device Type</span>
              <select value={deviceType} onChange={e => setDeviceType(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300">
                <option value="Water Quality">Water Quality Sensor</option>
                <option value="pH Sensor">pH Sensor</option>
                <option value="Temperature">Temperature Sensor</option>
                <option value="DO Sensor">DO Sensor</option>
                <option value="Aerator">Aerator Controller</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-white">Device ID</span>
              <input required value={deviceUid} onChange={e => { setDeviceUid(e.target.value); setMessage(''); }} placeholder="e.g. DVC-005" className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-white">Status</span>
              <select value={status} onChange={e => setStatus(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300">
                <option value="inactive">Inactive (Warehouse)</option>
                <option value="active">Active</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-white">IMEI Number</span>
              <input value={imei} onChange={e => setImei(e.target.value)} placeholder="Enter IMEI number" className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-white">SIM Number</span>
              <input value={simNumber} onChange={e => setSimNumber(e.target.value)} placeholder="Enter SIM number" className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none focus:border-cyan-300" />
            </label>
          </div>

          {message && (
            <p className={`mt-4 text-sm font-semibold ${message.includes('success') ? 'text-emerald-400' : 'text-amber-400'}`}>
              {message}
            </p>
          )}

          <div className="mt-6">
            <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white cursor-pointer hover:from-cyan-400 hover:to-blue-500 transition"><Save className="h-5 w-5" /> Register Device</button>
          </div>
        </Panel>
      </form>

      <Panel>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ToneIcon icon={Monitor} tone="cyan" />
            <div>
              <h2 className="text-lg font-extrabold text-white">Device Registry</h2>
              <p className="mt-1 text-sm text-slate-300">View all registered devices in the platform.</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input className="h-11 w-80 rounded-lg border border-[#0d3660] bg-[#020b18]/70 pl-12 pr-4 text-sm outline-none" placeholder="Search devices..." />
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#0d3660] text-slate-400">
            <tr>
              <th className="py-3 font-medium">Device Name</th>
              <th className="py-3 font-medium">Device ID</th>
              <th className="py-3 font-medium">Type</th>
              <th className="py-3 font-medium">Location / Site</th>
              <th className="py-3 font-medium">Status</th>
              <th className="py-3 font-medium">Registered On</th>
              <th className="py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deviceList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">No registered devices found. Use the form above to register one.</td>
              </tr>
            ) : (
              deviceList.map((device, idx) => (
                <tr key={idx} className="border-b border-[#0d3660]/60">
                  <td className="py-4 font-semibold text-white">{device.name}</td>
                  <td className="text-slate-300">{device.id}</td>
                  <td className="text-slate-300">{device.type}</td>
                  <td className="text-slate-300">{device.site}</td>
                  <td><StatusBadge status={device.status} /></td>
                  <td className="text-slate-300">{device.registered}<br /><span className="text-xs">{device.time}</span></td>
                  <td className="text-right"><MoreVertical className="ml-auto h-5 w-5 text-slate-300" /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="mt-5 flex items-center justify-between text-xs text-slate-305">
          <p className="text-sm text-slate-300">Showing 1 to {deviceList.length} of {deviceList.length} devices</p>
          <TablePager />
        </div>
      </Panel>
    </div>
  );
}
