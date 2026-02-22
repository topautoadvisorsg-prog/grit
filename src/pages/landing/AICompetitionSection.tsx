import React from 'react';
import { Brain, Zap } from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';

export function AICompetitionSection() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();

    return (
        <section className="lp-section lp-competition" ref={ref}>
            <div className="lp-competition__inner">
                <div className="lp-competition__header lp-animate">
                    <span className="lp-section-label"><Brain size={14} /> {t('ai_arena.label')}</span>
                    <h2 className="lp-section-title">{t('ai_arena.title')}</h2>
                    <p className="lp-section-subtitle" style={{ margin: '0 auto' }}>
                        {t('ai_arena.subtitle')}
                    </p>
                </div>

                <div className="lp-competition__grid">
                    <div className="lp-model-card lp-animate lp-animate-delay-1">
                        <div className="lp-model-card__header">
                            <div className="lp-model-card__icon">🤖</div>
                            <div className="lp-model-card__name">GPT-4o</div>
                        </div>
                        <div className="lp-model-card__body">
                            <div className="lp-model-card__label">{t('ai_arena.prediction')}</div>
                            <div className="lp-model-card__pick lp-model-card__pick--red">Makhachev</div>
                            <div className="lp-feature2-card__desc" style={{ fontSize: '.85rem', marginTop: 8 }}>
                                "Superior wrestling metrics (3.4 TD/15) and top control time will neutralize Oliveira's offensive guard. Expect a decision win."
                            </div>
                        </div>
                        <div className="lp-model-card__footer">
                            <div className="lp-model-card__confidence lp-model-card__confidence--high">
                                <Zap size={14} /> 88% {t('ai_arena.confidence')}
                            </div>
                            <div className="lp-model-card__label">4 Units</div>
                        </div>
                    </div>

                    <div className="lp-model-card lp-animate lp-animate-delay-2" style={{ borderColor: 'hsl(190 90% 50% / .4)', boxShadow: '0 0 30px -10px hsl(190 90% 50% / .15)' }}>
                        <div className="lp-model-card__header">
                            <div className="lp-model-card__icon" style={{ background: 'hsl(190 90% 50% / .2)', color: 'var(--cyan)' }}>🚀</div>
                            <div className="lp-model-card__name" style={{ color: 'var(--cyan)' }}>Grok 3</div>
                        </div>
                        <div className="lp-model-card__body">
                            <div className="lp-model-card__label">{t('ai_arena.prediction')}</div>
                            <div className="lp-model-card__pick lp-model-card__pick--red">Makhachev</div>
                            <div className="lp-feature2-card__desc" style={{ fontSize: '.85rem', marginTop: 8, color: 'hsl(210 20% 70%)' }}>
                                "Oliveira absorbs 3.2 sig. strikes/min. Makhachev's defensive striking (68% defense) plus clinch control dictates the pace."
                            </div>
                        </div>
                        <div className="lp-model-card__footer">
                            <div className="lp-model-card__confidence lp-model-card__confidence--high" style={{ color: 'var(--cyan)', background: 'hsl(190 90% 50% / .15)' }}>
                                <Zap size={14} /> 94% {t('ai_arena.confidence')}
                            </div>
                            <div className="lp-model-card__label" style={{ color: 'var(--cyan)' }}>5 Units</div>
                        </div>
                    </div>

                    <div className="lp-model-card lp-animate lp-animate-delay-3">
                        <div className="lp-model-card__header">
                            <div className="lp-model-card__icon">🧠</div>
                            <div className="lp-model-card__name">Claude 3.5</div>
                        </div>
                        <div className="lp-model-card__body">
                            <div className="lp-model-card__label">{t('ai_arena.prediction')}</div>
                            <div className="lp-model-card__pick lp-model-card__pick--blue">Oliveira</div>
                            <div className="lp-feature2-card__desc" style={{ fontSize: '.85rem', marginTop: 8 }}>
                                "Upset alert. Makhachev has never faced a submission threat like this. Oliveira's front chokes negate the wrestling entry."
                            </div>
                        </div>
                        <div className="lp-model-card__footer">
                            <div className="lp-model-card__confidence lp-model-card__confidence--med">
                                <Zap size={14} /> 65% {t('ai_arena.confidence')}
                            </div>
                            <div className="lp-model-card__label">1 Unit</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
