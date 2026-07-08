import { useEffect, useMemo, useState } from 'react';
import { Download, Monitor, Pencil, Save, Search } from 'lucide-react';
import { devices as defaultDevices } from './data';
import { Panel, StatusBadge, TablePager, ToneIcon } from './components';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { exportRowsToCsv, rowMatchesSearch, RowActionMenu } from '../lib/tableActions';

const SENSOR_TYPES = [
  { id: 1, label: 'pH Sensor' },
  { id: 2, label: 'Temperature Sensor' },
  { id: 3, label: 'Turbidity Sensor' },
  { id: 4, label: 'Ammonia Sensor' },
  { id: 5, label: 'Dissolved Oxygen Sensor' },
  { id: 6, label: 'Nitrate Sensor' },
  { id: 7, label: 'Salinity Sensor' },
  { id: 8, label: 'Electric Conductivity Sensor' },
];

const defaultSensorIds = [1, 2, 3];
const DEVICE_NAME_PATTERN = /^Device \d{3}$/;
const DEVICE_VERSION_OPTIONS = ['1.0', '2.0', '3.0', '4.0'];

function sensorNames(ids: number[]) {
  return SENSOR_TYPES.filter((sensor) => ids.includes(sensor.id)).map((sensor) => sensor.label);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export default function DevicesPage() {
  const [deviceList, setDeviceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [deviceUid, setDeviceUid] = useState('');
  const [imei, setImei] = useState('');
  const [simNumber, setSimNumber] = useState('');
  const [status, setStatus] = useState('inactive');
  const [deviceType, setDeviceType] = useState('2.0');
  const [selectedSensorIds, setSelectedSensorIds] = useState<number[]>(defaultSensorIds);
  const [sensorsLocked, setSensorsLocked] = useState(false);
  const [message, setMessage] = useState('');
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const loadDevices = async () => {
    try {
      const session = getAuthSession();
      if (session) {
        const apiDevices = await apiRequest<any[]>('/manager/devices', {
          token: session.token,
        });

        const normalized = apiDevices.map((d: any) => ({
          dbId: d.id,
          id: d.device_uid || 'DVC-UNKNOWN',
          name: `Device ${(d.device_uid || '').slice(-4)}`,
          type: d.firmware_version || '2.0',
          site: d.site_id ? `Site #${d.site_id}` : 'Warehouse',
          status: d.status === 'active' ? 'Active' : 'Inactive',
          rawStatus: d.status,
          imei: d.imei || '',
          simNumber: d.sim_number || '',
          sensorTypeIds: d.sensor_type_ids?.length ? d.sensor_type_ids : defaultSensorIds,
          sensors: sensorNames(d.sensor_type_ids?.length ? d.sensor_type_ids : defaultSensorIds).join(', '),
          registered: d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
          time: d.created_at ? new Date(d.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
        }));

        setDeviceList(normalized);
      } else {
        setDeviceList(defaultDevices.map((device, index) => ({ ...device, dbId: index + 1, rawStatus: device.status.toLowerCase(), imei: '', simNumber: '', sensorTypeIds: defaultSensorIds, sensors: sensorNames(defaultSensorIds).join(', ') })));
      }
    } catch (err) {
      console.error('Failed to load devices from DB, using fallback defaults:', err);
      setDeviceList(defaultDevices.map((device, index) => ({ ...device, dbId: index + 1, rawStatus: device.status.toLowerCase(), imei: '', simNumber: '', sensorTypeIds: defaultSensorIds, sensors: sensorNames(defaultSensorIds).join(', ') })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const filteredDevices = useMemo(
    () => deviceList.filter((device) => rowMatchesSearch([device.name, device.id, device.type, device.site, device.status, device.sensors], search)),
    [deviceList, search],
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields = [
      ['name', name],
      ['deviceUid', deviceUid],
      ['deviceType', deviceType],
      ['status', status],
      ['imei', imei],
      ['simNumber', simNumber],
    ];
    const emptyFields = requiredFields.filter(([, value]) => !String(value).trim()).map(([field]) => field);

    if (emptyFields.length > 0) {
      setMissingFields(emptyFields);
      setMessage('Please fill all required fields.');
      return;
    }
    if (!DEVICE_NAME_PATTERN.test(name.trim())) {
      setMissingFields(['name']);
      setMessage('Device Name must use this format: Device 005.');
      return;
    }
    if (!/^\d+$/.test(deviceUid.trim())) {
      setMissingFields(['deviceUid']);
      setMessage('Device ID must contain numbers only.');
      return;
    }
    if (deviceList.some((device) => device.dbId !== editingDeviceId && device.id === deviceUid.trim())) {
      setMissingFields(['deviceUid']);
      setMessage('Device ID already exists.');
      return;
    }
    if (!/^\d{1,10}$/.test(imei.trim())) {
      setMissingFields(['imei']);
      setMessage('IMEI Number must contain numbers only, up to 10 digits.');
      return;
    }
    if (deviceList.some((device) => device.dbId !== editingDeviceId && device.imei === imei.trim())) {
      setMissingFields(['imei']);
      setMessage('IMEI Number already exists.');
      return;
    }
    if (!/^\d{10}$/.test(simNumber.trim())) {
      setMissingFields(['simNumber']);
      setMessage('SIM Number must be exactly 10 digits.');
      return;
    }
    if (deviceList.some((device) => device.dbId !== editingDeviceId && device.simNumber === simNumber.trim())) {
      setMissingFields(['simNumber']);
      setMessage('SIM Number already exists.');
      return;
    }
    if (!DEVICE_VERSION_OPTIONS.includes(deviceType)) {
      setMissingFields(['deviceType']);
      setMessage('Device Type must be one of: 1.0, 2.0, 3.0, 4.0.');
      return;
    }
    if (selectedSensorIds.length === 0) {
      setMessage('Choose at least one sensor type for this device.');
      return;
    }
    setMissingFields([]);

    try {
      const session = getAuthSession();
      if (session) {
        await apiRequest(editingDeviceId ? `/manager/devices/${editingDeviceId}` : '/manager/devices', {
          method: editingDeviceId ? 'PUT' : 'POST',
          token: session.token,
          body: {
            device_uid: deviceUid.trim(),
            imei: imei.trim() || null,
            sim_number: simNumber.trim() || null,
            gsm_number: null,
            firmware_version: deviceType,
            status: status,
            sensor_type_ids: selectedSensorIds,
          },
        });

        setName('');
        setDeviceUid('');
        setImei('');
        setSimNumber('');
        setStatus('inactive');
        setDeviceType('2.0');
        setSelectedSensorIds(defaultSensorIds);
        setSensorsLocked(false);
        setEditingDeviceId(null);
        setMissingFields([]);
        setMessage(editingDeviceId ? 'Device successfully updated in database!' : 'Device successfully registered in database!');
        loadDevices();
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to register device.');
    }
  };

  const editDevice = (device: any) => {
    setEditingDeviceId(device.dbId);
    setName(device.name);
    setDeviceUid(device.id);
    setImei(device.imei || '');
    setSimNumber(device.simNumber || '');
    setStatus(device.rawStatus || (device.status === 'Active' ? 'active' : 'inactive'));
    setDeviceType(device.type);
    setSelectedSensorIds(device.sensorTypeIds?.length ? device.sensorTypeIds : defaultSensorIds);
    setSensorsLocked(true);
    setMissingFields([]);
    setMessage('Editing selected device.');
  };

  const deleteDevice = async (device: any) => {
    if (!window.confirm(`Delete ${device.id}? This removes the device from the database.`)) return;

    const session = getAuthSession();
    if (session && device.dbId) {
      await apiRequest(`/manager/devices/${device.dbId}`, {
        method: 'DELETE',
        token: session.token,
      });
      loadDevices();
    } else {
      setDeviceList((current) => current.filter((item) => item.id !== device.id));
    }

    setMessage('Device deleted successfully.');
  };

  const exportDevices = () => {
    exportRowsToCsv(
      'aqua-pulse-devices.csv',
      filteredDevices.map((device) => ({
        Name: device.name,
        DeviceId: device.id,
        Type: device.type,
        Site: device.site,
        Status: device.status,
        Registered: device.registered,
        Sensors: device.sensors,
      })),
    );
  };

  const toggleSensor = (sensorId: number) => {
    if (sensorsLocked) return;
    setSelectedSensorIds((current) =>
      current.includes(sensorId)
        ? current.filter((id) => id !== sensorId)
        : [...current, sensorId].sort((a, b) => a - b),
    );
    setMessage('');
  };

  const inputClass = (field: string) =>
    `mt-2 h-12 w-full rounded-md border bg-[#020b18]/50 px-4 text-sm text-white outline-none ${
      missingFields.includes(field) ? 'border-red-500 focus:border-red-400' : 'border-[#0d3660] focus:border-cyan-300'
    }`;

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
              <h2 className="text-lg font-extrabold text-white">{editingDeviceId ? 'Edit Device' : 'Register Device'}</h2>
              <p className="mt-1 text-sm text-slate-300">Enter the device details to save it in the platform.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-white">Device Name</span>
              <input value={name} onChange={e => { setName(e.target.value); setMessage(''); setMissingFields((current) => current.filter((field) => field !== 'name')); }} placeholder="Device 005" className={inputClass('name')} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-white">Device Type</span>
              <select value={deviceType} onChange={e => { setDeviceType(e.target.value); setMissingFields((current) => current.filter((field) => field !== 'deviceType')); }} className={inputClass('deviceType')}>
                {DEVICE_VERSION_OPTIONS.map((version) => (
                  <option key={version} value={version}>{version}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-white">Device ID</span>
              <input inputMode="numeric" pattern="\d*" value={deviceUid} onChange={e => { setDeviceUid(onlyDigits(e.target.value)); setMessage(''); setMissingFields((current) => current.filter((field) => field !== 'deviceUid')); }} placeholder="005" className={inputClass('deviceUid')} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-white">Status</span>
              <select value={status} onChange={e => { setStatus(e.target.value); setMissingFields((current) => current.filter((field) => field !== 'status')); }} className={inputClass('status')}>
                <option value="inactive">Inactive (Warehouse)</option>
                <option value="active">Active</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-white">IMEI Number</span>
              <input inputMode="numeric" maxLength={10} pattern="\d{1,10}" value={imei} onChange={e => { setImei(onlyDigits(e.target.value).slice(0, 10)); setMessage(''); setMissingFields((current) => current.filter((field) => field !== 'imei')); }} placeholder="Up to 10 digits" className={inputClass('imei')} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-white">SIM Number</span>
              <input inputMode="numeric" maxLength={10} pattern="\d{10}" value={simNumber} onChange={e => { setSimNumber(onlyDigits(e.target.value).slice(0, 10)); setMessage(''); setMissingFields((current) => current.filter((field) => field !== 'simNumber')); }} placeholder="10 digits" className={inputClass('simNumber')} />
            </label>
          </div>

          <div className="mt-6 rounded-lg border border-[#0d3660] bg-[#020b18]/35 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Device Sensors</h3>
                <p className="mt-1 text-xs text-slate-300">Selected sensors: {selectedSensorIds.length}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (sensorsLocked) {
                    setSensorsLocked(false);
                    setMessage('Sensor selection unlocked for editing.');
                  } else {
                    if (selectedSensorIds.length === 0) {
                      setMessage('Choose at least one sensor before saving sensor selection.');
                      return;
                    }
                    setSensorsLocked(true);
                    setMessage('Sensor selection saved.');
                  }
                }}
                className="flex h-10 items-center gap-2 rounded-md border border-[#0d3660] px-4 text-sm font-bold text-white"
              >
                {sensorsLocked ? <Pencil className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {sensorsLocked ? 'Edit Sensors' : 'Save Sensors'}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {SENSOR_TYPES.map((sensor) => (
                <label
                  key={sensor.id}
                  className={`flex min-h-12 items-center gap-3 rounded-md border px-3 py-2 text-sm font-semibold ${
                    selectedSensorIds.includes(sensor.id)
                      ? 'border-cyan-400 bg-cyan-500/10 text-white'
                      : 'border-[#0d3660] bg-[#020b18]/50 text-slate-300'
                  } ${sensorsLocked ? 'opacity-80' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSensorIds.includes(sensor.id)}
                    disabled={sensorsLocked}
                    onChange={() => toggleSensor(sensor.id)}
                    className="h-4 w-4 accent-cyan-400"
                  />
                  <span>{sensor.id}. {sensor.label}</span>
                </label>
              ))}
            </div>
          </div>

          {message && (
            <p className={`mt-4 text-sm font-semibold ${message.includes('success') ? 'text-emerald-400' : 'text-amber-400'}`}>
              {message}
            </p>
          )}

          <div className="mt-6">
            <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white cursor-pointer hover:from-cyan-400 hover:to-blue-500 transition"><Save className="h-5 w-5" /> {editingDeviceId ? 'Update Device' : 'Register Device'}</button>
            {editingDeviceId && (
              <button
                type="button"
                onClick={() => {
                  setEditingDeviceId(null);
                  setName('');
                  setDeviceUid('');
                  setImei('');
                  setSimNumber('');
                  setStatus('inactive');
                  setDeviceType('2.0');
                  setSelectedSensorIds(defaultSensorIds);
                  setSensorsLocked(false);
                  setMissingFields([]);
                  setMessage('');
                }}
                className="mt-3 flex h-11 w-full items-center justify-center rounded-md border border-[#0d3660] font-bold text-white"
              >
                Cancel Edit
              </button>
            )}
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
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 w-80 rounded-lg border border-[#0d3660] bg-[#020b18]/70 pl-12 pr-4 text-sm outline-none" placeholder="Search devices..." />
          </div>
          <button onClick={exportDevices} className="flex h-11 items-center gap-2 rounded-lg border border-[#0d3660] px-4 text-sm font-semibold text-white">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#0d3660] text-slate-400">
            <tr>
              <th className="py-3 font-medium">Device Name</th>
              <th className="py-3 font-medium">Device ID</th>
              <th className="py-3 font-medium">Type</th>
              <th className="py-3 font-medium">Sensors</th>
              <th className="py-3 font-medium">Location / Site</th>
              <th className="py-3 font-medium">Status</th>
              <th className="py-3 font-medium">Registered On</th>
              <th className="py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400">No devices match the current search.</td>
              </tr>
            ) : (
              filteredDevices.map((device) => (
                <tr key={device.id} className="border-b border-[#0d3660]/60">
                  <td className="py-4 font-semibold text-white">{device.name}</td>
                  <td className="text-slate-300">{device.id}</td>
                  <td className="text-slate-300">{device.type}</td>
                  <td className="max-w-xs text-slate-300">{device.sensors}</td>
                  <td className="text-slate-300">{device.site}</td>
                  <td><StatusBadge status={device.status} /></td>
                  <td className="text-slate-300">{device.registered}<br /><span className="text-xs">{device.time}</span></td>
                  <td className="text-right"><RowActionMenu onEdit={() => editDevice(device)} onDelete={() => deleteDevice(device)} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="mt-5 flex items-center justify-between text-xs text-slate-305">
          <p className="text-sm text-slate-300">Showing {filteredDevices.length === 0 ? 0 : 1} to {filteredDevices.length} of {deviceList.length} devices</p>
          <TablePager />
        </div>
      </Panel>
    </div>
  );
}
