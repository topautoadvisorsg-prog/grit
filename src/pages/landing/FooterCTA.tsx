import React from 'react';
import { Swords, ChevronRight } from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';

export function FooterCTA({ onSignIn }: { onSignIn: () => void }) {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    return (
        <>
            <section className="lp-section lp-footer-cta" ref={ref}>
                <div className="lp-footer-cta__glow" />
                <div className="lp-section__inner lp-animate" style={{ textAlign: 'center' }}>
                    <h2 className="lp-footer-cta__title">
                        <span className="lp-hero__title-main">{t('footer_cta.title1')}</span>
                        <span className="lp-hero__title-accent" data-text={t('footer_cta.title2')}>{t('footer_cta.title2')}</span>
                    </h2>
                    <p className="lp-footer-cta__subtitle">{t('footer_cta.subtitle')}</p>
                    <button className="lp-btn lp-btn--primary" onClick={onSignIn}><Swords size={18} /> {t('footer_cta.cta')} <ChevronRight size={18} /></button>
                </div>
            </section>
            <footer className="lp-footer">
                <div className="lp-footer__inner">
                    <div className="lp-footer__brand">
                        <div className="lp-footer__logo"><Swords size={14} color="white" /></div>
                        <span className="lp-footer__name">MMA CHAMPIONS LEAGUE</span>
                    </div>
                    <span className="lp-footer__copy">© {new Date().getFullYear()} MMA Champions League. All rights reserved.</span>
                </div>
            </footer>
        </>
    );
}
