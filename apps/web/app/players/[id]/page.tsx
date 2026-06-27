'use client';

const GOLD = '#C7A66A';
const GOLD_DARK = '#A07840';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  MapPin, ChevronRight, Trophy, Calendar, Phone,
  TrendingUp, Activity, Award, Target,
  Globe, Camera, Play, X,
  CheckCircle, Shield, Users,
} from 'lucide-react';

interface Player {
  id: string;
  firstName?: string; lastName?: string; name?: string;
  phone?: string; city?: string; age?: number; bio?: string;
  level?: string; rankingPoints?: number; nationalRank?: number;
  specialties?: string[]; achievements?: string[];
  avatar?: string; coverImage?: string;
  winRate?: number; matchesPlayed?: number; wins?: number; losses?: number;
  instagram?: string; website?: string; experience?: string;
  videos?: string[]; gallery?: string[];
  club?: string; coach?: string;
  verificationStatus?: string;
}

const MOCK: Player[] = [
  {
    id: '1', firstName: 'علی', lastName: 'محمدی',
    city: 'تهران', age: 28, experience: '۸',
    bio: 'بازیکن حرفه‌ای اسنوکر با ۸ سال سابقه رقابت در لیگ‌های داخلی و بین‌المللی. عضو تیم ملی جوانان ایران در سال ۱۴۰۰ و کسب مقام سوم مسابقات قهرمانی آسیا.',
    level: 'دسته برتر', rankingPoints: 1850, nationalRank: 12,
    specialties: ['اسنوکر', 'بریک بلد', '9-ball'],
    achievements: ['قهرمان لیگ تهران ۱۴۰۱', 'نایب‌قهرمان کشوری ۱۴۰۲', 'سوم آسیا ۱۴۰۰'],
    winRate: 72, matchesPlayed: 145, wins: 104, losses: 41,
    instagram: 'ali.mohammadi.billiard', club: 'باشگاه سنچوری تهران',
    verificationStatus: 'verified',
    gallery: ['/images/billiadr-club-1.jpg', '/images/billiadr-club-3.jpg', '/images/Pro_table.jpg'],
  },
  {
    id: '2', firstName: 'رضا', lastName: 'کریمی',
    city: 'اصفهان', age: 32, experience: '۱۰',
    bio: 'بازیکن ارشد پول آمریکایی و مربی سطح اول فدراسیون بیلیارد ایران.',
    level: 'لیگ یک', rankingPoints: 1420, nationalRank: 28,
    specialties: ['پاکت', '8-ball', '9-ball'],
    achievements: ['قهرمان منطقه ۱۴۰۳'],
    winRate: 65, matchesPlayed: 210, wins: 136, losses: 74,
    verificationStatus: 'verified',
  },
  {
    id: '3', firstName: 'سارا', lastName: 'احمدی',
    city: 'مشهد', age: 24, experience: '۶',
    bio: 'قهرمان ملی بانوان در رشته اسنوکر. اولین بانوی ایرانی در مسابقات جهانی اسنوکر.',
    level: 'تیم ملی', rankingPoints: 1680, nationalRank: 5,
    specialties: ['اسنوکر', '9-ball'],
    achievements: ['قهرمان بانوان کشوری ۱۴۰۲', 'قهرمان بانوان کشوری ۱۴۰۳', 'نماینده ایران در جهانی ۱۴۰۳'],
    winRate: 78, matchesPlayed: 98, wins: 76, losses: 22,
    instagram: 'sara.ahmadi.snooker', verificationStatus: 'verified',
  },
  {
    id: '4', firstName: 'محمد', lastName: 'حسینی',
    city: 'تهران', age: 35, experience: '۱۵',
    bio: 'باتجربه‌ترین بازیکن لیگ تهران با سابقه ۱۵ ساله. مدرس و مربی ارشد فدراسیون.',
    level: 'دسته برتر', rankingPoints: 2100, nationalRank: 7,
    specialties: ['اسنوکر', 'کارامبول', 'پاکت'],
    achievements: ['قهرمان لیگ برتر ۱۳۹۹', 'قهرمان لیگ برتر ۱۴۰۰', 'نایب‌قهرمان کشوری ۱۴۰۱'],
    winRate: 81, matchesPlayed: 312, wins: 252, losses: 60,
    verificationStatus: 'verified',
  },
];

const LEVEL_META: Record<string, { color: string; bg: string }> = {
  'تیم ملی':      { color: '#f59e0b', bg: 'rgba(245,158,11,' },
  'دسته برتر':    { color: '#C7A66A', bg: 'rgba(199,166,106,' },
  'لیگ یک':       { color: '#06b6d4', bg: 'rgba(6,182,212,'  },
  'نیمه‌حرفه‌ای':  { color: '#a78bfa', bg: 'rgba(167,139,250,'},
};

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

// آیکون اینستاگرام inline چون lucide این نسخه نداره
function IconInstagram({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none"/>
    </svg>
  );
}

// آیکون ویرایش inline
function IconEdit({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

// آیکون برق inline (جایگزین Zap)
function IconZap({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

export default function PlayerProfilePage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuthStore();

  const [player, setPlayer]     = useState<Player | null>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'about' | 'stats' | 'gallery' | 'achievements' | 'tournaments'>('about');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get(`/users/${id}`)
      .then(res => setPlayer(res.data ?? MOCK.find(p => p.id === id) ?? null))
      .catch(() => setPlayer(MOCK.find(p => p.id === id) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const isOwn   = user?.id === id;
  const lvlMeta = LEVEL_META[player?.level ?? ''] ?? LEVEL_META['لیگ یک']!;
  const displayName = player?.name ?? `${player?.firstName ?? ''} ${player?.lastName ?? ''}`.trim();
  const initials    = (player?.firstName?.[0] ?? '') + (player?.lastName?.[0] ?? '');

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#F7F7F5', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20, fontFamily:'Vazirmatn, sans-serif' }}>
      <div style={{ width:44, height:44, border:`2px solid rgba(199,166,106,0.1)`, borderTop:`2px solid ${GOLD}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!player) return (
    <div style={{ minHeight:'100vh', background:'#F7F7F5', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:'Vazirmatn, sans-serif', direction:'rtl' }}>
      <div style={{ fontSize:53, opacity:0.1 }}>🎱</div>
      <p style={{ fontSize:18, fontWeight:700, color:'#111111' }}>بازیکن یافت نشد</p>
      <Link href="/players" style={{ color:GOLD, textDecoration:'none', fontSize:15 }}>بازگشت به بازیکنان ←</Link>
    </div>
  );

  const gallery = player.gallery ?? ['/images/billiadr-club-1.jpg', '/images/Pro_table.jpg', '/images/snooker-table.jpg'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;900&display=swap');
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow   { 0%,100%{opacity:0.5} 50%{opacity:1} }

        .tab-btn { padding:10px 20px;border-radius:11px;font-size:13px;font-weight:600;border:1px solid transparent;cursor:pointer;font-family:inherit;transition:all 0.3s;white-space:nowrap;flex-shrink:0 }
        .tab-btn.active { background:rgba(199,166,106,0.10);border-color:rgba(199,166,106,0.3);color:#C7A66A }
        .tab-btn:not(.active) { background:#FFFFFF;color:rgba(0,0,0,0.42) }
        .tab-btn:not(.active):hover { background:rgba(0,0,0,0.05);color:rgba(0,0,0,0.70) }

        .stat-card { background:#FFFFFF;border:1px solid rgba(0,0,0,0.07);border-radius:18px;padding:20px;text-align:center;transition:all 0.3s;position:relative;overflow:hidden }
        .stat-card::before { content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:60%;height:1px;background:linear-gradient(90deg,transparent,var(--accent,rgba(199,166,106,0.4)),transparent) }
        .stat-card:hover { transform:translateY(-3px);background:rgba(0,0,0,0.02) }

        .ach-item { display:flex;align-items:flex-start;gap:12px;padding:16px;background:#FFFFFF;border:1px solid rgba(0,0,0,0.07);border-radius:15px;transition:all 0.3s }
        .ach-item:hover { background:rgba(0,0,0,0.04);border-color:rgba(245,158,11,0.2);transform:translateX(-3px) }

        .gallery-item { border-radius:14px;overflow:hidden;aspect-ratio:1;cursor:pointer;position:relative;border:1px solid rgba(0,0,0,0.07);background:#FFFFFF;transition:all 0.3s }
        .gallery-item:hover { transform:scale(1.03);border-color:rgba(199,166,106,0.3);box-shadow:0 8px 28px rgba(0,0,0,0.15) }
        .gallery-item:hover .gov { opacity:1 }
        .gov { position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s }

        .player-layout { display:flex;flex-direction:column;gap:24px }
        .player-sidebar { display:flex;flex-direction:column;gap:16px }
        @media(min-width:900px){
          .player-layout  { display:grid;grid-template-columns:1fr 300px;gap:28px;align-items:start }
          .player-sidebar { position:sticky;top:90px }
        }
        .gallery-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:10px }
        @media(max-width:480px){ .gallery-grid{grid-template-columns:repeat(2,1fr)} }
        .stats-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:10px }
        @media(max-width:560px){ .stats-grid{grid-template-columns:repeat(2,1fr)} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#F7F7F5', direction:'rtl', fontFamily:'Vazirmatn, sans-serif' }}>

        {/* HERO */}
        <div style={{ position:'relative' }}>
          <div style={{ height:'clamp(180px,30vw,280px)', position:'relative', overflow:'hidden', background:'rgba(5,12,8,0.98)' }}>
            {player.coverImage
              ? <img src={player.coverImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.35)' }} />
              : (
                <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${lvlMeta.bg}0.1) 0%,rgba(2,8,6,0.98) 100%)` }}>
                  <div style={{ position:'absolute', top:'-20%', right:'-5%', width:'50%', height:'200%', borderRadius:'50%', background:`radial-gradient(ellipse,${lvlMeta.bg}0.1) 0%,transparent 65%)`, filter:'blur(50px)' }} />
                  <div style={{ position:'absolute', bottom:'-30%', left:'10%', width:'40%', height:'150%', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(6,182,212,0.07) 0%,transparent 65%)', filter:'blur(40px)' }} />
                  <div style={{ position:'absolute', inset:0, opacity:0.03, backgroundImage:'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize:'40px 40px' }} />
                </div>
              )
            }
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(2,8,6,0.3) 0%,rgba(2,8,6,0.95) 100%)' }} />

            <button onClick={() => router.push('/players')} style={{ position:'absolute', top:'clamp(12px,3vw,20px)', right:'clamp(12px,4vw,32px)', display:'inline-flex', alignItems:'center', gap:6, color:'rgba(0,0,0,0.45)', fontSize:15, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:10, padding:'7px 14px', cursor:'pointer', fontFamily:'inherit', backdropFilter:'blur(12px)' }}>
              <ChevronRight size={14} /> بازیکنان
            </button>

            {isOwn && (
              <button style={{ position:'absolute', top:'clamp(12px,3vw,20px)', left:'clamp(12px,4vw,32px)', display:'inline-flex', alignItems:'center', gap:6, color:'rgba(0,0,0,0.45)', fontSize:14, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:10, padding:'7px 14px', cursor:'pointer', fontFamily:'inherit', backdropFilter:'blur(12px)' }}>
                <Camera size={13} /> تغییر کاور
              </button>
            )}
          </div>

          <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 clamp(16px,4vw,32px)' }}>
            <div style={{ display:'flex', gap:'clamp(14px,3vw,24px)', alignItems:'flex-end', marginTop:-44, flexWrap:'wrap', paddingBottom:20 }}>

              {/* avatar */}
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:'clamp(88px,18vw,120px)', height:'clamp(88px,18vw,120px)', borderRadius:'clamp(22px,5vw,30px)', background:`linear-gradient(135deg,${lvlMeta.bg}0.3),${lvlMeta.bg}0.1))`, border:`3px solid ${lvlMeta.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 'clamp(31px, 7.7vw, 46px)', fontWeight:900, color:lvlMeta.color, overflow:'hidden', boxShadow:`0 0 40px ${lvlMeta.bg}0.2), 0 8px 32px rgba(0,0,0,0.5)`, position:'relative', zIndex:1 }}>
                  {player.avatar
                    ? <img src={player.avatar} alt={displayName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : initials}
                </div>
                <div style={{ position:'absolute', inset:-5, borderRadius:'clamp(26px,6vw,34px)', border:`1px solid ${lvlMeta.color}20`, animation:'glow 3s ease infinite', pointerEvents:'none', zIndex:0 }} />
                {player.verificationStatus === 'verified' && (
                  <div style={{ position:'absolute', bottom:-3, left:-3, width:26, height:26, borderRadius:'50%', background:lvlMeta.color, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #F7F7F5', zIndex:2 }}>
                    <CheckCircle size={13} style={{ color:'#ffffff' }} />
                  </div>
                )}
                {isOwn && (
                  <button onClick={() => fileRef.current?.click()} style={{ position:'absolute', top:-3, right:-3, width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,0.95)', border:'1px solid rgba(0,0,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:2 }}>
                    <Camera size={11} style={{ color:'rgba(0,0,0,0.50)' }} />
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} />
              </div>

              {/* name + meta */}
              <div style={{ flex:1, minWidth:180, paddingBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
                  <h1 style={{ fontSize: 'clamp(22px, 4.4vw, 33px)', fontWeight:900, color:'#111111', margin:0, letterSpacing:'-0.03em', lineHeight:1.15 }}>{displayName}</h1>
                  {player.level && (
                    <span style={{ background:`${lvlMeta.bg}0.18)`, border:`1px solid ${lvlMeta.bg}0.4)`, color:lvlMeta.color, borderRadius:20, padding:'4px 14px', fontSize:13, fontWeight:700 }}>{player.level}</span>
                  )}
                  {player.nationalRank && (
                    <span style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', color:'#f59e0b', borderRadius:20, padding:'4px 14px', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
                      <Trophy size={11} /> رنک #{toFa(player.nationalRank)}
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                  {player.city && <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:14, color:'rgba(0,0,0,0.45)' }}><MapPin size={12} style={{ color:GOLD }} />{player.city}</div>}
                  {player.club && <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:14, color:'rgba(0,0,0,0.45)' }}><Shield size={12} style={{ color:'#06b6d4' }} />{player.club}</div>}
                  {player.experience && <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:14, color:'rgba(0,0,0,0.45)' }}><Calendar size={12} style={{ color:'#a78bfa' }} />{player.experience} سال سابقه</div>}
                </div>
              </div>

              {/* actions */}
              <div style={{ display:'flex', gap:8, flexShrink:0, paddingBottom:4 }}>
                {player.instagram && (
                  <a href={`https://instagram.com/${player.instagram}`} target="_blank" rel="noopener noreferrer" style={{ width:40, height:40, borderRadius:11, background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.25)', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}>
                    <IconInstagram size={16} color="#a78bfa" />
                  </a>
                )}
                {player.phone && (
                  <a href={`tel:${player.phone}`} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 16px', background:'rgba(199,166,106,0.1)', border:'1px solid rgba(199,166,106,0.25)', borderRadius:11, color:'#C7A66A', fontSize:15, fontWeight:600, textDecoration:'none' }}>
                    <Phone size={14} /> تماس
                  </a>
                )}
                {isOwn && (
                  <button style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 16px', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:11, color:'rgba(0,0,0,0.50)', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    <IconEdit size={14} color="rgba(0,0,0,0.50)" /> ویرایش
                  </button>
                )}
              </div>
            </div>

            {player.specialties && player.specialties.length > 0 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', paddingBottom:4, marginTop:-8 }}>
                {player.specialties.map((s, i) => (
                  <span key={i} style={{ fontSize:13, color:lvlMeta.color, background:`${lvlMeta.bg}0.1)`, border:`1px solid ${lvlMeta.bg}0.22)`, borderRadius:20, padding:'4px 12px', fontWeight:700 }}>{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BODY */}
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'clamp(16px,3vw,28px) clamp(16px,4vw,32px)' }}>

          {/* quick stats */}
          <div className="stats-grid" style={{ marginBottom:24 }}>
            {[
              { label:'امتیاز رنکینگ', value:player.rankingPoints,                              color:'#C7A66A', icon:<TrendingUp size={18}/> },
              { label:'نرخ برد',        value:player.winRate ? `${player.winRate}٪` : null,     color:'#06b6d4', icon:<Target size={18}/> },
              { label:'کل مسابقات',    value:player.matchesPlayed,                              color:'#a78bfa', icon:<Activity size={18}/> },
              { label:'افتخارات',       value:player.achievements?.length,                      color:'#f59e0b', icon:<Award size={18}/> },
            ].filter(s => s.value !== undefined && s.value !== null).map((s, i) => (
              <div key={i} className="stat-card" style={{ '--accent': s.color + '0.4)' } as any}>
                <div style={{ color:s.color, display:'flex', justifyContent:'center', marginBottom:10, opacity:0.8 }}>{s.icon}</div>
                <div style={{ fontSize: 'clamp(20px, 4.4vw, 29px)', fontWeight:900, color:s.color, marginBottom:4, letterSpacing:'-0.02em' }}>{toFa(String(s.value))}</div>
                <div style={{ fontSize:13, color:'rgba(0,0,0,0.40)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="player-layout">
            {/* MAIN */}
            <div>
              <div style={{ display:'flex', gap:6, marginBottom:22, overflowX:'auto', paddingBottom:2 }}>
                {[
                  { key:'about',        label:'درباره' },
                  { key:'stats',        label:'آمار و عملکرد' },
                  { key:'gallery',      label:`گالری (${gallery.length})` },
                  { key:'achievements', label:'افتخارات' },
                  { key:'tournaments',  label:'مسابقات' },
                ].map(t => (
                  <button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`} onClick={() => setTab(t.key as any)}>{t.label}</button>
                ))}
              </div>

              {/* ABOUT */}
              {tab === 'about' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:16 }}>
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:18, padding:'clamp(16px,3vw,24px)', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'50%', height:1, background:`linear-gradient(90deg,transparent,${lvlMeta.color}40,transparent)` }} />
                    <h2 style={{ fontSize:16, fontWeight:800, color:'#111111', margin:'0 0 14px', display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:3, height:16, background:`linear-gradient(180deg,${lvlMeta.color},transparent)`, borderRadius:2, display:'inline-block' }} />
                      بیوگرافی
                    </h2>
                    <p style={{ fontSize:16, color:'rgba(0,0,0,0.50)', lineHeight:2, margin:0 }}>{player.bio ?? 'اطلاعاتی ثبت نشده است.'}</p>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
                    {[
                      { label:'شهر',    value:player.city,                                         icon:<MapPin size={14}/>,           color:'#C7A66A' },
                      { label:'سن',     value:player.age ? `${toFa(player.age)} ساله` : null,     icon:<Calendar size={14}/>,         color:'#06b6d4' },
                      { label:'سابقه', value:player.experience ? `${player.experience} سال` : null, icon:<IconZap size={14} color="#a78bfa"/>, color:'#a78bfa' },
                      { label:'باشگاه', value:player.club,                                         icon:<Shield size={14}/>,           color:'#f59e0b' },
                      { label:'مربی',   value:player.coach,                                        icon:<Users size={14}/>,            color:'#C7A66A' },
                    ].filter(r => r.value).map((r, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.05)', borderRadius:13 }}>
                        <div style={{ color:r.color, flexShrink:0 }}>{r.icon}</div>
                        <div>
                          <div style={{ fontSize:12, color:'rgba(0,0,0,0.35)', marginBottom:2 }}>{r.label}</div>
                          <div style={{ fontSize:15, fontWeight:600, color:'#111111' }}>{r.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STATS */}
              {tab === 'stats' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:16 }}>
                  {player.wins !== undefined && player.losses !== undefined && (
                    <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:18, padding:'clamp(16px,3vw,24px)' }}>
                      <h3 style={{ fontSize:16, fontWeight:800, color:'#111111', margin:'0 0 18px', display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ width:3, height:16, background:'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius:2, display:'inline-block' }} />
                        نتایج مسابقات
                      </h3>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
                        {[
                          { label:'برد',  v:player.wins,          color:'#C7A66A' },
                          { label:'باخت', v:player.losses,        color:'#ef4444' },
                          { label:'کل',   v:player.matchesPlayed, color:'rgba(0,0,0,0.45)' },
                        ].map((x, i) => (
                          <div key={i} style={{ textAlign:'center', padding:'16px 10px', background:'#FFFFFF', borderRadius:14, border:`1px solid ${x.color}18` }}>
                            <div style={{ fontSize: 'clamp(22px, 4.4vw, 31px)', fontWeight:900, color:x.color }}>{toFa(x.v ?? 0)}</div>
                            <div style={{ fontSize:13, color:'rgba(0,0,0,0.40)', marginTop:4 }}>{x.label}</div>
                          </div>
                        ))}
                      </div>
                      {player.winRate && (
                        <>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                            <span style={{ fontSize:14, color:'rgba(0,0,0,0.45)' }}>نرخ برد</span>
                            <span style={{ fontSize:16, fontWeight:900, color:'#C7A66A' }}>{toFa(player.winRate)}٪</span>
                          </div>
                          <div style={{ height:10, background:'rgba(0,0,0,0.04)', borderRadius:5, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${player.winRate}%`, background:'linear-gradient(90deg,#C7A66A,#A07840)', borderRadius:5 }} />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:18, padding:'clamp(16px,3vw,24px)' }}>
                    <h3 style={{ fontSize:16, fontWeight:800, color:'#111111', margin:'0 0 16px', display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:3, height:16, background:'linear-gradient(180deg,#f59e0b,#ef4444)', borderRadius:2, display:'inline-block' }} />
                      رنکینگ
                    </h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {[
                        { label:'رنک ملی',       v:player.nationalRank  ? `#${toFa(player.nationalRank)}`  : '—', color:'#f59e0b' },
                        { label:'امتیاز رنکینگ', v:player.rankingPoints ? toFa(player.rankingPoints)        : '—', color:'#C7A66A' },
                        { label:'سطح',            v:player.level ?? '—',                                     color:lvlMeta.color },
                      ].map((x, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', background:'rgba(0,0,0,0.02)', border:'1px solid rgba(0,0,0,0.04)', borderRadius:11 }}>
                          <span style={{ fontSize:15, color:'rgba(0,0,0,0.45)' }}>{x.label}</span>
                          <span style={{ fontSize:17, fontWeight:900, color:x.color }}>{x.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* GALLERY */}
              {tab === 'gallery' && (
                <div style={{ animation:'fadeUp 0.4s ease both' }}>
                  {isOwn && (
                    <div style={{ padding:'16px', background:'rgba(199,166,106,0.04)', border:'1px dashed rgba(199,166,106,0.25)', borderRadius:14, marginBottom:16, textAlign:'center', cursor:'pointer' }}>
                      <Camera size={20} style={{ color:'rgba(199,166,106,0.5)', display:'block', margin:'0 auto 8px' }} />
                      <p style={{ fontSize:15, color:'rgba(199,166,106,0.6)', margin:0 }}>افزودن عکس یا ویدیو</p>
                    </div>
                  )}
                  <div className="gallery-grid">
                    {gallery.map((img, i) => (
                      <div key={i} className="gallery-item" onClick={() => setLightbox(img)}>
                        <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={e => { (e.target as HTMLImageElement).src='/images/billiadr-club-1.jpg'; }} />
                        <div className="gov">
                          <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.10)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Play size={16} style={{ color:'#fff', marginRight:-2 }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {gallery.length === 0 && <div style={{ textAlign:'center', padding:'48px 24px', color:'rgba(0,0,0,0.30)', fontSize:15 }}>گالری خالی است</div>}
                </div>
              )}

              {/* ACHIEVEMENTS */}
              {tab === 'achievements' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:10 }}>
                  {player.achievements && player.achievements.length > 0 ? player.achievements.map((a, i) => (
                    <div key={i} className="ach-item">
                      <div style={{ width:42, height:42, borderRadius:12, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.22)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>🏆</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:16, fontWeight:700, color:'#111111', marginBottom:3 }}>{a}</div>
                        <div style={{ fontSize:13, color:'rgba(0,0,0,0.35)' }}>افتخار رسمی — تأیید فدراسیون</div>
                      </div>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', flexShrink:0, marginTop:6 }} />
                    </div>
                  )) : (
                    <div style={{ textAlign:'center', padding:'48px 24px', color:'rgba(0,0,0,0.30)', fontSize:15 }}>افتخاری ثبت نشده است</div>
                  )}
                </div>
              )}

              {/* TOURNAMENTS */}
              {tab === 'tournaments' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:12 }}>
                  {/* Summary stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:6 }}>
                    {[
                      { v:'۱۴', label:'شرکت در مسابقات', color:'#C7A66A', rgb:'199,166,106' },
                      { v:'۶',  label:'عنوان قهرمانی',    color:'#f59e0b', rgb:'245,158,11'  },
                      { v:'۸۲٪', label:'نرخ پیشرفت',      color:'#30C55A', rgb:'48,197,90'   },
                    ].map((s,i) => (
                      <div key={i} style={{ background:'#fff', border:`1px solid rgba(${s.rgb},0.14)`, borderRadius:14, padding:'14px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:22, fontWeight:900, color:s.color, marginBottom:4 }}>{s.v}</div>
                        <div style={{ fontSize:12, color:'rgba(0,0,0,0.40)', fontWeight:600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tournament history rows */}
                  {[
                    { id:'t3', title:'تور هفتگی آماتور',           date:'شهریور ۱۴۰۵', result:'قهرمان',       place:1, color:'#C7A66A', icon:'🏆', type:'اسنوکر' },
                    { id:'t2', title:'مسابقات پاکت سری A',          date:'مرداد ۱۴۰۵',  result:'نیمه‌نهایی', place:4, color:'#8b5cf6', icon:'4️⃣', type:'پاکت ۸ توپ' },
                    { id:'t5', title:'لیگ اسنوکر استانی ۱۴۰۴',     date:'آبان ۱۴۰۴',    result:'قهرمان',       place:1, color:'#C7A66A', icon:'🏆', type:'اسنوکر' },
                    { id:'t1', title:'جام استعدادهای بیلیارد ۱۴۰۴', date:'مهر ۱۴۰۴',     result:'یک‌چهارم',    place:8, color:'#06b6d4', icon:'8️⃣', type:'پاکت ۹ توپ' },
                  ].map((t,i) => (
                    <div key={i} onClick={() => router.push(`/tournaments/${t.id}`)}
                      style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:16, cursor:'pointer', transition:'box-shadow 0.15s' }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:`${t.color}12`, border:`1px solid ${t.color}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>
                        {t.icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:15, fontWeight:800, color:'#111', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                          <span style={{ fontSize:13, color:'rgba(0,0,0,0.40)' }}>{t.date}</span>
                          <span style={{ fontSize:13, color:'rgba(0,0,0,0.30)' }}>•</span>
                          <span style={{ fontSize:13, color:'rgba(0,0,0,0.40)' }}>{t.type}</span>
                        </div>
                      </div>
                      <div style={{ padding:'5px 12px', borderRadius:20, background:`${t.color}12`, border:`1px solid ${t.color}25`, fontSize:13, fontWeight:700, color:t.color, flexShrink:0 }}>
                        {t.result}
                      </div>
                    </div>
                  ))}

                  <button onClick={() => router.push('/tournaments')} style={{ width:'100%', padding:'12px', background:'rgba(0,0,0,0.03)', border:'1px solid rgba(0,0,0,0.07)', borderRadius:12, fontSize:14, fontWeight:700, color:'rgba(0,0,0,0.45)', cursor:'pointer', fontFamily:'inherit' }}>
                    مشاهده همه مسابقات
                  </button>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <div className="player-sidebar">
              <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:18, padding:18, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-1, left:'50%', transform:'translateX(-50%)', width:'70%', height:1, background:`linear-gradient(90deg,transparent,${lvlMeta.color}50,transparent)` }} />
                <p style={{ fontSize:13, fontWeight:700, color:'rgba(0,0,0,0.40)', margin:'0 0 14px' }}>ارتباط با بازیکن</p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {player.phone && (
                    <a href={`tel:${player.phone}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(199,166,106,0.07)', border:'1px solid rgba(199,166,106,0.18)', borderRadius:12, textDecoration:'none' }}>
                      <Phone size={15} style={{ color:'#C7A66A', flexShrink:0 }} />
                      <span style={{ fontSize:15, color:'#6ee7b7', fontWeight:600 }}>{player.phone}</span>
                    </a>
                  )}
                  {player.instagram && (
                    <a href={`https://instagram.com/${player.instagram}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(167,139,250,0.07)', border:'1px solid rgba(167,139,250,0.18)', borderRadius:12, textDecoration:'none' }}>
                      <IconInstagram size={15} color="#a78bfa" />
                      <span style={{ fontSize:15, color:'#c4b5fd', fontWeight:600 }}>@{player.instagram}</span>
                    </a>
                  )}
                  {player.website && (
                    <a href={player.website} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(6,182,212,0.07)', border:'1px solid rgba(6,182,212,0.18)', borderRadius:12, textDecoration:'none' }}>
                      <Globe size={15} style={{ color:'#06b6d4', flexShrink:0 }} />
                      <span style={{ fontSize:15, color:'#67e8f9', fontWeight:600 }}>{player.website.replace('https://','')}</span>
                    </a>
                  )}
                  {!player.phone && !player.instagram && !player.website && (
                    <p style={{ fontSize:14, color:'rgba(0,0,0,0.30)', textAlign:'center', padding:'12px 0', margin:0 }}>اطلاعات تماسی ثبت نشده</p>
                  )}
                </div>
              </div>

              <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:18, padding:18 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'rgba(0,0,0,0.40)', margin:'0 0 14px' }}>خلاصه آمار</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { label:'رنک ملی',       v:player.nationalRank  ? `#${toFa(player.nationalRank)}`  : '—', color:'#f59e0b' },
                    { label:'امتیاز رنکینگ', v:player.rankingPoints ? toFa(player.rankingPoints)        : '—', color:'#C7A66A' },
                    { label:'کل مسابقات',    v:player.matchesPlayed ? toFa(player.matchesPlayed)        : '—', color:'#a78bfa' },
                    { label:'نرخ برد',       v:player.winRate       ? `${toFa(player.winRate)}٪`        : '—', color:'#06b6d4' },
                  ].map((x, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:9 }}>
                      <span style={{ fontSize:14, color:'rgba(0,0,0,0.42)' }}>{x.label}</span>
                      <span style={{ fontSize:16, fontWeight:800, color:x.color }}>{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => router.push('/players')} style={{ width:'100%', padding:'12px', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.07)', borderRadius:12, color:'rgba(0,0,0,0.45)', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <ChevronRight size={14} /> بازگشت به لیست
              </button>
            </div>
          </div>
        </div>

        {/* LIGHTBOX */}
        {lightbox && (
          <div onClick={() => setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(20px)' }}>
            <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:20, left:20, width:38, height:38, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'1px solid rgba(0,0,0,0.10)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
              <X size={16} />
            </button>
            <img src={lightbox} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth:'90vw', maxHeight:'85vh', objectFit:'contain', borderRadius:16 }} />
          </div>
        )}
      </div>
    </>
  );
}
