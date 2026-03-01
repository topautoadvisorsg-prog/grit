
import {
    User,
    Trophy,
    Calendar,
    Newspaper,
    History,
    MessageSquare,
    Download,
    Brain,
    Bot,
    Gift,
    BadgeCheck,
    LayoutDashboard,
    PlusSquare,
    Pencil,
    Upload,
    FileEdit,
    Tags,
    Award,
    Ticket,
    TrendingUp,
    Info,
    Settings
} from 'lucide-react';

export interface NavItem {
    id: string;
    labelKey: string;
    icon: any;
    path: string;
}

// User-facing tabs (Simplified for stabilization)
export const userNavItems: NavItem[] = [
    { id: 'dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'event', labelKey: 'sidebar.eventcard', icon: Calendar, path: '/event' },
    { id: 'fighters', labelKey: 'sidebar.fighters', icon: User, path: '/fighter/index' }, // Placeholder for fighter index
    { id: 'competition', labelKey: 'sidebar.rankings', icon: Trophy, path: '/competition' },
    { id: 'ai', labelKey: 'sidebar.ai_predictions', icon: Brain, path: '/ai' },
    { id: 'chat', labelKey: 'sidebar.chat', icon: MessageSquare, path: '/chat' },
];

// Admin-only tabs
export const adminNavItems: NavItem[] = [
    { id: 'create-event', labelKey: 'sidebar.create_event', icon: PlusSquare, path: '/admin/create-event' },
    { id: 'event-editor', labelKey: 'sidebar.event_editor', icon: Pencil, path: '/admin/event-editor' },
    { id: 'import', labelKey: 'sidebar.import', icon: Upload, path: '/admin/import' },
    { id: 'fighter-manager', labelKey: 'sidebar.fighter_manager', icon: User, path: '/admin/fighter-manager' },
    { id: 'create-news', labelKey: 'sidebar.create_news', icon: FileEdit, path: '/admin/create-news' },
    { id: 'admin-tags', labelKey: 'sidebar.tag_manager', icon: Tags, path: '/admin/tags' },
    { id: 'admin-badges', labelKey: 'sidebar.badge_manager', icon: Award, path: '/admin/badges' },
    { id: 'admin-raffle', labelKey: 'sidebar.raffle_manager', icon: Ticket, path: '/admin/raffle' },
    { id: 'admin-verification', labelKey: 'sidebar.user_verification', icon: BadgeCheck, path: '/admin/verification' },
    { id: 'admin-odds', labelKey: 'sidebar.odds_editor', icon: TrendingUp, path: '/admin/odds' },
    { id: 'admin-users', labelKey: 'sidebar.user_manager', icon: User, path: '/admin/users' },
    { id: 'admin-audit', labelKey: 'sidebar.audit_log', icon: History, path: '/admin/audit' },
    { id: 'admin-settings', labelKey: 'sidebar.system_settings', icon: Settings, path: '/admin/settings' },
];

// Tab Titles Helper
export const tabTitles: Record<string, { title: string; subtitle: string }> = {
    // User tabs
    dashboard: { title: 'Dashboard', subtitle: 'Your fantasy MMA journey' },
    event: { title: 'Event Card', subtitle: 'Full fight card view' },
    fighter: { title: 'Fighter Profiles', subtitle: 'Comprehensive fighter database' },
    competition: { title: 'MMA Metrics Rankings', subtitle: 'Event fantasy leaderboards' },
    ai: { title: 'AI Predictions', subtitle: 'Premium AI-powered fight analysis' },
    chat: { title: 'Chat', subtitle: 'Global, event, and country chat rooms' },
    settings: { title: 'Settings', subtitle: 'Manage your profile and preferences' },
    // Admin tabs
    'create-event': { title: 'Create Event', subtitle: 'Admin - Create new events' },
    'event-editor': { title: 'Event Editor', subtitle: 'Admin - Edit events, status, and fights' },
    'import': { title: 'Import', subtitle: 'Admin - Import fighters or create manually' },
    'fighter-manager': { title: 'Fighter Manager', subtitle: 'Admin - Edit fighter profiles and images' },
    'create-news': { title: 'Create News', subtitle: 'Admin - Post announcements' },
    'admin-tags': { title: 'Tag Manager', subtitle: 'Admin - Manage fighter scouting tags' },
    'admin-badges': { title: 'Badge Manager', subtitle: 'Admin - Assign user badges' },
    'admin-raffle': { title: 'Raffle Manager', subtitle: 'Admin - Manage raffle tickets & draws' },
    'admin-verification': { title: 'User Verification', subtitle: 'Admin - Verify users & feature influencers' },
    'admin-odds': { title: 'Odds Editor', subtitle: 'Admin - Set fight odds per event' },
    'admin-users': { title: 'User Manager', subtitle: 'Admin - Manage platform users' },
    'admin-audit': { title: 'Audit Log', subtitle: 'Admin - View system activity logs' },
    'admin-settings': { title: 'System Settings', subtitle: 'Admin - Configure system-wide settings' },
};
