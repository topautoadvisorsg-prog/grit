import React from 'react';
import { Target, Globe, Sparkles } from 'lucide-react';
import { useScrollAnimation, use3DTilt } from './hooks';
import { useTranslation } from 'react-i18next';

export function Tier2Features() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    const tilt1 = use3DTilt();
    const tilt2 = use3DTilt();
    return (
        <section className="lp-section lp-features2" ref={ref}>
            <div className="lp-section__inner">
                <div className="lp-animate" style={{ textAlign: 'center' }}>
                    <span className="lp-section-label"><Sparkles size={14} /> {t('tier2.label')}</span>
                    <h2 className="lp-section-title" style={{ margin: '0 auto 16px' }}>{t('tier2.title')}</h2>
                </div>
                <div className="lp-features2__grid">
                    <div className="lp-feature2-card lp-animate lp-animate-delay-1" ref={tilt1.ref} onMouseMove={tilt1.onMouseMove} onMouseLeave={tilt1.onMouseLeave}>
                        <div className="lp-feature2-card__icon"><Target size={22} /></div>
                        <h3 className="lp-feature2-card__title">{t('tier2.picks_title')}</h3>
                        <p className="lp-feature2-card__desc">{t('tier2.picks_desc')}</p>
                    </div>
                    <div className="lp-feature2-card lp-animate lp-animate-delay-2" ref={tilt2.ref} onMouseMove={tilt2.onMouseMove} onMouseLeave={tilt2.onMouseLeave}>
                        <div className="lp-feature2-card__icon"><Globe size={22} /></div>
                        <h3 className="lp-feature2-card__title">{t('tier2.community_title')}</h3>
                        <p className="lp-feature2-card__desc">{t('tier2.community_desc')}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
