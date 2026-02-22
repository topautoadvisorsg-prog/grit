import React from 'react';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HeroSection({ onSignIn }: { onSignIn: () => void }) {
    const { t } = useTranslation();
    return (
        <section className="lp-hero">
            <video
                className="lp-hero__video"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                src="/hero_bg.mp4"
            />
            <div className="lp-hero__overlay" />
            <div className="lp-hero__content">
                <div className="lp-hero__badge"><span className="lp-hero__badge-dot" /> {t('hero.badge')}</div>
                <h1 className="lp-hero__title">
                    <span className="lp-hero__title-main">{t('hero.title_main')}</span>
                    <span className="lp-hero__title-accent">{t('hero.title_accent')}</span>
                </h1>
                <div className="lp-hero__subtitle-wrap">{t('hero.subtitle')}</div>
                <p className="lp-hero__desc">{t('hero.desc')}</p>
                <div className="lp-hero__ctas">
                    <button className="lp-btn lp-btn--primary" onClick={onSignIn}><Zap size={18} /> {t('hero.cta')}</button>
                </div>
            </div>
        </section>
    );
}
