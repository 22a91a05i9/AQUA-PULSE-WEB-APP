import { useState } from 'react';
import type { AuthSession } from '../lib/auth';
import { ManagerShell, type ManagerPageId } from './components';
import AnalyticsPage from './AnalyticsPage';
import AssignmentsPage from './AssignmentsPage';
import DashboardPage from './DashboardPage';
import DevicesPage from './DevicesPage';
import OwnersPage from './OwnersPage';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';
import AlertsPage from './AlertsPage';
import SosEmergencyPage from '../Agent-Page/SosEmergencyPage';

export default function ManagerApp({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [currentPage, setCurrentPage] = useState<ManagerPageId>('dashboard');

  return (
    <ManagerShell session={session} currentPage={currentPage} onNavigate={setCurrentPage} onLogout={onLogout}>
      <ManagerPageContent currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as ManagerPageId)} />
    </ManagerShell>
  );
}

function ManagerPageContent({
  currentPage,
  onNavigate,
}: {
  currentPage: ManagerPageId;
  onNavigate: (page: string) => void;
}) {
  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage onNavigate={onNavigate} />;
    case 'owners':
      return <OwnersPage />;
    case 'devices':
      return <DevicesPage />;
    case 'assignments':
      return <AssignmentsPage />;
    case 'analytics':
      return <AnalyticsPage onNavigate={onNavigate} />;
    case 'reports':
      return <ReportsPage />;
    case 'settings':
      return <SettingsPage />;
    case 'alerts':
      return <AlertsPage />;
    case 'sos':
      return <SosEmergencyPage onBackToDashboard={() => onNavigate('dashboard')} />;
    default:
      return <DashboardPage onNavigate={onNavigate} />;
  }
}
