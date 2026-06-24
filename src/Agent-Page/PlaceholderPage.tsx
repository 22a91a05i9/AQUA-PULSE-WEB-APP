import {
  Activity,
  Bell,
  Shield,
  MapPin,
  Cpu,
} from 'lucide-react';

const placeholderContent = {
  sites: {
    title: 'Sites Management',
    desc: 'Manage all your aquaculture sites and farm locations',
    icon: MapPin,
    color: '#22d3ee',
    features: ['Farm locations overview', 'Site health monitoring', 'Resource allocation', 'Environmental tracking'],
  },
  devices: {
    title: 'Devices',
    desc: 'Monitor and manage all connected IoT sensors and devices',
    icon: Cpu,
    color: '#34d399',
    features: ['32 devices connected', 'Real-time telemetry', 'Firmware updates', 'Device diagnostics'],
  },
  live: {
    title: 'Live Monitoring',
    desc: 'Real-time streaming data from all pond sensors',
    icon: Activity,
    color: '#f59e0b',
    features: ['Live water quality feeds', 'Temperature streaming', 'Oxygen level alerts', 'Video surveillance'],
  },
  alerts: {
    title: 'Alerts Center',
    desc: 'View and manage all active and historical alerts',
    icon: Bell,
    color: '#ef4444',
    features: ['12 active alerts', 'Alert history', 'Escalation rules', 'Notification routing'],
  },
  sos: {
    title: 'SOS Emergency',
    desc: 'Emergency response and critical incident management',
    icon: Shield,
    color: '#ef4444',
    features: ['One-tap SOS activation', 'Emergency contacts', 'Incident response protocols', 'Live team coordination'],
  },
};

interface PlaceholderPageProps {
  page: keyof typeof placeholderContent;
}

export default function PlaceholderPage({ page }: PlaceholderPageProps) {
  const content = placeholderContent[page];
  if (!content) return null;
  const Icon = content.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-96 animate-fade-in">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 animate-float"
        style={{ backgroundColor: content.color + '20', border: `2px solid ${content.color}40`, boxShadow: `0 0 40px ${content.color}20` }}
      >
        <Icon className="w-12 h-12" style={{ color: content.color }} />
      </div>
      <h2 className="text-3xl font-bold text-white mb-2">{content.title}</h2>
      <p className="text-slate-400 mb-8 text-center max-w-md">{content.desc}</p>
      <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
        {content.features.map((feature, i) => (
          <div
            key={i}
            className="glass rounded-xl p-4 flex items-center gap-3 animate-slide-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: content.color }} />
            <span className="text-sm text-slate-300">{feature}</span>
          </div>
        ))}
      </div>
      <button
        className="mt-8 px-6 py-3 rounded-xl text-white font-medium btn-primary"
      >
        Explore {content.title}
      </button>
    </div>
  );
}
