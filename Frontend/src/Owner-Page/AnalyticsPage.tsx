import AgentAnalyticsPage from '../Agent-Page/AnalyticsPage';

export default function AnalyticsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return <AgentAnalyticsPage onNavigate={onNavigate} />;
}
