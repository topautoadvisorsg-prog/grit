import React from 'react';
import { Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import { Target, Swords, Award, Lock, CheckCircle2, Hand, Clock, Coins } from 'lucide-react';
import { useGamificationActions } from '@/shared/hooks/use-gamification-actions';

interface FantasyPickSectionProps {
  fighter1: Fighter;
  fighter2: Fighter;
  selectedFighter: string | null;
  selectedMethod: string | null;
  selectedRound: number | null;
  onSelectMethod: (method: string) => void;
  onSelectRound: (round: number) => void;
  isLocked: boolean;
  onLock: () => void;
  totalRounds: number;
  units: number;
  onSelectUnits: (units: number) => void;
}

const METHODS = [
  { id: 'ko', label: 'KO/TKO', icon: Swords, description: 'Knockout or Technical Knockout' },
  { id: 'sub', label: 'Submission', icon: Hand, description: 'Tap out or verbal submission' },
  { id: 'dec', label: 'Decision', icon: Award, description: 'Goes to the judges scorecards' },
];

export const FantasyPickSection: React.FC<FantasyPickSectionProps> = ({
  fighter1,
  fighter2,
  selectedFighter,
  selectedMethod,
  selectedRound,
  onSelectMethod,
  onSelectRound,
  isLocked,
  onLock,
  totalRounds,
  units,
  onSelectUnits,
}) => {
  const { celebratePickLock, click, impact, chime, confirm } = useGamificationActions();

  const selectedFighterData = selectedFighter === fighter1.id ? fighter1 : selectedFighter === fighter2.id ? fighter2 : null;
  const isFinishMethod = selectedMethod === 'ko' || selectedMethod === 'sub';
  const canLock = selectedFighter && selectedMethod && (isFinishMethod ? selectedRound !== null : true);
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  // Handle lock with celebration
  const handleLock = () => {
    onLock();
    celebratePickLock();
  };

  // Handle method selection with sound
  const handleMethodSelect = (method: string) => {
    switch (method) {
      case 'ko':
        impact();
        break;
      case 'sub':
        chime();
        break;
      case 'dec':
        confirm();
        break;
      default:
        click();
    }
    onSelectMethod(method);
  };

  // Handle round selection with sound
  const handleRoundSelect = (round: number) => {
    click();
    onSelectRound(round);
  };

  return (
    <section className={cn(
      "relative rounded-2xl p-6 overflow-hidden",
      "bg-gradient-to-br from-card via-card to-primary/5",
      "border-2",
      isLocked ? "border-win/50" : "border-primary/30"
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isLocked ? "bg-win/20" : "bg-primary/20"
            )}>
              {isLocked ? (
                <Lock className="w-5 h-5 text-win" />
              ) : (
                <Target className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Make Your Prediction</h3>
              <p className="text-xs text-muted-foreground">Pick a fighter and method to win</p>
            </div>
          </div>

          {isLocked && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-win/20 border border-win/40">
              <CheckCircle2 className="w-4 h-4 text-win" />
              <span className="text-xs font-bold text-win uppercase tracking-wider">Locked In</span>
            </div>
          )}
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Step 1: Pick Fighter */}
          <div className={cn(
            "relative rounded-xl p-4 border-2 transition-all",
            selectedFighter ? "border-win/50 bg-win/5" : "border-border/50 bg-muted/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                selectedFighter ? "bg-win text-win-foreground" : "bg-muted text-muted-foreground"
              )}>
                {selectedFighter ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pick Fighter</span>
            </div>
            {selectedFighterData ? (
              <div className="flex items-center gap-2">
                <img
                  src={selectedFighterData.imageUrl}
                  alt={selectedFighterData.lastName}
                  className="w-10 h-10 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/40x40/1a1a2e/00d4ff?text=${selectedFighterData.firstName[0]}`;
                  }}
                />
                <span className="font-bold text-foreground">{selectedFighterData.lastName}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click a fighter card above</p>
            )}
          </div>

          {/* Step 2: Select Method */}
          <div className={cn(
            "relative rounded-xl p-4 border-2 transition-all",
            selectedMethod ? "border-win/50 bg-win/5" : "border-border/50 bg-muted/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                selectedMethod ? "bg-win text-win-foreground" : "bg-muted text-muted-foreground"
              )}>
                {selectedMethod ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Method</span>
            </div>
            {selectedMethod ? (
              <span className="font-bold text-foreground capitalize">
                {METHODS.find(m => m.id === selectedMethod)?.label}
              </span>
            ) : (
              <p className="text-sm text-muted-foreground">Choose how they win</p>
            )}
          </div>

          {/* Step 3: Lock It In */}
          <div className={cn(
            "relative rounded-xl p-4 border-2 transition-all",
            isLocked ? "border-win/50 bg-win/5" : "border-border/50 bg-muted/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                isLocked ? "bg-win text-win-foreground" : "bg-muted text-muted-foreground"
              )}>
                {isLocked ? <CheckCircle2 className="w-4 h-4" /> : '3'}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lock It In</span>
            </div>
            {isLocked ? (
              <span className="font-bold text-win">Prediction Saved!</span>
            ) : (
              <p className="text-sm text-muted-foreground">Confirm your pick</p>
            )}
          </div>
        </div>

        {/* Method Selection */}
        {!isLocked && (
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              How will {selectedFighterData?.lastName || 'your pick'} win?
            </span>
            <div className="grid grid-cols-3 gap-3">
              {METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  disabled={!selectedFighter}
                  className={cn(
                    "group relative p-4 rounded-xl border-2 transition-all duration-200",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    selectedMethod === method.id
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                      : "border-border/50 bg-muted/20 hover:border-primary/40",
                    !selectedFighter && "opacity-50 cursor-not-allowed hover:scale-100"
                  )}
                >
                  <method.icon className={cn(
                    "w-6 h-6 mx-auto mb-2 transition-colors",
                    selectedMethod === method.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <span className={cn(
                    "block text-sm font-bold",
                    selectedMethod === method.id ? "text-primary" : "text-foreground"
                  )}>
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Round Selection (only for finish methods) */}
        {!isLocked && isFinishMethod && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                In which round?
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {rounds.map((round) => (
                <button
                  key={round}
                  onClick={() => handleRoundSelect(round)}
                  className={cn(
                    "w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all duration-200",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    selectedRound === round
                      ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10"
                      : "border-border/50 bg-muted/20 text-foreground hover:border-primary/40"
                  )}
                >
                  {round}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Units Selection */}
        {!isLocked && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                How many units?
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((u) => (
                <button
                  key={u}
                  onClick={() => { click(); onSelectUnits(u); }}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 font-bold text-lg transition-all duration-200",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    units === u
                      ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10"
                      : "border-border/50 bg-muted/20 text-foreground hover:border-primary/40"
                  )}
                >
                  {u}u
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lock Button */}
        {!isLocked && (
          <button
            onClick={handleLock}
            disabled={!canLock}
            className={cn(
              "w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all duration-200",
              "flex items-center justify-center gap-2",
              canLock
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.01]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Lock className="w-5 h-5" />
            Lock In Prediction
          </button>
        )}

        {/* Locked State Summary */}
        {isLocked && selectedFighterData && (
          <div className="mt-6 p-4 rounded-xl bg-win/10 border border-win/30">
            <div className="flex items-center justify-center gap-4">
              <img
                src={selectedFighterData.imageUrl}
                alt={selectedFighterData.lastName}
                className="w-12 h-12 rounded-xl object-cover border-2 border-win/50"
                onError={(e) => {
                  e.currentTarget.src = `https://via.placeholder.com/48x48/1a1a2e/00d4ff?text=${selectedFighterData.firstName[0]}`;
                }}
              />
              <div className="text-center">
                <p className="text-lg font-bold text-win">
                  {selectedFighterData.lastName} by {METHODS.find(m => m.id === selectedMethod)?.label}
                  {selectedRound && ` (Round ${selectedRound})`}
                  {` • ${units}u`}
                </p>
                <p className="text-xs text-muted-foreground">Your prediction has been saved</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
