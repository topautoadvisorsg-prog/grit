import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth';
import { StatsWidget } from './widgets/StatsWidget';
import { CountdownWidget } from './widgets/CountdownWidget';
import { BadgeWidget } from './widgets/BadgeWidget';
import { ActivityWidget } from './widgets/ActivityWidget';
import { generateMockActivities } from './ActivityFeed';
import { Trophy, Loader2 } from 'lucide-react';

interface DashboardData {
    rank: number;
    rankChange: number;
    totalPoints: number;
    currentStreak: number;
    streakType: 'pick' | 'login' | 'event';
    accuracy: number;
    totalPicks: number;
    nextBadge: {
        name: string;
        progress: number;
        icon?: string;
    } | null;
    upcomingEvent: {
        id: string;
        name: string;
        date: string;
        picksComplete: number;
        totalFights: number;
    } | null;
}

export const Dashboard: React.FC = () => {
    const { user } = useAuth();

    const { data, isLoading } = useQuery<DashboardData>({
        queryKey: ['/api/me/dashboard'],
        enabled: !!user,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Trophy className="h-12 w-12 text-muted-foreground/40" />
                <h2 className="text-lg font-bold text-foreground">No Data Yet</h2>
                <p className="text-sm text-muted-foreground">Make your first prediction to see your stats here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy className="h-8 w-8 text-yellow-400" />
                    <h1 className="text-3xl font-display tracking-wide text-foreground uppercase">
                        Dashboard
                    </h1>
                    <Trophy className="h-8 w-8 text-yellow-400" />
                </div>
                <p className="text-muted-foreground">Your fantasy MMA journey at a glance</p>
            </div>

            <StatsWidget data={data} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <CountdownWidget upcomingEvent={data.upcomingEvent} />
                    <BadgeWidget nextBadge={data.nextBadge} />
                </div>

                <ActivityWidget activities={generateMockActivities()} />
            </div>

            <div className="text-center text-sm text-muted-foreground">
                <p>Keep making picks to climb the leaderboard and earn badges!</p>
            </div>
        </div>
    );
};
