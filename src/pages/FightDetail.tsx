import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Fighter, EventFight } from '@/shared/types/fighter';
import { useFighters } from '@/shared/hooks/useFighters';
import { useAuth } from '@/shared/hooks/use-auth';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/hooks/use-toast';
import {
  ArrowLeft,
  Trophy,
  Crown,
  Target,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  Swords,
  ChevronRight,
  MessageSquare,
  Lock,
  Database,
  Loader2
} from 'lucide-react';
import { FighterComparisonCard } from '@/user/components/fightdetail/FighterComparisonCard';
import { StatsComparison } from '@/user/components/fightdetail/StatsComparison';
import { BettingOddsSection } from '@/user/components/fightdetail/BettingOddsSection';
import { FantasyPickSection } from '@/user/components/fightdetail/FantasyPickSection';
import { PostFightNotes } from '@/user/components/fightdetail/PostFightNotes';
import { WarRoomAnalytics } from '@/user/components/fightdetail/WarRoomAnalytics';

interface DbEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  city: string;
  state: string | null;
  country: string;
  organization: string;
  description: string | null;
  status: string;
  fights: DbEventFight[];
}

interface DbEventFight {
  id: string;
  eventId: string;
  fighter1Id: string;
  fighter2Id: string;
  cardPlacement: string;
  boutOrder: number;
  weightClass: string;
  isTitleFight: boolean;
  rounds: number;
  status: string;
}

const FightDetail: React.FC = () => {
  const { fightId } = useParams<{ fightId: string }>();
  const navigate = useNavigate();
  const { fighters, fighterMap, isLoaded } = useFighters();

  // Fetch all events to find the fight
  const { data: events = [], isLoading: eventsLoading } = useQuery<DbEvent[]>({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const eventsRes = await fetch('/api/events');
      if (!eventsRes.ok) return [];
      const eventsList = await eventsRes.json();

      // Fetch fights for each event
      const eventsWithFights = await Promise.all(
        eventsList.map(async (event: any) => {
          const res = await fetch(`/api/events/${event.id}`);
          if (!res.ok) return { ...event, fights: [] };
          return res.json();
        })
      );
      return eventsWithFights;
    },
  });

  // Find the fight and its event
  const { fight, event } = useMemo(() => {
    for (const evt of events) {
      const foundFight = evt.fights?.find((f: DbEventFight) => f.id === fightId);
      if (foundFight) {
        return {
          fight: {
            id: foundFight.id,
            eventId: foundFight.eventId,
            fighter1Id: foundFight.fighter1Id,
            fighter2Id: foundFight.fighter2Id,
            fightType: foundFight.cardPlacement === 'Preliminary' ? 'Prelim' as const : 'Main Card' as const,
            boutOrder: foundFight.boutOrder,
            weightClass: foundFight.weightClass,
            isTitleFight: foundFight.isTitleFight,
            rounds: foundFight.rounds,
            status: foundFight.status as 'Scheduled' | 'Completed' | 'Cancelled',
          } as EventFight,
          event: evt
        };
      }
    }
    return { fight: undefined, event: undefined };
  }, [events, fightId]);

  const fighter1 = fight ? fighterMap.get(fight.fighter1Id) : undefined;
  const fighter2 = fight ? fighterMap.get(fight.fighter2Id) : undefined;

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing pick for this fight
  const { data: existingPick } = useQuery({
    queryKey: ['/api/picks/fight', fightId],
    queryFn: async () => {
      if (!fightId) return null;
      const res = await fetch(`/api/picks/fight/${fightId}`, { credentials: 'include' });
      if (res.status === 404 || res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!fightId && isAuthenticated,
  });

  // Fantasy pick state
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedUnits, setSelectedUnits] = useState(1);
  const [isPickLocked, setIsPickLocked] = useState(false);

  // Sync state with existing pick from database
  useEffect(() => {
    if (existingPick) {
      setSelectedFighter(existingPick.pickedFighterId);
      setSelectedMethod(existingPick.pickedMethod);
      setSelectedRound(existingPick.pickedRound);
      setSelectedUnits(existingPick.units || 1);
      setIsPickLocked(existingPick.isLocked || false);
    }
  }, [existingPick]);

  // Save pick mutation
  const savePick = useMutation({
    mutationFn: async (data: { fightId: string; pickedFighterId: string; pickedMethod: string; pickedRound: number | null; units: number }) => {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save pick');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/picks/fight', fightId] });
      toast({ title: 'Prediction locked!', description: 'Good luck!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Check if fight is completed (for post-fight notes)
  const isFightCompleted = fight?.status === 'Completed';

  // Loading state
  if (eventsLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading fight details...</p>
        </div>
      </div>
    );
  }

  // Empty state - no fighter data
  if (isLoaded && fighters.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Database className="w-16 h-16 text-muted-foreground/50 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">No Fighter Data</h2>
          <p className="text-muted-foreground">Import fighter data to view fight details.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!fight || !fighter1 || !fighter2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Swords className="w-16 h-16 text-muted-foreground/50 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Fight Not Found</h2>
          <p className="text-muted-foreground">This matchup doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Return to Event Card
          </button>
        </div>
      </div>
    );
  }

  const handleLockPick = () => {
    if (!isAuthenticated) {
      toast({ title: 'Login required', description: 'Please log in to save your prediction.', variant: 'destructive' });
      return;
    }

    const isFinishMethod = selectedMethod === 'ko' || selectedMethod === 'sub';
    const roundRequired = isFinishMethod ? selectedRound !== null : true;
    if (selectedFighter && selectedMethod && roundRequired && fightId) {
      savePick.mutate({
        fightId,
        pickedFighterId: selectedFighter,
        pickedMethod: selectedMethod,
        pickedRound: selectedRound,
        units: selectedUnits,
      });
      setIsPickLocked(true);
    }
  };

  const handleSelectMethod = (method: string) => {
    setSelectedMethod(method);
    // Reset round when method changes to Decision (no round needed)
    if (method === 'dec') {
      setSelectedRound(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/event"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Event List</span>
          </Link>

          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {event?.name}
            </span>
          </div>

          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Hero Section - Event & Fight Title */}
      <section className="relative overflow-hidden">
        {/* Background gradient - more dramatic */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-accent/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-14">
          {/* Event Name - THE ANCHOR */}
          <div className="text-center mb-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-lg">
                {event?.name}
              </span>
            </h1>
            <div className="mt-2 flex items-center justify-center gap-3 text-muted-foreground">
              <span className="text-sm md:text-base">{event?.venue}, {event?.city}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="text-sm md:text-base">{event?.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
            </div>
          </div>

          {/* Fight Position Badge - Main/Co-Main */}
          <div className="flex justify-center mb-4">
            {fight.boutOrder === 1 && (
              <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-accent/30 to-accent/20 border border-accent/50 shadow-lg shadow-accent/10">
                <Crown className="w-5 h-5 text-accent" />
                <span className="text-sm md:text-base font-bold uppercase tracking-wider text-accent">
                  Main Event
                </span>
              </div>
            )}
            {fight.boutOrder === 2 && (
              <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/30 to-primary/20 border border-primary/50 shadow-lg shadow-primary/10">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm md:text-base font-bold uppercase tracking-wider text-primary">
                  Co-Main Event
                </span>
              </div>
            )}
            {fight.boutOrder > 2 && (
              <div className="px-4 py-1.5 rounded-full bg-muted/50 border border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Bout #{fight.boutOrder}
                </span>
              </div>
            )}
          </div>

          {/* Weight Class + Title Context */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-sm md:text-base uppercase tracking-widest text-foreground/80 font-medium">
              {fight.weightClass}
            </span>
            {fight.isTitleFight && (
              <>
                <span className="w-1 h-1 rounded-full bg-yellow-500" />
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm md:text-base font-bold uppercase tracking-wider text-yellow-500">
                    Title Fight
                  </span>
                </div>
              </>
            )}
          </div>

          {/* VS Title - Fighter Names */}
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-black">
              <span className="text-foreground">{fighter1.lastName.toUpperCase()}</span>
              <span className="mx-4 text-primary font-bold">VS</span>
              <span className="text-foreground">{fighter2.lastName.toUpperCase()}</span>
            </h2>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-12 space-y-8">
        {/* Fighter Comparison Cards */}
        <section className="grid md:grid-cols-2 gap-6">
          <FighterComparisonCard
            fighter={fighter1}
            corner="red"
            isSelected={selectedFighter === fighter1.id}
            onSelect={() => !isPickLocked && setSelectedFighter(fighter1.id)}
            isPickLocked={isPickLocked}
          />
          <FighterComparisonCard
            fighter={fighter2}
            corner="blue"
            isSelected={selectedFighter === fighter2.id}
            onSelect={() => !isPickLocked && setSelectedFighter(fighter2.id)}
            isPickLocked={isPickLocked}
          />
        </section>

        {/* War Room Analytics - 6 charts (3 per fighter) - ANALYSIS BEFORE PICK */}
        <section className="glass-morphism p-6 md:p-10 border border-white/5">
          <WarRoomAnalytics fighter1={fighter1} fighter2={fighter2} />
        </section>

        {/* Fantasy Pick Section - THE DECISION */}
        <section id="pick-section">
          <FantasyPickSection
            fighter1={fighter1}
            fighter2={fighter2}
            selectedFighter={selectedFighter}
            selectedMethod={selectedMethod}
            selectedRound={selectedRound}
            onSelectMethod={handleSelectMethod}
            onSelectRound={setSelectedRound}
            isLocked={isPickLocked}
            onLock={handleLockPick}
            totalRounds={fight.rounds}
            units={selectedUnits}
            onSelectUnits={setSelectedUnits}
          />
        </section>

        {/* Secondary Details */}
        <section className="grid md:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
          {/* Stats Comparison */}
          <StatsComparison fighter1={fighter1} fighter2={fighter2} />

          {/* Betting Odds */}
          <BettingOddsSection fighter1={fighter1} fighter2={fighter2} />
        </section>

        {/* Post-Fight Notes (structure ready, conditional display) */}
        <PostFightNotes
          fighter1={fighter1}
          fighter2={fighter2}
          isFightCompleted={isFightCompleted}
        />
      </main>
    </div>
  );
};

export default FightDetail;
