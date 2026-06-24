import { useMemo, useState } from 'react';
import { Clock, Filter, MoreHorizontal, Plus, Search, UserRound, Users } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  site: string;
  area: string;
  status: 'Online' | 'Warning' | 'Offline';
  lastSeen: string;
  score: number;
}

const agents: Agent[] = [
  { id: 'AG-001', name: 'Agent-001', site: 'North Farm', area: 'Area 1', status: 'Online', lastSeen: '2 min ago', score: 98 },
  { id: 'AG-004', name: 'Agent-002', site: 'East Zone', area: 'Area 1', status: 'Online', lastSeen: '5 min ago', score: 92 },
  { id: 'AG-008', name: 'Agent-003', site: 'Blue Farm', area: 'Area 1', status: 'Warning', lastSeen: '10 min ago', score: 72 },
  { id: 'AG-017', name: 'Agent-004', site: 'West Farm', area: 'Area 1', status: 'Offline', lastSeen: '1 hr ago', score: 0 },
  { id: 'AG-042', name: 'Agent-005', site: 'Central Farm', area: 'Area 1', status: 'Online', lastSeen: '3 min ago', score: 88 },
  { id: 'AG-056', name: 'Agent-006', site: 'South Zone', area: 'Area 2', status: 'Online', lastSeen: '8 min ago', score: 85 },
  { id: 'AG-061', name: 'Agent-007', site: 'Coastal Farm', area: 'Area 2', status: 'Warning', lastSeen: '15 min ago', score: 68 },
  { id: 'AG-078', name: 'Agent-008', site: 'Lake View Farm', area: 'Area 2', status: 'Online', lastSeen: '4 min ago', score: 90 },
];

const statusClass: Record<Agent['status'], string> = {
  Online: 'text-emerald-400',
  Warning: 'text-amber-400',
  Offline: 'text-red-400',
};

export default function AgentsPage({ onAddAgent }: { onAddAgent: () => void }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Status');

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch = [agent.name, agent.site, agent.id, agent.area].some((value) =>
        value.toLowerCase().includes(search.toLowerCase()),
      );
      const matchesStatus = status === 'All Status' || agent.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="glass rounded-xl p-6">
          <div className="flex items-center gap-5">
            <Users className="h-9 w-9 text-cyan-300" />
            <div>
              <p className="text-sm text-white">Total Agents</p>
              <p className="mt-2 text-3xl font-extrabold text-white">24</p>
              <p className="mt-1 text-sm text-emerald-400">15% vs last month</p>
            </div>
          </div>
        </section>
        <section className="glass rounded-xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <Users className="h-9 w-9 text-cyan-300" />
              <div>
                <p className="text-sm text-white">Active Agents</p>
                <p className="mt-2 text-3xl font-extrabold text-white">18</p>
                <p className="mt-1 text-sm text-emerald-400">9% vs last month</p>
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-11 rounded-lg border border-[#0d3660] bg-[#020b18]/60 px-4 text-sm text-white outline-none"
              >
                <option>All Status</option>
                <option>Online</option>
                <option>Warning</option>
                <option>Offline</option>
              </select>
              <button className="flex h-11 items-center gap-2 rounded-lg border border-[#0d3660] px-4 text-sm font-semibold text-white">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-12 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/60 pl-14 pr-4 text-sm text-white outline-none"
          placeholder="Search agents..."
        />
      </div>

      <div className="space-y-2">
        {filteredAgents.map((agent) => (
          <section key={agent.id} className="glass grid grid-cols-[0.75fr_1.2fr_1fr_0.7fr_0.8fr_44px] items-center gap-4 rounded-lg px-7 py-4">
            <div className={`flex items-center gap-2 text-sm font-bold ${statusClass[agent.status]}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-current" />
              {agent.status}
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full border ${agent.status === 'Warning' ? 'border-amber-400/50 bg-amber-400/15' : agent.status === 'Offline' ? 'border-red-400/50 bg-red-400/15' : 'border-cyan-300/50 bg-cyan-300/15'}`}>
                <UserRound className="h-8 w-8 text-cyan-300" />
              </div>
              <div>
                <p className="font-bold text-white">{agent.name}</p>
                <p className="mt-1 text-sm text-slate-300">
                  {agent.site} <span className="ml-2 rounded bg-cyan-500/15 px-2 py-1 text-xs text-cyan-300">{agent.area}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Clock className="h-4 w-4" />
              Last seen: {agent.lastSeen}
            </div>
            <div className={`mx-auto flex h-16 w-16 flex-col items-center justify-center rounded-full border-4 ${agent.score >= 80 ? 'border-emerald-500' : agent.score === 0 ? 'border-red-500' : 'border-amber-400'}`}>
              <span className="text-lg font-extrabold text-white">{agent.score}%</span>
              <span className="text-[10px] text-slate-300">Score</span>
            </div>
            <p className="text-sm text-slate-300">ID: {agent.id}</p>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-[#071f35]">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-300">Showing 1 to {filteredAgents.length} of 24 agents</p>
        <button
          onClick={onAddAgent}
          className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white"
        >
          <Plus className="h-5 w-5" />
          Add New Agent
        </button>
      </div>
    </div>
  );
}
