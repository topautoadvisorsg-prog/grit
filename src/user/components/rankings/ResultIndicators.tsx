import React from 'react';
import { cn } from '@/shared/lib/utils';

interface ResultIndicatorsProps {
  results: ('win' | 'loss' | 'pending')[];
  className?: string;
}

export const ResultIndicators: React.FC<ResultIndicatorsProps> = ({ results, className }) => {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {results.map((result, index) => (
        <div
          key={index}
          className={cn(
            "w-4 h-4 rounded-full transition-all duration-200",
            result === 'win' && "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]",
            result === 'loss' && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
            result === 'pending' && "bg-muted-foreground/30 border border-muted-foreground/50"
          )}
        />
      ))}
    </div>
  );
};
