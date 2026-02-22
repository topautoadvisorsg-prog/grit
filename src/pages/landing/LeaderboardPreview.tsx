import React from 'react';
import { Trophy, Crown, BarChart3, Shield, TrendingUp, Award } from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';

const LB = [
    { rank: 1, name: 'NightHawk', pts: '12,450', avatar: '🦅', badge: '???', bc: 'lp-lb__badge--goat', rc: 'lp-lb__rank--gold', roi: '+31.2%' },
    { rank: 2, name: 'OctagonKing', pts: '11,200', avatar: '🐺', badge: 'MASTER', bc: 'lp-lb__badge--master', rc: 'lp-lb__rank--silver', roi: '+24.8%' },
    { rank: 3, name: 'MatWarrior', pts: '10,890', avatar: '🦁', badge: '', bc: '', rc: 'lp-lb__rank--bronze', roi: '+19.3%' },
    { rank: 4, name: 'StrikeForce', pts: '9,740', avatar: '👊', badge: '', bc: '', rc: '', roi: '+15.7%' },
    { rank: 5, name: 'GroundGame', pts: '9,350', avatar: '🔥', badge: '', bc: '', rc: '', roi: '+12.1%' },
];

export function LeaderboardPreview() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    return (
        <section className="lp-section lp-competitive" id="competitive" ref={ref}>
            <div className="lp-section__inner">
                <div className="lp-animate">
                    <span className="lp-section-label"><Crown size={14} /> {t('leaderboard.label')}</span>
                    <h2 className="lp-section-title">{t('leaderboard.title')}<br />{t('leaderboard.title2')}</h2>
                </div>
                <div className="lp-competitive__layout">
                    <div className="lp-competitive__text lp-animate lp-animate-delay-1">
                        <h3>{t('leaderboard.subtitle')}</h3>
                        <p>{t('leaderboard.desc')}</p>
                        <div className="lp-competitive__highlights">
                            <div className="lp-highlight"><div className="lp-highlight__icon"><BarChart3 size={20} /></div><span className="lp-highlight__text">{t('leaderboard.highlight1')}</span></div>
                            <div className="lp-highlight"><div className="lp-highlight__icon"><Shield size={20} /></div><span className="lp-highlight__text">{t('leaderboard.highlight2')}</span></div>
                            <div className="lp-highlight"><div className="lp-highlight__icon"><TrendingUp size={20} /></div><span className="lp-highlight__text">{t('leaderboard.highlight3')}</span></div>
                            <div className="lp-highlight"><div className="lp-highlight__icon"><Award size={20} /></div><span className="lp-highlight__text">{t('leaderboard.highlight4')}</span></div>
                        </div>
                    </div>
                    <div className="lp-lb lp-animate lp-animate-delay-3">
                        <div className="lp-lb__header"><Trophy size={16} /> {t('leaderboard.header')} <span className="lp-lb__live">{t('leaderboard.live')}</span></div>
                        {LB.map((e) => (
                            <div key={e.rank} className="lp-lb__row">
                                <span className={`lp-lb__rank ${e.rc}`}>#{e.rank}</span>
                                <div className="lp-lb__avatar">{e.avatar}</div>
                                <span className="lp-lb__name">{e.name}</span>
                                {e.badge && <span className={`lp-lb__badge ${e.bc}`}>{e.badge}</span>}
                                <span className="lp-lb__roi">{e.roi}</span>
                                <span className="lp-lb__pts">{e.pts}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
