'use client';

/* ─────────────────────────────────────────────────────────────
   براکت مسابقه — نمایش عمومی.

   پیش‌تر این صفحه براکت را خودش در حافظه‌ی مرورگر می‌ساخت و با
   بازیکنان نمونه پر می‌کرد؛ چیزی ذخیره نمی‌شد و هر بار عوض می‌شد.
   حالا فقط همان براکتی را نشان می‌دهد که برگزارکننده در
   /tournaments/:id/admin قرعه‌کشی کرده است.

   چیدمان دوطرفه است — نیمی راست، نیمی چپ، فینال در وسط. جزئیاتش
   در components/tournaments/BracketTree.tsx.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Trophy, Loader2, GitBranch, Radio, RefreshCw } from 'lucide-react';
import {
  fetchBracket,
  type Bracket,
} from '../../../../lib/tournaments/bracket-client';
import BracketTree from '../../../../components/tournaments/BracketTree';

const GOLD_D = '#9A6E38', INK = '#1C1B17';
const MUT = '#8A8474', LINE = '#EAE5DA', RED = '#B23B2E';

export default function BracketPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '');

  /* اگر کاربر مستقیم وارد این نشانی شده باشد تاریخچه‌ای برای بازگشت
     نیست؛ آن‌وقت صفحه‌ی مسابقه مقصدِ منطقی است. */
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/tournaments/${id}`);
  };

  const [b, setB] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    setB(await fetchBracket(id));
    setLoading(false); setRefreshing(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  /* وقتی بازی زنده‌ای در جریان است براکت خودش تازه می‌شود — تماشاگر
     نباید برای دیدن نتیجه‌ی دور بعد صفحه را رفرش کند. */
  const hasLive = !!b?.matches.some(m => m.status === 'in_progress');
  useEffect(() => {
    if (!hasLive) return;
    const t = setInterval(() => void load(true), 20000);
    return () => clearInterval(t);
  }, [hasLive, load]);

  if (loading) return <Center><Loader2 size={28} style={{ animation: 'bkspin 1s linear infinite' }} /></Center>;
  if (!b) return <Center><p style={{ fontWeight: 800, color: INK }}>این مسابقه پیدا نشد</p></Center>;

  const empty = b.matches.length === 0;

  return (
    <div dir="rtl" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 70px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 6px', flexWrap: 'wrap' }}>
        {/* ── چرا بازگشتِ مرورگر و نه لینکِ ثابت ──
            لینک همیشه به صفحه‌ی مسابقه می‌رفت، حتی وقتی کاربر از
            فهرستِ مسابقات آمده بود. یعنی برای برگشتن به همان تب و
            همان اسکرول، باید یک‌بار دیگر هم دستی برمی‌گشت.

            `router.back()` دقیقاً همان‌جایی برمی‌گردد که بود — با
            تبِ انتخاب‌شده و جای اسکرول. اگر تاریخچه‌ای نباشد (لینکِ
            مستقیم یا تبِ تازه)، صفحه‌ی مسابقه پشتیبان است. */}
        <button type="button" onClick={goBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12.5, color: MUT, background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', padding: 0,
        }}>
          <ChevronRight size={14} /> بازگشت
        </button>
        <span style={{ color: LINE }}>/</span>
        <h1 style={{ fontSize: 17, fontWeight: 900, color: INK, margin: 0 }}>براکت</h1>
        {hasLive && (
          <span style={liveDot}>
            <Radio size={11} /> در حال پخش
            {refreshing && <RefreshCw size={10} style={{ animation: 'bkspin 1s linear infinite' }} />}
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: MUT, margin: '0 0 18px' }}>{b.tournament.title}</p>

      {empty ? (
        <div style={{ ...card, textAlign: 'center', padding: '60px 20px' }}>
          <GitBranch size={34} style={{ color: MUT, opacity: 0.4, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 6px' }}>هنوز قرعه‌کشی نشده</p>
          <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 2 }}>
            براکت پس از بسته‌شدن ثبت‌نام و قرعه‌کشی برگزارکننده اینجا نمایش داده می‌شود.
          </p>
        </div>
      ) : (
        <>
          {b.champion && (
            <div style={{
              ...card, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap',
              borderColor: 'rgba(199,166,106,0.45)',
              background: 'linear-gradient(135deg, rgba(199,166,106,0.10), rgba(199,166,106,0.03))',
            }}>
              <Trophy size={24} style={{ color: GOLD_D }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: GOLD_D, fontWeight: 800, letterSpacing: '0.1em' }}>قهرمان</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: INK }}>{b.champion.name}</div>
              </div>
              {b.runnerUp && (
                <div style={{ marginInlineStart: 'auto' }}>
                  <div style={{ fontSize: 11, color: MUT, fontWeight: 700 }}>نایب‌قهرمان</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>{b.runnerUp.name}</div>
                </div>
              )}
            </div>
          )}

          {/* ── چیدمانِ دوطرفه ──
              پیش‌تر هر دور یک ستون بود و همه پشتِ سرِ هم از راست به
              چپ می‌آمدند، با اسکرولِ افقی. براکتِ ۳۲ نفره یعنی پنج
              ستون که روی هیچ نمایشگری یک‌جا جا نمی‌شد — و روی
              مانیتورِ سالن یعنی تماشاگر نصفِ جدول را نمی‌دید.

              حالا نیمی از بازی‌ها سمتِ راست و نیمی سمتِ چپ‌اند و
              فینال وسط می‌نشیند؛ همان تعداد بازی در نصفِ عرض. */}
          <div style={{ ...card, padding: '16px 10px' }}>
            <BracketTree bracket={b} />
          </div>
        </>
      )}

      <style>{`@keyframes bkspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 80, textAlign: 'center', color: MUT }}>
      {children}
      <style>{`@keyframes bkspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 14 };
const liveDot: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  fontSize: 11, fontWeight: 800, color: RED,
  background: 'rgba(178,59,46,0.09)', border: '1px solid rgba(178,59,46,0.28)',
  borderRadius: 999, padding: '3px 9px',
};
