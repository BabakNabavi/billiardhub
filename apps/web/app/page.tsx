'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Star, Building2, ShoppingBag, Clock, Eye, Play, Pause } from 'lucide-react';
import Stories from '../components/Stories';
import ScrollReveal from '../components/ScrollReveal/ScrollReveal';

const featuredClubs = [
  { id: '1', name: 'باشگاه ستاره تهران', city: 'تهران', tables: 12, rating: 4.8, type: 'اسنوکر', img: '/images/billiadr-club-1.jpg' },
  { id: '2', name: 'باشگاه المپیک مشهد', city: 'مشهد', tables: 8, rating: 4.6, type: 'پاکت', img: '/images/billiadr-club-2.jpg' },
  { id: '3', name: 'باشگاه پیروزی اصفهان', city: 'اصفهان', tables: 10, rating: 4.7, type: 'هی‌بال', img: '/images/billiadr-club-3.jpg' },
];

const upcomingEvents = [
  { id: '1', title: 'مسابقات سراسری اسنوکر ایران ۱۴۰۴', date: '۱۵ خرداد ۱۴۰۴', prize: '۵۰ میلیون', participants: 48, maxParticipants: 64, color: '#10b981' },
  { id: '2', title: 'جام بیلیارد پاکت تهران', date: '۲۲ خرداد ۱۴۰۴', prize: '۳۰ میلیون', participants: 24, maxParticipants: 32, color: '#06b6d4' },
  { id: '3', title: 'لیگ هی‌بال استان‌ها', date: '۱ تیر ۱۴۰۴', prize: '۲۰ میلیون', participants: 16, maxParticipants: 24, color: '#a78bfa' },
];

const latestNews = [
  { id: '1', title: 'برگزاری اولین دوره مسابقات بین‌المللی بیلیارد در تهران', date: '۵ خرداد ۱۴۰۴', views: 2341, category: 'مسابقات', categoryColor: '#10b981', img: '/images/billiadr-club-1.jpg' },
  { id: '2', title: 'معرفی جدیدترین میزهای اسنوکر وارداتی به بازار ایران', date: '۳ خرداد ۱۴۰۴', views: 1876, category: 'تجهیزات', categoryColor: '#06b6d4', img: '/images/billiadr-club-2.jpg' },
  { id: '3', title: 'آکادمی بیلیارد پلاس؛ آموزش آنلاین برای مبتدیان', date: '۱ خرداد ۱۴۰۴', views: 3102, category: 'آموزش', categoryColor: '#a78bfa', img: '/images/billiadr-club-3.jpg' },
];

const featuredProducts = [
  { id: '1', title: 'چوب بیلیارد Predator 314-3', price: 12000000, discountPrice: 9600000, discountPercent: 20, img: '/images/billiadr-club-1.jpg' },
  { id: '2', title: 'ست توپ Aramith Tournament', price: 4500000, discountPrice: 3800000, discountPercent: 16, img: '/images/billiadr-club-2.jpg' },
  { id: '3', title: 'میز اسنوکر Viraka M1 Gold', price: 85000000, discountPrice: 72000000, discountPercent: 15, img: '/images/billiadr-club-3.jpg' },
  { id: '4', title: 'گچ Master Blue Diamond', price: 850000, discountPrice: 680000, discountPercent: 20, img: '/images/billiadr-club-1.jpg' },
];

const heroSlides = [
  { img: '/images/billiadr-club-1.jpg', title: 'بیلیارد پلاس', sub: 'اولین پلتفرم تخصصی بیلیارد ایران', accent: '#10b981' },
  { img: '/images/billiadr-club-2.jpg', title: 'رزرو آنلاین', sub: 'میز مورد نظرت رو همین الان رزرو کن', accent: '#06b6d4' },
  { img: '/images/billiadr-club-3.jpg', title: 'مسابقات حرفه‌ای', sub: 'در بزرگ‌ترین رویدادهای بیلیارد ایران شرکت کن', accent: '#a78bfa' },
];

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [heroSlide, setHeroSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeroSlide(s => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY / 600);
  const heroScale = 1 + scrollY * 0.0003;
  const contentTranslateY = scrollY * 0.12;

  return (
    <>
      <style>{`
        @keyframes heroFadeIn {
          from { opacity:0; transform:translateY(36px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes badgePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50%      { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
        }
        @keyframes scrollHint {
          0%,100% { transform:translateY(0); opacity:1; }
          50%      { transform:translateY(8px); opacity:0.4; }
        }
        .ha { animation: heroFadeIn 1.2s cubic-bezier(0.22,1,0.36,1) 0.3s both; }
        .hb { animation: heroFadeIn 1s cubic-bezier(0.22,1,0.36,1) 0.7s both; }
        .hc { animation: heroFadeIn 1s cubic-bezier(0.22,1,0.36,1) 1s both; }
        .hd { animation: heroFadeIn 1s cubic-bezier(0.22,1,0.36,1) 1.3s both; }

        .gc {
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(16,185,129,0.1);
          border-radius: 20px;
          backdrop-filter: blur(20px);
          box-shadow: 0 4px 20px rgba(16,185,129,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }
        .gc:hover {
          transform: translateY(-6px);
          border-color: rgba(16,185,129,0.25);
          box-shadow: 0 20px 50px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,1);
        }

        .sl { font-size:11px; letter-spacing:0.2em; font-weight:600; margin-bottom:8px; }
        .st { font-size:clamp(20px,2.5vw,26px); font-weight:900; color:#0f2318; margin:0; }
        .sb { height:2px; width:36px; margin-top:8px; border-radius:2px; }

        @media(max-width:900px) {
          .clubs-g  { grid-template-columns: repeat(2,1fr) !important; }
          .events-g { grid-template-columns: 1fr !important; }
          .news-g   { grid-template-columns: 1fr !important; }
          .shop-g   { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media(max-width:480px) {
          .clubs-g  { grid-template-columns: 1fr !important; }
          .shop-g   { grid-template-columns: 1fr !important; }
          .hero-pad { padding: 0 5% !important; }
        }
      `}</style>

      {/* ==================== HERO ==================== */}
      <div style={{ position: 'relative', height: '100vh', minHeight: '680px', overflow: 'hidden' }}>

        {heroSlides.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            opacity: i === heroSlide ? 1 : 0,
            transition: 'opacity 1.5s cubic-bezier(0.4,0,0.2,1)',
            transform: `scale(${heroScale})`,
            willChange: 'transform',
          }}>
            <img src={s.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.35) saturate(0.75)' }} />
          </div>
        ))}

        <video ref={videoRef} autoPlay muted loop playsInline preload="metadata"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.14, transform: `scale(${heroScale})` }}>
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.5) 0%,transparent 35%,transparent 55%,rgba(0,0,0,0.7) 100%)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', background: `radial-gradient(ellipse at 30% 50%,${heroSlides[heroSlide].accent}14 0%,transparent 60%)`, transition: 'background 1.5s ease' }} />

        {/* خط عمودی — راست */}
        <div style={{ position: 'absolute', right: '48px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '90px', zIndex: 5, background: `linear-gradient(to bottom,transparent,${heroSlides[heroSlide].accent},transparent)`, transition: 'background 1.5s ease' }} />

        {/* محتوا — چپ */}
        <div className="hero-pad" style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          padding: '0 6%',
          transform: `translateY(${contentTranslateY}px)`,
          opacity: heroOpacity,
        }}>
          <div style={{ maxWidth: '580px', textAlign: 'right' }}>

            <div className="hb" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: `${heroSlides[heroSlide].accent}18`,
              border: `1px solid ${heroSlides[heroSlide].accent}40`,
              borderRadius: '100px', padding: '7px 18px', marginBottom: '20px',
              backdropFilter: 'blur(10px)',
              animation: 'badgePulse 3s infinite',
              transition: 'all 1.5s ease',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: heroSlides[heroSlide].accent, boxShadow: `0 0 8px ${heroSlides[heroSlide].accent}` }} />
              <span style={{ color: heroSlides[heroSlide].accent, fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em' }}>BILLIARD PLUS</span>
            </div>

            <h1 className="ha" style={{
              fontSize: 'clamp(38px,6vw,80px)', fontWeight: 900, color: '#fff',
              lineHeight: 1.08, margin: '0 0 12px', letterSpacing: '-0.03em',
              textShadow: '0 4px 40px rgba(0,0,0,0.4)',
            }}>{heroSlides[heroSlide].title}</h1>

            <div style={{
              height: '3px', width: '60px',
              background: `linear-gradient(90deg,${heroSlides[heroSlide].accent},transparent)`,
              borderRadius: '2px', marginBottom: '16px',
              transition: 'background 1.5s ease',
            }} />

            <p className="hb" style={{
              fontSize: 'clamp(14px,2vw,19px)', color: 'rgba(255,255,255,0.65)',
              margin: '0 0 32px', lineHeight: 1.75,
            }}>{heroSlides[heroSlide].sub}</p>

            <div className="hc" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/clubs">
                <button style={{
                  background: `linear-gradient(135deg,${heroSlides[heroSlide].accent},#059669)`,
                  color: '#fff', border: 'none', borderRadius: '14px',
                  padding: '13px 30px', fontSize: '14px', fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: `0 8px 28px ${heroSlides[heroSlide].accent}50`,
                  transition: 'all 0.3s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                  یافتن باشگاه
                </button>
              </Link>
              <Link href="/register">
                <button style={{
                  background: 'rgba(255,255,255,0.1)', color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.28)', borderRadius: '14px',
                  padding: '13px 30px', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s', fontFamily: 'inherit',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>
                  ثبت‌نام رایگان
                </button>
              </Link>
            </div>

            <div className="hd" style={{ display: 'flex', gap: '28px', marginTop: '44px', flexWrap: 'wrap' }}>
              {[{ v: '۵۰۰+', l: 'باشگاه فعال' }, { v: '۱۰K+', l: 'بازیکن' }, { v: '۲۰۰+', l: 'مسابقه' }].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* indicators */}
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '8px', opacity: heroOpacity }}>
          {heroSlides.map((s, i) => (
            <button key={i} onClick={() => setHeroSlide(i)} style={{
              height: '4px', width: i === heroSlide ? '28px' : '8px', borderRadius: '2px',
              border: 'none', cursor: 'pointer', padding: 0,
              background: i === heroSlide ? s.accent : 'rgba(255,255,255,0.3)',
              transition: 'all 0.4s ease',
              boxShadow: i === heroSlide ? `0 0 8px ${s.accent}` : 'none',
            }} />
          ))}
        </div>

        {/* video control */}
        <button onClick={() => {
          if (videoRef.current) {
            if (videoPlaying) { videoRef.current.pause(); setVideoPlaying(false); }
            else { videoRef.current.play(); setVideoPlaying(true); }
          }
        }} style={{
          position: 'absolute', bottom: '32px', right: '40px', zIndex: 10,
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)', opacity: heroOpacity,
        }}>
          {videoPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        {/* scroll hint */}
        <div style={{ position: 'absolute', bottom: '32px', left: '40px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: Math.max(0, heroOpacity * 1.5 - 0.3) }}>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', writingMode: 'vertical-rl' }}>SCROLL</div>
          <div style={{ width: '1px', height: '32px', background: 'linear-gradient(to bottom,rgba(255,255,255,0.35),transparent)', animation: 'scrollHint 2s ease infinite' }} />
        </div>
      </div>

      {/* ==================== WAVE ==================== */}
      <div style={{ position: 'relative', marginTop: '-2px', lineHeight: 0, background: '#0d2016' }}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '80px' }}>
          <defs>
            <linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f0faf5" />
              <stop offset="50%" stopColor="#e8f5ef" />
              <stop offset="100%" stopColor="#f0faf5" />
            </linearGradient>
          </defs>
          <path d="M0,0 C240,80 480,0 720,50 C960,100 1200,20 1440,60 L1440,80 L0,80 Z" fill="url(#wg)" />
          <path d="M0,20 C200,70 440,10 680,55 C920,100 1180,15 1440,45 L1440,80 L0,80 Z" fill="#f0faf5" opacity="0.5" />
        </svg>
      </div>

      

      {/* ==================== CONTENT ==================== */}
      <div style={{ background: 'linear-gradient(180deg,#f0faf5 0%,#e8f5ef 30%,#f4faf7 70%,#edf7f2 100%)', position: 'relative', paddingBottom: '40px' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 15% 25%,rgba(16,185,129,0.06) 0%,transparent 45%),radial-gradient(ellipse at 85% 75%,rgba(6,182,212,0.04) 0%,transparent 45%)' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '140px 32px 0', position: 'relative', zIndex: 1 }}>

          {/* ===== باشگاه‌ها ===== */}
          <ScrollReveal>
            <section style={{ marginBottom: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                  <div className="sl" style={{ color: '#10b981' }}>PREMIUM VENUES</div>
                  <h2 className="st">باشگاه‌های برتر</h2>
                  <div className="sb" style={{ background: 'linear-gradient(90deg,#10b981,transparent)' }} />
                </div>
                <Link href="/clubs" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', opacity: 0.8 }}>
                  مشاهده همه <ChevronLeft size={14} />
                </Link>
              </div>
              <div className="clubs-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px' }}>
                {featuredClubs.map(club => (
                  <Link key={club.id} href={`/clubs/${club.id}`} style={{ textDecoration: 'none' }}>
                    <div className="gc">
                      <div style={{ height: '150px', position: 'relative', overflow: 'hidden' }}>
                        <img src={club.img} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55)', transition: 'transform 0.5s ease' }}
                          onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.06)'; }}
                          onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(0,0,0,0.55)', color: '#6ee7b7', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>{club.type}</div>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <h3 style={{ fontWeight: 800, color: '#0f2318', marginBottom: '6px', fontSize: '14px' }}>{club.name}</h3>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#4b7a5e', marginBottom: '10px' }}>
                          <span>{club.city}</span><span>{club.tables.toLocaleString('fa-IR')} میز</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color: s <= Math.floor(club.rating) ? '#f59e0b' : '#d1d5db', fill: s <= Math.floor(club.rating) ? '#f59e0b' : 'transparent' }} />)}
                          </div>
                          <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>رزرو آنلاین</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ===== تبلیغات ===== */}
          <ScrollReveal>
            <section style={{ marginBottom: '80px' }}>
              <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', minHeight: '170px' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#064e3b,#065f46,#047857)' }} />
                <img src="/images/billiadr-club-2.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(rgba(16,185,129,0.2),transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 40px', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', marginBottom: '8px', fontWeight: 600 }}>ADVERTISEMENT</div>
                    <h3 style={{ fontSize: 'clamp(18px,3vw,28px)', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>باشگاه خود را معرفی کنید</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>به هزاران بازیکن و علاقه‌مند دسترسی پیدا کنید</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[{ v: '۵۰K+', l: 'بازدید ماهانه' }, { v: '۱۰K+', l: 'کاربر فعال' }].map((s, i) => (
                      <div key={i} style={{ textAlign: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>{s.v}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{s.l}</div>
                      </div>
                    ))}
                    <button style={{
                      background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
                      border: 'none', borderRadius: '12px', padding: '11px 22px',
                      fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 6px 20px rgba(16,185,129,0.4)', transition: 'all 0.3s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                      درخواست تبلیغ
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* ===== مسابقات ===== */}
          <ScrollReveal>
            <section style={{ marginBottom: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                  <div className="sl" style={{ color: '#d97706' }}>UPCOMING EVENTS</div>
                  <h2 className="st">مسابقات پیش رو</h2>
                  <div className="sb" style={{ background: 'linear-gradient(90deg,#f59e0b,transparent)' }} />
                </div>
                <Link href="/events" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', opacity: 0.8 }}>
                  مشاهده همه <ChevronLeft size={14} />
                </Link>
              </div>
              <div className="events-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px' }}>
                {upcomingEvents.map(event => (
                  <Link key={event.id} href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                    <div className="gc" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: event.color, boxShadow: `0 0 10px ${event.color}` }} />
                        <span style={{ fontSize: '11px', color: '#4b7a5e' }}>{event.date}</span>
                      </div>
                      <h3 style={{ fontWeight: 800, color: '#0f2318', marginBottom: '16px', fontSize: '13px', lineHeight: 1.6 }}>{event.title}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div><div style={{ fontSize: '10px', color: '#6b9e82', marginBottom: '2px' }}>جایزه</div><div style={{ fontSize: '13px', fontWeight: 700, color: '#d97706' }}>{event.prize}</div></div>
                        <div><div style={{ fontSize: '10px', color: '#6b9e82', marginBottom: '2px' }}>ثبت‌نام</div><div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{event.participants.toLocaleString('fa-IR')}/{event.maxParticipants.toLocaleString('fa-IR')}</div></div>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(16,185,129,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: event.color, borderRadius: '2px', width: `${(event.participants / event.maxParticipants) * 100}%` }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ===== اخبار ===== */}
          <ScrollReveal>
            <section style={{ marginBottom: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                  <div className="sl" style={{ color: '#0891b2' }}>LATEST NEWS</div>
                  <h2 className="st">آخرین اخبار</h2>
                  <div className="sb" style={{ background: 'linear-gradient(90deg,#06b6d4,transparent)' }} />
                </div>
                <Link href="/news" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', opacity: 0.8 }}>
                  مشاهده همه <ChevronLeft size={14} />
                </Link>
              </div>
              <div className="news-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px' }}>
                {latestNews.map(news => (
                  <Link key={news.id} href={`/news/${news.id}`} style={{ textDecoration: 'none' }}>
                    <div className="gc">
                      <div style={{ height: '130px', position: 'relative', overflow: 'hidden' }}>
                        <img src={news.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', color: news.categoryColor, background: `${news.categoryColor}20`, border: `1px solid ${news.categoryColor}40` }}>{news.category}</div>
                      </div>
                      <div style={{ padding: '14px' }}>
                        <h3 style={{ fontWeight: 700, color: '#0f2318', fontSize: '12px', lineHeight: 1.7, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{news.title}</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b9e82' }}>
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

          {/* ===== فروشگاه ===== */}
          <ScrollReveal>
            <section style={{ marginBottom: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                  <div className="sl" style={{ color: '#7c3aed' }}>PREMIUM EQUIPMENT</div>
                  <h2 className="st">فروشگاه تجهیزات</h2>
                  <div className="sb" style={{ background: 'linear-gradient(90deg,#a78bfa,transparent)' }} />
                </div>
                <Link href="/shop" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', opacity: 0.8 }}>
                  مشاهده همه <ChevronLeft size={14} />
                </Link>
              </div>
              <div className="shop-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
                {featuredProducts.map(product => (
                  <Link key={product.id} href={`/shop/${product.id}`} style={{ textDecoration: 'none' }}>
                    <div className="gc">
                      <div style={{ height: '110px', position: 'relative', overflow: 'hidden' }}>
                        <img src={product.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(6,78,59,0.5),rgba(6,95,70,0.4))' }} />
                        <ShoppingBag size={24} style={{ position: 'absolute', bottom: '8px', left: '8px', color: 'rgba(255,255,255,0.2)' }} />
                        {product.discountPercent > 0 && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239,68,68,0.88)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                            {product.discountPercent.toLocaleString('fa-IR')}٪
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '12px' }}>
                        <h3 style={{ fontWeight: 700, color: '#0f2318', fontSize: '11px', lineHeight: 1.6, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.title}</h3>
                        <div style={{ fontSize: '10px', color: 'rgba(26,46,36,0.35)', textDecoration: 'line-through' }}>{product.price.toLocaleString('fa-IR')}</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>{(product.discountPrice || product.price).toLocaleString('fa-IR')} ت</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ===== CTA ===== */}
          <ScrollReveal>
            <section style={{ marginBottom: '80px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(16,185,129,0.18)',
                borderRadius: '28px', padding: '52px 40px', textAlign: 'center',
                position: 'relative', overflow: 'hidden', backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 40px rgba(16,185,129,0.08)',
              }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '350px', background: 'radial-gradient(ellipse,rgba(16,185,129,0.07),transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.2em', marginBottom: '14px', fontWeight: 600 }}>JOIN THE ELITE</div>
                  <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 900, color: '#0f2318', marginBottom: '10px', letterSpacing: '-0.02em' }}>همین الان شروع کن</h2>
                  <p style={{ color: '#4b7a5e', marginBottom: '30px', fontSize: '15px' }}>رایگان ثبت‌نام کن و به جامعه بیلیارد ایران بپیوند</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <Link href="/register">
                      <button style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', padding: '14px 32px', borderRadius: '14px', fontSize: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 8px 28px rgba(16,185,129,0.3)', transition: 'all 0.3s', fontFamily: 'inherit' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                        ثبت‌نام رایگان
                      </button>
                    </Link>
                    <Link href="/clubs">
                      <button style={{ background: 'rgba(255,255,255,0.8)', color: '#0f2318', padding: '14px 32px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s', fontFamily: 'inherit' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; e.currentTarget.style.background = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}>
                        <Building2 size={16} /> یافتن باشگاه
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