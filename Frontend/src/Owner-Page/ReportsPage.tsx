import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  LineChart,
  Search,
  SendHorizontal,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { config } from '../lib/config';
import { exportRowsToCsv, rowMatchesSearch, RowActionMenu } from '../lib/tableActions';

type ReportFormat = 'pdf' | 'excel';

type ReportItem = {
  id: number;
  user_id: number;
  generated_by_name?: string | null;
  generated_by_role?: string | null;
  title: string;
  report_type: string;
  scope: string;
  format: string;
  status: string;
  parameters?: { row_count?: number } | null;
  created_at: string;
};

const popularReports = [
  {
    name: 'Water Quality Report',
    type: 'water_quality',
    desc: 'Live monitoring readings with water quality parameters.',
    icon: LineChart,
    tone: 'text-sky-400 bg-sky-500/20',
  },
  {
    name: 'Device Status Report',
    type: 'device_status',
    desc: 'Device page data with status, site, firmware and sensors.',
    icon: LineChart,
    tone: 'text-emerald-400 bg-emerald-500/20',
  },
  {
    name: 'Alert Summary Report',
    type: 'alert_summary',
    desc: 'Alerts page data with severity, metric and status.',
    icon: Bell,
    tone: 'text-violet-300 bg-violet-500/20',
  },
  {
    name: 'Site Performance Report',
    type: 'site_performance',
    desc: 'Sites page data with devices, agents, readings and alerts.',
    icon: BarChart3,
    tone: 'text-orange-400 bg-orange-500/20',
  },
  {
    name: 'Compliance Report',
    type: 'compliance',
    desc: 'Analytics-style compliance summary from live readings.',
    icon: FileText,
    tone: 'text-cyan-300 bg-cyan-500/20',
  },
];

const REPORT_TYPE_LABELS: Record<string, string> = {
  water_quality: 'Water Quality',
  device_status: 'Device Status',
  alert_summary: 'Alert Summary',
  site_performance: 'Site Performance',
  compliance: 'Compliance',
};

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadReports = async () => {
    try {
      const session = getAuthSession();
      if (!session) return;
      const data = await apiRequest<ReportItem[]>('/reports', { token: session.token });
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(
    () => reports.filter((report) => {
      const searchable = [
        report.title,
        REPORT_TYPE_LABELS[report.report_type] || report.report_type,
        report.scope,
        report.generated_by_name || '',
        report.generated_by_role || '',
        report.format,
        report.status,
      ];
      const matchesSearch = rowMatchesSearch(searchable, search);
      const matchesType = typeFilter === 'all' || report.report_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || report.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesType && matchesStatus;
    }),
    [reports, search, typeFilter, statusFilter],
  );

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const paginatedReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const generateReport = async (report: (typeof popularReports)[number], format: ReportFormat) => {
    try {
      const session = getAuthSession();
      if (!session) return;
      setGenerating(`${report.type}-${format}`);
      const created = await apiRequest<ReportItem>('/reports', {
        method: 'POST',
        token: session.token,
        body: {
          title: `${report.name} - ${new Date().toLocaleString()}`,
          report_type: report.type,
          scope: 'All assigned data',
          format,
          parameters: { source_page: report.type },
        },
      });
      setReports((current) => [created, ...current]);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = async (report: ReportItem) => {
    try {
      const session = getAuthSession();
      if (!session) return;
      const baseUrl = config.apiBaseUrl.replace(/\/+$/, '');
      const response = await fetch(`${baseUrl}/reports/${report.id}/download`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || `${report.title}.${report.format === 'excel' ? 'xls' : 'pdf'}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
      alert('Failed to download report.');
    }
  };

  const exportReports = () => {
    exportRowsToCsv(
      'aqua-pulse-owner-reports.csv',
      filteredReports.map((report) => ({
        Name: report.title,
        Type: REPORT_TYPE_LABELS[report.report_type] || report.report_type,
        Scope: report.scope,
        GeneratedBy: report.generated_by_name || 'Unknown',
        Role: report.generated_by_role || 'Unknown',
        GeneratedOn: new Date(report.created_at).toLocaleString(),
        Format: report.format.toUpperCase(),
        Rows: report.parameters?.row_count ?? 0,
        Status: report.status,
      })),
    );
  };

  const deleteReport = (id: number) => {
    setReports((current) => current.filter((report) => report.id !== id));
  };

  return (
    <div className="animate-fade-in space-y-3">
      <section className="glass rounded-lg p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Popular Reports</h2>
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
                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#0d3660]/70 pt-4">
                  {(['pdf', 'excel'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => generateReport(report, format)}
                      disabled={generating === `${report.type}-${format}`}
                      className={`flex h-9 items-center justify-center gap-2 rounded-md border border-[#0d3660] text-xs font-semibold uppercase transition hover:bg-[#071f35] disabled:opacity-60 ${accent}`}
                    >
                      <SendHorizontal className="h-3.5 w-3.5" />
                      {generating === `${report.type}-${format}` ? 'Generating' : format}
                    </button>
                  ))}
                </div>
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
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-md border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none">
                  <option value="all">All Types</option>
                  {popularReports.map((report) => (
                    <option key={report.type} value={report.type}>{report.name}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none">
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
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-[#071f35]/80 text-slate-300">
              <tr>
                <th className="px-5 py-4 font-medium">Report Name</th>
                <th className="font-medium">Report Type</th>
                <th className="font-medium">Site / Scope</th>
                <th className="font-medium">Generated By</th>
                <th className="font-medium">Generated On</th>
                <th className="font-medium">Format</th>
                <th className="font-medium">Rows</th>
                <th className="font-medium">Status</th>
                <th className="pr-5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0d3660]/50">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">Loading reports...</td>
                </tr>
              )}
              {!loading && paginatedReports.map((report) => (
                <tr key={report.id} className="transition hover:bg-[#071f35]/40">
                  <td className="px-5 py-4 text-slate-200">{report.title}</td>
                  <td className="text-slate-300">{REPORT_TYPE_LABELS[report.report_type] || report.report_type}</td>
                  <td className="text-slate-300">{report.scope}</td>
                  <td className="text-slate-300">
                    {report.generated_by_name || 'Unknown'}
                    <span className="ml-2 rounded bg-cyan-500/15 px-2 py-0.5 text-[10px] uppercase text-cyan-300">{report.generated_by_role || 'user'}</span>
                  </td>
                  <td className="text-slate-300">{new Date(report.created_at).toLocaleString()}</td>
                  <td className="text-slate-300">
                    <span className={report.format === 'excel' ? 'text-emerald-300' : 'text-red-300'}>{report.format === 'excel' ? 'Excel' : 'PDF'}</span>
                  </td>
                  <td className="text-slate-300">{report.parameters?.row_count ?? 0}</td>
                  <td>
                    <span className={`rounded px-2 py-1 text-xs font-bold ${report.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="pr-5">
                    <div className="flex justify-end gap-3 text-slate-200">
                      <button onClick={() => downloadReport(report)} className="text-slate-200 hover:text-white" title={`Download ${report.format.toUpperCase()}`}>
                        <Download className="h-4 w-4" />
                      </button>
                      <RowActionMenu onEdit={() => downloadReport(report)} onDelete={() => deleteReport(report.id)} />
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && paginatedReports.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">No generated reports yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#0d3660]/50 px-5 py-3 text-sm text-slate-400">
          <span>
            Showing {filteredReports.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} reports
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#0d3660] disabled:opacity-55">
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
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#0d3660] disabled:opacity-55">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
