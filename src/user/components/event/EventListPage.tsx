import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Calendar, MapPin, Trophy, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { EventCardPage } from './EventCardPage';
import { Event, EventFight } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import SEO from '@/shared/components/SEO';
import { generateEventSchema, injectJSONLD } from '@/shared/utils/SEOHelper';
import { useEffect } from 'react';

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
  createdAt: string;
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

interface DbEventWithFights extends DbEvent {
  fights: DbEventFight[];
}

const mapCardPlacementToFightType = (placement: string): EventFight['fightType'] => {
  if (placement === 'Main Event' || placement === 'Co-Main Event' || placement === 'Main Card') {
    return 'Main Card';
  }
  if (placement === 'Preliminary') {
    return 'Prelim';
  }
  return 'Main Card';
};

const transformDbEventToFrontend = (dbEvent: DbEventWithFights): Event => {
  return {
    id: dbEvent.id,
    name: dbEvent.name,
    date: dbEvent.date,
    location: {
      city: dbEvent.city,
      state: dbEvent.state || undefined,
      country: dbEvent.country,
      venue: dbEvent.venue,
    },
    fights: dbEvent.fights.map(f => ({
      id: f.id,
      eventId: f.eventId,
      fighter1Id: f.fighter1Id,
      fighter2Id: f.fighter2Id,
      fightType: mapCardPlacementToFightType(f.cardPlacement),
      boutOrder: f.boutOrder,
      weightClass: f.weightClass,
      isTitleFight: f.isTitleFight,
      rounds: f.rounds,
      status: f.status as EventFight['status'],
    })),
    status: dbEvent.status as Event['status'],
  };
};

export const EventListPage = () => {
  const navigate = useNavigate();
  const { data: events = [], isLoading: eventsLoading } = useQuery<DbEvent[]>({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
  });

  const { data: userPicks = [] } = useQuery<any[]>({
    queryKey: ['/api/picks'],
    queryFn: async () => {
      const response = await fetch('/api/picks');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      case 'Live': return 'bg-red-500/20 text-red-400 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse';
      case 'Completed': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50';
      case 'Cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isPicked = (eventId: string) => {
    return userPicks.some(pick => pick.eventId === eventId);
  };

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <span className="ml-2 text-muted-foreground">Loading events...</span>
      </div>
    );
  }

  const latestEvent = events[0];

  useEffect(() => {
    if (latestEvent) {
      const schema = generateEventSchema({
        name: latestEvent.name,
        description: latestEvent.description,
        startDate: latestEvent.date,
        location: latestEvent.city,
        venue: latestEvent.venue,
        fightCard: []
      });
      injectJSONLD(schema);
    }
  }, [latestEvent]);

  return (
    <div className="space-y-8">
      <SEO
        title="Upcoming MMA Events"
        description={`Join GRIT to analyze and predict upcoming MMA events like ${latestEvent?.name || 'the next big fight'}.`}
        keywords="MMA fight cards, upcoming UFC events, MMA predictions, fight analysis"
      />
      <SEO
        title="Upcoming MMA Events"
        description={`Join GRIT to analyze and predict upcoming MMA events like ${latestEvent?.name || 'the next big fight'}.`}
        keywords="MMA fight cards, upcoming UFC events, MMA predictions, fight analysis"
      />
      {/* Hero Section */}
      {latestEvent && (
        <section
          className="relative rounded-2xl overflow-hidden glass-morphism border border-white/10 hover-gradient-border group cursor-pointer"
          onClick={() => navigate(`/event/fight/${latestEvent.id}`)} // This will be updated to handle event detail vs fight detail properly
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
          <div className="relative h-[300px] md:h-[400px] flex items-end p-6 md:p-10 z-20">
            <div className="space-y-4 max-w-2xl">
              <Badge className={cn(getStatusColor(latestEvent.status), "text-xs font-bold uppercase tracking-[0.2em]")}>
                {latestEvent.status === 'Upcoming' ? 'NEXT EVENT' : latestEvent.status}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight italic uppercase">
                {latestEvent.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm md:text-base text-zinc-300 font-medium">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  <span>{formatDate(latestEvent.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  <span>{latestEvent.venue}, {latestEvent.city}</span>
                </div>
              </div>
              {latestEvent.description && (
                <p className="text-zinc-400 line-clamp-2 text-sm md:text-base leading-relaxed">
                  {latestEvent.description}
                </p>
              )}
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider rounded-none">
                <Trophy className="mr-2 h-5 w-5" />
                JOIN GRIT
              </Button>
            </div>
          </div>
          <div
            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599058917232-d750c1859d7c?q=80&w=2070')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-40"
          />
        </section>
      )}

      {/* Event List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-white italic uppercase tracking-widest flex items-center gap-2">
          <Calendar className="h-6 w-6 text-cyan-400" />
          Fight Cards
        </h2>

        <div className="grid gap-4">
          {events.map(event => (
            <Card
              key={event.id}
              className="group cursor-pointer glass-morphism border-white/5 hover:border-cyan-500/50 transition-all overflow-hidden"
              onClick={() => navigate(`/event`)} // Update once event detail route is clearer, or use modal
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="p-6 flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn(getStatusColor(event.status), "font-black tracking-widest uppercase text-[10px]")}>
                        {event.status}
                      </Badge>
                      {isPicked(event.id) ? (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 font-bold text-[10px] uppercase italic">
                          <Trophy className="w-3 h-3 mr-1 inline" />
                          Picked
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-500 font-bold text-[10px] uppercase">
                          No Picks
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                      {event.name}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                        {formatDate(event.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-zinc-600" />
                        {event.venue}
                      </span>
                    </div>
                  </div>

                  <div className="px-6 pb-6 md:pb-0 md:pr-10">
                    <Button variant="ghost" className="text-cyan-400 group-hover:bg-cyan-400 group-hover:text-black transition-all">
                      VIEW CARD
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventListPage;
