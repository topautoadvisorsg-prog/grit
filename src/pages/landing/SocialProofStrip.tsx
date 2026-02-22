import React from 'react';
import { useTranslation } from 'react-i18next';

export function SocialProofStrip() {
    const { t } = useTranslation();
    return (
        <section className="lp-proof">
            <div className="lp-proof__inner">
                <div className="lp-proof__stat">
                    <div className="lp-proof__value">🧠</div>
                    <div className="lp-proof__label">{t('social_proof.multi_ai')}</div>
                </div>
                <div className="lp-proof__stat">
                    <div className="lp-proof__value">📊</div>
                    <div className="lp-proof__label">{t('social_proof.deep_data')}</div>
                </div>
                <div className="lp-proof__stat">
                    <div className="lp-proof__value">🏆</div>
                    <div className="lp-proof__label">{t('social_proof.global_rankings')}</div>
                </div>
                <div className="lp-proof__stat">
                    <div className="lp-proof__value">🌍</div>
                    <div className="lp-proof__label">{t('social_proof.country_leagues')}</div>
                </div>
            </div>
        </section>
    );
}
