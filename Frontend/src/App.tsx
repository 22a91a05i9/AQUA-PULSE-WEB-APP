import { useEffect, useState } from 'react';
import Sidebar, { agentNavItems } from './components/Sidebar';
import Header, { StatusBar } from './components/Header';
import { Bell, CalendarDays, Fish } from 'lucide-react';
import LoginPage from './Agent-Page/LoginPage';
import DashboardPage from './Agent-Page/DashboardPage';
import AnalyticsPage from './Agent-Page/AnalyticsPage';
import ReportsPage from './Agent-Page/ReportsPage';
import SettingsPage from './Agent-Page/SettingsPage';
import SitesPage from './Agent-Page/SitesPage';
import DevicesPage from './Agent-Page/DevicesPage';
import AlertsPage from './Agent-Page/AlertsPage';
import LiveMonitoringPage from './Agent-Page/LiveMonitoringPage';
import SosEmergencyPage from './Agent-Page/SosEmergencyPage';
import ManagerApp from './Manager-Page/ManagerApp';
import OwnerApp from './Owner-Page/OwnerApp';
import { getAuthSession, logout, type AuthSession } from './lib/auth';
import { apiRequest } from './lib/api';

const agentPageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Agent Dashboard', subtitle: '' },
  sites: { title: 'Agent Sites', subtitle: 'Manage assigned aquaculture farm sites and locations.' },
  devices: { title: 'Agent Devices', subtitle: 'Manage and monitor all connected sensors and devices.' },
  live: { title: 'Agent Live Monitoring', subtitle: 'Real-time water quality and environmental data streams.' },
  alerts: { title: 'Agent Alerts', subtitle: 'View and manage all active alerts and notifications.' },
  sos: { title: 'Agent SOS Emergency', subtitle: 'Emergency response and critical incident management.' },
  analytics: { title: 'Agent Analytics', subtitle: 'Gain insights from pond data to make informed decisions and improve operations.' },
  reports: { title: 'Agent Reports', subtitle: 'Generate and download detailed reports to analyze performance and track operations.' },
  settings: { title: 'Agent Settings', subtitle: 'Manage your account, alerts and preferences.' },
};

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogin = (nextSession: AuthSession) => {
    setSession(nextSession);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    await logout();
    setSession(null);
    setCurrentPage('login');
  };

  const isPasswordResetRoute = window.location.pathname.includes('reset-password');

  if (currentPage === 'login' || !session || isPasswordResetRoute) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (session.user.role === 'manager') {
    return <ManagerApp session={session} onLogout={handleLogout} />;
  }

  if (session.user.role === 'owner') {
    return <OwnerApp session={session} onLogout={handleLogout} />;
  }

  const pageInfo = agentPageTitles[currentPage] || { title: 'Agent Dashboard', subtitle: '' };
  const mainWidth = sidebarCollapsed ? '[--sidebar-width:4rem]' : '[--sidebar-width:clamp(14rem,18vw,20rem)]';

  return (
    <div className={`app-shell flex min-h-screen bg-[#020b18] ${mainWidth}`}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main content */}
      <div className="app-main flex flex-1 flex-col transition-all duration-400">
        <AgentMobileNav currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle || undefined}
          user={session.user}
          onNavigate={setCurrentPage}
        />

        {/* Page content */}
        <main className="app-content flex-1 overflow-auto">
          <PageContent currentPage={currentPage} onNavigate={setCurrentPage} />
        </main>

        <StatusBar />
      </div>
    </div>
  );
}

function AgentMobileNav({
  currentPage,
  onNavigate,
  onLogout,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}) {
  const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    async function loadAlertCount() {
      try {
        const session = getAuthSession();
        if (!session) return;

        const alerts = await apiRequest<Array<{ status: string }>>('/readings/alerts/me', {
          token: session.token,
        });
        setAlertCount(alerts.filter((alert) => alert.status !== 'safe' && alert.status !== 'resolved').length);
      } catch (err) {
        console.error('Failed to load agent alert count:', err);
      }
    }

    loadAlertCount();
  }, []);

  return (
    <div className="mobile-workspace-nav lg:hidden">
      <div className="mobile-nav-brand">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <Fish className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-cyan-300">Aqua Pulse</p>
            <p className="truncate text-xs text-slate-200">Agent Workspace</p>
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
        {agentNavItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
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

function PageContent({ currentPage, onNavigate }: { currentPage: string; onNavigate: (page: string) => void }) {
  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage onNavigate={onNavigate} />;
    case 'analytics':
      return <AnalyticsPage onNavigate={onNavigate} />;
    case 'reports':
      return <ReportsPage />;
    case 'settings':
      return <SettingsPage />;
    case 'sites':
      return <SitesPage onNavigate={onNavigate} />;
    case 'devices':
      return <DevicesPage />;
    case 'live':
      return <LiveMonitoringPage onNavigate={onNavigate} />;
    case 'alerts':
      return <AlertsPage />;
    case 'sos':
      return <SosEmergencyPage onBackToDashboard={() => onNavigate('dashboard')} />;
    default:
      return <DashboardPage />;
  }
}
