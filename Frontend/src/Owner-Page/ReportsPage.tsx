import { useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  FilePlus2,
  FileText,
  Filter,
  LineChart,
  Search,
  SendHorizontal,
} from 'lucide-react';
import { exportRowsToCsv, rowMatchesSearch, RowActionMenu } from '../lib/tableActions';

const popularReports = [
  {
    name: 'Water Quality Report',
    desc: 'Summary of water quality parameters and compliance.',
    icon: LineChart,
    tone: 'text-sky-400 bg-sky-500/20',
  },
  {
    name: 'Device Status Report',
    desc: 'Overview of device status, uptime and connectivity.',
    icon: LineChart,
    tone: 'text-emerald-400 bg-emerald-500/20',
  },
  {
    name: 'Alert Summary Report',
    desc: 'Summary of alerts triggered within the selected period.',
    icon: Bell,
    tone: 'text-violet-300 bg-violet-500/20',
  },
  {
    name: 'Site Performance Report',
    desc: 'Performance overview of sites and key metrics.',
    icon: BarChart3,
    tone: 'text-orange-400 bg-orange-500/20',
  },
  {
    name: 'Compliance Report',
    desc: 'Regulatory compliance summary and violations.',
    icon: FileText,
    tone: 'text-cyan-300 bg-cyan-500/20',
  },
];

const generatedReports = [
  ['Water Quality Report - May 2024', 'Water Quality', 'All Sites', 'Rahul Verma', 'May 18, 2024 10:30 AM', 'PDF', 'Completed'],
  ['Device Status Report - May 2024', 'Device Status', 'All Sites', 'Rahul Verma', 'May 18, 2024 09:15 AM', 'PDF', 'Completed'],
  ['Alert Summary Report - May 2024', 'Alert Summary', 'All Sites', 'Rahul Verma', 'May 18, 2024 08:45 AM', 'Excel', 'Completed'],
  ['Site Performance Report - Q2 2024', 'Site Performance', 'Region: North', 'Rahul Verma', 'May 17, 2024 05:20 PM', 'PDF', 'Completed'],
  ['Compliance Report - April 2024', 'Compliance', 'All Sites', 'Rahul Verma', 'May 17, 2024 03:10 PM', 'PDF', 'Completed'],
  ['Water Quality Report - April 2024', 'Water Quality', 'Pond 01', 'Rahul Verma', 'May 16, 2024 11:05 AM', 'Excel', 'Completed'],
  ['Device Status Report - April 2024', 'Device Status', 'All Sites', 'Rahul Verma', 'May 16, 2024 09:30 AM', 'PDF', 'Failed'],
  ['Alert Summary Report - April 2024', 'Alert Summary', 'Region: South', 'Rahul Verma', 'May 15, 2024 04:40 PM', 'Excel', 'Completed'],
];

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState(generatedReports);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredReports = useMemo(
    () => reports.filter((report) => {
      const matchesSearch = rowMatchesSearch(report, search);
      const matchesType = typeFilter === 'all' || report[1].toLowerCase().includes(typeFilter.toLowerCase());
      const matchesStatus = statusFilter === 'all' || report[6].toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesType && matchesStatus;
    }),
    [reports, search, typeFilter, statusFilter],
  );

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const paginatedReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportReports = () => {
    exportRowsToCsv(
      'aqua-pulse-owner-reports.csv',
      filteredReports.map(([name, type, scope, by, generated, format, status]) => ({
        Name: name,
        Type: type,
        Scope: scope,
        GeneratedBy: by,
        GeneratedOn: generated,
        Format: format,
        Status: status,
      })),
    );
  };

  const deleteReport = (name: string) => {
    setReports((current) => current.filter((report) => report[0] !== name));
  };

  return (
    <div className="animate-fade-in space-y-3">
      <section className="glass rounded-lg p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Popular Reports</h2>
          <button className="flex h-10 items-center gap-2 rounded-md border border-[#0d3660] bg-[#031426]/70 px-4 text-sm text-white transition hover:border-cyan-400">
            <FilePlus2 className="h-4 w-4" />
            Custom Report
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          {popularReports.map((report) => {
            const Icon = report.icon;
            const accent = report.tone.split(' ')[0];

            return (
              <article key={report.name} className="rounded-lg border border-[#0d3660] bg-[#031426]/55 p-4">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${report.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-white">{report.name}</h3>
                <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-300">{report.desc}</p>
                <button className={`mt-5 flex w-full items-center justify-between border-t border-[#0d3660]/70 pt-4 text-sm font-medium ${accent}`}>
                  Generate Report
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="glass overflow-hidden rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <h2 className="text-lg font-bold text-white">Generated Reports</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-80 max-w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-full rounded-md border border-[#0d3660] bg-[#020b18]/60 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-400" placeholder="Search reports..." />
            </div>
            {showAdvancedFilters && (
              <>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 rounded-md border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="summary">Summary Reports</option>
                  <option value="quality">Quality Reports</option>
                  <option value="device">Device Reports</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-md border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </>
            )}
            <button 
              onClick={() => setShowAdvancedFilters(prev => !prev)}
              className={`flex h-10 items-center gap-2 rounded-md border px-5 text-sm font-semibold transition ${
                showAdvancedFilters ? 'border-[#06b6d4] text-[#22d3ee] bg-[#06b6d4]/10' : 'border-[#0d3660] text-white hover:bg-[#071f35]'
              }`}
            >
              <Filter className="h-4 w-4" /> Filters
            </button>
            <button onClick={exportReports} className="flex h-10 items-center gap-2 rounded-md border border-[#0d3660] px-5 text-sm font-semibold text-white">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-[#071f35]/80 text-slate-300">
              <tr>
                <th className="px-5 py-4 font-medium">Report Name</th>
                <th className="font-medium">Report Type</th>
                <th className="font-medium">Site / Scope</th>
                <th className="font-medium">Generated By</th>
                <th className="font-medium">Generated On</th>
                <th className="font-medium">Format</th>
                <th className="font-medium">Status</th>
                <th className="pr-5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0d3660]/50">
              {paginatedReports.map(([name, type, scope, by, generated, format, status]) => (
                <tr key={name} className="transition hover:bg-[#071f35]/40">
                  <td className="px-5 py-4 text-slate-200">{name}</td>
                  <td className="text-slate-300">{type}</td>
                  <td className="text-slate-300">{scope}</td>
                  <td className="text-slate-300">{by}</td>
                  <td className="text-slate-300">{generated}</td>
                  <td className="text-slate-300">
                    <span className={format === 'Excel' ? 'text-emerald-300' : 'text-red-300'}>{format === 'Excel' ? 'Excel' : 'PDF'}</span>
                  </td>
                  <td>
                    <span className={`rounded px-2 py-1 text-xs font-bold ${status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {status}
                    </span>
                  </td>
                  <td className="pr-5">
                    <div className="flex justify-end gap-3 text-slate-200">
                      <button onClick={() => exportRowsToCsv(`${name}.csv`, [{ name, type, scope, by, generated, format, status }])} className="text-slate-200 hover:text-white">
                        <Download className="h-4 w-4" />
                      </button>
                      <RowActionMenu onEdit={() => alert(`Editing ${name}`)} onDelete={() => deleteReport(name)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#0d3660]/50 px-5 py-3 text-sm text-slate-400">
          <span>
            Showing {filteredReports.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} reports
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#0d3660] disabled:opacity-55"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 rounded-md border transition ${
                  currentPage === page ? 'bg-blue-600 border-blue-600 text-white' : 'border-[#0d3660] text-white hover:bg-[#071f35]'
                }`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#0d3660] disabled:opacity-55"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
