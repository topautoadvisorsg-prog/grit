import React from 'react';
import { cn } from '@/shared/lib/utils';
import { RankBadge } from './RankBadge';
import { ResultIndicators } from './ResultIndicators';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { TierBadge } from '@/user/components/gamification/TierBadge';

export interface RankingUser {
  id: string;
  username: string;
  avatarUrl?: string;
  rank: number;
  results: ('win' | 'loss' | 'pending')[];
  totalWins: number;
  totalPicks: number;
  tier?: string;
}

interface RankingRowProps {
  user: RankingUser;
  isChampionTier?: boolean;
  className?: string;
  /** Index for staggered animation (0-based) */
  animationIndex?: number;
  /** Disable animations */
  disableAnimation?: boolean;
}

export const RankingRow: React.FC<RankingRowProps> = ({
  user,
  isChampionTier,
  className,
  animationIndex = 0,
  disableAnimation = false,
}) => {
  const initials = user.username.slice(0, 2).toUpperCase();
  const winRate = user.totalPicks > 0 ? Math.round((user.totalWins / user.totalPicks) * 100) : 0;

  // Animation delay based on index (staggered entry)
  const animationDelay = disableAnimation ? '0ms' : `${animationIndex * 50}ms`;

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
        // Entry animation classes
        !disableAnimation && "animate-slide-up opacity-0",
        // Champion tier styling
        isChampionTier
          ? "bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/30 hover:border-yellow-500/50"
          : "bg-card/50 border border-border/50 hover:border-border hover:bg-card/80",
        // Top 3 get special glow on hover
        user.rank <= 3 && "hover:shadow-lg hover:shadow-primary/10",
        className
      )}
      style={{
        animationDelay,
        animationFillMode: 'forwards',
      }}
    >
      {/* Rank Badge */}
      <RankBadge rank={user.rank} />

      {/* Avatar with rank-based ring */}
      <Avatar className={cn(
        "h-10 w-10 border-2 transition-all duration-200",
        user.rank === 1 ? "border-yellow-400 ring-2 ring-yellow-400/20" :
          user.rank === 2 ? "border-gray-400 ring-2 ring-gray-400/20" :
            user.rank === 3 ? "border-amber-600 ring-2 ring-amber-600/20" :
              "border-border"
      )}>
        <AvatarImage src={user.avatarUrl} alt={user.username} />
        <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Username + Tier Badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "font-bold text-foreground truncate",
            isChampionTier && "text-yellow-400"
          )}>
            {user.username}
          </span>
          <TierBadge tier={user.tier} />
        </div>
        <span className="text-xs text-muted-foreground">
          {winRate}% accuracy
        </span>
      </div>

      {/* Result Indicators */}
      <ResultIndicators results={user.results} />

      {/* Win count badge */}
      <div className={cn(
        "px-3 py-1 rounded-full text-sm font-bold",
        user.rank <= 3
          ? "bg-primary/20 text-primary"
          : "bg-muted text-muted-foreground"
      )}>
        {user.totalWins}W
      </div>
    </div>
  );
};
