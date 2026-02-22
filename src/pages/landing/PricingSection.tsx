import React from 'react';
import { Zap, Check, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';

export function PricingSection({ onSignIn }: { onSignIn: () => void }) {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    return (
        <section className="lp-section lp-pricing" id="pricing" ref={ref}>
            <div className="lp-section__inner">
                <div className="lp-animate" style={{ textAlign: 'center' }}>
                    <span className="lp-section-label"><Zap size={14} /> {t('pricing.label')}</span>
                    <h2 className="lp-section-title" style={{ margin: '0 auto 16px' }}>{t('pricing.title')}</h2>
                    <p className="lp-section-subtitle" style={{ margin: '0 auto' }}>{t('pricing.subtitle')}</p>
                </div>
                <div className="lp-pricing__grid">
                    <div className="lp-price-card lp-animate lp-animate-delay-1">
                        <h3 className="lp-price-card__name">{t('pricing.free_name')}</h3>
                        <div className="lp-price-card__price">{t('pricing.free_price')} <span>{t('pricing.free_period')}</span></div>
                        <p className="lp-price-card__desc">{t('pricing.free_desc')}</p>
                        <ul className="lp-price-card__features">
                            <li><span className="check"><Check size={11} /></span> {t('pricing.free_feat1')}</li>
                            <li><span className="check"><Check size={11} /></span> {t('pricing.free_feat2')}</li>
                            <li><span className="check"><Check size={11} /></span> {t('pricing.free_feat3')}</li>
                            <li><span className="check"><Check size={11} /></span> {t('pricing.free_feat4')}</li>
                            <li><span className="check"><Check size={11} /></span> {t('pricing.free_feat5')}</li>
                        </ul>
                        <button className="lp-btn lp-btn--secondary" onClick={onSignIn} style={{ width: '100%', justifyContent: 'center' }}>{t('pricing.free_cta')}</button>
                    </div>
                    <div className="lp-price-card lp-price-card--featured lp-animate lp-animate-delay-2">
                        <span className="lp-price-card__popular">{t('pricing.plus_popular')}</span>
                        <h3 className="lp-price-card__name">{t('pricing.plus_name')}</h3>
                        <div className="lp-price-card__price">{t('pricing.plus_price')} <span>{t('pricing.plus_period')}</span></div>
                        <p className="lp-price-card__desc">{t('pricing.plus_desc')}</p>
                        <ul className="lp-price-card__features">
                            <li><span className="check"><Check size={11} /></span> {t('pricing.plus_feat1')}</li>
                            <li><span className="check"><Check size={11} /></span> <strong>{t('pricing.plus_feat2')}</strong></li>
                            <li><span className="check"><Check size={11} /></span> {t('pricing.plus_feat3')}</li>
                            <li><span className="check"><Check size={11} /></span> {t('pricing.plus_feat4')}</li>
                            <li><span className="check"><Check size={11} /></span> {t('pricing.plus_feat5')}</li>
                        </ul>
                        <button className="lp-btn lp-btn--primary" onClick={onSignIn} style={{ width: '100%', justifyContent: 'center' }}><Zap size={16} /> {t('pricing.plus_cta')}</button>
                    </div>
                    <div className="lp-price-card lp-animate lp-animate-delay-3">
                        <h3 className="lp-price-card__name">{t('pricing.pro_name')}</h3>
                        <div className="lp-price-card__price">{t('pricing.pro_price')} <span>{t('pricing.pro_period')}</span></div>
                        <p className="lp-price-card__desc">{t('pricing.pro_desc')}</p>
                        <ul className="lp-price-card__features">
                            <li><span className="check"><Check size={11} /></span> {t('pricing.pro_feat1')}</li>
                            <li><span className="check"><Check size={11} /></span> {t('pricing.pro_feat2')}</li>
                            <li><span className="check"><Check size={11} /></span> {t('pricing.pro_feat3')}</li>
                            <li><span className="check"><Check size={11} /></span> {t('pricing.pro_feat4')}</li>
                            <li><span className="check"><Check size={11} /></span> {t('pricing.pro_feat5')}</li>
                        </ul>
                        <button className="lp-btn lp-btn--secondary" onClick={onSignIn} style={{ width: '100%', justifyContent: 'center' }}>{t('pricing.pro_cta')} <ArrowRight size={16} /></button>
                    </div>
                </div>
            </div>
        </section>
    );
}
