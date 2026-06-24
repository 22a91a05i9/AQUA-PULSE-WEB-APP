import { ArrowRight, CheckCircle2, Link2 } from 'lucide-react';
import { dashboardStats, owners } from './data';
import { ControlCenter, Panel, StatCard, ToneIcon } from './components';

export default function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Welcome</h1>
        <p className="mt-2 text-lg text-white">Here's what's happening with your farms today.</p>
      </div>
      <ControlCenter compact />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <Panel>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white">Owner Onboarding</h2>
            <p className="text-sm text-slate-300">Latest registered owners</p>
          </div>
          <div className="space-y-4">
            {owners.slice(0, 2).map((owner) => (
              <div key={owner.email} className="flex items-center justify-between rounded-lg border border-[#0d3660] bg-[#031426]/70 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700/40 text-xl font-extrabold text-blue-300">
                    {owner.initials}
                  </div>
                  <div>
                    <p className="font-bold text-white">{owner.name}</p>
                    <p className="mt-1 text-sm text-slate-300">{owner.email}</p>
                  </div>
                </div>
                <p className="text-sm text-white">{owner.phone}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 text-right">
            <button onClick={() => onNavigate('owners')} className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#0d3660] px-4 text-sm font-semibold text-blue-300 hover:border-blue-400">
              View All Owners
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </Panel>
        <Panel>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white">Device Rollout Snapshot</h2>
            <p className="text-sm text-slate-300">Assignment and activation status</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              { label: 'Active Devices', value: '2', desc: '100% activated', tone: 'green', width: '100%' },
              { label: 'Inactive Devices', value: '0', desc: 'Ready for onboarding', tone: 'orange', width: '0%' },
              { label: 'Assigned Devices', value: '2', desc: '100% assigned', tone: 'blue', width: '100%' },
              { label: 'Unassigned Devices', value: '0', desc: 'Need owner allocation', tone: 'purple', width: '0%' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[#0d3660] bg-[#031426]/70 p-5">
                <ToneIcon icon={item.label.includes('Assigned') ? Link2 : CheckCircle2} tone={item.tone} />
                <p className="mt-5 text-sm text-white">{item.label}</p>
                <p className="mt-7 text-3xl font-extrabold text-white">{item.value}</p>
                <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
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
