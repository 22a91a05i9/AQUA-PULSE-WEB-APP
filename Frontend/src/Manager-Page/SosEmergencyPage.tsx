import { Shield } from 'lucide-react';
import { PageTitle, Panel, ToneIcon } from './components';

export default function SosEmergencyPage() {
  return (
    <div>
      <PageTitle title="SOS Emergency" subtitle="Manager emergency response and approval workflow." />
      <Panel className="flex min-h-80 flex-col items-center justify-center text-center">
        <ToneIcon icon={Shield} tone="red" />
        <h2 className="mt-5 text-2xl font-extrabold text-white">SOS manager workflow ready</h2>
        <p className="mt-3 max-w-lg text-slate-300">This screen is prepared for the manager-specific SOS process and backend escalation actions.</p>
      </Panel>
    </div>
  );
}
