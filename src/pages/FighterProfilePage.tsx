import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFighters } from '@/shared/hooks/useFighters';
import { FighterProfile } from '@/user/components/fighter/FighterProfile';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import SEO from '@/shared/components/SEO';
import { generateFighterSchema, injectJSONLD } from '@/shared/utils/SEOHelper';
import { useEffect } from 'react';

const FighterProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fighterMap, isLoaded } = useFighters();

    const fighter = id ? fighterMap.get(id) : undefined;

    useEffect(() => {
        if (fighter) {
            const schema = generateFighterSchema(fighter);
            injectJSONLD(schema);
        }
    }, [fighter]);

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <span className="ml-2 text-muted-foreground">Loading profile...</span>
            </div>
        );
    }

    if (!fighter) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Fighter Not Found</h3>
                <p className="text-zinc-400 mb-6">We couldn't find the fighter you're looking for.</p>
                <Button onClick={() => navigate('/fighter/index')}>
                    Back to Fighter Index
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SEO
                title={`${fighter.firstName} "${fighter.nickname}" ${fighter.lastName}`}
                description={`View MMA statistics, performance metrics, and fight history for ${fighter.firstName} ${fighter.lastName} on GRIT.`}
                keywords={`${fighter.firstName} ${fighter.lastName}, MMA stats, fighter record, ${fighter.weightClass}, ${fighter.style}`}
            />
            <Button
                variant="ghost"
                onClick={() => navigate('/fighter/index')}
                className="gap-2 text-zinc-400 hover:text-white"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Fighter Index
            </Button>
            <FighterProfile fighter={fighter} />
        </div>
    );
};

export default FighterProfilePage;
