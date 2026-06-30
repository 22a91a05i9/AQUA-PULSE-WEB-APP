import { useState, useRef, useEffect } from 'react';
import { Bell, CalendarDays, ChevronDown, RefreshCw, AlertTriangle, AlertCircle, CircleDot } from 'lucide-react';
import type { AuthUser } from '../lib/auth';
import { apiRequest } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { useTranslation } from '../lib/i18n';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  user: AuthUser;
  onNavigate?: (page: string) => void;
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
  metric: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
}

export default function Header({ title, subtitle, actions, user, onNavigate }: HeaderProps) {
  const avatarUrl =
    user.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=0a2a47`;
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const { t } = useTranslation();

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
    async function loadNotifications() {
      try {
        const session = getAuthSession();
        if (!session) return;

        const alerts = await apiRequest<AlertNotificationResponse[]>('/readings/alerts/me', {
          token: session.token,
        });

        setNotifications(
          alerts.slice(0, 8).map((alert) => ({
            id: String(alert.id),
            type: alert.severity === 'critical' || alert.severity === 'warning' ? alert.severity : 'info',
            message: alert.title || alert.message || 'Water quality alert',
            device: `Device #${alert.device_id}`,
            pond: alert.site_id ? `Site #${alert.site_id}` : 'Unassigned site',
            time: new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: alert.status === 'safe' || alert.status === 'resolved',
          }))
        );
      } catch (err) {
        console.error('Failed to load alert notifications:', err);
      }
    }

    if (user.role === 'owner' || user.role === 'agent') {
      loadNotifications();
    }
  }, [user.role]);

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

  // Generate calendar days for current month/year
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth();
  const currentMonthName = today.toLocaleDateString('en-US', { month: 'short' });
  
  const daysInCurrentMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonthIdx, 1).getDay();
  const daysOfGrid = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  return (
    <header className="dashboard-header hidden items-center justify-between bg-[#020b18]/85 py-5 backdrop-blur-lg z-30 relative lg:flex">
      <div className="dashboard-header-title">
        <h1 className="safe-text text-[clamp(1.35rem,2vw,1.75rem)] font-bold leading-tight text-white">{t(title)}</h1>
        {subtitle && <p className="safe-text mt-1 text-[clamp(0.88rem,1.1vw,0.95rem)] text-slate-200">{subtitle}</p>}
      </div>
      <div className="dashboard-header-actions flex items-center gap-5">
        {actions}
        
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
            <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-[#0d3660] bg-[#031426]/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-fade-in">
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
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="badge-pulse absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-[#0d3660] bg-[#031426]/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-fade-in">
              <div className="mb-3 flex items-center justify-between border-b border-[#0d3660]/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{t('Notifications')}</span>
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
                    No recent alerts.
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
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : notification.type === 'warning' ? (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CircleDot className="h-4 w-4 text-cyan-400" />
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

        {/* User Profile */}
        <button className="flex items-center gap-3 rounded-xl transition-all">
          <img
            src={avatarUrl}
            alt={user.name}
            className="h-11 w-11 rounded-full border-2 border-slate-300/40"
          />
          <div className="hidden md:block text-left">
            <p className="text-sm font-bold text-white">{user.name}</p>
            <p className="text-xs text-slate-300">{roleLabel}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
        </button>
      </div>
    </header>
  );
}

export function StatusBar() {
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const now = new Date();
    setLastUpdated(now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' - ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }));
  }, []);

  return (
    <div className="flex items-center justify-between px-8 py-2 bg-[#020b18]/60 text-xs text-slate-400">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-3 h-3" />
        <span>Last updated: {lastUpdated || 'Loading...'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
        <span className="text-slate-300">All systems operational</span>
      </div>
    </div>
  );
}
