import { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  CalendarDays,
  Eye,
  Filter,
  MapPin,
  MoreVertical,
  PauseCircle,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
  Waves,
  Wrench,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { RowActionMenu } from '../lib/tableActions';
import { DialogButton, DialogField, ProjectDialog } from '../lib/projectDialog';

type Site = {
  id: string;
  pond: string;
  name: string;
  location: string;
  water: string;
  area: string;
  ponds: number;
  devices: number;
  agents: number;
  score: number;
  status: 'Healthy' | 'Warning' | 'Maintenance';
  type: string;
};

const siteImage = '/images/dashboard_attached.png';

function formatSiteType(siteType: string | null | undefined): string {
  const normalized = String(siteType || '').trim().toLowerCase();
  if (normalized === 'swimming_pool') return 'Swimming Pool';
  if (normalized === 'pond') return 'Pond';
  if (!normalized) return 'Site';
  return normalized
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeArea(value: string): string | null {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*acres?$/i);
  if (!match) return null;
  const acres = Number(match[1]);
  if (!Number.isFinite(acres) || acres <= 0) return null;
  return `${acres.toFixed(1)} acres`;
}

function formatSeen(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

const defaultSites: Site[] = [
  { id: 'GVF-001', pond: 'Pond 01', name: 'Green Valley Farm', location: '123 Green Valley Rd, Gorantla, West Godavari, Andhra Pradesh 534102', water: 'Good', area: '4.2 acres', ponds: 12, devices: 26, agents: 5, score: 85, status: 'Healthy', type: 'Freshwater' },
  { id: 'BLA-002', pond: 'Pond 02', name: 'Blue Lake Aquafarms', location: '67/4 Blue Beach, Nellore, Andhra Pradesh 524 003', water: 'Good', area: '4 Acres', ponds: 8, devices: 19, agents: 4, score: 78, status: 'Healthy', type: 'Brackishwater' },
  { id: 'SAP-003', pond: 'Pond 03', name: 'Sunrise Aqua Park', location: '789 Sunrise Blvd, Kakinada, East Godavari, Andhra Pradesh 533001', water: 'Good', area: '5 Acres', ponds: 15, devices: 32, agents: 6, score: 82, status: 'Healthy', type: 'Freshwater' },
  { id: 'OCF-004', pond: 'Pond 04', name: 'Oceanic Fisheries', location: '321 Ocean Drive, Visakhapatnam, Andhra Pradesh 530017', water: 'Good', area: '10 Acres', ponds: 10, devices: 22, agents: 5, score: 80, status: 'Warning', type: 'Brackishwater' },
  { id: 'MVF-005', pond: 'Pond 05', name: 'Mountain View Farm', location: '864 Hill Top Road, Tuni, East Godavari, Andhra Pradesh 533401', water: 'Fair', area: '6 Acres', ponds: 6, devices: 12, agents: 2, score: 65, status: 'Maintenance', type: 'Freshwater' },
  { id: 'CAH-006', pond: 'Pond 06', name: 'Coastal Aqua Hub', location: '987 Coastal Highway, Puri, Odisha 752002', water: 'Good', area: '3 Acres', ponds: 5, devices: 10, agents: 3, score: 88, status: 'Healthy', type: 'Brackishwater' },
];

const pondsData: Record<string, {
  name: string;
  status: string;
  purpose: string;
  devicesCount: string;
  score: string;
  updatedAt: string;
  details: string;
  fishCount: string;
  feedToday: string;
  aerators: string;
  lastInspection: string;
  assignedAgent: string;
}> = {
  'Pond 01': {
    name: 'Pond 01',
    status: 'Healthy',
    purpose: 'Water Quality',
    devicesCount: '8 Devices',
    score: '85',
    updatedAt: 'Updated 2 min ago',
    details: 'Section B • 0.35 acres • 6.5 ft depth',
    fishCount: '18,400',
    feedToday: '64 kg',
    aerators: '3 Online',
    lastInspection: 'May 18, 2024',
    assignedAgent: 'Agent-001',
  },
  'Pond 02': {
    name: 'Pond 02',
    status: 'Healthy',
    purpose: 'Nursery',
    devicesCount: '6 Devices',
    score: '82',
    updatedAt: 'Updated 4 min ago',
    details: 'Section A • 0.25 acres • 5.0 ft depth',
    fishCount: '12,000',
    feedToday: '45 kg',
    aerators: '2 Online',
    lastInspection: 'May 18, 2024',
    assignedAgent: 'Agent-001',
  },
  'Pond 03': {
    name: 'Pond 03',
    status: 'Warning',
    purpose: 'Grow-out',
    devicesCount: '5 Devices',
    score: '74',
    updatedAt: 'Updated 8 min ago',
    details: 'Section A • 0.40 acres • 5.5 ft depth',
    fishCount: '15,000',
    feedToday: '58 kg',
    aerators: '1 Online',
    lastInspection: 'May 18, 2024',
    assignedAgent: 'Agent-002',
  },
};

const devicesData: Record<string, {
  id: string;
  name: string;
  type: string;
  pond: string;
  status: string;
  signal: string;
  battery: string;
  last: string;
  firmware: string;
  serial: string;
  mac: string;
  installedOn: string;
  lastCalib: string;
  nextCalib: string;
  readings: [string, string][];
}> = {
  'DEV-1001': {
    id: 'DEV-1001',
    name: 'Water Quality Sensor 1',
    type: 'Water Quality',
    pond: 'Pond 01',
    status: 'Online',
    signal: '▮▮▮▮▮',
    battery: '88%',
    last: '2 min ago',
    firmware: 'v2.4.1',
    serial: 'WQS-1001-23A9F',
    mac: 'AC:23:F4:8D:1A:2B',
    installedOn: 'Apr 10, 2024',
    lastCalib: 'May 10, 2024',
    nextCalib: 'Jun 10, 2024',
    readings: [
      ['Water Quality Score', '85 (Good)'],
      ['Dissolved Oxygen', '6.8 mg/L'],
      ['pH Level', '7.2'],
      ['Temperature', '23.5 °C'],
      ['Turbidity', '12 NTU'],
      ['Conductivity', '520 µS/cm'],
    ],
  },
};

export default function SitesPage() {
  const [sitesList, setSitesList] = useState<Site[]>([]);
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [creatingSite, setCreatingSite] = useState(false);
  const [farmTypes, setFarmTypes] = useState<any[]>([]);
  const [allSpecies, setAllSpecies] = useState<any[]>([]);
  const [deviceList, setDeviceList] = useState<any[]>([]);
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [readingsList, setReadingsList] = useState<any[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [notice, setNotice] = useState('');
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [siteToEdit, setSiteToEdit] = useState<Site | null>(null);
  const [editSiteForm, setEditSiteForm] = useState({ name: '', location: '' });

  const handleDeleteSite = async (site: Site) => {
    const id = site.id.replace('SITE-', '');
    try {
      const session = getAuthSession();
      if (!session) return;
      await apiRequest(`/owner/sites/${id}`, {
        method: 'DELETE',
        token: session.token,
      });
      setSitesList((prev) => prev.filter((s) => s.id !== site.id));
      setNotice(`Site "${site.name}" deleted successfully.`);
      setSiteToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete site:', err);
      setNotice(err?.detail || err?.message || 'Failed to delete site.');
    }
  };

  const handleEditSite = async (site: Site) => {
    const id = site.id.replace('SITE-', '');
    try {
      const session = getAuthSession();
      if (!session) return;
      const updated = await apiRequest<any>(`/owner/sites/${id}`, {
        method: 'PUT',
        token: session.token,
        body: {
          name: editSiteForm.name.trim(),
          location_text: editSiteForm.location.trim(),
        },
      });
      setSitesList((prev) =>
        prev.map((s) =>
          s.id === site.id
            ? { ...s, name: updated.name, location: updated.location_text }
            : s
        )
      );
      setNotice(`Site "${site.name}" updated successfully.`);
      setSiteToEdit(null);
    } catch (err: any) {
      console.error('Failed to update site:', err);
      setNotice(err?.detail || err?.message || 'Failed to update site.');
    }
  };

  // Form Fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [siteType, setSiteType] = useState('pond');
  const [farmTypeId, setFarmTypeId] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [area, setArea] = useState('4.0 acres');
  const filteredSpecies = allSpecies.filter((species) => String(species.farm_type_id) === farmTypeId);

  const loadData = async () => {
    const session = getAuthSession();
    if (!session) {
      setSitesList(defaultSites);
      setLoading(false);
      return;
    }

    try {
      const [res, farmTypesRes, speciesRes] = await Promise.all([
        apiRequest<any>('/owner/overview', { token: session.token }),
        apiRequest<any[]>('/meta/farm-types', { token: session.token }),
        apiRequest<any[]>('/meta/species', { token: session.token }),
      ]);

      const devices = res.devices || [];
      const alerts = res.alerts || [];
      const readings = res.recent_readings || [];
      const agents = res.agents || [];
      const assignments = res.agent_assignments || [];

      setDeviceList(devices);
      setAlertsList(alerts);
      setReadingsList(readings);
      setAgentsList(agents);
      setAssignmentsList(assignments);
      setFarmTypes((farmTypesRes || []).filter((farmType: any) => farmType.code !== 'general'));
      setAllSpecies(speciesRes || []);

      const normalizedSites: Site[] = (res.sites || []).map((s: any) => {
        const siteDevicesCount = s.devices_count ?? 0;
        const siteAgentsCount = s.agents_count ?? 0;

        // Calculate dynamic water quality score for the site
        const siteReadings = readings.filter((r: any) => r.site_id === s.id);
        let siteScore = 80;
        let siteWater = 'Good';
        if (siteReadings.length > 0) {
          let scoreSum = 0;
          siteReadings.slice(0, 5).forEach((r: any) => {
            let rScore = 100;
            if (r.ph < 6.5 || r.ph > 8.5) rScore -= 20;
            if (r.temperature_c < 20 || r.temperature_c > 35) rScore -= 20;
            if (r.turbidity > 150) rScore -= 30;
            scoreSum += rScore;
          });
          siteScore = Math.round(scoreSum / Math.min(siteReadings.length, 5));
          siteWater = siteScore >= 80 ? 'Good' : 'Warning';
        }

        // Calculate dynamic status for the site
        const siteAlerts = alerts.filter((a: any) => a.site_id === s.id && a.status === 'open');
        let siteStatus = 'Healthy';
        if (siteAlerts.some((a: any) => a.severity === 'critical')) {
          siteStatus = 'Warning'; // Using Warning style class
        } else if (siteAlerts.length > 0) {
          siteStatus = 'Warning';
        }

        return {
          id: `SITE-${s.id}`,
          pond: `Site #${s.id}`,
          name: s.name || 'Unnamed Site',
          location: s.location_text || 'No location set',
          water: siteWater,
          area: s.custom_thresholds?.area || '4.0 acres',
          ponds: 1,
          devices: siteDevicesCount,
          agents: siteAgentsCount,
          score: siteScore,
          status: siteStatus,
          type: formatSiteType(s.site_type),
        };
      });

      setSitesList(normalizedSites);
    } catch (err) {
      console.error('Failed to retrieve overview data from DB, using fallback defaults:', err);
      setSitesList(defaultSites);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSites = useMemo(
    () =>
      sitesList.filter((site) => {
        const pond = site.pond || '';
        const name = site.name || '';
        const location = site.location || '';
        const matchesSearch = [pond, name, location].some((item) =>
          item.toLowerCase().includes(search.toLowerCase())
        );
        const matchesStatus = statusFilter === 'all' || site.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesRegion = regionFilter === 'all' || site.location.toLowerCase().includes(regionFilter.toLowerCase());
        return matchesSearch && matchesStatus && matchesRegion;
      }).sort((a, b) => {
        const aId = Number(a.id.replace('SITE-', ''));
        const bId = Number(b.id.replace('SITE-', ''));
        return sortOrder === 'asc' ? aId - bId : bId - aId;
      }),
    [search, sitesList, statusFilter, regionFilter, sortOrder],
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingSite) return;
    if (sitesList.some((site) => site.name.trim().toLowerCase() === name.trim().toLowerCase() && site.location.trim().toLowerCase() === location.trim().toLowerCase())) {
      setNotice('Site already created.');
      return;
    }
    if (siteType === 'pond' && (!farmTypeId || !speciesId)) {
      setNotice('Select farm type and species for pond sites.');
      return;
    }
    const normalizedArea = normalizeArea(area);
    if (!normalizedArea) {
      setNotice('Enter farming area in acres, for example 4.0 acres or 40 acres.');
      return;
    }
    setCreatingSite(true);
    try {
      const session = getAuthSession();
      if (!session) return;

      const body: Record<string, unknown> = {
          name,
          site_type: siteType,
          location_text: location,
          custom_thresholds: { area: normalizedArea },
      };
      if (siteType === 'pond') {
        body.farm_type_id = Number(farmTypeId);
        body.species_id = Number(speciesId);
      }

      await apiRequest('/owner/sites', {
        method: 'POST',
        token: session.token,
        body,
      });

      setShowAddModal(false);
      setName('');
      setLocation('');
      setSiteType('pond');
      setFarmTypeId('');
      setSpeciesId('');
      setArea('4.0 acres');
      loadData();
    } catch (err: any) {
      setNotice(`Error creating site: ${err.message || String(err)}`);
    } finally {
      setCreatingSite(false);
    }
  };


  try {
    return (
      <div className="animate-fade-in space-y-4 text-slate-300 text-left">
        {notice && <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">{notice}</p>}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          <SiteStat icon={MapPin} label="Total Sites" value={String(sitesList.length)} desc="Synchronized with database" tone="text-sky-400 bg-sky-500/15" />
          <SiteStat icon={CheckCircle2} label="Active Sites" value={String(sitesList.filter(s => s.status === 'Healthy').length)} desc="All systems ok" tone="text-emerald-400 bg-emerald-500/15" />
          <SiteStat icon={PauseCircle} label="Inactive Sites" value="0" desc="No offline sites" tone="text-amber-400 bg-amber-500/15" />
          <SiteStat icon={Wrench} label="Maintenance" value="0" desc="No tasks queued" tone="text-violet-400 bg-violet-500/15" />
          <SiteStat icon={AlertTriangle} label="Critical Sites" value="0" desc="0 issues found" tone="text-red-400 bg-red-500/15" />
        </div>

        <div className="flex flex-wrap items-end gap-3 border-y border-[#0d3660]/50 py-4">
          <div className="relative min-w-[min(100%,20rem)] flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/50 pl-12 pr-4 text-sm text-white outline-none focus:border-cyan-400/80 transition" placeholder="Search sites by name or location..." />
          </div>
          {showAdvancedFilters && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 min-w-44 rounded-lg border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none"
              >
                <option value="all">All Status</option>
                <option value="Healthy">Healthy</option>
                <option value="Warning">Warning</option>
                <option value="Maintenance">Maintenance</option>
              </select>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="h-11 min-w-44 rounded-lg border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none"
              >
                <option value="all">All Regions</option>
                <option value="Nellore">Nellore</option>
                <option value="Bhimavaram">Bhimavaram</option>
                <option value="Godavari">Godavari</option>
              </select>
            </>
          )}
          <button 
            onClick={() => setShowAdvancedFilters(prev => !prev)}
            className={`flex h-11 items-center gap-3 rounded-lg border px-6 text-sm font-bold transition ${
              showAdvancedFilters ? 'border-[#06b6d4] text-[#22d3ee] bg-[#06b6d4]/10' : 'border-[#0d3660] text-white hover:bg-[#071f35]'
            }`}
          >
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex h-11 items-center gap-3 rounded-lg border border-[#0d3660] px-6 text-sm font-bold text-white transition hover:bg-[#071f35]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Sort: {sortOrder.toUpperCase()}
          </button>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="ml-auto flex h-11 items-center gap-3 rounded-lg bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-500 transition cursor-pointer"
          >
            <Plus className="h-5 w-5" />Add New Site
          </button>
        </div>

        <div className="space-y-2">
          {filteredSites.map((site) => (
            <section
              key={site.id}
              onClick={() => setSelectedSite(site)}
              className="glass grid grid-cols-[140px_1fr_370px_150px_112px] items-center gap-5 rounded-lg p-3 cursor-pointer hover:bg-[#071f35]/20 transition"
            >
              <div className="relative h-24 overflow-hidden rounded-lg">
                <img src={siteImage} alt="" className="h-full w-full object-cover" />
                <span className={`absolute bottom-2 left-2 rounded-full px-2 py-1 text-[10px] font-bold ${site.status === 'Warning' ? 'bg-amber-500/80 text-black' : site.status === 'Maintenance' ? 'bg-orange-500/80 text-black' : 'bg-emerald-500/80 text-white'}`}>{site.status}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{site.pond} {site.pond === 'Pond 01' && <span className="text-sky-400">★</span>}</h3>
                <p className="mt-1 text-white font-semibold">{site.name}</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-300">{site.location} <span className="mx-2">•</span>{site.type}<span className="mx-2">•</span>{site.area}</p>
              </div>
              <div className="grid grid-cols-3 gap-8 text-left">
                <MiniMetric icon={Waves} label="Ponds" value={site.ponds} />
                <MiniMetric icon={Cpu} label="Devices" value={site.devices} />
                <MiniMetric icon={UserRound} label="Active Agents" value={site.agents} />
              </div>
              <ScoreCircle score={site.score} label={site.water} />
              <div className="flex justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setSelectedSite(site)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#0d3660] text-white hover:border-cyan-400"><Eye className="h-5 w-5" /></button>
                <RowActionMenu
                  onEdit={() => {
                    setSiteToEdit(site);
                    setEditSiteForm({ name: site.name, location: site.location });
                  }}
                  onDelete={() => setSiteToDelete(site)}
                />
              </div>
            </section>
          ))}
        </div>

        {/* Add New Site Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm">
            <form onSubmit={handleCreateSite} className="w-full max-w-md rounded-xl border border-[#0d3660] bg-[#041526] p-6 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#0d3660]/60 pb-3 mb-4">
                <h3 className="text-lg font-bold text-white">Create New Aquaculture Site</h3>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Site Name</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Godavari Aqua Farm" className="h-10 w-full rounded border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Location Text</label>
                  <input required type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. West Godavari, AP" className="h-10 w-full rounded border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Site Type</label>
                  <select
                    value={siteType}
                    onChange={e => {
                      setSiteType(e.target.value);
                      if (e.target.value !== 'pond') {
                        setFarmTypeId('');
                        setSpeciesId('');
                      }
                    }}
                    className="h-10 w-full rounded border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none focus:border-cyan-400"
                  >
                    <option value="pond">Pond</option>
                    <option value="swimming_pool">Swimming Pool</option>
                  </select>
                </div>
                {siteType === 'pond' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-1.5">Farm Type</label>
                      <select
                        required
                        value={farmTypeId}
                        onChange={e => {
                          setFarmTypeId(e.target.value);
                          setSpeciesId('');
                        }}
                        className="h-10 w-full rounded border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none focus:border-cyan-400"
                      >
                        <option value="">Select farm type</option>
                        {farmTypes.map((farmType) => (
                          <option key={farmType.id} value={farmType.id}>{farmType.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-1.5">Farmed Species</label>
                      <select
                        required
                        value={speciesId}
                        onChange={e => setSpeciesId(e.target.value)}
                        disabled={!farmTypeId}
                        className="h-10 w-full rounded border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
                      >
                        <option value="">{farmTypeId ? 'Select species' : 'Select farm type first'}</option>
                        {filteredSpecies.map((species) => (
                          <option key={species.id} value={species.id}>{species.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Farming Area</label>
                  <input
                    type="text"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    onBlur={() => {
                      const normalizedArea = normalizeArea(area);
                      if (normalizedArea) setArea(normalizedArea);
                    }}
                    placeholder="e.g. 4.0 acres"
                    className="h-10 w-full rounded border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-[#0d3660]/60 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded border border-[#0d3660] px-5 py-2 text-sm text-slate-300 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={creatingSite} className="rounded bg-blue-600 hover:bg-blue-500 px-5 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60">
                  {creatingSite ? 'Saving...' : 'Save Site'}
                </button>
              </div>
            </form>
          </div>
        )}

        {siteToEdit && (
          <ProjectDialog
            title="Edit Site"
            description="Update the site name and location shown to owners and assigned agents."
            onClose={() => setSiteToEdit(null)}
            footer={
              <>
                <DialogButton onClick={() => setSiteToEdit(null)}>Cancel</DialogButton>
                <DialogButton tone="primary" disabled={!editSiteForm.name.trim()} onClick={() => handleEditSite(siteToEdit)}>Save Changes</DialogButton>
              </>
            }
          >
            <DialogField label="Site Name" value={editSiteForm.name} onChange={(value) => setEditSiteForm((current) => ({ ...current, name: value }))} />
            <DialogField label="Location" value={editSiteForm.location} onChange={(value) => setEditSiteForm((current) => ({ ...current, location: value }))} />
          </ProjectDialog>
        )}

        {siteToDelete && (
          <ProjectDialog
            title="Delete Site?"
            description={`This will delete "${siteToDelete.name}" and remove its active device and agent site assignments.`}
            onClose={() => setSiteToDelete(null)}
            footer={
              <>
                <DialogButton onClick={() => setSiteToDelete(null)}>Cancel</DialogButton>
                <DialogButton tone="danger" onClick={() => handleDeleteSite(siteToDelete)}>Delete Site</DialogButton>
              </>
            }
          />
        )}

        {selectedSite && (
          <SiteModal 
            site={selectedSite} 
            agentsList={agentsList} 
            deviceList={deviceList}
            alertsList={alertsList}
            readingsList={readingsList}
            assignmentsList={assignmentsList}
            onClose={() => setSelectedSite(null)} 
          />
        )}
      </div>
    );
  } catch (renderError) {
    console.error("Render crash in SitesPage, falling back to static defaultSites:", renderError);
    return (
      <div className="animate-fade-in space-y-4 text-slate-300 text-left">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          <SiteStat icon={MapPin} label="Total Sites" value={String(defaultSites.length)} desc="Using fallback data" tone="text-sky-400 bg-sky-500/15" />
          <SiteStat icon={CheckCircle2} label="Active Sites" value={String(defaultSites.filter(s => s.status === 'Healthy').length)} desc="System fallback" tone="text-emerald-400 bg-emerald-500/15" />
          <SiteStat icon={PauseCircle} label="Inactive Sites" value="0" desc="No offline sites" tone="text-amber-400 bg-amber-500/15" />
          <SiteStat icon={Wrench} label="Maintenance" value="0" desc="No tasks queued" tone="text-violet-400 bg-violet-500/15" />
          <SiteStat icon={AlertTriangle} label="Critical Sites" value="0" desc="0 issues found" tone="text-red-400 bg-red-500/15" />
        </div>

        <div className="flex flex-wrap items-end gap-3 border-y border-[#0d3660]/50 py-4">
          <div className="relative min-w-[min(100%,20rem)] flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/50 pl-12 pr-4 text-sm text-white outline-none focus:border-cyan-400/80 transition" placeholder="Search sites by name or location..." />
          </div>
          {['All Status', 'All Regions', 'All Types'].map((label) => (
            <button key={label} className="flex h-11 min-w-44 items-center justify-between rounded-lg border border-[#0d3660] bg-[#020b18]/50 px-4 text-left text-sm text-white">
              <span><span className="block text-xs text-slate-400">{label.split(' ')[1] ? label.split(' ')[1].slice(0, -1) : 'Status'}</span>{label}</span>
              <ChevronRight className="h-4 w-4 rotate-90" />
            </button>
          ))}
          <button className="flex h-11 items-center gap-3 rounded-lg border border-[#0d3660] px-6 text-sm font-bold text-white"><Filter className="h-4 w-4" />Filter</button>
          <button className="flex h-11 items-center gap-3 rounded-lg border border-[#0d3660] px-6 text-sm font-bold text-white"><SlidersHorizontal className="h-4 w-4" />Sort</button>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="ml-auto flex h-11 items-center gap-3 rounded-lg bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-500 transition cursor-pointer"
          >
            <Plus className="h-5 w-5" />Add New Site
          </button>
        </div>

        <div className="space-y-2">
          {defaultSites.map((site) => (
            <section
              key={site.id}
              onClick={() => setSelectedSite(site)}
              className="glass grid grid-cols-[140px_1fr_370px_150px_112px] items-center gap-5 rounded-lg p-3 cursor-pointer hover:bg-[#071f35]/20 transition"
            >
              <div className="relative h-24 overflow-hidden rounded-lg">
                <img src={siteImage} alt="" className="h-full w-full object-cover" />
                <span className={`absolute bottom-2 left-2 rounded-full px-2 py-1 text-[10px] font-bold ${site.status === 'Warning' ? 'bg-amber-500/80 text-black' : site.status === 'Maintenance' ? 'bg-orange-500/80 text-black' : 'bg-emerald-500/80 text-white'}`}>{site.status}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{site.pond} {site.pond === 'Pond 01' && <span className="text-sky-400">★</span>}</h3>
                <p className="mt-1 text-white font-semibold">{site.name}</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-300">{site.location} <span className="mx-2">•</span>{site.type}<span className="mx-2">•</span>{site.area}</p>
              </div>
              <div className="grid grid-cols-3 gap-8 text-left">
                <MiniMetric icon={Waves} label="Ponds" value={site.ponds} />
                <MiniMetric icon={Cpu} label="Devices" value={site.devices} />
                <MiniMetric icon={UserRound} label="Active Agents" value={site.agents} />
              </div>
              <ScoreCircle score={site.score} label={site.water} />
              <div className="flex justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setSelectedSite(site)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#0d3660] text-white hover:border-cyan-400"><Eye className="h-5 w-5" /></button>
                <RowActionMenu
                  onEdit={() => {
                    setSiteToEdit(site);
                    setEditSiteForm({ name: site.name, location: site.location });
                  }}
                  onDelete={() => setSiteToDelete(site)}
                />
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }
}

function SiteModal({
  site,
  agentsList,
  deviceList,
  alertsList,
  readingsList,
  assignmentsList,
  onClose,
}: {
  site: Site;
  agentsList: any[];
  deviceList: any[];
  alertsList: any[];
  readingsList: any[];
  assignmentsList: any[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState('Overview');
  const tabs = ['Overview', 'Ponds', 'Devices', 'Agents', 'Water Quality', 'Alerts', 'History'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
      <section className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-[#0d3660] bg-[#041526] p-5 shadow-2xl text-left">
        <button onClick={onClose} className="float-right text-slate-300 hover:text-white transition"><X className="h-5 w-5" /></button>
        <div className="grid grid-cols-[140px_1fr_460px] items-center gap-5 border-b border-[#0d3660] pb-5">
          <img src={siteImage} alt="" className="h-32 w-32 rounded-lg object-cover" />
          <div>
            <span className="rounded-md bg-emerald-500/20 px-3 py-1 text-sm font-bold text-emerald-400">Active</span>
            <h2 className="mt-3 text-2xl font-bold text-white leading-tight">{site.name}</h2>
            <p className="mt-1.5 inline-block rounded bg-blue-600/30 px-2 py-0.5 text-xs font-bold text-sky-300">{site.id}</p>
            <p className="mt-2 text-sm text-slate-300">{site.location}</p>
            <p className="mt-2 text-xs text-slate-300">Area: {site.area} <span className="mx-2">•</span> Depth: 6.5 ft <span className="mx-2">•</span> {site.agents} Agents</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <ModalStat icon={Waves} label="Ponds" value={site.ponds} onClick={() => setTab('Ponds')} active={tab === 'Ponds'} />
            <ModalStat icon={Cpu} label="Devices" value={site.devices} onClick={() => setTab('Devices')} active={tab === 'Devices'} />
            <ModalStat icon={UserRound} label="Active Agents" value={site.agents} onClick={() => setTab('Agents')} active={tab === 'Agents'} />
            <button onClick={() => setTab('Water Quality')} className={`rounded-lg border p-3 text-center transition hover:border-cyan-400 cursor-pointer ${tab === 'Water Quality' ? 'border-sky-500 bg-sky-500/10' : 'border-[#0d3660]'}`}>
              <p className="text-xs text-white">Water Quality</p>
              <ScoreCircle score={site.score} label={site.water} compact />
            </button>
          </div>
        </div>

        <nav className="flex gap-7 border-b border-[#0d3660] pt-3">
          {tabs.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-3 py-3 text-sm font-semibold transition cursor-pointer ${tab === item ? 'border-sky-500 text-sky-400' : 'border-transparent text-white hover:text-slate-300'}`}>{item}</button>
          ))}
        </nav>

        <SiteTabContent 
          tab={tab} 
          site={site} 
          agentsList={agentsList} 
          deviceList={deviceList}
          alertsList={alertsList}
          readingsList={readingsList}
          assignmentsList={assignmentsList}
        />

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-lg bg-blue-600 hover:bg-blue-500 px-8 py-3 font-bold text-white transition cursor-pointer">Close</button>
        </div>
      </section>
    </div>
  );
}

function SiteTabContent({
  tab,
  site,
  agentsList,
  deviceList,
  alertsList,
  readingsList,
  assignmentsList,
}: {
  tab: string;
  site: Site;
  agentsList: any[];
  deviceList: any[];
  alertsList: any[];
  readingsList: any[];
  assignmentsList: any[];
}) {
  switch (tab) {
    case 'Ponds':
      return <PondsTab site={site} deviceList={deviceList} readingsList={readingsList} assignmentsList={assignmentsList} agentsList={agentsList} />;
    case 'Devices':
      return <DevicesTab site={site} deviceList={deviceList} />;
    case 'Agents':
      return <AgentsTab site={site} agentsList={agentsList} assignmentsList={assignmentsList} />;
    case 'Water Quality':
      return <WaterQualityTab site={site} readingsList={readingsList} />;
    case 'Alerts':
      return <AlertsTab site={site} alertsList={alertsList} />;
    case 'History':
      return <HistoryTab site={site} readingsList={readingsList} />;
    default:
      return <OverviewTab site={site} readingsList={readingsList} />;
  }
}

function OverviewTab({ site, readingsList }: { site: Site; readingsList: any[] }) {
  const dbSiteId = Number(site.id.replace('SITE-', ''));
  const siteReadings = readingsList.filter((r: any) => r.site_id === dbSiteId);
  const latest = siteReadings[0];

  const getDOValue = (temp: number) => (8.5 - (temp - 20) * 0.15).toFixed(1);
  const doVal = latest ? `${getDOValue(latest.temperature_c)} mg/L` : 'N/A';
  const phVal = latest ? String(latest.ph.toFixed(1)) : 'N/A';
  const tempVal = latest ? `${latest.temperature_c.toFixed(1)} °C` : 'N/A';

  return (
    <div className="mt-4 grid grid-cols-3 gap-4">
      <Panel title="Site Overview">
        {[
          ['Site Code', site.id],
          ['Site Type', 'Aquaculture Pond'],
          ['Region', 'South India'],
          ['Created On', 'Apr 10, 2024'],
          ['Last Updated', 'Just now'],
          ['Status', site.status],
        ].map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}
      </Panel>
      <Panel title="Site Image">
        <img src={siteImage} alt="" className="h-48 w-full rounded-lg object-cover" />
      </Panel>
      <Panel title="Water Quality Summary">
        <div className="grid grid-cols-2 gap-3">
          <QualityBox label="Water Quality Score" value={String(site.score)} sub={site.water} circle />
          <QualityBox label="Dissolved Oxygen" value={doVal} sub={latest ? 'Good' : 'No Data'} />
          <QualityBox label="pH Level" value={phVal} sub={latest ? 'Normal' : 'No Data'} />
          <QualityBox label="Temperature" value={tempVal} sub={latest ? 'Normal' : 'No Data'} />
        </div>
      </Panel>
    </div>
  );
}

function DevicesTab({ site, deviceList }: { site: Site; deviceList: any[] }) {
  const dbSiteId = Number(site.id.replace('SITE-', ''));
  const siteDevices = deviceList.filter((d: any) => d.site_id === dbSiteId);

  const mappedDevices = siteDevices.map((d: any) => {
    let battery = 95;
    if (d.latest_reading && d.latest_reading.battery_v != null) {
      const v = d.latest_reading.battery_v;
      if (v >= 4.2) battery = 100;
      else if (v <= 3.0) battery = 0;
      else battery = Math.round(((v - 3.0) / (4.2 - 3.0)) * 100);
    }
    return {
      id: d.device_uid || 'DVC-UNKNOWN',
      name: `Sensor Device ${(d.device_uid || '').slice(-4)}`,
      type: 'Water Quality',
      pond: site.name,
      status: d.status === 'active' ? 'Online' : 'Offline',
      signal: d.latest_reading?.signal_dbm != null ? `${d.latest_reading.signal_dbm} dBm` : 'N/A',
      battery: `${battery}%`,
      last: formatSeen(d.latest_reading?.collected_at),
      firmware: d.firmware_version || 'v2',
      serial: d.imei || 'N/A',
      mac: d.sim_number || 'N/A',
      installedOn: new Date(d.created_at).toLocaleDateString(),
    };
  });

  const [selectedDevId, setSelectedDevId] = useState(mappedDevices[0]?.id || '');
  const selectedDev = mappedDevices.find(d => d.id === selectedDevId) || mappedDevices[0];

  return (
    <div className="mt-4 grid grid-cols-[1fr_320px] gap-4">
      <Panel title="Devices List">
        <div className="mb-3 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="h-9 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 pl-9 text-xs text-white outline-none" placeholder="Search devices by name or type..." />
          </div>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#071f35]/70 text-slate-300">
            <tr>{['Device ID', 'Device Name', 'Type', 'Pond', 'Status', 'Signal', 'Battery', 'Last Data'].map((h) => <th key={h} className="px-2 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#0d3660]/50">
            {mappedDevices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">No connected devices found for this site.</td>
              </tr>
            ) : (
              mappedDevices.map((device) => (
                <tr
                  key={device.id}
                  onClick={() => setSelectedDevId(device.id)}
                  className={`cursor-pointer transition hover:bg-[#071f35]/50 ${
                    selectedDevId === device.id ? 'bg-[#06b6d4]/10' : ''
                  }`}
                >
                  <td className="px-2 py-3 text-white font-semibold">{device.id}</td>
                  <td className="text-white font-medium">{device.name}</td>
                  <td><span className="rounded px-2 py-1 text-[10px] font-bold bg-sky-500/20 text-sky-300">{device.type}</span></td>
                  <td className="text-white font-medium">{device.pond}</td>
                  <td className={`${device.status === 'Online' ? 'text-emerald-400' : 'text-red-400'} font-semibold`}>• {device.status}</td>
                  <td className="text-slate-300 font-bold">{device.signal}</td>
                  <td className="text-white font-medium">{device.battery}</td>
                  <td className="text-slate-350">{device.last}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Panel>

      <Panel title="Device Details">
        {selectedDev ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-sky-500/15"><Cpu className="h-9 w-9 text-sky-400" /></div>
              <div>
                <p className={`text-xs font-bold ${selectedDev.status === 'Online' ? 'text-emerald-400' : 'text-red-400'}`}>• {selectedDev.status}</p>
                <h3 className="font-bold text-white text-sm sm:text-base leading-tight">{selectedDev.name}</h3>
                <p className="mt-1.5 inline-block rounded bg-blue-600/30 px-2 py-0.5 text-xs text-sky-300 font-mono">{selectedDev.id}</p>
              </div>
            </div>
            {[
              ['Device Type', selectedDev.type],
              ['Firmware Version', selectedDev.firmware],
              ['Serial Number (IMEI)', selectedDev.serial],
              ['SIM Number', selectedDev.mac],
              ['Installed On', selectedDev.installedOn],
            ].map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}
          </>
        ) : (
          <p className="text-sm text-slate-400">Select a device from the list to view details.</p>
        )}
      </Panel>
    </div>
  );
}

function PondsTab({
  site,
  deviceList,
  readingsList,
  assignmentsList,
  agentsList,
}: {
  site: Site;
  deviceList: any[];
  readingsList: any[];
  assignmentsList: any[];
  agentsList: any[];
}) {
  const dbSiteId = Number(site.id.replace('SITE-', ''));
  const siteDevices = deviceList.filter((d: any) => d.site_id === dbSiteId);
  const siteAgents = assignmentsList.filter((aa: any) => aa.site_id === dbSiteId);
  const assignedAgentIds = siteAgents.map((sa) => Number(sa.agent_user_id));
  const siteAgentsFull = agentsList.filter((a) => assignedAgentIds.includes(Number(a.id)));
  const agentNames = siteAgentsFull.map((a) => a.full_name || a.email).join(', ') || 'Unassigned';

  const pond = {
    name: site.name,
    status: site.status,
    purpose: 'Water Quality Monitoring',
    devicesCount: `${siteDevices.length} Connected Devices`,
    score: String(site.score),
    details: `${site.type} • ${site.area} • 6.5 ft depth`,
    fishCount: '15,000 (Estimated)',
    feedToday: '45 kg',
    aerators: '3 Online',
    lastInspection: 'Just now',
    assignedAgent: agentNames,
  };

  return (
    <div className="mt-4 grid grid-cols-[1fr_280px] gap-4">
      <Panel title="Ponds List">
        <div className="grid grid-cols-3 gap-3">
          <button
            className="rounded-lg border p-4 text-left border-sky-500 bg-sky-500/10"
          >
            <div className="flex items-center justify-between">
              <Waves className="h-6 w-6 text-cyan-300" />
              <span className={`rounded px-2 py-1 text-[10px] font-bold ${pond.status === 'Healthy' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{pond.status}</span>
            </div>
            <h3 className="mt-4 font-bold text-white">{pond.name}</h3>
            <p className="mt-1 text-xs text-slate-300">{pond.purpose}</p>
            <p className="mt-3 text-2xl font-bold text-white">{pond.score}<span className="text-xs font-normal text-slate-400"> score</span></p>
          </button>
        </div>
      </Panel>
      <Panel title="Selected Pond">
        <h3 className="text-xl font-bold text-white">{pond.name}</h3>
        <p className="mt-2 text-sm text-slate-300">{pond.details}</p>
        {[
          ['Fish Count', pond.fishCount],
          ['Feed Today', pond.feedToday],
          ['Aerators', pond.aerators],
          ['Last Inspection', pond.lastInspection],
          ['Assigned Agent', pond.assignedAgent],
        ].map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}
      </Panel>
    </div>
  );
}

function AgentsTab({
  site,
  agentsList,
  assignmentsList,
}: {
  site: Site;
  agentsList: any[];
  assignmentsList: any[];
}) {
  const dbSiteId = Number(site.id.replace('SITE-', ''));
  const siteAssignments = assignmentsList.filter((aa: any) => aa.site_id === dbSiteId);
  const assignedAgentIds = siteAssignments.map((aa) => Number(aa.agent_user_id));
  const siteAgents = agentsList.filter((a) => assignedAgentIds.includes(Number(a.id)));

  return (
    <div className="mt-4 grid grid-cols-[1fr_280px] gap-4">
      <Panel title="Active Agents">
        <div className="divide-y divide-[#0d3660]/50">
          {siteAgents.length === 0 ? (
            <p className="py-6 text-sm text-slate-400">No agents assigned to this site.</p>
          ) : (
            siteAgents.map((agent) => (
              <div key={agent.id} className="grid grid-cols-[1.5fr_1.5fr_1fr] items-center py-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15"><UserRound className="h-5 w-5 text-cyan-300" /></div>
                  <div>
                    <p className="font-bold text-white">{agent.full_name || 'Unnamed Agent'}</p>
                    <p className="text-xs text-slate-400">{agent.email}</p>
                  </div>
                </div>
                <span className="text-slate-300">{agent.phone || 'N/A'}</span>
                <span className="text-emerald-400 font-semibold">• Active</span>
              </div>
            ))
          )}
        </div>
      </Panel>
      <Panel title="Agent Coverage">
        <ScoreCircle score={siteAgents.length > 0 ? 100 : 0} label="Coverage" />
        {[
          ['Total Agents', String(siteAgents.length)],
          ['Status', siteAgents.length > 0 ? 'Online' : 'Offline'],
        ].map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}
      </Panel>
    </div>
  );
}

function WaterQualityTab({ site, readingsList }: { site: Site; readingsList: any[] }) {
  const dbSiteId = Number(site.id.replace('SITE-', ''));
  const siteReadings = readingsList.filter((r: any) => r.site_id === dbSiteId);
  const latest = siteReadings[0];

  const getDOValue = (temp: number) => (8.5 - (temp - 20) * 0.15).toFixed(1);
  const doVal = latest ? `${getDOValue(latest.temperature_c)} mg/L` : 'N/A';
  const phVal = latest ? String(latest.ph.toFixed(1)) : 'N/A';
  const tempVal = latest ? `${latest.temperature_c.toFixed(1)} °C` : 'N/A';
  const turbVal = latest ? `${latest.turbidity.toFixed(1)} NTU` : 'N/A';

  const metrics = [
    ['Water Quality Score', String(site.score), site.water],
    ['Dissolved Oxygen', doVal, latest ? 'Good' : 'No Data'],
    ['pH Level', phVal, latest ? 'Normal' : 'No Data'],
    ['Temperature', tempVal, latest ? 'Normal' : 'No Data'],
    ['Turbidity', turbVal, latest ? 'Clear' : 'No Data'],
  ];

  return (
    <div className="mt-4 grid grid-cols-[1fr_300px] gap-4">
      <Panel title="Live Water Quality">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(([label, value, status]) => (
            <div key={label} className="rounded-lg border border-[#0d3660] p-4 bg-[#031426]/50">
              <p className="text-xs text-slate-300">{label}</p>
              <p className="mt-4 text-2xl font-bold text-white">{value}</p>
              <p className={`mt-2 text-sm ${status === 'Warning' || status === 'Critical' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}`}>{status}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Trend Snapshot">
        <svg viewBox="0 0 260 140" className="h-40 w-full text-cyan-300" fill="none">
          <path d="M8 105 C35 82 48 91 70 64 S116 45 140 70 184 88 205 46 236 36 252 28" stroke="currentColor" strokeWidth="4" />
          <path d="M8 118 L252 118" stroke="#0d3660" />
        </svg>
      </Panel>
    </div>
  );
}

function AlertsTab({ site, alertsList }: { site: Site; alertsList: any[] }) {
  const dbSiteId = Number(site.id.replace('SITE-', ''));
  const siteAlerts = alertsList.filter((a: any) => a.site_id === dbSiteId);

  return (
    <div className="mt-4">
      <Panel title="Site Alerts">
        <div className="divide-y divide-[#0d3660]/50">
          {siteAlerts.length === 0 ? (
            <p className="py-6 text-sm text-slate-450 text-center">No active alerts found for this site.</p>
          ) : (
            siteAlerts.map((alert) => (
              <div key={alert.id} className="grid grid-cols-[1fr_160px_120px_180px_40px] items-center py-4 text-sm hover:bg-[#071f35]/25 px-2 rounded transition">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-5 w-5 ${alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
                  <span className="font-bold text-white">{alert.title}</span>
                </div>
                <span className="text-slate-300">{site.name}</span>
                <span className="text-slate-350 capitalize">{alert.severity}</span>
                <span className="text-slate-400 text-xs">{new Date(alert.created_at).toLocaleString()}</span>
                <ChevronRight className="h-4 w-4 text-white" />
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

function HistoryTab({ site, readingsList }: { site: Site; readingsList: any[] }) {
  const dbSiteId = Number(site.id.replace('SITE-', ''));
  const siteReadings = readingsList.filter((r: any) => r.site_id === dbSiteId);

  return (
    <div className="mt-4">
      <Panel title="Site History">
        <div className="divide-y divide-[#0d3660]/50">
          {siteReadings.length === 0 ? (
            <p className="py-6 text-sm text-slate-450 text-center">No historical entries found for this site.</p>
          ) : (
            siteReadings.slice(0, 10).map((reading) => (
              <div key={reading.id} className="grid grid-cols-[150px_1fr_180px] py-4 text-sm">
                <span className="flex items-center gap-2 text-slate-300">
                  <CalendarDays className="h-4 w-4 text-cyan-300" />
                  {new Date(reading.collected_at).toLocaleDateString()}
                </span>
                <span className="font-semibold text-white">
                  Telemetry reading logged (pH: {reading.ph.toFixed(1)}, Temp: {reading.temperature_c.toFixed(1)}°C, Turb: {reading.turbidity.toFixed(1)} NTU)
                </span>
                <span className="text-slate-400">Automated Sensor</span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

function SiteStat({ icon: Icon, label, value, desc, tone }: { icon: typeof MapPin; label: string; value: string; desc: string; tone: string }) {
  return <section className="metric-card glass rounded-lg p-4"><div className="metric-card-row"><div className={`metric-icon flex items-center justify-center rounded-full ${tone}`}><Icon className="h-7 w-7" /></div><div className="metric-copy"><p className="metric-label text-white">{label}</p><p className="metric-value mt-1 font-bold text-white">{value}</p><p className="metric-desc mt-2 text-emerald-400">{desc}</p></div></div></section>;
}

// Fixed mini metric layout
function MiniMetric({ icon: Icon, label, value }: { icon: typeof Waves; label: string; value: number }) {
  return <div><p className="flex items-center gap-2 text-xs text-slate-300"><Icon className="h-4 w-4 text-cyan-400" />{label}</p><p className="mt-1 text-xl font-bold text-white">{value}</p></div>;
}

function ScoreCircle({ score, label, compact = false }: { score: number; label: string; compact?: boolean }) {
  const color = score >= 75 ? 'border-emerald-500 text-emerald-400' : 'border-amber-500 text-amber-400';
  return <div className={`mx-auto flex ${compact ? 'h-16 w-16' : 'h-20 w-20'} flex-col items-center justify-center rounded-full border-4 ${color}`}><span className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-white`}>{score}</span><span className="text-[10px] text-slate-400">{label}</span></div>;
}

function ModalStat({ icon: Icon, label, value, onClick, active }: { icon: LucideIcon; label: string; value: number; onClick?: () => void; active?: boolean }) {
  return <button onClick={onClick} className={`rounded-lg border p-4 text-left transition hover:border-cyan-400 cursor-pointer ${active ? 'border-sky-500 bg-sky-500/10' : 'border-[#0d3660]'}`}><p className="flex items-center gap-2 text-xs text-white"><Icon className="h-4 w-4 text-cyan-400" />{label}</p><p className="mt-4 text-2xl font-bold text-white">{value}</p></button>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-[#0d3660] bg-[#031426]/60 p-4"><h3 className="mb-3 font-bold text-white">{title}</h3>{children}</section>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b border-[#0d3660]/50 py-2.5 text-xs"><span className="text-slate-350">{label}</span><span className="text-right text-white font-semibold truncate max-w-[200px]">{value}</span></div>;
}

function QualityBox({ label, value, sub, circle }: { label: string; value: string; sub: string; circle?: boolean }) {
  return <div className="rounded-lg border border-[#0d3660] p-4 bg-[#031426]/30">{circle ? <ScoreCircle score={Number(value)} label={sub} compact /> : <><p className="text-xs text-slate-300">{label}</p><p className="mt-4 text-2xl font-bold text-white">{value}</p><p className="mt-2 text-sm text-emerald-450 font-semibold">{sub}</p></>} {!circle && null}</div>;
}
