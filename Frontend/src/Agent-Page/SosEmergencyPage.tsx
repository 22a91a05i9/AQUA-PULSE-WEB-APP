import { useState } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  Bell,
  Users,
  CheckCircle,
  Phone,
  MapPin,
  FileText,
  Mail,
  User,
} from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  status: 'Notified' | 'Pending';
  time: string;
  avatar: string;
}

const initialTeam: TeamMember[] = [
  { name: 'Rahul Verma', role: 'Team Leader', status: 'Notified', time: '10:32 AM', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80' },
  { name: 'Priya Sharma', role: 'Field Technician', status: 'Notified', time: '10:32 AM', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80' },
  { name: 'Arjun Mehta', role: 'Maintenance Lead', status: 'Notified', time: '10:32 AM', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80' },
  { name: 'Sneha Reddy', role: 'Support Engineer', status: 'Pending', time: '--:-- AM', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80' },
];

export default function SosEmergencyPage({ onBackToDashboard }: { onBackToDashboard?: () => void }) {
  const [team] = useState<TeamMember[]>(initialTeam);

  return (
    <div className="space-y-6 animate-fade-in text-slate-300">
      {/* Top Header controls bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-semibold text-[#06b6d4] hover:text-[#22d3ee] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-400 font-semibold">System Status: <strong className="text-emerald-400">All Systems Operational</strong></span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Emergency Summary */}
          <div className="glass rounded-xl p-5 border border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-450 uppercase tracking-wider mb-4">Emergency Summary</h3>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Status</span>
                <span className="text-red-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                  Active
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Emergency ID</span>
                <span className="font-mono text-white text-xs font-semibold">SOS-2024-0517-001</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Triggered At</span>
                <span className="text-white font-medium">May 17, 2024 10:30:28 AM</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Triggered By</span>
                <span className="text-white font-semibold">Vikram Kumar</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-500">Priority</span>
                <span className="text-xs text-red-500 font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                  CRITICAL
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Location</span>
                <span className="text-slate-400 font-medium">Not Available</span>
              </div>
            </div>
          </div>

          {/* Live System Status */}
          <div className="glass rounded-xl p-5 border border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-455 uppercase tracking-wider mb-4">Live System Status</h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-450">Devices Online</span>
                <span className="text-white font-bold">24 / 32</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-455">Water Quality</span>
                <span className="text-emerald-400 font-bold">85 (Good)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-455">Active Alerts</span>
                <span className="text-amber-500 font-bold">8</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-455">Critical Alerts</span>
                <span className="text-red-500 font-bold">3</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-455">System Health</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Good
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column */}
        <div className="space-y-6">
          {/* Emergency Activated (SOS button and wave radar) */}
          <div className="glass rounded-xl p-5 border border-slate-800/80 flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-6">Emergency Activated</h3>
            
            {/* Pulsing SOS Button */}
            <div className="relative w-44 h-44 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full bg-red-600/10 animate-ping duration-1000" />
              <div className="absolute inset-4 rounded-full bg-red-600/15 animate-pulse duration-700" />
              <div className="absolute inset-8 rounded-full bg-red-600/20 border border-red-500/30" />
              
              <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 shadow-2xl border-4 border-red-400/30">
                <span className="text-2xl font-extrabold text-white tracking-widest animate-pulse">SOS</span>
              </div>
            </div>

            {/* Alert Sent notification box */}
            <div className="w-full p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-left flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 shrink-0">
                <Bell className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-red-400">Emergency Alert Sent</div>
                <div className="text-[10px] text-slate-400 mt-1">Your emergency alert has been sent to the emergency contacts and team.</div>
              </div>
            </div>
          </div>

          {/* What Happens Next? flowchart */}
          <div className="glass rounded-xl p-5 border border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-4">What Happens Next?</h3>
            <div className="relative flex items-center justify-between mt-6 px-4">
              {/* Dotted connector line */}
              <div className="absolute top-4 left-10 right-10 border-t border-dashed border-slate-700/60 z-0" />
              
              {[
                { step: '1', label: 'Alert Sent', icon: Bell, active: true },
                { step: '2', label: 'Team Notified', icon: Users, active: true },
                { step: '3', label: 'Issue Resolved', icon: CheckCircle, active: false },
              ].map((flow) => {
                const FlowIcon = flow.icon;
                return (
                  <div key={flow.step} className="flex flex-col items-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      flow.active
                        ? 'bg-[#06b6d4]/10 border-[#06b6d4] text-[#22d3ee] shadow-[0_0_10px_#06b6d430]'
                        : 'bg-[#041526] border-slate-700 text-slate-500'
                    }`}>
                      <FlowIcon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold mt-2.5 ${flow.active ? 'text-white' : 'text-slate-500'}`}>
                      {flow.step}. {flow.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Notified */}
          <div className="glass rounded-xl p-5 border border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-450 uppercase tracking-wider mb-4">Team Notified</h3>
            <div className="space-y-3.5">
              {team.map((member) => (
                <div key={member.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-850/20">
                  <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{member.name}</div>
                    <div className="text-[10px] text-slate-550 mt-0.5">{member.role}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      member.status === 'Notified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-450'
                    }`}>
                      {member.status}
                    </span>
                    <div className="text-[8px] text-slate-500 mt-1">{member.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/35 rounded-lg text-xs font-semibold text-slate-350 transition-all">
              View All Contacts
            </button>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-xl p-5 border border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-450 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Call Emergency Contact', icon: Phone },
                { label: 'Share Live Location', icon: MapPin },
                { label: 'Send System Snapshot', icon: FileText },
              ].map((act, i) => {
                const ActIcon = act.icon;
                return (
                  <button
                    key={i}
                    className="w-full h-10 px-4 flex items-center justify-between rounded-lg border border-slate-800 hover:border-slate-700 bg-[#041526]/50 text-xs font-semibold text-slate-300 hover:text-white transition-all text-left"
                  >
                    <span className="flex items-center gap-2.5">
                      <ActIcon className="w-4 h-4 text-[#06b6d4]" />
                      <span>{act.label}</span>
                    </span>
                    <span>→</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Emergency Timeline */}
      <div className="glass rounded-xl p-5 border border-slate-800/80">
        <h3 className="text-sm font-bold text-slate-450 uppercase tracking-wider mb-4">Emergency Timeline</h3>
        <div className="space-y-4 text-xs font-medium text-slate-350 relative pl-4 border-l border-slate-800 ml-2">
          {[
            { time: '10:30:28 AM', desc: 'SOS Emergency triggered by Agent VinuthnaKumar', icon: ShieldAlert, active: true },
            { time: '10:30:28 AM', desc: 'Emergency alert sent to team and contacts', icon: Bell, active: true },
            { time: '10:30:28 AM', desc: 'Email and SMS notifications delivered', icon: Mail, active: true },
            { time: '--:--:--', desc: 'Team acknowledged / Viewing', icon: User, active: false },
          ].map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <div key={idx} className="relative flex items-center justify-between">
                {/* Timeline node dot */}
                <div className={`absolute -left-[20.5px] w-2.5 h-2.5 rounded-full border ${
                  item.active ? 'bg-red-500 border-red-300 shadow-[0_0_5px_#ef4444]' : 'bg-slate-850 border-slate-700'
                }`} />
                <div className="flex items-center gap-3">
                  <ItemIcon className={`w-4 h-4 ${item.active ? 'text-red-400' : 'text-slate-600'}`} />
                  <span className={item.active ? 'text-white' : 'text-slate-500'}>{item.desc}</span>
                </div>
                <span className="text-slate-500 text-[10px] font-bold">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
