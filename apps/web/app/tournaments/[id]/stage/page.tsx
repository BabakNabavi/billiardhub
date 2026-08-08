'use client';

/* ─────────────────────────────────────────────────────────────
   نمایشِ بزرگ — برای مانیتورِ سالن.

   ── چرا صفحه‌ی جدا و نه همان صفحه‌ی براکت ──
   این صفحه را کسی نمی‌خواند؛ از ده متر آن‌طرف‌تر **دیده** می‌شود.
   یعنی الزاماتش برعکسِ صفحه‌ی معمولی است: زمینه‌ی تیره تا روی
   پروژکتور نسوزد، متنِ درشت، بدونِ نوار و منو و فوتر، و بدونِ هیچ
   چیزِ کلیک‌کردنی. یک صفحه که هم این باشد هم آن، هیچ‌کدام نمی‌شود.

   ── چرا خودش تازه می‌شود ──
   کسی پشتِ آن مانیتور نیست که رفرش بزند. هر ۱۵ ثانیه بی‌صدا
   می‌خواند؛ اگر بازیِ زنده‌ای باشد هر ۷ ثانیه.

   ── تمام‌صفحه ──
   مرورگر بدونِ حرکتِ کاربر تمام‌صفحه نمی‌شود، پس یک دکمه هست که
   بعد از اولین لمس ناپدید می‌شود. روی گوشی همان دکمه جهت را هم
   افقی قفل می‌کند — جدولِ عریض در حالتِ عمودی خوانده نمی‌شود.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Maximize2, Trophy, Radio } from 'lucide-react';
import {
  fetchBracket, tournamentHighBreak, faDigits,
  type Bracket,
} from '../../../../lib/tournaments/bracket-client';
import BracketTree from '../../../../components/tournaments/BracketTree';

/* ── چرا روشن ──
   زمینه‌ی تیره را برای «نسوختنِ پروژکتور» گذاشته بودم. روی
   نمایشگرهای امروزیِ سالن نتیجه‌اش برعکس بود: جدولِ تیره در نورِ
   سالن کم‌کنتراست دیده می‌شد و با بقیه‌ی سایت هم یکی نبود. */
const GOLD_D = '#9A6E38', INK = '#1C1B17', MUT = '#8A8474', BG = '#F7F6F2';

export default function StagePage() {
  const params = useParams();
  const id = String(params?.id ?? '');

  const [b, setB] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFs, setShowFs] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setB(await fetchBracket(id));
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  /* ── فاصله‌ی بازخوانی ──
     ۷/۱۵ ثانیه برای مانیتوری که کنارش نتیجه ثبت می‌شود زیاد بود:
     اپراتور «تأیید» را می‌زد و تا ۱۵ ثانیه چیزی عوض نمی‌شد، که از
     آن‌طرفِ سالن یعنی «کار نکرد». پاسخِ این مسیر کوچک است (چند ده
     ردیفِ بازی)، پس فاصله‌ی کوتاه هزینه‌ای ندارد. */
  const hasLive = !!b?.matches.some(m => m.status === 'in_progress');
  useEffect(() => {
    const t = setInterval(() => void load(), hasLive ? 3000 : 10000);
    return () => clearInterval(t);
  }, [hasLive, load]);

  /* بازگشت به تب ⇒ همان لحظه تازه شود، نه در تیکِ بعدی */
  useEffect(() => {
    const onVis = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load]);

  /* ── تمام‌صفحه ──
     `requestFullscreen` فقط داخلِ رویدادِ کاربر اجازه دارد؛ صدازدنش
     در `useEffect` بی‌صدا رد می‌شود. قفلِ جهت هم روی سافاریِ آی‌اواس
     وجود ندارد، پس شکستش نباید بقیه‌ی کار را متوقف کند. */
  const goFullscreen = useCallback(async () => {
    try { await rootRef.current?.requestFullscreen?.(); } catch { /* پشتیبانی نمی‌شود */ }
    try {
      const o = screen.orientation as ScreenOrientation & { lock?: (v: string) => Promise<void> };
      await o?.lock?.('landscape');
    } catch { /* آی‌اواس قفلِ جهت ندارد */ }
  }, []);

  /* ── چرا دکمه تا وقتی واقعاً تمام‌صفحه نشده می‌ماند ──
     پیش‌تر با اولین کلیک `setShowFs(false)` می‌شد، چه تمام‌صفحه
     می‌شد چه نه. اگر مرورگر رد می‌کرد — که روی چند مرورگر بدونِ
     ژستِ معتبر رد می‌شود — دکمه غیب می‌شد و نوارِ نشانیِ مرورگر
     بالای جدول می‌ماند بدونِ هیچ راهی برای برداشتنش. حالا فقط
     رویدادِ واقعیِ `fullscreenchange` پنهانش می‌کند. */
  useEffect(() => {
    const sync = () => setShowFs(!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    sync();
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  /* اولین لمسِ صفحه هم تمام‌صفحه می‌کند: کسی که این نشانی را روی
     مانیتور باز می‌کند، دنبالِ دکمه نمی‌گردد. */
  useEffect(() => {
    const once = () => { if (!document.fullscreenElement) void goFullscreen(); };
    document.addEventListener('pointerdown', once, { once: true });
    return () => document.removeEventListener('pointerdown', once);
  }, [goFullscreen]);

  if (loading) return (
    <Shell><Loader2 size={34} color={GOLD_D} style={{ animation: 'stg 1s linear infinite' }} /></Shell>
  );
  if (!b || !b.matches.length) return (
    <Shell><span style={{ color: MUT, fontSize: 18 }}>
      هنوز قرعه‌کشی نشده
    </span></Shell>
  );

  const done = b.matches.filter(m => m.winner !== null).length;
  const highBreak = tournamentHighBreak(b);

  return (
    <div ref={rootRef} dir="rtl" style={{
      minHeight: '100vh', background: BG, color: INK,
      padding: 'clamp(14px,2.2vw,28px)',
      fontFamily: 'Vazirmatn, Tahoma, sans-serif',
      display: 'flex', flexDirection: 'column', gap: 'clamp(10px,1.6vh,20px)',
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 12, fontWeight: 800, letterSpacing: '0.24em', color: GOLD_D,
        }}>BILLIARD HUB</span>
        <h1 style={{
          fontSize: 'clamp(18px,2.4vw,30px)', fontWeight: 900, color: INK, margin: 0,
        }}>{b.tournament.title}</h1>

        {hasLive && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 800, color: '#B23B2E',
            background: 'rgba(178,59,46,0.09)', border: '1px solid rgba(178,59,46,0.3)',
            borderRadius: 999, padding: '4px 12px',
          }}><Radio size={12} /> زنده</span>
        )}

        <span style={{
          marginInlineStart: 'auto', fontSize: 13,
          color: MUT, fontVariantNumeric: 'tabular-nums',
        }}>{faDigits(done)} از {faDigits(b.matches.length)} بازی</span>

        {/* دکمه‌ی «مدیریت زنده» از این صفحه برداشته شد: کشویی که
            روی همین صفحه باز می‌شد، درست همان لحظه‌ای که اپراتور
            نتیجه را ثبت می‌کرد جدول را از دیدِ تماشاگر می‌پوشاند.
            حالا نشانیِ جدا دارد و از پنلِ مسابقه باز می‌شود. */}

        {showFs && (
          <button type="button" onClick={() => void goFullscreen()} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
            fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
            border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)', color: GOLD_D,
          }}><Maximize2 size={13} /> تمام‌صفحه</button>
        )}
      </header>

      {b.champion && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          padding: '10px 16px', borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(199,166,106,0.16), rgba(199,166,106,0.05))',
          border: '1px solid rgba(199,166,106,0.4)',
        }}>
          <Trophy size={22} color={GOLD_D} />
          <span style={{ fontSize: 'clamp(16px,2vw,24px)', fontWeight: 900, color: INK }}>
            قهرمان: {b.champion.name}
          </span>
          {b.runnerUp && (
            <span style={{ fontSize: 14, color: MUT }}>
              نایب‌قهرمان: {b.runnerUp.name}
            </span>
          )}
        </div>
      )}


      {/* `minHeight: 0` لازم است: بدونِ آن یک فرزندِ flex هرگز از
          محتوایش کوچک‌تر نمی‌شود و ارتفاعِ در دسترس دروغ درمی‌آید. */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <BracketTree bracket={b} stage fill highBreak={highBreak} />
      </div>

      {/* ── چرخاندنِ گوشی ──
          جدولِ عریض در حالتِ عمودی آن‌قدر کوچک می‌شود که خوانده
          نشود. به‌جای نشان‌دادنِ چیزی ناخوانا، صریح می‌گوییم. */}
      <div className="stg-rotate">
        <span style={{ fontSize: 40 }}>⟳</span>
        <span style={{ fontSize: 15, fontWeight: 800 }}>گوشی را افقی بگیرید</span>
        <span style={{ fontSize: 12.5, color: MUT, lineHeight: 2 }}>
          جدول برای نمایشِ عریض ساخته شده
        </span>
      </div>

      <style>{`
        @keyframes stg{to{transform:rotate(360deg)}}
        .stg-rotate{ display:none }
        @media (max-width: 820px) and (orientation: portrait){
          .stg-rotate{
            position:fixed; inset:0; z-index:60; background:${BG};
            display:flex; flex-direction:column; align-items:center;
            justify-content:center; gap:12px; color:${INK}; text-align:center;
            padding:24px;
          }
        }
      `}</style>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" style={{
      minHeight: '100vh', background: BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Vazirmatn, Tahoma, sans-serif',
    }}>
      {children}
      <style>{`@keyframes stg{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
