'use client'

/* ─────────────────────────────────────────────────────────────
   رنکینگ بازیکنان — بازطراحیِ صرفاً UI/UX (۱۴۰۵).
   داده‌ها، منطق، فیلترها و مسیرها عیناً حفظ شده‌اند:
   samplePlayers / sports / genders / categories / رفتارِ ریستِ
   دسته هنگام تغییرِ رشته/جنسیت / محاسبه‌ی صعود-نزول / لینک به
   پروفایل بازیکن. فقط پوسته عوض شده: هدرِ ادیتوریالِ رسمی،
   سگمنت‌های مدرن، سکویِ Top 3 و لیستِ ردیف‌های ادیتوریال با
   شماره‌ی گرافیکیِ محو — نه جدولِ اکسلی.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getCategoryPlayers, categorySize } from '../../lib/rankings-store'

interface RankingPlayer {
  rank: number
  previousRank?: number
  name: string
  city?: string
  points: number
  userId?: string
  avatar?: string
}

const samplePlayers: RankingPlayer[] = [
  { rank: 1, previousRank: 2, name: 'علی محمدی', city: 'تهران', points: 12500 },
  { rank: 2, previousRank: 1, name: 'رضا احمدی', city: 'مشهد', points: 11800 },
  { rank: 3, previousRank: 3, name: 'محمد حسینی', city: 'اصفهان', points: 10900 },
  { rank: 4, previousRank: 6, name: 'امیر کریمی', city: 'تهران', points: 10200 },
  { rank: 5, previousRank: 4, name: 'سعید رضایی', city: 'شیراز', points: 9800 },
  { rank: 6, previousRank: 5, name: 'حسین علوی', city: 'تبریز', points: 9400 },
  { rank: 7, previousRank: 9, name: 'مجید صادقی', city: 'کرج', points: 8900 },
  { rank: 8, previousRank: 7, name: 'داود نظری', city: 'تهران', points: 8500 },
  { rank: 9, previousRank: 8, name: 'کاوه موسوی', city: 'اهواز', points: 8100 },
  { rank: 10, previousRank: 12, name: 'بهروز طاهری', city: 'قم', points: 7800 },
  { rank: 11, previousRank: 10, name: 'فرهاد جعفری', city: 'مشهد', points: 7400 },
  { rank: 12, previousRank: 11, name: 'نادر قاسمی', city: 'تهران', points: 7100 },
  { rank: 13, previousRank: 15, name: 'وحید ابراهیمی', city: 'اصفهان', points: 6800 },
  { rank: 14, previousRank: 13, name: 'مهدی شریفی', city: 'رشت', points: 6500 },
  { rank: 15, previousRank: 14, name: 'پیمان کمالی', city: 'تهران', points: 6200 },
  { rank: 16, previousRank: 16, name: 'آرش ولی‌زاده', city: 'کرمانشاه', points: 5900 },
  { rank: 17, previousRank: 18, name: 'سینا حیدری', city: 'تهران', points: 5600 },
  { rank: 18, previousRank: 17, name: 'امین رستمی', city: 'تبریز', points: 5300 },
  { rank: 19, previousRank: 20, name: 'شاهین نوری', city: 'شیراز', points: 5000 },
  { rank: 20, previousRank: 19, name: 'کیان صفوی', city: 'مشهد', points: 4700 },
]

const sports = [
  { value: 'snooker', label: 'اسنوکر' },
  { value: 'pocket', label: 'پاکت بیلیارد' },
  { value: 'highball', label: 'هی‌بال', soon: true },
]

const genders = ['آقایان', 'بانوان']

const categories: Record<string, Record<string, string[]>> = {
  snooker: {
    آقایان: ['دسته برتر', 'دسته یک', 'زیر ۲۱ سال', 'پیشکسوتان'],
    بانوان: ['دسته برتر', 'زیر ۲۱ سال', 'پیشکسوتان'],
  },
  pocket: {
    آقایان: ['دسته برتر', 'دسته یک', 'زیر ۲۱ سال', 'پیشکسوتان'],
    بانوان: ['دسته برتر', 'زیر ۲۱ سال', 'پیشکسوتان'],
  },
}

const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'
const BG     = '#F7F7F5'

const faDigits = (v: string | number) => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)

/* رنگ‌بندیِ رتبه‌ها — به سبکِ جدول رنکینگ فدراسیون جهانی:
   ۱ مشکی، ۲–۸ صورتی، ۹–۱۶ آبی، ۱۷–۳۲ قهوه‌ای، ۳۳–۶۴ سبز (دسته یک)، بقیه خاکستری */
const rankColor = (r: number): string =>
  r === 1 ? '#111111'
  : r <= 8 ? '#F06EAE'
  : r <= 16 ? '#3D63E6'
  : r <= 32 ? '#A9613F'
  : r <= 64 ? '#229A47'
  : '#8A8474'

/* چیپِ تغییرِ رتبه — همان منطقِ قبلی (previousRank - rank) */
function TrendChip({ diff, onDark = false }: { diff: number; onDark?: boolean }) {
  if (diff > 0) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 800, color: '#22B45A', background: onDark ? 'rgba(34,180,90,0.16)' : 'rgba(34,180,90,0.10)', border: '1px solid rgba(34,180,90,0.3)', borderRadius: 999, padding: '2.5px 8px', fontVariantNumeric: 'tabular-nums' }}>
      <TrendingUp size={11} /> {faDigits(diff)}
    </span>
  )
  if (diff < 0) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 800, color: '#E05252', background: onDark ? 'rgba(224,82,82,0.16)' : 'rgba(224,82,82,0.09)', border: '1px solid rgba(224,82,82,0.3)', borderRadius: 999, padding: '2.5px 8px', fontVariantNumeric: 'tabular-nums' }}>
      <TrendingDown size={11} /> {faDigits(Math.abs(diff))}
    </span>
  )
  return <Minus size={12} style={{ color: onDark ? 'rgba(255,255,255,0.3)' : 'rgba(28,27,23,0.22)' }} />
}

/* پرتره: عکسِ واقعی اگر بود (ساختار آماده)، وگرنه مونوگرام */
function Portrait({ p, size, onDark = false }: { p: RankingPlayer; size: number; onDark?: boolean }) {
  return (
    <span style={{
      position: 'relative', width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible',
      fontSize: size * 0.38, fontWeight: 900,
      color: onDark ? '#F3E7CF' : GOLD_D,
      background: onDark ? 'rgba(255,255,255,0.08)' : 'linear-gradient(160deg,#FFFDF9,#F5EFE4)',
      boxShadow: onDark ? 'inset 0 1px 0 rgba(255,255,255,0.14)' : '0 6px 16px rgba(154,110,56,0.14), inset 0 1px 0 #fff',
    }}>
      <span style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: `1px solid ${onDark ? 'rgba(255,255,255,0.28)' : 'rgba(199,166,106,0.5)'}` }} />
      {p.avatar
        ? <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        : p.name?.[0]}
    </span>
  )
}

export default function RankingsPage() {
  const [sport, setSport]       = useState('snooker')
  const [gender, setGender]     = useState('آقایان')
  const [category, setCategory] = useState('دسته برتر')

  /* داده‌ی واقعیِ واردشده در پنل ادمین (localStorage) بعد از mount خوانده می‌شود */
  const [adminPlayers, setAdminPlayers] = useState<RankingPlayer[] | null>(null)
  useEffect(() => {
    setAdminPlayers(getCategoryPlayers(sport, gender, category))
  }, [sport, gender, category])

  const currentCategories = categories[sport]?.[gender] ?? []
  /* اگر ادمین برای این دسته اسم وارد کرده باشد همان نمایش داده می‌شود؛ وگرنه داده‌ی نمونه */
  const players = sport !== 'highball'
    ? (adminPlayers && adminPlayers.length > 0 ? adminPlayers : samplePlayers)
    : []
  const capacity = categorySize(sport, category)

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes rkFadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes rkScaleX { from { opacity:0; transform: scaleX(0); } to { opacity:1; transform: scaleX(1); } }
        .rk-wrap { max-width: 1080px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }

        /* هدرِ رسمیِ تیره */
        .rk-hero { position: relative; overflow: hidden; background: #0D0C0A; color: #fff; }
        .rk-hero-word { position: absolute; bottom: -8px; inset-inline-start: -4px; font-weight: 900;
          font-size: clamp(56px, 10vw, 128px); line-height: 1; letter-spacing: .02em;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.07); user-select: none; pointer-events: none; direction: ltr; }

        /* سگمنت‌ها */
        .rk-segwrap { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding: 4px;
          background: #fff; border: 1px solid ${LINE}; border-radius: 14px; }
        .rk-segwrap::-webkit-scrollbar { display: none; }
        .rk-seg { flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; border: none; cursor: pointer;
          font-family: inherit; font-size: 12.5px; font-weight: 700; color: ${SEC}; background: transparent;
          padding: 9px 16px; border-radius: 10px; transition: all .22s ease; white-space: nowrap; }
        .rk-seg:hover:not(:disabled) { color: ${GOLD_D}; }
        .rk-seg.on { background: linear-gradient(135deg, rgba(199,166,106,0.16), rgba(199,166,106,0.10));
          color: ${GOLD_D}; box-shadow: inset 0 0 0 1px rgba(199,166,106,0.36); }
        .rk-seg:disabled { cursor: not-allowed; opacity: .5; }
        .rk-chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 2px; }
        .rk-chips::-webkit-scrollbar { display: none; }
        .rk-chip { flex-shrink: 0; cursor: pointer; font-family: inherit; font-size: 12.5px; font-weight: 700;
          padding: 8px 15px; border-radius: 10px; background: #fff; border: 1px solid ${LINE}; color: ${SEC};
          transition: all .2s ease; }
        .rk-chip:hover { border-color: rgba(199,166,106,0.45); transform: translateY(-1px); }
        .rk-chip.on { background: rgba(199,166,106,0.12); border-color: rgba(199,166,106,0.38); color: ${GOLD_D}; }

        /* ردیف‌های جدول — به سبک جدول فدراسیون جهانی:
           مربعِ رنگیِ رتبه چسبیده به لبه‌ی راست + پخِ برش‌خورده در گوشه‌ی پایین-چپ */
        .rk-rowwrap { animation: rkFadeUp .5s ease both;
          filter: drop-shadow(0 1px 2px rgba(28,27,23,0.05));
          transition: transform .28s cubic-bezier(.22,1,.36,1), filter .28s; }
        .rk-rowwrap:hover { transform: translateY(-3px); filter: drop-shadow(0 12px 20px rgba(28,27,23,0.13)); }
        .rk-row { position: relative; display: flex; align-items: center; gap: 14px;
          background: #fff; border: 1px solid ${LINE}; border-radius: 16px 16px 16px 0; overflow: hidden;
          padding: 0 0 0 18px; min-height: 74px; text-decoration: none; color: inherit;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 26px 100%, 0 calc(100% - 14px)); }
        /* مربعِ رتبه — لیکویید گلسِ کریستالی (iOS): هایلایت شیشه‌ای + عددِ نورانی */
        .rk-row .chip { align-self: stretch; width: 56px; flex-shrink: 0; position: relative;
          display: flex; align-items: center; justify-content: center; gap: 1px; direction: ltr;
          color: #fff; font-weight: 900; font-size: 16.5px; font-variant-numeric: tabular-nums;
          background-image:
            radial-gradient(130% 62% at 50% 0%, rgba(255,255,255,0.34), transparent 62%),
            linear-gradient(160deg, rgba(255,255,255,0.38), rgba(255,255,255,0.08) 40%, rgba(255,255,255,0) 58%, rgba(0,0,0,0.14));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), inset 1px 0 0 rgba(255,255,255,0.16),
            inset 0 -2px 5px rgba(0,0,0,0.2);
          text-shadow: 0 1px 4px rgba(0,0,0,0.3), 0 0 12px rgba(255,255,255,0.5); }
        .rk-row .chip i { font-style: normal; font-size: 0.7em; font-weight: 800; opacity: .85; }
        /* بلوکِ نام عرضِ ثابت دارد تا ستونِ شهرها در همه‌ی ردیف‌ها دقیقاً هم‌راستا بماند */
        .rk-name { flex: 0 0 clamp(130px, 20vw, 210px); min-width: 0; padding: 11px 0; }
        .rk-city { flex-shrink: 0; margin-inline-start: clamp(18px, 3vw, 34px);
          font-size: 12px; color: ${MUT}; white-space: nowrap; }
        /* ترکِ گرید نباید با min-content ردیف‌ها بازتر از کانتینر شود */
        .rk-rowwrap { min-width: 0; }
        @media (max-width: 640px) {
          /* جای تبِ امتیاز در لبه‌ی چپ رزرو می‌شود — چیپِ صعود/نزول چسبیده به تب */
          .rk-row { gap: 8px; padding-left: 70px; min-height: 64px; }
          .rk-row .chip { width: 44px; font-size: 14px; }
          .rk-name { flex-basis: 86px; }
          .rk-city { margin-inline-start: 8px; font-size: 10.5px; max-width: 60px;
            overflow: hidden; text-overflow: ellipsis; }
          /* امتیاز = تبِ چسبیده به لبه‌ی چپ کارت — ضلع چپش دیده نمی‌شود،
             فقط گوشه‌های راست گرد است */
          .rk-row .rk-pts { position: absolute; left: 0; top: 50%; transform: translateY(-50%);
            border-radius: 0 12px 12px 0 !important; border-left: none !important;
            background: linear-gradient(90deg, rgba(199,166,106,0.24), rgba(199,166,106,0.07)) !important;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 2px rgba(154,110,56,0.12);
            font-size: 12px !important; padding: 6px 12px 6px 10px !important; margin-left: 0 !important; }
        }
      `}</style>

      {/* ═══ هدر رسمی ═══ */}
      <header className="rk-hero">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 82% 10%, rgba(199,166,106,0.16), transparent 52%)' }} />
        <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '32%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.45),transparent)', transform: 'rotate(14deg)' }} />
        <div className="rk-hero-word">RANKINGS</div>
        <div className="rk-wrap" style={{ position: 'relative', padding: 'clamp(32px,5vw,58px) clamp(16px,3vw,28px) clamp(26px,4vw,44px)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.26em', color: GOLD, border: '1px solid rgba(199,166,106,0.4)', background: 'rgba(199,166,106,0.10)', borderRadius: 999, padding: '5px 14px', marginBottom: 14 }}>
            <Trophy size={11} /> OFFICIAL RANKINGS
          </span>
          <h1 style={{ fontSize: 'clamp(26px,4.4vw,46px)', fontWeight: 900, margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
            رنکینگ <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 50%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>بازیکنان</span>
          </h1>
          <div style={{ width: 66, height: 3, borderRadius: 2, marginTop: 12, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'rkScaleX .55s .25s ease both' }} />
          <p style={{ margin: '12px 0 0', fontSize: 'clamp(12px,1.4vw,14px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.9 }}>
            جدول امتیازات رسمی فدراسیون بیلیارد ایران
          </p>
        </div>
      </header>

      {/* ═══ کنترل‌ها (همان منطق قبلی، پوسته‌ی جدید) ═══ */}
      <div style={{ position: 'sticky', top: 62, zIndex: 40, background: 'rgba(247,247,245,0.92)', backdropFilter: 'blur(18px) saturate(1.6)', WebkitBackdropFilter: 'blur(18px) saturate(1.6)', borderBottom: `1px solid ${LINE}` }}>
        <div className="rk-wrap" style={{ padding: '10px clamp(16px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* رشته */}
            <div className="rk-segwrap" style={{ flex: '1 1 300px', minWidth: 0 }}>
              {sports.map(s => (
                <button
                  key={s.value}
                  className={`rk-seg${sport === s.value ? ' on' : ''}`}
                  disabled={!!s.soon}
                  onClick={() => { if (!s.soon) { setSport(s.value); setCategory('دسته برتر') } }}>
                  {s.label}
                  {s.soon && <span style={{ fontSize: 9.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.3)', borderRadius: 999, padding: '1.5px 7px' }}>به زودی</span>}
                </button>
              ))}
            </div>
            {/* جنسیت */}
            <div className="rk-segwrap" style={{ flexShrink: 0 }}>
              {genders.map(g => (
                <button key={g} className={`rk-seg${gender === g ? ' on' : ''}`}
                  onClick={() => { setGender(g); setCategory('دسته برتر') }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          {/* دسته‌بندی */}
          {sport !== 'highball' && (
            <div className="rk-chips">
              {currentCategories.map(cat => (
                <button key={cat} className={`rk-chip${category === cat ? ' on' : ''}`} onClick={() => setCategory(cat)}>{cat}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="rk-wrap" style={{ padding: 'clamp(24px,3.4vw,36px) clamp(16px,3vw,28px) 80px' }}>

        {sport !== 'highball' ? (
          players.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '70px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18 }}>
              <Trophy size={38} style={{ color: MUT, opacity: 0.4, marginBottom: 12 }} />
              <p style={{ fontSize: 15.5, fontWeight: 800, margin: 0 }}>رنکینگ این دسته هنوز اعلام نشده</p>
            </div>
          ) : (
            <>
              {/* سربرگ لیست + راهنما */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
                <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: 0 }}>{gender} — {category}</h2>
                <span style={{ fontSize: 12, color: MUT }}>{faDigits(players.length)} از {faDigits(capacity)} بازیکن</span>
                <span style={{ flex: 1, height: 1, background: LINE }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: 11, color: MUT }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><TrendingUp size={11} style={{ color: '#22B45A' }} /> صعود</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><TrendingDown size={11} style={{ color: '#E05252' }} /> نزول</span>
                </span>
              </div>

              {/* ═══ جدول کامل — مربعِ رنگیِ رتبه با عدد سفید ═══ */}
              <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10 }}>
                {players.map((p, i) => {
                  const diff = p.previousRank ? p.previousRank - p.rank : 0
                  const parts = p.name.trim().split(/\s+/)
                  const firstName = parts[0] ?? ''
                  const lastName = parts.slice(1).join(' ')
                  return (
                    <div key={p.rank} className="rk-rowwrap" style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
                      <Link href={p.userId ? `/players/${p.userId}` : '#'} className="rk-row">
                        <span className="chip" style={{ backgroundColor: rankColor(p.rank) }}><i>#</i>{faDigits(p.rank)}</span>
                        <Portrait p={p} size={46} />
                        <div className="rk-name">
                          {lastName ? (
                            <>
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: GOLD_D, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                              <div style={{ fontSize: 15.5, fontWeight: 900, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName}</div>
                            </>
                          ) : (
                            <div style={{ fontSize: 15.5, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                          )}
                        </div>
                        <span className="rk-city">{p.city || '—'}</span>
                        <span style={{ flex: 1 }} aria-hidden />
                        <TrendChip diff={diff} />
                        <span className="rk-pts" style={{ fontSize: 14, fontWeight: 900, color: GOLD_D, fontVariantNumeric: 'tabular-nums', background: 'rgba(199,166,106,0.09)', border: '1px solid rgba(199,166,106,0.24)', borderRadius: 10, padding: '5px 13px', whiteSpace: 'nowrap', marginLeft: 4, flexShrink: 0 }}>
                          {p.points.toLocaleString('fa-IR')}
                        </span>
                      </Link>
                    </div>
                  )
                })}
              </section>

              {/* پانوشت — همان متنِ قبلی */}
              <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '13px 16px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: SEC }}>
                  رنکینگ رسمی فدراسیون بیلیارد، بولینگ و بولس جمهوری اسلامی ایران — به‌روز شده
                </span>
              </div>
            </>
          )
        ) : (
          /* هی‌بال — به زودی (همان رفتار قبلی) */
          <div style={{ textAlign: 'center', padding: '76px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 20 }}>
            <span style={{ display: 'inline-flex', width: 62, height: 62, borderRadius: 18, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.3)', alignItems: 'center', justifyContent: 'center', color: GOLD_D, marginBottom: 16 }}>
              <Trophy size={26} />
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>رنکینگ هی‌بال</h2>
            <p style={{ fontSize: 13.5, color: MUT, margin: 0 }}>به زودی راه‌اندازی می‌شود</p>
          </div>
        )}
      </main>
    </div>
  )
}
