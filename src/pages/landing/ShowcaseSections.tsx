import React from 'react';
import {
    Users, TrendingUp, BarChart3, Star, Shield,
    Sparkles, Crown, Globe, Flame, Award,
    Crosshair, LineChart, MessageSquare,
} from 'lucide-react';
import { useScrollAnimation, use3DTilt } from './hooks';
import { useTranslation } from 'react-i18next';

export function ShowcaseAI() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    const tilt = use3DTilt();

    return (
        <section className="lp-showcase" id="features" ref={ref}>
            <div className="lp-showcase__inner">
                <div className="lp-showcase__text lp-animate">
                    <span className="lp-section-label"><Sparkles size={14} /> {t('showcase_ai.label')}</span>
                    <h3>{t('showcase_ai.title')}</h3>
                    <p>{t('showcase_ai.desc')}</p>
                    <div className="lp-showcase__features">
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--cyan"><MessageSquare size={15} /></div> {t('showcase_ai.feat1')}</div>
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--red"><TrendingUp size={15} /></div> {t('showcase_ai.feat2')}</div>
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--gold"><Sparkles size={15} /></div> {t('showcase_ai.feat3')}</div>
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--green"><Shield size={15} /></div> {t('showcase_ai.feat4')}</div>
                    </div>
                </div>
                <div className="lp-showcase__visual lp-animate lp-animate-delay-2" ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}>
                    <div className="lp-app-mock">
                        <div className="lp-app-mock__bar">
                            <div className="lp-app-mock__dot lp-app-mock__dot--red" />
                            <div className="lp-app-mock__dot lp-app-mock__dot--yellow" />
                            <div className="lp-app-mock__dot lp-app-mock__dot--green" />
                            <div style={{ marginLeft: 12, fontSize: '.75rem', fontFamily: 'Inter', color: 'hsl(210 20% 50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Sparkles size={10} /> Grok Analysis
                            </div>
                        </div>
                        <div className="lp-app-mock__content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ alignSelf: 'flex-end', background: 'hsl(210 25% 18%)', padding: '10px 16px', borderRadius: '14px 14px 2px 14px', maxWidth: '85%' }}>
                                <div style={{ fontSize: '.65rem', color: 'hsl(210 20% 50%)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>You</div>
                                <div style={{ fontSize: '.9rem', color: 'var(--text-primary)' }}>How does Makhachev's grappling compare to Oliveira's for this matchup?</div>
                            </div>
                            <div style={{ alignSelf: 'flex-start', background: 'hsl(190 90% 50% / .1)', border: '1px solid hsl(190 90% 50% / .15)', padding: '16px', borderRadius: '14px 14px 14px 2px', maxWidth: '92%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: 6, background: 'hsl(190 90% 50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={12} color="#000" /></div>
                                    <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--cyan)' }}>Grok</div>
                                </div>
                                <div style={{ fontSize: '.9rem', color: 'hsl(210 20% 85%)', lineHeight: 1.6 }}>
                                    Makhachev averages <strong>3.4 takedowns/15min</strong> with 62% accuracy, focusing on top control and positional dominance. Oliveira's grappling is more offensive off his back (submissions), but Makhachev's <strong>91% takedown defense</strong> suggests he dictates where this fight goes.
                                </div>
                                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                    <div style={{ padding: '4px 10px', borderRadius: 6, background: 'hsl(var(--bg-dark))', fontSize: '.7rem', color: 'var(--cyan)', border: '1px solid hsl(190 90% 50% / .2)' }}>#GrapplingEdge</div>
                                    <div style={{ padding: '4px 10px', borderRadius: 6, background: 'hsl(var(--bg-dark))', fontSize: '.7rem', color: 'var(--cyan)', border: '1px solid hsl(190 90% 50% / .2)' }}>#ControlTime</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function ShowcaseFighters() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    const tilt = use3DTilt();
    return (
        <section className="lp-showcase lp-showcase--reverse" ref={ref}>
            <div className="lp-showcase__inner">
                <div className="lp-showcase__text lp-animate">
                    <span className="lp-section-label"><Crosshair size={14} /> {t('showcase_fighters.label')}</span>
                    <h3>{t('showcase_fighters.title')}</h3>
                    <p>{t('showcase_fighters.desc')}</p>
                    <div className="lp-showcase__features">
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--cyan"><Users size={15} /></div> {t('showcase_fighters.feat1')}</div>
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--red"><Flame size={15} /></div> {t('showcase_fighters.feat2')}</div>
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--gold"><BarChart3 size={15} /></div> {t('showcase_fighters.feat3')}</div>
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--purple"><LineChart size={15} /></div> {t('showcase_fighters.feat4')}</div>
                    </div>
                </div>
                <div className="lp-showcase__visual lp-animate lp-animate-delay-2" ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}>
                    <div className="lp-app-mock__bar">
                        <div className="lp-app-mock__dot lp-app-mock__dot--red" />
                        <div className="lp-app-mock__dot lp-app-mock__dot--yellow" />
                        <div className="lp-app-mock__dot lp-app-mock__dot--green" />
                    </div>
                    <div className="lp-app-mock__content">
                        <div className="lp-mock-fighter">
                            <div className="lp-mock-fighter__avatar">AV</div>
                            <div className="lp-mock-fighter__info">
                                <div className="lp-mock-fighter__name">Alex Volkanovski</div>
                                <div className="lp-mock-fighter__record">26-4-0 • Featherweight</div>
                                <div className="lp-mock-fighter__tags">
                                    <span className="lp-mock-fighter__tag lp-mock-fighter__tag--striker">Elite Striker</span>
                                    <span className="lp-mock-fighter__tag lp-mock-fighter__tag--ko">13 KOs</span>
                                    <span className="lp-mock-fighter__tag lp-mock-fighter__tag--champ">Former Champ</span>
                                </div>
                                <div className="lp-mock-stat">
                                    <div className="lp-mock-stat__label"><span>Striking</span><span>94%</span></div>
                                    <div className="lp-mock-stat__bar"><div className="lp-mock-stat__fill lp-mock-stat__fill--red" style={{ width: '94%' }} /></div>
                                </div>
                                <div className="lp-mock-stat">
                                    <div className="lp-mock-stat__label"><span>Cardio</span><span>97%</span></div>
                                    <div className="lp-mock-stat__bar"><div className="lp-mock-stat__fill lp-mock-stat__fill--cyan" style={{ width: '97%' }} /></div>
                                </div>
                                <div className="lp-mock-stat">
                                    <div className="lp-mock-stat__label"><span>Takedown Def.</span><span>88%</span></div>
                                    <div className="lp-mock-stat__bar"><div className="lp-mock-stat__fill lp-mock-stat__fill--gold" style={{ width: '88%' }} /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function ShowcaseRankings() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    const tilt = use3DTilt();
    return (
        <section className="lp-showcase" ref={ref}>
            <div className="lp-showcase__inner">
                <div className="lp-showcase__text lp-animate">
                    <span className="lp-section-label"><Crown size={14} /> {t('showcase_rankings.label')}</span>
                    <h3>{t('showcase_rankings.title')}</h3>
                    <p>{t('showcase_rankings.desc')}</p>
                    <div className="lp-showcase__features">
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--gold"><Star size={15} /></div> {t('showcase_rankings.feat1')}</div>
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--purple"><Award size={15} /></div> {t('showcase_rankings.feat2')}</div>
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--green"><TrendingUp size={15} /></div> {t('showcase_rankings.feat3')}</div>
                        <div className="lp-showcase__feat"><div className="lp-showcase__feat-icon lp-showcase__feat-icon--cyan"><Globe size={15} /></div> {t('showcase_rankings.feat4')}</div>
                    </div>
                </div>
                <div className="lp-showcase__visual lp-animate lp-animate-delay-2" ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}>
                    <div className="lp-app-mock__bar">
                        <div className="lp-app-mock__dot lp-app-mock__dot--red" />
                        <div className="lp-app-mock__dot lp-app-mock__dot--yellow" />
                        <div className="lp-app-mock__dot lp-app-mock__dot--green" />
                    </div>
                    <div className="lp-app-mock__content" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 20 }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'hsl(210 20% 50%)', marginBottom: 4 }}>Badge Progression</div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            {[
                                { name: 'NINJA', color: 'hsl(210 20% 55%)', bg: 'hsl(210 25% 14%)', stars: 1 },
                                { name: 'SAMURAI', color: 'hsl(190 90% 55%)', bg: 'hsl(190 90% 50% / .1)', stars: 2 },
                                { name: 'MASTER', color: 'hsl(280 80% 65%)', bg: 'hsl(280 80% 55% / .1)', stars: 4 },
                                { name: '???', color: 'hsl(45 90% 60%)', bg: 'hsl(45 90% 55% / .12)', stars: 5 },
                            ].map((b) => (
                                <div key={b.name} style={{ textAlign: 'center' as const, padding: '16px 14px', borderRadius: 14, background: b.bg, border: `1px solid ${b.color}30`, flex: 1 }}>
                                    <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{b.name === '???' ? '❓' : b.name === 'MASTER' ? '👑' : b.name === 'SAMURAI' ? '⚔️' : '🥷'}</div>
                                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '.9rem', letterSpacing: '.06em', color: b.color, marginBottom: 4 }}>{b.name}</div>
                                    <div style={{ fontSize: '.65rem', color: 'hsl(210 20% 45%)' }}>{'★'.repeat(b.stars)}{'☆'.repeat(5 - b.stars)}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'hsl(210 20% 50%)', marginTop: 8 }}>Your Stars This Month</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'hsl(45 90% 55% / .06)', padding: '10px 16px', borderRadius: 10, border: '1px solid hsl(45 90% 55% / .12)' }}>
                            <span style={{ color: 'hsl(45 90% 60%)', fontSize: '1.2rem', letterSpacing: 2 }}>★★★☆☆</span>
                            <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: '.75rem', color: 'hsl(45 90% 60%)' }}>3/5 Stars</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
