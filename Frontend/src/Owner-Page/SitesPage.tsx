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
  type: 'Freshwater' | 'Brackishwater';
};

const siteImage = '/images/dashboard_attached.png';

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

  // Form Fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [siteType, setSiteType] = useState('pond');
  const [area, setArea] = useState('4.0 acres');

  const loadData = async () => {
    const session = getAuthSession();
    if (!session) {
      setSitesList(defaultSites);
      setLoading(false);
      return;
    }

    // 1. Load Sites
    try {
      const apiSites = await apiRequest<any[]>('/owner/sites', {
        token: session.token,
      });

      const normalizedSites: Site[] = apiSites.map((s) => ({
        id: `SITE-${s.id}`,
        pond: `Site #${s.id}`,
        name: s.name || 'Unnamed Site',
        location: s.location_text || 'No location set',
        water: 'Good',
        area: s.custom_thresholds?.area || '4.0 acres',
        ponds: 1,
        devices: 1,
        agents: 1,
        score: 80,
        status: 'Healthy',
        type: (s.name || '').toLowerCase().includes('brackish') ? 'Brackishwater' : 'Freshwater',
      }));

      setSitesList(normalizedSites);
    } catch (err) {
      console.error('Failed to retrieve Sites from DB, using fallback defaults:', err);
      setSitesList(defaultSites);
    }

    // 2. Load Agents
    try {
      const apiAgents = await apiRequest<any[]>('/owner/agents', {
        token: session.token,
      });
      setAgentsList(apiAgents);
    } catch (err) {
      console.error('Failed to retrieve Agents from DB:', err);
      setAgentsList([]);
    }

    setLoading(false);
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
        return [pond, name, location].some((item) =>
          item.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [search, sitesList],
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
    try {
      const session = getAuthSession();
      if (!session) return;

      await apiRequest('/owner/sites', {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({
          name,
          site_type: siteType,
          location_text: location,
          farm_type_id: 1,
          species_id: 1,
          custom_thresholds: { area },
        }),
      });

      setShowAddModal(false);
      setName('');
      setLocation('');
      setSiteType('pond');
      setArea('4.0 acres');
      loadData();
    } catch (err: any) {
      alert('Error creating site: ' + (err.message || String(err)));
    }
  };


  try {
    return (
      <div className="animate-fade-in space-y-4 text-slate-300 text-left">
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
                <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#0d3660] text-white"><MoreVertical className="h-5 w-5" /></button>
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
                  <select value={siteType} onChange={e => setSiteType(e.target.value)} className="h-10 w-full rounded border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none focus:border-cyan-400">
                    <option value="pond">Pond</option>
                    <option value="cage">Cage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Farming Area</label>
                  <input type="text" value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. 4.5 acres" className="h-10 w-full rounded border border-[#0d3660] bg-[#020b18]/60 px-3 text-sm text-white outline-none focus:border-cyan-400" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-[#0d3660]/60 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded border border-[#0d3660] px-5 py-2 text-sm text-slate-300 hover:text-white transition">Cancel</button>
                <button type="submit" className="rounded bg-blue-600 hover:bg-blue-500 px-5 py-2 text-sm font-bold text-white transition">Save Site</button>
              </div>
            </form>
          </div>
        )}

        {selectedSite && <SiteModal site={selectedSite} agentsList={agentsList} onClose={() => setSelectedSite(null)} />}
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
                <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#0d3660] text-white"><MoreVertical className="h-5 w-5" /></button>
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }
}

function SiteModal({ site, agentsList, onClose }: { site: Site; agentsList: any[]; onClose: () => void }) {
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

        <SiteTabContent tab={tab} site={site} agentsList={agentsList} />

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-lg bg-blue-600 hover:bg-blue-500 px-8 py-3 font-bold text-white transition cursor-pointer">Close</button>
        </div>
      </section>
    </div>
  );
}

function SiteTabContent({ tab, site, agentsList }: { tab: string; site: Site; agentsList: any[] }) {
  switch (tab) {
    case 'Ponds':
      return <PondsTab />;
    case 'Devices':
      return <DevicesTab />;
    case 'Agents':
      return <AgentsTab agentsList={agentsList} />;
    case 'Water Quality':
      return <WaterQualityTab site={site} />;
    case 'Alerts':
      return <AlertsTab />;
    case 'History':
      return <HistoryTab />;
    default:
      return <OverviewTab site={site} />;
  }
}

function OverviewTab({ site }: { site: Site }) {
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
          <QualityBox label="Dissolved Oxygen" value="6.8 mg/L" sub="Good" />
          <QualityBox label="pH Level" value="7.2" sub="Normal" />
          <QualityBox label="Temperature" value="23.5 °C" sub="Normal" />
        </div>
      </Panel>
    </div>
  );
}

function DevicesTab() {
  const [selectedDevId, setSelectedDevId] = useState('DEV-1001');
  const selectedDev = devicesData[selectedDevId] || devicesData['DEV-1001'];

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
            {Object.values(devicesData).map((device) => (
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
                <td className="text-emerald-400 font-semibold">• {device.status}</td>
                <td className="text-emerald-400 font-bold">{device.signal}</td>
                <td className="text-white font-medium">{device.battery}</td>
                <td className="text-slate-350">{device.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Device Details">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-sky-500/15"><Cpu className="h-9 w-9 text-sky-400" /></div>
          <div>
            <p className={`text-xs font-bold ${selectedDev.status === 'Online' ? 'text-emerald-400' : 'text-orange-400'}`}>• {selectedDev.status}</p>
            <h3 className="font-bold text-white text-sm sm:text-base leading-tight">{selectedDev.name}</h3>
            <p className="mt-1.5 inline-block rounded bg-blue-600/30 px-2 py-0.5 text-xs text-sky-300 font-mono">{selectedDev.id}</p>
          </div>
        </div>
        {[
          ['Device Type', selectedDev.type],
          ['Firmware Version', selectedDev.firmware],
          ['Serial Number', selectedDev.serial],
          ['MAC Address', selectedDev.mac],
          ['Installed On', selectedDev.installedOn],
        ].map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}
      </Panel>
    </div>
  );
}

function PondsTab() {
  const [selectedPondName, setSelectedPondName] = useState('Pond 01');
  const selectedPond = pondsData[selectedPondName] || pondsData['Pond 01'];

  return (
    <div className="mt-4 grid grid-cols-[1fr_280px] gap-4">
      <Panel title="Ponds List">
        <div className="grid grid-cols-3 gap-3">
          {Object.values(pondsData).map((pond) => (
            <button
              key={pond.name}
              onClick={() => setSelectedPondName(pond.name)}
              className={`rounded-lg border p-4 text-left transition hover:border-cyan-400 cursor-pointer ${
                selectedPondName === pond.name
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-[#0d3660] bg-[#031426]/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <Waves className="h-6 w-6 text-cyan-300" />
                <span className="rounded px-2 py-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300">{pond.status}</span>
              </div>
              <h3 className="mt-4 font-bold text-white">{pond.name}</h3>
              <p className="mt-1 text-xs text-slate-300">{pond.purpose}</p>
              <p className="mt-3 text-2xl font-bold text-white">{pond.score}<span className="text-xs font-normal text-slate-400"> score</span></p>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Selected Pond">
        <h3 className="text-xl font-bold text-white">{selectedPond.name}</h3>
        <p className="mt-2 text-sm text-slate-300">{selectedPond.details}</p>
        {[
          ['Fish Count', selectedPond.fishCount],
          ['Feed Today', selectedPond.feedToday],
          ['Aerators', selectedPond.aerators],
          ['Last Inspection', selectedPond.lastInspection],
          ['Assigned Agent', selectedPond.assignedAgent],
        ].map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}
      </Panel>
    </div>
  );
}

function AgentsTab({ agentsList }: { agentsList: any[] }) {
  const defaultAgents = [
    { id: 'AGT-001', full_name: 'Ravi Kumar', email: 'agent@gmail.com', phone: '+91 9988776655' },
    { id: 'AGT-002', full_name: 'Meera Iyer', email: 'meera@gmail.com', phone: '+91 9988776656' },
  ];

  const list = agentsList.length > 0 ? agentsList : defaultAgents;

  return (
    <div className="mt-4 grid grid-cols-[1fr_280px] gap-4">
      <Panel title="Active Agents">
        <div className="divide-y divide-[#0d3660]/50">
          {list.map((agent) => (
            <div key={agent.id} className="grid grid-cols-[1.5fr_1.5fr_1fr] items-center py-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15"><UserRound className="h-5 w-5 text-cyan-300" /></div>
                <div>
                  <p className="font-bold text-white">{agent.full_name}</p>
                  <p className="text-xs text-slate-400">{agent.email}</p>
                </div>
              </div>
              <span className="text-slate-300">{agent.phone}</span>
              <span className="text-emerald-400 font-semibold">• Active</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Agent Coverage">
        <ScoreCircle score={100} label="Coverage" />
        {[
          ['Total Agents', String(list.length)],
          ['Status', 'Online'],
        ].map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}
      </Panel>
    </div>
  );
}

function WaterQualityTab({ site }: { site: Site }) {
  const metrics = [
    ['Water Quality Score', String(site.score), site.water],
    ['Dissolved Oxygen', '6.8 mg/L', 'Good'],
    ['pH Level', '7.2', 'Normal'],
    ['Temperature', '23.5 °C', 'Normal'],
  ];

  return (
    <div className="mt-4 grid grid-cols-[1fr_300px] gap-4">
      <Panel title="Live Water Quality">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(([label, value, status]) => (
            <div key={label} className="rounded-lg border border-[#0d3660] p-4 bg-[#031426]/50">
              <p className="text-xs text-slate-300">{label}</p>
              <p className="mt-4 text-2xl font-bold text-white">{value}</p>
              <p className="mt-2 text-sm text-emerald-400 font-semibold">{status}</p>
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

function AlertsTab() {
  const alerts = [
    ['High Turbidity', 'Pond 03', 'Warning', 'May 18, 10:12 AM'],
    ['Aerator Inspection Due', 'Pond 05', 'Info', 'May 18, 09:40 AM'],
  ];

  return (
    <div className="mt-4">
      <Panel title="Site Alerts">
        <div className="divide-y divide-[#0d3660]/50">
          {alerts.map(([title, target, severity, time]) => (
            <div key={`${title}-${target}`} className="grid grid-cols-[1fr_160px_120px_180px_40px] items-center py-4 text-sm hover:bg-[#071f35]/25 px-2 rounded transition">
              <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-400" /><span className="font-bold text-white">{title}</span></div>
              <span className="text-slate-300">{target}</span>
              <span className="text-slate-350">{severity}</span>
              <span className="text-slate-400 text-xs">{time}</span>
              <ChevronRight className="h-4 w-4 text-white" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function HistoryTab() {
  const history = [
    ['May 18, 2024', 'Water quality inspection completed', 'Rahul Verma'],
  ];

  return (
    <div className="mt-4">
      <Panel title="Site History">
        <div className="divide-y divide-[#0d3660]/50">
          {history.map(([date, action, by]) => (
            <div key={`${date}-${action}`} className="grid grid-cols-[150px_1fr_180px] py-4 text-sm">
              <span className="flex items-center gap-2 text-slate-300"><CalendarDays className="h-4 w-4 text-cyan-300" />{date}</span>
              <span className="font-semibold text-white">{action}</span>
              <span className="text-slate-400">{by}</span>
            </div>
          ))}
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
