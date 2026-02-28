import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Calendar, MapPin, Trophy, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { EventCardPage } from './EventCardPage';
import { Event, EventFight } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';

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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: events = [], isLoading: eventsLoading } = useQuery<DbEvent[]>({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
  });

  const { data: selectedEventData, isLoading: eventDetailLoading } = useQuery<DbEventWithFights>({
    queryKey: ['/api/events', selectedEventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${selectedEventId}`);
      if (!response.ok) throw new Error('Failed to fetch event details');
      return response.json();
    },
    enabled: !!selectedEventId,
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

  if (selectedEventId) {
    if (eventDetailLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <span className="ml-2 text-muted-foreground">Loading event...</span>
        </div>
      );
    }

    if (selectedEventData) {
      const frontendEvent = transformDbEventToFrontend(selectedEventData);
      return (
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedEventId(null)}
            className="mb-2"
            data-testid="button-back-to-events"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
          <EventCardPage event={frontendEvent} />
        </div>
      );
    }
  }

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <span className="ml-2 text-muted-foreground">Loading events...</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Events Created Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Create an event in the Admin section to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Events ({events.length})</h2>
      </div>

      <div className="grid gap-4">
        {events.map(event => (
          <Card
            key={event.id}
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setSelectedEventId(event.id)}
            data-testid={`card-event-${event.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={cn(getStatusColor(event.status), "font-black tracking-widest uppercase tabular-nums")}>
                      {event.status === 'Upcoming' ? 'OPEN' : event.status === 'Completed' ? 'CLOSED' : 'LIVE'}
                    </Badge>
                    <Badge variant="outline">{event.organization}</Badge>
                  </div>

                  <h3 className="text-lg font-bold text-foreground truncate" data-testid={`text-event-name-${event.id}`}>
                    {event.name}
                  </h3>

                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.venue}, {event.city}{event.state ? `, ${event.state}` : ''}</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <Button variant="outline" size="sm" data-testid={`button-view-event-${event.id}`}>
                    View Card
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventListPage;
