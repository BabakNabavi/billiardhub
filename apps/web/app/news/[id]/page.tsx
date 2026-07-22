'use client'

/* ─────────────────────────────────────────────────────────────
   جزئیات خبر — هم‌خانواده‌ی صفحه‌ی لیست (/news): تم روشن، RTL،
   تصویرِ هیرو، لیدِ خلاصه، متن، برچسب‌ها، اشتراک‌گذاری و اخبارِ
   مرتبط (سایدبارِ چسبان در دسکتاپ). داده از lib/news-data.
   ───────────────────────────────────────────────────────────── */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Clock3, Eye, ChevronLeft, Link2, Check, Zap, ArrowLeft } from 'lucide-react'
import {
  getArticle, relatedArticles, categoryOf, faNum, NEWS_CATEGORIES,
} from '../../../lib/news-data'

const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'
const BG     = '#F7F7F5'

export default function NewsDetailPage() {
  const params = useParams()
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? ''
  const article = useMemo(() => getArticle(id), [id])
  const related = useMemo(() => (article ? relatedArticles(article, 4) : []), [article])
  const [copied, setCopied] = useState(false)

  if (!article) {
    return (
      <div dir="rtl" style={{ minHeight: '70vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn,Tahoma,sans-serif', padding: 20 }}>
        <div style={{ textAlign: 'center', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '40px 34px', maxWidth: 380 }}>
          <p style={{ fontSize: 17, fontWeight: 900, color: TEXT, margin: '0 0 8px' }}>خبر پیدا نشد</p>
          <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.8 }}>ممکن است این خبر حذف شده یا نشانی تغییر کرده باشد.</p>
          <Link href="/news" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
            بازگشت به اخبار <ArrowLeft size={14} />
          </Link>
        </div>
      </div>
    )
  }

  const cat = categoryOf(article.category)
  /* URL کانونیکالِ ثابت — هم برای SSR هم کلاینت یکی است (بدون hydration mismatch) */
  const pageUrl = `https://mybilliardhb1.vercel.app/news/${article.id}`
  const shareText = encodeURIComponent(article.title)

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(pageUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes ndFadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        .nd-wrap { max-width: 1180px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }
        .nd-layout { display: grid; grid-template-columns: minmax(0,1fr) 330px; gap: 26px; align-items: start; }
        .nd-share-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; height:38px;
          border-radius:10px; cursor:pointer; text-decoration:none; font-family:inherit; font-size:12.5px; font-weight:700;
          background:rgba(199,166,106,0.10); border:1px solid rgba(199,166,106,0.30); color:${GOLD_D};
          padding: 0 14px; transition: all .22s cubic-bezier(.22,1,.36,1); }
        .nd-share-btn:hover { transform: translateY(-2px); background: rgba(199,166,106,0.17); }
        .nd-rel { display:flex; gap:12px; padding:12px 10px; border-radius:12px; text-decoration:none; transition: background .2s; }
        .nd-rel:hover { background: rgba(199,166,106,0.07); }
        .nd-rel img { width:76px; height:58px; border-radius:10px; object-fit:cover; flex-shrink:0; border:1px solid ${LINE}; }
        .nd-rel-title { font-size:12.5px; font-weight:700; color:${TEXT}; line-height:1.65; margin:0 0 4px;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; transition: color .2s; }
        .nd-rel:hover .nd-rel-title { color:${GOLD_D}; }
        .nd-tag { font-size:11.5px; font-weight:700; color:${SEC}; background:#fff; border:1px solid ${LINE};
          border-radius:999px; padding:6px 13px; text-decoration:none; transition: all .2s; }
        .nd-tag:hover { color:${GOLD_D}; border-color: rgba(199,166,106,0.4); }
        @media (max-width: 940px) { .nd-layout { grid-template-columns: 1fr; } .nd-side { position: static !important; } }
      `}</style>

      <div className="nd-wrap" style={{ paddingTop: 18, paddingBottom: 72 }}>

        {/* ── بردکرامب ── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUT, marginBottom: 16, animation: 'ndFadeUp .4s ease both' }}>
          <Link href="/" style={{ color: MUT, textDecoration: 'none' }}>خانه</Link>
          <ChevronLeft size={12} />
          <Link href="/news" style={{ color: MUT, textDecoration: 'none' }}>اخبار</Link>
          <ChevronLeft size={12} />
          <span style={{ color: SEC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{article.title}</span>
        </nav>

        <div className="nd-layout">

          {/* ═══ ستون اصلی ═══ */}
          <article style={{ minWidth: 0 }}>

            {/* سربرگ خبر */}
            <header style={{ marginBottom: 18, animation: 'ndFadeUp .45s .05s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, padding: '5px 12px', borderRadius: 999, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.26)', color: GOLD_D }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.dot }} />
                  {cat.label}
                </span>
                {article.breaking && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: '#B23B2E', background: 'rgba(178,59,46,0.09)', border: '1px solid rgba(178,59,46,0.22)', borderRadius: 999, padding: '4px 11px' }}>
                    <Zap size={11} /> خبر فوری
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: 'clamp(20px,3.2vw,30px)', fontWeight: 900, lineHeight: 1.65, margin: '0 0 14px', letterSpacing: '-0.01em' }}>
                {article.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px 16px', flexWrap: 'wrap', fontSize: 12.5, color: MUT }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#8A6020)`, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 900 }}>
                    {article.author.slice(0, 1)}
                  </span>
                  <span style={{ color: SEC, fontWeight: 700 }}>{article.author}</span>
                </span>
                <span>{article.date}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock3 size={12} /> {article.readTime} مطالعه</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {faNum(article.views)} بازدید</span>
              </div>
            </header>

            {/* تصویر هیرو */}
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: `1px solid ${LINE}`, boxShadow: '0 6px 26px rgba(28,27,23,0.09)', marginBottom: 22, animation: 'ndFadeUp .5s .1s ease both' }}>
              <img src={article.image} alt={article.title} style={{ width: '100%', display: 'block', aspectRatio: '16/8.2', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, transparent 30%)' }} />
            </div>

            {/* لید */}
            <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${LINE}`, borderInlineStart: `3px solid ${GOLD}`, padding: '16px 18px', marginBottom: 22, animation: 'ndFadeUp .5s .14s ease both' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 2, color: SEC }}>{article.excerpt}</p>
            </div>

            {/* متن خبر */}
            <div style={{ animation: 'ndFadeUp .5s .18s ease both' }}>
              {article.body.map((p, i) => (
                <p key={i} style={{ fontSize: 14.5, lineHeight: 2.25, color: '#2B2822', margin: '0 0 18px' }}>{p}</p>
              ))}
            </div>

            {/* برچسب‌ها */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '26px 0 0', paddingTop: 20, borderTop: `1px solid ${LINE}` }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: MUT }}>برچسب‌ها:</span>
              {article.tags.map(t => <span key={t} className="nd-tag">#{t}</span>)}
            </div>

            {/* اشتراک‌گذاری */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 18, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '14px 16px' }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: SEC }}>اشتراک‌گذاری خبر:</span>
              <a className="nd-share-btn" href={`https://wa.me/?text=${shareText}%0A${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer">واتساپ</a>
              <a className="nd-share-btn" href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${shareText}`} target="_blank" rel="noopener noreferrer">تلگرام</a>
              <button className="nd-share-btn" onClick={copyLink}>
                {copied ? <Check size={14} /> : <Link2 size={14} />}
                {copied ? 'کپی شد' : 'کپی لینک'}
              </button>
            </div>
          </article>

          {/* ═══ سایدبار ═══ */}
          <aside className="nd-side" style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 18, animation: 'ndFadeUp .5s .2s ease both' }}>

            {/* اخبار مرتبط */}
            <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 10px 8px', boxShadow: '0 2px 10px rgba(28,27,23,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '0 8px 8px' }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
                <h2 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>اخبار مرتبط</h2>
              </div>
              {related.map(r => (
                <Link key={r.id} href={`/news/${r.id}`} className="nd-rel">
                  <img src={r.image} alt={r.title} loading="lazy" />
                  <div style={{ minWidth: 0 }}>
                    <p className="nd-rel-title">{r.title}</p>
                    <span style={{ fontSize: 10.5, color: MUT }}>{categoryOf(r.category).label} · {r.date}</span>
                  </div>
                </Link>
              ))}
              <div style={{ padding: '8px 8px 10px' }}>
                <Link href="/news" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, textDecoration: 'none', fontSize: 12.5, fontWeight: 800, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
                  مشاهده همه اخبار <ArrowLeft size={13} />
                </Link>
              </div>
            </div>

            {/* دسته‌بندی‌ها */}
            <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 16, boxShadow: '0 2px 10px rgba(28,27,23,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
                <h2 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>دسته‌بندی‌ها</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {NEWS_CATEGORIES.map(c => (
                  <Link key={c.key} href="/news" className="nd-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
