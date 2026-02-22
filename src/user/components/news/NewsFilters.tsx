import React from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { RotateCcw } from 'lucide-react';

interface NewsFiltersProps {
  onReset?: () => void;
}

export const NewsFilters: React.FC<NewsFiltersProps> = ({ onReset }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Event Filter */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Event</span>
        <Select>
          <SelectTrigger className="w-40 bg-card/50 border-border">
            <SelectValue placeholder="Select Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ufc-299">UFC 299</SelectItem>
            <SelectItem value="ufc-300">UFC 300</SelectItem>
            <SelectItem value="ufc-301">UFC 301</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fighter Filter */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Fighter</span>
        <Select>
          <SelectTrigger className="w-44 bg-card/50 border-border">
            <SelectValue placeholder="Search Fighter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="omalley">Sean O'Malley</SelectItem>
            <SelectItem value="mcgregor">Conor McGregor</SelectItem>
            <SelectItem value="makhachev">Islam Makhachev</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags Filter */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Tags</span>
        <Select>
          <SelectTrigger className="w-36 bg-card/50 border-border">
            <SelectValue placeholder="Select Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="analysis">Analysis</SelectItem>
            <SelectItem value="preview">Event Preview</SelectItem>
            <SelectItem value="fighter-news">Fighter News</SelectItem>
            <SelectItem value="research">Research</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Date</span>
        <Select>
          <SelectTrigger className="w-32 bg-card/50 border-border">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset Button */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-transparent">Reset</span>
        <Button
          variant="outline"
          size="default"
          className="gap-2 border-primary text-primary hover:bg-primary/10"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
};
