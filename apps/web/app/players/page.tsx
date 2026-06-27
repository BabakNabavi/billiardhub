'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { Search, MapPin, X, ChevronLeft, Shield } from 'lucide-react';

interface Player {
  id: string;
  firstName: string; lastName: string;
  verificationStatus: string;
  bio: string; city: string; avatar: string;
  playerProfile: { level: string; specialty: string; experience: string };
}

const levelLabels: Record<string, string> = {
  league1: 'لیگ یک', premier: 'دسته برتر',
  national: 'تیم ملی', world_pro: 'حرفه‌ای جهانی',
};
const levelRank: Record<string, number> = { world_pro: 4, national: 3, premier: 2, league1: 1 };

const specialtyMeta: Record<string, { label: string; color: string }> = {
  snooker:  { label: 'اسنوکر',        color: '#C7A66A' },
  pocket:   { label: 'پاکت بیلیارد', color: '#3b82f6' },
  highball: { label: 'هی‌بال',         color: '#8b5cf6' },
};

const MOCK: Player[] = [
  { id:'1', firstName:'علی',    lastName:'محمدی', verificationStatus:'verified', bio:'قهرمان لیگ برتر اسنوکر ایران', city:'تهران', avatar:'', playerProfile:{ level:'premier',  specialty:'snooker',  experience:'۱۲' } },
  { id:'2', firstName:'رضا',    lastName:'احمدی', verificationStatus:'verified', bio:'نماینده ایران در مسابقات آسیایی', city:'مشهد', avatar:'', playerProfile:{ level:'national', specialty:'snooker',  experience:'۸'  } },
  { id:'3', firstName:'امیر',   lastName:'کریمی', verificationStatus:'pending',  bio:'بازیکن حرفه‌ای پاکت بیلیارد',    city:'اصفهان', avatar:'', playerProfile:{ level:'league1',  specialty:'pocket',   experience:'۵'  } },
  { id:'4', firstName:'سعید',   lastName:'رضایی', verificationStatus:'verified', bio:'مربی و بازیکن ارشد هی‌بال',       city:'شیراز', avatar:'', playerProfile:{ level:'premier',  specialty:'highball', experience:'۱۰' } },
  { id:'5', firstName:'حسین',   lastName:'علوی',  verificationStatus:'verified', bio:'قهرمان استانی اسنوکر',             city:'تبریز', avatar:'', playerProfile:{ level:'league1',  specialty:'snooker',  experience:'۶'  } },
  { id:'6', firstName:'مجید',   lastName:'صادقی', verificationStatus:'verified', bio:'بازیکن ملی‌پوش پاکت بیلیارد',     city:'کرج',   avatar:'', playerProfile:{ level:'national', specialty:'pocket',   experience:'۹'  } },
  { id:'7', firstName:'فرهاد',  lastName:'موسوی', verificationStatus:'verified', bio:'نایب قهرمان مسابقات کشوری هی‌بال', city:'اهواز', avatar:'', playerProfile:{ level:'premier',  specialty:'highball', experience:'۷'  } },
  { id:'8', firstName:'کاوه',   lastName:'نوری',  verificationStatus:'pending',  bio:'استعداد جوان اسنوکر ایران',        city:'تهران', avatar:'', playerProfile:{ level:'league1',  specialty:'snooker',  experience:'۳'  } },
];

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

function Avatar({ player, color, size = 52 }: { player: Player; color: string; size?: number }) {
  const initials = (player.firstName?.[0] ?? '') + (player.lastName?.[0] ?? '');
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg,${color}33,${color}11)`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontSize: size * 0.34, fontWeight: 900, color }}>
      {player.avatar
        ? <img src={player.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  );
}

export default function PlayersPage() {
  const [players, setPlayers]       = useState<Player[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [specialty, setSpecialty]   = useState('all');
  const [sortBy, setSortBy]         = useState<'level' | 'exp'>('level');

  useEffect(() => {
    api.get('/user/by-role/player')
      .then(res => { setPlayers(res.data?.length > 1 ? res.data : MOCK); setLoading(false); })
      .catch(() => { setPlayers(MOCK); setLoading(false); });
  }, []);

  const filtered = players
    .filter(p => {
      const name = `${p.firstName} ${p.lastName} ${p.city}`.toLowerCase();
      if (search && !name.includes(search.toLowerCase())) return false;
      if (specialty !== 'all' && p.playerProfile?.specialty !== specialty) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'level') return (levelRank[b.playerProfile?.level] ?? 0) - (levelRank[a.playerProfile?.level] ?? 0);
      return parseInt(b.playerProfile?.experience ?? '0') - parseInt(a.playerProfile?.experience ?? '0');
    });

  /* top 3 — رنکینگ */
  const top3 = [...players].sort((a, b) => (levelRank[b.playerProfile?.level] ?? 0) - (levelRank[a.playerProfile?.level] ?? 0)).slice(0, 3);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer{ 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
        .srch{ background:transparent;border:none;outline:none;color:#111111;font-size:14px;font-family:inherit;width:100% }
        .srch::placeholder{ color:rgba(0,0,0,0.28) }
        .pcard{ transition:all 0.3s cubic-bezier(0.4,0,0.2,1) }
        .pcard:hover{ transform:translateY(-4px)!important;border-color:rgba(199,166,106,0.30)!important;box-shadow:0 12px 40px rgba(0,0,0,0.12)!important }
        .pill-btn{ transition:all 0.2s;cursor:pointer;font-family:inherit }

        .pgrid{ display:grid;grid-template-columns:repeat(3,1fr);gap:14px }
        @media(max-width:860px){ .pgrid{grid-template-columns:repeat(2,1fr)} }
        @media(max-width:520px){ .pgrid{grid-template-columns:1fr;gap:10px} }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', paddingBottom: 60 }}>

        {/* ══ HERO ══ */}
        <div style={{ position: 'relative', background: 'linear-gradient(180deg,#111111 0%,#1a1a1a 100%)', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: 'clamp(28px,5vw,52px) clamp(16px,4vw,40px) 0', overflow: 'hidden' }}>
          {/* glow orb */}
          <div style={{ position: 'absolute', top: '-30%', right: '-5%', width: '45vw', height: '45vw', maxWidth: 440, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(199,166,106,0.10) 0%,transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '35vw', height: '35vw', maxWidth: 340, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(199,166,106,0.07) 0%,transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 12, color: 'rgba(199,166,106,0.70)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: 8 }}>PLAYER RANKING</div>
            <h1 style={{ fontSize: 'clamp(26px, 4.4vw, 48px)', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '-0.03em' }}>بازیکنان رنکینگی</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.40)', margin: '0 0 28px' }}>بهترین بازیکنان بیلیارد ایران</p>

            {/* TOP 3 podium */}
            {!loading && top3.length > 0 && (
              <div style={{ display: 'flex', gap: 10, paddingBottom: 24, overflowX: 'auto' }}>
                {top3.map((p, i) => {
                  const spec = specialtyMeta[p.playerProfile?.specialty] ?? { label: 'اسنوکر', color: '#C7A66A' };
                  const medals = ['🥇','🥈','🥉'];
                  const heights = [72, 56, 48];
                  return (
                    <Link key={p.id} href={`/players/${p.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 20px', background: i === 0 ? 'rgba(199,166,106,0.12)' : 'rgba(0,0,0,0.05)', border: `1px solid ${i === 0 ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 18, minWidth: 120, transition: 'all 0.3s', cursor: 'pointer' }}>
                        <span style={{ fontSize: 22 }}>{medals[i]}</span>
                        <Avatar player={p} color={spec.color} size={44} />
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', textAlign: 'center', whiteSpace: 'nowrap' }}>{p.firstName} {p.lastName}</div>
                        <span style={{ fontSize: 12, color: spec.color, background: `${spec.color}14`, border: `1px solid ${spec.color}22`, borderRadius: 20, padding: '2px 10px', fontWeight: 700 }}>{spec.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ TOOLBAR ══ */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(16px,3vw,28px) clamp(16px,3vw,32px) 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', border: `1.5px solid ${searchFocus ? 'rgba(199,166,106,0.45)' : 'rgba(0,0,0,0.10)'}`, borderRadius: 14, padding: '0 16px', height: 48, transition: 'all 0.3s', boxShadow: searchFocus ? '0 0 0 3px rgba(199,166,106,0.10)' : 'none' }}>
              <Search size={15} color="rgba(0,0,0,0.30)" />
              <input className="srch" type="text" value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)} placeholder="جستجوی نام یا شهر..." />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.35)', padding: 0, display: 'flex', flexShrink: 0 }}><X size={14} /></button>}
            </div>

            {/* Filters row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* specialty filter */}
              {[
                { v: 'all',      l: 'همه رشته‌ها' },
                { v: 'snooker',  l: 'اسنوکر' },
                { v: 'pocket',   l: 'پاکت' },
                { v: 'highball', l: 'هی‌بال' },
              ].map(f => (
                <button key={f.v} className="pill-btn" onClick={() => setSpecialty(f.v)} style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${specialty === f.v ? 'rgba(199,166,106,0.50)' : 'rgba(0,0,0,0.08)'}`, background: specialty === f.v ? 'rgba(199,166,106,0.12)' : 'rgba(0,0,0,0.03)', color: specialty === f.v ? '#A07840' : 'rgba(0,0,0,0.45)', fontSize: 14, fontWeight: 600 }}>
                  {f.l}
                </button>
              ))}

              {/* sort */}
              <div style={{ marginRight: 'auto', display: 'flex', gap: 6 }}>
                {[
                  { v: 'level', l: 'سطح' },
                  { v: 'exp',   l: 'تجربه' },
                ].map(s => (
                  <button key={s.v} className="pill-btn" onClick={() => setSortBy(s.v as any)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${sortBy === s.v ? 'rgba(199,166,106,0.45)' : 'rgba(0,0,0,0.08)'}`, background: sortBy === s.v ? 'rgba(199,166,106,0.10)' : 'rgba(0,0,0,0.03)', color: sortBy === s.v ? '#A07840' : 'rgba(0,0,0,0.40)', fontSize: 13, fontWeight: 600 }}>
                    ↕ {s.l}
                  </button>
                ))}
              </div>

              <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.40)' }}>{toFa(filtered.length)} بازیکن</span>
            </div>
          </div>

          {/* ══ GRID ══ */}
          {loading ? (
            <div className="pgrid">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ height: 180, background: '#F3F2EF', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.60) 50%,transparent 100%)', animation: 'shimmer 1.5s infinite' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 44, opacity: 0.20, marginBottom: 14 }}>🎱</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#111111', marginBottom: 6 }}>بازیکنی یافت نشد</div>
              <div style={{ fontSize: 15, color: 'rgba(0,0,0,0.40)' }}>جستجو یا فیلترها را تغییر دهید</div>
            </div>
          ) : (
            <div className="pgrid">
              {filtered.map((player, i) => {
                const spec = specialtyMeta[player.playerProfile?.specialty] ?? { label: 'اسنوکر', color: '#C7A66A' };
                const lvl  = levelLabels[player.playerProfile?.level] ?? player.playerProfile?.level ?? '';
                return (
                  <Link key={player.id} href={`/players/${player.id}`} style={{ textDecoration: 'none' }}>
                    <div className="pcard" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 20, padding: 18, cursor: 'pointer', animation: `fadeUp 0.5s ${i * 0.04}s ease both`, position: 'relative', overflow: 'hidden', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

                      {/* shimmer top line */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${spec.color}55,transparent)` }} />

                      {/* avatar + name */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <Avatar player={player} color={spec.color} size={50} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                            <span style={{ color: '#111111', fontWeight: 800, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.firstName} {player.lastName}</span>
                            {player.verificationStatus === 'verified' && (
                              <Shield size={12} style={{ color: spec.color, flexShrink: 0 }} />
                            )}
                          </div>
                          {player.city && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(0,0,0,0.40)', fontSize: 13 }}>
                              <MapPin size={10} />{player.city}
                            </div>
                          )}
                        </div>
                        <ChevronLeft size={15} color="rgba(0,0,0,0.20)" style={{ flexShrink: 0, marginTop: 2 }} />
                      </div>

                      {/* tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: spec.color, background: `${spec.color}14`, border: `1px solid ${spec.color}22`, borderRadius: 20, padding: '3px 10px' }}>
                          {spec.label}
                        </span>
                        {lvl && (
                          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.50)', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, padding: '3px 10px' }}>
                            {lvl}
                          </span>
                        )}
                        {player.playerProfile?.experience && (
                          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 20, padding: '3px 10px' }}>
                            {player.playerProfile.experience} سال
                          </span>
                        )}
                      </div>

                      {/* bio */}
                      {player.bio && (
                        <div style={{ color: 'rgba(0,0,0,0.48)', fontSize: 14, lineHeight: 1.65, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginTop: 'auto' }}>
                          {player.bio}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
