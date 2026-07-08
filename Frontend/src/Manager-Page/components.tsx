import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplet,
  CalendarDays,
  AlertTriangle,
  AlertCircle,
  CircleDot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AuthSession, AuthUser } from '../lib/auth';
import { apiRequest } from '../lib/api';
import { managerNavItems, managerQuickCards, managerUser, statusColors } from './data';

export type ManagerPageId =
  | 'dashboard'
  | 'owners'
  | 'devices'
  | 'assignments'
  | 'analytics'
  | 'reports'
  | 'settings'
  | 'alerts';

export function ManagerShell({
  session,
  currentPage,
  onNavigate,
  onLogout,
  children,
}: {
  session: AuthSession;
  currentPage: ManagerPageId;
  onNavigate: (page: ManagerPageId) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    async function loadAlertCount() {
      try {
        const alerts = await apiRequest<AlertNotificationResponse[]>('/manager/alerts', {
          token: session.token,
        });
        setAlertCount(alerts.filter((alert) => alert.status !== 'safe' && alert.status !== 'resolved').length);
      } catch (err) {
        console.error('Failed to load manager alert count:', err);
      }
    }

    loadAlertCount();
  }, [session.token]);

  return (
    <div className="app-shell manager-shell min-h-screen bg-[#020b18] text-slate-100">
      <ManagerSidebar currentPage={currentPage} onNavigate={onNavigate} alertCount={alertCount} />
      <div className="app-main min-h-screen">
        <ManagerMobileNav currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} alertCount={alertCount} />
        <ManagerHeader session={session} onLogout={onLogout} onNavigate={onNavigate} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

function ManagerMobileNav({
  currentPage,
  onNavigate,
  onLogout,
  alertCount,
}: {
  currentPage: ManagerPageId;
  onNavigate: (page: ManagerPageId) => void;
  onLogout: () => void;
  alertCount: number;
}) {
  const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="mobile-workspace-nav lg:hidden">
      <div className="mobile-nav-brand">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/40 bg-cyan-300/10">
            <Droplet className="h-6 w-6 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-cyan-300">Aqua Pulse</p>
            <p className="truncate text-xs text-slate-200">Manager Workspace</p>
          </div>
        </div>
        <div className="mobile-nav-actions">
          <button type="button" onClick={() => onNavigate('alerts')} className="mobile-date-chip relative">
            <Bell className="h-4 w-4 text-cyan-300" />
            {alertCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>
          <span className="mobile-date-chip">
            <CalendarDays className="h-4 w-4 text-cyan-300" />
            {todayLabel}
          </span>
          <button type="button" onClick={onLogout} className="mobile-logout-button">
            Logout
          </button>
        </div>
      </div>
      <nav className="mobile-nav-scroll">
        {managerNavItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id as ManagerPageId)}
              className={`mobile-nav-item ${active ? 'mobile-nav-item-active' : ''}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function ManagerSidebar({
  currentPage,
  onNavigate,
  alertCount,
}: {
  currentPage: ManagerPageId;
  onNavigate: (page: ManagerPageId) => void;
  alertCount: number;
}) {
  const [lastUpdatedTime, setLastUpdatedTime] = useState('');

  useEffect(() => {
    const now = new Date();
    setLastUpdatedTime(now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }));
  }, []);

  return (
    <aside className="app-sidebar fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#0d3660] bg-[#031426]/95">
      <div className="dashboard-header flex items-center gap-4 border-b border-[#0d3660]">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-cyan-300/40 bg-cyan-300/10">
          <Droplet className="h-9 w-9 text-cyan-300" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-cyan-300">Aqua Pulse</h1>
          <p className="text-sm text-white">Smart Aquaculture</p>
        </div>
      </div>

      <nav className="flex-1 px-3 pt-6 xl:px-4">
        {managerNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const badge = item.id === 'alerts' ? alertCount : item.badge;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ManagerPageId)}
            className={`${item.separated ? 'mt-6' : 'mt-2'} flex min-h-12 w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[clamp(0.9rem,1vw,1rem)] font-semibold transition ${
                isActive
                  ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-[0_12px_35px_rgba(37,99,235,0.2)]'
                  : 'text-slate-200 hover:bg-[#071f35] hover:text-cyan-200'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="min-w-0 truncate">{item.label}</span>
              {badge ? (
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 p-4">
        {managerQuickCards.map((card) => {
          const Icon = card.icon;
          const displayValue = card.label === 'Last Updated' 
            ? lastUpdatedTime 
            : card.label === 'Need Help?' 
              ? '6303403957' 
              : card.value;

          return (
            <div 
              key={card.label} 
              onClick={card.label === 'Need Help?' ? () => alert('Support Number: 6303403957') : undefined}
              className={`rounded-lg border border-[#0d3660] bg-[#041526]/80 p-4 ${
                card.label === 'Need Help?' ? 'cursor-pointer hover:bg-[#0c3154] transition' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{card.label}</p>
                  <p className="mt-1 text-xs text-slate-300">{displayValue || 'Loading...'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

interface NotificationItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  device: string;
  pond: string;
  time: string;
  read: boolean;
}

interface AlertNotificationResponse {
  id: number;
  device_id: number;
  site_id: number | null;
  severity: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
}

function ManagerHeader({ session, onLogout, onNavigate }: { session: AuthSession; onLogout: () => void; onNavigate?: (page: ManagerPageId) => void }) {
  const [profileUser, setProfileUser] = useState<Partial<AuthUser>>({});
  const displayName = profileUser.name || session.user.name || managerUser.name;
  const displayEmail = profileUser.email || session.user.email || managerUser.email;
  const avatarUrl =
    profileUser.avatarUrl ||
    session.user.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=0a2a47`;
  // Popover States
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Refs for click outside
  const calendarRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const settings = await apiRequest<any>('/settings', {
          token: session.token,
        });
        const profile = settings.profile_json || {};
        setProfileUser({
          name: profile.full_name || session.user.name,
          email: profile.email || session.user.email,
          avatarUrl: profile.avatar || profile.avatarUrl || session.user.avatarUrl,
        });
      } catch (err) {
        console.error('Failed to load manager header profile:', err);
      }
    }

    const handleProfileUpdated = (event: Event) => {
      setProfileUser((event as CustomEvent<Partial<AuthUser>>).detail || {});
    };

    loadProfile();
    window.addEventListener('aqua-pulse-profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('aqua-pulse-profile-updated', handleProfileUpdated);
  }, [session.token, session.user.avatarUrl, session.user.email, session.user.name]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadAlertNotifications() {
      try {
        const alerts = await apiRequest<AlertNotificationResponse[]>('/manager/alerts', {
          token: session.token,
        });

        setNotifications(
          alerts.slice(0, 5).map((alert) => ({
            id: String(alert.id),
            type: alert.severity === 'critical' || alert.severity === 'warning' ? alert.severity : 'info',
            message: alert.title || alert.message || 'Water quality alert',
            device: `Device #${alert.device_id}`,
            pond: alert.site_id ? `Site #${alert.site_id}` : 'Owner device alert',
            time: new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
          }))
        );
      } catch (err) {
        console.error('Failed to load manager alert notifications:', err);
      }
    }

    loadAlertNotifications();
  }, [session.token]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handlePresetSelect = (preset: string) => {
    const today = new Date();
    if (preset === 'Today') {
      setSelectedDate(today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    } else if (preset === 'Yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      setSelectedDate(yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    } else if (preset === 'Last 7 Days') {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      setSelectedDate(`${lastWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
    } else if (preset === 'Last 30 Days') {
      const lastMonth = new Date(today);
      lastMonth.setDate(today.getDate() - 30);
      setSelectedDate(`${lastMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
    }
    setShowCalendar(false);
  };

  // Generate calendar days for current month/year dynamically
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth();
  const currentMonthName = today.toLocaleDateString('en-US', { month: 'short' });
  
  const daysInCurrentMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonthIdx, 1).getDay();
  const daysOfGrid = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  return (
    <header className="dashboard-header hidden items-center justify-end border-b border-[#0d3660] bg-[#031426]/80 backdrop-blur z-30 relative lg:flex">
      <div className="dashboard-header-actions flex items-center gap-4">
        {/* Calendar Picker Button & Popover */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`hidden h-12 items-center gap-3 rounded-lg border bg-[#031426] px-4 text-sm text-white transition lg:flex ${showCalendar ? 'border-cyan-400 ring-2 ring-cyan-500/20' : 'border-[#0d3660] hover:border-cyan-400'}`}
          >
            <CalendarDays className="h-4 w-4 text-cyan-400" />
            <span className="min-w-0 truncate">{selectedDate}</span>
            <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
          </button>

          {showCalendar && (
            <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-[#0d3660] bg-[#031426]/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-fade-in text-left">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Select Date</span>
                <span className="text-xs font-semibold text-cyan-400">
                  {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Date Presets */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetSelect(preset)}
                    className="rounded bg-[#071f35] px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-[#0c3154] hover:text-white transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Day Grid */}
              <div className="border-t border-[#0d3660]/60 pt-3">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before the first day of the month */}
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <span key={`empty-${idx}`} />
                  ))}
                  {daysOfGrid.map((day) => {
                    const isSelected = selectedDate === `${currentMonthName} ${day}, ${currentYear}`;
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDate(`${currentMonthName} ${day}, ${currentYear}`);
                          setShowCalendar(false);
                        }}
                        className={`h-7 w-7 rounded text-xs font-semibold flex items-center justify-center transition ${isSelected ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-300 hover:bg-[#071f35] hover:text-white'}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell & Popover */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition ${showNotifications ? 'text-cyan-400 bg-[#071f35]' : 'text-slate-200 hover:text-[#22d3ee] hover:bg-[#071f35]/50'}`}
          >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-[#0d3660] bg-[#031426]/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-fade-in text-left">
              <div className="mb-3 flex items-center justify-between border-b border-[#0d3660]/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-72 overflow-y-auto space-y-2.5">
                {notifications.length === 0 ? (
                  <div className="rounded-lg border border-[#0d3660]/50 bg-[#071f35]/30 p-4 text-center text-xs text-slate-400">
                    No recent owner device alerts.
                  </div>
                ) : notifications.map((notification) => {
                  return (
                    <div
                      key={notification.id}
                      onClick={() => {
                        handleNotificationClick(notification.id);
                      }}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border transition cursor-pointer ${notification.read ? 'bg-transparent border-transparent' : 'bg-[#071f35]/60 border-[#0d3660]/40 hover:bg-[#071f35]'}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notification.type === 'critical' ? (
                          <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
                        ) : notification.type === 'warning' ? (
                          <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                        ) : (
                          <CircleDot className="h-4.5 w-4.5 text-cyan-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{notification.device}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">{notification.time}</span>
                        </div>
                        <p className={`text-xs font-semibold truncate ${notification.read ? 'text-slate-400' : 'text-white'} mt-0.5`}>
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{notification.pond}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View All Footer */}
              <div className="mt-3 border-t border-[#0d3660]/60 pt-2.5 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    if (onNavigate) onNavigate('alerts');
                  }}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 w-full"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onNavigate?.('settings')}
          className="flex items-center gap-3 rounded-lg border border-[#0d3660] bg-[#041526] px-3 py-2 transition hover:border-cyan-300"
        >
          <img
            className="h-10 w-10 rounded-full"
            src={avatarUrl}
            alt={displayName}
          />
          <div className="hidden text-left md:block">
            <p className="text-sm font-bold text-white">{displayName}</p>
            <p className="text-xs text-slate-300">{displayEmail}</p>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export function ControlCenter({ compact = false, onOpen }: { compact?: boolean; onOpen?: () => void }) {
  return (
    <section className="panel-surface rounded-lg border border-[#0d3660] bg-[#041526]/80 p-[clamp(1rem,2vw,1.75rem)] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-cyan-300">Manager Control Center</p>
          <h2 className="safe-text mt-4 text-[clamp(1.35rem,2.2vw,2rem)] font-extrabold leading-tight text-white">Owners, devices, onboarding, and rollout visibility</h2>
          <p className="mt-4 max-w-5xl text-sm leading-6 text-slate-300">
            Use this workspace to onboard owners, register monitoring devices, and control the first assignment flow before field operations begin.
          </p>
        </div>
        {!compact && (
          <button onClick={onOpen} className="hidden h-12 items-center gap-3 rounded-lg border border-[#0d3660] px-5 text-sm font-semibold text-white transition hover:border-cyan-300 lg:flex">
            Open Control Center
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 mt-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="safe-text text-[clamp(1.5rem,2.4vw,2rem)] font-extrabold text-white">{title}</h1>
        <p className="safe-text mt-2 text-slate-300">{subtitle}</p>
      </div>
      {actions}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`panel-surface rounded-lg border border-[#0d3660] bg-[#041526]/72 p-[clamp(1rem,1.6vw,1.5rem)] shadow-[0_18px_60px_rgba(0,0,0,0.18)] ${className}`}>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  desc,
  icon: Icon,
  tone = 'blue',
}: {
  label: string;
  value: string;
  desc?: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <Panel className="metric-card">
      <div className="metric-card-row">
      <ToneIcon icon={Icon} tone={tone} />
      <div className="metric-copy">
        <p className="metric-label text-white">{label}</p>
        <p className="metric-value mt-2 font-extrabold text-white">{value}</p>
        {desc && <p className="metric-desc mt-2 text-slate-300">{desc}</p>}
      </div>
      </div>
    </Panel>
  );
}

export function ToneIcon({ icon: Icon, tone = 'blue' }: { icon: LucideIcon; tone?: string }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-300',
    cyan: 'bg-cyan-400/15 text-cyan-300',
    green: 'bg-emerald-500/20 text-emerald-300',
    orange: 'bg-orange-500/20 text-orange-300',
    purple: 'bg-purple-500/20 text-purple-300',
    red: 'bg-red-500/20 text-red-300',
  };

  return (
    <div className={`metric-icon flex shrink-0 items-center justify-center rounded-full ${tones[tone] || tones.blue}`}>
      <Icon />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${statusColors[status] || statusColors.Active}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function TablePager() {
  return (
    <div className="flex items-center justify-end gap-2">
      <button className="flex h-9 w-9 items-center justify-center rounded-md border border-[#0d3660] text-slate-300">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button className="h-9 min-w-9 rounded-md bg-blue-600 px-3 text-sm font-bold text-white">1</button>
      <button className="flex h-9 w-9 items-center justify-center rounded-md border border-[#0d3660] text-slate-300">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Field({ label, placeholder, required = false }: { label: string; placeholder: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      <input
        className="mt-2 h-12 w-full rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300"
        placeholder={placeholder}
      />
    </label>
  );
}

export function SelectField({ label, placeholder, required = false }: { label: string; placeholder: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      <button className="mt-2 flex h-12 w-full items-center justify-between rounded-md border border-[#0d3660] bg-[#020b18]/50 px-4 text-left text-sm text-slate-300">
        {placeholder}
        <ChevronDown className="h-4 w-4" />
      </button>
    </label>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-12 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(37,99,235,0.2)] transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
