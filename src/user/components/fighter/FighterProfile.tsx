import React from 'react';
import { Fighter } from '@/shared/types/fighter';
import { FighterIdentityBlock } from './FighterIdentityBlock';
import { FighterStatsGrid } from './FighterStatsGrid';
import { FightHistoryLedger } from './FightHistoryLedger';
import { PerformanceMetrics } from './PerformanceMetrics';
import { BettingOdds } from './BettingOdds';
import { ProfileStatus } from './ProfileStatus';
import { FighterNotes } from './FighterNotes';
import { RiskSignals } from './RiskSignals';
import { FighterTagsSection } from '@/user/components/tags/FighterTagsSection';
import { FighterArticles } from '@/user/components/fighters/FighterArticles';
import { ShieldCheck, Twitter, Instagram, Globe, UserCog, Swords } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { SkillRadarChart } from '@/user/components/fightdetail/SkillRadarChart';
import { OutcomeBarChart } from '@/user/components/fightdetail/OutcomeBarChart';

// --- VISUAL VERIFICATION: STUBS REMOVED ---
// All data now flows strictly from the 'fighter' prop.
// -------------------------------------
// -------------------------------------

interface FighterProfileProps {
  fighter: Fighter;
}

/**
 * FighterProfile - Source of Truth
 * 
 * This is the primary data authority in the system. All future modules
 * (Event, Fight Card, Picks, Analytics, Import/Export) read from this profile.
 * 
 * Layout Structure (Redesigned):
 * - TOP ROW: Identity Image (left) + Header/Quick Stats (right)
 * - MIDDLE ROW: Bio Info + Physical Stats + Performance Metrics (balanced 2-column)
 * - BOTTOM: Fight History (full width)
 * 
 * Empty State Handling:
 * - All blocks render cleanly when data is missing
 * - Blocks hide gracefully when appropriate
 * - No layout breaks with empty data
 */
export const FighterProfile: React.FC<FighterProfileProps> = ({ fighter }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* TOP ROW: Identity + Header Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left - Fighter Image */}
        <div className="lg:col-span-4">
          <FighterIdentityBlock fighter={fighter} />
        </div>

        {/* Right - Header Info + Quick Stats */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Header Info Card */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-end mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="section-header">Fighter Identity</h4>
                  {fighter.isVerified && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded-full">
                      <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs font-medium text-green-500">Verified</span>
                    </div>
                  )}
                  {/* Social Media Links */}
                  <div className="flex items-center gap-2 ml-4">
                    {fighter.socialMedia?.twitter && (
                      <a href={`https://twitter.com/${fighter.socialMedia.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#1DA1F2] transition-colors"><Twitter size={14} /></a>
                    )}
                    {fighter.socialMedia?.instagram && (
                      <a href={`https://instagram.com/${fighter.socialMedia.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#E1306C] transition-colors"><Instagram size={14} /></a>
                    )}
                    {fighter.socialMedia?.website && (
                      <a href={fighter.socialMedia.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Globe size={14} /></a>
                    )}
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-display tracking-wide text-foreground uppercase">
                  {fighter.firstName} {fighter.lastName}
                </h1>
                {fighter.nickname && (
                  <p className="text-lg text-muted-foreground font-mono mt-1">
                    "{fighter.nickname}"
                  </p>
                )}
              </div>

              {/* Quick Record */}
              <div className="flex gap-4 mt-4 md:mt-0">
                <div className="stat-card flex items-center gap-3">
                  <span className="text-2xl font-bold font-mono tracking-widest text-foreground">
                    {fighter.record.wins}-{fighter.record.losses}-{fighter.record.draws}
                  </span>
                  <div className="h-8 w-px bg-border" />
                  <span className="text-xs text-muted-foreground leading-tight">
                    {fighter.performance.ko_wins + fighter.performance.tko_wins} KO/TKO
                    <br />
                    {fighter.performance.submission_wins} SUB
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4 border-t border-border/50">
              <div>
                <span className="data-label block">Weight Class</span>
                <span className="font-medium text-foreground">{fighter.weightClass}</span>
              </div>
              <div>
                <span className="data-label block">Stance</span>
                <span className="font-medium text-foreground">{fighter.stance}</span>
              </div>
              <div>
                <span className="data-label block">Organization</span>
                <span className="font-medium text-foreground">{fighter.organization}</span>
              </div>
              <div>
                <span className="data-label block">Status</span>
                <span className="font-medium text-foreground">
                  {fighter.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {fighter.fightingOutOf && (
                <div>
                  <span className="data-label block">Fighting Out Of</span>
                  <span className="font-medium text-foreground">{fighter.fightingOutOf}</span>
                </div>
              )}
              {fighter.rankGlobal != null && fighter.rankGlobal > 0 && (
                <div>
                  <span className="data-label block">Global Ranking</span>
                  <span className="font-medium text-foreground">#{fighter.rankGlobal}</span>
                </div>
              )}
              {fighter.rankPromotion != null && fighter.rankPromotion > 0 && (
                <div>
                  <span className="data-label block">Promotion Ranking</span>
                  <span className="font-medium text-foreground">#{fighter.rankPromotion}</span>
                </div>
              )}
            </div>
            {/* Bio Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-xs text-muted-foreground block">Head Coach</span>
                  <span className="text-sm font-medium">{fighter.headCoach || 'Unknown'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-xs text-muted-foreground block">Style</span>
                  <span className="text-sm font-medium">{fighter.style || 'MMA'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio + Physical Stats (filling the right side) */}
          <FighterStatsGrid fighter={fighter} />
        </div>
      </div>

      {/* MIDDLE ROW: Performance + Betting/Risk/Notes (Balanced 2-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Performance */}
        <div className="flex flex-col gap-6">
          <PerformanceMetrics fighter={fighter} />

          {/* VISUAL VERIFICATION: REAL DATA CONNECTED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkillRadarChart
              fighter={fighter}
              corner="blue"
            />
            <OutcomeBarChart
              fighter={fighter}
              corner="blue"
            />
          </div>

          <ProfileStatus fighter={fighter} />
        </div>

        {/* Right Column - Betting & Signals + Scouting Tags */}
        <div className="flex flex-col gap-6">
          <BettingOdds odds={fighter.odds} />
          {/* Scouting Report (Tags) */}
          <div className="glass-card rounded-xl p-6">
            <FighterTagsSection fighterId={fighter.id} />
          </div>
          <RiskSignals signals={fighter.riskSignals} />
          <FighterNotes notes={fighter.notes} />
          <FighterArticles fighterId={fighter.id} fighterName={`${fighter.firstName} ${fighter.lastName}`} />
        </div>
      </div>

      {/* BOTTOM: Fight History (Full Width) */}
      <div className="w-full">
        <FightHistoryLedger
          fights={fighter.history}
          hasPendingFight={false}
        />
      </div>

      {/* Footer: Reporting */}
      <div className="flex justify-center pt-8 pb-4 border-t border-border/50">
        <button
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => window.alert("Reporting feature coming soon! For now, please contact support via the Info tab.")}
        >
          <ShieldCheck className="h-4 w-4" />
          Report incorrect info about {fighter.lastName}
        </button>
      </div>
    </div>
  );
};

