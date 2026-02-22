
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
    Info
} from 'lucide-react';

export interface NavItem {
    id: string;
    labelKey: string; // Translation key
    icon: any;
}

// User-facing tabs (visible to all)
export const userNavItems: NavItem[] = [
    { id: 'dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
    { id: 'eventcard', labelKey: 'sidebar.eventcard', icon: Calendar },
    { id: 'rankings', labelKey: 'sidebar.rankings', icon: Trophy },
    { id: 'fighters', labelKey: 'sidebar.fighters', icon: User },
    { id: 'eventhistory', labelKey: 'sidebar.eventhistory', icon: History },
    { id: 'news', labelKey: 'sidebar.news', icon: Newspaper },
    { id: 'chat', labelKey: 'sidebar.chat', icon: MessageSquare },
    { id: 'info', labelKey: 'sidebar.info', icon: Info },
    { id: 'export', labelKey: 'sidebar.export', icon: Download },
    { id: 'ai-predictions', labelKey: 'sidebar.ai_predictions', icon: Brain },
    { id: 'ai-chat', labelKey: 'sidebar.ai_chat', icon: Bot },
    { id: 'raffle', labelKey: 'sidebar.raffle', icon: Gift },
    { id: 'influencers', labelKey: 'sidebar.influencers', icon: BadgeCheck },
];

// Admin-only tabs
export const adminNavItems: NavItem[] = [
    { id: 'create-event', labelKey: 'sidebar.create_event', icon: PlusSquare },
    { id: 'event-editor', labelKey: 'sidebar.event_editor', icon: Pencil },
    { id: 'import', labelKey: 'sidebar.import', icon: Upload },
    { id: 'fighter-manager', labelKey: 'sidebar.fighter_manager', icon: User },
    { id: 'create-news', labelKey: 'sidebar.create_news', icon: FileEdit },
    { id: 'admin-tags', labelKey: 'sidebar.tag_manager', icon: Tags },
    { id: 'admin-badges', labelKey: 'sidebar.badge_manager', icon: Award },
    { id: 'admin-raffle', labelKey: 'sidebar.raffle_manager', icon: Ticket },
    { id: 'admin-verification', labelKey: 'sidebar.user_verification', icon: BadgeCheck },
    { id: 'admin-odds', labelKey: 'sidebar.odds_editor', icon: TrendingUp },
];

// Tab Titles Helper
export const tabTitles: Record<string, { title: string; subtitle: string }> = {
    // User tabs
    dashboard: { title: 'Dashboard', subtitle: 'Your fantasy MMA journey' },
    advanced: { title: 'Advanced', subtitle: 'Analytics, signals, and comparisons' },
    fighters: { title: 'Fighter Profiles', subtitle: 'Comprehensive fighter database' },
    eventcard: { title: 'Event Card', subtitle: 'Full fight card view' },
    eventhistory: { title: 'Event History', subtitle: 'Review your picks and performance' },
    rankings: { title: 'MMA Metrics Rankings', subtitle: 'Event fantasy leaderboards' },
    news: { title: 'News & Research', subtitle: 'Latest MMA analysis and updates' },
    info: { title: 'App Guide', subtitle: 'Mechanics, Badges, and Help' },
    export: { title: 'Export', subtitle: 'Export fighter and event data' },
    'ai-predictions': { title: 'AI Predictions', subtitle: 'Premium AI-powered fight analysis' },
    'ai-chat': { title: 'AI Chat', subtitle: 'Chat with MMA analysis AI (Premium)' },
    chat: { title: 'Chat', subtitle: 'Global, event, and country chat rooms' },
    raffle: { title: 'Raffle', subtitle: 'MMA Champions League giveaways' },
    influencers: { title: 'Influencers', subtitle: 'Verified community voices' },
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
};
