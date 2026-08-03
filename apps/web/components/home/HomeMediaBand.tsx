'use client'

/* ─────────────────────────────────────────────────────────────
   نوارِ سینماییِ بیلیارد مدیا — صفحه‌ی اصلی.

   از `HomeClient` بیرون کشیده شد. آن فایل ۲۲۰۰ خط بود و کلِ صفحه‌ی
   اصلی را در یک باندلِ واحد می‌گذاشت: مرورگر باید همه‌اش را می‌خواند
   و hydrate می‌کرد پیش از آنکه صفحه به کلیک جواب بدهد.

   این سکشن زیرِ خطِ اول است و تا کاربر اسکرول نکند دیده نمی‌شود، پس
   دلیلی ندارد در همان ثانیه‌ی اول اجرا شود. حالا چانکِ خودش را دارد و
   با `next/dynamic` بارگذاری می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, Eye, Clapperboard, ArrowLeft } from 'lucide-react'
import { MEDIA_VIDEOS, compactViews } from '../../lib/media-data'
import { getHiddenVideoIds, getFeaturedOverride } from '../../lib/media-admin-store'

/* فهرستِ محتوای دستی می‌تواند خالی باشد (و امروز هست). پیش‌تر این‌جا
   `MEDIA_VIDEOS[0]!` نوشته شده بود که با فهرستِ خالی `undefined`
   می‌شود و اولین `feat.id` کلِ صفحه‌ی اول را می‌شکند. */
const MEDIA_FEAT = MEDIA_VIDEOS.find(v => v.featured) ?? MEDIA_VIDEOS[0] ?? null
const MEDIA_MINIS = MEDIA_FEAT
  ? [...MEDIA_VIDEOS].sort((a, b) => b.views - a.views).filter(v => v.id !== MEDIA_FEAT.id).slice(0, 3)
  : []

export default function HomeMediaBand() {
  /* کنترل‌های ادمین (ویژه/مخفی) بعد از mount اعمال می‌شوند */
  const [feat, setFeat]   = useState(MEDIA_FEAT);
  const [minis, setMinis] = useState(MEDIA_MINIS);
  useEffect(() => {
    const hidden = new Set(getHiddenVideoIds());
    const pool = MEDIA_VIDEOS.filter(v => !hidden.has(v.id));
    if (!pool.length) return;
    const ov = getFeaturedOverride();
    const f = (ov ? pool.find(v => v.id === ov) : undefined) ?? pool.find(v => v.featured) ?? pool[0]!;
    setFeat(f);
    setMinis([...pool].sort((a, b) => b.views - a.views).filter(v => v.id !== f.id).slice(0, 3));
  }, []);

  /* بدونِ محتوا، نوارِ مدیا اصلاً رندر نمی‌شود — یک سکشنِ سینماییِ خالی
     بدتر از نبودنش است. */
  if (!feat) return null;

  return (
    <section dir="rtl" className="hm-band">
      <style>{`
        .hm-band { position: relative; overflow: hidden; color: #F2EFE9; background:
          radial-gradient(circle at 86% 0%, rgba(199,166,106,0.13), transparent 44%),
          linear-gradient(120deg, #0C0B09 0%, #171208 55%, #0C0B09 100%); }
        .hm-band::before, .hm-band::after { content: ''; position: absolute; inset-inline: 0; height: 1px; z-index: 7;
          background: linear-gradient(90deg, transparent, rgba(199,166,106,0.5), transparent); }
        .hm-band::before { top: 0; } .hm-band::after { bottom: 0; }
        /* پرفراژ فیلم — امضای سالن نمایش */
        .hm-perf { position: absolute; inset-inline: 0; height: 7px; z-index: 6; opacity: .95; pointer-events: none;
          background: repeating-linear-gradient(90deg, rgba(183,156,255,0.4) 0 14px, transparent 14px 32px); }
        .hm-perf-t { top: 5px; } .hm-perf-b { bottom: 5px; }
        .hm-word { position: absolute; bottom: -6px; inset-inline-start: -4px; font-weight: 900; z-index: 1;
          font-size: clamp(48px, 7.6vw, 104px); line-height: 1; letter-spacing: .04em;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.06); user-select: none; pointer-events: none; direction: ltr; }
        .hm-poster { position: absolute; top: 0; bottom: 0; left: 0; width: 52%; z-index: 0; overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, black 44%, transparent 96%);
          mask-image: linear-gradient(to right, black 44%, transparent 96%); }
        /* صحنه‌ی سینمایی — تماماً CSS/SVG، بدون عکس؛ المان‌ها بنفش درخشان */
        .hm-stage { position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 62% at 26% 100%, rgba(139,92,246,0.18), transparent 62%),
                      radial-gradient(ellipse 50% 50% at 20% 6%, rgba(167,139,250,0.10), transparent 60%),
                      linear-gradient(120deg, #0D0B12 0%, #16121D 60%, #0D0B10 100%); }
        /* پرتوی نور پروژکتور از بالا-چپ */
        .hm-beam { position: absolute; top: -12%; left: 6%; width: 68%; height: 130%;
          background: conic-gradient(from 158deg at 18% 0%, transparent 0deg, rgba(196,171,255,0.26) 12deg, rgba(167,139,250,0.10) 26deg, transparent 38deg);
          filter: blur(5px); animation: hmBeam 9s ease-in-out infinite; transform-origin: 18% 0%; }
        @keyframes hmBeam { 0%,100% { transform: rotate(0deg); opacity: 1; } 50% { transform: rotate(3.5deg); opacity: .85; } }
        .hm-cam { position: absolute; left: 9%; bottom: 6%; width: clamp(160px, 15.5vw, 230px); height: auto; opacity: 1;
          filter: drop-shadow(0 0 14px rgba(167,139,250,0.45)) drop-shadow(0 14px 30px rgba(0,0,0,0.55)); }
        /* هاله‌ی لنز */
        .hm-flare { position: absolute; left: 26%; top: 32%; width: 110px; height: 110px; border-radius: 50%;
          background: radial-gradient(circle, rgba(214,196,255,0.32) 0%, rgba(139,92,246,0.14) 40%, transparent 68%);
          filter: blur(4px); animation: hmFlare 6s ease-in-out infinite; }
        @keyframes hmFlare { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .6; transform: scale(1.15); } }
        /* پلی — طرح LQ بنفش، چشمک‌زن (حلقه‌ی تپنده) */
        @keyframes hmPlayPulse {
          0%   { box-shadow: 0 10px 30px rgba(139,92,246,0.28), 0 0 0 0 rgba(167,139,250,0.5); }
          70%  { box-shadow: 0 10px 30px rgba(139,92,246,0.28), 0 0 0 12px rgba(167,139,250,0); }
          100% { box-shadow: 0 10px 30px rgba(139,92,246,0.28), 0 0 0 0 rgba(167,139,250,0); }
        }
        .hm-play { position: absolute; z-index: 5; top: 50%; left: 24%; transform: translate(-50%,-50%);
          width: 62px; height: 62px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          color: #B79CFF; background: rgba(139,92,246,0.16); border: 1px solid rgba(167,139,250,0.5);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          animation: hmPlayPulse 2.1s ease-out infinite;
          transition: transform .3s cubic-bezier(.22,1,.36,1), background .25s; }
        .hm-play:hover { transform: translate(-50%,-50%) scale(1.09); background: rgba(139,92,246,0.26); }
        /* نقطه‌ی بنفش چشمک‌زن NOW SHOWING */
        @keyframes hmDot { 0%,100% { opacity: 1; box-shadow: 0 0 7px rgba(183,156,255,0.8); } 50% { opacity: .2; box-shadow: none; } }
        .hm-nsdot { width: 6px; height: 6px; border-radius: 50%; background: #B79CFF; flex-shrink: 0;
          animation: hmDot 1.6s ease-in-out infinite; }
        .hm-dur { position: absolute; z-index: 5; bottom: 16px; left: 16px; font-size: 11px; font-weight: 800;
          color: #F2EFE9; background: rgba(8,7,5,0.8); border: 1px solid rgba(255,255,255,0.14);
          border-radius: 7px; padding: 2px 9px; font-variant-numeric: tabular-nums; letter-spacing: .04em; }
        .hm-wrap { position: relative; z-index: 4; max-width: 1340px; margin: 0 auto;
          padding: clamp(26px,3vw,38px) clamp(16px,5%,80px);
          display: flex; flex-direction: column; gap: 12px; align-items: flex-start;
          min-height: clamp(220px, 22vw, 275px); justify-content: center; }
        .hm-kicker { display: inline-flex; align-items: center; gap: 7px; font-size: 9.5px; font-weight: 800;
          letter-spacing: 0.26em; color: #B79CFF; border: 1px solid rgba(167,139,250,0.45);
          background: rgba(139,92,246,0.12); border-radius: 999px; padding: 4px 12px; }
        @keyframes hmIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .hm-title { font-size: clamp(22px, 2.9vw, 38px); font-weight: 900; line-height: 1.25; margin: 0;
          letter-spacing: -0.02em; color: #fff; }
        .hm-title b { background: linear-gradient(135deg,#E8CE96,#C7A66A 55%,#8A6020);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hm-tag { font-size: clamp(11.5px, 1.2vw, 13px); color: rgba(242,239,233,0.55); line-height: 1.9; margin: 0; }
        .hm-feat { display: flex; align-items: center; gap: 9px; max-width: 620px; }
        .hm-feat-title { font-size: clamp(12.5px, 1.35vw, 15px); font-weight: 800; color: rgba(255,255,255,0.88);
          line-height: 1.7; margin: 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .hm-cta-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
        /* دکمه‌ها — طرح LQ با تینت بنفش (هم‌رنگ پوستر) */
        .hm-cta { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px;
          text-decoration: none; font-size: 13px; font-weight: 800; color: #B79CFF;
          background: rgba(139,92,246,0.14); border: 1px solid rgba(167,139,250,0.45);
          transition: transform .25s cubic-bezier(.22,1,.36,1), background .2s, box-shadow .25s; }
        .hm-cta:hover { transform: translateY(-2px); background: rgba(139,92,246,0.22); box-shadow: 0 8px 22px rgba(139,92,246,0.26); }
        .hm-all { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700;
          color: #B79CFF; text-decoration: none; background: rgba(139,92,246,0.14);
          border: 1px solid rgba(167,139,250,0.4); border-radius: 10px; padding: 9px 16px;
          transition: transform .25s cubic-bezier(.22,1,.36,1), background .2s, box-shadow .25s; }
        .hm-all:hover { transform: translateY(-2px); background: rgba(139,92,246,0.22); box-shadow: 0 8px 22px rgba(139,92,246,0.24); }
        /* دیوار پوستر — سه ویدیوی پربازدید */
        .hm-minis { display: flex; gap: 10px; margin-top: 10px; }
        .hm-mini { position: relative; width: 118px; aspect-ratio: 16/9; border-radius: 10px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12); flex-shrink: 0;
          transition: transform .28s cubic-bezier(.22,1,.36,1), border-color .28s; }
        .hm-mini:hover { transform: translateY(-3px); border-color: rgba(199,166,106,0.5); }
        .hm-mini img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.8); }
        .hm-mini i { position: absolute; bottom: 4px; inset-inline-start: 5px; font-size: 9px; font-weight: 800;
          font-style: normal; color: #F2EFE9; background: rgba(8,7,5,0.8); border-radius: 5px; padding: 1px 6px;
          font-variant-numeric: tabular-nums; }
        .hm-anim { animation: hmIn .6s cubic-bezier(.22,1,.36,1) both; }
        @media (max-width: 760px) {
          /* صحنه‌ی بنفش تمام‌پهنا؛ دوربین پایین، زیر پرتوی نور */
          .hm-poster { width: 100%; opacity: .85;
            -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
            mask-image: linear-gradient(to bottom, black 80%, transparent 100%); }
          /* دوربین روبروی NOW SHOWING؛ پلی به موازاتش */
          .hm-cam { left: 2%; top: auto; bottom: 64px; width: 96px; opacity: .95; }
          .hm-beam { left: -8%; width: 95%; }
          .hm-flare { left: 10%; top: 26%; width: 80px; height: 80px; }
          .hm-dur, .hm-minis { display: none; }
          .hm-play { display: flex; top: auto; bottom: 86px; left: 33%; transform: none;
            width: 44px; height: 44px; }
          .hm-play:hover { transform: scale(1.08); }
          .hm-wrap { min-height: 0; padding-block: 26px 24px; }
          /* NOW SHOWING: بدون بازدید؛ عنوان ریزتر زیر لیبل */
          .hm-views, .hm-featdot { display: none; }
          .hm-feat { flex-wrap: wrap; gap: 6px; }
          .hm-feat-title { flex-basis: 100%; font-size: 11px; line-height: 1.8; color: rgba(255,255,255,0.7);
            -webkit-line-clamp: 2; }
          /* فقط «همه ویدیوها»، سمت راست (جای قبلی تماشای ویدیو) */
          .hm-cta { display: none; }
          .hm-all { padding: 8px 14px; font-size: 11.5px; gap: 5px; border-radius: 9px; }
        }
        @media (prefers-reduced-motion: reduce) { .hm-anim { animation: none; } }
      `}</style>

      <div className="hm-perf hm-perf-t" aria-hidden />
      <div className="hm-perf hm-perf-b" aria-hidden />

      {/* پوستر سینمایی — صحنه‌ی CSS/SVG: دوربین فیلم‌برداری + نور پروژکتور */}
      <div className="hm-poster" aria-hidden>
        <div className="hm-stage" />
        <div className="hm-beam" />
        <div className="hm-flare" />
        {/* دوربین سینمایی — لاین‌آرت طلایی */}
        <svg className="hm-cam" viewBox="0 0 220 150" fill="none" stroke="#B79CFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {/* حلقه‌های فیلم */}
          <circle cx="78" cy="28" r="20" opacity=".9" />
          <circle cx="78" cy="28" r="8" opacity=".55" />
          <circle cx="122" cy="28" r="20" opacity=".9" />
          <circle cx="122" cy="28" r="8" opacity=".55" />
          {/* بدنه */}
          <rect x="58" y="48" width="86" height="44" rx="8" opacity=".95" />
          <circle cx="80" cy="70" r="9" opacity=".5" />
          {/* لنز */}
          <path d="M144 60 L172 50 L172 90 L144 80 Z" opacity=".95" />
          <line x1="172" y1="56" x2="184" y2="52" opacity=".45" />
          <line x1="172" y1="84" x2="184" y2="88" opacity=".45" />
          {/* سه‌پایه */}
          <line x1="101" y1="92" x2="101" y2="104" opacity=".8" />
          <line x1="101" y1="104" x2="76" y2="142" opacity=".8" />
          <line x1="101" y1="104" x2="126" y2="142" opacity=".8" />
          <line x1="101" y1="104" x2="101" y2="140" opacity=".55" />
        </svg>
      </div>
      <Link href={`/media/${feat.id}`} className="hm-play" aria-label="پخش ویدیوی ویژه">
        <Play size={24} fill="currentColor" />
      </Link>
      <span className="hm-dur" aria-hidden>{feat.duration}</span>
      <div aria-hidden style={{ position: 'absolute', top: '-30%', bottom: '-30%', left: '46%', width: 1, zIndex: 2, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.4),transparent)', transform: 'rotate(14deg)', pointerEvents: 'none' }} />
      <div className="hm-word" aria-hidden>MEDIA</div>

      <div className="hm-wrap">
        <span className="hm-kicker hm-anim"><Clapperboard size={11} /> BILLIARD MEDIA</span>
        <h3 className="hm-title hm-anim" style={{ animationDelay: '60ms' }}>
          بیلیارد <b>مدیا</b> — سالن نمایش دنیای بیلیارد
        </h3>
        <p className="hm-tag hm-anim" style={{ animationDelay: '110ms' }}>
          آموزش‌های حرفه‌ای، هایلایت مسابقات و مصاحبه‌های اختصاصی — در پلتفرم ویدیویی بیلیارد هاب
        </p>
        <div className="hm-feat hm-anim" style={{ animationDelay: '160ms' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.18em', color: '#E8CE96', flexShrink: 0 }}><span className="hm-nsdot" /> NOW SHOWING</span>
          <span className="hm-featdot" style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
          <p className="hm-feat-title">{feat.title}</p>
          <span className="hm-views" style={{ fontSize: 11, color: 'rgba(242,239,233,0.45)', flexShrink: 0 }}>{compactViews(feat.views)} بازدید</span>
        </div>
        <div className="hm-cta-row hm-anim" style={{ animationDelay: '210ms' }}>
          <Link href={`/media/${feat.id}`} className="hm-cta"><Play size={14} fill="currentColor" /> تماشای ویدیو</Link>
          <Link href="/media" className="hm-all">همه ویدیوها <ArrowLeft size={12} /></Link>
        </div>
        <div className="hm-minis hm-anim" style={{ animationDelay: '260ms' }}>
          {minis.map(v => (
            <Link key={v.id} href={`/media/${v.id}`} className="hm-mini" title={v.title}>
              <img src={v.thumb} alt={v.title} loading="lazy" />
              <i>{v.duration}</i>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
