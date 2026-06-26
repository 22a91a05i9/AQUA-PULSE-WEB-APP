import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Menu,
  Search,
  CalendarDays,
  AlertTriangle,
  AlertCircle,
  CircleDot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AuthSession } from '../lib/auth';
import { managerNavItems, managerQuickCards, managerUser, statusColors } from './data';

export type ManagerPageId =
  | 'dashboard'
  | 'owners'
  | 'devices'
  | 'assignments'
  | 'analytics'
  | 'reports'
  | 'settings'
  | 'alerts'
  | 'sos';

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
  return (
    <div className="min-h-screen bg-[#020b18] text-slate-100">
      <ManagerSidebar currentPage={currentPage} onNavigate={onNavigate} />
      <div className="min-h-screen pl-[320px]">
        <ManagerHeader session={session} onLogout={onLogout} onNavigate={onNavigate} />
        <main className="px-10 py-9">{children}</main>
      </div>
    </div>
  );
}

function ManagerSidebar({
  currentPage,
  onNavigate,
}: {
  currentPage: ManagerPageId;
  onNavigate: (page: ManagerPageId) => void;
}) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[320px] flex-col border-r border-[#0d3660] bg-[#031426]/95">
      <div className="flex h-[112px] items-center gap-4 border-b border-[#0d3660] px-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-cyan-300/40 bg-cyan-300/10">
          <Droplet className="h-9 w-9 text-cyan-300" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-cyan-300">Aqua Pulse</h1>
          <p className="text-sm text-white">Smart Aquaculture</p>
        </div>
      </div>

      <div className="px-7 py-6">
        <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Manager Workspace</p>
        <p className="mt-3 font-bold text-white">{managerUser.name}</p>
        <p className="mt-1 text-sm text-slate-300">{managerUser.email}</p>
      </div>

      <nav className="flex-1 px-4">
        {managerNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ManagerPageId)}
            className={`${item.separated ? 'mt-6' : 'mt-2'} flex h-[56px] w-full items-center gap-4 rounded-lg px-4 text-left text-base font-semibold transition ${
                isActive
                  ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-[0_12px_35px_rgba(37,99,235,0.2)]'
                  : 'text-slate-200 hover:bg-[#071f35] hover:text-cyan-200'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 p-4">
        {managerQuickCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="rounded-lg border border-[#0d3660] bg-[#041526]/80 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{card.label}</p>
                  <p className="mt-1 text-xs text-slate-300">{card.value}</p>
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
  pond: string;
  time: string;
  read: boolean;
}

function ManagerHeader({ session, onLogout, onNavigate }: { session: AuthSession; onLogout: () => void; onNavigate?: (page: ManagerPageId) => void }) {
  // Popover States
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedDate, setSelectedDate] = useState('May 18, 2024');

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', type: 'critical', message: 'New Owner Registered', pond: 'Blue Lake Aquafarms', time: '10 min ago', read: false },
    { id: '2', type: 'critical', message: 'Sensor Activation Failure', pond: 'DVC-003', time: '25 min ago', read: false },
    { id: '3', type: 'warning', message: 'Suspicious login attempt', pond: 'Manager Portal', time: '1 hr ago', read: false },
    { id: '4', type: 'warning', message: 'Database backup completed', pond: 'System Logs', time: '2 hr ago', read: false },
    { id: '5', type: 'info', message: 'Weekly summary generated', pond: 'System Reports', time: '3 hr ago', read: false },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Refs for click outside
  const calendarRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

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

  const handleDaySelect = (day: number) => {
    setSelectedDate(`May ${day}, 2024`);
    setShowCalendar(false);
  };

  // Generate calendar days for May 2024
  const daysInMay = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <header className="flex h-[112px] items-center justify-between border-b border-[#0d3660] bg-[#031426]/80 px-10 backdrop-blur z-30 relative">
      <button className="flex h-10 w-10 items-center justify-center rounded-md text-slate-200 hover:bg-[#071f35]">
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="h-12 w-80 rounded-lg border border-[#0d3660] bg-[#020b18]/70 pl-12 pr-4 text-sm outline-none transition focus:border-cyan-300"
            placeholder="Search owners, devices, sites..."
          />
        </div>

        {/* Calendar Picker Button & Popover */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`hidden h-12 items-center gap-3 rounded-lg border bg-[#031426] px-4 text-sm text-white transition lg:flex ${showCalendar ? 'border-cyan-400 ring-2 ring-cyan-500/20' : 'border-[#0d3660] hover:border-cyan-400'}`}
          >
            <CalendarDays className="h-4 w-4 text-cyan-400" />
            <span>{selectedDate}</span>
            <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
          </button>

          {showCalendar && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#0d3660] bg-[#031426]/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-fade-in text-left">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Select Date</span>
                <span className="text-xs font-semibold text-cyan-400">May 2024</span>
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
                  {/* May 1st 2024 was a Wednesday, so 3 empty slots */}
                  <span />
                  <span />
                  <span />
                  {daysInMay.map((day) => {
                    const isSelected = selectedDate === `May ${day}, 2024`;
                    return (
                      <button
                        key={day}
                        onClick={() => handleDaySelect(day)}
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
            <div className="absolute right-0 mt-2 w-96 rounded-xl border border-[#0d3660] bg-[#031426]/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-fade-in text-left">
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
                {notifications.map((notification) => {
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
                          <p className={`text-xs font-semibold truncate ${notification.read ? 'text-slate-400' : 'text-white'}`}>
                            {notification.message}
                          </p>
                          <span className="text-[10px] text-slate-500 shrink-0">{notification.time}</span>
                        </div>
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

        <button className="flex items-center gap-3 rounded-lg border border-[#0d3660] bg-[#041526] px-3 py-2">
          <img
            className="h-10 w-10 rounded-full"
            src={session.user.avatarUrl}
            alt={session.user.name}
          />
          <div className="hidden text-left md:block">
            <p className="text-sm font-bold text-white">{managerUser.name}</p>
            <p className="text-xs text-slate-300">{managerUser.email}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-300" />
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

export function ControlCenter({ compact = false }: { compact?: boolean }) {
  return (
    <section className="rounded-lg border border-[#0d3660] bg-[#041526]/80 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-cyan-300">Manager Control Center</p>
          <h2 className="mt-4 text-2xl font-extrabold text-white">Owners, devices, onboarding, and rollout visibility</h2>
          <p className="mt-4 max-w-5xl text-sm leading-6 text-slate-300">
            Use this workspace to onboard owners, register monitoring devices, and control the first assignment flow before field operations begin.
          </p>
        </div>
        {!compact && (
          <button className="hidden h-12 items-center gap-3 rounded-lg border border-[#0d3660] px-5 text-sm font-semibold text-white transition hover:border-cyan-300 lg:flex">
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
      <div>
        <h1 className="text-3xl font-extrabold text-white">{title}</h1>
        <p className="mt-2 text-slate-300">{subtitle}</p>
      </div>
      {actions}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-[#0d3660] bg-[#041526]/72 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] ${className}`}>
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
    <Panel className="flex min-h-36 items-center gap-5">
      <ToneIcon icon={Icon} tone={tone} />
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="mt-2 text-3xl font-extrabold text-white">{value}</p>
        {desc && <p className="mt-2 text-sm text-slate-300">{desc}</p>}
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
    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tones[tone] || tones.blue}`}>
      <Icon className="h-7 w-7" />
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-12 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(37,99,235,0.2)] transition hover:from-cyan-400 hover:to-blue-500"
    >
      {children}
    </button>
  );
}
