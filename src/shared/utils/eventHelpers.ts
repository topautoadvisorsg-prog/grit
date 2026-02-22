import type { EventFight } from '@/shared/types/fighter';

export const getFightTypeLabel = (boutOrder: number, isTitleFight: boolean): string => {
  if (boutOrder === 1) return 'MAIN EVENT';
  if (boutOrder === 2) return 'CO-MAIN EVENT';
  if (isTitleFight) return 'TITLE FIGHT';
  return '';
};

export const getFightSectionLabel = (fightType: EventFight['fightType']): string => {
  switch (fightType) {
    case 'Main Card':
      return 'MAIN CARD';
    case 'Prelim':
      return 'PRELIMS';
    case 'Early Prelim':
      return 'EARLY PRELIMS';
    default:
      return 'EXHIBITION';
  }
};
