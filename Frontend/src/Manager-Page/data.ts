import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Calendar,
  ClipboardList,
  Database,
  Download,
  FileText,
  Gauge,
  HelpCircle,
  Home,
  Laptop,
  LockKeyhole,
  Monitor,
  MoreVertical,
  RefreshCw,
  Settings,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';

export const managerUser = {
  name: 'Default Manager',
  email: 'manager@gmail.com',
};

export const managerNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'owners', label: 'Owners', icon: Users },
  { id: 'devices', label: 'Devices', icon: Monitor },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'alerts', label: 'Alerts', icon: Bell, badge: 12, separated: true },
  { id: 'sos', label: 'SOS Emergency', icon: Shield },
];

export const owners = [
  { initials: 'NO', name: 'New Owner', email: 'owner@gmail.com', phone: '9012457844', status: 'Active', joined: 'May 17, 2024', time: '10:30 AM' },
  { initials: 'SR', name: 'Sallapudi Y V Ramana', email: 'vinnu.1234@gmail.com', phone: '9014908994', status: 'Active', joined: 'May 16, 2024', time: '03:15 PM' },
  { initials: 'RK', name: 'Ramesh Kumar', email: 'ramesh.kumar@gmail.com', phone: '9123456780', status: 'Active', joined: 'May 15, 2024', time: '11:20 AM' },
  { initials: 'AP', name: 'Arun Prakash', email: 'arun.prakash@gmail.com', phone: '9988776655', status: 'Inactive', joined: 'May 14, 2024', time: '04:45 PM' },
  { initials: 'MP', name: 'Meena Patel', email: 'meena.patel@gmail.com', phone: '9876543210', status: 'Active', joined: 'May 13, 2024', time: '09:10 AM' },
  { initials: 'VS', name: 'Vijay Singh', email: 'vijay.singh@gmail.com', phone: '9123987654', status: 'Active', joined: 'May 12, 2024', time: '02:30 PM' },
  { initials: 'KB', name: 'Karthik Babu', email: 'karthik.babu@gmail.com', phone: '9001122334', status: 'Inactive', joined: 'May 11, 2024', time: '12:05 PM' },
  { initials: 'NG', name: 'Nagesh Gowda', email: 'nagesh.gowda@gmail.com', phone: '9345678901', status: 'Invited', joined: 'May 10, 2024', time: '05:50 PM' },
  { initials: 'PT', name: 'Pooja Tiwari', email: 'pooja.tiwari@gmail.com', phone: '9543216780', status: 'Active', joined: 'May 09, 2024', time: '10:15 AM' },
  { initials: 'LD', name: 'Lokesh Das', email: 'lokesh.das@gmail.com', phone: '9011678453', status: 'Active', joined: 'May 08, 2024', time: '03:40 PM' },
];

export const devices = [
  { name: 'Pond Sensor 01', id: 'DEV-00124', shortId: '001', type: 'Water Quality Sensor', owner: 'Sallapudi Y V Ramana', site: 'Site A - Pond 1', status: 'Active', readings: 287, registered: 'May 17, 2024', time: '10:25 AM' },
  { name: 'Auto Feeder 01', id: 'DEV-00125', shortId: '002', type: 'Auto Feeder', owner: 'New Owner', site: 'Site A - Pond 2', status: 'Active', readings: 324, registered: 'May 17, 2024', time: '10:20 AM' },
  { name: 'PH Monitor 03', id: 'DEV-00126', shortId: '003', type: 'Water Quality Sensor', owner: 'Ramesh Kumar', site: 'Site B - Pond 1', status: 'Active', readings: 198, registered: 'May 16, 2024', time: '09:40 AM' },
  { name: 'Feeder Relay 04', id: 'DEV-00127', shortId: '004', type: 'Relay Controller', owner: 'Lakshmi Narayana', site: 'Site C - Pond 3', status: 'Warning', readings: 156, registered: 'May 15, 2024', time: '11:05 AM' },
  { name: 'Gateway 05', id: 'DEV-00128', shortId: '005', type: 'Gateway', owner: 'Venkatesh B', site: 'Site D - Pond 1', status: 'Offline', readings: 98, registered: 'May 14, 2024', time: '01:20 PM' },
];

export const readingsTrend = [
  { day: 'May 11', active: 18, offline: 2, total: 24, readings: 450, quality: 62 },
  { day: 'May 12', active: 19, offline: 1, total: 27, readings: 550, quality: 68 },
  { day: 'May 13', active: 21, offline: 1, total: 30, readings: 640, quality: 68 },
  { day: 'May 14', active: 24, offline: 2, total: 33, readings: 590, quality: 75 },
  { day: 'May 15', active: 21, offline: 1, total: 31, readings: 670, quality: 86 },
  { day: 'May 16', active: 22, offline: 1, total: 33, readings: 760, quality: 80 },
  { day: 'May 17', active: 25, offline: 2, total: 36, readings: 625, quality: 90 },
];

export const dashboardStats = [
  { label: 'Owners', value: '2', desc: 'Total owners', icon: UserPlus, tone: 'blue' },
  { label: 'Agents', value: '2', desc: 'Total agents', icon: Users, tone: 'green' },
  { label: 'Devices', value: '2', desc: 'Total devices', icon: Laptop, tone: 'purple' },
  { label: 'Sites', value: '2', desc: 'Total sites', icon: Gauge, tone: 'orange' },
  { label: 'Open Alerts', value: '2880', desc: 'Total open alerts', icon: AlertTriangle, tone: 'red' },
];

export const reportStats = [
  { label: 'Total Devices', value: '24', delta: '4 vs previous 7 days', positive: true, icon: Monitor, tone: 'blue' },
  { label: 'Active Devices', value: '22', delta: '3 vs previous 7 days', positive: true, icon: ShieldCheck, tone: 'green' },
  { label: 'Offline Devices', value: '2', delta: '1 vs previous 7 days', positive: false, icon: Activity, tone: 'red' },
  { label: 'Data Readings', value: '1,248', delta: '12% vs previous 7 days', positive: true, icon: BarChart3, tone: 'purple' },
];

export const analyticsStats = [
  { label: 'System Uptime', value: '99.7%', delta: '2.3% vs last 7 days', positive: true, icon: Activity, tone: 'cyan' },
  { label: 'Active Devices', value: '106%', delta: '6% vs last 7 days', positive: true, icon: ShieldCheck, tone: 'green' },
  { label: 'Alerts This Week', value: '8', delta: '2 vs last 7 days', positive: false, icon: AlertTriangle, tone: 'orange' },
  { label: 'Critical Alerts', value: '0', delta: 'No critical alerts', icon: Bell, tone: 'purple' },
];

export const settingGroups = [
  {
    title: 'Account Settings',
    items: [
      { label: 'Profile Settings', desc: 'Update your personal information, email, and profile picture.', icon: Users, tone: 'cyan' },
      { label: 'Change Password', desc: 'Update your password to keep your account secure.', icon: LockKeyhole, tone: 'cyan' },
    ],
  },
  {
    title: 'System Settings',
    items: [
      { label: 'Notifications', desc: 'Configure how and when you receive notifications.', icon: Bell, tone: 'green' },
      { label: 'System Preferences', desc: 'Customize system preferences and default configurations.', icon: Settings, tone: 'green' },
      { label: 'Data & Storage', desc: 'Manage data retention, storage usage, and backups.', icon: Database, tone: 'green' },
    ],
  },
  {
    title: 'Security Settings',
    items: [
      { label: 'Access Control', desc: 'Manage user roles, permissions, and access controls.', icon: Shield, tone: 'red' },
      { label: 'Activity Logs', desc: 'View and monitor system activity and audit logs.', icon: RefreshCw, tone: 'red' },
    ],
  },
];

export const statusColors: Record<string, string> = {
  Active: 'bg-emerald-500/15 text-emerald-300',
  Inactive: 'bg-orange-500/15 text-orange-300',
  Invited: 'bg-blue-500/15 text-blue-300',
  Warning: 'bg-amber-500/15 text-amber-300',
  Offline: 'bg-red-500/15 text-red-300',
};

export const managerQuickCards = [
  { label: 'Need Help?', value: 'Contact support', icon: HelpCircle, tone: 'blue' },
  { label: 'Last Updated', value: 'May 17, 2024 10:30 AM', icon: Calendar, tone: 'cyan' },
];

export const tableActionsIcon = MoreVertical;
export const exportIcon = Download;
