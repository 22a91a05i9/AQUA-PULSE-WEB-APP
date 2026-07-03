import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { exportRowsToCsv, rowMatchesSearch } from '../lib/tableActions';

type ReadingItem = {
  deviceId: string;
  pond: string;
  values: Record<string, string>;
  sensorFields: string[];
  time: string;
};

const SENSOR_FIELD_BY_ID: Record<number, string> = {
  1: 'ph',
  2: 'temperature_c',
  3: 'turbidity',
  4: 'ammonia',
  5: 'dissolved_oxygen',
  6: 'nitrate',
  7: 'salinity',
  8: 'electric_conductivity',
};

const METRICS = [
  { key: 'temperature_c', label: 'Temp (deg C)', csv: 'TemperatureC', className: 'text-cyan-300', format: (value: any) => Number(value).toFixed(2) },
  { key: 'ph', label: 'pH', csv: 'Ph', className: 'text-lime-400', format: (value: any) => Number(value).toFixed(2) },
  { key: 'turbidity', label: 'Turbidity (NTU)', csv: 'Turbidity', className: 'text-purple-300', format: (value: any) => Math.round(Number(value)).toString() },
  { key: 'ammonia', label: 'Ammonia', csv: 'Ammonia', className: 'text-amber-300', format: (value: any) => Number(value).toFixed(2) },
  { key: 'dissolved_oxygen', label: 'DO (mg/L)', csv: 'DissolvedOxygen', className: 'text-sky-300', format: (value: any) => Number(value).toFixed(2) },
  { key: 'nitrate', label: 'Nitrate', csv: 'Nitrate', className: 'text-emerald-300', format: (value: any) => Number(value).toFixed(2) },
  { key: 'salinity', label: 'Salinity', csv: 'Salinity', className: 'text-teal-300', format: (value: any) => Number(value).toFixed(2) },
  { key: 'electric_conductivity', label: 'Conductivity (uS/cm)', csv: 'Conductivity', className: 'text-cyan-300/80', format: (value: any) => Number(value).toFixed(2) },
];

export default function DataPage() {
  const [readingsList, setReadingsList] = useState<ReadingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    async function loadData() {
      try {
        const session = getAuthSession();
        if (session) {
          const readings = await apiRequest<any[]>('/readings/owner/all', {
            token: session.token,
          });

          const mapped: ReadingItem[] = readings.map((r: any) => {
            const devUid = r.device_id ? `Device-${r.device_id}` : 'Unknown';
            const siteName = r.site_id ? `Pond-${r.site_id}` : 'Unassigned';
            
            const sensorFields = METRICS.filter(m => r[m.key] != null).map(m => m.key);
            const values = METRICS.reduce<Record<string, string>>((acc, metric) => {
              acc[metric.key] = r[metric.key] != null ? metric.format(r[metric.key]) : 'N/A';
              return acc;
            }, {});
            
            const timeStr = r.collected_at 
              ? new Date(r.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Just now';

            return {
              deviceId: devUid,
              pond: siteName,
              values,
              sensorFields,
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

  const filteredReadings = useMemo(
    () =>
      readingsList.filter((reading) =>
        rowMatchesSearch([reading.deviceId, reading.pond, ...Object.values(reading.values), reading.time], search),
      ),
    [readingsList, search],
  );

  const totalPages = Math.ceil(filteredReadings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReadings = filteredReadings.slice(startIndex, endIndex);

  const visibleMetrics = useMemo(() => {
    const fields = new Set<string>();
    filteredReadings.forEach((reading) => {
      reading.sensorFields.forEach((field) => fields.add(field));
      METRICS.forEach((metric) => {
        if (reading.values[metric.key] && reading.values[metric.key] !== 'N/A') {
          fields.add(metric.key);
        }
      });
    });
    return METRICS.filter((metric) => fields.has(metric.key));
  }, [filteredReadings]);

  const exportReadings = () => {
    exportRowsToCsv(
      'aqua-pulse-readings.csv',
      filteredReadings.map((reading) => {
        const row: Record<string, string> = {
          DeviceId: reading.deviceId,
          Pond: reading.pond,
          Time: reading.time,
        };
        visibleMetrics.forEach((metric) => {
          row[metric.csv] = reading.values[metric.key] || 'N/A';
        });
        return row;
      }),
    );
  };

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
              <input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} className="h-11 w-72 rounded-lg border border-[#0d3660] bg-[#020b18]/60 pl-11 pr-4 text-sm text-white outline-none" placeholder="Search readings..." />
            </div>
            <button onClick={exportReadings} className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 transition">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="text-slate-350 bg-[#071f35]/50 uppercase text-xs tracking-wide sticky top-0">
              <tr>
                <th className="py-4 px-4 font-bold">Device ID</th>
                <th className="font-bold">Pond</th>
                {visibleMetrics.map((metric) => (
                  <th key={metric.key} className="font-bold">{metric.label}</th>
                ))}
                <th className="font-bold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0d3660]/70">
              {paginatedReadings.map((reading, index) => (
                <tr key={index} className="hover:bg-[#071f35]/25 transition">
                  <td className="py-5 px-4 text-lg text-white font-semibold">{reading.deviceId}</td>
                  <td className="text-lg text-white font-medium">{reading.pond}</td>
                  {visibleMetrics.map((metric) => (
                    <td key={metric.key} className={`text-lg font-bold ${metric.className}`}>{reading.values[metric.key] || 'N/A'}</td>
                  ))}
                  <td className="text-base text-slate-300">{reading.time}</td>
                </tr>
              ))}
              {paginatedReadings.length === 0 && (
                <tr>
                  <td colSpan={3 + visibleMetrics.length} className="py-8 text-center text-slate-400">
                    No readings match the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-slate-300">
          <p>Showing {startIndex + 1} to {Math.min(endIndex, filteredReadings.length)} of {filteredReadings.length} readings</p>
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-10 w-10 rounded-lg border border-[#0d3660] text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#071f35]/50 transition"
            >
              ‹
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 min-w-10 rounded-lg border transition ${
                    page === currentPage 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'border-[#0d3660] text-slate-300 hover:bg-[#071f35]/50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-10 w-10 rounded-lg border border-[#0d3660] text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#071f35]/50 transition"
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
