'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import {
  Search, Bell, ChevronDown, User, X, Trophy,
  Users, BookOpen, ShoppingBag, Building2, Radio, Star, Wrench,
  Newspaper, Calendar, Menu, ArrowLeft, LogOut, Settings,
  Zap, Crown, LayoutDashboard, Factory, GraduationCap, Home, Store,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Stories from './Stories';

const GOLD = '#B8933A';
const GOLD_LIGHT = 'rgba(184,147,58,0.1)';
const GOLD_BORDER = 'rgba(184,147,58,0.22)';

const exploreMenu = [
  {
    title: 'بازیکنان و افراد',
    color: GOLD,
    items: [
      { href: '/coaches',      label: 'مربیان',         icon: <Star size={14} />,     desc: 'مربیان مجاز' },
      { href: '/referees',     label: 'داوران',          icon: <Trophy size={14} />,   desc: 'داوران رسمی' },
      { href: '/ranking',      label: 'رنکینگ',          icon: <Trophy size={14} />,   desc: 'جدول رنکینگ' },
    ],
  },
  {
    title: 'تجهیزات و خدمات',
    color: GOLD,
    items: [
      { href: '/sellers',       label: 'فروشندگان',   icon: <ShoppingBag size={14} />, desc: 'فروشندگان تجهیزات' },
      { href: '/manufacturers', label: 'تولیدکنندگان', icon: <Factory size={14} />,    desc: 'سازندگان تجهیزات' },
      { href: '/installers',    label: 'خدمات فنی',   icon: <Wrench size={14} />,     desc: 'نصب و راه‌اندازی'  },
      { href: '/live',          label: 'پخش زنده',    icon: <Radio size={14} />,      desc: 'پخش زنده مسابقات' },
    ],
  },
  {
    title: 'محتوا',
    color: GOLD,
    items: [
      { href: '/news',      label: 'اخبار',    icon: <Newspaper size={14} />,     desc: 'آخرین اخبار' },
      { href: '/education', label: 'آموزش',    icon: <GraduationCap size={14} />, desc: 'ویدیو آموزشی' },
      { href: '/about',     label: 'درباره ما', icon: <Users size={14} />,         desc: 'داستان بیلیارد هاب' },
      { href: '/contact',   label: 'تماس با ما',icon: <Bell size={14} />,          desc: 'پشتیبانی ۲۴/۷' },
    ],
  },
];

const mobileLinks = [
  { href: '/',              label: 'صفحه اصلی',              icon: <Home size={17} />,          color: GOLD,      desc: 'خانه بیلیارد هاب', isHome: true },
  { href: '/clubs',         label: 'باشگاه‌ها',               icon: <Building2 size={17} />,     color: GOLD,      desc: 'کلوب‌های بیلیارد' },
  { href: '/shop',          label: 'بیلیارد بازار',           icon: <ShoppingBag size={17} />,   color: GOLD,      desc: 'خرید تجهیزات' },
  { href: '/sellers',       label: 'فروشندگان',                icon: <Store size={17} />,         color: GOLD,      desc: 'فروشندگان تجهیزات' },
  { href: '/manufacturers', label: 'تولیدکنندگان',            icon: <Factory size={17} />,       color: GOLD,      desc: 'سازندگان تجهیزات' },
  { href: '/coaches',       label: 'مربیان',                  icon: <Star size={17} />,          color: GOLD,      desc: 'مربیان مجاز' },
  { href: '/referees',      label: 'داوران',                  icon: <Trophy size={17} />,        color: GOLD,      desc: 'داوران رسمی' },
  { href: '/players',       label: 'بازیکنان',                icon: <Users size={17} />,         color: GOLD,      desc: 'بازیکنان حرفه‌ای' },
  { href: '/tournaments',   label: 'مسابقات',                 icon: <Calendar size={17} />,      color: GOLD,      desc: 'تورنمنت‌ها' },
  { href: '/installers',    label: 'خدمات فنی',               icon: <Wrench size={17} />,        color: GOLD,      desc: 'نصب و راه‌اندازی' },
  { href: '/ranking',       label: 'رنکینگ',                  icon: <Trophy size={17} />,        color: GOLD,      desc: 'جدول رنکینگ' },
  { href: '/education',     label: 'آموزش',                   icon: <GraduationCap size={17} />, color: GOLD,      desc: 'ویدیو آموزشی' },
  { href: '/live',          label: 'پخش زنده',                icon: <Radio size={17} />,         color: '#ef4444', desc: 'پخش زنده مسابقات', live: true },
  { href: '/news',          label: 'اخبار',                   icon: <Newspaper size={17} />,     color: GOLD,      desc: 'آخرین اخبار' },
  { href: '/about',         label: 'درباره ما',               icon: <Users size={17} />,         color: '#8C7A5E',  desc: 'داستان ما' },
  { href: '/contact',       label: 'تماس با ما',              icon: <Bell size={17} />,          color: '#8C7A5E',  desc: 'پشتیبانی ۲۴/۷' },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const profileRef   = useRef<HTMLDivElement>(null);
  const exploreRef   = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLDivElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const isHomePage   = pathname === '/';
  const isShopPage   = pathname.startsWith('/shop');

  useEffect(() => {
    let ticking = false;
    const fn = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          setScrollY(window.scrollY);
          if (window.scrollY > 30) setSearchOpen(false);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setExploreOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const fn = (e: MouseEvent) => {
      if (
        searchRef.current && !searchRef.current.contains(e.target as Node) &&
        searchBtnRef.current && !searchBtnRef.current.contains(e.target as Node)
      ) { setSearchOpen(false); setSearch(''); }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [searchOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setExploreOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Adaptive theme: over dark hero = transparent/white-text, else = warm glass/dark-text
  const isLight = scrolled || !isHomePage;

  const navBg = isHomePage
    ? scrolled ? 'rgba(247,247,245,0.94)' : 'transparent'
    : 'rgba(247,247,245,0.94)';

  const TEXT      = isLight ? '#1C1C1A' : 'rgba(255,255,255,0.88)';
  const TEXT_MUT  = isLight ? 'rgba(28,28,26,0.48)' : 'rgba(255,255,255,0.48)';
  const BORDER_C  = isLight ? 'rgba(28,28,26,0.08)' : 'rgba(255,255,255,0.18)';
  const SURF      = isLight ? 'rgba(28,28,26,0.05)' : 'rgba(255,255,255,0.10)';

  if (isShopPage) return null;

  return (
    <>
      <style>{`
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 4px #ef4444;}50%{box-shadow:0 0 14px #ef4444;} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);} }
        @keyframes slideUp { from{opacity:0;transform:translateY(100%);}to{opacity:1;transform:translateY(0);} }
        @keyframes fadeIn { from{opacity:0;}to{opacity:1;} }

        .nav-a {
          position:relative; color:${TEXT_MUT}; font-size:14px; font-weight:500;
          padding:6px 2px; white-space:nowrap; text-decoration:none; transition:color 0.25s;
          letter-spacing:0.01em;
        }
        .nav-a::after {
          content:''; position:absolute; bottom:-2px; left:0; right:0; height:1.5px;
          background:linear-gradient(90deg,${GOLD},${GOLD}80); transform:scaleX(0); transition:transform 0.3s;
          border-radius:2px;
        }
        .nav-a:hover { color:${TEXT}; }
        .nav-a:hover::after { transform:scaleX(1); }
        .nav-a.active { color:${GOLD}; }
        .nav-a.active::after { transform:scaleX(1); }

        .exp-btn {
          display:flex; align-items:center; gap:5px; color:${TEXT_MUT};
          font-size:14px; font-weight:500; background:none; border:none; cursor:pointer;
          font-family:inherit; padding:6px 2px; transition:color 0.25s; white-space:nowrap;
        }
        .exp-btn:hover { color:${TEXT}; }

        .d-item {
          display:flex; align-items:flex-start; gap:10px; padding:10px 12px;
          border-radius:12px; text-decoration:none; transition:all 0.2s; cursor:pointer;
        }
        .d-item:hover { background:rgba(184,147,58,0.06); }
        .d-item:hover .d-label { color:#1C1C1A; }

        .d-icon { color:rgba(28,28,26,0.25); transition:color 0.2s; flex-shrink:0; margin-top:1px; }
        .d-item:hover .d-icon { color:${GOLD}; }
        .d-label { color:rgba(28,28,26,0.65); font-size:13px; font-weight:600; }
        .d-desc { color:rgba(28,28,26,0.3); font-size:11px; margin-top:1px; }

        .desk { display:flex !important; }
        .mob  { display:none  !important; }
        @media(max-width:900px) { .desk{display:none!important;} .mob{display:flex!important;} }
        @media(max-width:480px) { .srch-wrap{display:none!important;} }

        .mob-link-item { transition: background 0.15s, color 0.15s; }
        .mob-link-item:hover { background: rgba(184,147,58,0.06) !important; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: navBg,
        borderBottom: isLight ? `1px solid rgba(28,28,26,0.06)` : '1px solid transparent',
        backdropFilter: isLight ? 'blur(32px) saturate(1.8)' : 'none',
        transition: 'all 0.4s ease',
        boxShadow: isLight ? '0 1px 0 rgba(28,28,26,0.04), 0 4px 24px rgba(28,28,26,0.04)' : 'none',
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>

          {/* Logo */}
          <Link href="/" onClick={e => { if (pathname === '/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', boxShadow: `0 4px 18px rgba(184,147,58,0.38)`, flexShrink: 0 }}>
                <img src="/images/Logo/logo1.png" alt="بیلیارد هاب" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            <span style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.03em', whiteSpace: 'nowrap', transition: 'color 0.4s' }}>
              <span style={{ color: isLight ? '#000000' : '#ffffff' }}>بیلیارد</span>{' '}
              <span style={{ color: GOLD }}>هاب</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="desk" style={{ alignItems: 'center', gap: '24px', marginRight: '12px', flexShrink: 0 }}>
            <Link href="/clubs"   className={`nav-a ${pathname === '/clubs'   ? 'active' : ''}`}>باشگاه‌ها</Link>
            <Link href="/shop"    className={`nav-a ${pathname === '/shop'    ? 'active' : ''}`}>بیلیارد بازار</Link>
            <Link href="/players"     className={`nav-a ${pathname === '/players'     ? 'active' : ''}`}>بازیکنان</Link>
            <Link href="/tournaments" className={`nav-a ${pathname.startsWith('/tournaments') ? 'active' : ''}`}>مسابقات</Link>

            <div ref={exploreRef} style={{ position: 'relative' }}>
              <button className="exp-btn" onClick={() => setExploreOpen(p => !p)}>
                بیشتر
                <ChevronDown size={12} style={{ transition: 'transform 0.3s', transform: exploreOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>

              {exploreOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 16px)', right: '-20px',
                  width: '700px', maxWidth: '95vw',
                  background: 'rgba(252,251,249,0.88)',
                  border: '1px solid rgba(28,28,26,0.07)',
                  borderRadius: '24px',
                  boxShadow: '0 32px 80px rgba(28,28,26,0.14), 0 4px 16px rgba(28,28,26,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(48px) saturate(2)',
                  WebkitBackdropFilter: 'blur(48px) saturate(2)',
                  zIndex: 300,
                  animation: 'fadeDown 0.22s cubic-bezier(0.22,1,0.36,1) both',
                  overflow: 'hidden',
                }}>
                  {/* Top gold sheen */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(184,147,58,0.55),transparent)' }} />
                  <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '40px', background: 'linear-gradient(to bottom,rgba(184,147,58,0.06),transparent)', pointerEvents: 'none' }} />

                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 12px', borderBottom: '1px solid rgba(28,28,26,0.06)' }}>
                    <span style={{ fontSize: '10px', color: GOLD, letterSpacing: '0.28em', fontWeight: 700 }}>EXPLORE BILLIARD PLUS</span>
                    <button onClick={() => setExploreOpen(false)} style={{ background: 'rgba(28,28,26,0.05)', border: '1px solid rgba(28,28,26,0.08)', borderRadius: '8px', cursor: 'pointer', color: 'rgba(28,28,26,0.38)', padding: '5px', display: 'flex', transition: 'all 0.2s' }}>
                      <X size={12} />
                    </button>
                  </div>

                  {/* 3 columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '4px 0' }}>
                    {exploreMenu.map((section, si) => {
                      const colColor = si === 0 ? '#B8933A' : si === 1 ? '#3B82C4' : '#1E7A44';
                      const colColorLight = si === 0 ? '#C7A66A' : si === 1 ? '#4A9EFF' : '#30C55A';
                      return (
                        <div key={si} style={{ borderRight: si < 2 ? '1px solid rgba(28,28,26,0.06)' : 'none', padding: '16px 20px 20px' }}>
                          {/* Column header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${colColor}18` }}>
                            <div style={{ width: '3px', height: '12px', borderRadius: '2px', background: `linear-gradient(180deg,${colColorLight},${colColor})`, flexShrink: 0 }} />
                            <span style={{ fontSize: '10px', color: `${colColor}BB`, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase' }}>{section.title}</span>
                          </div>
                          {section.items.map((item, ii) => (
                            <Link key={ii} href={item.href} onClick={() => setExploreOpen(false)}
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '12px', textDecoration: 'none', marginBottom: '2px', border: '1px solid transparent', transition: 'background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease' }}
                              onMouseEnter={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = `linear-gradient(135deg,${colColor}0C 0%,${colColor}06 100%)`;
                                el.style.borderColor = `${colColor}1D`;
                                el.style.boxShadow = `inset 0 1.5px 0 rgba(255,255,255,0.27), inset 0 0 0 1px ${colColor}13, 0 6px 28px ${colColor}0E, 0 0 44px ${colColor}0A`;
                              }}
                              onMouseLeave={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = 'transparent';
                                el.style.borderColor = 'transparent';
                                el.style.boxShadow = 'none';
                              }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `linear-gradient(135deg,${colColorLight}22,${colColor}10)`, border: `1px solid ${colColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colColor, flexShrink: 0, transition: 'all 0.2s' }}>
                                {item.icon}
                              </div>
                              <div>
                                <div style={{ color: 'rgba(28,28,26,0.78)', fontSize: '13px', fontWeight: 600, lineHeight: 1.2 }}>{item.label}</div>
                                <div style={{ color: 'rgba(28,28,26,0.32)', fontSize: '11px', marginTop: '1px' }}>{item.desc}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom strip */}
                  <div style={{ margin: '4px 20px 18px', padding: '12px 18px', background: 'linear-gradient(135deg,rgba(184,147,58,0.07),rgba(184,147,58,0.03))', border: '1px solid rgba(184,147,58,0.16)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(28,28,26,0.7)' }}>اولین و بزرگترین پلتفرم تخصصی بیلیارد ایران</div>
                      <div style={{ fontSize: '11px', color: 'rgba(28,28,26,0.36)', marginTop: '2px' }}>اتصال بی واسطه جامعه بیلیارد</div>
                    </div>
                    <Link href="/register" onClick={() => setExploreOpen(false)} style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', background: `linear-gradient(135deg,${GOLD},#8C6A22)`, borderRadius: '20px', padding: '7px 16px', boxShadow: `0 4px 16px rgba(184,147,58,0.32)`, whiteSpace: 'nowrap' }}>
                      ثبت‌نام رایگان <ArrowLeft size={10} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="srch-wrap desk" style={{ flex: 1, maxWidth: '240px', marginRight: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: SURF, border: `1px solid ${BORDER_C}`, borderRadius: '10px', padding: '8px 12px', transition: 'all 0.3s' }}>
              <Search size={13} color={TEXT_MUT} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
                style={{ background: 'none', border: 'none', outline: 'none', color: TEXT, fontSize: '15px', width: '100%', fontFamily: 'inherit' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUT, padding: 0, display: 'flex' }}><X size={11} /></button>}
            </div>
          </div>

          {/* Right actions — all icon buttons 44×44px, icon size 22 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>

            {/* Search — mobile only */}
            <button ref={searchBtnRef} className="mob" onClick={() => setSearchOpen(p => !p)}
              style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: searchOpen ? GOLD_LIGHT : SURF, border: `1px solid ${searchOpen ? GOLD_BORDER : BORDER_C}`, borderRadius: '12px', cursor: 'pointer', color: searchOpen ? GOLD : TEXT_MUT, flexShrink: 0, transition: 'all 0.3s' }}>
              <Search size={20} />
            </button>

            {/* Bell — desktop only */}
            <button className="desk"
              style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '12px', color: TEXT_MUT, transition: 'color 0.2s', flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = TEXT }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MUT }}>
              <Bell size={22} />
              <span style={{ position: 'absolute', top: '9px', right: '9px', width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 6px #ef4444' }} />
            </button>

            {!user ? (
              <Link href="/login">
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}`, borderRadius: '12px', padding: '9px 16px', color: GOLD, fontSize: '14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.3s', backdropFilter: 'blur(12px)', height: '40px' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(184,147,58,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = GOLD_LIGHT }}>
                  <User size={16} /> ورود
                </button>
              </Link>
            ) : (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button onClick={() => setProfileOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: SURF, border: `1px solid ${BORDER_C}`, borderRadius: '12px', padding: '6px 12px', color: TEXT_MUT, fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s', backdropFilter: 'blur(12px)', height: '44px' }}>
                  <div style={{ width: '30px', height: '30px', background: `linear-gradient(135deg,${GOLD},#8C6A22)`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '15px', flexShrink: 0 }}>
                    {user.firstName?.[0]}
                  </div>
                  <span className="desk" style={{ alignItems: 'center', color: TEXT }}>{user.firstName}</span>
                  <ChevronDown size={13} style={{ transition: 'transform 0.3s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)', color: TEXT_MUT }} />
                </button>

                {profileOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, width: '200px', background: 'rgba(247,247,245,0.97)', border: '1px solid rgba(28,28,26,0.08)', borderRadius: '18px', boxShadow: '0 24px 60px rgba(28,28,26,0.14)', backdropFilter: 'blur(40px)', padding: '8px', zIndex: 300, animation: 'fadeDown 0.2s ease both' }}>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(28,28,26,0.06)', marginBottom: '6px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1C1C1A' }}>{user.firstName} {user.lastName}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(28,28,26,0.35)', marginTop: '2px' }}>
                        {({'admin':'ادمین سیستم','user':'کاربر','player':'بازیکن رنکینگی','coach':'مربی','referee':'داور','club_owner':'باشگاه‌دار','seller':'فروشنده','manufacturer':'تولیدکننده','installer':'متخصص نصب'} as Record<string,string>)[user.primaryRole] ?? user.primaryRole}
                      </div>
                    </div>
                    {[
                      { href: '/dashboard',       label: 'داشبورد',         icon: <LayoutDashboard size={13} /> },
                      { href: '/dashboard/shop',  label: 'فروشگاه من',      icon: <ShoppingBag size={13} /> },
                      ...(user.primaryRole === 'club_owner' || user.primaryRole === 'admin' ? [{ href: '/dashboard/club', label: 'مدیریت باشگاه', icon: <Building2 size={13} /> }] : []),
                      ...(user.primaryRole === 'admin'      ? [{ href: '/admin',           label: 'پنل ادمین',      icon: <Crown size={13} /> }] : []),
                      { href: '/profile',         label: 'ویرایش پروفایل', icon: <Settings size={13} /> },
                    ].map((item, i) => (
                      <Link key={i} href={item.href} onClick={() => setProfileOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', borderRadius: '10px', fontSize: '15px', color: 'rgba(28,28,26,0.55)', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(28,28,26,0.05)'; (e.currentTarget as HTMLElement).style.color = '#1C1C1A' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(28,28,26,0.55)' }}>
                        <span style={{ color: GOLD }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ height: '1px', background: 'rgba(28,28,26,0.06)', margin: '6px 0' }} />
                    <button onClick={() => { logout(); setProfileOpen(false); router.push('/'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', textAlign: 'right', padding: '9px 12px', borderRadius: '10px', fontSize: '15px', color: 'rgba(239,68,68,0.7)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.7)' }}>
                      <LogOut size={13} /> خروج
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger */}
            <button className="mob" onClick={() => setMobileOpen(p => !p)}
              style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: mobileOpen ? GOLD_LIGHT : SURF, border: `1px solid ${mobileOpen ? GOLD_BORDER : BORDER_C}`, color: mobileOpen ? GOLD : TEXT_MUT, cursor: 'pointer', flexShrink: 0, transition: 'all 0.3s' }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

      </nav>


      {/* Search pill — floats below navbar, no dark backdrop */}
      {searchOpen && (
        <div ref={searchRef} style={{
          position: 'fixed', top: '72px', left: 0, right: 0, zIndex: 180,
          padding: '8px clamp(16px,3vw,32px) 0',
          animation: 'fadeDown 0.32s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <div style={{
            maxWidth: '560px', margin: '0 auto',
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '20px', padding: '11px 16px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 6px 28px rgba(0,0,0,0.28)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          }}>
            <Search size={18} color="rgba(255,255,255,0.38)" style={{ flexShrink: 0 }} />
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو باشگاه، بازیکن، مربی..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.88)', fontSize: '16px', fontFamily: 'inherit' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.36)', padding: 0, display: 'flex', flexShrink: 0 }}>
                <X size={13} />
              </button>
            )}
            <button onClick={() => { setSearchOpen(false); setSearch(''); }}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.42)', padding: '4px', display: 'flex', flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#F7F5F0',
          overflowY: 'auto',
          animation: 'slideUp 0.32s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          {/* Header row — centered brand */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 20px 16px' }}>
            <img src="/images/Logo/BH.png" alt="بیلیارد هاب" style={{ height: '38px', width: 'auto', marginBottom: '8px' }} />
            <span style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '-0.02em' }}>
              <span style={{ color: '#FFFFFF', WebkitTextStroke: '0.4px rgba(28,28,26,0.22)', textShadow: '1px 1px 1px rgba(0,0,0,0.18), -1px -1px 0 rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.15)' }}>بیلیارد</span>{' '}
              <span style={{ color: GOLD }}>هاب</span>
            </span>
            <button onClick={() => setMobileOpen(false)}
              style={{ position: 'absolute', top: '16px', insetInlineStart: '20px', background: 'rgba(28,28,26,0.05)', border: '1px solid rgba(28,28,26,0.1)', borderRadius: '12px', cursor: 'pointer', color: 'rgba(28,28,26,0.5)', padding: '8px', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>

          {/* Gold separator */}
          <div style={{ height: '1px', background: `linear-gradient(90deg,transparent,${GOLD},transparent)` }} />

          {/* User section */}
          <div style={{ padding: '16px 20px' }}>
            {!user ? (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', borderRadius: '16px', background: 'linear-gradient(135deg,rgba(184,147,58,0.15),rgba(184,147,58,0.06))', border: `1px solid ${GOLD}`, color: GOLD, fontSize: '17px', fontWeight: 800, textDecoration: 'none' }}>
                <User size={17} /> ورود | ثبت‌نام رایگان
              </Link>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.7)', borderRadius: '16px', border: '1px solid rgba(28,28,26,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 12px rgba(28,28,26,0.05)' }}>
                <div style={{ width: '40px', height: '40px', background: `linear-gradient(135deg,${GOLD},#8C6A22)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '19px', flexShrink: 0 }}>
                  {user.firstName?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#1C1B17', fontWeight: 700, fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.firstName} {user.lastName}</div>
                  <div style={{ color: 'rgba(28,28,26,0.42)', fontSize: '13px', marginTop: '2px' }}>{user.primaryRole}</div>
                </div>
                <button onClick={() => { logout(); router.push('/'); setMobileOpen(false); }}
                  style={{ padding: '7px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)', color: '#ef4444', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <LogOut size={12} /> خروج
                </button>
              </div>
            )}
          </div>

          {/* Navigation section — light explore-menu style cards, 4 per row */}
          <div style={{ padding: '0 16px 8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
              {mobileLinks.map((item, i) => (
                <Link key={i} href={item.href} onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px',
                    padding: '12px 5px', borderRadius: '14px',
                    background: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(28,28,26,0.07)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 10px rgba(28,28,26,0.04)',
                    textDecoration: 'none', position: 'relative', overflow: 'hidden',
                    transition: 'background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `linear-gradient(135deg,${item.color}12,${item.color}06)`;
                    el.style.borderColor = `${item.color}33`;
                    el.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 20px ${item.color}22`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'rgba(255,255,255,0.72)';
                    el.style.borderColor = 'rgba(28,28,26,0.07)';
                    el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 10px rgba(28,28,26,0.04)';
                  }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: `linear-gradient(135deg,${item.color}22,${item.color}0D)`, border: `1px solid ${item.color}2E`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'rgba(28,28,26,0.72)', textAlign: 'center', lineHeight: 1.25 }}>{item.label}</span>
                  {item.live && (
                    <span style={{ position: 'absolute', top: '5px', insetInlineStart: '5px', fontSize: '7.5px', color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.26)', borderRadius: '20px', padding: '1px 4px', fontWeight: 700 }}>LIVE</span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom promo */}
          <div style={{ margin: '24px 20px 40px', padding: '18px 20px', background: 'rgba(184,147,58,0.10)', border: '1px solid rgba(184,147,58,0.22)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(28,28,26,0.78)' }}>اولین و بزرگترین پلتفرم تخصصی بیلیارد ایران</div>
              <div style={{ fontSize: '11px', color: 'rgba(28,28,26,0.42)', marginTop: '2px' }}>اتصال بی واسطه جامعه بیلیارد</div>
            </div>
            <Link href="/register" onClick={() => setMobileOpen(false)} style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', background: GOLD, borderRadius: '20px', padding: '8px 16px', whiteSpace: 'nowrap' }}>
              ثبت‌نام <ArrowLeft size={10} />
            </Link>
          </div>
        </div>
      )}

      {/* Stories — home only, slides down when search opens */}
      {isHomePage && (
        <div className="hero-stories-bar" style={{
          position: 'fixed',
          top: searchOpen ? '130px' : '72px',
          left: 0, right: 0, zIndex: 49,
          padding: '6px clamp(16px,3vw,32px) 4px',
          background: 'linear-gradient(to bottom,rgba(4,2,10,0.48) 0%,rgba(4,2,10,0) 100%)',
          opacity: Math.max(0, 1 - scrollY / 700),
          pointerEvents: scrollY > 560 ? 'none' : 'auto',
          transition: 'top 0.38s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <Stories />
          </div>
        </div>
      )}

      {!isHomePage && <div style={{ height: '72px' }} />}
    </>
  );
}
