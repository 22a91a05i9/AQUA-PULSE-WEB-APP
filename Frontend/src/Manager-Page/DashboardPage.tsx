import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Link2, MapPin, Box, Users, AlertTriangle } from 'lucide-react';
import { ControlCenter, Panel, StatCard, ToneIcon } from './components';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';

const defaultOwners = [
  { name: 'Rahul Verma', email: 'rahul@gmail.com', phone: '+91 9876543210', initials: 'RV' },
  { name: 'Srinivas Rao', email: 'srinivas@gmail.com', phone: '+91 9876543211', initials: 'SR' },
];

export default function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadManagerData() {
      try {
        const session = getAuthSession();
        if (session) {
          const res = await apiRequest<any>('/manager/overview', {
            token: session.token,
          });
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load manager overview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadManagerData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const ownersCount = data ? String(data.stats?.owners ?? 0) : '2';
  const agentsCount = data ? String(data.stats?.agents ?? 0) : '2';
  const devicesCount = data ? String(data.stats?.devices ?? 0) : '5';
  const sitesCount = data ? String(data.stats?.sites ?? 0) : '4';
  const alertsCount = data ? String(data.stats?.open_alerts ?? 0) : '2880';

  const stats = [
    { label: 'Registered Owners', value: ownersCount, icon: Users, tone: 'blue' },
    { label: 'Total Agents', value: agentsCount, icon: Users, tone: 'green' },
    { label: 'Registered Devices', value: devicesCount, icon: Box, tone: 'cyan' },
    { label: 'Farming Sites', value: sitesCount, icon: MapPin, tone: 'purple' },
    { label: 'Open Alerts', value: alertsCount, icon: AlertTriangle, tone: 'red' },
  ];

  const ownersList = data
    ? (data.owners || []).map((o: any) => ({
        name: o.full_name,
        email: o.email,
        phone: o.phone || 'No phone',
        initials: o.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      }))
    : defaultOwners;

  const activeDevices = data
    ? (data.devices || []).filter((d: any) => d.status === 'active' || d.status === 'online').length
    : 3;
  const inactiveDevices = data
    ? (data.devices || []).filter((d: any) => d.status !== 'active' && d.status !== 'online').length
    : 2;
  const assignedDevices = data
    ? (data.devices || []).filter((d: any) => d.owner_user_id !== null).length
    : 4;
  const unassignedDevices = data
    ? (data.devices || []).filter((d: any) => d.owner_user_id === null).length
    : 1;

  return (
    <div className="space-y-7 text-left">
      <div>
        <h1 className="safe-text text-[clamp(1.6rem,2.5vw,2rem)] font-extrabold text-white">Welcome</h1>
        <p className="mt-2 text-lg text-white">Here's what's happening with your farms today.</p>
      </div>
      <ControlCenter compact />
      <div className="auto-card-grid gap-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <Panel>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="safe-text text-xl font-extrabold text-white">Owner Onboarding</h2>
            <p className="safe-text text-sm text-slate-300">Latest registered owners</p>
          </div>
          <div className="space-y-4">
            {ownersList.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No owners registered.</p>
            ) : (
              ownersList.slice(0, 2).map((owner: any, idx: number) => (
                <div key={idx} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#0d3660] bg-[#031426]/70 p-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700/40 text-xl font-extrabold text-blue-300">
                      {owner.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="safe-text font-bold text-white">{owner.name}</p>
                      <p className="mt-1 text-sm text-slate-300 truncate max-w-[150px]">{owner.email}</p>
                    </div>
                  </div>
                  <p className="safe-text text-sm text-white">{owner.phone}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-5 text-right">
            <button onClick={() => onNavigate('owners')} className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#0d3660] px-4 text-sm font-semibold text-blue-300 hover:border-blue-400 cursor-pointer">
              View All Owners
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </Panel>
        <Panel>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="safe-text text-xl font-extrabold text-white">Device Rollout Snapshot</h2>
            <p className="safe-text text-sm text-slate-300">Assignment and activation status</p>
          </div>
          <div className="auto-card-grid-sm gap-4 text-left">
            {[
              { label: 'Active Devices', value: String(activeDevices), desc: 'In operations', tone: 'green', width: activeDevices + inactiveDevices > 0 ? `${Math.round((activeDevices / (activeDevices + inactiveDevices)) * 100)}%` : '0%' },
              { label: 'Inactive Devices', value: String(inactiveDevices), desc: 'Stored in warehouse', tone: 'orange', width: activeDevices + inactiveDevices > 0 ? `${Math.round((inactiveDevices / (activeDevices + inactiveDevices)) * 100)}%` : '0%' },
              { label: 'Assigned Devices', value: String(assignedDevices), desc: 'Assigned to owners', tone: 'blue', width: assignedDevices + unassignedDevices > 0 ? `${Math.round((assignedDevices / (assignedDevices + unassignedDevices)) * 100)}%` : '0%' },
              { label: 'Unassigned Devices', value: String(unassignedDevices), desc: 'Awaiting assignment', tone: 'purple', width: assignedDevices + unassignedDevices > 0 ? `${Math.round((unassignedDevices / (assignedDevices + unassignedDevices)) * 100)}%` : '0%' },
            ].map((item) => (
              <div key={item.label} className="metric-card rounded-lg border border-[#0d3660] bg-[#031426]/70 p-5">
                <ToneIcon icon={item.label.includes('Assigned') ? Link2 : CheckCircle2} tone={item.tone} />
                <p className="metric-label mt-5 text-white">{item.label}</p>
                <p className="metric-value mt-7 font-extrabold text-white">{item.value}</p>
                <p className="metric-desc mt-2 text-slate-300">{item.desc}</p>
                <div className="mt-10 h-1.5 rounded-full bg-slate-500">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
