import { useState } from 'react';
import {
  FileText,
  Download,
  MoreVertical,
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
  Thermometer,
  AlertTriangle,
} from 'lucide-react';

const stats = [
  { label: 'Reports Generated', value: 43, change: '++12% vs last 7 days', color: '#22d3ee', icon: FileText },
  { label: 'Reports Downloaded', value: 36, change: '++8% vs last 7 days', color: '#22c55e', icon: Download },
  { label: 'Scheduled Reports', value: 15, change: '++5% vs last 7 days', color: '#a78bfa', icon: Clock },
  { label: 'Failed Reports', value: 2, change: '++2% vs last 7 days', color: '#f59e0b', icon: AlertTriangle },
];

const reports = [
  { name: 'Water Quality Summary', type: 'Water Quality', generated: 'May 18, 2024 10:30 AM', range: 'May 12 - May 18, 2024', by: 'Rahul Verma', status: 'Completed', icon: Waves, color: '#22d3ee' },
  { name: 'Device Performance Report', type: 'Performance', generated: 'May 18, 2024 09:15 AM', range: 'May 12 - May 18, 2024', by: 'Priya Sharma', status: 'Completed', icon: BarChart3, color: '#22c55e' },
  { name: 'Alert Summary Report', type: 'Alerts', generated: 'May 18, 2024 08:45 AM', range: 'May 12 - May 18, 2024', by: 'Arjun Mehta', status: 'Completed', icon: Bell, color: '#f59e0b' },
  { name: 'Feed Analysis Summary', type: 'Feed Analysis', generated: 'May 17, 2024 06:20 PM', range: 'May 11 - May 17, 2024', by: 'Sneha Reddy', status: 'Completed', icon: FileText, color: '#a78bfa' },
  { name: 'Growth Report', type: 'Growth', generated: 'May 17, 2024 05:10 PM', range: 'May 11 - May 17, 2024', by: 'Vikram Kumar', status: 'Completed', icon: TrendingUp, color: '#34d399' },
  { name: 'Incident Report', type: 'Incidents', generated: 'May 17, 2024 04:35 PM', range: 'May 11 - May 17, 2024', by: 'Rahul Verma', status: 'Failed', icon: AlertTriangle, color: '#ef4444' },
  { name: 'Water Quality Trend', type: 'Water Quality', generated: 'May 17, 2024 03:20 PM', range: 'May 11 - May 17, 2024', by: 'Priya Sharma', status: 'Completed', icon: Waves, color: '#22d3ee' },
  { name: 'Temperature Analysis', type: 'Temperature', generated: 'May 16, 2024 11:45 AM', range: 'May 10 - May 16, 2024', by: 'Arjun Mehta', status: 'Completed', icon: Thermometer, color: '#f59e0b' },
  { name: 'Daily Summary Report', type: 'Summary Report', generated: 'May 16, 2024 10:30 AM', range: 'May 15 - May 15, 2024', by: 'Sneha Reddy', status: 'Completed', icon: FileText, color: '#3b82f6' },
  { name: 'Month Over Month Report', type: 'Comparative', generated: 'May 15, 2024 04:50 PM', range: 'Apr 15 - May 15, 2024', by: 'Vikram Kumar', status: 'Completed', icon: BarChart3, color: '#22c55e' },
];

const popularReports = [
  { name: 'Water Quality Summary', desc: 'Overview of key water quality parameters', icon: Waves, color: '#22d3ee' },
  { name: 'Device Performance Report', desc: 'Performance and status of all devices', icon: BarChart3, color: '#22c55e' },
  { name: 'Alert Summary Report', desc: 'Summary of all alerts and notifications', icon: Bell, color: '#f59e0b' },
  { name: 'Feed Analysis Report', desc: 'Feed consumption and feed analysis', icon: FileText, color: '#a78bfa' },
  { name: 'Growth Report', desc: 'Fish growth and biomass analysis', icon: TrendingUp, color: '#34d399' },
];

const scheduledReports = [
  { name: 'Daily Summary Report', schedule: 'Every day at 08:00 AM', status: 'Active' },
  { name: 'Water Quality Report', schedule: 'Every Monday at 09:00 AM', status: 'Active' },
  { name: 'Device Performance Report', schedule: 'Every Monday at 10:00 AM', status: 'Active' },
  { name: 'Feed Analysis Report', schedule: 'Every Wednesday at 11:00 AM', status: 'Active' },
  { name: 'Growth Report', schedule: 'Every Friday at 02:00 PM', status: 'Active' },
];

export default function ReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

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
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white font-medium transition-all btn-primary">
                <Plus className="w-4 h-4" /> Generate Report
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reports..."
                  className="w-full bg-[#071f35] border border-[#0d3660] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06b6d4] transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#071f35] border border-[#0d3660] text-sm text-white">
                All Report Types <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#071f35] border border-[#0d3660] text-sm text-white">
                All Status <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#071f35] border border-[#0d3660] text-sm text-slate-400 hover:text-white transition-all">
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>

          {/* Filter row */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-[#0d3660] text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>May 12 - May 18, 2024</span>
              <ChevronDown className="w-3 h-3" />
            </div>
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
            {reports
              .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
              .map((report, i) => {
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
                    <span className="text-xs text-slate-400 truncate">{report.type}</span>
                    <span className="text-xs text-slate-400 truncate">{report.generated.split(',')[0]}</span>
                    <span className="text-xs text-slate-300 truncate">{report.by}</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-medium ${report.status === 'Completed' ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                        {report.status}
                      </span>
                      <div className="flex items-center gap-1">
                        <button className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-[#22d3ee] transition-colors">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white transition-colors">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#0d3660]">
            <span className="text-xs text-slate-400">Showing 1 to 10 of 43 reports</span>
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#071f35] transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-all ${currentPage === page ? 'bg-[#06b6d4] text-white' : 'text-slate-400 hover:bg-[#071f35] hover:text-white'}`}
                >
                  {page}
                </button>
              ))}
              <button className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#071f35] transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 ml-2">10 / page</span>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Popular Reports */}
          <div className="glass rounded-xl p-5 card-hover">
            <h3 className="text-base font-semibold text-white mb-4">Popular Reports</h3>
            <div className="space-y-3">
              {popularReports.map((r, i) => {
                const Icon = r.icon;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#071f35]/50 hover:bg-[#071f35] transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: r.color + '20' }}>
                      <Icon className="w-5 h-5" style={{ color: r.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.name}</p>
                      <p className="text-xs text-slate-400 truncate">{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="flex items-center gap-1 text-sm text-[#06b6d4] mt-4 hover:text-[#22d3ee] transition-colors">
              View all reports →
            </button>
          </div>

          {/* Scheduled Reports */}
          <div className="glass rounded-xl p-5 card-hover">
            <h3 className="text-base font-semibold text-white mb-4">Scheduled Reports</h3>
            <div className="space-y-3">
              {scheduledReports.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#071f35]/50 animate-slide-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#0d3660]">
                    <Clock className="w-4 h-4 text-[#22d3ee]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{r.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{r.schedule}</p>
                  </div>
                  <span className="text-[10px] text-[#22c55e] shrink-0">{r.status}</span>
                </div>
              ))}
            </div>
            <button className="flex items-center gap-1 text-sm text-[#06b6d4] mt-4 hover:text-[#22d3ee] transition-colors">
              View all scheduled reports →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
