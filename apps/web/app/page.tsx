'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MapPin, Trophy, ShoppingBag, Radio,
  ChevronLeft, Star, Users, Building2, Zap,
  Clock, Eye, ArrowDown
} from 'lucide-react';

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

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setHeroVisible(true), 200);
  }, []);

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
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .hero-badge { animation: fadeUp 0.8s ease forwards; animation-delay: 0.5s; opacity: 0; }
        .hero-title { animation: fadeUp 1s ease forwards; animation-delay: 0.8s; opacity: 0; }
        .hero-sub { animation: fadeUp 0.8s ease forwards; animation-delay: 1.1s; opacity: 0; }
        .hero-cta { animation: fadeUp 0.8s ease forwards; animation-delay: 1.4s; opacity: 0; }
        .hero-stats { animation: fadeUp 0.8s ease forwards; animation-delay: 1.7s; opacity: 0; }
        .card-hover { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(16,185,129,0.1); }
        .btn-primary { transition: all 0.3s ease; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(16,185,129,0.4); }
        .section-enter { animation: fadeUp 0.8s ease forwards; }
      `}</style>

      {/* HERO — تمام صفحه */}
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>

        {/* ویدیو */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.35) saturate(0.8)',
          }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* overlay‌ها */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.8) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at ${mousePos.x}% ${mousePos.y}%, rgba(16,185,129,0.08) 0%, transparent 60%)`, transition: 'background 0.5s ease', pointerEvents: 'none' }} />

        {/* خطوط نئون */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06 }}>
          <div style={{ position: 'absolute', top: '35%', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: '25%', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, #06b6d4 50%, transparent 100%)' }} />
        </div>

        {/* ذرات نئون */}
        {mounted && [
          { x: 15, y: 30, s: 3 }, { x: 80, y: 20, s: 2 }, { x: 45, y: 70, s: 4 },
          { x: 70, y: 50, s: 2 }, { x: 25, y: 65, s: 3 }, { x: 90, y: 40, s: 2 },
        ].map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.s}px`, height: `${p.s}px`,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#10b981' : '#06b6d4',
            boxShadow: `0 0 ${p.s * 4}px ${i % 2 === 0 ? '#10b981' : '#06b6d4'}`,
            animation: `glowPulse ${3 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }} />
        ))}

        {/* محتوای hero */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>

          {/* بج */}
          <div className="hero-badge" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '100px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', backdropFilter: 'blur(20px)', color: '#6ee7b7', fontSize: '13px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'glowPulse 2s infinite', display: 'inline-block' }} />
              پخش زنده مسابقات در حال برگزاری
              <Link href="/live" style={{ color: '#34d399', fontWeight: 700 }}>مشاهده</Link>
            </div>
          </div>

          {/* تیتر */}
          <div className="hero-title" style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: 'clamp(52px, 11vw, 130px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', margin: 0 }}>
              <span style={{ color: '#ffffff', textShadow: '0 0 80px rgba(255,255,255,0.1)' }}>بیلیارد </span>
              <span style={{
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 60%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
                filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.5))',
              }}>پلاس</span>
            </h1>
          </div>

          {/* زیرتیتر */}
          <div className="hero-sub" style={{ marginBottom: '40px', maxWidth: '560px' }}>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, margin: 0, letterSpacing: '0.02em' }}>
              پلتفرم تخصصی بیلیارد ایران
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', marginTop: '8px', letterSpacing: '0.12em' }}>
              RESERVE · COMPETE · SHOP · WATCH LIVE
            </p>
          </div>

          {/* دکمه‌ها */}
          <div className="hero-cta" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '56px' }}>
            <Link href="/clubs">
              <button className="btn-primary" style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#000',
                padding: '15px 36px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 30px rgba(16,185,129,0.3)',
              }}>
                <MapPin size={18} />
                یافتن باشگاه
              </button>
            </Link>
            <Link href="/live">
              <button className="btn-primary" style={{
                background: 'rgba(239,68,68,0.12)',
                color: '#fca5a5',
                padding: '15px 36px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 700,
                border: '1px solid rgba(239,68,68,0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(20px)',
              }}>
                <Radio size={18} />
                پخش زنده
              </button>
            </Link>
            <Link href="/register">
              <button className="btn-primary" style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.6)',
                padding: '15px 36px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(20px)',
              }}>
                <Zap size={18} />
                ثبت‌نام رایگان
              </button>
            </Link>
          </div>

          {/* آمار */}
          <div className="hero-stats" style={{ display: 'flex', gap: '48px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { value: '۴۳+', label: 'باشگاه فعال', color: '#10b981' },
              { value: '۱۲۴+', label: 'بازیکن', color: '#06b6d4' },
              { value: '۱۲+', label: 'مسابقه', color: '#a78bfa' },
              { value: '۸۷+', label: 'محصول', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '30px', fontWeight: 900, color: s.color, textShadow: `0 0 20px ${s.color}60` }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* اسکرول */}
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', animation: 'scrollBounce 2s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>SCROLL</span>
          <ArrowDown size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>

      {/* بقیه صفحه — با بکگراند تاریک */}
      <div style={{ backgroundColor: '#030a06', color: '#e2e8f0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 24px' }}>

          {/* باشگاه‌ها */}
          <section style={{ marginBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.2em', marginBottom: '8px', fontWeight: 600 }}>PREMIUM VENUES</div>
                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>باشگاه‌های برتر</h2>
                <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #10b981, transparent)', marginTop: '8px' }} />
              </div>
              <Link href="/clubs" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                مشاهده همه <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredClubs.map((club, i) => (
                <Link key={club.id} href={`/clubs/${club.id}`}>
                  <div className="card-hover" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ height: '140px', background: `linear-gradient(135deg, ${i === 0 ? '#064e3b, #065f46' : i === 1 ? '#0c4a6e, #0369a1' : '#3b0764, #6d28d9'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <Building2 size={36} style={{ color: 'rgba(255,255,255,0.1)' }} />
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#6ee7b7', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)', backdropFilter: 'blur(10px)' }}>
                        {club.type}
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontWeight: 800, color: '#e2e8f0', marginBottom: '8px', fontSize: '15px' }}>{club.name}</h3>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#4b5563', marginBottom: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} />{club.city}</span>
                        <span>{club.tables.toLocaleString('fa-IR')} میز</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={11} style={{ color: s <= Math.floor(club.rating) ? '#f59e0b' : '#1f2937', fill: s <= Math.floor(club.rating) ? '#f59e0b' : 'transparent' }} />
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

          {/* مسابقات */}
          <section style={{ marginBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#f59e0b', letterSpacing: '0.2em', marginBottom: '8px', fontWeight: 600 }}>UPCOMING EVENTS</div>
                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>مسابقات پیش رو</h2>
                <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #f59e0b, transparent)', marginTop: '8px' }} />
              </div>
              <Link href="/events" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                مشاهده همه <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {upcomingEvents.map((event, idx) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="card-hover" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '20px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === 0 ? '#10b981' : idx === 1 ? '#06b6d4' : '#a78bfa', boxShadow: `0 0 10px ${idx === 0 ? '#10b981' : idx === 1 ? '#06b6d4' : '#a78bfa'}` }} />
                      <span style={{ fontSize: '12px', color: '#4b5563' }}>{event.date}</span>
                    </div>
                    <h3 style={{ fontWeight: 800, color: '#e2e8f0', marginBottom: '16px', fontSize: '14px', lineHeight: 1.6 }}>{event.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#374151', marginBottom: '2px' }}>جایزه</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>{event.prize}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#374151', marginBottom: '2px' }}>ثبت‌نام</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>{event.participants.toLocaleString('fa-IR')}/{event.maxParticipants.toLocaleString('fa-IR')}</div>
                      </div>
                    </div>
                    <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px' }}>
                      <div style={{ height: '100%', background: idx === 0 ? '#10b981' : idx === 1 ? '#06b6d4' : '#a78bfa', borderRadius: '1px', width: `${(event.participants / event.maxParticipants) * 100}%` }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* اخبار */}
          <section style={{ marginBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#06b6d4', letterSpacing: '0.2em', marginBottom: '8px', fontWeight: 600 }}>LATEST NEWS</div>
                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>آخرین اخبار</h2>
                <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #06b6d4, transparent)', marginTop: '8px' }} />
              </div>
              <Link href="/news" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                مشاهده همه <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {latestNews.map((news, i) => (
                <Link key={news.id} href={`/news/${news.id}`}>
                  <div className="card-hover" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ height: '130px', background: `linear-gradient(135deg, ${i === 0 ? '#1a0a0a, #2d0f0f' : i === 1 ? '#0a0f1a, #0f1d2d' : '#0a1a0a, #0f2d0f'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <div style={{ fontSize: '36px', opacity: 0.15 }}>📰</div>
                      <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', color: news.categoryColor, background: `${news.categoryColor}15`, border: `1px solid ${news.categoryColor}30` }}>
                        {news.category}
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '13px', lineHeight: 1.6, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {news.title}
                      </h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#374151' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} />{news.date}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={10} />{news.views.toLocaleString('fa-IR')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* فروشگاه */}
          <section style={{ marginBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#a78bfa', letterSpacing: '0.2em', marginBottom: '8px', fontWeight: 600 }}>PREMIUM EQUIPMENT</div>
                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>فروشگاه تجهیزات</h2>
                <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #a78bfa, transparent)', marginTop: '8px' }} />
              </div>
              <Link href="/shop" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                مشاهده همه <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.map(product => (
                <Link key={product.id} href={`/shop/${product.id}`}>
                  <div className="card-hover" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ height: '110px', background: 'linear-gradient(135deg, #0a1a0f, #071510)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <ShoppingBag size={28} style={{ color: 'rgba(16,185,129,0.15)' }} />
                      {product.discountPercent > 0 && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.25)' }}>
                          {product.discountPercent.toLocaleString('fa-IR')}٪
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '12px' }}>
                      <h3 style={{ fontWeight: 700, color: '#cbd5e1', fontSize: '12px', lineHeight: 1.5, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.title}
                      </h3>
                      {product.discountPrice && (
                        <div style={{ fontSize: '10px', color: '#374151', textDecoration: 'line-through' }}>{product.price.toLocaleString('fa-IR')}</div>
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

          {/* CTA */}
          <section>
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04), transparent)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: '24px', padding: '60px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', background: 'radial-gradient(ellipse, rgba(16,185,129,0.04), transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.2em', marginBottom: '16px' }}>JOIN THE ELITE</div>
                <h2 style={{ fontSize: '40px', fontWeight: 900, color: '#f1f5f9', marginBottom: '12px', letterSpacing: '-0.02em' }}>همین الان شروع کن</h2>
                <p style={{ color: '#374151', marginBottom: '32px', fontSize: '16px' }}>رایگان ثبت‌نام کن و به جامعه بیلیارد ایران بپیوند</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <Link href="/register">
                    <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#000', padding: '14px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
                      <Zap size={18} />
                      ثبت‌نام رایگان
                    </button>
                  </Link>
                  <Link href="/clubs">
                    <button className="btn-primary" style={{ background: 'transparent', color: '#94a3b8', padding: '14px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={18} />
                      یافتن باشگاه
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}