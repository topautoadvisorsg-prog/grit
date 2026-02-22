import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Trophy } from 'lucide-react';
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

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const calculateTimeRemaining = (eventDate: string): TimeRemaining => {
  const now = new Date().getTime();
  const target = parseLocalDate(eventDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 min-w-[52px]">
      <span className="text-2xl md:text-3xl font-bold font-mono text-primary">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
      {label}
    </span>
  </div>
);

export const EventHeader: React.FC<EventHeaderProps> = ({ event }) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(event.date)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(event.date));
    }, 1000);

    return () => clearInterval(interval);
  }, [event.date]);

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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Upcoming Event
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

        {/* Countdown Timer */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-6">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mr-2">
            Starts in
          </span>
          <CountdownUnit value={timeRemaining.days} label="Days" />
          <span className="text-2xl text-muted-foreground/50">:</span>
          <CountdownUnit value={timeRemaining.hours} label="Hours" />
          <span className="text-2xl text-muted-foreground/50">:</span>
          <CountdownUnit value={timeRemaining.minutes} label="Mins" />
          <span className="text-2xl text-muted-foreground/50 hidden sm:block">:</span>
          <div className="hidden sm:block">
            <CountdownUnit value={timeRemaining.seconds} label="Secs" />
          </div>
        </div>

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
