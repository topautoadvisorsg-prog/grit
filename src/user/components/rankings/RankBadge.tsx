import React from 'react';
import { cn } from '@/shared/lib/utils';

interface RankBadgeProps {
  rank: number;
  className?: string;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank, className }) => {
  if (rank > 3) {
    return (
      <div className={cn(
        "w-12 h-12 flex items-center justify-center text-lg font-bold text-muted-foreground",
        className
      )}>
        {rank}
      </div>
    );
  }

  const badgeColors = {
    1: 'from-yellow-400 to-amber-600',
    2: 'from-slate-300 to-slate-500',
    3: 'from-orange-400 to-amber-700',
  };

  const ordinals = ['', '1ST', '2ND', '3RD'];

  return (
    <div className={cn(
      "relative w-14 h-16 flex flex-col items-center justify-center",
      className
    )}>
      {/* Shield shape */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-b rounded-t-lg",
        badgeColors[rank as 1 | 2 | 3]
      )} style={{
        clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)'
      }} />
      
      {/* Inner content */}
      <div className="relative z-10 flex flex-col items-center pt-1">
        <span className="text-xs font-bold text-white/90">{ordinals[rank]}</span>
        <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide">Place</span>
      </div>
    </div>
  );
};
