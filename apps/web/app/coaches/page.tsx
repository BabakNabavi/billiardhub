'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Star, MapPin, CheckCircle, X, ChevronLeft } from 'lucide-react';
import api from '../../lib/api';

const GOLD = '#C7A66A';
const GOLD_DARK = '#A07840';

interface Coach {
  id: string; firstName: string; lastName: string;
  verificationStatus: string; bio: string; city: string; avatar: string;
  coachProfile: { specialty: string; experience: string; certifications: string; sessionPrice: number; };
}

const specialtyLabels: Record<string,string> = {snooker:'اسنوکر',pocket:'پاکت بیلیارد',highball:'هی‌بال'};

const mockCoaches: Coach[] = [
  {id:'1',firstName:'استاد احمد',lastName:'رضایی',verificationStatus:'verified',bio:'مربی ملی‌پوش با ۱۵ سال سابقه تدریس در فدراسیون',city:'تهران',avatar:'',coachProfile:{specialty:'snooker',experience:'۱۵',certifications:'مدرک A فدراسیون جهانی',sessionPrice:500000}},
  {id:'2',firstName:'حسین',lastName:'نوری',verificationStatus:'verified',bio:'قهرمان آسیا و مربی دسته برتر',city:'مشهد',avatar:'',coachProfile:{specialty:'snooker',experience:'۱۲',certifications:'مدرک B فدراسیون',sessionPrice:350000}},
  {id:'3',firstName:'مریم',lastName:'کاظمی',verificationStatus:'verified',bio:'مربی بانوان و متخصص پاکت بیلیارد',city:'اصفهان',avatar:'',coachProfile:{specialty:'pocket',experience:'۸',certifications:'مدرک ملی',sessionPrice:280000}},
  {id:'4',firstName:'سینا',lastName:'محمدی',verificationStatus:'pending',bio:'مربی جوان و قهرمان لیگ برتر',city:'شیراز',avatar:'',coachProfile:{specialty:'pocket',experience:'۵',certifications:'',sessionPrice:200000}},
];

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>(mockCoaches);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(()=>{
    setLoading(true);
    api.get('/user/by-role/coach')
      .then(res=>{
        if(Array.isArray(res.data) && res.data.length > 1) setCoaches(res.data);
        setLoading(false);
      })
      .catch(()=>setLoading(false));
  },[]);

  const filtered=coaches.filter(c=>{
    const matchSearch=`${c.firstName} ${c.lastName} ${c.city}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter=filter==='all'||c.coachProfile?.specialty===filter;
    return matchSearch&&matchFilter;
  });

  return(
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
        .coach-card{transition:all 0.28s cubic-bezier(0.22,1,0.36,1)}
        .coach-card:hover{transform:translateY(-4px);border-color:rgba(199,166,106,0.30)!important;box-shadow:0 16px 48px rgba(0,0,0,0.10)!important}
      `}</style>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg,#111111 0%,#1a1a1a 100%)', padding: 'clamp(40px,5vw,72px) clamp(16px,4vw,40px) clamp(32px,4vw,56px)', direction: 'rtl', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, rgba(199,166,106,0.07) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.20)', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
            <Star size={12} color={GOLD} />
            <span style={{ fontSize: 12, fontWeight: 600, color: GOLD, letterSpacing: '0.06em' }}>CERTIFIED COACHES</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#FFFFFF', margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            مربیان <span style={{ backgroundImage: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>حرفه‌ای</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0 }}>مربیان مجاز فدراسیون بیلیارد ایران</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ background: '#F7F7F5', minHeight: 'calc(100vh - 200px)', padding: 'clamp(24px,4vw,40px) clamp(16px,3vw,32px)', direction: 'rtl' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Toolbar */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '16px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F7F7F5', border: `1.5px solid ${searchFocus ? `rgba(199,166,106,0.45)` : 'rgba(0,0,0,0.10)'}`, borderRadius: 12, padding: '0 14px', height: 44, flex: '1 1 220px', transition: 'all 0.3s', boxShadow: searchFocus ? '0 0 0 3px rgba(199,166,106,0.10)' : 'none' }}>
              <Search size={14} color="rgba(0,0,0,0.30)" />
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>setSearchFocus(true)} onBlur={()=>setSearchFocus(false)}
                placeholder="جستجو بر اساس نام یا شهر..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#111111', fontSize: 13, fontFamily: 'inherit' }} />
              {search && <button onClick={()=>setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.35)', padding: 0, display: 'flex' }}><X size={14}/></button>}
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[{v:'all',l:'همه'},{v:'snooker',l:'اسنوکر'},{v:'pocket',l:'پاکت'},{v:'highball',l:'هی‌بال'}].map(f=>(
                <button key={f.v} onClick={()=>setFilter(f.v)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${filter===f.v ? 'rgba(199,166,106,0.50)' : 'rgba(0,0,0,0.08)'}`, background: filter===f.v ? 'rgba(199,166,106,0.12)' : 'rgba(0,0,0,0.03)', color: filter===f.v ? GOLD_DARK : 'rgba(0,0,0,0.45)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  {f.l}
                </button>
              ))}
            </div>

            <span style={{ marginRight: 'auto', color: 'rgba(0,0,0,0.38)', fontSize: 12 }}>{filtered.length} مربی</span>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {[1,2,3,4].map(i=>(
                <div key={i} style={{ height: 200, background: '#F3F2EF', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.60) 50%,transparent 100%)', animation: 'shimmer 1.5s infinite' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <Star size={40} style={{ opacity: 0.15, display: 'block', margin: '0 auto 14px' }} color="#111111" />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111111', margin: '0 0 6px' }}>مربی‌ای پیدا نشد</p>
              <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)', margin: 0 }}>جستجو یا فیلترها را تغییر دهید</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {filtered.map((coach, i) => (
                <Link key={coach.id} href={`/coaches/${coach.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="coach-card" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 20, padding: 20, cursor: 'pointer', animation: `fadeUp 0.5s ${i*0.05}s ease both`, position: 'relative', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,rgba(199,166,106,0.40),transparent)` }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,rgba(199,166,106,0.15),rgba(160,120,64,0.10))`, border: `1px solid rgba(199,166,106,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD_DARK, fontWeight: 900, fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
                        {coach.avatar ? <img src={coach.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : coach.firstName?.[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ color: '#111111', fontWeight: 700, fontSize: 15 }}>{coach.firstName} {coach.lastName}</span>
                          {coach.verificationStatus === 'verified' && <CheckCircle size={13} color={GOLD} style={{ flexShrink: 0 }} />}
                        </div>
                        {coach.city && <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(0,0,0,0.40)', fontSize: 12 }}><MapPin size={11}/><span>{coach.city}</span></div>}
                      </div>
                      <ChevronLeft size={16} color="rgba(0,0,0,0.20)" />
                    </div>

                    {coach.coachProfile && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {coach.coachProfile.specialty && <span style={{ fontSize: 11, fontWeight: 600, color: GOLD_DARK, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.20)', borderRadius: 20, padding: '3px 10px' }}>{specialtyLabels[coach.coachProfile.specialty] ?? coach.coachProfile.specialty}</span>}
                        {coach.coachProfile.experience && <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, padding: '3px 10px' }}>{coach.coachProfile.experience} سال سابقه</span>}
                        {coach.coachProfile.sessionPrice && <span style={{ fontSize: 11, color: '#16a34a', background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 20, padding: '3px 10px' }}>{coach.coachProfile.sessionPrice.toLocaleString('fa-IR')} ت</span>}
                      </div>
                    )}
                    {coach.coachProfile?.certifications && <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.38)', marginBottom: 8 }}>🏅 {coach.coachProfile.certifications}</div>}
                    {coach.bio && <div style={{ color: 'rgba(0,0,0,0.48)', fontSize: 12, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{coach.bio}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
