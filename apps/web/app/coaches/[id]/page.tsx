'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/auth.store';
import {
  Star, MapPin, Check, Trophy, Users, Clock,
  ChevronRight, Calendar, MessageCircle, Share2,
  UserPlus, Shield, Award, Target, Activity,
  ChevronDown, ChevronUp, Play, Zap, CheckCircle,
} from 'lucide-react';

/* ══ types ══ */
interface TimeSlot { day: string; slots: { time: string; available: boolean }[]; }
interface Review   { name: string; rating: number; text: string; date: string; level: string; }
interface Package  { id: string; title: string; sessions: number; price: number; perSession: number; color: string; features: string[]; popular?: boolean; }

/* ══ data ══ */
const COACHES: Record<string, any> = {
  c1: {
    id:'c1', name:'کاوه نوری', title:'مربی ارشد اسنوکر',
    speciality:['اسنوکر','پوزیشن‌بازی','بریک‌بیلدینگ','روانشناسی ورزشی'],
    city:'تهران', address:'باشگاه سنچوری، خ ولیعصر',
    experience:15, rating:5.0, reviewCount:87, students:340, sessions:1240,
    avatar:'ک', avatarColor:'#C7A66A', coverImg:'/images/billiadr-club-1.jpg',
    certifications:['مربی درجه یک فدراسیون بیلیارد','WPBSA Coach Level 3','مربی ملی ایران','صلاحیت داوری بین‌المللی'],
    languages:['فارسی','انگلیسی'],
    isVerified:true, isFederation:true, isOnline:true,
    bio:'با ۱۵ سال سابقه تدریس در بالاترین سطح بیلیارد ایران، تخصص اصلی من اسنوکر حرفه‌ای و آماده‌سازی بازیکنان برای مسابقات ملی و بین‌المللی است. شاگردانم شامل ۳ قهرمان ملی و بیش از ۱۵ نفر از اعضای تیم ملی ایران هستند. روش تدریس من ترکیبی از تحلیل تکنیکی دقیق، روانشناسی ورزشی پیشرفته و برنامه‌های تمرینی شخصی‌سازی‌شده است.',
    achievements:['مربی سال فدراسیون ۱۴۰۲','پرورش ۳ قهرمان ملی','مربی تیم ملی ایران ۱۴۰۰-۱۴۰۲','۱۵+ نفر عضو تیم ملی از شاگردانم'],
    hourlyRate:800000,
    lessonTypes: ['private', 'group', 'online'],
    gallery:['/images/billiadr-club-1.jpg','/images/billiadr-club-3.jpg','/images/billiadr-club-1.jpg'],
    club:{ name:'باشگاه سنچوری تهران', id:'1' },
  },
};

const PACKAGES: Package[] = [
  { id:'starter', title:'استارتر',    sessions:4,  price:2800000,  perSession:700000, color:'#06b6d4', features:['۴ جلسه ۶۰ دقیقه‌ای','ارزیابی اولیه','برنامه تمرینی پایه','پشتیبانی پیامی'] },
  { id:'pro',     title:'حرفه‌ای',   sessions:8,  price:5600000,  perSession:700000, color:'#C7A66A', popular:true, features:['۸ جلسه ۹۰ دقیقه‌ای','ارزیابی جامع','برنامه شخصی‌سازی‌شده','ویدیوی تحلیل ضربات','پشتیبانی ۲۴ ساعته'] },
  { id:'elite',   title:'الیت',      sessions:16, price:9600000,  perSession:600000, color:'#a78bfa', features:['۱۶ جلسه ۲ ساعته','تحلیل کامل تکنیک','شرکت در مسابقات','آمادگی تورنومنت','دسترسی نامحدود پیامی','ویدیو بازی‌های تمرینی'] },
];

const SCHEDULE: TimeSlot[] = [
  { day:'شنبه',     slots:[{time:'۱۰:۰۰',available:true},{time:'۱۲:۰۰',available:false},{time:'۱۶:۰۰',available:true},{time:'۱۸:۰۰',available:true}] },
  { day:'یکشنبه',   slots:[{time:'۱۰:۰۰',available:false},{time:'۱۴:۰۰',available:true},{time:'۱۶:۰۰',available:false},{time:'۲۰:۰۰',available:true}] },
  { day:'دوشنبه',   slots:[{time:'۱۰:۰۰',available:true},{time:'۱۲:۰۰',available:true},{time:'۱۸:۰۰',available:false},{time:'۲۰:۰۰',available:true}] },
  { day:'سه‌شنبه',  slots:[{time:'۱۴:۰۰',available:true},{time:'۱۶:۰۰',available:true},{time:'۱۸:۰۰',available:true},{time:'۲۰:۰۰',available:false}] },
];

const REVIEWS: Review[] = [
  { name:'امیرحسین رضایی', rating:5, text:'در ۶ ماه با کاوه، از یک بازیکن متوسط به قهرمان استان تبدیل شدم. روش تدریسش کاملاً علمیه و نتیجه‌گرا.', date:'۱۴۰۴/۰۲/۱۵', level:'حرفه‌ای' },
  { name:'سارا محمدی',     rating:5, text:'بهترین مربی اسنوکری که تا حالا کار کردم. صبور، دقیق، و واقعاً به پیشرفت شاگرد اهمیت میده.', date:'۱۴۰۴/۰۱/۲۸', level:'نیمه‌حرفه‌ای' },
  { name:'نیما کریمی',     rating:5, text:'بریک‌های بالای ۱۰۰ برام معنا داشتن بعد از تمرین با کاوه. تحلیل ویدیویی‌ش خارق‌العاده‌ست.', date:'۱۴۰۴/۰۱/۱۰', level:'حرفه‌ای' },
];

function toFa(v: string|number){ return String(v).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d))); }

export default function CoachProfilePage() {
  const params = useParams();
  const id     = String(params.id ?? 'c1');
  const coach  = COACHES[id] ?? COACHES['c1'];
  const { user } = useAuthStore();

  const [tab,        setTab]       = useState<'overview'|'schedule'|'packages'|'reviews'>('overview');
  const [followed,   setFollowed]  = useState(false);
  const [selPkg,     setSelPkg]    = useState<string|null>(null);
  const [selSlot,    setSelSlot]   = useState<{day:string;time:string}|null>(null);
  const [bookStep,   setBookStep]  = useState(0);
  const [scrollY,    setScrollY]   = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const fn = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(()=>setScrollY(window.scrollY)); };
    window.addEventListener('scroll', fn, { passive:true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY/600);

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;} }
        @keyframes pulse   { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes ambient { 0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-14px);} }

        .tab-b { padding:10px 20px; border-radius:10px; font-size:13px; font-weight:600; border:1px solid transparent; cursor:pointer; font-family:inherit; transition:all 0.3s; white-space:nowrap; }
        .tab-b.active { background:rgba(199,166,106,0.10); border-color:rgba(199,166,106,0.30); color:#A07840; }
        .tab-b:not(.active) { background:#FFFFFF; color:rgba(0,0,0,0.42); }
        .tab-b:not(.active):hover { background:rgba(0,0,0,0.04); color:rgba(0,0,0,0.60); }

        .slot-btn { padding:10px 12px; border-radius:11px; font-size:13px; font-weight:600; border:1px solid; cursor:pointer; font-family:inherit; transition:all 0.2s; text-align:center; }
        .slot-avail { background:rgba(0,0,0,0.03); border-color:rgba(0,0,0,0.07); color:rgba(0,0,0,0.48); }
        .slot-avail:hover { background:rgba(199,166,106,0.08); border-color:rgba(199,166,106,0.3); color:#A07840; }
        .slot-sel  { background:rgba(199,166,106,0.14); border-color:rgba(199,166,106,0.5); color:#A07840; box-shadow:0 0 14px rgba(199,166,106,0.2); }
        .slot-busy { background:rgba(239,68,68,0.04); border-color:rgba(239,68,68,0.12); color:rgba(239,68,68,0.3); cursor:not-allowed; }

        .pkg-card { border-radius:20px; padding:24px; transition:all 0.35s; cursor:pointer; position:relative; overflow:hidden; }
        .pkg-card:hover { transform:translateY(-5px); }

        @media(max-width:900px){ .profile-g{grid-template-columns:1fr !important;} .pkg-g{grid-template-columns:1fr !important;} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#F7F7F5', paddingBottom:'80px' }}>

        {/* ══ HERO ══ */}
        <div style={{ position:'relative', height:'clamp(460px,60vh,640px)', overflow:'hidden' }}>
          <img src={coach.coverImg} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.15) saturate(0.4) contrast(1.2)' }}/>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 55% 65% at 20% 70%,${coach.avatarColor}10 0%,transparent 100%)` }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(2,8,6,0.5) 0%,transparent 30%,rgba(2,8,6,0.97) 100%)' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to left,rgba(2,8,6,0.6) 0%,transparent 55%)' }}/>

          {/* Ambient */}
          <div style={{ position:'absolute', top:'-10%', left:'-5%', width:'50vw', height:'50vw', maxWidth:'500px', borderRadius:'50%', background:`radial-gradient(${coach.avatarColor}07,transparent 65%)`, filter:'blur(40px)', animation:'ambient 14s ease-in-out infinite', pointerEvents:'none' }}/>

          {/* Nav */}
          <div style={{ position:'absolute', top:'24px', left:0, right:0, padding:'0 clamp(16px,4vw,48px)', display:'flex', justifyContent:'space-between', zIndex:10 }}>
            <Link href="/coaches" style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration:'none', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(16px)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:'10px', padding:'7px 14px' }}>
              <ChevronRight size={13}/> مربیان
            </Link>
            <button style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.5)', fontSize: '14px', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(16px)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:'10px', padding:'7px 14px', cursor:'pointer', fontFamily:'inherit' }}>
              <Share2 size={12}/> اشتراک
            </button>
          </div>

          {/* Content */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'clamp(24px,4vw,52px)', zIndex:10, opacity:heroOpacity }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:'24px', flexWrap:'wrap' }}>
              {/* Avatar */}
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:'clamp(72px,12vw,108px)', height:'clamp(72px,12vw,108px)', borderRadius:'22px', background:`linear-gradient(135deg,${coach.avatarColor},${coach.avatarColor}80)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 'clamp(31px, 6.6vw, 48px)', fontWeight:900, color:'#fff', border:'3px solid rgba(199,166,106,0.4)', boxShadow:`0 0 40px ${coach.avatarColor}30,0 20px 60px rgba(0,0,0,0.5)` }}>
                  {coach.avatar}
                </div>
                {coach.isOnline && <div style={{ position:'absolute', bottom:'4px', right:'4px', width:'14px', height:'14px', borderRadius:'50%', background:'#C7A66A', border:'2px solid #F7F7F5', boxShadow:'0 0 10px rgba(199,166,106,0.60)' }}/>}
              </div>

              <div style={{ flex:1, minWidth:'200px' }}>
                <div style={{ display:'flex', gap:'8px', marginBottom:'10px', flexWrap:'wrap' }}>
                  {coach.isFederation && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'20px', padding:'4px 13px', backdropFilter:'blur(16px)' }}>
                      <Shield size={10} style={{ color:'#f59e0b' }}/><span style={{ fontSize: '10px', color:'#f59e0b', fontWeight:700 }}>مربی فدراسیون</span>
                    </div>
                  )}
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:`${coach.avatarColor}12`, border:`1px solid ${coach.avatarColor}28`, borderRadius:'20px', padding:'4px 13px', backdropFilter:'blur(16px)' }}>
                    <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:coach.avatarColor, animation:'pulse 2s infinite', display:'inline-block' }}/>
                    <span style={{ fontSize: '10px', color:coach.avatarColor, fontWeight:700, letterSpacing:'0.12em' }}>PRO COACH</span>
                  </div>
                </div>

                <h1 style={{ fontSize: 'clamp(26px, 5.5vw, 53px)', fontWeight:900, color:'#fff', margin:'0 0 8px', letterSpacing:'-0.035em', lineHeight:1.0, textShadow:`0 0 60px ${coach.avatarColor}20` }}>
                  {coach.name}
                </h1>
                <div style={{ fontSize: '16px', color:'rgba(255,255,255,0.5)', marginBottom:'10px' }}>{coach.title}</div>

                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(0,0,0,0.06)', backdropFilter:'blur(12px)', borderRadius:'20px', padding:'5px 13px', fontSize: '14px', color:'rgba(255,255,255,0.8)' }}>
                    <MapPin size={10} style={{ color:'#C7A66A' }}/>{coach.city}
                  </div>
                  <div style={{ display:'flex', gap:'2px', alignItems:'center', background:'rgba(0,0,0,0.06)', backdropFilter:'blur(12px)', borderRadius:'20px', padding:'5px 13px' }}>
                    {[1,2,3,4,5].map(s=><Star key={s} size={11} style={{ color:'#f59e0b', fill: s<=Math.floor(coach.rating)?'#f59e0b':'transparent' }}/>)}
                    <span style={{ fontSize: '14px', color:'rgba(255,255,255,0.7)', marginRight:'5px' }}>{coach.rating}</span>
                    <span style={{ fontSize: '12px', color:'rgba(255,255,255,0.35)', marginRight:'3px' }}>({toFa(coach.reviewCount)})</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', flexShrink:0 }}>
                <button onClick={()=>setFollowed(f=>!f)} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'11px 22px', borderRadius:'12px', border:'none', background: followed?'rgba(199,166,106,0.15)':'linear-gradient(135deg,#C7A66A,#A07840)', color: followed?'#C7A66A':'#fff', fontSize: '15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.3s', boxShadow: followed?'none':'0 8px 24px rgba(199,166,106,0.3)', ...(followed?{border:'1px solid rgba(199,166,106,0.3)'}:{}) }}>
                  {followed?<><Check size={14}/>دنبال می‌کنید</>:<><UserPlus size={14}/>دنبال کردن</>}
                </button>
                <button style={{ display:'flex', alignItems:'center', gap:'7px', padding:'11px 18px', borderRadius:'12px', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', color:'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.3s' }}>
                  <MessageCircle size={14}/>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ QUICK STATS BAR ══ */}
        <div style={{ background:'rgba(0,0,0,0.02)', borderBottom:'1px solid rgba(0,0,0,0.04)', padding:'0 clamp(16px,4vw,48px)' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
            {[
              { v:toFa(coach.experience)+'سال', l:'تجربه',     c:coach.avatarColor },
              { v:toFa(coach.students),          l:'شاگرد',    c:'#a78bfa'          },
              { v:toFa(coach.sessions),          l:'جلسه',     c:'#06b6d4'          },
              { v:toFa((coach.hourlyRate/1000000).toFixed(1))+'م', l:'تومان/ساعت', c:'#f59e0b' },
            ].map((s,i) => (
              <div key={i} style={{ padding:'18px 16px', textAlign:'center', borderLeft: i>0?'1px solid rgba(0,0,0,0.04)':'none' }}>
                <div style={{ fontSize: 'clamp(20px, 2.8vw, 26px)', fontWeight:900, color:'#111111', letterSpacing:'-0.02em', textShadow:`0 0 16px ${s.c}25` }}>{s.v}</div>
                <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.35)', marginTop:'3px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ MAIN CONTENT ══ */}
        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'32px', overflowX:'auto', padding:'2px' }}>
            {[{k:'overview',l:'خلاصه'},{k:'schedule',l:'رزرو جلسه'},{k:'packages',l:'پکیج‌ها'},{k:'reviews',l:`نظرات (${coach.reviewCount})`}].map(t => (
              <button key={t.k} className={`tab-b ${tab===t.k?'active':''}`} onClick={()=>setTab(t.k as any)}>{t.l}</button>
            ))}
          </div>

          <div className="profile-g" style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'28px', alignItems:'start' }}>

            {/* ── LEFT ── */}
            <div>

              {/* ════ OVERVIEW ════ */}
              {tab==='overview' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:'20px' }}>

                  {/* Bio */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight:800, color:'#111111', margin:'0 0 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:`linear-gradient(180deg,${coach.avatarColor},#06b6d4)`, borderRadius:'2px', display:'inline-block' }}/>
                      درباره مربی
                    </h3>
                    <p style={{ fontSize: '16px', color:'rgba(0,0,0,0.50)', lineHeight:1.9, margin:'0 0 20px' }}>{coach.bio}</p>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
                      {[
                        { l:'تخصص اصلی', v:coach.speciality[0], icon:<Target size={13} style={{ color:coach.avatarColor }}/> },
                        { l:'شهر',       v:coach.city,           icon:<MapPin size={13} style={{ color:'#06b6d4' }}/> },
                        { l:'باشگاه',    v:coach.club.name,      icon:<Shield size={13} style={{ color:'#f59e0b' }}/> },
                        { l:'زبان‌ها',   v:coach.languages.join('، '), icon:<Activity size={13} style={{ color:'#a78bfa' }}/> },
                      ].map((r,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', background:'rgba(0,0,0,0.02)', border:'1px solid rgba(0,0,0,0.04)', borderRadius:'12px' }}>
                          <span style={{ flexShrink:0 }}>{r.icon}</span>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.35)', marginBottom:'2px' }}>{r.l}</div>
                            <div style={{ fontSize: '15px', fontWeight:600, color:'#111111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.v}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight:800, color:'#111111', margin:'0 0 18px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#f59e0b,#a78bfa)', borderRadius:'2px', display:'inline-block' }}/>
                      گواهینامه‌ها و مدارک
                    </h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                      {coach.certifications.map((cert: string, i: number) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px 16px', background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.12)', borderRadius:'14px' }}>
                          <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <Award size={14} style={{ color:'#f59e0b' }}/>
                          </div>
                          <span style={{ fontSize: '15px', color:'rgba(0,0,0,0.45)', fontWeight:600 }}>{cert}</span>
                          <Check size={13} style={{ color:'#C7A66A', marginRight:'auto', flexShrink:0 }}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Achievements */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight:800, color:'#111111', margin:'0 0 18px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius:'2px', display:'inline-block' }}/>
                      دستاوردها
                    </h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {coach.achievements.map((a: string, i: number) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:'rgba(199,166,106,0.04)', border:'1px solid rgba(199,166,106,0.1)', borderRadius:'12px' }}>
                          <Trophy size={13} style={{ color:'#C7A66A', flexShrink:0 }}/>
                          <span style={{ fontSize: '15px', color:'rgba(0,0,0,0.48)' }}>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gallery */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', overflow:'hidden' }}>
                    <div style={{ padding:'22px 24px 16px', fontSize: '17px', fontWeight:800, color:'#111111', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#a78bfa,#06b6d4)', borderRadius:'2px', display:'inline-block' }}/>
                      گالری
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'4px', padding:'0 4px 4px' }}>
                      {coach.gallery.map((img: string, i: number) => (
                        <div key={i} style={{ aspectRatio:'16/9', overflow:'hidden', borderRadius:'10px', position:'relative' }}>
                          <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.45)' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
                          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Play size={16} style={{ color:'rgba(255,255,255,0.5)' }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ════ SCHEDULE ════ */}
              {tab==='schedule' && (
                <div style={{ animation:'fadeUp 0.4s ease both' }}>
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px', marginBottom:'16px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight:800, color:'#111111', margin:'0 0 8px' }}>انتخاب زمان جلسه</h3>
                    <p style={{ fontSize: '15px', color:'rgba(0,0,0,0.42)', margin:'0 0 22px' }}>روی ساعت مورد نظر کلیک کنید تا رزرو کنید.</p>

                    {/* Legend */}
                    <div style={{ display:'flex', gap:'16px', marginBottom:'20px', fontSize: '13px', color:'rgba(0,0,0,0.42)' }}>
                      {[{bg:'rgba(0,0,0,0.05)',bc:'rgba(0,0,0,0.08)',l:'آزاد'},{bg:'rgba(199,166,106,0.14)',bc:'rgba(199,166,106,0.4)',l:'انتخاب'},{bg:'rgba(239,68,68,0.04)',bc:'rgba(239,68,68,0.15)',l:'مشغول'}].map((x,i) => (
                        <span key={i} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                          <span style={{ width:'12px', height:'12px', borderRadius:'4px', background:x.bg, border:`1px solid ${x.bc}`, display:'inline-block' }}/>
                          {x.l}
                        </span>
                      ))}
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                      {SCHEDULE.map(day => (
                        <div key={day.day}>
                          <div style={{ fontSize: '14px', fontWeight:700, color:'rgba(0,0,0,0.45)', marginBottom:'8px', letterSpacing:'0.03em' }}>{day.day}</div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
                            {day.slots.map(slot => {
                              const isSel = selSlot?.day===day.day && selSlot?.time===slot.time;
                              return (
                                <button key={slot.time}
                                  className={`slot-btn ${!slot.available?'slot-busy':isSel?'slot-sel':'slot-avail'}`}
                                  disabled={!slot.available}
                                  onClick={()=>setSelSlot(isSel?null:{day:day.day,time:slot.time})}
                                  style={{ borderColor:!slot.available?'rgba(239,68,68,0.12)':isSel?'rgba(199,166,106,0.5)':'rgba(0,0,0,0.07)', background:!slot.available?'rgba(239,68,68,0.04)':isSel?'rgba(199,166,106,0.12)':'rgba(0,0,0,0.03)', color:!slot.available?'rgba(239,68,68,0.3)':isSel?'#C7A66A':'rgba(0,0,0,0.48)', boxShadow:isSel?'0 0 14px rgba(199,166,106,0.25)':'none' }}>
                                  {slot.time}
                                  {!slot.available && <div style={{ fontSize: '10px', opacity:0.6, marginTop:'2px' }}>مشغول</div>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selSlot && (
                      <div style={{ marginTop:'20px', padding:'14px 18px', background:'rgba(199,166,106,0.08)', border:'1px solid rgba(199,166,106,0.22)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px', animation:'fadeUp 0.3s ease both' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#C7A66A', fontSize: '16px', fontWeight:700 }}>
                          <Calendar size={14}/>
                          {selSlot.day} — {selSlot.time}
                        </div>
                        <Link href={user?`/booking/${coach.club.id}`:'/login'} style={{ padding:'10px 22px', background:'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius:'11px', color:'#fff', fontSize: '15px', fontWeight:700, textDecoration:'none', boxShadow:'0 6px 18px rgba(199,166,106,0.3)' }}>
                          رزرو این جلسه →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ════ PACKAGES ════ */}
              {tab==='packages' && (
                <div style={{ animation:'fadeUp 0.4s ease both' }}>
                  <div className="pkg-g" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
                    {PACKAGES.map(pkg => (
                      <div key={pkg.id} className="pkg-card" onClick={()=>setSelPkg(pkg.id===selPkg?null:pkg.id)}
                        style={{ background: selPkg===pkg.id?`${pkg.color}0e`:'#FFFFFF', border:`1px solid ${selPkg===pkg.id?`${pkg.color}40`:'rgba(0,0,0,0.07)'}`, boxShadow: selPkg===pkg.id?`0 12px 36px rgba(0,0,0,0.4),0 0 0 1px ${pkg.color}20`:'none' }}>

                        {pkg.popular && (
                          <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', background:`linear-gradient(135deg,${pkg.color},${pkg.color}cc)`, color:'#fff', fontSize: '10px', fontWeight:700, padding:'4px 16px', borderRadius:'0 0 12px 12px' }}>محبوب‌ترین</div>
                        )}

                        <div style={{ marginTop: pkg.popular?'16px':'0', marginBottom:'16px' }}>
                          <div style={{ fontSize: '13px', color:pkg.color, fontWeight:700, marginBottom:'6px' }}>{pkg.title}</div>
                          <div style={{ fontSize: '31px', fontWeight:900, color:'#111111', letterSpacing:'-0.03em', marginBottom:'2px', textShadow:`0 0 20px ${pkg.color}30` }}>
                            {toFa((pkg.price/1000000).toFixed(1))}م
                          </div>
                          <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.40)' }}>{toFa(pkg.sessions)} جلسه · {toFa((pkg.perSession/1000).toLocaleString())} هزار/جلسه</div>
                        </div>

                        <div style={{ height:'1px', background:'rgba(0,0,0,0.04)', marginBottom:'14px' }}/>

                        <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'18px' }}>
                          {pkg.features.map((f,i) => (
                            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'7px', fontSize: '14px', color:'rgba(0,0,0,0.48)' }}>
                              <Check size={12} style={{ color:pkg.color, flexShrink:0, marginTop:'1px' }}/>{f}
                            </div>
                          ))}
                        </div>

                        <button style={{ width:'100%', padding:'11px', borderRadius:'12px', background: selPkg===pkg.id?`linear-gradient(135deg,${pkg.color},${pkg.color}cc)`:`${pkg.color}10`, color: selPkg===pkg.id?'#fff':pkg.color, fontSize: '14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.3s', boxShadow: selPkg===pkg.id?`0 6px 18px ${pkg.color}35`:'none', border:`1px solid ${selPkg===pkg.id?'transparent':`${pkg.color}22`}` }}>
                          {selPkg===pkg.id?'انتخاب شد ✓':'انتخاب این پکیج'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {selPkg && (
                    <div style={{ marginTop:'20px', padding:'18px 22px', background:'rgba(199,166,106,0.06)', border:'1px solid rgba(199,166,106,0.2)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', animation:'fadeUp 0.3s ease both' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight:800, color:'#111111', marginBottom:'3px' }}>
                          پکیج {PACKAGES.find(p=>p.id===selPkg)?.title} انتخاب شد
                        </div>
                        <div style={{ fontSize: '14px', color:'rgba(0,0,0,0.42)' }}>برای ادامه روی دکمه رزرو کلیک کنید</div>
                      </div>
                      <Link href={user?`/booking/${coach.club.id}`:'/login'} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 24px', background:'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius:'12px', color:'#fff', fontSize: '16px', fontWeight:700, textDecoration:'none', boxShadow:'0 6px 18px rgba(199,166,106,0.3)' }}>
                        <Calendar size={15}/> رزرو پکیج →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* ════ REVIEWS ════ */}
              {tab==='reviews' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:'12px' }}>
                  {/* Summary */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px', display:'flex', gap:'28px', alignItems:'center', flexWrap:'wrap', marginBottom:'4px' }}>
                    <div style={{ textAlign:'center', flexShrink:0 }}>
                      <div style={{ fontSize: '57px', fontWeight:900, color:'#111111', lineHeight:1, letterSpacing:'-0.04em' }}>{coach.rating}</div>
                      <div style={{ display:'flex', gap:'3px', justifyContent:'center', margin:'7px 0 4px' }}>
                        {[1,2,3,4,5].map(s=><Star key={s} size={14} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>)}
                      </div>
                      <div style={{ fontSize: '13px', color:'rgba(0,0,0,0.40)' }}>{toFa(coach.reviewCount)} نظر</div>
                    </div>
                    <div style={{ flex:1, minWidth:'180px', display:'flex', flexDirection:'column', gap:'6px' }}>
                      {[{s:5,p:91},{s:4,p:6},{s:3,p:2},{s:2,p:1},{s:1,p:0}].map(r => (
                        <div key={r.s} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <span style={{ fontSize: '12px', color:'rgba(0,0,0,0.42)', width:'12px' }}>{toFa(r.s)}</span>
                          <Star size={9} style={{ color:'#f59e0b', fill:'#f59e0b', flexShrink:0 }}/>
                          <div style={{ flex:1, height:'5px', background:'rgba(0,0,0,0.05)', borderRadius:'3px', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${r.p}%`, background:'linear-gradient(90deg,#f59e0b,#f59e0b70)', borderRadius:'3px' }}/>
                          </div>
                          <span style={{ fontSize: '12px', color:'rgba(0,0,0,0.30)', width:'28px', textAlign:'left' }}>{toFa(r.p)}٪</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {REVIEWS.map((r,i) => (
                    <div key={i} style={{ padding:'20px', background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.05)', borderRadius:'18px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:`linear-gradient(135deg,${coach.avatarColor},${coach.avatarColor}80)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: '18px', fontWeight:900, color:'#fff', flexShrink:0 }}>
                            {r.name[0]}
                          </div>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                              <span style={{ fontSize: '16px', fontWeight:700, color:'#111111' }}>{r.name}</span>
                              <span style={{ fontSize: '10px', color:coach.avatarColor, background:`${coach.avatarColor}12`, border:`1px solid ${coach.avatarColor}22`, borderRadius:'20px', padding:'2px 8px', fontWeight:700 }}>{r.level}</span>
                            </div>
                            <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.35)' }}>{r.date}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:'2px', flexShrink:0 }}>
                          {[1,2,3,4,5].map(s=><Star key={s} size={12} style={{ color: s<=r.rating?'#f59e0b':'rgba(0,0,0,0.08)', fill: s<=r.rating?'#f59e0b':'transparent' }}/>)}
                        </div>
                      </div>
                      <p style={{ fontSize: '15px', color:'rgba(0,0,0,0.50)', margin:0, lineHeight:1.75 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <div style={{ position:'sticky', top:'80px', display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* Book CTA */}
              <div style={{ background:'#FFFFFF', border:`1px solid ${coach.avatarColor}25`, borderRadius:'22px', padding:'22px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'120px', height:'1px', background:`linear-gradient(90deg,transparent,${coach.avatarColor}60,transparent)`, boxShadow:`0 0 14px ${coach.avatarColor}40` }}/>
                <div style={{ fontSize: '12px', color:`${coach.avatarColor}80`, fontWeight:700, marginBottom:'14px', textAlign:'center' }}>رزرو جلسه</div>
                <div style={{ fontSize: '31px', fontWeight:900, color:'#C7A66A', textAlign:'center', letterSpacing:'-0.03em', marginBottom:'4px', textShadow:'0 0 20px rgba(199,166,106,0.4)' }}>
                  {toFa(coach.hourlyRate.toLocaleString())}
                </div>
                <div style={{ fontSize: '13px', color:'rgba(0,0,0,0.40)', textAlign:'center', marginBottom:'18px' }}>تومان / ساعت</div>

                <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
                  {['private','group','online'].filter(t=>coach.lessonTypes.includes(t)).map(t => (
                    <div key={t} style={{ flex:1, padding:'8px 10px', background:'rgba(0,0,0,0.03)', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', textAlign:'center', fontSize: '13px', color:'rgba(0,0,0,0.45)', fontWeight:600 }}>
                      {t==='private'?'خصوصی':t==='group'?'گروهی':'آنلاین'}
                    </div>
                  ))}
                </div>

                <button onClick={()=>setTab('schedule')} style={{ width:'100%', padding:'14px', borderRadius:'13px', border:'none', background:`linear-gradient(135deg,${coach.avatarColor},${coach.avatarColor}cc)`, color:'#fff', fontSize: '16px', fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 8px 24px ${coach.avatarColor}30`, transition:'all 0.3s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  <Calendar size={16}/> رزرو جلسه
                </button>
              </div>

              {/* Specialities */}
              <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'20px' }}>
                <div style={{ fontSize: '13px', color:'rgba(0,0,0,0.35)', fontWeight:700, marginBottom:'14px' }}>تخصص‌ها</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
                  {coach.speciality.map((s: string) => (
                    <span key={s} style={{ fontSize: '13px', color:coach.avatarColor, background:`${coach.avatarColor}10`, border:`1px solid ${coach.avatarColor}22`, borderRadius:'20px', padding:'5px 12px', fontWeight:600 }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Club */}
              <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'20px' }}>
                <div style={{ fontSize: '13px', color:'rgba(199,166,106,0.6)', letterSpacing:'0.18em', fontWeight:700, marginBottom:'12px' }}>CLUB</div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(199,166,106,0.1)', border:'1px solid rgba(199,166,106,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: '22px', flexShrink:0 }}>🏆</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight:700, color:'#111111', marginBottom:'3px' }}>{coach.club.name}</div>
                    <Link href={`/clubs/${coach.club.id}`} style={{ fontSize: '13px', color:'#C7A66A', textDecoration:'none', fontWeight:600 }}>مشاهده باشگاه ←</Link>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'20px' }}>
                <div style={{ fontSize: '13px', color:'rgba(167,139,250,0.6)', fontWeight:700, marginBottom:'14px' }}>آمار مربی</div>
                {[
                  { l:'شاگردان فعال',   v:toFa(coach.students),  c:'#a78bfa' },
                  { l:'جلسات برگزار',   v:toFa(coach.sessions),  c:'#06b6d4' },
                  { l:'سال‌های تجربه',  v:toFa(coach.experience),c:'#f59e0b' },
                  { l:'زبان تدریس',     v:toFa(coach.languages.length), c:'#C7A66A' },
                ].map((s,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom: i<3?'1px solid rgba(0,0,0,0.04)':'none' }}>
                    <span style={{ fontSize: '14px', color:'rgba(0,0,0,0.42)' }}>{s.l}</span>
                    <span style={{ fontSize: '15px', fontWeight:700, color:s.c }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}