'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import {
  Search, Bell, ShoppingCart, ChevronDown, User, X, Trophy,
  Users, BookOpen, ShoppingBag, Building2, Radio, Star, Wrench,
  Newspaper, Calendar, Menu, ArrowLeft,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Stories from './Stories';

const exploreMenu = [
  {
    title: 'بازیکنان و افراد',
    items: [
      { href: '/players',  label: 'بازیکنان',      icon: <Users size={15} />,   desc: 'بازیکنان حرفه‌ای' },
      { href: '/coaches',  label: 'مربیان',         icon: <Star size={15} />,    desc: 'مربیان مجاز' },
      { href: '/referees', label: 'داوران',          icon: <Trophy size={15} />,  desc: 'داوران رسمی' },
    ],
  },
  {
    title: 'فروشندگان',
    items: [
      { href: '/sellers',       label: 'فروشگاه‌ها',     icon: <ShoppingBag size={15} />, desc: 'فروشندگان تجهیزات' },
      { href: '/manufacturers', label: 'تولیدکنندگان',  icon: <Wrench size={15} />,      desc: 'سازندگان تجهیزات' },
      { href: '/installers',    label: 'متخصصین نصب',   icon: <Wrench size={15} />,      desc: 'نصب و راه‌اندازی' },
    ],
  },
  {
    title: 'محتوا و آموزش',
    items: [
      { href: '/news',      label: 'اخبار',    icon: <Newspaper size={15} />, desc: 'آخرین اخبار بیلیارد' },
      { href: '/events',    label: 'مسابقات',  icon: <Calendar size={15} />,  desc: 'رویدادها و مسابقات' },
      { href: '/education', label: 'آموزش',    icon: <BookOpen size={15} />,  desc: 'ویدیو و مطالب آموزشی' },
    ],
  },
];

const mobileLinks = [
  { href: '/clubs',     label: 'باشگاه‌ها',   icon: <Building2 size={17} /> },
  { href: '/shop',      label: 'فروشگاه',     icon: <ShoppingBag size={17} /> },
  { href: '/ranking',   label: 'رنکینگ', icon: <Trophy size={17} /> },
  { href: '/live',      label: 'پخش زنده',    icon: <Radio size={17} />, live: true },
  { href: '/news',      label: 'اخبار',       icon: <Newspaper size={17} /> },
  { href: '/events',    label: 'مسابقات',     icon: <Calendar size={17} /> },
  { href: '/education', label: 'آموزش',       icon: <BookOpen size={17} /> },
  { href: '/players',   label: 'بازیکنان',    icon: <Users size={17} /> },
  { href: '/coaches',   label: 'مربیان',      icon: <Star size={17} /> },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const exploreRef  = useRef<HTMLDivElement>(null);
  const isHomePage  = pathname === '/';

  useEffect(() => {
    let ticking = false;
    const fn = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          setScrollY(window.scrollY);
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
      if (exploreRef.current  && !exploreRef.current.contains(e.target as Node))  setExploreOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); setExploreOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navBg = isHomePage
    ? scrolled ? 'rgba(2,8,6,0.97)' : 'rgba(0,0,0,0)'
    : 'rgba(2,8,6,0.98)';

  const navBorder = isHomePage
    ? scrolled ? '1px solid rgba(16,185,129,0.1)' : '1px solid transparent'
    : '1px solid rgba(16,185,129,0.08)';

  return (
    <>
      <style>{`
        .nav-link {
          position: relative;
          color: rgba(255,255,255,0.55);
          font-size: 13px; font-weight: 500;
          padding: 6px 0;
          transition: color 0.3s ease;
          white-space: nowrap; text-decoration: none;
        }
        .nav-link:hover { color: rgba(255,255,255,0.95); }
        .nav-link::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 0; height: 1px;
          background: linear-gradient(90deg, #10b981, #06b6d4);
          transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }
        .explore-btn {
          display: flex; align-items: center; gap: 4px;
          color: rgba(255,255,255,0.55); font-size: 13px; font-weight: 500;
          padding: 6px 0; background: none; border: none;
          cursor: pointer; white-space: nowrap; font-family: inherit;
          transition: color 0.3s ease;
        }
        .explore-btn:hover { color: rgba(255,255,255,0.95); }
        .dil-icon  { color: rgba(26,46,36,0.3); transition: color 0.2s; margin-top:1px; flex-shrink:0; }
        .dil-label { color: rgba(26,46,36,0.75); font-size:13px; font-weight:600; }
        .dil-desc  { color: rgba(26,46,36,0.35); font-size:11px; margin-top:1px; }
        .dropdown-item-light {
          display:flex; align-items:flex-start; gap:10px;
          padding:10px 12px; border-radius:10px;
          transition:all 0.2s ease; cursor:pointer; text-decoration:none;
        }
        .dropdown-item-light:hover { background: rgba(16,185,129,0.08); }
        .dropdown-item-light:hover .dil-icon  { color: #10b981; }
        .dropdown-item-light:hover .dil-label { color: #0f2318; }
        .search-input::placeholder { color: rgba(255,255,255,0.22); }
        .search-input:focus { outline: none; }
        @keyframes dropdownIn {
          from { opacity:0; transform:translateY(-8px) scale(0.98); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
        .dropdown-anim { animation: dropdownIn 0.22s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 4px #ef4444; }
          50%      { box-shadow: 0 0 14px #ef4444; }
        }
        @keyframes mobileSlideIn {
          from { opacity:0; transform:translateX(20px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .desktop-nav { display: flex !important; }
        .mobile-only { display: none !important; }
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        @media (max-width: 480px) {
          .nav-search-wrap { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: navBg, borderBottom: navBorder,
        backdropFilter: scrolled || !isHomePage ? 'blur(24px) saturate(1.6)' : 'none',
        transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
      }}>
        <div style={{
          maxWidth: '1440px', margin: '0 auto',
          padding: '0 clamp(16px, 3vw, 32px)',
          height: '62px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              B
            </div>
            <span style={{ fontWeight: 900, fontSize: '15px', color: '#fff', letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>
              بیلیارد <span style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>پلاس</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="desktop-nav" style={{ alignItems: 'center', gap: '22px', marginRight: '10px', flexShrink: 0 }}>
            <Link href="/clubs"    className="nav-link">باشگاه‌ها</Link>
            <Link href="/shop"     className="nav-link">فروشگاه</Link>
            <Link href="/ranking" className="nav-link">رنکینگ</Link>
            <Link href="/live" style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.55)', fontSize:'13px', fontWeight:500, padding:'6px 0', textDecoration:'none', transition:'color 0.3s', whiteSpace:'nowrap' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 8px #ef4444', display:'inline-block', animation:'glowPulse 2s infinite', flexShrink:0 }} />
              زنده
            </Link>

            {/* Explore dropdown */}
            <div ref={exploreRef} style={{ position: 'relative' }}>
              <button className="explore-btn" onClick={() => setExploreOpen(p => !p)}>
                بیشتر
                <ChevronDown size={12} style={{ transition: 'transform 0.3s', transform: exploreOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>

              {exploreOpen && (
                <div className="dropdown-anim" style={{
                  position: 'absolute', top: 'calc(100% + 18px)', right: '-16px',
                  width: '560px', maxWidth: '90vw',
                  background: 'rgba(255,255,255,0.97)',
                  border: '1px solid rgba(16,185,129,0.14)',
                  borderRadius: '20px',
                  boxShadow: '0 28px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(16,185,129,0.05)',
                  backdropFilter: 'blur(32px)',
                  padding: '18px', zIndex: 200,
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', paddingBottom:'10px', borderBottom:'1px solid rgba(16,185,129,0.08)' }}>
                    <span style={{ fontSize:'10px', color:'#10b981', letterSpacing:'0.18em', fontWeight:700 }}>EXPLORE BILLIARD PLUS</span>
                    <button onClick={() => setExploreOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(26,46,36,0.3)', padding:'2px', display:'flex' }}><X size={13} /></button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'6px' }}>
                    {exploreMenu.map((section, si) => (
                      <div key={si}>
                        <div style={{ fontSize:'9px', color:'rgba(26,46,36,0.3)', letterSpacing:'0.18em', fontWeight:700, marginBottom:'5px', padding:'0 12px', textTransform:'uppercase' }}>
                          {section.title}
                        </div>
                        {section.items.map((item, ii) => (
                          <Link key={ii} href={item.href} className="dropdown-item-light" onClick={() => setExploreOpen(false)}>
                            <span className="dil-icon">{item.icon}</span>
                            <div>
                              <div className="dil-label">{item.label}</div>
                              <div className="dil-desc">{item.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:'12px', paddingTop:'10px', borderTop:'1px solid rgba(16,185,129,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'11px', color:'rgba(26,46,36,0.3)' }}>پلتفرم تخصصی بیلیارد ایران</span>
                    <Link href="/register" onClick={() => setExploreOpen(false)} style={{ fontSize:'12px', color:'#10b981', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:'4px' }}>
                      ثبت‌نام رایگان <ArrowLeft size={11} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="nav-search-wrap" style={{ flex: 1, maxWidth: '260px', marginRight: 'auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'8px 13px', transition:'all 0.3s' }}>
              <Search size={13} style={{ color:'rgba(255,255,255,0.22)', flexShrink:0 }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="جستجو..." className="search-input"
                style={{ background:'none', border:'none', color:'#fff', fontSize:'13px', width:'100%' }} />
              {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:0, display:'flex' }}><X size={11} /></button>}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
            <button className="desktop-nav" style={{ position:'relative', background:'none', border:'none', cursor:'pointer', padding:'8px', borderRadius:'8px', color:'rgba(255,255,255,0.35)', transition:'color 0.2s', alignItems:'center', justifyContent:'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>
              <Bell size={17} />
              <span style={{ position:'absolute', top:'7px', right:'7px', width:'5px', height:'5px', background:'#ef4444', borderRadius:'50%', boxShadow:'0 0 6px #ef4444' }} />
            </button>

            <Link href="/shop" className="desktop-nav" style={{ padding:'8px', borderRadius:'8px', color:'rgba(255,255,255,0.35)', alignItems:'center', transition:'color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>
              <ShoppingCart size={17} />
            </Link>

            {!user ? (
              <Link href="/login">
                <button style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'10px', padding:'7px 14px', color:'#6ee7b7', fontSize:'13px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', transition:'all 0.3s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.14)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.08)'; }}>
                  <User size={13} /> ورود
                </button>
              </Link>
            ) : (
              <div ref={profileRef} style={{ position:'relative' }}>
                <button onClick={() => setProfileOpen(p => !p)} style={{ display:'flex', alignItems:'center', gap:'7px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'5px 10px', color:'rgba(255,255,255,0.65)', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.3s' }}>
                  <div style={{ width:'26px', height:'26px', background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:'12px', flexShrink:0 }}>
                    {user.firstName?.[0]}
                  </div>
                  <span className="desktop-nav" style={{ alignItems:'center' }}>{user.firstName}</span>
                  <ChevronDown size={11} style={{ transition:'transform 0.3s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>

                {profileOpen && (
                  <div className="dropdown-anim" style={{ position:'absolute', top:'calc(100% + 10px)', left:0, width:'185px', background:'rgba(255,255,255,0.97)', border:'1px solid rgba(16,185,129,0.1)', borderRadius:'16px', boxShadow:'0 20px 60px rgba(0,0,0,0.18)', backdropFilter:'blur(32px)', padding:'7px', zIndex:200 }}>
                    {[
                      { href:'/dashboard',        label:'داشبورد' },
                      { href:'/dashboard/shop',   label:'فروشگاه من' },
                      ...(user.primaryRole === 'club_owner' ? [{ href:'/dashboard/club', label:'مدیریت باشگاه' }] : []),
                      ...(user.primaryRole === 'admin'      ? [{ href:'/admin',          label:'⚡ پنل ادمین' }]  : []),
                      { href:'/profile', label:'ویرایش پروفایل' },
                    ].map((item, i) => (
                      <Link key={i} href={item.href} onClick={() => setProfileOpen(false)}
                        style={{ display:'block', padding:'9px 12px', borderRadius:'10px', fontSize:'13px', color:'rgba(26,46,36,0.65)', fontWeight:500, textDecoration:'none', transition:'all 0.2s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(16,185,129,0.08)'; (e.currentTarget as HTMLElement).style.color='#0f2318'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(26,46,36,0.65)'; }}>
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ height:'1px', background:'rgba(16,185,129,0.08)', margin:'4px 0' }} />
                    <button onClick={() => { logout(); setProfileOpen(false); router.push('/'); }}
                      style={{ display:'block', width:'100%', textAlign:'right', padding:'9px 12px', borderRadius:'10px', fontSize:'13px', color:'rgba(239,68,68,0.65)', fontWeight:500, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.07)'; (e.currentTarget as HTMLElement).style.color='#dc2626'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(239,68,68,0.65)'; }}>
                      خروج
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger */}
            <button className="mobile-only"
              onClick={() => setMobileOpen(p => !p)}
              style={{ padding:'8px', borderRadius:'9px', background: mobileOpen ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border:`1px solid ${mobileOpen ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`, color: mobileOpen ? '#10b981' : 'rgba(255,255,255,0.6)', cursor:'pointer', alignItems:'center', justifyContent:'center', transition:'all 0.3s' }}>
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div style={{
            position: 'fixed', top: '62px', left: 0, right: 0, bottom: 0,
            zIndex: 9999, background: 'rgba(2,8,6,0.98)', backdropFilter: 'blur(24px)',
            overflowY: 'auto', padding: '0 0 40px',
            animation: 'mobileSlideIn 0.28s cubic-bezier(0.22,1,0.36,1) forwards',
          }}>
            <div style={{ height:'1px', background:'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)', marginBottom:'8px' }} />

            <div style={{ padding:'20px 20px 16px' }}>
              {!user ? (
                <Link href="/login" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'15px', borderRadius:'16px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:'15px', fontWeight:800, textDecoration:'none', boxShadow:'0 8px 28px rgba(16,185,129,0.3)' }}>
                  <User size={17} /> ورود / ثبت‌نام رایگان
                </Link>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px', background:'rgba(255,255,255,0.04)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ width:'38px', height:'38px', background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:'16px', flexShrink:0 }}>
                    {user.firstName?.[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:'#f0faf5', fontWeight:700, fontSize:'14px' }}>{user.firstName} {user.lastName}</div>
                    <div style={{ color:'rgba(240,250,245,0.35)', fontSize:'11px', marginTop:'2px' }}>{user.primaryRole}</div>
                  </div>
                  <button onClick={() => { logout(); router.push('/'); setMobileOpen(false); }}
                    style={{ padding:'7px 14px', borderRadius:'10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    خروج
                  </button>
                </div>
              )}
            </div>

            <div style={{ height:'1px', background:'rgba(255,255,255,0.04)', margin:'0 20px 12px' }} />

            <div style={{ padding:'0 12px', display:'flex', flexDirection:'column', gap:'2px' }}>
              {mobileLinks.map((item, i) => (
                <Link key={i} href={item.href}
                  style={{ display:'flex', alignItems:'center', gap:'14px', padding:'13px 14px', borderRadius:'14px', color:'rgba(240,250,245,0.55)', fontSize:'15px', fontWeight:500, textDecoration:'none', transition:'all 0.2s', animation:`mobileSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s both` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(16,185,129,0.08)'; (e.currentTarget as HTMLElement).style.color='#f0faf5'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(240,250,245,0.55)'; }}>
                  <span style={{ color: (item as any).live ? '#ef4444' : 'rgba(16,185,129,0.6)', display:'flex', flexShrink:0 }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {(item as any).live && (
                    <span style={{ marginRight:'auto', fontSize:'9px', color:'#ef4444', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'20px', padding:'2px 8px', fontWeight:700, letterSpacing:'0.08em' }}>LIVE</span>
                  )}
                </Link>
              ))}
            </div>

            <div style={{ margin:'24px 20px 0', padding:'16px', background:'rgba(16,185,129,0.04)', borderRadius:'16px', border:'1px solid rgba(16,185,129,0.1)', textAlign:'center' }}>
              <div style={{ fontSize:'10px', color:'rgba(16,185,129,0.5)', letterSpacing:'0.2em', fontWeight:700, marginBottom:'6px' }}>BILLIARD PLUS</div>
              <div style={{ fontSize:'12px', color:'rgba(240,250,245,0.3)' }}>اولین اکوسیستم جامع بیلیارد ایران</div>
            </div>
          </div>
        )}
      </nav>

      {/* Stories — home only */}
      {isHomePage && (
        <div style={{
          position: 'fixed', top: '62px', left: 0, right: 0, zIndex: 49,
          padding: 'clamp(8px,1.5vw,12px) clamp(16px,3vw,32px)',
          opacity: Math.max(0, 1 - scrollY / 700),
          pointerEvents: scrollY > 560 ? 'none' : 'auto',
          transition: 'opacity 0.1s linear',
        }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <Stories />
          </div>
        </div>
      )}

      {!isHomePage && <div style={{ height: '62px' }} />}
    </>
  );
}
