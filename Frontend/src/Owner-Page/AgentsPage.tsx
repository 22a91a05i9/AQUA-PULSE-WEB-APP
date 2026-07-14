import { useEffect, useMemo, useState } from 'react';
import { Clock, Filter, MoreHorizontal, Plus, Search, UserRound, Users } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { RowActionMenu } from '../lib/tableActions';
import { DialogButton, DialogField, ProjectDialog } from '../lib/projectDialog';

interface Agent {
  id: string;
  name: string;
  site: string;
  area: string;
  status: 'Online' | 'Warning' | 'Offline';
  lastSeen: string;
  score: number;
}

const statusClass: Record<Agent['status'], string> = {
  Online: 'text-emerald-400',
  Warning: 'text-amber-400',
  Offline: 'text-red-400',
};

const defaultAgents: Agent[] = [
  { id: 'AG-001', name: 'Agent-001', site: 'North Farm', area: 'Area 1', status: 'Online', lastSeen: '2 min ago', score: 98 },
  { id: 'AG-004', name: 'Agent-002', site: 'East Zone', area: 'Area 1', status: 'Online', lastSeen: '5 min ago', score: 92 },
  { id: 'AG-008', name: 'Agent-003', site: 'Blue Farm', area: 'Area 1', status: 'Warning', lastSeen: '10 min ago', score: 72 },
  { id: 'AG-017', name: 'Agent-004', site: 'West Farm', area: 'Area 1', status: 'Offline', lastSeen: '1 hr ago', score: 0 },
  { id: 'AG-042', name: 'Agent-005', site: 'Central Farm', area: 'Area 1', status: 'Online', lastSeen: '3 min ago', score: 88 },
  { id: 'AG-056', name: 'Agent-006', site: 'South Zone', area: 'Area 2', status: 'Online', lastSeen: '8 min ago', score: 85 },
  { id: 'AG-061', name: 'Agent-007', site: 'Coastal Farm', area: 'Area 2', status: 'Warning', lastSeen: '15 min ago', score: 68 },
  { id: 'AG-078', name: 'Agent-008', site: 'Lake View Farm', area: 'Area 2', status: 'Online', lastSeen: '4 min ago', score: 90 },
];

export default function AgentsPage({ onAddAgent }: { onAddAgent: () => void }) {
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Status');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [notice, setNotice] = useState('');
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);
  const [editName, setEditName] = useState('');

  const handleDeleteAgent = async (agent: Agent) => {
    try {
      const session = getAuthSession();
      if (!session) return;
      await apiRequest(`/owner/agents/${agent.id}`, {
        method: 'DELETE',
        token: session.token,
      });
      setAgentsList((prev) => prev.filter((a) => a.id !== agent.id));
      setNotice(`Agent "${agent.name}" deleted successfully.`);
      setAgentToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete agent:', err);
      setNotice(err?.detail || err?.message || 'Failed to delete agent.');
    }
  };

  const handleEditAgent = async (agent: Agent) => {
    try {
      const session = getAuthSession();
      if (!session) return;
      const updated = await apiRequest<any>(`/owner/agents/${agent.id}`, {
        method: 'PUT',
        token: session.token,
        body: {
          full_name: editName.trim(),
        },
      });
      setAgentsList((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, name: updated.full_name } : a))
      );
      setNotice('Agent profile updated successfully.');
      setAgentToEdit(null);
    } catch (err: any) {
      console.error('Failed to update agent:', err);
      setNotice(err?.detail || err?.message || 'Failed to update agent.');
    }
  };

  useEffect(() => {
    async function fetchAgents() {
      try {
        const session = getAuthSession();
        if (session) {
          const res = await apiRequest<any[]>('/owner/agents', {
            token: session.token,
          });
          const mappedAgents: Agent[] = res.map((a: any) => {
            let lastSeen = 'Never';
            if (a.last_portal_access) {
              const lastAccessTime = new Date(a.last_portal_access);
              const now = new Date();
              const diffMs = now.getTime() - lastAccessTime.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMs / 3600000);
              const diffDays = Math.floor(diffMs / 86400000);

              if (diffMins < 1) {
                lastSeen = 'Just now';
              } else if (diffMins < 60) {
                lastSeen = `${diffMins} min ago`;
              } else if (diffHours < 24) {
                lastSeen = `${diffHours}h ago`;
              } else {
                lastSeen = `${diffDays}d ago`;
              }
            }

            return {
              id: String(a.id),
              name: a.full_name || 'Unnamed Agent',
              site: a.farm_type_id ? `Site Type #${a.farm_type_id}` : 'General',
              area: 'Area 1',
              status: a.is_active ? 'Online' : 'Offline',
              lastSeen,
              score: 95,
            };
          });
          setAgentsList(mappedAgents);
        }
      } catch (err) {
        console.error('Failed to load agents, using fallback defaults: ', err);
        setAgentsList(defaultAgents);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  const filteredAgents = useMemo(() => {
    return agentsList.filter((agent) => {
      const matchesSearch = [agent.name, agent.site, agent.id, agent.area].some((value) =>
        value.toLowerCase().includes(search.toLowerCase()),
      );
      const matchesStatus = status === 'All Status' || agent.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status, agentsList]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const activeCount = agentsList.filter((a) => a.status === 'Online').length;

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {notice && <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">{notice}</p>}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="metric-card glass rounded-xl p-6">
          <div className="metric-card-row">
            <Users className="h-9 w-9 text-cyan-300" />
            <div className="metric-copy">
              <p className="metric-label text-white">Total Agents</p>
              <p className="metric-value mt-2 font-extrabold text-white">{agentsList.length}</p>
              <p className="metric-desc mt-1 text-emerald-400">Registered in system</p>
            </div>
          </div>
        </section>
        <section className="metric-card glass rounded-xl p-6">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
            <div className="metric-card-row flex-1">
              <Users className="h-9 w-9 text-cyan-300" />
              <div className="metric-copy">
                <p className="metric-label text-white">Active Agents</p>
                <p className="metric-value mt-2 font-extrabold text-white">{activeCount}</p>
                <p className="metric-desc mt-1 text-emerald-400">Online now</p>
              </div>
            </div>
            <div className="flex gap-3">
              {showAdvancedFilters && (
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="h-11 rounded-lg border border-[#0d3660] bg-[#020b18]/60 px-4 text-sm text-white outline-none animate-fade-in"
                >
                  <option>All Status</option>
                  <option>Online</option>
                  <option>Warning</option>
                  <option>Offline</option>
                </select>
              )}
              <button 
                onClick={() => setShowAdvancedFilters(prev => !prev)}
                className={`flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                  showAdvancedFilters ? 'border-[#06b6d4] text-[#22d3ee] bg-[#06b6d4]/10' : 'border-[#0d3660] text-white hover:bg-[#071f35]'
                }`}
              >
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
            <p className="text-sm text-slate-300">ID: AG-{agent.id}</p>
            <RowActionMenu
              onEdit={() => {
                setAgentToEdit(agent);
                setEditName(agent.name);
              }}
              onDelete={() => setAgentToDelete(agent)}
            />
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-300">Showing {filteredAgents.length} agents</p>
        <button
          onClick={onAddAgent}
          className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-500 transition cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Add New Agent
        </button>
      </div>
      {agentToEdit && (
        <ProjectDialog
          title="Edit Agent"
          description="Update the agent profile shown across owner management screens."
          onClose={() => setAgentToEdit(null)}
          footer={
            <>
              <DialogButton onClick={() => setAgentToEdit(null)}>Cancel</DialogButton>
              <DialogButton tone="primary" disabled={!editName.trim()} onClick={() => handleEditAgent(agentToEdit)}>Save Changes</DialogButton>
            </>
          }
        >
          <DialogField label="Agent Name" value={editName} onChange={setEditName} />
        </ProjectDialog>
      )}
      {agentToDelete && (
        <ProjectDialog
          title="Delete Agent?"
          description={`This will remove "${agentToDelete.name}" and clear their active assignments.`}
          onClose={() => setAgentToDelete(null)}
          footer={
            <>
              <DialogButton onClick={() => setAgentToDelete(null)}>Cancel</DialogButton>
              <DialogButton tone="danger" onClick={() => handleDeleteAgent(agentToDelete)}>Delete Agent</DialogButton>
            </>
          }
        />
      )}
    </div>
  );
}
