import React from 'react';
import { Sparkles } from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';

export function IntroSection() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    return (
        <section className="lp-section lp-intro" id="intro" ref={ref}>
            <div className="lp-section__inner">
                <div className="lp-intro__layout">
                    <div className="lp-intro__text lp-animate">
                        <span className="lp-section-label"><Sparkles size={14} /> {t('intro.label')}</span>
                        <h3>{t('intro.title')}</h3>
                        <p>{t('intro.desc')}</p>
                        <div className="lp-intro__pills">
                            <span className="lp-intro__pill">🧠 {t('intro.pill_ai')}</span>
                            <span className="lp-intro__pill">🏆 {t('intro.pill_rankings')}</span>
                            <span className="lp-intro__pill">📊 {t('intro.pill_data')}</span>
                            <span className="lp-intro__pill">⭐ {t('intro.pill_progression')}</span>
                            <span className="lp-intro__pill">🌍 {t('intro.pill_country')}</span>
                        </div>
                    </div>
                    <div className="lp-app-mock lp-animate lp-animate-delay-2">
                        <div className="lp-app-mock__bar">
                            <div className="lp-app-mock__dot lp-app-mock__dot--red" />
                            <div className="lp-app-mock__dot lp-app-mock__dot--yellow" />
                            <div className="lp-app-mock__dot lp-app-mock__dot--green" />
                        </div>
                        <div className="lp-app-mock__content">
                            <div className="lp-mock-fighter">
                                <div className="lp-mock-fighter__avatar">IP</div>
                                <div className="lp-mock-fighter__info">
                                    <div className="lp-mock-fighter__name">Islam Makhachev</div>
                                    <div className="lp-mock-fighter__record">26-1-0 • Lightweight Champion</div>
                                    <div className="lp-mock-fighter__tags">
                                        <span className="lp-mock-fighter__tag lp-mock-fighter__tag--champ">Champion</span>
                                        <span className="lp-mock-fighter__tag lp-mock-fighter__tag--striker">Elite Grappler</span>
                                        <span className="lp-mock-fighter__tag lp-mock-fighter__tag--ko">8 KOs</span>
                                    </div>
                                    <div className="lp-mock-stat">
                                        <div className="lp-mock-stat__label"><span>Grappling</span><span>95%</span></div>
                                        <div className="lp-mock-stat__bar"><div className="lp-mock-stat__fill lp-mock-stat__fill--cyan" style={{ width: '95%' }} /></div>
                                    </div>
                                    <div className="lp-mock-stat">
                                        <div className="lp-mock-stat__label"><span>Striking</span><span>78%</span></div>
                                        <div className="lp-mock-stat__bar"><div className="lp-mock-stat__fill lp-mock-stat__fill--red" style={{ width: '78%' }} /></div>
                                    </div>
                                    <div className="lp-mock-stat">
                                        <div className="lp-mock-stat__label"><span>Win Rate</span><span>96%</span></div>
                                        <div className="lp-mock-stat__bar"><div className="lp-mock-stat__fill lp-mock-stat__fill--gold" style={{ width: '96%' }} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
