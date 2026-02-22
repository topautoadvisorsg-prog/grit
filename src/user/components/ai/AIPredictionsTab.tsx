import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth';
import { PredictionCard } from './PredictionCard';
import {
    Brain,
    Loader2,
    Crown,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Zap,
    Target,
    TrendingUp,
    Shield
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface Fight {
    id: string;
    fighter1: { id: string; firstName: string; lastName: string };
    fighter2: { id: string; firstName: string; lastName: string };
    hasCachedPrediction: boolean;
}

interface Event {
    id: string;
    name: string;
    fights: Fight[];
}

interface Prediction {
    predictedWinner: string;
    confidence: number;
    likelyMethod: string;
    likelyRound: number | null;
    keyFactors: string[];
    upset: boolean;
}

export const AIPredictionsTab: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [expandedFight, setExpandedFight] = useState<string | null>(null);
    const [predictions, setPredictions] = useState<Record<string, Prediction>>({});

    // Check if user is premium
    const isPremium = (user as any)?.tier === 'premium' || (user as any)?.tier === 'admin' || (user as any)?.role === 'admin';

    // Fetch upcoming events with fights
    const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: ['/api/ai/events'],
        enabled: !!user && isPremium,
    });

    // Generate prediction mutation
    const generatePrediction = useMutation({
        mutationFn: async (fightId: string) => {
            const response = await fetch('/api/ai/predict', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fightId,
                    model: 'gpt-4o',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate prediction');
            }

            return response.json();
        },
        onSuccess: (data, fightId) => {
            setPredictions(prev => ({ ...prev, [fightId]: data.prediction }));
            queryClient.invalidateQueries({ queryKey: ['/api/ai/events'] });
        },
    });

    // Mock data if API not ready
    const mockEvents: Event[] = [
        {
            id: 'ufc-312',
            name: 'UFC 312 - Du Plessis vs Strickland 2',
            fights: [
                {
                    id: 'fight-1',
                    fighter1: { id: 'f1', firstName: 'Dricus', lastName: 'Du Plessis' },
                    fighter2: { id: 'f2', firstName: 'Sean', lastName: 'Strickland' },
                    hasCachedPrediction: false,
                },
                {
                    id: 'fight-2',
                    fighter1: { id: 'f3', firstName: 'Lorenz', lastName: 'Larkin' },
                    fighter2: { id: 'f4', firstName: 'Rinat', lastName: 'Fakhretdinov' },
                    hasCachedPrediction: true,
                },
                {
                    id: 'fight-3',
                    fighter1: { id: 'f5', firstName: 'Jimmy', lastName: 'Crute' },
                    fighter2: { id: 'f6', firstName: 'Alonzo', lastName: 'Menifield' },
                    hasCachedPrediction: false,
                },
            ],
        },
    ];

    const displayEvents = events || mockEvents;

    // Premium Gate - Non-premium users
    if (!isPremium) {
        return (
            <div className="space-y-8 animate-fade-in">
                {/* Premium Hero Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 p-8 border border-yellow-500/30">
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent animate-shine" />

                    {/* Floating particles effect */}
                    <div className="absolute top-4 right-8 w-2 h-2 bg-yellow-400/40 rounded-full animate-pulse" />
                    <div className="absolute top-12 right-24 w-1.5 h-1.5 bg-amber-400/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute bottom-8 right-16 w-2 h-2 bg-orange-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

                    <div className="relative text-center">
                        {/* Crown Icon with Glow */}
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-600/30 mb-6 shadow-lg shadow-yellow-500/20">
                            <Crown className="w-10 h-10 text-yellow-400" />
                        </div>

                        <h1 className="text-4xl font-display tracking-wide text-foreground uppercase mb-2">
                            <span className="text-gradient-brand">AI Predictions</span>
                        </h1>
                        <p className="text-lg text-yellow-200/80 mb-2">Powered by GPT-4o</p>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Get AI-powered fight analysis with confidence scores, method predictions, and key factors.
                        </p>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { icon: Brain, label: 'AI Analysis', description: 'Deep fighter stats & history analysis' },
                        { icon: Target, label: 'Confidence Scores', description: 'Probability-based predictions' },
                        { icon: Zap, label: 'Upset Alerts', description: 'Identify underdog opportunities' },
                        { icon: TrendingUp, label: 'Method Predictions', description: 'KO, Submission, or Decision' },
                    ].map((feature, idx) => (
                        <div
                            key={feature.label}
                            className={cn(
                                "p-5 rounded-xl border border-yellow-500/20 bg-card/50 backdrop-blur-sm",
                                "hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all duration-300",
                                "animate-slide-up"
                            )}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-lg bg-yellow-500/10">
                                    <feature.icon className="w-5 h-5 text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground mb-1">{feature.label}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Upgrade CTA */}
                <div className="text-center">
                    <Button
                        size="lg"
                        className={cn(
                            "bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500",
                            "hover:from-yellow-400 hover:via-amber-400 hover:to-orange-400",
                            "text-black font-bold px-8 py-6 text-lg",
                            "shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50",
                            "transition-all duration-300 hover:scale-105"
                        )}
                    >
                        <Crown className="w-5 h-5 mr-2" />
                        Upgrade to Premium
                        <Sparkles className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-sm text-muted-foreground mt-3">
                        Join 500+ premium members with 73% pick accuracy
                    </p>
                </div>
            </div>
        );
    }

    // Loading State
    if (eventsLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <Brain className="w-16 h-16 text-primary animate-pulse relative" />
                </div>
                <p className="text-muted-foreground mt-4">Loading AI predictions...</p>
                <Loader2 className="h-6 w-6 animate-spin text-primary mt-2" />
            </div>
        );
    }

    // Premium User View
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-cyan-500/10 p-6 border border-primary/30">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shine" />

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                            <Brain className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display tracking-wide text-foreground uppercase">
                                AI Predictions
                            </h1>
                            <p className="text-sm text-muted-foreground">Powered by GPT-4o • Premium Active</p>
                        </div>
                    </div>

                    {/* Premium Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-bold text-yellow-400">PREMIUM</span>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                    <p className="text-2xl font-bold text-primary">73%</p>
                    <p className="text-xs text-muted-foreground">AI Accuracy</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                    <p className="text-2xl font-bold text-green-400">{displayEvents.reduce((a, e) => a + e.fights.length, 0)}</p>
                    <p className="text-xs text-muted-foreground">Fights Available</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                    <p className="text-2xl font-bold text-yellow-400">{Object.keys(predictions).length}</p>
                    <p className="text-xs text-muted-foreground">Generated</p>
                </div>
            </div>

            {/* Events List */}
            <div className="space-y-6">
                {displayEvents.map((event) => (
                    <div
                        key={event.id}
                        className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
                    >
                        {/* Event Header */}
                        <div className="p-4 bg-gradient-to-r from-primary/10 to-transparent border-b border-border">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-primary" />
                                <h2 className="font-bold text-lg text-foreground">{event.name}</h2>
                                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                                    {event.fights.length} fights
                                </span>
                            </div>
                        </div>

                        {/* Fights List */}
                        <div className="divide-y divide-border">
                            {event.fights.map((fight) => (
                                <div key={fight.id} className="transition-colors hover:bg-muted/30">
                                    {/* Fight Header */}
                                    <button
                                        onClick={() => setExpandedFight(expandedFight === fight.id ? null : fight.id)}
                                        className="w-full p-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-foreground text-lg">
                                                    {fight.fighter1.lastName}
                                                </span>
                                                <span className="text-muted-foreground text-sm">vs</span>
                                                <span className="font-bold text-foreground text-lg">
                                                    {fight.fighter2.lastName}
                                                </span>
                                            </div>

                                            {/* Status Tags */}
                                            <div className="flex items-center gap-2">
                                                {fight.hasCachedPrediction && (
                                                    <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                                        <Zap className="w-3 h-3 inline mr-1" />
                                                        Ready
                                                    </span>
                                                )}
                                                {predictions[fight.id] && (
                                                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                                                        <Brain className="w-3 h-3 inline mr-1" />
                                                        Analyzed
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "p-2 rounded-lg transition-all",
                                            expandedFight === fight.id ? "bg-primary/20 rotate-180" : "bg-muted"
                                        )}>
                                            <ChevronDown className="w-5 h-5 text-foreground" />
                                        </div>
                                    </button>

                                    {/* Expanded Prediction */}
                                    {expandedFight === fight.id && (
                                        <div className="p-4 pt-0 animate-slide-up">
                                            <PredictionCard
                                                fighter1Name={`${fight.fighter1.firstName} ${fight.fighter1.lastName}`}
                                                fighter2Name={`${fight.fighter2.firstName} ${fight.fighter2.lastName}`}
                                                prediction={predictions[fight.id] || null}
                                                isLoading={generatePrediction.isPending && generatePrediction.variables === fight.id}
                                                onGenerate={() => generatePrediction.mutate(fight.id)}
                                                isPremium={true}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {displayEvents.length === 0 && (
                <div className="text-center py-16">
                    <Brain className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">No Upcoming Events</h3>
                    <p className="text-muted-foreground">Check back soon for new fight predictions</p>
                </div>
            )}
        </div>
    );
};
