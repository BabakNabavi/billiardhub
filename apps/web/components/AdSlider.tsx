'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface Ad {
    id: string;
    brand: string;
    title: string;
    subtitle: string;
    cta: string;
    href: string;
    accent: string;
    bg: string;
    imageUrl?: string;
    tag?: string;
}

const ads: Ad[] = [
    {
        id: '1',
        brand: 'VIRAKA',
        title: 'میز اسنوکر M1 Gold',
        subtitle: 'بهترین میز اسنوکر ساخت ایران — کیفیت بین‌المللی، قیمت رقابتی',
        cta: 'مشاهده محصول',
        href: '/shop/1',
        accent: '#C7A66A',
        bg: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #065f46 100%)',
        imageUrl: 'https://example.com/table.jpg',
        tag: 'تبلیغ ویژه',
    },
    {
        id: '2',
        brand: 'PREDATOR',
        title: 'چوب حرفه‌ای سری 314',
        subtitle: 'انتخاب قهرمانان جهان — اکنون در ایران با نمایندگی رسمی',
        cta: 'خرید آنلاین',
        href: '/shop/2',
        accent: '#f59e0b',
        bg: 'linear-gradient(135deg, #1c1400 0%, #2d1f00 40%, #3d2b00 100%)',
        tag: 'نمایندگی رسمی',
    },
    {
        id: '3',
        brand: 'BILLIARDHUB',
        title: 'مسابقات قهرمانی ایران ۱۴۰۳',
        subtitle: 'ثبت‌نام در بزرگ‌ترین رویداد بیلیارد ایران — جایزه ۵۰۰ میلیون تومان',
        cta: 'ثبت‌نام کن',
        href: '/events/1',
        accent: '#a78bfa',
        bg: 'linear-gradient(135deg, #0f0720 0%, #1e1035 40%, #2d1b69 100%)',
        tag: 'رویداد ویژه',
    },
    {
        id: '4',
        brand: 'ARAMITH',
        title: 'ست توپ Tournament Pro',
        subtitle: 'محبوب‌ترین توپ مسابقات حرفه‌ای جهان — اکنون در فروشگاه بیلیارد هاب',
        cta: 'مشاهده',
        href: '/shop/3',
        accent: '#ef4444',
        bg: 'linear-gradient(135deg, #1c0000 0%, #2d0f0f 40%, #3d1515 100%)',
        tag: 'پیشنهاد ویژه',
    },
];

export default function AdSlider() {
    const [current, setCurrent] = useState(0);
    const [prev, setPrev] = useState<number | null>(null);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [animating, setAnimating] = useState(false);
    const timerRef = useRef<number | null>(null);

    const go = (index: number, dir: 'next' | 'prev') => {
        if (animating) return;
        setAnimating(true);
        setDirection(dir);
        setPrev(current);
        setCurrent(index);
        setTimeout(() => {
            setPrev(null);
            setAnimating(false);
        }, 700);
    };

    const next = () => go((current + 1) % ads.length, 'next');
    const goTo = (i: number) => go(i, i > current ? 'next' : 'prev');

    useEffect(() => {
        const interval = setInterval(() => {
            go((current + 1) % ads.length, 'next');
        }, 5000);
        return () => clearInterval(interval);
    }, [current, animating]);
    const ad = ads[current]!;
    const prevAd = prev !== null ? (ads[prev] ?? null) : null;

    return (
        <>
            <style>{`
        @keyframes slideInNext {
          from { opacity: 0; transform: translateX(-60px) scale(0.97); filter: blur(4px); }
          to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
        }
        @keyframes slideInPrev {
          from { opacity: 0; transform: translateX(60px) scale(0.97); filter: blur(4px); }
          to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
        }
        @keyframes slideOutNext {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(60px) scale(0.97); }
        }
        @keyframes slideOutPrev {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(-60px) scale(0.97); }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .ad-current {
          animation: ${direction === 'next' ? 'slideInNext' : 'slideInPrev'} 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .ad-prev {
          animation: ${direction === 'next' ? 'slideOutNext' : 'slideOutPrev'} 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
          position: absolute; inset: 0;
        }
        .ad-progress {
          animation: progressBar 5s linear forwards;
        }
        .ad-nav-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          color: rgba(255,255,255,0.5);
        }
        .ad-nav-btn:hover {
          background: rgba(0,0,0,0.09);
          border-color: rgba(255,255,255,0.2);
          color: #fff;
        }
        .ad-cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        .ad-cta-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
      `}</style>

            <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', marginBottom: '80px' }}>

                {/* نوار تبلیغ */}
                <div style={{
                    position: 'absolute', top: '16px', right: '16px',
                    zIndex: 10,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.1em',
                    backdropFilter: 'blur(10px)',
                }}>
                    تبلیغ
                </div>

                {/* اسلایدر */}
                <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>

                    {/* اسلاید قبلی */}
                    {prevAd && (
                        <div className="ad-prev" style={{ background: prevAd.bg, height: '100%' }} />
                    )}

                    {/* اسلاید فعلی */}
                    <div className="ad-current" style={{ background: ad.bg, height: '100%', position: 'relative' }}>
                        {/* عکس بکگراند */}
                        {ad.imageUrl && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                backgroundImage: `url(${ad.imageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'brightness(0.3) saturate(0.8)',
                            }} />
                        )}


                        {/* نور accent */}
                        <div style={{
                            position: 'absolute', top: '-50%', right: '-10%',
                            width: '400px', height: '400px',
                            background: `radial-gradient(ellipse, ${ad.accent}15 0%, transparent 70%)`,
                            pointerEvents: 'none',
                            transition: 'all 0.7s ease',
                        }} />

                        {/* خطوط تزئینی */}
                        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }}>
                            <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${ad.accent}, transparent)` }} />
                        </div>

                        {/* محتوا */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 48px' }}>
                            <div style={{ flex: 1 }}>

                                {/* برند */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '12px', color: ad.accent, letterSpacing: '0.25em', fontWeight: 700 }}>
                                        {ad.brand}
                                    </div>
                                    <div style={{ height: '1px', width: '40px', background: `${ad.accent}40` }} />
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.04)', border: `1px solid ${ad.accent}30`, borderRadius: '20px', padding: '2px 10px' }}>
                                        {ad.tag}
                                    </div>
                                </div>

                                {/* تیتر */}
                                <h3 style={{ fontSize: '35px', fontWeight: 900, color: '#ffffff', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                    {ad.title}
                                </h3>

                                {/* توضیح */}
                                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', margin: '0 0 24px', lineHeight: 1.7, maxWidth: '500px' }}>
                                    {ad.subtitle}
                                </p>

                                {/* دکمه */}
                                <Link href={ad.href}>
                                    <button className="ad-cta-btn" style={{ background: ad.accent, color: '#000', boxShadow: `0 0 30px ${ad.accent}40` }}>
                                        {ad.cta}
                                        <ExternalLink size={14} />
                                    </button>
                                </Link>
                            </div>

                            {/* سمت چپ — دکوراتیو */}
                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '200px' }}>
                                <div style={{
                                    width: '120px', height: '120px',
                                    borderRadius: '50%',
                                    border: `1px solid ${ad.accent}20`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative',
                                }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: `1px solid ${ad.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ fontSize: '35px', opacity: 0.6 }}>🎱</div>
                                    </div>
                                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(ellipse, ${ad.accent}08, transparent 70%)` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* progress bar */}
                <div style={{ height: '2px', background: 'rgba(0,0,0,0.04)' }}>
                    <div key={current} className="ad-progress" style={{ height: '100%', background: `linear-gradient(90deg, ${ad.accent}, ${ad.accent}80)`, boxShadow: `0 0 10px ${ad.accent}` }} />
                </div>

                {/* کنترل‌ها */}
                <div style={{
                    position: 'absolute', bottom: '20px', left: '48px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                    <button className="ad-nav-btn" onClick={() => go((current - 1 + ads.length) % ads.length, 'prev')}>
                        <ChevronRight size={16} />
                    </button>
                    <button className="ad-nav-btn" onClick={next}>
                        <ChevronLeft size={16} />
                    </button>

                    {/* dots */}
                    <div style={{ display: 'flex', gap: '6px', marginRight: '8px' }}>
                        {ads.map((_, i) => (
                            <button key={i} onClick={() => goTo(i)} style={{
                                width: i === current ? '24px' : '6px',
                                height: '6px',
                                borderRadius: '3px',
                                background: i === current ? ad.accent : 'rgba(255,255,255,0.2)',
                                border: 'none', cursor: 'pointer',
                                transition: 'all 0.4s ease',
                                boxShadow: i === current ? `0 0 8px ${ad.accent}` : 'none',
                            }} />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}