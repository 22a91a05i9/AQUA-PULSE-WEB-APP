import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Cpu,
  Activity,
  Bell,
  Shield,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  Fish,
} from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const agentNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sites', label: 'Sites', icon: MapPin },
  { id: 'devices', label: 'Devices', icon: Cpu },
  { id: 'live', label: 'Live Monitoring', icon: Activity },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'sos', label: 'SOS Emergency', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate, onLogout, collapsed, setCollapsed }: SidebarProps) {
  const [hovered, setHovered] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const { t } = useTranslation();

  const isCollapsed = collapsed && !hovered;

  useEffect(() => {
    if (animating) {
      const timer = setTimeout(() => setAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [animating]);

  useEffect(() => {
    async function loadAlertCount() {
      try {
        const session = getAuthSession();
        if (!session) return;
        const alerts = await apiRequest<Array<{ status: string; severity?: string }>>('/readings/alerts/me', {
          token: session.token,
        });
        setAlertCount(alerts.filter((alert) => alert.status !== 'safe' && alert.status !== 'resolved').length);
      } catch (err) {
        console.error('Failed to load sidebar alert count:', err);
        setAlertCount(0);
      }
    }

    loadAlertCount();
  }, []);

  return (
    <aside
      className="app-sidebar fixed left-0 top-0 h-screen glass-dark z-40 flex flex-col transition-all duration-400 ease-in-out"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-[#0d3660]">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}
        >
          <Fish className="w-7 h-7 text-white" />
        </div>
        {!isCollapsed && (
          <div className="animate-slide-in-left">
            <h1 className="text-xl font-bold text-white leading-tight">Aqua Pulse</h1>
            <p className="text-xs text-[#06b6d4] -mt-0.5">Smart Aquaculture</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {agentNavItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex min-h-11 items-center gap-3 px-3.5 py-3 rounded-lg text-[clamp(0.85rem,0.95vw,0.95rem)] transition-all duration-300 cursor-pointer group relative ${
                isActive
                  ? 'nav-active text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#0a2a47]/50'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-all ${isActive ? 'text-[#22d3ee]' : 'group-hover:text-[#22d3ee]'}`} />
              {!isCollapsed && (
                <span className={`truncate transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                  {t(item.label)}
                </span>
              )}
              {item.id === 'alerts' && alertCount > 0 && (
                <span className={`badge-pulse ${isCollapsed ? 'absolute right-1 top-1 w-3 h-3 text-[8px] flex items-center justify-center' : 'ml-auto'} bg-[#ef4444] text-white rounded-full text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center`}>
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
              {isCollapsed && isActive && (
                <div className="absolute -right-1 w-1 h-6 rounded-full bg-[#06b6d4]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 space-y-1">
        <button 
          onClick={() => alert('Support Number: 6303403957')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-[#0a2a47]/50 transition-all"
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="animate-slide-in-left">{t('Need Help?')}</span>}
        </button>
        {!isCollapsed && (
          <p className="text-[10px] text-slate-500 px-3 animate-slide-in-left">6303403957</p>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all mt-2"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="animate-slide-in-left">{t('Sign Out')}</span>}
        </button>
      </div>
    </aside>
  );
}
