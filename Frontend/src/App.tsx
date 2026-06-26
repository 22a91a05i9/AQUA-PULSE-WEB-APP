import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header, { StatusBar } from './components/Header';
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

  if (currentPage === 'login' || !session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (session.user.role === 'manager') {
    return <ManagerApp session={session} onLogout={handleLogout} />;
  }

  if (session.user.role === 'owner') {
    return <OwnerApp session={session} onLogout={handleLogout} />;
  }

  const pageInfo = agentPageTitles[currentPage] || { title: 'Agent Dashboard', subtitle: '' };
  const mainWidth = sidebarCollapsed ? 'pl-16' : 'pl-80';

  return (
    <div className="flex min-h-screen bg-[#020b18]">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-400 ${mainWidth}`}>
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle || undefined}
          user={session.user}
          onNavigate={setCurrentPage}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-9">
          <PageContent currentPage={currentPage} onNavigate={setCurrentPage} />
        </main>

        <StatusBar />
      </div>
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
      return <SitesPage />;
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
