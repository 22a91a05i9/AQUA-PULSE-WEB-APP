import { useMemo, useState } from 'react';
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

const sites: Site[] = [
  { id: 'GVF-001', pond: 'Pond 01', name: 'Green Valley Farm', location: '123 Green Valley Rd, Gorantla, West Godavari, Andhra Pradesh 534102', water: 'Good', area: '4.2 acres', ponds: 12, devices: 26, agents: 5, score: 85, status: 'Healthy', type: 'Freshwater' },
  { id: 'BLA-002', pond: 'Pond 02', name: 'Blue Lake Aquafarms', location: '67/4 Blue Beach, Nellore, Andhra Pradesh 524 003', water: 'Good', area: '4 Acres', ponds: 8, devices: 19, agents: 4, score: 78, status: 'Healthy', type: 'Brackishwater' },
  { id: 'SAP-003', pond: 'Pond 03', name: 'Sunrise Aqua Park', location: '789 Sunrise Blvd, Kakinada, East Godavari, Andhra Pradesh 533001', water: 'Good', area: '5 Acres', ponds: 15, devices: 32, agents: 6, score: 82, status: 'Healthy', type: 'Freshwater' },
  { id: 'OCF-004', pond: 'Pond 04', name: 'Oceanic Fisheries', location: '321 Ocean Drive, Visakhapatnam, Andhra Pradesh 530017', water: 'Good', area: '10 Acres', ponds: 10, devices: 22, agents: 5, score: 80, status: 'Warning', type: 'Brackishwater' },
  { id: 'MVF-005', pond: 'Pond 05', name: 'Mountain View Farm', location: '864 Hill Top Road, Tuni, East Godavari, Andhra Pradesh 533401', water: 'Fair', area: '6 Acres', ponds: 6, devices: 12, agents: 2, score: 65, status: 'Maintenance', type: 'Freshwater' },
  { id: 'CAH-006', pond: 'Pond 06', name: 'Coastal Aqua Hub', location: '987 Coastal Highway, Puri, Odisha 752002', water: 'Good', area: '3 Acres', ponds: 5, devices: 10, agents: 3, score: 88, status: 'Healthy', type: 'Brackishwater' },
];

// Ponds database for dynamic detail display
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
    details: 'Section C • 0.40 acres • 6.0 ft depth',
    fishCount: '22,500',
    feedToday: '80 kg',
    aerators: '1 Online, 1 Offline',
    lastInspection: 'May 17, 2024',
    assignedAgent: 'Agent-002',
  },
  'Pond 04': {
    name: 'Pond 04',
    status: 'Healthy',
    purpose: 'Harvest',
    devicesCount: '4 Devices',
    score: '88',
    updatedAt: 'Updated 1 min ago',
    details: 'Section D • 0.30 acres • 5.5 ft depth',
    fishCount: '15,200',
    feedToday: '55 kg',
    aerators: '2 Online',
    lastInspection: 'May 18, 2024',
    assignedAgent: 'Agent-003',
  },
  'Pond 05': {
    name: 'Pond 05',
    status: 'Maintenance',
    purpose: 'Treatment',
    devicesCount: '3 Devices',
    score: '65',
    updatedAt: 'Updated 15 min ago',
    details: 'Section E • 0.20 acres • 5.0 ft depth',
    fishCount: '10,000',
    feedToday: '35 kg',
    aerators: '1 Online',
    lastInspection: 'May 16, 2024',
    assignedAgent: 'Agent-004',
  },
};

// Devices database for dynamic detail display inside modal
const devicesData: Record<string, {
  id: string;
  name: string;
  type: string;
  pond: string;
  status: 'Online' | 'Offline';
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
    battery: '86%',
    last: '2 min ago',
    firmware: 'v2.4.1',
    serial: 'WQS-1001-23A7B',
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
  'DEV-1002': {
    id: 'DEV-1002',
    name: 'Water Quality Sensor 2',
    type: 'Water Quality',
    pond: 'Pond 01',
    status: 'Online',
    signal: '▮▮▮▮▮',
    battery: '72%',
    last: '3 min ago',
    firmware: 'v2.4.1',
    serial: 'WQS-1002-23C9X',
    mac: 'AC:23:F4:8D:1A:2C',
    installedOn: 'Apr 11, 2024',
    lastCalib: 'May 11, 2024',
    nextCalib: 'Jun 11, 2024',
    readings: [
      ['Water Quality Score', '80 (Good)'],
      ['Dissolved Oxygen', '6.4 mg/L'],
      ['pH Level', '7.5'],
      ['Temperature', '23.8 °C'],
      ['Turbidity', '15 NTU'],
      ['Conductivity', '510 µS/cm'],
    ],
  },
  'DEV-1003': {
    id: 'DEV-1003',
    name: 'Aerator Controller 1',
    type: 'Aerator',
    pond: 'Pond 01',
    status: 'Online',
    signal: '▮▮▮▮▮',
    battery: '100%',
    last: '1 min ago',
    firmware: 'v1.4.2',
    serial: 'AC-1001-24B8Z',
    mac: 'AC:23:F4:8D:1C:11',
    installedOn: 'Apr 12, 2024',
    lastCalib: 'N/A',
    nextCalib: 'N/A',
    readings: [
      ['Controller Status', 'Running'],
      ['Motor Speed', '1200 RPM'],
      ['Power Draw', '1.2 kW'],
      ['Current Voltage', '230 V'],
      ['Operating Current', '5.2 A'],
      ['Total Runtime', '142 hrs'],
    ],
  },
  'DEV-1004': {
    id: 'DEV-1004',
    name: 'DO Sensor 1',
    type: 'DO Sensor',
    pond: 'Pond 02',
    status: 'Online',
    signal: '▮▮▮▮▮',
    battery: '78%',
    last: '2 min ago',
    firmware: 'v1.2.1',
    serial: 'DOS-1001-23F2Y',
    mac: 'AC:23:F4:8D:2B:44',
    installedOn: 'Apr 14, 2024',
    lastCalib: 'May 14, 2024',
    nextCalib: 'Jun 14, 2024',
    readings: [
      ['Water Quality Score', '82 (Good)'],
      ['Dissolved Oxygen', '6.9 mg/L'],
      ['pH Level', '7.3'],
      ['Temperature', '24.1 °C'],
      ['Turbidity', '14 NTU'],
      ['Conductivity', '530 µS/cm'],
    ],
  },
  'DEV-1005': {
    id: 'DEV-1005',
    name: 'Temperature Sensor 1',
    type: 'Temperature',
    pond: 'Pond 02',
    status: 'Online',
    signal: '▮▮▮▮▮',
    battery: '65%',
    last: '4 min ago',
    firmware: 'v1.1.0',
    serial: 'TEM-1001-23D1W',
    mac: 'AC:23:F4:8D:2C:12',
    installedOn: 'Apr 15, 2024',
    lastCalib: 'May 15, 2024',
    nextCalib: 'Jun 15, 2024',
    readings: [
      ['Water Quality Score', '78 (Good)'],
      ['Dissolved Oxygen', '6.2 mg/L'],
      ['pH Level', '7.1'],
      ['Temperature', '23.0 °C'],
      ['Turbidity', '16 NTU'],
      ['Conductivity', '495 µS/cm'],
    ],
  },
  'DEV-1006': {
    id: 'DEV-1006',
    name: 'pH Sensor 1',
    type: 'pH Sensor',
    pond: 'Pond 03',
    status: 'Online',
    signal: '▮▮▮▮▮',
    battery: '81%',
    last: '3 min ago',
    firmware: 'v1.2.1',
    serial: 'PHS-1001-23E9K',
    mac: 'AC:23:F4:8D:3B:55',
    installedOn: 'Apr 16, 2024',
    lastCalib: 'May 16, 2024',
    nextCalib: 'Jun 16, 2024',
    readings: [
      ['Water Quality Score', '81 (Good)'],
      ['Dissolved Oxygen', '6.5 mg/L'],
      ['pH Level', '7.2'],
      ['Temperature', '23.5 °C'],
      ['Turbidity', '13 NTU'],
      ['Conductivity', '520 µS/cm'],
    ],
  },
  'DEV-1007': {
    id: 'DEV-1007',
    name: 'Aerator Controller 2',
    type: 'Aerator',
    pond: 'Pond 03',
    status: 'Offline',
    signal: '-',
    battery: '-',
    last: '25 min ago',
    firmware: 'v1.4.2',
    serial: 'AC-1002-24B8Y',
    mac: 'AC:23:F4:8D:3C:12',
    installedOn: 'Apr 16, 2024',
    lastCalib: 'N/A',
    nextCalib: 'N/A',
    readings: [
      ['Controller Status', 'Stopped'],
      ['Error Code', 'ERR-E04 (Overload)'],
      ['Power Draw', '0.0 kW'],
      ['Current Voltage', '0 V'],
      ['Operating Current', '0.0 A'],
      ['Total Runtime', '98 hrs'],
    ],
  },
  'DEV-1008': {
    id: 'DEV-1008',
    name: 'Water Quality Sensor 3',
    type: 'Water Quality',
    pond: 'Pond 04',
    status: 'Online',
    signal: '▮▮▮▮▮',
    battery: '91%',
    last: '1 min ago',
    firmware: 'v2.4.1',
    serial: 'WQS-1003-23A9F',
    mac: 'AC:23:F4:8D:4A:2A',
    installedOn: 'Apr 18, 2024',
    lastCalib: 'May 18, 2024',
    nextCalib: 'Jun 18, 2024',
    readings: [
      ['Water Quality Score', '88 (Good)'],
      ['Dissolved Oxygen', '6.7 mg/L'],
      ['pH Level', '7.4'],
      ['Temperature', '23.6 °C'],
      ['Turbidity', '11 NTU'],
      ['Conductivity', '525 µS/cm'],
    ],
  },
  'DEV-1009': {
    id: 'DEV-1009',
    name: 'Temperature Sensor 2',
    type: 'Temperature',
    pond: 'Pond 04',
    status: 'Online',
    signal: '▮▮▮▮▮',
    battery: '69%',
    last: '5 min ago',
    firmware: 'v1.1.0',
    serial: 'TEM-1002-23D1V',
    mac: 'AC:23:F4:8D:4C:13',
    installedOn: 'Apr 18, 2024',
    lastCalib: 'May 18, 2024',
    nextCalib: 'Jun 18, 2024',
    readings: [
      ['Water Quality Score', '79 (Good)'],
      ['Dissolved Oxygen', '6.1 mg/L'],
      ['pH Level', '7.0'],
      ['Temperature', '23.2 °C'],
      ['Turbidity', '17 NTU'],
      ['Conductivity', '505 µS/cm'],
    ],
  },
  'DEV-1010': {
    id: 'DEV-1010',
    name: 'DO Sensor 2',
    type: 'DO Sensor',
    pond: 'Pond 05',
    status: 'Online',
    signal: '▮▮▮▮▮',
    battery: '83%',
    last: '2 min ago',
    firmware: 'v1.2.1',
    serial: 'DOS-1002-23F2X',
    mac: 'AC:23:F4:8D:5B:44',
    installedOn: 'Apr 19, 2024',
    lastCalib: 'May 19, 2024',
    nextCalib: 'Jun 19, 2024',
    readings: [
      ['Water Quality Score', '83 (Good)'],
      ['Dissolved Oxygen', '6.8 mg/L'],
      ['pH Level', '7.2'],
      ['Temperature', '23.5 °C'],
      ['Turbidity', '12 NTU'],
      ['Conductivity', '520 µS/cm'],
    ],
  },
};

export default function SitesPage() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [search, setSearch] = useState('');

  const filteredSites = useMemo(
    () => sites.filter((site) => [site.pond, site.name, site.location].some((item) => item.toLowerCase().includes(search.toLowerCase()))),
    [search],
  );

  return (
    <div className="animate-fade-in space-y-4 text-slate-300">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        <SiteStat icon={MapPin} label="Total Sites" value="24" desc="+ 11% vs last month" tone="text-sky-400 bg-sky-500/15" />
        <SiteStat icon={CheckCircle2} label="Active Sites" value="18" desc="+ 9% vs last month" tone="text-emerald-400 bg-emerald-500/15" />
        <SiteStat icon={PauseCircle} label="Inactive Sites" value="4" desc="- 4% vs last month" tone="text-amber-400 bg-amber-500/15" />
        <SiteStat icon={Wrench} label="Maintenance" value="2" desc="+ 7% vs last month" tone="text-violet-400 bg-violet-500/15" />
        <SiteStat icon={AlertTriangle} label="Critical Sites" value="0" desc="0% vs last month" tone="text-red-400 bg-red-500/15" />
      </div>

      <div className="flex flex-wrap items-end gap-3 border-y border-[#0d3660]/50 py-4">
        <div className="relative min-w-[320px] flex-1">
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
        <button className="ml-auto flex h-11 items-center gap-3 rounded-lg bg-blue-600 px-6 text-sm font-bold text-white"><Plus className="h-5 w-5" />Add New Site</button>
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
              <p className="mt-1 text-white">{site.name}</p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-300">{site.location} <span className="mx-2">•</span>{site.type}<span className="mx-2">•</span>{site.area}</p>
            </div>
            <div className="grid grid-cols-3 gap-8">
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

      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>Showing 1 to {filteredSites.length} of 24 sites</span>
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-md border border-[#0d3660]"><ChevronLeft className="h-4 w-4" /></button>
          <button className="h-9 w-9 rounded-md bg-blue-600 text-white">1</button>
          <button className="h-9 w-9 rounded-md border border-[#0d3660] text-white">2</button>
          <button className="h-9 w-9 rounded-md border border-[#0d3660] text-white">3</button>
          <button className="h-9 w-9 rounded-md border border-[#0d3660] text-white">4</button>
          <button className="h-9 w-9 rounded-md border border-[#0d3660] text-white">...</button>
          <button className="flex h-9 w-9 items-center justify-center rounded-md border border-[#0d3660]"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <span>Rows per page <button className="ml-3 rounded-md border border-[#0d3660] px-4 py-2 text-white">10</button></span>
      </div>

      {selectedSite && <SiteModal site={selectedSite} onClose={() => setSelectedSite(null)} />}
    </div>
  );
}

function SiteModal({ site, onClose }: { site: Site; onClose: () => void }) {
  const [tab, setTab] = useState('Overview');
  const tabs = ['Overview', 'Ponds', 'Devices', 'Agents', 'Water Quality', 'Alerts', 'History'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
      <section className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-[#0d3660] bg-[#041526] p-5 shadow-2xl">
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

        <SiteTabContent tab={tab} site={site} />

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-lg bg-blue-600 hover:bg-blue-500 px-8 py-3 font-bold text-white transition cursor-pointer">Close</button>
        </div>
      </section>
    </div>
  );
}

function SiteTabContent({ tab, site }: { tab: string; site: Site }) {
  switch (tab) {
    case 'Ponds':
      return <PondsTab />;
    case 'Devices':
      return <DevicesTab />;
    case 'Agents':
      return <AgentsTab />;
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
          ['Site Type', site.type],
          ['Region', 'South India'],
          ['Created On', 'Apr 10, 2024'],
          ['Last Updated', site.lastUpdated],
          ['Created By', 'Rahul Verma'],
        ].map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}
      </Panel>
      <Panel title="Site Image">
        <img src={siteImage} alt="" className="h-48 w-full rounded-lg object-cover" />
        <div className="mt-3 text-center text-sky-400">● <span className="text-slate-500">● ●</span></div>
      </Panel>
      <Panel title="Water Quality Summary">
        <div className="grid grid-cols-2 gap-3">
          <QualityBox label="Water Quality Score" value={String(site.score)} sub={site.water} circle />
          <QualityBox label="Dissolved Oxygen" value="6.8 mg/L" sub="Good" />
          <QualityBox label="pH Level" value="7.2" sub="Normal" />
          <QualityBox label="Temperature" value="23.5 °C" sub="Normal" />
        </div>
      </Panel>
      <Panel title="Site Description">
        <p className="text-sm leading-6 text-slate-300">Green Valley Farm is a premium freshwater aquaculture site located in Coimbatore, Tamil Nadu. The farm focuses on high-quality fish production with advanced monitoring and aeration systems.</p>
      </Panel>
      <Panel title="Location">
        <div className="relative h-32 overflow-hidden rounded-lg">
          <img src={siteImage} alt="" className="h-full w-full object-cover" />
          <MapPin className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-blue-500" />
        </div>
        <p className="mt-3 text-sm text-white">11.0165° N, 76.9558° E <span className="float-right text-sky-400 cursor-pointer hover:underline">Open in Maps</span></p>
      </Panel>
      <Panel title="Environmental Conditions">
        {[
          ['Weather', 'Partly Cloudy'],
          ['Wind Speed', '12 km/h'],
          ['Humidity', '68%'],
          ['Rainfall (Today)', '0 mm'],
        ].map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}
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
          <div className="flex gap-2">
            <button className="rounded-md border border-[#0d3660] px-3 py-2 text-xs text-white hover:border-cyan-400 transition">Filter</button>
            <button className="rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-bold text-white transition">+ Add Device</button>
          </div>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#071f35]/70 text-slate-300">
            <tr>{['Device ID', 'Device Name', 'Type', 'Pond', 'Status', 'Signal', 'Battery', 'Last Data', 'Actions'].map((h) => <th key={h} className="px-2 py-3 font-medium">{h}</th>)}</tr>
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
                <td><span className={`rounded px-2 py-1 text-[10px] font-bold ${
                  device.type === 'Water Quality'
                    ? 'bg-sky-500/20 text-sky-300'
                    : device.type === 'Aerator'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>{device.type}</span></td>
                <td className="text-white font-medium">{device.pond}</td>
                <td className={device.status === 'Online' ? 'text-emerald-400 font-semibold' : 'text-orange-400 font-semibold'}>• {device.status}</td>
                <td className={device.status === 'Online' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{device.signal}</td>
                <td className="text-white font-medium">{device.battery}</td>
                <td className="text-slate-350">{device.last}</td>
                <td onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4 text-white hover:text-cyan-305 transition" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
          <span>Showing 1 to 10 of 26 devices</span>
          <span className="space-x-2">
            <button className="rounded bg-blue-600 px-3 py-2 text-white font-semibold">1</button>
            <button className="rounded border border-[#0d3660] px-3 py-2 hover:border-cyan-400 transition">2</button>
            <button className="rounded border border-[#0d3660] px-3 py-2 hover:border-cyan-400 transition">3</button>
          </span>
        </div>
      </Panel>

      <Panel title="Device Details">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-sky-500/15"><Cpu className="h-9 w-9 text-sky-400" /></div>
          <div>
            <p className={`text-xs font-bold ${selectedDev.status === 'Online' ? 'text-emerald-400' : 'text-orange-400'}`}>• {selectedDev.status}</p>
            <h3 className="font-bold text-white text-sm sm:text-base leading-tight">{selectedDev.name}</h3>
            <p className="mt-1.5 inline-block rounded bg-blue-600/30 px-2 py-0.5 text-xs text-sky-300 font-mono">{selectedDev.id}</p>
            <p className="mt-1 text-xs text-slate-300 font-medium">{selectedDev.pond}</p>
          </div>
        </div>
        {[
          ['Device Type', selectedDev.type + ' Sensor'],
          ['Firmware Version', selectedDev.firmware],
          ['Serial Number', selectedDev.serial],
          ['MAC Address', selectedDev.mac],
          ['Installed On', selectedDev.installedOn],
          ['Last Calibration', selectedDev.lastCalib],
          ['Next Calibration', selectedDev.nextCalib],
        ].map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}
        
        <h4 className="mt-5 font-bold text-white border-t border-slate-800 pt-4 flex justify-between items-center">
          <span>Live Readings</span>
          <span className="text-xs font-normal text-slate-450">{selectedDev.last}</span>
        </h4>
        <div className="mt-2 space-y-1">
          {selectedDev.readings.map(([label, value]) => (
            <InfoLine key={label} label={label} value={value} />
          ))}
        </div>
        <button className="mt-4 w-full rounded-md border border-[#0d3660] hover:border-cyan-400 px-3 py-2 text-xs text-sky-400 font-semibold transition cursor-pointer">
          View Live Monitoring
        </button>
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
        <div className="grid grid-cols-5 gap-3">
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
                <span className={`rounded px-2 py-1 text-[10px] font-bold ${pond.status === 'Warning' ? 'bg-amber-500/20 text-amber-300' : pond.status === 'Maintenance' ? 'bg-orange-500/20 text-orange-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{pond.status}</span>
              </div>
              <h3 className="mt-4 font-bold text-white">{pond.name}</h3>
              <p className="mt-1 text-xs text-slate-300">{pond.purpose}</p>
              <p className="mt-3 text-sm text-white">{pond.devicesCount}</p>
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

function AgentsTab() {
  const agents = [
    ['Agent-001', 'Ravi Kumar', 'Pond 01, Pond 02', 'Online', '2 min ago'],
    ['Agent-002', 'Meera Iyer', 'Pond 03', 'Online', '5 min ago'],
    ['Agent-003', 'Sanjay Rao', 'Pond 04', 'Warning', '18 min ago'],
    ['Agent-004', 'Kiran Das', 'Pond 05', 'Online', '7 min ago'],
    ['Agent-005', 'Asha Nair', 'All Ponds', 'Online', '1 min ago'],
  ];

  return (
    <div className="mt-4 grid grid-cols-[1fr_280px] gap-4">
      <Panel title="Active Agents">
        <div className="divide-y divide-[#0d3660]/50">
          {agents.map(([id, name, assignment, status, seen]) => (
            <div key={id} className="grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center py-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15"><UserRound className="h-5 w-5 text-cyan-300" /></div>
                <div><p className="font-bold text-white">{name}</p><p className="text-xs text-slate-400">{id}</p></div>
              </div>
              <span className="text-slate-300">{assignment}</span>
              <span className={status === 'Warning' ? 'text-amber-400' : 'text-emerald-400'}>• {status}</span>
              <span className="text-slate-300">{seen}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Agent Coverage">
        <ScoreCircle score={92} label="Coverage" />
        {[
          ['Total Agents', '5'],
          ['Online', '4'],
          ['Warning', '1'],
          ['Pending Tasks', '3'],
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
    ['Turbidity', '12 NTU', 'Normal'],
    ['Conductivity', '520 µS/cm', 'Normal'],
    ['Salinity', '0.5 PSU', 'Stable'],
    ['Ammonia', '0.02 mg/L', 'Safe'],
  ];

  return (
    <div className="mt-4 grid grid-cols-[1fr_300px] gap-4">
      <Panel title="Live Water Quality">
        <div className="grid grid-cols-4 gap-3">
          {metrics.map(([label, value, status]) => (
            <div key={label} className="rounded-lg border border-[#0d3660] p-4 bg-[#031426]/50">
              <p className="text-xs text-slate-300">{label}</p>
              <p className="mt-4 text-2xl font-bold text-white">{value}</p>
              <p className="mt-2 text-sm text-emerald-405 font-semibold">{status}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Trend Snapshot">
        <svg viewBox="0 0 260 140" className="h-40 w-full text-cyan-300" fill="none">
          <path d="M8 105 C35 82 48 91 70 64 S116 45 140 70 184 88 205 46 236 36 252 28" stroke="currentColor" strokeWidth="4" />
          <path d="M8 118 L252 118" stroke="#0d3660" />
        </svg>
        <p className="text-xs leading-5 text-slate-355 mt-2">Quality is stable across monitored ponds with one moderate turbidity spike in Pond 03.</p>
      </Panel>
    </div>
  );
}

function AlertsTab() {
  const alerts = [
    ['High Turbidity', 'Pond 03', 'Warning', 'May 18, 10:12 AM'],
    ['Aerator Inspection Due', 'Pond 05', 'Info', 'May 18, 09:40 AM'],
    ['Battery Low', 'DEV-1005', 'Warning', 'May 18, 08:20 AM'],
    ['Water Quality Normal', 'Pond 01', 'Resolved', 'May 18, 07:55 AM'],
  ];

  return (
    <div className="mt-4">
      <Panel title="Site Alerts">
        <div className="divide-y divide-[#0d3660]/50">
          {alerts.map(([title, target, severity, time]) => (
            <div key={`${title}-${target}`} className="grid grid-cols-[1fr_160px_120px_180px_40px] items-center py-4 text-sm hover:bg-[#071f35]/25 px-2 rounded transition">
              <div className="flex items-center gap-3"><AlertTriangle className={`h-5 w-5 ${severity === 'Resolved' ? 'text-emerald-400' : severity === 'Info' ? 'text-sky-400' : 'text-amber-400'}`} /><span className="font-bold text-white">{title}</span></div>
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
    ['May 17, 2024', 'Added two sensors to Pond 02', 'Agent-001'],
    ['May 16, 2024', 'Aerator calibration completed', 'Maintenance Team'],
    ['May 14, 2024', 'Feed schedule updated', 'Rahul Verma'],
    ['May 10, 2024', 'Monthly site audit completed', 'Operations Manager'],
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
  return <section className="glass rounded-lg p-4"><div className="flex items-center gap-4"><div className={`flex h-14 w-14 items-center justify-center rounded-full ${tone}`}><Icon className="h-7 w-7" /></div><div><p className="text-sm text-white">{label}</p><p className="mt-1 text-3xl font-bold text-white">{value}</p><p className="mt-2 text-xs text-emerald-400">{desc}</p></div></div></section>;
}

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
  return <div className="flex justify-between border-b border-[#0d3660]/50 py-2.5 text-xs"><span className="text-slate-350">{label}</span><span className="text-right text-white font-semibold">{value}</span></div>;
}

function QualityBox({ label, value, sub, circle }: { label: string; value: string; sub: string; circle?: boolean }) {
  return <div className="rounded-lg border border-[#0d3660] p-4 bg-[#031426]/30">{circle ? <ScoreCircle score={Number(value)} label={sub} compact /> : <><p className="text-xs text-slate-300">{label}</p><p className="mt-4 text-2xl font-bold text-white">{value}</p><p className="mt-2 text-sm text-emerald-450 font-semibold">{sub}</p></>} {!circle && null}</div>;
}
