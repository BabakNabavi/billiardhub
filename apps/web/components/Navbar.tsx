'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useCartStore } from '../store/cart.store';
import {
  Search, Bell, ShoppingCart, ChevronDown, User, X, Trophy,
  Users, BookOpen, ShoppingBag, Building2, Radio, Star, Wrench,
  Newspaper, Calendar, Menu, ArrowLeft, LogOut, Settings,
  Zap, Crown, LayoutDashboard, Factory, GraduationCap, Home,
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
      { href: '/players',  label: 'بازیکنان',      icon: <Users size={14} />,   desc: 'بازیکنان حرفه‌ای' },
      { href: '/coaches',  label: 'مربیان',         icon: <Star size={14} />,    desc: 'مربیان مجاز' },
      { href: '/referees', label: 'داوران',          icon: <Trophy size={14} />,  desc: 'داوران رسمی' },
      { href: '/ranking',  label: 'رنکینگ',          icon: <Trophy size={14} />,  desc: 'جدول رنکینگ' },
    ],
  },
  {
    title: 'تجهیزات و خدمات',
    color: GOLD,
    items: [
      { href: '/sellers',       label: 'فروشندگان تجهیزات', icon: <ShoppingBag size={14} />, desc: 'فروشندگان تجهیزات' },
      { href: '/manufacturers', label: 'تولیدکنندگان',       icon: <Factory size={14} />,    desc: 'سازندگان تجهیزات' },
      { href: '/installers',    label: 'متخصصین نصب و تعمیر', icon: <Wrench size={14} />,  desc: 'نصب و راه‌اندازی' },
    ],
  },
  {
    title: 'محتوا',
    color: GOLD,
    items: [
      { href: '/news',      label: 'اخبار',    icon: <Newspaper size={14} />,     desc: 'آخرین اخبار' },
      { href: '/events',    label: 'مسابقات',  icon: <Calendar size={14} />,       desc: 'رویدادها' },
      { href: '/education', label: 'آموزش',    icon: <GraduationCap size={14} />, desc: 'ویدیو آموزشی' },
      { href: '/about',     label: 'درباره ما', icon: <Users size={14} />,         desc: 'داستان بیلیارد پلاس' },
      { href: '/contact',   label: 'تماس با ما',icon: <Bell size={14} />,          desc: 'پشتیبانی ۲۴/۷' },
    ],
  },
];

const mobileLinks = [
  { href: '/',              label: 'صفحه اصلی',            icon: <Home size={18} />,          color: GOLD, isHome: true },
  { href: '/clubs',         label: 'باشگاه‌ها',             icon: <Building2 size={18} />,     color: GOLD },
  { href: '/shop',          label: 'بیلیارد بازار',         icon: <ShoppingBag size={18} />,   color: GOLD },
  { href: '/cart',          label: 'سبد خرید',              icon: <ShoppingCart size={18} />,  color: GOLD, isCart: true },
  { href: '/players',       label: 'بازیکنان',              icon: <Users size={18} />,          color: GOLD },
  { href: '/live',          label: 'پخش زنده',              icon: <Radio size={18} />,          color: '#ef4444', live: true },
  { href: '/coaches',       label: 'مربیان',                icon: <Star size={18} />,           color: GOLD },
  { href: '/referees',      label: 'داوران',                icon: <Trophy size={18} />,         color: GOLD },
  { href: '/ranking',       label: 'رنکینگ',                icon: <Trophy size={18} />,         color: GOLD },
  { href: '/sellers',       label: 'فروشندگان تجهیزات',     icon: <ShoppingBag size={18} />,   color: GOLD },
  { href: '/manufacturers', label: 'تولیدکنندگان',          icon: <Factory size={18} />,        color: GOLD },
  { href: '/installers',    label: 'متخصصین نصب و تعمیر',  icon: <Wrench size={18} />,         color: GOLD },
  { href: '/education',     label: 'آموزش',                 icon: <GraduationCap size={18} />, color: GOLD },
  { href: '/events',        label: 'مسابقات',               icon: <Calendar size={18} />,       color: GOLD },
  { href: '/news',          label: 'اخبار',                 icon: <Newspaper size={18} />,      color: GOLD },
  { href: '/about',         label: 'درباره ما',             icon: <Users size={18} />,          color: '#8C7A5E' },
  { href: '/contact',       label: 'تماس با ما',            icon: <Bell size={18} />,           color: '#8C7A5E' },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const cartCount = useCartStore(s => s.totalItems());
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
      ) setSearchOpen(false);
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
  const BORDER_C  = isLight ? 'rgba(28,28,26,0.08)' : 'rgba(0,0,0,0.08)';
  const SURF      = isLight ? 'rgba(28,28,26,0.05)' : 'rgba(0,0,0,0.05)';

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
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `linear-gradient(135deg,${GOLD},#8C6A22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#fff', boxShadow: `0 4px 18px rgba(184,147,58,0.38)` }}>B</div>
            <span style={{ fontWeight: 900, fontSize: '18px', color: TEXT, letterSpacing: '-0.03em', whiteSpace: 'nowrap', transition: 'color 0.4s' }}>
              بیلیارد{' '}
              <span style={{ color: GOLD }}>پلاس</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="desk" style={{ alignItems: 'center', gap: '24px', marginRight: '12px', flexShrink: 0 }}>
            <Link href="/clubs"   className={`nav-a ${pathname === '/clubs'   ? 'active' : ''}`}>باشگاه‌ها</Link>
            <Link href="/shop"    className={`nav-a ${pathname === '/shop'    ? 'active' : ''}`}>بیلیارد بازار</Link>
            <Link href="/players" className={`nav-a ${pathname === '/players' ? 'active' : ''}`}>بازیکنان</Link>
            <Link href="/live" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: TEXT_MUT, fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'color 0.25s', whiteSpace: 'nowrap', padding: '6px 2px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = TEXT }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MUT }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'glowPulse 2s infinite', flexShrink: 0 }} />
              پخش زنده
            </Link>

            <div ref={exploreRef} style={{ position: 'relative' }}>
              <button className="exp-btn" onClick={() => setExploreOpen(p => !p)}>
                بیشتر
                <ChevronDown size={12} style={{ transition: 'transform 0.3s', transform: exploreOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>

              {exploreOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 16px)', right: '-20px',
                  width: '580px', maxWidth: '95vw',
                  background: 'rgba(247,247,245,0.97)',
                  border: '1px solid rgba(28,28,26,0.08)',
                  borderRadius: '24px',
                  boxShadow: '0 32px 80px rgba(28,28,26,0.16), 0 4px 16px rgba(28,28,26,0.06)',
                  backdropFilter: 'blur(40px) saturate(1.6)',
                  padding: '20px', zIndex: 300,
                  animation: 'fadeDown 0.22s cubic-bezier(0.22,1,0.36,1) both',
                }}>
                  <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '1px', background: `linear-gradient(90deg,transparent,${GOLD},transparent)` }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(28,28,26,0.06)' }}>
                    <span style={{ fontSize: '9px', color: `${GOLD}`, letterSpacing: '0.22em', fontWeight: 700, opacity: 0.7 }}>EXPLORE BILLIARD PLUS</span>
                    <button onClick={() => setExploreOpen(false)} style={{ background: 'rgba(28,28,26,0.05)', border: '1px solid rgba(28,28,26,0.08)', borderRadius: '8px', cursor: 'pointer', color: 'rgba(28,28,26,0.4)', padding: '4px', display: 'flex' }}>
                      <X size={12} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {exploreMenu.map((section, si) => (
                      <div key={si}>
                        <div style={{ fontSize: '9px', color: `${GOLD}80`, letterSpacing: '0.18em', fontWeight: 700, marginBottom: '6px', padding: '0 12px', textTransform: 'uppercase' }}>{section.title}</div>
                        {section.items.map((item, ii) => (
                          <Link key={ii} href={item.href} className="d-item" onClick={() => setExploreOpen(false)}>
                            <span className="d-icon">{item.icon}</span>
                            <div>
                              <div className="d-label">{item.label}</div>
                              <div className="d-desc">{item.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(28,28,26,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(28,28,26,0.25)' }}>پلتفرم تخصصی بیلیارد ایران</span>
                    <Link href="/register" onClick={() => setExploreOpen(false)} style={{ fontSize: '11px', color: GOLD, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}`, borderRadius: '20px', padding: '5px 12px' }}>
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
                style={{ background: 'none', border: 'none', outline: 'none', color: TEXT, fontSize: '13px', width: '100%', fontFamily: 'inherit' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUT, padding: 0, display: 'flex' }}><X size={11} /></button>}
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>

            <button ref={searchBtnRef} className="mob" onClick={() => setSearchOpen(p => !p)} style={{ width: '44px', height: '44px', background: SURF, border: `1px solid ${BORDER_C}`, borderRadius: '12px', cursor: 'pointer', color: TEXT_MUT, alignItems: 'center', justifyContent: 'center' }}>
              <Search size={18} />
            </button>

            <button className="desk" style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: TEXT_MUT, transition: 'color 0.2s', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = TEXT }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MUT }}>
              <Bell size={17} />
              <span style={{ position: 'absolute', top: '7px', right: '7px', width: '5px', height: '5px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 6px #ef4444' }} />
            </button>

            <Link href="/cart" className="desk" style={{ padding: '8px', borderRadius: '8px', color: TEXT_MUT, alignItems: 'center', transition: 'color 0.2s', position: 'relative' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GOLD }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MUT }}>
              <ShoppingCart size={17} />
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: 2, left: 2, minWidth: 16, height: 16, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#8C6A22)`, color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: `0 2px 8px rgba(184,147,58,0.5)` }}>
                  {cartCount > 9 ? '۹+' : String(cartCount).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)}
                </span>
              )}
            </Link>

            {!user ? (
              <Link href="/login">
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}`, borderRadius: '10px', padding: '7px 14px', color: GOLD, fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.3s', backdropFilter: 'blur(12px)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(184,147,58,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = GOLD_LIGHT }}>
                  <User size={13} /> ورود
                </button>
              </Link>
            ) : (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button onClick={() => setProfileOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: SURF, border: `1px solid ${BORDER_C}`, borderRadius: '10px', padding: '5px 10px', color: TEXT_MUT, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s', backdropFilter: 'blur(12px)' }}>
                  <div style={{ width: '26px', height: '26px', background: `linear-gradient(135deg,${GOLD},#8C6A22)`, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '12px', flexShrink: 0 }}>
                    {user.firstName?.[0]}
                  </div>
                  <span className="desk" style={{ alignItems: 'center', color: TEXT }}>{user.firstName}</span>
                  <ChevronDown size={11} style={{ transition: 'transform 0.3s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)', color: TEXT_MUT }} />
                </button>

                {profileOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, width: '200px', background: 'rgba(247,247,245,0.97)', border: '1px solid rgba(28,28,26,0.08)', borderRadius: '18px', boxShadow: '0 24px 60px rgba(28,28,26,0.14)', backdropFilter: 'blur(40px)', padding: '8px', zIndex: 300, animation: 'fadeDown 0.2s ease both' }}>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(28,28,26,0.06)', marginBottom: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1C1A' }}>{user.firstName} {user.lastName}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(28,28,26,0.35)', marginTop: '2px' }}>
                        {({'admin':'ادمین سیستم','user':'کاربر','player':'بازیکن رنکینگی','coach':'مربی','referee':'داور','club_owner':'باشگاه‌دار','seller':'فروشنده','manufacturer':'تولیدکننده','installer':'متخصص نصب'} as Record<string,string>)[user.primaryRole] ?? user.primaryRole}
                      </div>
                    </div>
                    {[
                      { href: '/dashboard',       label: 'داشبورد',         icon: <LayoutDashboard size={13} /> },
                      { href: '/dashboard/shop',  label: 'فروشگاه من',      icon: <ShoppingBag size={13} /> },
                      ...(user.primaryRole === 'club_owner' ? [{ href: '/dashboard/club', label: 'مدیریت باشگاه', icon: <Building2 size={13} /> }] : []),
                      ...(user.primaryRole === 'admin'      ? [{ href: '/admin',           label: 'پنل ادمین',      icon: <Crown size={13} /> }] : []),
                      { href: '/profile',         label: 'ویرایش پروفایل', icon: <Settings size={13} /> },
                    ].map((item, i) => (
                      <Link key={i} href={item.href} onClick={() => setProfileOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', borderRadius: '10px', fontSize: '13px', color: 'rgba(28,28,26,0.55)', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(28,28,26,0.05)'; (e.currentTarget as HTMLElement).style.color = '#1C1C1A' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(28,28,26,0.55)' }}>
                        <span style={{ color: GOLD }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ height: '1px', background: 'rgba(28,28,26,0.06)', margin: '6px 0' }} />
                    <button onClick={() => { logout(); setProfileOpen(false); router.push('/'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', textAlign: 'right', padding: '9px 12px', borderRadius: '10px', fontSize: '13px', color: 'rgba(239,68,68,0.7)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
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
              style={{ padding: '10px', borderRadius: '12px', background: mobileOpen ? GOLD_LIGHT : SURF, border: `1px solid ${mobileOpen ? GOLD_BORDER : BORDER_C}`, color: mobileOpen ? GOLD : TEXT_MUT, cursor: 'pointer', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

      </nav>

      {/* Mobile search bar — liquid glass, right below navbar, closes on scroll */}
      {searchOpen && (
        <div ref={searchRef} style={{
          position: 'fixed',
          top: '72px',
          left: 0, right: 0, zIndex: 180,
          padding: '10px clamp(16px,3vw,32px) 12px',
          background: 'linear-gradient(to bottom, rgba(18,10,32,0.58), rgba(10,5,20,0.46))',
          backdropFilter: 'blur(52px) saturate(240%)',
          WebkitBackdropFilter: 'blur(52px) saturate(240%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          animation: 'fadeDown 0.32s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px', padding: '12px 16px',
            boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.12), 0 2px 12px rgba(0,0,0,0.14)',
          }}>
            <Search size={16} color="rgba(255,255,255,0.36)" />
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو باشگاه، بازیکن، مربی..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.88)', fontSize: '14px', fontFamily: 'inherit' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.36)', padding: 0, display: 'flex' }}><X size={13} /></button>}
            <button onClick={() => setSearchOpen(false)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', padding: '5px', display: 'flex', flexShrink: 0 }}><X size={13} /></button>
          </div>
        </div>
      )}

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#F7F7F5',
          overflowY: 'auto',
          paddingTop: '72px',
          animation: 'fadeIn 0.25s ease both',
        }}>
          <div style={{ height: '1px', background: `linear-gradient(90deg,transparent,${GOLD},transparent)` }} />

          <div style={{ padding: '20px 20px 0' }}>
            {!user ? (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', borderRadius: '16px', background: `linear-gradient(135deg,${GOLD},#8C6A22)`, color: '#fff', fontSize: '15px', fontWeight: 800, textDecoration: 'none', boxShadow: `0 8px 28px rgba(184,147,58,0.3)` }}>
                <User size={17} /> ورود / ثبت‌نام رایگان
              </Link>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: '16px', border: '1px solid rgba(28,28,26,0.07)', backdropFilter: 'blur(16px)' }}>
                <div style={{ width: '40px', height: '40px', background: `linear-gradient(135deg,${GOLD},#8C6A22)`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '17px', flexShrink: 0 }}>
                  {user.firstName?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#1C1C1A', fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.firstName} {user.lastName}</div>
                  <div style={{ color: 'rgba(28,28,26,0.4)', fontSize: '11px', marginTop: '2px' }}>{user.primaryRole}</div>
                </div>
                <button onClick={() => { logout(); router.push('/'); setMobileOpen(false); }}
                  style={{ padding: '7px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <LogOut size={12} /> خروج
                </button>
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: 'rgba(28,28,26,0.06)', margin: '16px 20px' }} />

          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {mobileLinks.map((item, i) => (
              <Link key={i} href={item.href} onClick={() => setMobileOpen(false)}
                className="mob-link-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 14px', borderRadius: '12px',
                  color: item.isHome ? '#1C1C1A' : 'rgba(28,28,26,0.55)',
                  fontSize: '15px', fontWeight: item.isHome ? 600 : 500,
                  textDecoration: 'none',
                  ...(item.isHome ? { borderBottom: '1px solid rgba(28,28,26,0.06)', marginBottom: '4px', paddingBottom: '14px' } : {}),
                }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${item.color}12`, border: `1px solid ${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
                {item.live && (
                  <span style={{ marginRight: 'auto', fontSize: '9px', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '20px', padding: '2px 8px', fontWeight: 700 }}>LIVE</span>
                )}
                {(item as { isCart?: boolean }).isCart && cartCount > 0 && (
                  <span style={{ marginRight: 'auto', fontSize: '10px', color: '#fff', background: `linear-gradient(135deg,${GOLD},#8C6A22)`, borderRadius: '20px', padding: '1px 8px', fontWeight: 800, minWidth: 20, textAlign: 'center' }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div style={{ margin: '20px 20px 40px', padding: '16px', background: GOLD_LIGHT, borderRadius: '16px', border: `1px solid ${GOLD_BORDER}`, textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: GOLD, letterSpacing: '0.22em', fontWeight: 700, marginBottom: '5px', opacity: 0.7 }}>BILLIARD PLUS</div>
            <div style={{ fontSize: '12px', color: 'rgba(28,28,26,0.4)' }}>اولین اکوسیستم جامع بیلیارد ایران</div>
          </div>
        </div>
      )}

      {/* Stories — home only, slides down when search opens */}
      {isHomePage && (
        <div style={{
          position: 'fixed',
          top: searchOpen ? '158px' : '72px',
          left: 0, right: 0, zIndex: 49,
          padding: '6px clamp(16px,3vw,32px) 4px',
          background: 'linear-gradient(to bottom,rgba(4,2,10,0.48) 0%,rgba(4,2,10,0) 100%)',
          opacity: Math.max(0, 1 - scrollY / 700),
          pointerEvents: scrollY > 560 ? 'none' : 'auto',
          transition: 'top 0.38s cubic-bezier(0.22,1,0.36,1), opacity 0.1s linear',
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
