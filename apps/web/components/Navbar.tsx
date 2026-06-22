'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import {
  Search, Bell, ShoppingCart, ChevronDown, User, X, Trophy,
  Users, BookOpen, ShoppingBag, Building2, Radio, Star, Wrench,
  Newspaper, Calendar, Menu, ArrowLeft, LogOut, Settings,
  Zap, Crown, LayoutDashboard, Factory, GraduationCap, Home,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Stories from './Stories';

const exploreMenu = [
  {
    title: 'بازیکنان و افراد',
    color: '#10b981',
    items: [
      { href: '/players',  label: 'بازیکنان',      icon: <Users size={14} />,   desc: 'بازیکنان حرفه‌ای' },
      { href: '/coaches',  label: 'مربیان',         icon: <Star size={14} />,    desc: 'مربیان مجاز' },
      { href: '/referees', label: 'داوران',          icon: <Trophy size={14} />,  desc: 'داوران رسمی' },
      { href: '/ranking',  label: 'رنکینگ',          icon: <Trophy size={14} />,  desc: 'جدول رنکینگ' },
    ],
  },
  {
    title: 'تجهیزات و خدمات',
    color: '#a78bfa',
    items: [
      { href: '/sellers',       label: 'فروشندگان تجهیزات', icon: <ShoppingBag size={14} />, desc: 'فروشندگان تجهیزات' },
      { href: '/manufacturers', label: 'تولیدکنندگان',       icon: <Factory size={14} />,    desc: 'سازندگان تجهیزات' },
      { href: '/installers',    label: 'متخصصین نصب و تعمیر', icon: <Wrench size={14} />,  desc: 'نصب و راه‌اندازی' },
    ],
  },
  {
    title: 'محتوا',
    color: '#06b6d4',
    items: [
      { href: '/news',      label: 'اخبار',   icon: <Newspaper size={14} />,     desc: 'آخرین اخبار' },
      { href: '/events',    label: 'مسابقات', icon: <Calendar size={14} />,       desc: 'رویدادها' },
      { href: '/education', label: 'آموزش',   icon: <GraduationCap size={14} />, desc: 'ویدیو آموزشی' },
    ],
  },
];

// ترتیب موبایل طبق درخواست:
// صفحه اصلی - باشگاه‌ها - بیلیارد بازار - بازیکنان - پخش زنده
// مربیان - داوران - رنکینگ - فروشندگان تجهیزات - تولیدکنندگان
// متخصصین نصب و تعمیر - آموزش - مسابقات - اخبار
const mobileLinks = [
  { href: '/',              label: 'صفحه اصلی',            icon: <Home size={18} />,          color: '#10b981', isHome: true },
  { href: '/clubs',         label: 'باشگاه‌ها',             icon: <Building2 size={18} />,     color: '#10b981' },
  { href: '/shop',          label: 'بیلیارد بازار',         icon: <ShoppingBag size={18} />,   color: '#06b6d4' },
  { href: '/players',       label: 'بازیکنان',              icon: <Users size={18} />,          color: '#10b981' },
  { href: '/live',          label: 'پخش زنده',              icon: <Radio size={18} />,          color: '#ef4444', live: true },
  { href: '/coaches',       label: 'مربیان',                icon: <Star size={18} />,           color: '#f59e0b' },
  { href: '/referees',      label: 'داوران',                icon: <Trophy size={18} />,         color: '#a78bfa' },
  { href: '/ranking',       label: 'رنکینگ',                icon: <Trophy size={18} />,         color: '#f59e0b' },
  { href: '/sellers',       label: 'فروشندگان تجهیزات',     icon: <ShoppingBag size={18} />,   color: '#06b6d4' },
  { href: '/manufacturers', label: 'تولیدکنندگان',          icon: <Factory size={18} />,        color: '#a78bfa' },
  { href: '/installers',    label: 'متخصصین نصب و تعمیر',  icon: <Wrench size={18} />,         color: '#10b981' },
  { href: '/education',     label: 'آموزش',                 icon: <GraduationCap size={18} />, color: '#06b6d4' },
  { href: '/events',        label: 'مسابقات',               icon: <Calendar size={18} />,       color: '#a78bfa' },
  { href: '/news',          label: 'اخبار',                 icon: <Newspaper size={18} />,      color: '#10b981' },
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
  const profileRef  = useRef<HTMLDivElement>(null);
  const exploreRef  = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLDivElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const isHomePage = pathname === '/';

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
      ) {
        setSearchOpen(false);
      }
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

  const navBg = isHomePage
    ? scrolled ? 'rgba(2,8,6,0.92)' : 'transparent'
    : 'rgba(2,8,6,0.95)';

  return (
    <>
      <style>{`
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 4px #ef4444;}50%{box-shadow:0 0 14px #ef4444;} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);} }
        @keyframes slideUp { from{opacity:0;transform:translateY(100%);}to{opacity:1;transform:translateY(0);} }
        @keyframes fadeIn { from{opacity:0;}to{opacity:1;} }

        .nav-a {
          position:relative; color:rgba(255,255,255,0.5); font-size:13px; font-weight:500;
          padding:6px 2px; white-space:nowrap; text-decoration:none; transition:color 0.25s;
          letter-spacing:0.01em;
        }
        .nav-a::after {
          content:''; position:absolute; bottom:-2px; left:0; right:0; height:1px;
          background:linear-gradient(90deg,#10b981,#06b6d4); transform:scaleX(0); transition:transform 0.3s;
        }
        .nav-a:hover { color:rgba(255,255,255,0.9); }
        .nav-a:hover::after { transform:scaleX(1); }
        .nav-a.active { color:#10b981; }
        .nav-a.active::after { transform:scaleX(1); }

        .exp-btn {
          display:flex; align-items:center; gap:5px; color:rgba(255,255,255,0.5);
          font-size:13px; font-weight:500; background:none; border:none; cursor:pointer;
          font-family:inherit; padding:6px 2px; transition:color 0.25s; white-space:nowrap;
        }
        .exp-btn:hover { color:rgba(255,255,255,0.9); }

        .d-item {
          display:flex; align-items:flex-start; gap:10px; padding:10px 12px;
          border-radius:12px; text-decoration:none; transition:all 0.2s; cursor:pointer;
        }
        .d-item:hover { background:rgba(255,255,255,0.06); }
        .d-item:hover .d-label { color:#f0faf5; }

        .d-icon { color:rgba(240,250,245,0.25); transition:color 0.2s; flex-shrink:0; margin-top:1px; }
        .d-item:hover .d-icon { color:#10b981; }
        .d-label { color:rgba(240,250,245,0.7); font-size:13px; font-weight:600; }
        .d-desc { color:rgba(240,250,245,0.3); font-size:11px; margin-top:1px; }

        .desk { display:flex !important; }
        .mob  { display:none  !important; }
        @media(max-width:900px) { .desk{display:none!important;} .mob{display:flex!important;} }
        @media(max-width:480px) { .srch-wrap{display:none!important;} }

        .mob-link-item { transition: background 0.15s, color 0.15s; }
        .mob-link-item:hover { background: rgba(255,255,255,0.05) !important; color: #f0faf5 !important; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:200,
        background: navBg,
        borderBottom: scrolled || !isHomePage ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        backdropFilter: scrolled || !isHomePage ? 'blur(32px) saturate(1.8)' : 'none',
        transition:'all 0.4s ease',
      }}>
        <div style={{ maxWidth:'1440px', margin:'0 auto', padding:'0 clamp(16px,3vw,32px)', height:'62px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>

          {/* Logo */}
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:'9px', textDecoration:'none', flexShrink:0 }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:900, color:'#fff', boxShadow:'0 4px 14px rgba(16,185,129,0.35)' }}>B</div>
            <span style={{ fontWeight:900, fontSize:'15px', color:'#f0faf5', letterSpacing:'-0.03em', whiteSpace:'nowrap' }}>
              بیلیارد{' '}
              <span style={{ background:'linear-gradient(135deg,#10b981,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>پلاس</span>
            </span>
          </Link>

          {/* Desktop links — ترتیب جدید: باشگاه‌ها - بیلیارد بازار - بازیکنان - پخش زنده - بیشتر */}
          <div className="desk" style={{ alignItems:'center', gap:'24px', marginRight:'12px', flexShrink:0 }}>
            <Link href="/clubs"   className={`nav-a ${pathname==='/clubs'?'active':''}`}>باشگاه‌ها</Link>
            <Link href="/shop"    className={`nav-a ${pathname==='/shop'?'active':''}`}>بیلیارد بازار</Link>
            <Link href="/players" className={`nav-a ${pathname==='/players'?'active':''}`}>بازیکنان</Link>
            <Link href="/live" style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.5)', fontSize:'13px', fontWeight:500, textDecoration:'none', transition:'color 0.25s', whiteSpace:'nowrap', padding:'6px 2px' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.9)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#ef4444', display:'inline-block', animation:'glowPulse 2s infinite', flexShrink:0 }}/>
              پخش زنده
            </Link>

            {/* Explore / بیشتر */}
            <div ref={exploreRef} style={{ position:'relative' }}>
              <button className="exp-btn" onClick={()=>setExploreOpen(p=>!p)}>
                بیشتر
                <ChevronDown size={12} style={{ transition:'transform 0.3s', transform:exploreOpen?'rotate(180deg)':'rotate(0)' }}/>
              </button>

              {exploreOpen && (
                <div style={{
                  position:'absolute', top:'calc(100% + 16px)', right:'-20px',
                  width:'580px', maxWidth:'95vw',
                  background:'rgba(8,18,13,0.97)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:'24px',
                  boxShadow:'0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.06)',
                  backdropFilter:'blur(40px)',
                  padding:'20px', zIndex:300,
                  animation:'fadeDown 0.22s cubic-bezier(0.22,1,0.36,1) both',
                }}>
                  <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'120px', height:'1px', background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.6),transparent)' }}/>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', paddingBottom:'12px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize:'9px', color:'rgba(16,185,129,0.6)', letterSpacing:'0.22em', fontWeight:700 }}>EXPLORE BILLIARD PLUS</span>
                    <button onClick={()=>setExploreOpen(false)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', cursor:'pointer', color:'rgba(240,250,245,0.4)', padding:'4px', display:'flex' }}><X size={12}/></button>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                    {exploreMenu.map((section, si) => (
                      <div key={si}>
                        <div style={{ fontSize:'9px', color:`${section.color}60`, letterSpacing:'0.18em', fontWeight:700, marginBottom:'6px', padding:'0 12px', textTransform:'uppercase' }}>{section.title}</div>
                        {section.items.map((item, ii) => (
                          <Link key={ii} href={item.href} className="d-item" onClick={()=>setExploreOpen(false)}>
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

                  <div style={{ marginTop:'14px', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'11px', color:'rgba(240,250,245,0.2)' }}>پلتفرم تخصصی بیلیارد ایران</span>
                    <Link href="/register" onClick={()=>setExploreOpen(false)} style={{ fontSize:'11px', color:'#10b981', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:'4px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px', padding:'5px 12px' }}>
                      ثبت‌نام رایگان <ArrowLeft size={10}/>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="srch-wrap desk" style={{ flex:1, maxWidth:'240px', marginRight:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'8px 12px', transition:'all 0.3s' }}>
              <Search size={13} color="rgba(255,255,255,0.2)"/>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو..."
                style={{ background:'none', border:'none', outline:'none', color:'#f0faf5', fontSize:'13px', width:'100%', fontFamily:'inherit' }}/>
              {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:0, display:'flex' }}><X size={11}/></button>}
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>

            {/* Search icon mobile */}
            <button ref={searchBtnRef} className="mob" onClick={()=>setSearchOpen(p=>!p)} style={{ width:'36px', height:'36px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', cursor:'pointer', color:'rgba(255,255,255,0.4)', alignItems:'center', justifyContent:'center' }}>
              <Search size={15}/>
            </button>

            <button className="desk" style={{ position:'relative', background:'none', border:'none', cursor:'pointer', padding:'8px', borderRadius:'8px', color:'rgba(255,255,255,0.3)', transition:'color 0.2s', alignItems:'center', justifyContent:'center' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.7)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.3)'}}>
              <Bell size={17}/>
              <span style={{ position:'absolute', top:'7px', right:'7px', width:'5px', height:'5px', background:'#ef4444', borderRadius:'50%', boxShadow:'0 0 6px #ef4444' }}/>
            </button>

            <Link href="/shop" className="desk" style={{ padding:'8px', borderRadius:'8px', color:'rgba(255,255,255,0.3)', alignItems:'center', transition:'color 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.7)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.3)'}}>
              <ShoppingCart size={17}/>
            </Link>

            {!user ? (
              <Link href="/login">
                <button style={{ display:'flex', alignItems:'center', gap:'6px', background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.08))', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'10px', padding:'7px 14px', color:'#6ee7b7', fontSize:'13px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', transition:'all 0.3s', backdropFilter:'blur(12px)' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(16,185,129,0.2)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.08))'}}>
                  <User size={13}/> ورود
                </button>
              </Link>
            ) : (
              <div ref={profileRef} style={{ position:'relative' }}>
                <button onClick={()=>setProfileOpen(p=>!p)} style={{ display:'flex', alignItems:'center', gap:'7px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'5px 10px', color:'rgba(255,255,255,0.7)', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.3s', backdropFilter:'blur(12px)' }}>
                  <div style={{ width:'26px', height:'26px', background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:'7px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:'12px', flexShrink:0 }}>
                    {user.firstName?.[0]}
                  </div>
                  <span className="desk" style={{ alignItems:'center' }}>{user.firstName}</span>
                  <ChevronDown size={11} style={{ transition:'transform 0.3s', transform:profileOpen?'rotate(180deg)':'rotate(0)' }}/>
                </button>

                {profileOpen && (
                  <div style={{ position:'absolute', top:'calc(100% + 10px)', left:0, width:'200px', background:'rgba(8,18,13,0.97)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'18px', boxShadow:'0 24px 60px rgba(0,0,0,0.6)', backdropFilter:'blur(40px)', padding:'8px', zIndex:300, animation:'fadeDown 0.2s ease both' }}>
                    <div style={{ padding:'10px 12px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom:'6px' }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:'#f0faf5' }}>{user.firstName} {user.lastName}</div>
                      <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)', marginTop:'2px' }}>{user.primaryRole}</div>
                    </div>
                    {[
                      { href:'/dashboard', label:'داشبورد', icon:<LayoutDashboard size={13}/> },
                      { href:'/dashboard/shop', label:'فروشگاه من', icon:<ShoppingBag size={13}/> },
                      ...(user.primaryRole==='club_owner'?[{href:'/dashboard/club',label:'مدیریت باشگاه',icon:<Building2 size={13}/>}]:[]),
                      ...(user.primaryRole==='admin'?[{href:'/admin',label:'پنل ادمین',icon:<Crown size={13}/>}]:[]),
                      { href:'/profile', label:'ویرایش پروفایل', icon:<Settings size={13}/> },
                    ].map((item,i)=>(
                      <Link key={i} href={item.href} onClick={()=>setProfileOpen(false)}
                        style={{ display:'flex', alignItems:'center', gap:'9px', padding:'9px 12px', borderRadius:'10px', fontSize:'13px', color:'rgba(240,250,245,0.55)', fontWeight:500, textDecoration:'none', transition:'all 0.2s' }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)';(e.currentTarget as HTMLElement).style.color='#f0faf5'}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color='rgba(240,250,245,0.55)'}}>
                        <span style={{ color:'rgba(16,185,129,0.6)' }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ height:'1px', background:'rgba(255,255,255,0.05)', margin:'6px 0' }}/>
                    <button onClick={()=>{logout();setProfileOpen(false);router.push('/');}}
                      style={{ display:'flex', alignItems:'center', gap:'9px', width:'100%', textAlign:'right', padding:'9px 12px', borderRadius:'10px', fontSize:'13px', color:'rgba(239,68,68,0.6)', fontWeight:500, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.08)';(e.currentTarget as HTMLElement).style.color='#ef4444'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color='rgba(239,68,68,0.6)'}}>
                      <LogOut size={13}/> خروج
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger */}
            <button className="mob" onClick={()=>setMobileOpen(p=>!p)}
              style={{ padding:'8px', borderRadius:'10px', background:mobileOpen?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.05)', border:`1px solid ${mobileOpen?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)'}`, color:mobileOpen?'#10b981':'rgba(255,255,255,0.6)', cursor:'pointer', alignItems:'center', justifyContent:'center', transition:'all 0.3s' }}>
              {mobileOpen ? <X size={18}/> : <Menu size={18}/>}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div ref={searchRef} style={{ padding:'8px 16px 12px', borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(2,8,6,0.97)', animation:'fadeDown 0.2s ease both' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'10px 14px' }}>
              <Search size={14} color="rgba(255,255,255,0.25)"/>
              <input autoFocus type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو باشگاه، بازیکن..."
                style={{ flex:1, background:'none', border:'none', outline:'none', color:'#f0faf5', fontSize:'14px', fontFamily:'inherit' }}/>
              {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:0, display:'flex' }}><X size={13}/></button>}
            </div>
          </div>
        )}
      </nav>

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div style={{
          position:'fixed', inset:0, zIndex:9999,
          background:'rgba(2,8,6,0.99)',
          backdropFilter:'blur(32px)',
          overflowY:'auto',
          paddingTop:'62px',
          animation:'fadeIn 0.25s ease both',
        }}>
          {/* top line */}
          <div style={{ height:'1px', background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.5),transparent)' }}/>

          <div style={{ padding:'20px 20px 0' }}>
            {!user ? (
              <Link href="/login" onClick={()=>setMobileOpen(false)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'15px', borderRadius:'16px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:'15px', fontWeight:800, textDecoration:'none', boxShadow:'0 8px 28px rgba(16,185,129,0.3)' }}>
                <User size={17}/> ورود / ثبت‌نام رایگان
              </Link>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px', background:'rgba(255,255,255,0.04)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width:'40px', height:'40px', background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:'17px', flexShrink:0 }}>
                  {user.firstName?.[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'#f0faf5', fontWeight:700, fontSize:'14px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.firstName} {user.lastName}</div>
                  <div style={{ color:'rgba(240,250,245,0.35)', fontSize:'11px', marginTop:'2px' }}>{user.primaryRole}</div>
                </div>
                <button onClick={()=>{logout();router.push('/');setMobileOpen(false);}}
                  style={{ padding:'7px 12px', borderRadius:'10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'5px' }}>
                  <LogOut size={12}/> خروج
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height:'1px', background:'rgba(255,255,255,0.04)', margin:'16px 20px' }}/>

          {/* Links */}
          <div style={{ padding:'0 12px', display:'flex', flexDirection:'column', gap:'2px' }}>
            {mobileLinks.map((item, i) => (
              <Link key={i} href={item.href} onClick={()=>setMobileOpen(false)}
                className="mob-link-item"
                style={{
                  display:'flex', alignItems:'center', gap:'14px',
                  padding:'13px 14px', borderRadius:'14px',
                  color: item.isHome ? 'rgba(240,250,245,0.75)' : 'rgba(240,250,245,0.55)',
                  fontSize:'15px', fontWeight: item.isHome ? 600 : 500,
                  textDecoration:'none',
                  // خط جداکننده بعد از صفحه اصلی
                  ...(item.isHome ? { borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom:'6px', paddingBottom:'16px' } : {}),
                }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${item.color}14`, border:`1px solid ${item.color}22`, display:'flex', alignItems:'center', justifyContent:'center', color: item.isHome ? item.color : item.color, flexShrink:0 }}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
                {item.live && (
                  <span style={{ marginRight:'auto', fontSize:'9px', color:'#ef4444', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'20px', padding:'2px 8px', fontWeight:700 }}>LIVE</span>
                )}
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div style={{ margin:'20px 20px 40px', padding:'16px', background:'rgba(16,185,129,0.04)', borderRadius:'16px', border:'1px solid rgba(16,185,129,0.1)', textAlign:'center' }}>
            <div style={{ fontSize:'9px', color:'rgba(16,185,129,0.4)', letterSpacing:'0.22em', fontWeight:700, marginBottom:'5px' }}>BILLIARD PLUS</div>
            <div style={{ fontSize:'12px', color:'rgba(240,250,245,0.25)' }}>اولین اکوسیستم جامع بیلیارد ایران</div>
          </div>
        </div>
      )}

      {/* Stories — home only */}
      {isHomePage && (
        <div style={{
          position:'fixed', top:'62px', left:0, right:0, zIndex:49,
          padding:'clamp(8px,1.5vw,12px) clamp(16px,3vw,32px)',
          opacity:Math.max(0,1-scrollY/700),
          pointerEvents:scrollY>560?'none':'auto',
          transition:'opacity 0.1s linear',
        }}>
          <div style={{ maxWidth:'1440px', margin:'0 auto' }}>
            <Stories/>
          </div>
        </div>
      )}

      {!isHomePage && <div style={{ height:'62px' }}/>}
    </>
  );
}
