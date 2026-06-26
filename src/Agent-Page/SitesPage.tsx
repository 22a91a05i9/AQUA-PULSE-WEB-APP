import { useEffect, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Eye,
  MoreVertical,
  X,
  MapPin,
  Cpu,
  Waves,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';

interface Site {
  id: string;
  name: string;
  location: string;
  region: string;
  ponds: number;
  devices: number;
  status: 'active' | 'inactive' | 'critical';
  lastUpdated: string;
  establishedOn: string;
  siteType: string;
  totalArea: string;
  operator: string;
  contactNumber: string;
  email: string;
}



const statusColors: Record<string, string> = {
  active: '#22c55e',
  inactive: '#f59e0b',
  critical: '#ef4444',
};

export default function SitesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const session = getAuthSession();
        if (session) {
          const res = await apiRequest<any>('/agent/overview', {
            token: session.token,
          });
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load agent overview:', err);
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

  const sitesList: Site[] = (data?.assigned_sites || []).map((site: any) => {
    const siteDevices = (data?.devices || []).filter((d: any) => d.site_id === site.id);
    const siteAlerts = (data?.alerts || []).filter((a: any) => a.site_id === site.id && a.status === 'open');
    
    let status: 'active' | 'inactive' | 'critical' = 'active';
    if (siteAlerts.some((a: any) => a.severity === 'critical')) {
      status = 'critical';
    } else if (siteDevices.length === 0 || siteDevices.every((d: any) => d.status === 'inactive' || d.status === 'offline')) {
      status = 'inactive';
    }

    const siteReadings = (data?.recent_readings || []).filter((r: any) => r.site_id === site.id);
    const lastUpdated = siteReadings.length > 0 
      ? new Date(siteReadings[0].collected_at).toLocaleString() 
      : 'No readings yet';

    return {
      id: site.id.toString(),
      name: site.name,
      location: site.location_text || 'Unknown Location',
      region: 'South India',
      ponds: 1, 
      devices: siteDevices.length,
      status,
      lastUpdated,
      establishedOn: 'N/A',
      siteType: site.site_type || 'Freshwater',
      totalArea: 'N/A',
      operator: 'Assigned Agent',
      contactNumber: 'N/A',
      email: 'N/A',
    };
  });

  const filteredSites = sitesList.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
    const matchesRegion = regionFilter === 'all' || site.region === regionFilter;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  return (
    <div className="space-y-6 animate-fade-in relative text-slate-350">
      {/* Header Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search sites by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-700/50 bg-[#041526]/50 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#06b6d4] transition"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3 justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-3 text-sm text-slate-300 focus:outline-none focus:border-[#06b6d4]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-700/50 bg-[#041526]/50 px-3 text-sm text-slate-300 focus:outline-none focus:border-[#06b6d4]"
          >
            <option value="all">All Regions</option>
            <option value="South India">South India</option>
            <option value="East India">East India</option>
            <option value="North India">North India</option>
          </select>

          <button className="h-10 px-3 flex items-center gap-2 rounded-lg border border-slate-700/50 bg-[#041526]/50 text-sm text-slate-300 hover:text-white transition">
            <SlidersHorizontal className="w-4 h-4" />
            <span>More Filters</span>
          </button>

          <div className="flex border border-slate-700/50 rounded-lg overflow-hidden bg-[#041526]/50">
            <button className="p-2.5 text-slate-400 hover:text-white bg-[#06b6d4]/10 text-[#22d3ee]">
              <List className="w-4 h-4" />
            </button>
            <button className="p-2.5 text-slate-400 hover:text-white">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sites List Table */}
      <div className="glass rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#041526]/30">
                <th className="py-4 px-6">Site Name</th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6">Region</th>
                <th className="py-4 px-6 text-center">Ponds</th>
                <th className="py-4 px-6 text-center">Devices</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Last Updated</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {filteredSites.map((site) => (
                <tr
                  key={site.id}
                  className="table-row-hover hover:bg-[#071f35]/30 cursor-pointer transition"
                  onClick={() => setSelectedSite(site)}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg overflow-hidden shrink-0"
                        style={{
                          backgroundImage: "url('/images/dashboard_attached.png')",
                          backgroundSize: '265%',
                          backgroundPosition: '23.4% 32.5%',
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                      <div>
                        <div className="font-semibold text-white">{site.name}</div>
                        <div className="text-xs text-slate-500">{site.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 max-w-xs truncate">{site.location}</td>
                  <td className="py-4 px-6">{site.region}</td>
                  <td className="py-4 px-6 text-center font-medium text-white">{site.ponds}</td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="font-medium text-white">{site.devices}</span>
                      <span className="text-xs text-slate-500">Online</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                      style={{
                        backgroundColor: statusColors[site.status] + '20',
                        color: statusColors[site.status],
                        border: `1px solid ${statusColors[site.status]}30`,
                      }}
                    >
                      {site.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-400">{site.lastUpdated}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedSite(site)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="View Site Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#041526]/10">
          <div className="text-xs text-slate-400">
            Showing 1 to {filteredSites.length} of {sitesList.length} sites
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Rows per page</span>
              <select className="bg-transparent border-none text-xs text-white focus:outline-none">
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded-lg text-xs font-medium bg-[#06b6d4] text-white">1</button>
              <button className="w-7 h-7 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">2</button>
              <button className="w-7 h-7 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">3</button>
              <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay for Site Details (Pic 2) */}
      {selectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#06b6d4]/30 bg-[#041526] p-6 shadow-2xl z-50 text-slate-300">
            {/* Close Button */}
            <button
              onClick={() => setSelectedSite(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header Title */}
            <h2 className="text-xl font-bold text-white mb-6">Site Details</h2>

            {/* Farm Top Banner */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div
                className="w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0"
                style={{
                  backgroundImage: "url('/images/dashboard_attached.png')",
                  backgroundSize: '265%',
                  backgroundPosition: '23.4% 32.5%',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white">{selectedSite.name}</h3>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase"
                      style={{
                        backgroundColor: statusColors[selectedSite.status] + '20',
                        color: statusColors[selectedSite.status],
                        border: `1px solid ${statusColors[selectedSite.status]}30`,
                      }}
                    >
                      {selectedSite.status}
                    </span>
                  </div>
                  <div className="text-slate-400 mt-1 text-sm font-medium">{selectedSite.id}</div>
                  <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-sm font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Online</span>
                  </div>
                </div>

                {/* Four Quick stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-[#071f35]/50 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
                    <Waves className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Ponds</div>
                      <div className="text-sm font-bold text-white">{selectedSite.ponds}</div>
                    </div>
                  </div>
                  <div className="bg-[#071f35]/50 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
                    <Cpu className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Devices</div>
                      <div className="text-sm font-bold text-white">{selectedSite.devices}</div>
                    </div>
                  </div>
                  <div className="bg-[#071f35]/50 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
                    <MapPin className="w-5 h-5 text-purple-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Region</div>
                      <div className="text-sm font-bold text-white truncate max-w-[90px]">{selectedSite.region}</div>
                    </div>
                  </div>
                  <div className="bg-[#071f35]/50 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Last Updated</div>
                      <div className="text-xs font-bold text-white truncate max-w-[80px]">May 16, 2024</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid of detailed Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Site Information */}
              <div className="glass rounded-xl p-5 border border-slate-800">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Site Information</h4>
                <div className="grid grid-cols-2 gap-y-3.5 text-xs sm:text-sm">
                  <div className="text-slate-500">Location</div>
                  <div className="text-white text-right truncate max-w-[200px]" title={selectedSite.location}>
                    {selectedSite.location.split(',')[0]}
                  </div>

                  <div className="text-slate-500">Region</div>
                  <div className="text-white text-right">{selectedSite.region}</div>

                  <div className="text-slate-500">Established On</div>
                  <div className="text-white text-right">{selectedSite.establishedOn}</div>

                  <div className="text-slate-500">Site Type</div>
                  <div className="text-white text-right">{selectedSite.siteType}</div>

                  <div className="text-slate-500">Total Area</div>
                  <div className="text-white text-right">{selectedSite.totalArea}</div>

                  <div className="text-slate-500">Operator</div>
                  <div className="text-white text-right">{selectedSite.operator}</div>

                  <div className="text-slate-500">Contact Number</div>
                  <div className="text-white text-right">{selectedSite.contactNumber}</div>

                  <div className="text-slate-500">Email</div>
                  <div className="text-[#22d3ee] text-right truncate max-w-[180px]" title={selectedSite.email}>
                    {selectedSite.email}
                  </div>
                </div>
              </div>

              {/* Water Quality Overview */}
              <div className="glass rounded-xl p-5 border border-slate-800">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Water Quality Overview</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="text-slate-300">Temperature (°C)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs">📈</span>
                      <span className="font-semibold text-white">28.1</span>
                      <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10">Normal</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-slate-300">pH Level</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs">📈</span>
                      <span className="font-semibold text-white">8.2</span>
                      <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10">Normal</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-slate-300">Dissolved Oxygen (mg/L)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs">📈</span>
                      <span className="font-semibold text-white">5.4</span>
                      <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10">Good</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span className="text-slate-300">Turbidity (NTU)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs">📈</span>
                      <span className="font-semibold text-white">24</span>
                      <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10">Normal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pond Summary */}
              <div className="glass rounded-xl p-5 border border-slate-800">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Pond Summary</h4>
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Active', value: 10, color: '#22c55e' },
                            { name: 'Inactive', value: 1, color: '#f59e0b' },
                            { name: 'Maintenance', value: 1, color: '#6b7280' },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={42}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#6b7280" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-white">{selectedSite.ponds}</span>
                      <span className="text-[9px] text-slate-400">Total</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                        <span className="text-slate-400">Active</span>
                      </div>
                      <span className="text-white font-medium">10 (83%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                        <span className="text-slate-400">Inactive</span>
                      </div>
                      <span className="text-white font-medium">1 (8%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#6b7280]" />
                        <span className="text-slate-400">Maintenance</span>
                      </div>
                      <span className="text-white font-medium">1 (8%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Summary */}
              <div className="glass rounded-xl p-5 border border-slate-800">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Device Summary</h4>
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Online', value: 23, color: '#22c55e' },
                            { name: 'Offline', value: 2, color: '#ef4444' },
                            { name: 'Maintenance', value: 1, color: '#6b7280' },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={42}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#6b7280" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-white">{selectedSite.devices}</span>
                      <span className="text-[9px] text-slate-400">Total</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                        <span className="text-slate-400">Online</span>
                      </div>
                      <span className="text-white font-medium">23 (88%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                        <span className="text-slate-400">Offline</span>
                      </div>
                      <span className="text-white font-medium">2 (8%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#6b7280]" />
                        <span className="text-slate-400">Maintenance</span>
                      </div>
                      <span className="text-white font-medium">1 (4%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Alerts (Modal Bottom) */}
            <div className="glass rounded-xl p-5 border border-slate-800 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recent Alerts</h4>
                <button className="text-xs text-[#06b6d4] hover:text-[#22d3ee] font-semibold transition">View All Alerts</button>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-amber-500">⚠️</span>
                    <span className="font-medium text-white">High Turbidity</span>
                    <span className="text-xs text-slate-500">Pond 03</span>
                  </div>
                  <span className="text-xs text-slate-400">May 16, 2024 09:15 AM</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-red-500">⚠️</span>
                    <span className="font-medium text-white">Low Dissolved Oxygen</span>
                    <span className="text-xs text-slate-500">Pond 07</span>
                  </div>
                  <span className="text-xs text-slate-400">May 16, 2024 08:45 AM</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#3b82f6]">ℹ️</span>
                    <span className="font-medium text-white">Device Battery Low (20%)</span>
                    <span className="text-xs text-slate-500">Pond 05 - Water Pump</span>
                  </div>
                  <span className="text-xs text-slate-400">May 16, 2024 07:30 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
