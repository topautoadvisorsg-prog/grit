
import React, { useState } from 'react';
import { Sidebar } from '@/user/components/layout/Sidebar';
import { Header } from '@/user/components/layout/Header';
import { FighterProfile } from '@/user/components/fighter/FighterProfile';
import { FighterIndex } from '@/user/components/fighter/FighterIndex';
import { EventListPage } from '@/user/components/event/EventListPage';
import { EventHistoryPage } from '@/user/components/eventhistory/EventHistoryPage';
import { MMAMetricsRankings } from '@/user/components/rankings/MMAMetricsRankings';
import { NewsPage } from '@/user/components/news/NewsPage';
import { ExportPage } from '@/user/components/export/ExportPage';
import { Dashboard } from '@/user/components/dashboard';
import { AIPredictionsTab } from '@/user/components/ai';
import { AIChatTab } from '@/user/components/aichat/AIChatTab';
import { RaffleTab } from '@/user/components/raffle/RaffleTab';
import { InfluencerTab } from '@/user/components/influencers/InfluencerTab';
import { ChatHub } from '@/user/components/chat/ChatHub';
import { InfoTab } from '@/user/components/info/InfoTab';
import { ADMIN_TAB_COMPONENTS } from '@/admin/AdminPanel';
import { Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/shared/hooks/use-auth';
import { AdBanner } from '@/user/components/ads/AdBanner';
import { tabTitles } from '@/shared/config/navigation';
import { ComingSoon } from '@/shared/components/ui/ComingSoon';

const Index = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('fighters');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const isAdmin = (user as any)?.role === "admin";

  const currentTabInfo = tabTitles[activeTab] || tabTitles.fighters;

  const handleFighterSelect = (fighter: Fighter) => {
    setSelectedFighter(fighter);
  };

  const handleBackToIndex = () => {
    setSelectedFighter(null);
  };

  const navigateToImport = () => setActiveTab('import');

  const USER_TAB_COMPONENTS: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    advanced: (
      <ComingSoon
        icon={BarChart3}
        title="Advanced"
        description="High-level analytics, signals, and fighter comparisons. Coming soon."
      />
    ),
    fighters: <FighterIndex onFighterSelect={handleFighterSelect} onNavigateToImport={navigateToImport} />,
    eventcard: <EventListPage />,
    eventhistory: <EventHistoryPage onNavigateToImport={navigateToImport} />,
    rankings: <MMAMetricsRankings />,
    news: <NewsPage />,
    export: <ExportPage />,
    'ai-predictions': <AIPredictionsTab />,
    'ai-chat': <AIChatTab />,
    chat: <ChatHub />,
    raffle: <RaffleTab />,
    influencers: <InfluencerTab />,
    info: <InfoTab />,
  };

  const TAB_COMPONENTS: Record<string, React.ReactNode> = {
    ...USER_TAB_COMPONENTS,
    ...ADMIN_TAB_COMPONENTS,
  };

  const renderTabContent = () => {
    if (selectedFighter) {
      return (
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={handleBackToIndex}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Fighter Index
          </Button>
          <FighterProfile fighter={selectedFighter} />
        </div>
      );
    }

    return TAB_COMPONENTS[activeTab] || TAB_COMPONENTS['fighters'];
  };

  // Reset fighter selection when changing tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedFighter(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        isAdmin={isAdmin}
      />

      <Header
        title={selectedFighter ? `${selectedFighter.firstName} ${selectedFighter.lastName}` : currentTabInfo.title}
        subtitle={selectedFighter ? selectedFighter.weightClass : currentTabInfo.subtitle}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={cn(
          'pt-20 pb-8 px-4 lg:px-8 transition-all duration-300',
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {renderTabContent()}
      </main>
      <AdBanner />
    </div>
  );
};

export default Index;
