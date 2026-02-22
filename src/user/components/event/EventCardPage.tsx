import React, { useMemo } from 'react';
import { Event, Fighter, EventFight } from '@/shared/types/fighter';
import { EventHeader } from './EventHeader';
import { FightCardSection } from './FightCardSection';
import { useFighters } from '@/shared/hooks/useFighters';
import { Calendar } from 'lucide-react';

interface EventCardPageProps {
  event?: Event;
  onViewFightDetails?: (fightId: string) => void;
}

export const EventCardPage: React.FC<EventCardPageProps> = ({
  event,
  onViewFightDetails,
}) => {
  const { fighterMap, isLoaded } = useFighters();

  const getFighter = (id: string): Fighter | undefined => fighterMap.get(id);

  // Group fights by type
  const groupedFights = useMemo(() => {
    const groups: Record<string, EventFight[]> = {
      'Main Card': [],
      'Prelim': [],
      'Early Prelim': [],
      'Exhibition': [],
    };

    if (!event?.fights) return groups;

    // Sort by bout order (main event first)
    const sortedFights = [...event.fights].sort((a, b) => a.boutOrder - b.boutOrder);
    
    sortedFights.forEach((fight) => {
      if (groups[fight.fightType]) {
        groups[fight.fightType].push(fight);
      }
    });

    return groups;
  }, [event?.fights]);

  const handleViewDetails = (fightId: string) => {
    onViewFightDetails?.(fightId);
  };

  // Empty state - no event created yet
  if (!event || !event.fights || event.fights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Event Created Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Create an event to populate the fight card. Events can be created in the admin section.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Event Header */}
      <EventHeader event={event} />

      {/* Fight Card Sections */}
      <FightCardSection
        title="Main Card"
        fights={groupedFights['Main Card']}
        getFighter={getFighter}
        onViewDetails={handleViewDetails}
      />

      <FightCardSection
        title="Prelims"
        fights={groupedFights['Prelim']}
        getFighter={getFighter}
        onViewDetails={handleViewDetails}
      />

      <FightCardSection
        title="Early Prelims"
        fights={groupedFights['Early Prelim']}
        getFighter={getFighter}
        onViewDetails={handleViewDetails}
      />

      {groupedFights['Exhibition'].length > 0 && (
        <FightCardSection
          title="Exhibition"
          fights={groupedFights['Exhibition']}
          getFighter={getFighter}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Footer note */}
      <div className="text-center py-6 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Click any fight card to view detailed Tale of the Tape analysis
        </p>
      </div>
    </div>
  );
};
