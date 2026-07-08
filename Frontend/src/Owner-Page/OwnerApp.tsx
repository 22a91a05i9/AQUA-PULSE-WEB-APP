import { useEffect, useState } from 'react';
import Header, { StatusBar } from '../components/Header';
import AddAgentPage from './AddAgentPage';
import AgentsPage from './AgentsPage';
import AnalyticsPage from './AnalyticsPage';
import AlertsPage from './AlertsPage';
import AssignmentsPage from './AssignmentsPage';
import DashboardPage from './DashboardPage';
import DataPage from './DataPage';
import DevicesPage from './DevicesPage';
import LiveMonitoringPage from './LiveMonitoringPage';
import OwnerSidebar, { ownerNavItems } from './OwnerSidebar';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';
import SettingsAddAgentPage from './SettingsAddAgentPage';
import SitesPage from './SitesPage';
import SosEmergencyPage from '../Agent-Page/SosEmergencyPage';
import type { AuthSession } from '../lib/auth';
import { getAuthSession } from '../lib/auth';
import { apiRequest } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { Bell, CalendarDays, Fish } from 'lucide-react';

const ownerPageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Monitor your aquaculture operations and site performance.' },
  sites: { title: 'Sites', subtitle: 'Manage and monitor all your aquaculture sites.' },
  agents: { title: 'Agents', subtitle: 'Manage and monitor your agents.' },
  'add-agent': { title: 'Create New Agent', subtitle: 'Agents  >  Create New Agent' },
  'settings-add-agent': { title: 'Add Agent', subtitle: 'Settings  >  Add Agent' },
  devices: { title: 'Devices', subtitle: 'Monitor and manage your connected devices' },
  live: { title: 'Live Monitoring', subtitle: 'View live water quality and device status across ponds.' },
  assignments: { title: 'Assignments', subtitle: 'Assign devices and agents to sites.' },
  alerts: { title: 'Alerts', subtitle: 'Stay updated with important alerts from your aquaculture operations.' },
  data: { title: 'Data', subtitle: 'View real-time sensor readings.' },
  sos: { title: 'SOS Emergency', subtitle: 'Review emergency response and critical incidents.' },
  analytics: { title: 'Analytics', subtitle: 'Analyze water quality, device health, and feed trends.' },
  reports: { title: 'Reports', subtitle: 'View, generate and export system reports.' },
  settings: { title: 'Settings', subtitle: 'Manage account preferences and notifications.' },
};

export default function OwnerApp({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const pageInfo = ownerPageTitles[currentPage] || ownerPageTitles.dashboard;
  const { t } = useTranslation();

  return (
    <div className="app-shell flex min-h-screen bg-[#020b18] [--sidebar-width:clamp(14rem,18vw,17.5rem)]">
      <OwnerSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={onLogout}
      />

      <div className="app-main flex flex-1 flex-col">
        <OwnerMobileNav currentPage={currentPage} onNavigate={setCurrentPage} onLogout={onLogout} />
        <Header
          title={t(pageInfo.title)}
          subtitle={t(pageInfo.subtitle)}
          user={session.user}
          onNavigate={setCurrentPage}
        />


        <main className="app-content flex-1 overflow-auto">
          <OwnerPageContent currentPage={currentPage} onNavigate={setCurrentPage} />
        </main>

        <StatusBar />
      </div>
    </div>
  );
}

function OwnerMobileNav({
  currentPage,
  onNavigate,
  onLogout,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}) {
  const { t } = useTranslation();
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
        console.error('Failed to load owner alert count:', err);
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
            <p className="truncate text-xs text-slate-200">Owner Workspace</p>
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
        {ownerNavItems.map((item) => {
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
              <span>{t(item.label)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function OwnerPageContent({
  currentPage,
  onNavigate,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
}) {
  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage onNavigate={onNavigate} />;
    case 'sites':
      return <SitesPage />;
    case 'agents':
      return <AgentsPage onAddAgent={() => onNavigate('add-agent')} />;
    case 'add-agent':
      return <AddAgentPage onBack={() => onNavigate('agents')} />;
    case 'settings-add-agent':
      return <SettingsAddAgentPage onBack={() => onNavigate('settings')} />;
    case 'devices':
      return <DevicesPage />;
    case 'live':
      return <LiveMonitoringPage onNavigate={onNavigate} />;
    case 'assignments':
      return <AssignmentsPage />;
    case 'alerts':
      return <AlertsPage />;
    case 'data':
      return <DataPage />;
    case 'sos':
      return <SosEmergencyPage onBackToDashboard={() => onNavigate('dashboard')} />;
    case 'analytics':
      return <AnalyticsPage onNavigate={onNavigate} />;
    case 'reports':
      return <ReportsPage />;
    case 'settings':
      return <SettingsPage onAddAgent={() => onNavigate('settings-add-agent')} />;
    default:
      return <DashboardPage />;
  }
}
