import { useState } from 'react';
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
import OwnerSidebar from './OwnerSidebar';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';
import SettingsAddAgentPage from './SettingsAddAgentPage';
import SitesPage from './SitesPage';
import SosEmergencyPage from '../Agent-Page/SosEmergencyPage';
import type { AuthSession } from '../lib/auth';
import { useTranslation } from '../lib/i18n';

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
    <div className="flex min-h-screen bg-[#020b18]">
      <OwnerSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={onLogout}
      />

      <div className="flex flex-1 flex-col pl-[280px]">
        <Header
          title={t(pageInfo.title)}
          subtitle={t(pageInfo.subtitle)}
          user={session.user}
          onNavigate={setCurrentPage}
        />


        <main className="flex-1 overflow-auto px-8 pb-5 pt-2">
          <OwnerPageContent currentPage={currentPage} onNavigate={setCurrentPage} />
        </main>

        <StatusBar />
      </div>
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
      return <LiveMonitoringPage />;
    case 'assignments':
      return <AssignmentsPage />;
    case 'alerts':
      return <AlertsPage />;
    case 'data':
      return <DataPage />;
    case 'sos':
      return <SosEmergencyPage onBackToDashboard={() => onNavigate('dashboard')} />;
    case 'analytics':
      return <AnalyticsPage />;
    case 'reports':
      return <ReportsPage />;
    case 'settings':
      return <SettingsPage onAddAgent={() => onNavigate('settings-add-agent')} />;
    default:
      return <DashboardPage />;
  }
}
