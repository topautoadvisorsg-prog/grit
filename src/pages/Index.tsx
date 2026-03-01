
import React, { useState } from 'react';
import { Sidebar } from '@/user/components/layout/Sidebar';
import { Header } from '@/user/components/layout/Header';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/use-auth';
import { AdBanner } from '@/user/components/ads/AdBanner';
import { tabTitles } from '@/shared/config/navigation';

const Index = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isAdmin = (user as any)?.role === "admin";

  // Derive active tab from pathname for header title
  const pathname = location.pathname.split('/')[1] || 'event';
  const currentTabInfo = tabTitles[pathname] || tabTitles.eventcard;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isAdmin={isAdmin}
      />

      <Header
        title={currentTabInfo.title}
        subtitle={currentTabInfo.subtitle}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={cn(
          'pt-20 pb-8 px-4 lg:px-8 transition-all duration-300',
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Outlet />
      </main>
      <AdBanner />
    </div>
  );
};
export default Index;
