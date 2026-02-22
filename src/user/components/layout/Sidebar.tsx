import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import {
  User,
  Trophy,
  Calendar,
  Newspaper,
  BarChart3,
  Settings,
  Search,
  Swords,
  PlusSquare,
  Upload,
  Download,
  FileEdit,
  History,
  Shield,
  LayoutDashboard,
  Brain,
  MessageSquare,
  Bot,
  Gift,
  BadgeCheck,
  Tags,
  Award,
  Ticket,
  TrendingUp,
  Pencil,
} from 'lucide-react';
import { userNavItems, adminNavItems } from '@/shared/config/navigation';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed = false,
  isAdmin = false,
}) => {
  const { t } = useTranslation();


  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Swords className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-display text-lg tracking-wide text-gradient-brand">
                MMA MATRIX
              </span>
              <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                PRO
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-sidebar-border">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50 text-muted-foreground hover:bg-sidebar-accent transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <Search className="h-4 w-4" />
          {!isCollapsed && <span className="text-sm">{t('sidebar.search')}</span>}
        </button>
      </div>

      {/* Main Navigation - User Tabs */}
      <nav className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <div className="space-y-1">
          {userNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isCollapsed && 'justify-center'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                {!isCollapsed && <span>{t(item.labelKey)}</span>}
                {isActive && !isCollapsed && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Admin Tabs - Only visible to admins */}
        {isAdmin && (
          <>
            <div className="my-4 border-t border-sidebar-border" />
            {!isCollapsed && (
              <div className="px-3 py-2">
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  {t('sidebar.admin')}
                </span>
              </div>
            )}
            <div className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                    {!isCollapsed && <span>{t(item.labelKey)}</span>}
                    {isActive && !isCollapsed && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Bottom Navigation */}
      <BottomNav isCollapsed={isCollapsed} isAdmin={isAdmin} />
    </aside>
  );
};

function BottomNav({ isCollapsed, isAdmin }: { isCollapsed: boolean; isAdmin: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const displayName = (user as any)?.username ||
    `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() ||
    'Guest';
  const roleLabel = isAdmin ? 'Administrator' : 'Member';
  const totalPoints = (user as any)?.totalPoints || 0;

  return (
    <div className="border-t border-sidebar-border p-2">
      {/* Settings Link */}
      <Link
        to="/settings"
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isCollapsed && 'justify-center'
        )}
        data-testid="link-settings"
      >
        <Settings className="h-5 w-5" />
        {!isCollapsed && <span>{t('sidebar.settings')}</span>}
      </Link>

      {/* Admin Fight Cards Link (Admin only) */}
      {isAdmin && (
        <Link
          to="/admin/fight-cards"
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isCollapsed && 'justify-center'
          )}
          data-testid="link-admin-fights"
        >
          <Shield className="h-5 w-5" />
          {!isCollapsed && <span>{t('sidebar.fight_management')}</span>}
        </Link>
      )}

      {/* User Profile */}
      <div className={cn(
        'mt-4 flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/30',
        isCollapsed && 'justify-center'
      )}>
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        {!isCollapsed && isAuthenticated && (
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">{displayName}</div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{roleLabel}</span>
              <span className="text-[10px] text-yellow-500">{totalPoints} pts</span>
            </div>
          </div>
        )}
        {!isCollapsed && !isAuthenticated && (
          <div className="flex-1">
            <button
              onClick={() => window.location.href = "/api/login"}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t('common.login')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
