'use client'

/* ─────────────────────────────────────────────────────────────
   مسابقات — بازطراحی Championship (۱۴۰۵)
   منطق و داده‌ی قبلی عیناً حفظ شده (تب‌های وضعیت + جستجو +
   شمارنده‌ها + لینک‌ها). پوسته‌ی جدید: پوسترِ سینماییِ قهرمانی
   (عکسِ واقعیِ میز + گریدینگ و اسپات‌لایتِ CSS)، بیلبوردِ
   «رویداد اصلی»، و کارت‌های پریمیوم با نوارِ قهرمان.
   ───────────────────────────────────────────────────────────── */

import { useState } from 'react'
import Link from 'next/link'
import {
  Trophy, Calendar, Search, ChevronLeft, MapPin, Crown, Users, ArrowLeft,
  LayoutGrid, List,
} from 'lucide-react'
import {
  SAMPLE_TOURNAMENTS, GAME_TYPE_LABELS, GAME_TYPE_COLORS,
  STATUS_LABELS, STATUS_COLORS, formatFee, toFa,
  type Tournament, type TournamentStatus,
} from '../../lib/mock-tournaments'

const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'
const BG     = '#F7F7F5'

const TABS: { key: TournamentStatus | 'all'; label: string; pulse?: boolean }[] = [
  { key: 'all',               label: 'همه' },
  { key: 'registration_open', label: 'در حال ثبت‌نام', pulse: true },
  { key: 'live',              label: 'در حال برگزاری', pulse: true },
  { key: 'upcoming',          label: 'به زودی' },
  { key: 'finished',          label: 'پایان یافته' },
]

/* پیلِ وضعیت روی تصویر */
function StatusPill({ t }: { t: Tournament }) {
  const c = STATUS_COLORS[t.status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#fff', background: 'rgba(10,9,7,0.55)', border: `1px solid ${c}66`, borderRadius: 999, padding: '4px 11px', backdropFilter: 'blur(8px)' }}>
      {(t.status === 'live' || t.status === 'registration_open') && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, animation: 'tnPulse 1.8s ease-out infinite' }} />
      )}
      <span style={{ color: c }}>{STATUS_LABELS[t.status]}</span>
    </span>
  )
}

/* ── کارت مسابقه — پریمیوم ── */
function TournamentCard({ t, i }: { t: Tournament; i: number }) {
  const pct  = Math.round((t.registeredCount / t.maxPlayers) * 100)
  const full = t.registeredCount >= t.maxPlayers
  const gameColor = GAME_TYPE_COLORS[t.gameType]

  return (
    <Link href={`/tournaments/${t.id}`} className="tn-card" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
      {/* بنر با گریدینگ سینمایی */}
      <div className="tn-thumb">
        <img src={t.banner} alt={t.name} loading="lazy" />
        <div className="tn-thumb-grade" />
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#fff', background: 'rgba(10,9,7,0.55)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '4px 11px', backdropFilter: 'blur(8px)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: gameColor, boxShadow: `0 0 6px ${gameColor}99` }} />
            {GAME_TYPE_LABELS[t.gameType]}
          </span>
        </div>
        <div style={{ position: 'absolute', top: 12, left: 12 }}><StatusPill t={t} /></div>
        <div style={{ position: 'absolute', insetInline: 12, bottom: 10, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'rgba(255,255,255,0.85)' }}>
          <MapPin size={11} style={{ color: GOLD }} />
          {t.clubName}
        </div>
        <span className="tn-line" />
      </div>

      {/* بدنه */}
      <div style={{ padding: '15px 17px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 className="tn-title">{t.name}</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: SEC }}>
          <Calendar size={13} style={{ color: GOLD_D, flexShrink: 0 }} />
          <span>{t.date} — ساعت {toFa(t.startTime)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: MUT, minWidth: 0 }}>
          <Trophy size={13} style={{ color: GOLD_D, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.prizeInfo}</span>
        </div>

        {/* نوارِ قهرمان برای پایان‌یافته‌ها / ظرفیت برای بقیه */}
        {t.status === 'finished' && t.champion ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.24)', borderRadius: 11, padding: '8px 12px' }}>
            <Crown size={14} style={{ color: GOLD_D }} />
            <span style={{ fontSize: 12, color: MUT }}>قهرمان:</span>
            <span style={{ fontSize: 12.5, fontWeight: 900, color: TEXT }}>{t.champion}</span>
          </div>
        ) : t.status !== 'finished' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, color: MUT, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Users size={11} /> ظرفیت</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: full ? '#B23B2E' : TEXT, fontVariantNumeric: 'tabular-nums' }}>
                {toFa(t.registeredCount)} / {toFa(t.maxPlayers)}
              </span>
            </div>
            <div style={{ height: 5, background: '#EFEBE1', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: full ? '#B23B2E' : `linear-gradient(90deg, ${GOLD}, #8A6020)`, transition: 'width .6s cubic-bezier(.22,1,.36,1)' }} />
            </div>
          </div>
        )}

        {/* فوتر */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #F0EDE5' }}>
          <span style={{ fontSize: 14.5, fontWeight: 900, color: GOLD_D }}>{formatFee(t.entryFee)}</span>
          <span className="tn-cta">
            {t.status === 'registration_open' && !full ? 'ثبت‌نام' : t.status === 'live' ? 'مشاهده زنده' : 'جزئیات'}
            <ChevronLeft size={14} className="ar" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function TournamentsPage() {
  const [tab, setTab]       = useState<TournamentStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [view, setView]     = useState<'grid' | 'list'>('grid')

  const filtered = SAMPLE_TOURNAMENTS.filter(t => {
    const matchTab    = tab === 'all' || t.status === tab
    const matchSearch = !search || t.name.includes(search) || t.clubName.includes(search)
    return matchTab && matchSearch
  })

  const isBrowsing = tab === 'all' && !search
  const mainEvent  = SAMPLE_TOURNAMENTS.find(t => t.status === 'registration_open')
  const gridItems  = isBrowsing && mainEvent ? filtered.filter(t => t.id !== mainEvent.id) : filtered

  const liveCount = SAMPLE_TOURNAMENTS.filter(t => t.status === 'live').length
  const openCount = SAMPLE_TOURNAMENTS.filter(t => t.status === 'registration_open').length

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes tnFadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes tnScaleX { from { opacity:0; transform: scaleX(0); } to { opacity:1; transform: scaleX(1); } }
        @keyframes tnPulse  { 0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.35); } 60% { box-shadow: 0 0 0 6px rgba(255,255,255,0); } }
        @keyframes tnSweep  { from { transform: translateX(-130%) skewX(-18deg); } to { transform: translateX(240%) skewX(-18deg); } }
        .tn-wrap { max-width: 1200px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }

        /* ═══ پوستر قهرمانی (هیرو) ═══ */
        .tn-hero { position: relative; overflow: hidden; color: #fff; background: #0B0A08; }
        .tn-hero-img { position: absolute; inset: 0; background: url('/images/shop/Pro_table.jpg') center 62%/cover;
          filter: grayscale(0.35) brightness(0.5) contrast(1.1) saturate(1.15); transform: scale(1.04); }
        .tn-hero-grade { position: absolute; inset: 0; background:
          radial-gradient(ellipse 60% 90% at 74% 8%, rgba(255,238,204,0.20), transparent 55%),
          linear-gradient(100deg, rgba(11,10,8,0.96) 26%, rgba(11,10,8,0.55) 58%, rgba(11,10,8,0.88) 100%),
          linear-gradient(0deg, rgba(11,10,8,0.9) 0%, transparent 34%); }
        .tn-hero::after { content: ''; position: absolute; top: -30%; bottom: -30%; width: 30%;
          background: linear-gradient(105deg, transparent, rgba(255,244,222,0.05), transparent);
          animation: tnSweep 8s cubic-bezier(.4,0,.2,1) infinite; pointer-events: none; }
        .tn-hero-word { position: absolute; bottom: -8px; inset-inline-start: -6px; font-weight: 900;
          font-size: clamp(58px, 10.5vw, 140px); line-height: 1; letter-spacing: .02em;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.08); user-select: none; pointer-events: none; direction: ltr; }
        .tn-stat { text-align: center; }
        .tn-stat b { display: block; font-size: clamp(19px,2.2vw,26px); font-weight: 900; color: #fff; font-variant-numeric: tabular-nums; }
        .tn-stat span { font-size: 10.5px; color: rgba(255,255,255,0.55); font-weight: 700; }
        .tn-stat-sep { width: 1px; align-self: stretch; background: linear-gradient(180deg,transparent,rgba(199,166,106,0.4),transparent); }
        @keyframes tnBlink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }

        /* سوییچ نمایش: گرید / لیست */
        .tn-view { display: flex; gap: 4px; padding: 4px; background: #fff; border: 1px solid ${LINE}; border-radius: 12px; flex-shrink: 0; }
        .tn-view button { width: 34px; height: 34px; border-radius: 9px; border: none; background: transparent;
          color: ${SEC}; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; }
        .tn-view button.on { background: rgba(199,166,106,0.14); color: ${GOLD_D}; box-shadow: inset 0 0 0 1px rgba(199,166,106,0.36); }

        /* حالت لیست */
        .tn-list { display: flex; flex-direction: column; gap: 10px; }
        .tn-lrow { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid ${LINE};
          border-radius: 14px; padding: 10px 14px; text-decoration: none; color: inherit;
          transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s, border-color .25s;
          animation: tnFadeUp .45s ease both; }
        .tn-lrow:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(28,27,23,0.10); border-color: rgba(199,166,106,0.4); }
        .lr-thumb { position: relative; width: 104px; aspect-ratio: 16/9; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #14120E; }
        .lr-thumb img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.78); }

        /* ═══ نوار ابزار ═══ */
        .tn-tabs { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding: 4px;
          background: #fff; border: 1px solid ${LINE}; border-radius: 14px; }
        .tn-tabs::-webkit-scrollbar { display: none; }
        .tn-tab { flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; border: none; cursor: pointer;
          font-family: inherit; font-size: 12.5px; font-weight: 700; color: ${SEC}; background: transparent;
          padding: 9px 15px; border-radius: 10px; transition: all .22s ease; white-space: nowrap; }
        .tn-tab:hover { color: ${GOLD_D}; }
        .tn-tab.on { background: linear-gradient(135deg, rgba(199,166,106,0.16), rgba(199,166,106,0.10));
          color: ${GOLD_D}; box-shadow: inset 0 0 0 1px rgba(199,166,106,0.36); }
        .tn-search:focus { border-color: rgba(199,166,106,0.6) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.13) !important; outline: none; }

        /* ═══ بیلبورد رویداد اصلی ═══ */
        .tn-main { position: relative; display: grid; grid-template-columns: minmax(0,1.15fr) minmax(0,1fr);
          border-radius: 22px; overflow: hidden; text-decoration: none; color: #fff; background: #0E0D0A;
          border: 1px solid rgba(199,166,106,0.25); box-shadow: 0 18px 50px rgba(15,14,11,0.25);
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s; animation: tnFadeUp .55s ease both; }
        .tn-main:hover { transform: translateY(-4px); box-shadow: 0 28px 64px rgba(15,14,11,0.34); }
        .tn-main-img { position: relative; min-height: 250px; overflow: hidden; }
        .tn-main-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          filter: brightness(0.7) contrast(1.06); transition: transform .8s cubic-bezier(.22,1,.36,1); }
        .tn-main:hover .tn-main-img img { transform: scale(1.045); }
        .tn-main-img::after { content: ''; position: absolute; inset: 0;
          background: linear-gradient(270deg, rgba(14,13,10,0.92) 0%, transparent 55%); }
        .tn-main-body { position: relative; padding: clamp(20px,3vw,32px); display: flex; flex-direction: column; gap: 12px;
          background: radial-gradient(circle at 12% 8%, rgba(199,166,106,0.14), transparent 50%); }
        @media (max-width: 780px) {
          .tn-main { grid-template-columns: 1fr; }
          .tn-main-img { min-height: 190px; }
          .tn-main-img::after { background: linear-gradient(0deg, rgba(14,13,10,0.9) 0%, transparent 60%); }
        }

        /* ═══ کارت ═══ */
        .tn-card { display: flex; flex-direction: column; background: #fff; border: 1px solid ${LINE};
          border-radius: 18px; overflow: hidden; text-decoration: none; color: inherit; height: 100%;
          box-shadow: 0 2px 12px rgba(28,27,23,0.05);
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s, border-color .3s;
          animation: tnFadeUp .55s ease both; }
        .tn-card:hover { transform: translateY(-5px); box-shadow: 0 20px 44px rgba(28,27,23,0.12); border-color: rgba(199,166,106,0.4); }
        .tn-thumb { position: relative; aspect-ratio: 16/8.6; overflow: hidden; background: #14120E; }
        .tn-thumb img { width: 100%; height: 100%; object-fit: cover; display: block;
          filter: brightness(0.72) contrast(1.05); transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .tn-card:hover .tn-thumb img { transform: scale(1.06); }
        .tn-thumb-grade { position: absolute; inset: 0;
          background: linear-gradient(185deg, rgba(10,9,7,0.1) 40%, rgba(10,9,7,0.72) 92%); }
        .tn-line { position: absolute; bottom: 0; inset-inline: 0; height: 2.5px;
          background: linear-gradient(90deg, transparent, ${GOLD}, transparent);
          transform: scaleX(0); transition: transform .4s cubic-bezier(.22,1,.36,1); }
        .tn-card:hover .tn-line { transform: scaleX(1); }
        .tn-title { font-size: 14.5px; font-weight: 900; line-height: 1.65; margin: 0; color: ${TEXT};
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .tn-card:hover .tn-title { color: ${GOLD_D}; }
        .tn-cta { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 800; color: ${GOLD_D}; }
        .tn-cta .ar { transition: transform .25s; }
        .tn-card:hover .tn-cta .ar { transform: translateX(-3px); }

        .tn-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        @media (max-width: 1000px) { .tn-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  {
          .tn-grid { grid-template-columns: 1fr; gap: 16px; }
          .tn-hide-mob { display: none !important; }
          /* تولبار موبایل: همه در یک ردیف — سرچِ کوچک سمتِ چپ */
          .tn-toolbar { flex-wrap: nowrap !important; }
          .tn-tabs { flex: 1 1 auto !important; min-width: 0 !important; }
          .tn-view { padding: 3px; }
          .tn-view button { width: 30px; height: 30px; }
          .tn-sbox { flex: 0 0 116px !important; min-width: 0 !important; }
          .tn-sbox input { padding: 9px 28px 9px 8px !important; font-size: 11px !important; border-radius: 10px !important; }
          .tn-sbox svg { right: 8px !important; }
          .lr-thumb { width: 74px; }
          .lr-fee { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .tn-hero::after { animation: none; display: none; } .tn-card, .tn-main { animation: none; } }
      `}</style>

      {/* ═══ پوسترِ قهرمانی ═══ */}
      <header className="tn-hero">
        <div className="tn-hero-img" />
        <div className="tn-hero-grade" />
        <div style={{ position: 'absolute', top: '-22%', bottom: '-22%', left: '30%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.5),transparent)', transform: 'rotate(14deg)', pointerEvents: 'none' }} />
        <div className="tn-hero-word">CHAMPIONSHIP</div>
        <div className="tn-wrap" style={{ position: 'relative', padding: 'clamp(36px,5.4vw,70px) clamp(16px,3vw,28px) clamp(30px,4.6vw,54px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px 32px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.26em', color: GOLD, border: '1px solid rgba(199,166,106,0.4)', background: 'rgba(199,166,106,0.10)', borderRadius: 999, padding: '5px 14px', marginBottom: 16 }}>
              <Trophy size={11} /> OFFICIAL TOURNAMENTS
            </span>
            <h1 style={{ fontSize: 'clamp(30px,5vw,54px)', fontWeight: 900, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              مسابقات <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 50%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>بیلیارد</span>
            </h1>
            <div style={{ width: 70, height: 3, borderRadius: 2, marginTop: 14, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'tnScaleX .55s .3s ease both' }} />
            <p style={{ margin: '14px 0 0', fontSize: 'clamp(12px,1.4vw,14px)', color: 'rgba(255,255,255,0.6)', maxWidth: 470, lineHeight: 2, animation: 'tnFadeUp .5s .35s ease both' }}>
              از لیگ‌های باشگاهی تا جام‌های قهرمانی — رویدادهای رسمی اکوسیستم بیلیارد هاب را دنبال کنید.
            </p>
          </div>

          {/* آمارِ زنده‌ی رویدادها — از همان داده */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px,2.4vw,26px)', animation: 'tnFadeUp .55s .2s ease both' }}>
            <div className="tn-stat"><b>{toFa(SAMPLE_TOURNAMENTS.length)}</b><span>رویداد</span></div>
            <div className="tn-stat-sep" />
            <div className="tn-stat"><b style={{ color: '#7ED9A0' }}>{toFa(openCount)}</b><span>ثبت‌نام باز</span></div>
            <div className="tn-stat-sep" />
            <div className="tn-stat"><b style={{ color: '#FF8A80' }}>{toFa(liveCount)}</b><span>در حال برگزاری</span></div>
          </div>
        </div>
        {/* نوار سه‌رنگ پایانی */}
        <div style={{ position: 'absolute', bottom: 0, insetInline: 0, height: 3, display: 'flex' }}>
          <i style={{ flex: 2.6, background: `linear-gradient(90deg,#8A6020,${GOLD})` }} />
          <i style={{ flex: 1, background: '#B23B2E' }} />
          <i style={{ flex: 1.6, background: '#14532D' }} />
        </div>
      </header>

      {/* ═══ نوار ابزار چسبان: تب‌ها + جستجو ═══ */}
      <div style={{ position: 'sticky', top: 62, zIndex: 40, background: 'rgba(247,247,245,0.92)', backdropFilter: 'blur(18px) saturate(1.6)', WebkitBackdropFilter: 'blur(18px) saturate(1.6)', borderBottom: `1px solid ${LINE}` }}>
        <div className="tn-wrap tn-toolbar" style={{ padding: '10px clamp(16px,3vw,28px)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tn-tabs" style={{ flex: '1 1 430px', minWidth: 0 }}>
            {TABS.map(t => (
              <button key={t.key} className={`tn-tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
                {t.pulse && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: t.key === 'live' ? '#ef4444' : '#30C55A', boxShadow: t.key === 'live' ? '0 0 6px rgba(239,68,68,0.6)' : '0 0 6px rgba(48,197,90,0.6)', animation: 'tnBlink 1.5s ease-in-out infinite' }} />
                )}
                {t.label}
                {t.key !== 'all' && (
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: tab === t.key ? GOLD_D : MUT, fontVariantNumeric: 'tabular-nums' }}>
                    {toFa(SAMPLE_TOURNAMENTS.filter(x => x.status === t.key).length)}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* سوییچ گرید/لیست */}
          <div className="tn-view" role="group" aria-label="حالت نمایش">
            <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label="نمایش کارتی"><LayoutGrid size={16} /></button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="نمایش لیستی"><List size={17} /></button>
          </div>
          <div className="tn-sbox" style={{ position: 'relative', flex: '1 1 210px', minWidth: 190 }}>
            <input
              className="tn-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو در مسابقات…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 40px 11px 14px', borderRadius: 12, fontSize: 13, background: '#fff', border: `1px solid ${LINE}`, color: TEXT, fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s' }}
            />
            <Search size={15} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: GOLD_D, pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      <main className="tn-wrap" style={{ padding: 'clamp(24px,3.4vw,36px) clamp(16px,3vw,28px) 80px' }}>

        {/* ═══ بیلبورد رویداد اصلی ═══ */}
        {isBrowsing && mainEvent && (
          <section style={{ marginBottom: 'clamp(26px,3.8vw,40px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
              <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: 0 }}>رویداد اصلی</h2>
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.24em', color: MUT }}>MAIN EVENT</span>
              <span style={{ flex: 1, height: 1, background: LINE }} />
            </div>
            <Link href={`/tournaments/${mainEvent.id}`} className="tn-main">
              <div className="tn-main-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <StatusPill t={mainEvent} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '4px 11px' }}>
                    {GAME_TYPE_LABELS[mainEvent.gameType]}
                  </span>
                </div>
                <h3 style={{ fontSize: 'clamp(18px,2.6vw,26px)', fontWeight: 900, margin: 0, lineHeight: 1.55 }}>{mainEvent.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(255,255,255,0.72)' }}>
                  <MapPin size={13} style={{ color: GOLD }} /> {mainEvent.clubName}
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
                  <Calendar size={13} style={{ color: GOLD }} /> {mainEvent.date} — {toFa(mainEvent.startTime)}
                </div>
                <p style={{ fontSize: 12.5, lineHeight: 2, color: 'rgba(255,255,255,0.62)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {mainEvent.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#F3E7CF', background: 'rgba(199,166,106,0.16)', border: '1px solid rgba(199,166,106,0.4)', borderRadius: 10, padding: '7px 15px' }}>
                    ورودی: {formatFee(mainEvent.entryFee)}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Users size={13} /> {toFa(mainEvent.registeredCount)} از {toFa(mainEvent.maxPlayers)} نفر
                  </span>
                  <span style={{ marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: GOLD }}>
                    ثبت‌نام و جزئیات <ArrowLeft size={14} />
                  </span>
                </div>
              </div>
              <div className="tn-main-img"><img src={mainEvent.banner} alt={mainEvent.name} /></div>
            </Link>
          </section>
        )}

        {/* ═══ گرید مسابقات ═══ */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
            <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: 0 }}>
              {tab === 'all' ? (search ? 'نتایج جستجو' : 'همه‌ی رویدادها') : TABS.find(x => x.key === tab)?.label}
            </h2>
            <span style={{ fontSize: 12, color: MUT }}>{toFa(gridItems.length)} رویداد</span>
            <span style={{ flex: 1, height: 1, background: LINE }} />
          </div>

          {gridItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '70px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18 }}>
              <Trophy size={38} style={{ color: MUT, opacity: 0.4, marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px' }}>مسابقه‌ای یافت نشد</p>
              <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 18px' }}>عبارت دیگری جستجو کنید یا وضعیت را تغییر دهید.</p>
              <button onClick={() => { setSearch(''); setTab('all') }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
                نمایش همه مسابقات
              </button>
            </div>
          ) : view === 'grid' ? (
            <div className="tn-grid">
              {gridItems.map((t, i) => <TournamentCard key={t.id} t={t} i={i} />)}
            </div>
          ) : (
            <div className="tn-list">
              {gridItems.map((t, i) => (
                <Link key={t.id} href={`/tournaments/${t.id}`} className="tn-lrow" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                  <span className="lr-thumb"><img src={t.banner} alt={t.name} loading="lazy" /></span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: MUT, marginTop: 4, minWidth: 0 }}>
                      <MapPin size={11} style={{ color: '#14532D', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.clubName}</span>
                      <span style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: '#D8D2C4', flexShrink: 0 }} />
                      <span style={{ flexShrink: 0 }}>{t.date}</span>
                    </div>
                  </div>
                  <StatusPill t={t} />
                  <span className="lr-fee" style={{ fontSize: 13, fontWeight: 900, color: GOLD_D, whiteSpace: 'nowrap' }}>{formatFee(t.entryFee)}</span>
                  <ChevronLeft size={16} style={{ color: GOLD_D, flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
