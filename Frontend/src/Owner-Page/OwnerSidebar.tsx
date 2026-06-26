import {
  Activity,
  BarChart3,
  Bell,
  ClipboardList,
  Cpu,
  Database,
  FileText,
  LayoutDashboard,
  MapPin,
  Menu,
  Settings,
  UserRound,
  Droplets,
  Headphones,
  LogOut,
} from 'lucide-react';

const ownerNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sites', label: 'Sites', icon: MapPin },
  { id: 'agents', label: 'Agents', icon: UserRound },
  { id: 'devices', label: 'Devices', icon: Cpu },
  { id: 'live', label: 'Live Monitoring', icon: Activity, badge: 'Live', badgeTone: 'green' },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'alerts', label: 'Alerts', icon: Bell, badge: '12', badgeTone: 'red' },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function OwnerSidebar({
  currentPage,
  onNavigate,
  onLogout,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-[#0d3660] bg-[#031426]/95">
      <div className="flex h-[92px] items-center gap-3 px-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-300/10">
          <Droplets className="h-8 w-8 text-cyan-300" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold text-white">
            AQUA <span className="text-cyan-300">PULSE</span>
          </h1>
        </div>
        <Menu className="ml-auto h-5 w-5 text-slate-300" />
      </div>

      <nav className="flex-1 space-y-2 px-3 py-3 overflow-y-auto">
        {ownerNavItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex h-[50px] w-full items-center gap-4 rounded-lg px-4 text-left text-base font-medium transition cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-cyan-500/25 to-blue-700/60 text-white'
                  : 'text-slate-200 hover:bg-[#071f35] hover:text-cyan-200'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-cyan-300' : 'text-slate-200'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                    item.badgeTone === 'green' ? 'bg-emerald-600' : 'bg-red-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-2 border-t border-[#0d3660]/50">
        <div className="rounded-lg border border-[#0d3660] bg-[#041526]/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/15">
              <Headphones className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Need Help?</p>
              <p className="text-xs text-slate-300">Contact Support</p>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex h-[48px] items-center gap-4 rounded-lg px-4 text-left text-base font-medium text-slate-400 hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
