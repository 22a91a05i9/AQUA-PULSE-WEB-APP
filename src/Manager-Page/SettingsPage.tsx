import { ChevronRight } from 'lucide-react';
import { settingGroups } from './data';
import { PageTitle, Panel, ToneIcon } from './components';

export default function SettingsPage() {
  return (
    <div>
      <PageTitle
        title="Settings"
        subtitle="Manage your account preferences, system configurations, and notification settings."
      />
      <div className="space-y-5">
        {settingGroups.map((group) => (
          <Panel key={group.title}>
            <h2 className="mb-4 text-sm font-extrabold uppercase tracking-[0.18em] text-cyan-300">{group.title}</h2>
            <div className="overflow-hidden rounded-lg border border-[#0d3660]">
              {group.items.map((item, index) => (
                <button
                  key={item.label}
                  className={`flex w-full items-center gap-5 bg-[#031426]/70 p-5 text-left transition hover:bg-[#071f35] ${index > 0 ? 'border-t border-[#0d3660]' : ''}`}
                >
                  <ToneIcon icon={item.icon} tone={item.tone} />
                  <div className="flex-1">
                    <p className="font-bold text-white">{item.label}</p>
                    <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </button>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
