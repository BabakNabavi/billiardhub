'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, ChevronLeft,
  Star, Building2, Clock, Eye, ArrowDown
} from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal/ScrollReveal';
import AdSlider from '../components/AdSlider';
import Stories from '../components/Stories';

const featuredClubs = [
  { id: '1', name: 'باشگاه ستاره تهران', city: 'تهران', tables: 12, rating: 4.8, type: 'اسنوکر و پاکت' },
  { id: '2', name: 'باشگاه المپیک مشهد', city: 'مشهد', tables: 8, rating: 4.6, type: 'اسنوکر' },
  { id: '3', name: 'باشگاه پیروزی اصفهان', city: 'اصفهان', tables: 10, rating: 4.7, type: 'پاکت بیلیارد' },
];

const latestNews = [
  { id: '1', title: 'برگزاری مسابقات قهرمانی اسنوکر ایران ۱۴۰۳', category: 'مسابقات', categoryColor: '#10b981', date: '۱۴۰۳/۰۳/۱۵', views: 1250 },
  { id: '2', title: 'رنکینگ جدید بازیکنان دسته برتر اعلام شد', category: 'رنکینگ', categoryColor: '#06b6d4', date: '۱۴۰۳/۰۳/۱۰', views: 890 },
  { id: '3', title: 'افتتاح باشگاه بیلیارد مجهز در شیراز', category: 'باشگاه‌ها', categoryColor: '#84cc16', date: '۱۴۰۳/۰۳/۰۵', views: 654 },
];

const upcomingEvents = [
  { id: '1', title: 'مسابقات قهرمانی اسنوکر ایران', date: '۱۵ خرداد', prize: '۵۰۰ میلیون تومان', participants: 96, maxParticipants: 128 },
  { id: '2', title: 'لیگ پاکت بیلیارد دسته برتر', date: '۲۰ خرداد', prize: '۲۰۰ میلیون تومان', participants: 32, maxParticipants: 32 },
  { id: '3', title: 'تورنومنت آزاد مشهد', date: '۱ تیر', prize: '۳۰ میلیون تومان', participants: 28, maxParticipants: 64 },
];

const featuredProducts = [
  { id: '1', title: 'میز اسنوکر ویراکا M1 Gold', price: 85000000, discountPrice: 72000000, discountPercent: 15 },
  { id: '2', title: 'چوب حرفه‌ای Predator 314-3', price: 12000000, discountPrice: 9600000, discountPercent: 20 },
  { id: '3', title: 'ست توپ Aramith Tournament', price: 4500000, discountPrice: 3800000, discountPercent: 16 },
  { id: '4', title: 'گچ Master Blue Diamond', price: 850000, discountPrice: 680000, discountPercent: 20 },
];

const particles = [
  { x: 15, y: 30, s: 3, c: '#10b981' },
  { x: 80, y: 20, s: 2, c: '#06b6d4' },
  { x: 45, y: 70, s: 4, c: '#10b981' },
  { x: 70, y: 50, s: 2, c: '#06b6d4' },
  { x: 25, y: 65, s: 3, c: '#34d399' },
  { x: 90, y: 40, s: 2, c: '#10b981' },
  { x: 55, y: 25, s: 3, c: '#06b6d4' },
  { x: 10, y: 80, s: 2, c: '#34d399' },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0px); opacity: 0.4; }
          50% { transform: translateY(-20px); opacity: 0.9; }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        .hero-badge { animation: fadeUp 0.8s ease forwards; animation-delay: 0.4s; opacity: 0; }
        .hero-title { animation: fadeUp 1s ease forwards; animation-delay: 0.7s; opacity: 0; }
        .hero-sub { animation: fadeUp 0.8s ease forwards; animation-delay: 1s; opacity: 0; }
        .hero-cta { animation: fadeUp 0.8s ease forwards; animation-delay: 1.3s; opacity: 0; }
        .hero-stats { animation: fadeUp 0.8s ease forwards; animation-delay: 1.6s; opacity: 0; }
        .hero-stories { animation: fadeUp 0.8s ease forwards; animation-delay: 0.2s; opacity: 0; }

        .card-dark {
          background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer;
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow: 0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .card-dark:hover {
          transform: translateY(-8px) scale(1.01);
          border-color: rgba(16,185,129,0.3);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
          background: linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(16,185,129,0.04) 100%);
        }
        .section-label { font-size: 11px; letter-spacing: 0.2em; font-weight: 600; margin-bottom: 8px; }
        .section-title { font-size: 28px; font-weight: 900; color: #f1f5f9; margin: 0; letter-spacing: -0.01em; }
        .section-line { width: 40px; height: 2px; margin-top: 8px; border-radius: 1px; }
      `}</style>

      {/* HERO */}
      <div style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '700px', overflow: 'hidden' }}>

        {/* ویدیو */}
        <video autoPlay muted loop playsInline style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', filter: 'brightness(0.25) saturate(0.6)',
        }}>
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,26,16,0.7) 0%, rgba(10,26,16,0.1) 40%, rgba(10,26,16,0.1) 60%, rgba(10,26,16,0.9) 100%)' }} />

        {/* نور موس — کریستالی */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at ${mousePos.x}% ${mousePos.y}%, rgba(16,185,129,0.12) 0%, transparent 55%)`,
          transition: 'background 0.6s ease', pointerEvents: 'none',
        }} />

        {/* نور ثابت */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.06) 0%, transparent 40%),
                       radial-gradient(ellipse at 20% 80%, rgba(16,185,129,0.06) 0%, transparent 40%)` }} />

        {/* خطوط تزئینی */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06 }}>
          <div style={{ position: 'absolute', top: '38%', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #10b981 50%, transparent)' }} />
          <div style={{ position: 'absolute', bottom: '28%', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #06b6d4 50%, transparent)' }} />
        </div>

        {/* ذرات */}
        {mounted && particles.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.s}px`, height: `${p.s}px`, borderRadius: '50%',
            background: p.c, boxShadow: `0 0 ${p.s * 5}px ${p.c}`,
            animation: `particleFloat ${6 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
          }} />
        ))}

        {/* استوری‌ها — زیر navbar */}
        <div className="hero-stories" style={{
          position: 'absolute', top: '80px', left: 0, right: 0,
          zIndex: 10, padding: '16px 40px',
          background: 'linear-gradient(to bottom, rgba(10,26,16,0.5), transparent)',
          backdropFilter: 'blur(4px)',
        }}>
          <Stories />
        </div>

        {/* محتوای hero — پایین‌تر */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '0 24px',
          paddingTop: '160px',
        }}>

          {/* بج */}
          <div className="hero-badge" style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '7px 18px', borderRadius: '100px',
              background: 'rgba(16,185,129,0.07)',
              border: '1px solid rgba(16,185,129,0.18)',
              backdropFilter: 'blur(20px)',
              color: 'rgba(255,255,255,0.35)', fontSize: '11px',
              letterSpacing: '0.15em', fontWeight: 500,
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
              BILLIARD PLUS · IRAN · 2026
            </div>
          </div>

          {/* تیتر */}
          <div className="hero-title" style={{ marginBottom: '16px', maxWidth: '800px' }}>
            <h1 style={{ fontSize: 'clamp(48px, 10vw, 120px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', margin: 0 }}>
              <span style={{ color: '#ffffff' }}>بیلیارد </span>
              <span style={{
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #34d399 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                filter: 'drop-shadow(0 0 40px rgba(16,185,129,0.4))',
              }}>پلاس</span>
            </h1>
          </div>

          {/* زیرتیتر */}
          <div className="hero-sub" style={{ marginBottom: '36px', maxWidth: '500px' }}>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, margin: 0 }}>
               اولین پلتفرم تخصصی بیلیارد ایران
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', marginTop: '6px', letterSpacing: '0.15em' }}>
              RESERVE · COMPETE · SHOP · WATCH LIVE
            </p>
          </div>

          {/* دکمه‌ها */}
          <div className="hero-cta" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '48px' }}>
            <Link href="/clubs">
              <button style={{
                background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)',
                padding: '13px 28px', borderRadius: '14px', fontSize: '14px', fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                backdropFilter: 'blur(20px)', transition: 'all 0.3s ease',
              }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(16,185,129,0.12)'; el.style.borderColor = 'rgba(16,185,129,0.3)'; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.07)'; el.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                <Building2 size={16} /> باشگاه‌ها
              </button>
            </Link>
            <Link href="/live">
              <button style={{
                background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
                padding: '13px 28px', borderRadius: '14px', fontSize: '14px', fontWeight: 700,
                border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                backdropFilter: 'blur(20px)', transition: 'all 0.3s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444', animation: 'glowPulse 2s infinite', display: 'inline-block' }} />
                پخش زنده
              </button>
            </Link>
            <Link href="/shop">
              <button style={{
                background: 'linear-gradient(135deg, #10b981, #059669)', color: '#000',
                padding: '13px 28px', borderRadius: '14px', fontSize: '14px', fontWeight: 800,
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 0 30px rgba(16,185,129,0.35)', transition: 'all 0.3s ease',
              }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 30px rgba(16,185,129,0.5)'; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 0 30px rgba(16,185,129,0.35)'; }}>
                <ShoppingBag size={16} /> فروشگاه
              </button>
            </Link>
          </div>

          {/* آمار */}
          <div className="hero-stats" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { value: '۴۳+', label: 'باشگاه فعال', color: '#10b981' },
              { value: '۱۲۴+', label: 'بازیکن', color: '#06b6d4' },
              { value: '۱۲+', label: 'مسابقه', color: '#a78bfa' },
              { value: '۸۷+', label: 'محصول', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 900, color: s.color, textShadow: `0 0 20px ${s.color}60` }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* اسکرول */}
        <div style={{ position: 'absolute', bottom: '28px', left: '50%', animation: 'scrollBounce 2s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.2em' }}>SCROLL</span>
          <ArrowDown size={13} style={{ color: 'rgba(255,255,255,0.12)' }} />
        </div>
      </div>

      {/* بقیه صفحه — کریستالی */}
      <div style={{
        background: 'linear-gradient(180deg, #0d2016 0%, #0f2418 20%, #0b1d13 60%, #0d2016 100%)',
        color: '#e2e8f0', position: 'relative',
      }}>
        {/* نور کریستالی ثابت */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse at 15% 25%, rgba(16,185,129,0.05) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 75%, rgba(6,182,212,0.04) 0%, transparent 45%),
            radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.03) 0%, transparent 55%)
          `,
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1 }}>

          {/* باشگاه‌ها */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                  <div className="section-label" style={{ color: '#10b981' }}>PREMIUM VENUES</div>
                  <h2 className="section-title">باشگاه‌های برتر</h2>
                  <div className="section-line" style={{ background: 'linear-gradient(90deg, #10b981, transparent)' }} />
                </div>
                <Link href="/clubs" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', opacity: 0.8 }}>
                  مشاهده همه <ChevronLeft size={14} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {featuredClubs.map((club, i) => (
                  <Link key={club.id} href={`/clubs/${club.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card-dark">
                      <div style={{ height: '140px', background: `linear-gradient(135deg, ${i === 0 ? '#064e3b, #065f46' : i === 1 ? '#0c4a6e, #075985' : '#3b0764, #6d28d9'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <Building2 size={36} style={{ color: 'rgba(255,255,255,0.08)' }} />
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#6ee7b7', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)', backdropFilter: 'blur(10px)' }}>
                          {club.type}
                        </div>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <h3 style={{ fontWeight: 800, color: '#e2e8f0', marginBottom: '8px', fontSize: '15px' }}>{club.name}</h3>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
                          <span>{club.city}</span>
                          <span>{club.tables.toLocaleString('fa-IR')} میز</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} size={11} style={{ color: s <= Math.floor(club.rating) ? '#f59e0b' : '#1f2937' }} fill={s <= Math.floor(club.rating) ? '#f59e0b' : 'transparent'} />
                            ))}
                          </div>
                          <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.15)' }}>رزرو آنلاین</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={0}>
            <AdSlider />
          </ScrollReveal>

          {/* مسابقات */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                  <div className="section-label" style={{ color: '#f59e0b' }}>UPCOMING EVENTS</div>
                  <h2 className="section-title">مسابقات پیش رو</h2>
                  <div className="section-line" style={{ background: 'linear-gradient(90deg, #f59e0b, transparent)' }} />
                </div>
                <Link href="/events" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', opacity: 0.8 }}>
                  مشاهده همه <ChevronLeft size={14} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {upcomingEvents.map((event, idx) => (
                  <Link key={event.id} href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card-dark" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === 0 ? '#10b981' : idx === 1 ? '#06b6d4' : '#a78bfa', boxShadow: `0 0 10px ${idx === 0 ? '#10b981' : idx === 1 ? '#06b6d4' : '#a78bfa'}` }} />
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{event.date}</span>
                      </div>
                      <h3 style={{ fontWeight: 800, color: '#e2e8f0', marginBottom: '16px', fontSize: '14px', lineHeight: 1.6 }}>{event.title}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginBottom: '2px' }}>جایزه</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>{event.prize}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginBottom: '2px' }}>ثبت‌نام</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>{event.participants.toLocaleString('fa-IR')}/{event.maxParticipants.toLocaleString('fa-IR')}</div>
                        </div>
                      </div>
                      <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px' }}>
                        <div style={{ height: '100%', background: idx === 0 ? '#10b981' : idx === 1 ? '#06b6d4' : '#a78bfa', borderRadius: '1px', width: `${(event.participants / event.maxParticipants) * 100}%` }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* اخبار */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                  <div className="section-label" style={{ color: '#06b6d4' }}>LATEST NEWS</div>
                  <h2 className="section-title">آخرین اخبار</h2>
                  <div className="section-line" style={{ background: 'linear-gradient(90deg, #06b6d4, transparent)' }} />
                </div>
                <Link href="/news" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', opacity: 0.8 }}>
                  مشاهده همه <ChevronLeft size={14} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {latestNews.map((news, i) => (
                  <Link key={news.id} href={`/news/${news.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card-dark">
                      <div style={{ height: '130px', background: `linear-gradient(135deg, ${i === 0 ? '#1a0a0a, #2d0f0f' : i === 1 ? '#0a0f1a, #0f1d2d' : '#0a1a0a, #0f2d0f'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ fontSize: '36px', opacity: 0.1 }}>📰</div>
                        <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', color: news.categoryColor, background: `${news.categoryColor}15`, border: `1px solid ${news.categoryColor}30` }}>
                          {news.category}
                        </div>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <h3 style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '13px', lineHeight: 1.7, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {news.title}
                        </h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} />{news.date}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={10} />{news.views.toLocaleString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* فروشگاه */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                  <div className="section-label" style={{ color: '#a78bfa' }}>PREMIUM EQUIPMENT</div>
                  <h2 className="section-title">فروشگاه تجهیزات</h2>
                  <div className="section-line" style={{ background: 'linear-gradient(90deg, #a78bfa, transparent)' }} />
                </div>
                <Link href="/shop" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', opacity: 0.8 }}>
                  مشاهده همه <ChevronLeft size={14} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {featuredProducts.map(product => (
                  <Link key={product.id} href={`/shop/${product.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card-dark">
                      <div style={{ height: '110px', background: 'linear-gradient(135deg, #0a1a0f, #071510)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <ShoppingBag size={28} style={{ color: 'rgba(16,185,129,0.1)' }} />
                        {product.discountPercent > 0 && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.25)' }}>
                            {product.discountPercent.toLocaleString('fa-IR')}٪
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '12px' }}>
                        <h3 style={{ fontWeight: 700, color: '#cbd5e1', fontSize: '12px', lineHeight: 1.6, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {product.title}
                        </h3>
                        {product.discountPrice && (
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through' }}>{product.price.toLocaleString('fa-IR')}</div>
                        )}
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                          {(product.discountPrice || product.price).toLocaleString('fa-IR')} تومان
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* CTA */}
          <ScrollReveal delay={0}>
            <section>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.07), rgba(6,182,212,0.04), transparent)',
                border: '1px solid rgba(16,185,129,0.12)',
                borderRadius: '24px', padding: '64px 40px',
                textAlign: 'center', position: 'relative', overflow: 'hidden',
                backdropFilter: 'blur(20px)',
              }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '400px', background: 'radial-gradient(ellipse, rgba(16,185,129,0.05), transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: 600 }}>JOIN THE ELITE</div>
                  <h2 style={{ fontSize: '40px', fontWeight: 900, color: '#f1f5f9', marginBottom: '12px', letterSpacing: '-0.02em' }}>همین الان شروع کن</h2>
                  <p style={{ color: 'rgba(255,255,255,0.25)', marginBottom: '36px', fontSize: '16px' }}>رایگان ثبت‌نام کن و به جامعه بیلیارد ایران بپیوند</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <Link href="/register">
                      <button style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)', color: '#000',
                        padding: '14px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 800,
                        border: 'none', cursor: 'pointer', boxShadow: '0 0 30px rgba(16,185,129,0.3)',
                        transition: 'all 0.3s ease',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(16,185,129,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(16,185,129,0.3)'; }}>
                        ثبت‌نام رایگان
                      </button>
                    </Link>
                    <Link href="/clubs">
                      <button style={{
                        background: 'transparent', color: '#94a3b8', padding: '14px 32px',
                        borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                        border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#e2e8f0'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}>
                        <Building2 size={18} /> یافتن باشگاه
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </div>
    </>
  );
}