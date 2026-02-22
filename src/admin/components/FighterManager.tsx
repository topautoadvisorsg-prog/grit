import { useState, useMemo } from 'react';
import { useFighters } from '@/shared/hooks/useFighters';
import { Fighter } from '@/shared/types/fighter';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Search, User, ArrowLeft } from 'lucide-react';
import { FighterEditForm } from './FighterEditForm';
import { cn } from '@/shared/lib/utils';

export const FighterManager = () => {
  const { fighters } = useFighters();
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [weightClassFilter, setWeightClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const organizations = useMemo(() => {
    const orgs = new Set(fighters.map(f => f.organization).filter(Boolean));
    return ['all', ...Array.from(orgs).sort()];
  }, [fighters]);

  const weightClasses = useMemo(() => {
    let filtered = fighters;
    if (orgFilter !== 'all') {
      filtered = fighters.filter(f => f.organization === orgFilter);
    }
    const classes = new Set(filtered.map(f => f.weightClass).filter(Boolean));
    return ['all', ...Array.from(classes).sort()];
  }, [fighters, orgFilter]);

  const filteredFighters = useMemo(() => {
    return fighters.filter(fighter => {
      if (orgFilter !== 'all' && fighter.organization !== orgFilter) return false;
      if (weightClassFilter !== 'all' && fighter.weightClass !== weightClassFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${fighter.firstName} ${fighter.lastName}`.toLowerCase();
        const nickname = fighter.nickname?.toLowerCase() || '';
        if (!fullName.includes(query) && !nickname.includes(query)) return false;
      }
      return true;
    });
  }, [fighters, orgFilter, weightClassFilter, searchQuery]);

  const handleOrgChange = (value: string) => {
    setOrgFilter(value);
    setWeightClassFilter('all');
    setSelectedFighter(null);
  };

  const handleWeightClassChange = (value: string) => {
    setWeightClassFilter(value);
    setSelectedFighter(null);
  };

  const handleFighterUpdate = () => {
    setSelectedFighter(null);
  };

  if (selectedFighter) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedFighter(null)}
          className="gap-2 text-muted-foreground hover:text-foreground"
          data-testid="button-back-to-list"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Fighter List
        </Button>
        <FighterEditForm fighter={selectedFighter} onUpdate={handleFighterUpdate} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Fighter Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-filter">Organization</Label>
              <Select value={orgFilter} onValueChange={handleOrgChange}>
                <SelectTrigger id="org-filter" data-testid="select-organization">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org} value={org}>
                      {org === 'all' ? 'All Organizations' : org}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-class-filter">Weight Class</Label>
              <Select value={weightClassFilter} onValueChange={handleWeightClassChange}>
                <SelectTrigger id="weight-class-filter" data-testid="select-weight-class">
                  <SelectValue placeholder="Select weight class" />
                </SelectTrigger>
                <SelectContent>
                  {weightClasses.map(wc => (
                    <SelectItem key={wc} value={wc}>
                      {wc === 'all' ? 'All Weight Classes' : wc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search Fighter</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Type name to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-fighter"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {filteredFighters.length} Fighter{filteredFighters.length !== 1 ? 's' : ''} Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFighters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fighters match your filters. Try adjusting the search criteria.
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredFighters.map(fighter => (
                  <button
                    key={fighter.id}
                    onClick={() => setSelectedFighter(fighter)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border border-border',
                      'hover:bg-accent/50 transition-colors text-left'
                    )}
                    data-testid={`button-select-fighter-${fighter.id}`}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {fighter.imageUrl && !fighter.imageUrl.includes('placeholder') ? (
                        <img
                          src={fighter.imageUrl}
                          alt={`${fighter.firstName} ${fighter.lastName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {fighter.firstName} {fighter.lastName}
                        {fighter.nickname && (
                          <span className="text-muted-foreground ml-2">"{fighter.nickname}"</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {fighter.weightClass} | {fighter.record.wins}-{fighter.record.losses}-{fighter.record.draws}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fighter.organization}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
