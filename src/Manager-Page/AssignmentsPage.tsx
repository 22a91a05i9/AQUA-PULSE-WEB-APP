import { ControlCenter, Panel, PrimaryButton, SelectField } from './components';

export default function AssignmentsPage() {
  return (
    <div className="space-y-8">
      <ControlCenter />
      <Panel>
        <div className="grid grid-cols-1 gap-12 xl:grid-cols-[0.85fr_1fr]">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Assign Device To Owner</h2>
            <div className="mt-7 space-y-7">
              <SelectField label="Device" placeholder="Select device" />
              <SelectField label="Owner" placeholder="Select owner" />
              <PrimaryButton>Assign Device</PrimaryButton>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Assignment Overview</h2>
            <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2">
              {[
                { id: '002', owner: 'New Owner' },
                { id: '001', owner: 'Sallapudi Y V Ramana' },
              ].map((item) => (
                <div key={item.id} className="rounded-lg border border-[#0d3660] bg-[#031426]/70 p-6">
                  <p className="text-3xl font-extrabold text-white">{item.id}</p>
                  <p className="mt-3 text-lg text-lime-300">active</p>
                  <p className="mt-4 text-slate-300">Assigned to {item.owner}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
