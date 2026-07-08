import { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Search,
  RefreshCw,
  Plus,
  Calendar,
  ChevronDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Waves,
  BarChart3,
  Bell,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { config } from '../lib/config';
import { exportRowsToCsv, RowActionMenu } from '../lib/tableActions';

interface BackendReport {
  id: number;
  title: string;
  report_type: string;
  format: string;
  status: string;
  created_at: string;
  generated_by_name?: string | null;
  parameters?: {
    date_from?: string;
    date_to?: string;
    row_count?: number;
    download_count?: number;
  } | null;
}

interface BackendSchedule {
  id: number;
  title: string;
  report_type: string;
  format: string;
  frequency: string;
  time_of_day: string;
  day_of_week?: number | null;
  day_of_month?: number | null;
  date_from?: string | null;
  date_to?: string | null;
  next_run_at?: string | null;
  last_run_at?: string | null;
  is_active: boolean;
}

const reportTypeLabels: Record<string, string> = {
  water_quality: 'Water Quality',
  device_status: 'Device Performance',
  alert_summary: 'Alert Summary',
  incident_report: 'Incident Report',
  site_performance: 'Site Performance',
  compliance: 'Compliance',
};

const reportMeta: Record<string, { icon: typeof FileText; color: string }> = {
  water_quality: { icon: Waves, color: '#22d3ee' },
  device_status: { icon: BarChart3, color: '#22c55e' },
  alert_summary: { icon: Bell, color: '#f59e0b' },
  incident_report: { icon: AlertTriangle, color: '#ef4444' },
  site_performance: { icon: TrendingUp, color: '#34d399' },
  compliance: { icon: FileText, color: '#3b82f6' },
};

const popularReports = [
  { name: 'Water Quality Summary', type: 'water_quality', desc: 'Overview of key water quality parameters', icon: Waves, color: '#22d3ee' },
  { name: 'Device Performance Report', type: 'device_status', desc: 'Performance and status of all devices', icon: BarChart3, color: '#22c55e' },
  { name: 'Alert Summary Report', type: 'alert_summary', desc: 'Summary of all alerts and notifications', icon: Bell, color: '#f59e0b' },
  { name: 'Incident Report', type: 'incident_report', desc: 'Emergency incidents and resolution status', icon: AlertTriangle, color: '#ef4444' },
  { name: 'Site Performance Report', type: 'site_performance', desc: 'Assigned site activity, readings and alerts', icon: TrendingUp, color: '#34d399' },
];

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [liveReports, setLiveReports] = useState<BackendReport[]>([]);
  const [liveSchedules, setLiveSchedules] = useState<BackendSchedule[]>([]);
  const [showAllPopularReports, setShowAllPopularReports] = useState(false);
  const [showAllSchedules, setShowAllSchedules] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    title: 'Water Quality Summary',
    report_type: 'water_quality',
    format: 'pdf',
    frequency: 'daily',
    time_of_day: '08:00',
    day_of_week: '0',
    day_of_month: '1',
    date_from: '',
    date_to: '',
  });
  const [showGenerateMenu, setShowGenerateMenu] = useState(false);
  const itemsPerPage = 10;

  async function loadReports() {
    try {
      const session = getAuthSession();
      if (!session) return;
      const res = await apiRequest<BackendReport[]>('/reports', { token: session.token });
      setLiveReports(res);
    } catch (err) {
      console.error('Failed to load live reports:', err);
    }
  }

  async function loadSchedules() {
    try {
      const session = getAuthSession();
      if (!session) return;
      const res = await apiRequest<BackendSchedule[]>('/reports/schedules', { token: session.token });
      setLiveSchedules(res);
    } catch (err) {
      console.error('Failed to load report schedules:', err);
    }
  }

  const resetReports = async () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    await loadReports();
    await loadSchedules();
  };

  useEffect(() => {
    loadReports();
    loadSchedules();
  }, []);

  const formatStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  const formatRange = (report: BackendReport) => {
    const from = report.parameters?.date_from;
    const to = report.parameters?.date_to;
    if (from && to) return `${new Date(from).toLocaleDateString()} - ${new Date(to).toLocaleDateString()}`;
    if (from) return `From ${new Date(from).toLocaleDateString()}`;
    if (to) return `Until ${new Date(to).toLocaleDateString()}`;
    return 'All live data';
  };

  const liveReportRows = liveReports.map((report) => {
    const meta = reportMeta[report.report_type] || { icon: FileText, color: '#22d3ee' };
    return {
    id: report.id,
    name: report.title,
    type: report.report_type,
    typeLabel: reportTypeLabels[report.report_type] || report.report_type,
    format: report.format,
    generated: new Date(report.created_at).toLocaleString(),
    createdAt: report.created_at,
    range: formatRange(report),
    by: report.generated_by_name || 'Current agent',
    status: formatStatus(report.status),
    rowCount: report.parameters?.row_count ?? 0,
    icon: meta.icon,
    color: meta.color,
  };
  });
  const filteredReports = liveReportRows.filter((r) => {
    const created = new Date(r.createdAt).getTime();
    const fromOk = !dateFrom || created >= new Date(`${dateFrom}T00:00:00`).getTime();
    const toOk = !dateTo || created <= new Date(`${dateTo}T23:59:59`).getTime();
    return (
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (typeFilter === 'all' || r.type === typeFilter) &&
      (statusFilter === 'all' || r.status.toLowerCase() === statusFilter) &&
      fromOk &&
      toOk
    );
  });
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const paginatedReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const reportTypes = Array.from(new Set(liveReports.map((report) => report.report_type)));
  const reportStatuses = Array.from(new Set(liveReports.map((report) => report.status)));
  const completedCount = liveReports.filter((report) => report.status === 'completed').length;
  const processingCount = liveReports.filter((report) => report.status === 'processing').length;
  const failedCount = liveReports.filter((report) => report.status === 'failed').length;
  const stats = [
    { label: 'Reports Generated', value: liveReports.length, change: 'Live database total', color: '#22d3ee', icon: FileText },
    { label: 'Completed Reports', value: completedCount, change: `${processingCount} processing`, color: '#22c55e', icon: Download },
    { label: 'Scheduled Reports', value: liveSchedules.length, change: `${liveSchedules.filter((schedule) => schedule.is_active).length} active`, color: '#a78bfa', icon: Clock },
    { label: 'Failed Reports', value: failedCount, change: 'From report status', color: '#f59e0b', icon: AlertTriangle },
  ];
  const visiblePopularReports = showAllPopularReports ? popularReports : popularReports.slice(0, 3);
  const visibleSchedules = showAllSchedules ? liveSchedules : liveSchedules.slice(0, 3);

  const scheduleText = (schedule: BackendSchedule) => {
    const time = schedule.time_of_day;
    if (schedule.frequency === 'weekly') return `Every ${weekdays[schedule.day_of_week ?? 0]} at ${time}`;
    if (schedule.frequency === 'monthly') return `Every month on day ${schedule.day_of_month || 1} at ${time}`;
    if (schedule.frequency === 'once') return `One time at ${time}`;
    return `Every day at ${time}`;
  };

  const openScheduleEditor = (schedule?: BackendSchedule) => {
    if (schedule) {
      setEditingScheduleId(schedule.id);
      setScheduleForm({
        title: schedule.title,
        report_type: schedule.report_type,
        format: schedule.format,
        frequency: schedule.frequency,
        time_of_day: schedule.time_of_day,
        day_of_week: String(schedule.day_of_week ?? 0),
        day_of_month: String(schedule.day_of_month ?? 1),
        date_from: schedule.date_from ? schedule.date_from.slice(0, 10) : '',
        date_to: schedule.date_to ? schedule.date_to.slice(0, 10) : '',
      });
    } else {
      setEditingScheduleId(null);
      setScheduleForm({
        title: 'Water Quality Summary',
        report_type: 'water_quality',
        format: 'pdf',
        frequency: 'daily',
        time_of_day: '08:00',
        day_of_week: '0',
        day_of_month: '1',
        date_from: '',
        date_to: '',
      });
    }
    setScheduleEditorOpen(true);
  };

  const generateAndDownload = async (report: { name: string; type?: string }, format: 'pdf' | 'excel') => {
    if (!report.type) {
      alert('This report type is not connected to live report generation yet.');
      return;
    }
    try {
      const session = getAuthSession();
      if (!session) return;
      setGenerating(`${report.type}-${format}`);
      const created = await apiRequest<{ id: number; title: string; format: string }>('/reports', {
        method: 'POST',
        token: session.token,
        body: {
          title: `${report.name} - ${new Date().toLocaleString()}`,
          report_type: report.type,
          scope: dateFrom || dateTo ? 'Selected date range' : 'Assigned sites',
          format,
          parameters: { generated_from: 'agent_reports', date_from: dateFrom || undefined, date_to: dateTo || undefined },
        },
      });
      const response = await fetch(`${config.apiBaseUrl.replace(/\/+$/, '')}/reports/${created.id}/download`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || `${created.title}.${format === 'excel' ? 'xls' : 'pdf'}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      await loadReports();
    } catch (err) {
      console.error('Failed to generate agent report:', err);
      alert('Failed to generate report.');
    } finally {
      setGenerating(null);
    }
  };

  const downloadExistingReport = async (report: { id: number; name: string; format?: string }) => {
    try {
      const session = getAuthSession();
      if (!session) return;
      const response = await fetch(`${config.apiBaseUrl.replace(/\/+$/, '')}/reports/${report.id}/download`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || `${report.name}.${report.format === 'excel' ? 'xls' : 'pdf'}`;
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

  const saveSchedule = async () => {
    try {
      const session = getAuthSession();
      if (!session) return;
      const payload = {
        title: scheduleForm.title,
        report_type: scheduleForm.report_type,
        format: scheduleForm.format,
        frequency: scheduleForm.frequency,
        time_of_day: scheduleForm.time_of_day,
        day_of_week: scheduleForm.frequency === 'weekly' ? Number(scheduleForm.day_of_week) : null,
        day_of_month: scheduleForm.frequency === 'monthly' ? Number(scheduleForm.day_of_month) : null,
        date_from: scheduleForm.date_from ? `${scheduleForm.date_from}T00:00:00` : null,
        date_to: scheduleForm.date_to ? `${scheduleForm.date_to}T23:59:59` : null,
        is_active: true,
      };
      await apiRequest(editingScheduleId ? `/reports/schedules/${editingScheduleId}` : '/reports/schedules', {
        method: editingScheduleId ? 'PUT' : 'POST',
        token: session.token,
        body: payload,
      });
      setScheduleEditorOpen(false);
      await loadSchedules();
    } catch (err) {
      console.error('Failed to save report schedule:', err);
      alert('Failed to save schedule.');
    }
  };

  const deleteSchedule = async (scheduleId: number) => {
    try {
      const session = getAuthSession();
      if (!session) return;
      await apiRequest(`/reports/schedules/${scheduleId}`, { method: 'DELETE', token: session.token });
      await loadSchedules();
    } catch (err) {
      console.error('Failed to delete report schedule:', err);
      alert('Failed to delete schedule.');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="auto-card-grid gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="metric-card glass rounded-xl p-4 card-hover animate-slide-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="metric-card-row mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className="metric-copy">
                  <p className="metric-label text-slate-400">{stat.label}</p>
                  <p className="metric-value font-bold text-white">{stat.value}</p>
                </div>
              </div>
              <p className="metric-desc text-[#22c55e]">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Reports Table */}
        <div className="xl:col-span-2 glass rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[#0d3660]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-white">All Reports</h3>
              <div className="relative">
                <button onClick={() => setShowGenerateMenu((value) => !value)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white font-medium transition-all btn-primary">
                  <Plus className="w-4 h-4" /> Generate Report
                </button>
                {showGenerateMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-[#0d3660] bg-[#031426] p-2 shadow-2xl">
                    {popularReports.map((report) => {
                      const Icon = report.icon;
                      return (
                        <button
                          key={report.type}
                          onClick={() => {
                            setShowGenerateMenu(false);
                            generateAndDownload(report, 'pdf');
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-[#071f35]"
                        >
                          <Icon className="h-4 w-4" style={{ color: report.color }} />
                          <span className="text-sm font-semibold text-white">{report.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search reports..."
                  className="w-full bg-[#071f35] border border-[#0d3660] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06b6d4] transition-all"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 rounded-lg border border-[#0d3660] bg-[#071f35] px-3 text-sm text-white outline-none"
              >
                <option value="all">All Report Types</option>
                {reportTypes.map((type) => (
                  <option key={type} value={type}>{reportTypeLabels[type] || type}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 rounded-lg border border-[#0d3660] bg-[#071f35] px-3 text-sm text-white outline-none"
              >
                <option value="all">All Status</option>
                {reportStatuses.map((status) => (
                  <option key={status} value={status}>{formatStatus(status)}</option>
                ))}
              </select>
              <button onClick={resetReports} className="flex h-10 items-center gap-2 rounded-lg bg-[#071f35] border border-[#0d3660] px-3 text-sm text-slate-400 hover:text-white transition-all">
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-[#0d3660] text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <label className="flex items-center gap-2">
              <span>From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-[#0d3660] bg-[#071f35] px-2 text-xs text-white outline-none"
              />
            </label>
            <label className="flex items-center gap-2">
              <span>To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-[#0d3660] bg-[#071f35] px-2 text-xs text-white outline-none"
              />
            </label>
            <span>{filteredReports.length} reports in selected timeline</span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-6 gap-2 px-5 py-2 text-xs font-medium text-slate-400 border-b border-[#0d3660]">
            <span className="col-span-2">Report Name</span>
            <span>Type</span>
            <span>Generated On</span>
            <span>Generated By</span>
            <span className="flex items-center justify-between">Status <span>Actions</span></span>
          </div>

          {/* Table rows */}
          <div>
            {paginatedReports.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                No live reports found for the selected filters.
              </div>
            )}
            {paginatedReports.map((report, i) => {
              const Icon = report.icon;
              return (
                <div
                  key={i}
                  className="grid grid-cols-6 gap-2 px-5 py-3 items-center border-b border-[#0d3660]/30 table-row-hover animate-slide-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: report.color + '20' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: report.color }} />
                    </div>
                    <span className="text-sm text-white truncate">{report.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 truncate" title={report.range}>{report.typeLabel}</span>
                  <span className="text-xs text-slate-400 truncate" title={report.range}>{report.generated.split(',')[0]} • {report.rowCount} rows</span>
                  <span className="text-xs text-slate-300 truncate">{report.by}</span>
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-medium ${report.status === 'Completed' ? 'text-[#22c55e]' : report.status === 'Processing' ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                      {report.status}
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => downloadExistingReport(report)}
                        className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-[#22d3ee] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <RowActionMenu 
                        onEdit={() => alert(`Access Denied: Only Owners and Managers can edit reports.`)}
                        onDelete={() => alert(`Access Denied: Only Owners and Managers can delete reports.`)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#0d3660]">
            <span className="text-xs text-slate-400">
              Showing {filteredReports.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} reports
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#071f35] transition-all disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-all ${currentPage === page ? 'bg-[#06b6d4] text-white' : 'text-slate-400 hover:bg-[#071f35] hover:text-white'}`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#071f35] transition-all disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 ml-2">{itemsPerPage} / page</span>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Popular Reports */}
          <div className="glass rounded-xl p-5 card-hover">
            <h3 className="text-base font-semibold text-white mb-4">Popular Reports</h3>
            <div className="space-y-3">
              {visiblePopularReports.map((r, i) => {
                const Icon = r.icon;
                return (
                  <div key={i} className="rounded-lg bg-[#071f35]/50 p-3 transition-all hover:bg-[#071f35]">
                    <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: r.color + '20' }}>
                      <Icon className="w-5 h-5" style={{ color: r.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.name}</p>
                      <p className="text-xs text-slate-400 truncate">{r.desc}</p>
                    </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {(['pdf', 'excel'] as const).map((format) => (
                        <button
                          key={format}
                          onClick={() => generateAndDownload(r, format)}
                          disabled={generating === `${r.type}-${format}`}
                          className="h-8 rounded-md border border-[#0d3660] text-[11px] font-semibold uppercase text-[#22d3ee] transition hover:bg-[#020b18]/70 disabled:opacity-60"
                        >
                          {generating === `${r.type}-${format}` ? 'Wait' : format}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowAllPopularReports((value) => !value)} className="flex items-center gap-1 text-sm text-[#06b6d4] mt-4 hover:text-[#22d3ee] transition-colors">
              View all reports →
            </button>
          </div>

          {/* Scheduled Reports */}
          <div className="glass rounded-xl p-5 card-hover">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Scheduled Reports</h3>
              <button onClick={() => openScheduleEditor()} className="rounded-md border border-[#0d3660] px-2 py-1 text-xs font-semibold text-[#22d3ee] hover:bg-[#071f35]">Add</button>
            </div>
            <div className="space-y-3">
              {visibleSchedules.length === 0 && (
                <div className="rounded-lg bg-[#071f35]/50 p-4 text-center text-xs text-slate-400">No schedules yet.</div>
              )}
              {visibleSchedules.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#071f35]/50 animate-slide-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#0d3660]">
                    <Clock className="w-4 h-4 text-[#22d3ee]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{r.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{scheduleText(r)}</p>
                    <p className="text-[10px] text-slate-500 truncate">Next: {r.next_run_at ? new Date(r.next_run_at).toLocaleString() : 'Paused'}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`text-[10px] ${r.is_active ? 'text-[#22c55e]' : 'text-slate-500'}`}>{r.is_active ? 'Active' : 'Paused'}</span>
                    <button onClick={() => openScheduleEditor(r)} className="text-[10px] text-[#22d3ee]">Edit</button>
                    <button onClick={() => deleteSchedule(r.id)} className="text-[10px] text-red-300">Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAllSchedules((value) => !value)} className="flex items-center gap-1 text-sm text-[#06b6d4] mt-4 hover:text-[#22d3ee] transition-colors">
              View all scheduled reports →
            </button>
          </div>
        </div>
      </div>

      {scheduleEditorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-xl border border-[#0d3660] bg-[#031426] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editingScheduleId ? 'Edit Scheduled Report' : 'Schedule Report'}</h3>
              <button onClick={() => setScheduleEditorOpen(false)} className="rounded-md border border-[#0d3660] px-3 py-1 text-sm text-slate-300 hover:bg-[#071f35]">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs text-slate-400">Report Name</span>
                <input value={scheduleForm.title} onChange={(event) => setScheduleForm({ ...scheduleForm, title: event.target.value })} className="h-10 w-full rounded-lg border border-[#0d3660] bg-[#071f35] px-3 text-sm text-white outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-400">Report Type</span>
                <select value={scheduleForm.report_type} onChange={(event) => setScheduleForm({ ...scheduleForm, report_type: event.target.value })} className="h-10 w-full rounded-lg border border-[#0d3660] bg-[#071f35] px-3 text-sm text-white outline-none">
                  {popularReports.map((report) => (
                    <option key={report.type} value={report.type}>{report.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-400">Format</span>
                <select value={scheduleForm.format} onChange={(event) => setScheduleForm({ ...scheduleForm, format: event.target.value })} className="h-10 w-full rounded-lg border border-[#0d3660] bg-[#071f35] px-3 text-sm text-white outline-none">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-400">Frequency</span>
                <select value={scheduleForm.frequency} onChange={(event) => setScheduleForm({ ...scheduleForm, frequency: event.target.value })} className="h-10 w-full rounded-lg border border-[#0d3660] bg-[#071f35] px-3 text-sm text-white outline-none">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="once">One time</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-400">Time</span>
                <input type="time" value={scheduleForm.time_of_day} onChange={(event) => setScheduleForm({ ...scheduleForm, time_of_day: event.target.value })} className="h-10 w-full rounded-lg border border-[#0d3660] bg-[#071f35] px-3 text-sm text-white outline-none" />
              </label>
              {scheduleForm.frequency === 'weekly' && (
                <label className="space-y-1">
                  <span className="text-xs text-slate-400">Day</span>
                  <select value={scheduleForm.day_of_week} onChange={(event) => setScheduleForm({ ...scheduleForm, day_of_week: event.target.value })} className="h-10 w-full rounded-lg border border-[#0d3660] bg-[#071f35] px-3 text-sm text-white outline-none">
                    {weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}
                  </select>
                </label>
              )}
              {scheduleForm.frequency === 'monthly' && (
                <label className="space-y-1">
                  <span className="text-xs text-slate-400">Month Day</span>
                  <input type="number" min="1" max="28" value={scheduleForm.day_of_month} onChange={(event) => setScheduleForm({ ...scheduleForm, day_of_month: event.target.value })} className="h-10 w-full rounded-lg border border-[#0d3660] bg-[#071f35] px-3 text-sm text-white outline-none" />
                </label>
              )}
              <label className="space-y-1">
                <span className="text-xs text-slate-400">Data From</span>
                <input type="date" value={scheduleForm.date_from} onChange={(event) => setScheduleForm({ ...scheduleForm, date_from: event.target.value })} className="h-10 w-full rounded-lg border border-[#0d3660] bg-[#071f35] px-3 text-sm text-white outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-400">Data To</span>
                <input type="date" value={scheduleForm.date_to} onChange={(event) => setScheduleForm({ ...scheduleForm, date_to: event.target.value })} className="h-10 w-full rounded-lg border border-[#0d3660] bg-[#071f35] px-3 text-sm text-white outline-none" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setScheduleEditorOpen(false)} className="rounded-lg border border-[#0d3660] px-4 py-2 text-sm text-slate-300 hover:bg-[#071f35]">Cancel</button>
              <button onClick={saveSchedule} className="rounded-lg bg-[#06b6d4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0891b2]">Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
