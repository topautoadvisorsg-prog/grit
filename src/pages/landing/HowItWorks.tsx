import React from 'react';
import { Target } from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';

export function HowItWorks() {
    const { t } = useTranslation();
    const STEPS = [
        { num: '01', title: t('how_it_works.step1_title'), desc: t('how_it_works.step1_desc') },
        { num: '02', title: t('how_it_works.step2_title'), desc: t('how_it_works.step2_desc') },
        { num: '03', title: t('how_it_works.step3_title'), desc: t('how_it_works.step3_desc') },
        { num: '04', title: t('how_it_works.step4_title'), desc: t('how_it_works.step4_desc') },
    ];

    const ref = useScrollAnimation();
    return (
        <section className="lp-section lp-how" id="how-it-works" ref={ref}>
            <div className="lp-section__inner">
                <div className="lp-animate" style={{ textAlign: 'center' }}>
                    <span className="lp-section-label"><Target size={14} /> {t('how_it_works.label')}</span>
                    <h2 className="lp-section-title" style={{ margin: '0 auto 16px' }}>{t('how_it_works.title')}</h2>
                    <p className="lp-section-subtitle" style={{ margin: '0 auto' }}>{t('how_it_works.subtitle')}</p>
                </div>
                <div className="lp-how__timeline">
                    {STEPS.map((s, i) => (
                        <div key={s.num} className={`lp-step lp-animate lp-animate-delay-${i + 1}`}>
                            <div className="lp-step__number-wrap"><div className="lp-step__number">{s.num}</div></div>
                            <h3 className="lp-step__title">{s.title}</h3>
                            <p className="lp-step__desc">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
