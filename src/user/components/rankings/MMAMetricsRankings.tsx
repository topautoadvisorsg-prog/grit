import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import { RankingRow, RankingUser } from './RankingRow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Trophy, Users, Flame, Loader2, MessageCircle } from 'lucide-react';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { useAuth } from '@/shared/hooks/use-auth';
import { EventChat } from '@/user/components/chat/EventChat';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  country?: string;
  hasGoldBadge: boolean;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  maxPoints: number;
}

const SMOKE_TEST_USER: RankingUser = {
  id: 'test-1',
  username: 'SmokeTestUser',
  rank: 1,
  results: ['win', 'pending'],
  totalWins: 1,
  totalPicks: 2,
};



export const MMAMetricsRankings: React.FC = () => {
  const { user } = useAuth(); // Import useAuth
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [filterMyCountry, setFilterMyCountry] = useState(false); // New state

  // Fetch Completed Events for Dropdown
  const { data: eventsData } = useQuery({
    queryKey: ['/api/events', { status: 'completed' }],
    queryFn: async () => {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    }
  });

  const eventOptions = [
    { id: 'all', name: 'All Time', status: 'completed' },
    ...(Array.isArray(eventsData) ? eventsData.filter((e: any) => e.status === 'Completed' || e.status === 'Live').map((e: any) => ({
      id: e.id,
      name: e.name,
      status: e.status
    })) : [])
  ];

  const selectedEvent = eventOptions.find(e => e.id === selectedEventId) || eventOptions[0];

  // Fetch Leaderboard with Filters
  const { data, isLoading, error } = useQuery<LeaderboardResponse>({
    queryKey: ['/api/leaderboard', filterMyCountry, selectedEventId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterMyCountry && user?.country) params.append('country', user.country);
      if (selectedEventId !== 'all') params.append('eventId', selectedEventId);

      const res = await fetch(`/api/leaderboard?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
  });

  const transformToRankingUsers = (entries: LeaderboardEntry[]): RankingUser[] => {
    if (!entries || entries.length === 0) return [];

    let filteredEntries = entries;

    // Apply Country Filter
    if (filterMyCountry && user?.country) {
      filteredEntries = entries.filter(e => e.country === user.country);
    }

    return filteredEntries.map((entry) => ({
      id: entry.id,
      username: entry.displayName || entry.username || 'Anonymous',
      avatarUrl: entry.avatarUrl || undefined,
      rank: entry.hasGoldBadge ? 1 : entry.rank,
      results: [] as ('win' | 'loss' | 'pending')[],
      totalWins: entry.totalPoints,
      totalPicks: entry.totalPoints > 0 ? Math.ceil(entry.totalPoints / 3) : 0,
    }));
  };

  const rankings = data?.leaderboard && data.leaderboard.length > 0
    ? transformToRankingUsers(data.leaderboard)
    : transformToRankingUsers(MOCK_LEADERBOARD_DATA); // Fallback to MOCK for Visual Verification

  const displayRankings = rankings.length > 0 ? rankings : (filterMyCountry ? [] : [SMOKE_TEST_USER]);

  const championTier = displayRankings.filter(u => u.rank === 1);
  const leaderboard = displayRankings.filter(u => u.rank > 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-400" />
          <h1 className="text-3xl font-display tracking-wide text-foreground uppercase">
            MMA Metrics Rankings
          </h1>
          <Trophy className="h-8 w-8 text-yellow-400" />
        </div>

        <div className="flex items-center justify-center gap-4">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-48 bg-card border-border" data-testid="select-event">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {mockEvents.map(event => (
                <SelectItem key={event.id} value={event.id} data-testid={`option-event-${event.id}`}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {user && (
            <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-md">
              <Switch
                id="country-filter"
                checked={filterMyCountry}
                onCheckedChange={setFilterMyCountry}
              />
              <Label htmlFor="country-filter" className="text-xs font-medium cursor-pointer">
                {user.country ? `Show ${user.country} Only` : 'Filter by Country'}
              </Label>
            </div>
          )}
        </div>

        {(selectedEvent.status as string) === 'live' && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span className="flex items-center gap-1.5 text-red-400">
              <Flame className="h-4 w-4 animate-pulse" />
              LIVE EVENT
            </span>
            <span className="text-sm">
              {selectedEvent.completedFights}/{selectedEvent.totalFights} Fights Complete
            </span>
          </div>
        )}
      </div>

      {championTier.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
            <span className="px-4 py-1 text-xs font-bold tracking-widest text-yellow-400 uppercase bg-yellow-500/10 rounded-full border border-yellow-500/30">
              Champion Tier {championTier.length > 1 ? `(Tied #1)` : ''}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
          </div>

          <div className="space-y-2">
            {championTier.map((user, index) => (
              <RankingRow
                key={user.id}
                user={user}
                isChampionTier
                animationIndex={index}
                data-testid={`ranking-champion-${user.id}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Leaderboard
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          {leaderboard.map((user, index) => (
            <RankingRow
              key={user.id}
              user={user}
              animationIndex={index + championTier.length}
              data-testid={`ranking-user-${user.id}`}
            />
          ))}
          {leaderboard.length === 0 && championTier.length > 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No other users on the leaderboard yet.
            </p>
          )}
        </div>
      </div>

      {displayRankings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No rankings available yet.</p>
          <p className="text-sm text-muted-foreground/60">Make your picks to appear on the leaderboard!</p>
        </div>
      )}

      {error && (
        <div className="text-center text-red-400 text-sm py-4">
          Failed to load leaderboard. Showing test data.
        </div>
      )}
    </div>
  );
};
