import { useState } from "react";
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FighterDataProvider } from "@/shared/context/FighterDataContext";
import { FightHistoryProvider } from "@/shared/context/FightHistoryContext";
import { GamificationProvider } from "@/shared/context/GamificationContext";
import { useAuth } from "@/shared/hooks/use-auth";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import WelcomeModal from "@/user/components/WelcomeModal";
import FightDetail from "./pages/FightDetail";
import Settings from "./pages/Settings";
import AdminFightCards from "@/admin/pages/AdminFightCards";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: false,
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const response = await fetch(url, { credentials: "include" });
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        return response.json();
      },
    },
  },
});

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(220 25% 6%)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid hsl(210 25% 18%)',
          borderTopColor: 'hsl(190 90% 50%)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const needsOnboarding = !user.username && !onboardingDismissed;

  return (
    <>
      {needsOnboarding && (
        <WelcomeModal onComplete={() => setOnboardingDismissed(true)} />
      )}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/fight/:fightId" element={<FightDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/fight-cards" element={<AdminFightCards />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GamificationProvider>
      <FighterDataProvider>
        <FightHistoryProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </FightHistoryProvider>
      </FighterDataProvider>
    </GamificationProvider>
  </QueryClientProvider>
);

export default App;
