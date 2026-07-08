import AgentLiveMonitoringPage from '../Agent-Page/LiveMonitoringPage';

export default function LiveMonitoringPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return <AgentLiveMonitoringPage onNavigate={onNavigate} />;
}
