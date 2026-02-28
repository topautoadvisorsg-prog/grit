import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Trophy, Flame } from 'lucide-react';
import { Event } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';

interface EventHeaderProps {
  event: Event;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface EventTiming {
  isLive: boolean;
  isReflection: boolean;
  isArchived: boolean;
  timeRemaining: TimeRemaining | null;
}

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const calculateTiming = (eventDate: string, status: string): EventTiming => {
  const now = new Date().getTime();
  const startTarget = parseLocalDate(eventDate).getTime();
  const eventEnd = startTarget + (6 * 60 * 60 * 1000); // Roughly 6 hours after start
  const reflectionEnd = eventEnd + (24 * 60 * 60 * 1000); // 24 hours after event

  if (status === 'Completed') {
    if (now >= reflectionEnd) {
      return { isLive: false, isReflection: false, isArchived: true, timeRemaining: null };
    }
    const diff = reflectionEnd - now;
    return {
      isLive: false,
      isReflection: true,
      isArchived: false,
      timeRemaining: {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      }
    };
  }

  const diff = startTarget - now;
  if (diff <= 0) {
    return { isLive: status === 'Live', isReflection: false, isArchived: false, timeRemaining: null };
  }

  return {
    isLive: false,
    isReflection: false,
    isArchived: false,
    timeRemaining: {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    }
  };
};

const CountdownUnit: React.FC<{ value: number; label: string; isReflection?: boolean }> = ({ value, label, isReflection }) => (
  <div className="flex flex-col items-center">
    <div className={cn(
      "backdrop-blur-sm border rounded-lg px-3 py-2 min-w-[52px]",
      isReflection ? "bg-indigo-500/10 border-indigo-500/30" : "bg-card/80 border-border/50"
    )}>
      <span className={cn(
        "text-2xl md:text-3xl font-bold font-mono tabular-nums tracking-tight",
        isReflection ? "text-indigo-400" : "text-primary"
      )}>
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5 font-bold">
      {label}
    </span>
  </div>
);

export const EventHeader: React.FC<EventHeaderProps> = ({ event }) => {
  const [timing, setTiming] = useState<EventTiming>(
    calculateTiming(event.date, event.status)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTiming(calculateTiming(event.date, event.status));
    }, 1000);

    return () => clearInterval(interval);
  }, [event.date, event.status]);

  const formattedDate = parseLocalDate(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const titleFights = event.fights.filter((f) => f.isTitleFight).length;

  return (
    <div className="relative overflow-hidden rounded-xl mb-6">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMGQ0ZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      {/* Glow effects */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8">
        {/* Top badge */}
        <div className="flex items-center justify-center mb-4">
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border",
            event.status === 'Live' ? "bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse" :
              event.status === 'Completed' ? "bg-zinc-500/10 border-zinc-500/30 text-zinc-400" :
                "bg-primary/10 border-primary/30 text-primary"
          )}>
            {event.status === 'Live' ? <Flame className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
            <span className="text-xs font-black uppercase tracking-widest tabular-nums">
              {event.status === 'Upcoming' ? 'OPEN FOR PICKS' : event.status === 'Completed' ? 'CLOSED' : 'LIVE'}
            </span>
          </div>
        </div>

        {/* Event Name */}
        <h1 className="text-3xl md:text-5xl font-black text-center mb-2 tracking-tight">
          <span className="text-gradient-brand">{event.name}</span>
        </h1>

        {/* Location & Date */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">
              {event.location.venue}, {event.location.city}
              {event.location.state && `, ${event.location.state}`}
            </span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/50" />
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{formattedDate}</span>
          </div>
        </div>

        {/* Countdown / Reflection Timer */}
        {timing.isArchived ? (
          <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-background/40 backdrop-blur border border-border/50 rounded-xl max-w-sm mx-auto">
            <span className="text-xl">🔒</span>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Archived Event</span>
              <span className="text-xs text-muted-foreground/80">Reflection period has ended</span>
            </div>
          </div>
        ) : timing.timeRemaining ? (
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mr-2">
                {timing.isReflection ? 'Reflection' : 'Starts in'}
              </span>
              <CountdownUnit value={timing.timeRemaining.days} label="Days" isReflection={timing.isReflection} />
              <span className="text-2xl text-muted-foreground/50">:</span>
              <CountdownUnit value={timing.timeRemaining.hours} label="Hours" isReflection={timing.isReflection} />
              <span className="text-2xl text-muted-foreground/50">:</span>
              <CountdownUnit value={timing.timeRemaining.minutes} label="Mins" isReflection={timing.isReflection} />
              <span className="text-2xl text-muted-foreground/50 hidden sm:block">:</span>
              <div className="hidden sm:block">
                <CountdownUnit value={timing.timeRemaining.seconds} label="Secs" isReflection={timing.isReflection} />
              </div>
            </div>
            {timing.isReflection && (
              <span className="text-[10px] text-indigo-400 mt-3 font-semibold tracking-wider uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Picks graded. Review your performance.
              </span>
            )}
          </div>
        ) : timing.isLive && (
          <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl max-w-sm mx-auto">
            <Flame className="text-red-500 w-5 h-5 animate-pulse" />
            <span className="text-sm font-bold tracking-widest uppercase text-red-500">Event is Live</span>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border/30">
            <span className="text-lg font-bold text-foreground">{event.fights.length}</span>
            <span className="text-xs text-muted-foreground uppercase">Fights</span>
          </div>
          {titleFights > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30">
              <Trophy className="w-4 h-4 text-accent" />
              <span className="text-lg font-bold text-accent">{titleFights}</span>
              <span className="text-xs text-accent/80 uppercase">Title Fights</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
