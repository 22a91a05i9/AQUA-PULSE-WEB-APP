import { Download, Filter, Search } from 'lucide-react';

const readings = Array.from({ length: 10 }, (_, index) => ({
  temp: ['28.1', '28.3', '28.2', '28.0'][index % 4],
  ph: ['8.2', '8.1', '8.3'][index % 3],
  do: ['5.4', '5.6', '5.3', '5.5', '5.7'][index % 5],
  turbidity: [24, 26, 25, 23][index % 4],
  conductivity: [482, 479, 485, 480, 478, 483, 481][index % 7],
  time: `10:${String(30 - index).padStart(2, '0')}:${index === 0 ? '40' : '00'} AM`,
}));

export default function DataPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <section className="glass rounded-xl p-7">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-white">Recent Sensor Readings</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="h-11 w-72 rounded-lg border border-[#0d3660] bg-[#020b18]/60 pl-11 pr-4 text-sm text-white outline-none" placeholder="Search readings..." />
            </div>
            <button className="flex h-11 items-center gap-2 rounded-lg border border-[#0d3660] px-5 text-sm font-semibold text-white">
              <Filter className="h-4 w-4" />
              Filters
            </button>
            <button className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="text-slate-300">
              <tr>
                <th className="py-4 text-lg font-medium">Device ID</th>
                <th className="text-lg font-medium">Pond</th>
                <th className="text-lg font-medium">Temp (deg C)</th>
                <th className="text-lg font-medium">pH</th>
                <th className="text-lg font-medium">DO (mg/L)</th>
                <th className="text-lg font-medium">Turbidity (NTU)</th>
                <th className="text-lg font-medium">Conductivity (uS/cm)</th>
                <th className="text-lg font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0d3660]/70">
              {readings.map((reading, index) => (
                <tr key={index}>
                  <td className="py-5 text-xl text-white">DVC-001</td>
                  <td className="text-xl text-white">Pond 01</td>
                  <td className="text-xl text-cyan-300">{reading.temp}</td>
                  <td className="text-xl text-lime-400">{reading.ph}</td>
                  <td className="text-xl text-sky-300">{reading.do}</td>
                  <td className="text-xl text-purple-300">{reading.turbidity}</td>
                  <td className="text-xl text-cyan-300">{reading.conductivity}</td>
                  <td className="text-lg text-slate-300">{reading.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex items-center justify-between text-slate-300">
          <p>Showing 1 to 10 of 200 readings</p>
          <div className="flex gap-2">
            {['‹', '1', '2', '3', '...', '20', '›'].map((page) => (
              <button key={page} className={`h-10 min-w-10 rounded-lg border border-[#0d3660] px-3 ${page === '1' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>
                {page}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
