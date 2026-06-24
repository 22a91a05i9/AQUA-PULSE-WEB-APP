import { useState } from 'react';
import {
  Search,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Download,
  Calendar,
  Filter,
} from 'lucide-react';

interface AlertItem {
  id: string;
  severity: 'Critical' | 'High' | 'Medium';
  message: string;
  details: string;
  device: string;
  deviceType: string;
  pond: string;
  zone: string;
  time: string;
  status: 'Active' | 'Unacknowledged' | 'Resolved';
}

const initialAlerts: AlertItem[] = [
  {
    id: 'ALT-0001',
    severity: 'Critical',
    message: 'Low Dissolved Oxygen',
    details: 'DO level has dropped below threshold (< 3.0 mg/L)',
    device: 'DEV-001',
    deviceType: 'DO Sensor',
    pond: 'Pond 07',
    zone: 'North Zone',
    time: 'May 18, 2024 10:15:23 AM',
    status: 'Active',
  },
  {
    id: 'ALT-0002',
    severity: 'Critical',
    message: 'High Turbidity',
    details: 'Turbidity level has exceeded safe limit (> 50 NTU)',
    device: 'DEV-002',
    deviceType: 'Turbidity Sensor',
    pond: 'Pond 02',
    zone: 'Central Zone',
    time: 'May 18, 2024 09:47:11 AM',
    status: 'Active',
  },
  {
    id: 'ALT-0003',
    severity: 'Critical',
    message: 'pH Level Low',
    details: 'pH level is below recommended range (< 6.5)',
    device: 'DEV-003',
    deviceType: 'pH Sensor',
    pond: 'Pond 03',
    zone: 'West Zone',
    time: 'May 18, 2024 09:25:48 AM',
    status: 'Active',
  },
  {
    id: 'ALT-0004',
    severity: 'High',
    message: 'Temperature Spike',
    details: 'Temperature is above the threshold (> 32°C)',
    device: 'DEV-004',
    deviceType: 'Temperature Sensor',
    pond: 'Pond 01',
    zone: 'North Zone',
    time: 'May 18, 2024 08:55:31 AM',
    status: 'Unacknowledged',
  },
  {
    id: 'ALT-0005',
    severity: 'High',
    message: 'Ammonia Level High',
    details: 'Ammonia level is above the threshold (> 0.5 mg/L)',
    device: 'DEV-005',
    deviceType: 'Ammonia Sensor',
    pond: 'Pond 05',
    zone: 'Central Zone',
    time: 'May 18, 2024 08:16:42 AM',
    status: 'Unacknowledged',
  },
  {
    id: 'ALT-0006',
    severity: 'Medium',
    message: 'Water Level Low',
    details: 'Water level in the pond is too low',
    device: 'DEV-006',
    deviceType: 'Water Level Sensor',
    pond: 'Pond 04',
    zone: 'West Zone',
    time: 'May 18, 2024 07:40:59 AM',
    status: 'Resolved',
  },
  {
    id: 'ALT-0007',
    severity: 'Medium',
    message: 'Device Offline',
    details: 'Device has been offline for more than 15 minutes',
    device: 'DEV-007',
    deviceType: 'pH Sensor',
    pond: 'Pond 03',
    zone: 'West Zone',
    time: 'May 18, 2024 07:12:01 AM',
    status: 'Active',
  },
  {
    id: 'ALT-0008',
    severity: 'Medium',
    message: 'Battery Low',
    details: 'Device battery level is below 20%',
    device: 'DEV-008',
    deviceType: 'pH Sensor',
    pond: 'Pond 02',
    zone: 'Central Zone',
    time: 'May 18, 2024 06:45:44 AM',
    status: 'Resolved',
  },
];

const severityColors: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f59e0b',
  Medium: '#eab308',
};

const statusColors: Record<string, string> = {
  Active: '#ef4444',
  Unacknowledged: '#f59e0b',
  Resolved: '#10b981',
};

export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'devices'>('all');

  const filteredAlerts = initialAlerts.filter((alert) => {
    const matchesSearch =
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.device.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    
    let matchesTab = true;
    if (activeTab === 'active') {
      matchesTab = alert.status === 'Active' || alert.status === 'Unacknowledged';
    } else if (activeTab === 'devices') {
      matchesTab = alert.deviceType.toLowerCase().includes('sensor');
    }

    return matchesSearch && matchesSeverity && matchesTab;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-300">
      {/* Top Header Filter controls bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-slate-800 pb-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 -mb-px w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2 text-sm font-semibold capitalize whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === 'all' ? 'border-[#06b6d4] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All Alerts
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-5 py-2 text-sm font-semibold capitalize whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === 'active' ? 'border-[#06b6d4] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            12 Alerts
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-5 py-2 text-sm font-semibold capitalize whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === 'devices' ? 'border-[#06b6d4] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Device Alerts
          </button>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3 justify-end shrink-0">
          <div className="flex items-center gap-1.5 bg-[#041526]/50 border border-slate-700/50 px-3 py-1.5 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 font-medium">May 12 - May 18, 2024</span>
          </div>

          <button className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-[#041526]/50 text-xs text-slate-300 hover:text-white transition">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          <button className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-[#06b6d4] text-white text-xs font-semibold hover:bg-[#0891b2] transition">
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Filter Inputs Row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-700/50 bg-[#041526]/50 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#06b6d4] transition"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-3 text-xs text-slate-300 focus:outline-none focus:border-[#06b6d4]"
        >
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
        </select>

        <select className="h-9 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-3 text-xs text-slate-300 focus:outline-none focus:border-[#06b6d4]">
          <option value="all">All Devices</option>
        </select>

        <select className="h-9 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-3 text-xs text-slate-300 focus:outline-none focus:border-[#06b6d4]">
          <option value="all">All Types</option>
        </select>

        <select className="h-9 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-3 text-xs text-slate-300 focus:outline-none focus:border-[#06b6d4]">
          <option value="all">All Status</option>
        </select>
      </div>

      {/* Alerts Table */}
      <div className="glass rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#041526]/30">
                <th className="py-4 px-6">Alert ID</th>
                <th className="py-4 px-6">Severity</th>
                <th className="py-4 px-6">Alert</th>
                <th className="py-4 px-6">Device</th>
                <th className="py-4 px-6">Pond</th>
                <th className="py-4 px-6">Time</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="table-row-hover hover:bg-[#071f35]/30 transition">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-slate-400">{alert.id}</td>
                  <td className="py-4 px-6">
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: severityColors[alert.severity] }}>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {alert.severity}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-semibold text-white">{alert.message}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{alert.details}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">{alert.device}</div>
                        <div className="text-[10px] text-slate-500">{alert.deviceType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-semibold text-white">{alert.pond}</div>
                      <div className="text-[10px] text-slate-500">{alert.zone}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-450">{alert.time}</td>
                  <td className="py-4 px-6">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                      style={{
                        backgroundColor: statusColors[alert.status] + '20',
                        color: statusColors[alert.status],
                        border: `1px solid ${statusColors[alert.status]}30`,
                      }}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#041526]/10">
          <div className="text-xs text-slate-400">
            Showing 1 to {filteredAlerts.length} of {initialAlerts.length} alerts
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Rows per page</span>
              <select className="bg-transparent border-none text-xs text-white focus:outline-none">
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded-lg text-xs font-medium bg-[#06b6d4] text-white">1</button>
              <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
