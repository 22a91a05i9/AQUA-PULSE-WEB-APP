import { Monitor, Save, Search } from 'lucide-react';
import { devices, tableActionsIcon } from './data';
import { Field, Panel, SelectField, StatusBadge, TablePager, ToneIcon } from './components';

const MoreVertical = tableActionsIcon;

export default function DevicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Add Device</h1>
        <p className="mt-3 text-sm text-slate-300"><span className="text-cyan-300">Devices</span> <span className="mx-2">/</span> Add Device</p>
      </div>
      <Panel>
        <div className="mb-6 flex items-center gap-4">
          <ToneIcon icon={Monitor} tone="cyan" />
          <div>
            <h2 className="text-lg font-extrabold text-white">Register Device</h2>
            <p className="mt-1 text-sm text-slate-300">Enter the device details to register a new device in the platform.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Field label="Device Name" placeholder="Enter device name" required />
          <SelectField label="Device Type" placeholder="Select device type" required />
          <Field label="Device ID" placeholder="Enter device ID / unique identifier" required />
          <SelectField label="Location / Site" placeholder="Select location / site" required />
          <Field label="IMEI Number" placeholder="Enter IMEI number" />
          <SelectField label="Status" placeholder="Select status" required />
          <Field label="SIM Number" placeholder="Enter SIM number" />
          <div />
          <Field label="Phone Number" placeholder="Enter phone number" />
        </div>
        <div className="mt-6">
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white"><Save className="h-5 w-5" /> Register Device</button>
        </div>
      </Panel>
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
            {devices.slice(0, 2).map((device) => (
              <tr key={device.id} className="border-b border-[#0d3660]/60">
                <td className="py-4 font-semibold text-white">{device.name}</td>
                <td className="text-slate-300">{device.id}</td>
                <td className="text-slate-300">{device.type}</td>
                <td className="text-slate-300">{device.site}</td>
                <td><StatusBadge status={device.status} /></td>
                <td className="text-slate-300">{device.registered}<br /><span className="text-xs">{device.time}</span></td>
                <td className="text-right"><MoreVertical className="ml-auto h-5 w-5 text-slate-300" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-slate-300">Showing 1 to 2 of 2 devices</p>
          <TablePager />
        </div>
      </Panel>
    </div>
  );
}
