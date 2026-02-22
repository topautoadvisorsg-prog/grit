import React from 'react';
import { useAuth } from '@/shared/hooks/use-auth';
import './LandingPage.css';

import { Navbar } from './landing/Navbar';
import { HeroSection } from './landing/HeroSection';
import { AICompetitionSection } from './landing/AICompetitionSection';
import { SocialProofStrip } from './landing/SocialProofStrip';
import { IntroSection } from './landing/IntroSection';
import { ShowcaseAI, ShowcaseFighters, ShowcaseRankings } from './landing/ShowcaseSections';
import { Tier2Features } from './landing/Tier2Features';
import { HowItWorks } from './landing/HowItWorks';
import { LeaderboardPreview } from './landing/LeaderboardPreview';
import { PricingSection } from './landing/PricingSection';
import { FooterCTA } from './landing/FooterCTA';

export default function LandingPage() {
    const { login } = useAuth();
    const handleSignIn = () => login();

    return (
        <div className="landing-page">
            <Navbar onSignIn={handleSignIn} />
            <HeroSection onSignIn={handleSignIn} />
            <AICompetitionSection />
            <SocialProofStrip />
            <IntroSection />
            <ShowcaseAI />
            <ShowcaseFighters />
            <ShowcaseRankings />
            <Tier2Features />
            <HowItWorks />
            <LeaderboardPreview />
            <PricingSection onSignIn={handleSignIn} />
            <FooterCTA onSignIn={handleSignIn} />
        </div>
    );
}
