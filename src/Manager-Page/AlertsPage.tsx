import { AlertTriangle } from 'lucide-react';
import { PageTitle, Panel, ToneIcon } from './components';

export default function AlertsPage() {
  return (
    <div>
      <PageTitle title="Alerts" subtitle="Manager alert queue and escalation views will connect here." />
      <Panel className="flex min-h-80 flex-col items-center justify-center text-center">
        <ToneIcon icon={AlertTriangle} tone="red" />
        <h2 className="mt-5 text-2xl font-extrabold text-white">Alerts workspace ready</h2>
        <p className="mt-3 max-w-lg text-slate-300">This page is separated for manager-specific alerts and can be expanded with the next screenshot set.</p>
      </Panel>
    </div>
  );
}
