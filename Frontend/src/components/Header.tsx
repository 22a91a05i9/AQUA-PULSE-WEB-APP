import { useState, useRef, useEffect } from 'react';
import { Bell, CalendarDays, ChevronDown, RefreshCw, AlertTriangle, AlertCircle, CircleDot } from 'lucide-react';
import type { AuthUser } from '../lib/auth';

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
  pond: string;
  time: string;
  read: boolean;
}

export default function Header({ title, subtitle, actions, user, onNavigate }: HeaderProps) {
  const avatarUrl =
    user.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=0a2a47`;
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  // Popover States
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedDate, setSelectedDate] = useState('May 18, 2024');

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', type: 'critical', message: 'pH level high', pond: 'Pond 03', time: '10 min ago', read: false },
    { id: '2', type: 'critical', message: 'Low Dissolved Oxygen', pond: 'Pond 02', time: '25 min ago', read: false },
    { id: '3', type: 'warning', message: 'High Turbidity', pond: 'Pond 01', time: '1 hr ago', read: false },
    { id: '4', type: 'warning', message: 'Temperature high', pond: 'Pond 06', time: '2 hr ago', read: false },
    { id: '5', type: 'info', message: 'Device battery low (20%)', pond: 'Pond 07', time: '3 hr ago', read: false },
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
    <header className="flex min-h-[98px] items-center justify-between px-8 py-5 bg-[#020b18]/85 backdrop-blur-lg z-30 relative">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-slate-200">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-5">
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
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#0d3660] bg-[#031426]/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-fade-in">
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
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="badge-pulse absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 rounded-xl border border-[#0d3660] bg-[#031426]/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-fade-in">
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
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : notification.type === 'warning' ? (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CircleDot className="h-4 w-4 text-cyan-400" />
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
  return (
    <div className="flex items-center justify-between px-8 py-2 bg-[#020b18]/60 text-xs text-slate-400">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-3 h-3" />
        <span>Last updated: May 18, 2024 - 10:30:40 AM</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
        <span className="text-slate-300">All systems operational</span>
      </div>
    </div>
  );
}
