'use client'

/* ─────────────────────────────────────────────────────────────
   پروفایل بازیکن — «Athlete Profile» سینمایی و ادیتوریال.
   عمداً از پروفایل مربی/داور/متخصص متمایز است: هیروی تیره با
   تایپوگرافیِ مونومنتال و رنکینگِ گرافیکی → هویت → بیوگرافی →
   Career Highlights (تایم‌لاین) → مسابقات → باشگاه → گالریِ
   آلبوم‌دار + لایت‌باکس → پیوند با اخبار و بیلیارد مدیا.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import {
  MapPin, ChevronLeft, ChevronRight, ArrowLeft, X, ZoomIn, ZoomOut,
  Trophy, Images, Building2, Newspaper, Clapperboard,
} from 'lucide-react'
import { getPlayer, DISCIPLINE_LABEL, TONES, faDigits } from '../../../lib/players-data'
import { NEWS_ARTICLES } from '../../../lib/news-data'
import { MEDIA_VIDEOS } from '../../../lib/media-data'

const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'
const BG     = '#F7F7F5'

function SectionHead({ title, en }: { title: string; en?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <span style={{ width: 3, height: 17, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
      <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: 0 }}>{title}</h2>
      {en && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.26em', color: MUT }}>{en}</span>}
      <span style={{ flex: 1, height: 1, background: LINE }} />
    </div>
  )
}

export default function PlayerProfilePage() {
  const params = useParams()
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? ''
  const player = useMemo(() => getPlayer(id), [id])

  const [albumIdx, setAlbumIdx] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [zoomed, setZoomed]     = useState(false)

  const album  = player?.albums[Math.min(albumIdx, (player?.albums.length ?? 1) - 1)]
  const photos = album?.photos ?? []

  const closeLb = useCallback(() => { setLightbox(null); setZoomed(false) }, [])
  const stepLb  = useCallback((d: number) => {
    setZoomed(false)
    setLightbox(i => (i === null ? null : (i + d + photos.length) % photos.length))
  }, [photos.length])

  useEffect(() => {
    if (lightbox === null) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLb()
      if (e.key === 'ArrowLeft') stepLb(1)
      if (e.key === 'ArrowRight') stepLb(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [lightbox, closeLb, stepLb])

  /* پیوند با اکوسیستم — اخبار و ویدیوهای مرتبط با برچسب‌های بازیکن */
  const relatedNews = useMemo(() => {
    if (!player) return []
    return NEWS_ARTICLES.filter(a => a.tags.some(t => player.tags.includes(t))).slice(0, 3)
  }, [player])
  const relatedVids = useMemo(() => {
    if (!player) return []
    return MEDIA_VIDEOS.filter(v => v.tags.some(t => player.tags.includes(t)) || v.category === 'interviews').slice(0, 3)
  }, [player])

  if (!player) {
    return (
      <div dir="rtl" style={{ minHeight: '70vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn,Tahoma,sans-serif', padding: 20 }}>
        <div style={{ textAlign: 'center', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '40px 34px', maxWidth: 380 }}>
          <Trophy size={34} style={{ color: MUT, opacity: 0.5, marginBottom: 10 }} />
          <p style={{ fontSize: 17, fontWeight: 900, color: TEXT, margin: '0 0 8px' }}>بازیکن پیدا نشد</p>
          <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.8 }}>ممکن است این پروفایل حذف شده یا نشانی تغییر کرده باشد.</p>
          <Link href="/players" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
            بازگشت به بازیکنان <ArrowLeft size={14} />
          </Link>
        </div>
      </div>
    )
  }

  const d = DISCIPLINE_LABEL[player.discipline]
  const t = TONES[player.tone]

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes paFadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes paFade   { from { opacity:0; } to { opacity:1; } }
        .pa-wrap { max-width: 1120px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }

        /* هیروی سینمایی */
        .pa-hero { position: relative; overflow: hidden; color: #fff; }
        .pa-hero-scene { position: absolute; inset: 0; background-size: cover; background-position: center;
          filter: grayscale(0.6) brightness(0.42) contrast(1.06); transform: scale(1.03); }
        .pa-hero-name-bg { position: absolute; bottom: -8px; inset-inline-start: -4px; font-weight: 900;
          font-size: clamp(58px, 10.5vw, 138px); line-height: 1; letter-spacing: .01em; white-space: nowrap;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.09); user-select: none; pointer-events: none; direction: ltr; }
        .pa-rank-big { font-weight: 900; font-size: clamp(72px, 9vw, 128px); line-height: .9;
          color: transparent; -webkit-text-stroke: 2px rgba(199,166,106,0.75); letter-spacing: -0.04em;
          font-variant-numeric: tabular-nums; direction: ltr; user-select: none; }

        .pa-chip { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.25); border-radius: 999px;
          padding: 6px 13px; backdrop-filter: blur(6px); }

        /* تایم‌لاین افتخارات */
        .pa-tl { position: relative; padding-inline-start: 26px; }
        .pa-tl::before { content: ''; position: absolute; inset-block: 6px; inset-inline-start: 7px; width: 1.5px;
          background: linear-gradient(180deg, ${GOLD}, rgba(199,166,106,0.12)); }
        .pa-tl-item { position: relative; padding: 0 0 22px; animation: paFadeUp .5s ease both; }
        .pa-tl-item:last-child { padding-bottom: 4px; }
        .pa-tl-item::before { content: ''; position: absolute; inset-inline-start: -26px; top: 5px;
          width: 15px; height: 15px; border-radius: 50%;
          background: #fff; border: 2px solid ${GOLD}; box-shadow: 0 0 0 4px rgba(199,166,106,0.14); }
        .pa-tl-year { font-size: 13px; font-weight: 900; color: ${GOLD_D}; font-variant-numeric: tabular-nums; }
        .pa-tl-title { font-size: 14px; font-weight: 700; color: ${TEXT}; margin-top: 3px; line-height: 1.8; }

        /* گالری */
        .pa-gal { columns: 3 210px; column-gap: 12px; }
        .pa-gal button { display: block; width: 100%; border: none; padding: 0; margin: 0 0 12px; cursor: zoom-in;
          border-radius: 14px; overflow: hidden; background: #EDEAE2; border: 1px solid ${LINE};
          transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s; }
        .pa-gal button:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(28,27,23,0.13); }
        .pa-gal img { width: 100%; display: block; transition: transform .5s cubic-bezier(.22,1,.36,1); }
        .pa-gal button:hover img { transform: scale(1.04); }

        .pa-lb-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px;
          border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); background: rgba(20,18,14,0.5);
          color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(6px); transition: background .2s, transform .2s; }
        .pa-lb-nav:hover { background: rgba(199,166,106,0.5); transform: translateY(-50%) scale(1.06); }

        /* لینک‌های اکوسیستم */
        .pa-eco { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        @media (max-width: 760px) { .pa-eco { grid-template-columns: 1fr; } }
        .pa-eco-item { display: flex; gap: 11px; padding: 11px 10px; border-radius: 12px; text-decoration: none;
          transition: background .2s; }
        .pa-eco-item:hover { background: rgba(199,166,106,0.07); }
        .pa-eco-item img { width: 92px; height: 62px; border-radius: 10px; object-fit: cover; flex-shrink: 0; border: 1px solid ${LINE}; }
        .pa-eco-title { font-size: 12.5px; font-weight: 700; color: ${TEXT}; line-height: 1.65; margin: 0 0 4px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .pa-eco-item:hover .pa-eco-title { color: ${GOLD_D}; }

        .pa-two { display: grid; grid-template-columns: minmax(0,1.5fr) minmax(0,1fr); gap: 22px; align-items: start; }
        @media (max-width: 860px) { .pa-two { grid-template-columns: 1fr; } }
      `}</style>

      {/* ═══ هیروی سینمایی ═══ */}
      <header className="pa-hero">
        <div className="pa-hero-scene" style={{ backgroundImage: `url(${player.scene})` }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg, ${t.from}F2 24%, rgba(13,12,10,0.55) 60%, ${t.from}E6 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 80% 20%, ${t.glow}, transparent 55%)`, opacity: .85 }} />
        <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '30%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.45),transparent)', transform: 'rotate(13deg)' }} />
        <div className="pa-hero-name-bg">{player.nameEn}</div>

        <div className="pa-wrap" style={{ position: 'relative', padding: 'clamp(30px,4.6vw,54px) clamp(16px,3vw,28px) clamp(34px,5vw,58px)' }}>
          {/* بردکرامب روشن */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 'clamp(20px,3.4vw,36px)' }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>خانه</Link>
            <ChevronLeft size={12} />
            <Link href="/players" style={{ color: 'inherit', textDecoration: 'none' }}>بازیکنان</Link>
            <ChevronLeft size={12} />
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>{player.name}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '18px 30px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, animation: 'paFadeUp .5s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <span className="pa-chip" style={{ letterSpacing: '0.26em', fontSize: 9.5 }}>{d.en}</span>
                {player.national && (
                  <span className="pa-chip" style={{ background: `linear-gradient(135deg, ${GOLD}, #A8853F)`, color: '#241B08', border: 'none', fontWeight: 800 }}>تیم ملی ایران</span>
                )}
                {player.youth && <span className="pa-chip">رده‌ی جوانان</span>}
              </div>
              <h1 style={{ fontSize: 'clamp(30px,5.4vw,58px)', fontWeight: 900, margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                {player.name}
              </h1>
              <div style={{ fontSize: 'clamp(10px,1.2vw,12px)', fontWeight: 700, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.5)', marginTop: 8, direction: 'ltr', textAlign: 'right' }}>
                {player.nameEn}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>
                <MapPin size={14} style={{ color: GOLD }} />
                <span>{player.city}، {player.country}</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
                <span>{d.fa}</span>
                {player.club && (
                  <>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
                    <span>{player.club.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* رنکینگ — گرافیکِ مونومنتال */}
            {player.ranking != null && (
              <div style={{ textAlign: 'center', animation: 'paFadeUp .55s .1s ease both' }}>
                <div className="pa-rank-big">#{faDigits(String(player.ranking).padStart(2, '0'))}</div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>رنکینگ ملی</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="pa-wrap" style={{ paddingTop: 'clamp(26px,3.6vw,40px)', paddingBottom: 80 }}>

        {/* ═══ معرفی + هویت ═══ */}
        <section className="pa-two" style={{ marginBottom: 'clamp(30px,4.4vw,48px)' }}>
          {/* بیوگرافی — ادیتوریال */}
          <div style={{ animation: 'paFadeUp .5s ease both' }}>
            <SectionHead title="بیوگرافی" en="BIOGRAPHY" />
            <p style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 2, color: TEXT, margin: '0 0 14px' }}>{player.intro}</p>
            {player.bio.map((p, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 2.25, color: '#2B2822', margin: '0 0 14px' }}>{p}</p>
            ))}
          </div>

          {/* هویت — مینیمال */}
          <aside style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '20px 20px 8px', boxShadow: '0 2px 12px rgba(28,27,23,0.05)', animation: 'paFadeUp .5s .08s ease both' }}>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', color: MUT, marginBottom: 12 }}>شناسنامه‌ی ورزشی</div>
            {[
              ['نام کامل', player.name],
              ['نام لاتین', player.nameEn],
              ['رشته', d.fa],
              ['شهر', `${player.city}، ${player.country}`],
              ['شروع فعالیت', player.careerStart],
              ...(player.club ? [['باشگاه', player.club.name] as [string, string]] : []),
              ['وضعیت', player.national ? 'ملی‌پوش' : player.youth ? 'رده‌ی جوانان' : 'حرفه‌ای'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: '1px dashed #EFEBE1', fontSize: 13 }}>
                <span style={{ color: MUT, flexShrink: 0 }}>{k}</span>
                <span style={{ fontWeight: 800, color: TEXT, textAlign: 'left', direction: k === 'نام لاتین' ? 'ltr' : 'rtl' }}>{v}</span>
              </div>
            ))}
            <div style={{ height: 8 }} />
          </aside>
        </section>

        {/* ═══ Career Highlights — تایم‌لاین ═══ */}
        {player.highlights.length > 0 && (
          <section style={{ marginBottom: 'clamp(30px,4.4vw,48px)' }}>
            <SectionHead title="افتخارات و دستاوردها" en="CAREER HIGHLIGHTS" />
            <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: 'clamp(20px,3vw,28px)' }}>
              <div className="pa-tl">
                {player.highlights.map((h, i) => (
                  <div key={i} className="pa-tl-item" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="pa-tl-year">{h.year}</div>
                    <div className="pa-tl-title">{h.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ مسابقات و حضورها ═══ */}
        {player.tournaments.length > 0 && (
          <section style={{ marginBottom: 'clamp(30px,4.4vw,48px)' }}>
            <SectionHead title="مسابقات و حضورها" en="TOURNAMENTS" />
            <div style={{ display: 'grid', gap: 10 }}>
              {player.tournaments.map((tr, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '14px 18px', animation: `paFadeUp .5s ${i * 60}ms ease both` }}>
                  <Trophy size={16} style={{ color: GOLD_D, flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 800, flex: 1 }}>{tr.name}</span>
                  <span style={{ fontSize: 12, color: MUT, fontVariantNumeric: 'tabular-nums' }}>{tr.year}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.26)', borderRadius: 999, padding: '4px 12px' }}>{tr.result}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ باشگاه ═══ */}
        {player.club && (
          <section style={{ marginBottom: 'clamp(30px,4.4vw,48px)' }}>
            <SectionHead title="باشگاه" en="CLUB" />
            <Link href={player.club.href ?? '/clubs'} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '18px 20px', textDecoration: 'none', color: 'inherit', transition: 'border-color .25s, transform .25s', boxShadow: '0 2px 12px rgba(28,27,23,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(199,166,106,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.transform = 'none' }}>
              <span style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(20,83,45,0.08)', border: '1px solid rgba(20,83,45,0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#14532D', flexShrink: 0 }}>
                <Building2 size={20} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 900 }}>{player.club.name}</div>
                <div style={{ fontSize: 12, color: MUT, marginTop: 3 }}>باشگاه محل تمرین — {player.city}</div>
              </div>
              <ArrowLeft size={16} style={{ color: GOLD_D }} />
            </Link>
          </section>
        )}

        {/* ═══ گالری ═══ */}
        {player.albums.length > 0 && album && (
          <section style={{ marginBottom: 'clamp(30px,4.4vw,48px)' }}>
            <SectionHead title="گالری" en="GALLERY" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {player.albums.map((a, i) => (
                <button key={a.id} onClick={() => setAlbumIdx(i)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, transition: 'all .2s', background: i === albumIdx ? 'rgba(199,166,106,0.12)' : '#fff', border: `1px solid ${i === albumIdx ? 'rgba(199,166,106,0.38)' : LINE}`, color: i === albumIdx ? GOLD_D : SEC }}>
                  <Images size={13} />
                  {a.title}
                  <span style={{ fontSize: 10.5, color: MUT }}>{faDigits(a.photos.length)}</span>
                </button>
              ))}
            </div>
            <div className="pa-gal">
              {photos.map((src, i) => (
                <button key={`${album.id}-${i}`} onClick={() => setLightbox(i)} aria-label={`تصویر ${faDigits(i + 1)}`}>
                  <img src={src} alt={`${album.title} — ${faDigits(i + 1)}`} loading="lazy" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ═══ پیوند با اکوسیستم: اخبار + بیلیارد مدیا ═══ */}
        {(relatedNews.length > 0 || relatedVids.length > 0) && (
          <section>
            <SectionHead title="در بیلیارد هاب" en="RELATED" />
            <div className="pa-eco">
              {relatedNews.length > 0 && (
                <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 8px 8px', boxShadow: '0 2px 10px rgba(28,27,23,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 10px 8px', fontSize: 13.5, fontWeight: 900 }}>
                    <Newspaper size={14} style={{ color: GOLD_D }} /> اخبار مرتبط
                  </div>
                  {relatedNews.map(a => (
                    <Link key={a.id} href={`/news/${a.id}`} className="pa-eco-item">
                      <img src={a.image} alt={a.title} loading="lazy" />
                      <div style={{ minWidth: 0 }}>
                        <p className="pa-eco-title">{a.title}</p>
                        <span style={{ fontSize: 10.5, color: MUT }}>{a.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {relatedVids.length > 0 && (
                <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 8px 8px', boxShadow: '0 2px 10px rgba(28,27,23,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 10px 8px', fontSize: 13.5, fontWeight: 900 }}>
                    <Clapperboard size={14} style={{ color: GOLD_D }} /> در بیلیارد مدیا
                  </div>
                  {relatedVids.map(v => (
                    <Link key={v.id} href={`/media/${v.id}`} className="pa-eco-item">
                      <img src={v.thumb} alt={v.title} loading="lazy" />
                      <div style={{ minWidth: 0 }}>
                        <p className="pa-eco-title">{v.title}</p>
                        <span style={{ fontSize: 10.5, color: MUT }}>{v.creator.name} · {v.duration}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ═══ لایت‌باکس ═══ */}
      {lightbox !== null && photos[lightbox] && typeof document !== 'undefined' && createPortal(
        <div onClick={closeLb} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(12,11,9,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'paFade .18s ease both' }}>
          <div style={{ position: 'absolute', top: 0, insetInline: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', color: '#fff', zIndex: 2 }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
              {album?.title} — {faDigits(lightbox + 1)} از {faDigits(photos.length)}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setZoomed(z => !z)} aria-label="بزرگ‌نمایی"
                style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
              </button>
              <button onClick={closeLb} aria-label="بستن"
                style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={17} />
              </button>
            </div>
          </div>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '84vh', overflow: zoomed ? 'auto' : 'hidden', borderRadius: 14 }}>
            <img
              src={photos[lightbox]}
              alt=""
              onClick={() => setZoomed(z => !z)}
              style={{ maxWidth: zoomed ? 'none' : '92vw', maxHeight: zoomed ? 'none' : '84vh', width: zoomed ? '160%' : 'auto', display: 'block', margin: 'auto', cursor: zoomed ? 'zoom-out' : 'zoom-in', borderRadius: 12 }}
            />
          </div>
          {photos.length > 1 && (
            <>
              <button className="pa-lb-nav" style={{ insetInlineStart: 14 }} onClick={e => { e.stopPropagation(); stepLb(1) }} aria-label="بعدی">
                <ChevronLeft size={20} />
              </button>
              <button className="pa-lb-nav" style={{ insetInlineEnd: 14 }} onClick={e => { e.stopPropagation(); stepLb(-1) }} aria-label="قبلی">
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
