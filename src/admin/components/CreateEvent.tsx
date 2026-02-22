import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import { Plus, Trash2, Trophy, Users, Calendar, MapPin, Loader2 } from 'lucide-react';
import type { Fighter } from '@/shared/types/fighter';

const ORGANIZATIONS = ['UFC', 'Bellator', 'ONE', 'PFL', 'Other'] as const;
const CARD_PLACEMENTS = ['Main Event', 'Co-Main Event', 'Main Card', 'Preliminary'] as const;

interface FightEntry {
  id: string;
  fighter1Id: string;
  fighter2Id: string;
  fighter1Name: string;
  fighter2Name: string;
  cardPlacement: string;
  boutOrder: number;
  weightClass: string;
  isTitleFight: boolean;
  rounds: number;
}

interface EventFormData {
  name: string;
  date: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  organization: string;
  description: string;
}

export const CreateEvent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [eventData, setEventData] = useState<EventFormData>({
    name: '',
    date: '',
    venue: '',
    city: '',
    state: '',
    country: '',
    organization: 'UFC',
    description: '',
  });

  const [fights, setFights] = useState<FightEntry[]>([]);
  const [isAddingFight, setIsAddingFight] = useState(false);
  
  const [selectedFighter1, setSelectedFighter1] = useState('');
  const [selectedFighter2, setSelectedFighter2] = useState('');
  const [newFightPlacement, setNewFightPlacement] = useState('Main Card');
  const [newFightWeightClass, setNewFightWeightClass] = useState('');
  const [newFightTitleFight, setNewFightTitleFight] = useState(false);
  const [newFightRounds, setNewFightRounds] = useState(3);
  
  const [filterOrg, setFilterOrg] = useState('');
  const [filterWeightClass, setFilterWeightClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: fighters = [], isLoading: fightersLoading } = useQuery<Fighter[]>({
    queryKey: ['/api/fighters'],
    queryFn: async () => {
      const response = await fetch('/api/fighters');
      if (!response.ok) throw new Error('Failed to fetch fighters');
      return response.json();
    },
  });

  const filteredFighters = useMemo(() => {
    return fighters.filter(f => {
      if (filterOrg && f.organization !== filterOrg) return false;
      if (filterWeightClass && f.weightClass !== filterWeightClass) return false;
      if (searchQuery) {
        const name = `${f.firstName} ${f.lastName} ${f.nickname || ''}`.toLowerCase();
        if (!name.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [fighters, filterOrg, filterWeightClass, searchQuery]);

  const weightClasses = useMemo(() => {
    const classes = new Set(fighters.map(f => f.weightClass));
    return Array.from(classes).sort();
  }, [fighters]);

  const createEventMutation = useMutation({
    mutationFn: async (data: { event: EventFormData; fights: FightEntry[] }) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data.event,
          fights: data.fights.map(f => ({
            fighter1Id: f.fighter1Id,
            fighter2Id: f.fighter2Id,
            cardPlacement: f.cardPlacement,
            boutOrder: f.boutOrder,
            weightClass: f.weightClass,
            isTitleFight: f.isTitleFight,
            rounds: f.rounds,
          })),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Event Created',
        description: `${eventData.name} has been created successfully with ${fights.length} fights.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setEventData({
        name: '',
        date: '',
        venue: '',
        city: '',
        state: '',
        country: '',
        organization: 'UFC',
        description: '',
      });
      setFights([]);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create event',
        variant: 'destructive',
      });
    },
  });

  const handleAddFight = () => {
    if (!selectedFighter1 || !selectedFighter2) {
      toast({ title: 'Select both fighters', variant: 'destructive' });
      return;
    }
    if (selectedFighter1 === selectedFighter2) {
      toast({ title: 'Fighters must be different', variant: 'destructive' });
      return;
    }
    if (!newFightWeightClass) {
      toast({ title: 'Select weight class', variant: 'destructive' });
      return;
    }

    const fighter1 = fighters.find(f => f.id === selectedFighter1);
    const fighter2 = fighters.find(f => f.id === selectedFighter2);
    if (!fighter1 || !fighter2) return;

    const newFight: FightEntry = {
      id: crypto.randomUUID(),
      fighter1Id: selectedFighter1,
      fighter2Id: selectedFighter2,
      fighter1Name: `${fighter1.firstName} ${fighter1.lastName}`,
      fighter2Name: `${fighter2.firstName} ${fighter2.lastName}`,
      cardPlacement: newFightPlacement,
      boutOrder: fights.length + 1,
      weightClass: newFightWeightClass,
      isTitleFight: newFightTitleFight,
      rounds: newFightRounds,
    };

    setFights([...fights, newFight]);
    setSelectedFighter1('');
    setSelectedFighter2('');
    setNewFightWeightClass('');
    setNewFightTitleFight(false);
    setNewFightRounds(newFightPlacement === 'Main Event' ? 5 : 3);
    setIsAddingFight(false);
  };

  const handleRemoveFight = (fightId: string) => {
    setFights(fights.filter(f => f.id !== fightId));
  };

  const handleSubmit = () => {
    if (!eventData.name || !eventData.date || !eventData.venue || !eventData.city || !eventData.country) {
      toast({ title: 'Fill in all required event fields', variant: 'destructive' });
      return;
    }
    if (fights.length === 0) {
      toast({ title: 'Add at least one fight', variant: 'destructive' });
      return;
    }
    createEventMutation.mutate({ event: eventData, fights });
  };

  const getPlacementColor = (placement: string) => {
    switch (placement) {
      case 'Main Event': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Co-Main Event': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'Main Card': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      case 'Preliminary': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="create-event-page">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-400" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name *</Label>
              <Input
                id="event-name"
                data-testid="input-event-name"
                placeholder="UFC 324: Gaethje vs. Pimblett"
                value={eventData.name}
                onChange={e => setEventData({ ...eventData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date">Event Date *</Label>
              <Input
                id="event-date"
                data-testid="input-event-date"
                type="date"
                value={eventData.date}
                onChange={e => setEventData({ ...eventData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue *</Label>
              <Input
                id="venue"
                data-testid="input-venue"
                placeholder="T-Mobile Arena"
                value={eventData.venue}
                onChange={e => setEventData({ ...eventData, venue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Select
                value={eventData.organization}
                onValueChange={val => setEventData({ ...eventData, organization: val })}
              >
                <SelectTrigger id="organization" data-testid="select-organization">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATIONS.map(org => (
                    <SelectItem key={org} value={org}>{org}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                data-testid="input-city"
                placeholder="Paradise (Las Vegas)"
                value={eventData.city}
                onChange={e => setEventData({ ...eventData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                data-testid="input-state"
                placeholder="Nevada"
                value={eventData.state}
                onChange={e => setEventData({ ...eventData, state: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                data-testid="input-country"
                placeholder="USA"
                value={eventData.country}
                onChange={e => setEventData({ ...eventData, country: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              data-testid="input-description"
              placeholder="Additional event notes..."
              value={eventData.description}
              onChange={e => setEventData({ ...eventData, description: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            Fight Card ({fights.length} fights)
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setIsAddingFight(true)}
            disabled={isAddingFight}
            data-testid="button-add-fight"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Fight
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAddingFight && (
            <Card className="border-cyan-500/30 bg-cyan-500/5">
              <CardContent className="pt-4 space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <Label className="text-sm text-muted-foreground">Filters:</Label>
                  <Select value={filterOrg} onValueChange={val => setFilterOrg(val === '__all__' ? '' : val)}>
                    <SelectTrigger className="w-32" data-testid="select-filter-org">
                      <SelectValue placeholder="Org" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Orgs</SelectItem>
                      {ORGANIZATIONS.map(org => (
                        <SelectItem key={org} value={org}>{org}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterWeightClass} onValueChange={val => setFilterWeightClass(val === '__all__' ? '' : val)}>
                    <SelectTrigger className="w-40" data-testid="select-filter-weight">
                      <SelectValue placeholder="Weight Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Weights</SelectItem>
                      {weightClasses.map(wc => (
                        <SelectItem key={wc} value={wc}>{wc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-48"
                    data-testid="input-fighter-search"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fighter 1 (Red Corner)</Label>
                    <Select value={selectedFighter1} onValueChange={setSelectedFighter1}>
                      <SelectTrigger data-testid="select-fighter1">
                        <SelectValue placeholder="Select fighter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fightersLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : filteredFighters.length === 0 ? (
                          <SelectItem value="none" disabled>No fighters found</SelectItem>
                        ) : (
                          filteredFighters.map(f => (
                            <SelectItem key={f.id} value={f.id} disabled={f.id === selectedFighter2}>
                              {f.firstName} {f.lastName} ({f.weightClass})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fighter 2 (Blue Corner)</Label>
                    <Select value={selectedFighter2} onValueChange={setSelectedFighter2}>
                      <SelectTrigger data-testid="select-fighter2">
                        <SelectValue placeholder="Select fighter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fightersLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : filteredFighters.length === 0 ? (
                          <SelectItem value="none" disabled>No fighters found</SelectItem>
                        ) : (
                          filteredFighters.map(f => (
                            <SelectItem key={f.id} value={f.id} disabled={f.id === selectedFighter1}>
                              {f.firstName} {f.lastName} ({f.weightClass})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Card Placement</Label>
                    <Select 
                      value={newFightPlacement} 
                      onValueChange={val => {
                        setNewFightPlacement(val);
                        if (val === 'Main Event') setNewFightRounds(5);
                      }}
                    >
                      <SelectTrigger data-testid="select-card-placement">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CARD_PLACEMENTS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weight Class</Label>
                    <Select value={newFightWeightClass} onValueChange={setNewFightWeightClass}>
                      <SelectTrigger data-testid="select-weight-class">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {weightClasses.map(wc => (
                          <SelectItem key={wc} value={wc}>{wc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rounds</Label>
                    <Select value={String(newFightRounds)} onValueChange={val => setNewFightRounds(Number(val))}>
                      <SelectTrigger data-testid="select-rounds">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Rounds</SelectItem>
                        <SelectItem value="5">5 Rounds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title Fight</Label>
                    <div className="flex items-center gap-2 h-9">
                      <Switch
                        checked={newFightTitleFight}
                        onCheckedChange={checked => {
                          setNewFightTitleFight(checked);
                          if (checked) setNewFightRounds(5);
                        }}
                        data-testid="switch-title-fight"
                      />
                      {newFightTitleFight && <Trophy className="h-4 w-4 text-yellow-400" />}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddFight} data-testid="button-confirm-fight">
                    Add to Card
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingFight(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {fights.length === 0 && !isAddingFight && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No fights added yet. Click "Add Fight" to build the card.</p>
            </div>
          )}

          <div className="space-y-2">
            {fights.map((fight, index) => (
              <div
                key={fight.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border"
                data-testid={`fight-card-${index}`}
              >
                <div className="flex items-center gap-3">
                  <Badge className={getPlacementColor(fight.cardPlacement)}>
                    {fight.cardPlacement}
                  </Badge>
                  <span className="font-medium">
                    {fight.fighter1Name}
                    <span className="text-muted-foreground mx-2">vs</span>
                    {fight.fighter2Name}
                  </span>
                  <Badge variant="outline">{fight.weightClass}</Badge>
                  {fight.isTitleFight && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                      <Trophy className="h-3 w-3 mr-1" />
                      Title
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">{fight.rounds} Rds</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFight(fight.id)}
                  data-testid={`button-remove-fight-${index}`}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={createEventMutation.isPending || fights.length === 0}
          data-testid="button-create-event"
        >
          {createEventMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <MapPin className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>
    </div>
  );
};

export default CreateEvent;
