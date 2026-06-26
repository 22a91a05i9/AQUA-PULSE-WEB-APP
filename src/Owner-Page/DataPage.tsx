import { useEffect, useState } from 'react';
import { Download, Filter, Search } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';

type ReadingItem = {
  deviceId: string;
  pond: string;
  temp: string;
  ph: string;
  do: string;
  turbidity: string;
  conductivity: string;
  time: string;
};

export default function DataPage() {
  const [readingsList, setReadingsList] = useState<ReadingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const session = getAuthSession();
        if (session) {
          const res = await apiRequest<any>('/owner/overview', {
            token: session.token,
          });
          const devices = res.devices || [];
          const sites = res.sites || [];
          const recentReadings = res.recent_readings || [];

          const mapped: ReadingItem[] = recentReadings.map((r: any) => {
            const devObj = devices.find((d: any) => d.id === r.device_id);
            const siteObj = sites.find((s: any) => s.id === r.site_id);
            const devUid = devObj ? devObj.device_uid : `DVC-${r.device_id}`;
            const siteName = siteObj ? siteObj.name : (r.site_id ? `Site #${r.site_id}` : 'Unassigned');
            
            const tempVal = r.temperature_c != null ? Number(r.temperature_c).toFixed(2) : 'N/A';
            const phVal = r.ph != null ? Number(r.ph).toFixed(2) : 'N/A';
            const doVal = r.temperature_c != null ? (8.5 - (Number(r.temperature_c) - 20) * 0.15).toFixed(1) : '5.4'; // static/calculated
            const turbidityVal = r.turbidity != null ? Math.round(Number(r.turbidity)).toString() : 'N/A';
            const conductivityVal = '480'; // static value not in live data
            
            const timeStr = r.collected_at 
              ? new Date(r.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Just now';

            return {
              deviceId: devUid,
              pond: siteName,
              temp: tempVal,
              ph: phVal,
              do: doVal,
              turbidity: turbidityVal,
              conductivity: conductivityVal,
              time: timeStr,
            };
          });

          setReadingsList(mapped);
        }
      } catch (err) {
        console.error('Failed to load readings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

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
            <thead className="text-slate-350 bg-[#071f35]/50 uppercase text-xs tracking-wide">
              <tr>
                <th className="py-4 px-4 font-bold">Device ID</th>
                <th className="font-bold">Pond</th>
                <th className="font-bold">Temp (deg C)</th>
                <th className="font-bold">pH</th>
                <th className="font-bold">DO (mg/L)</th>
                <th className="font-bold">Turbidity (NTU)</th>
                <th className="font-bold">Conductivity (uS/cm)</th>
                <th className="font-bold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0d3660]/70">
              {readingsList.map((reading, index) => (
                <tr key={index} className="hover:bg-[#071f35]/25 transition">
                  <td className="py-5 px-4 text-lg text-white font-semibold">{reading.deviceId}</td>
                  <td className="text-lg text-white font-medium">{reading.pond}</td>
                  <td className="text-lg text-cyan-300 font-bold">{reading.temp}</td>
                  <td className="text-lg text-lime-400 font-bold">{reading.ph}</td>
                  <td className="text-lg text-sky-300 font-bold">{reading.do} <span className="text-xs text-slate-500 font-normal">(calc)</span></td>
                  <td className="text-lg text-purple-300 font-bold">{reading.turbidity}</td>
                  <td className="text-lg text-cyan-300/80 font-bold">{reading.conductivity} <span className="text-xs text-slate-500 font-normal">(static)</span></td>
                  <td className="text-base text-slate-300">{reading.time}</td>
                </tr>
              ))}
              {readingsList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No recent readings loaded from database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex items-center justify-between text-slate-300">
          <p>Showing {readingsList.length} of {readingsList.length} readings</p>
          <div className="flex gap-2">
            {['‹', '1', '›'].map((page) => (
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
