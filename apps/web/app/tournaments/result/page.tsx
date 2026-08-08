'use client';

/* ─────────────────────────────────────────────────────────────
   نتیجه‌ی پرداختِ ثبت‌نامِ مسابقه.

   ── باگی که این صفحه را ساخت ──
   مسیرِ کالبک بعد از تأییدِ پرداخت کاربر را با ۳۰۳ به
   `/tournaments/result?state=ok&r=…` می‌فرستاد. ولی چنین صفحه‌ای
   هرگز ساخته نشده بود — و چون `app/tournaments/[id]` یک مسیرِ پویاست،
   واژه‌ی `result` را به‌عنوان شناسه‌ی مسابقه می‌قاپید. آن صفحه دنبالِ
   مسابقه‌ای با شناسه‌ی «result» می‌گشت، پیدا نمی‌کرد، و می‌گفت:

       «این مسابقه پیدا نشد — ممکن است برگزار شده باشد یا
        برگزارکننده آن را برداشته باشد.»

   یعنی کاربر پول را داده بود، ثبت‌نامش در دیتابیس **قطعی شده بود**،
   و صفحه به او می‌گفت مسابقه وجود ندارد. بدترین جای ممکن برای یک
   ۴۰۴: درست بعد از پرداخت.

   ── چرا همه‌ی حالت‌ها این‌جا هستند ──
   کالبک شش حالت برمی‌گرداند و هر کدام کارِ متفاوتی از کاربر
   می‌خواهد. «پرداخت ناموفق» برای کسی که پولش کم شده ولی ظرفیت پر
   شده، هم غلط است هم بی‌فایده — او باید بداند پولش برمی‌گردد.
   ───────────────────────────────────────────────────────────── */

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { apiFetch } from '../../../lib/http';

const GOLD = '#C7A66A';
const GOLD_D = '#9A6E38';
const INK = '#1C1B17';
const MUT = '#8A8474';

type Tone = 'ok' | 'warn' | 'bad';

interface View {
  tone: Tone;
  title: string;
  body: string;
  /* آیا ارزشِ نشان‌دادنِ جزئیاتِ ثبت‌نام را دارد */
  showDetails: boolean;
}

/* پیام‌ها عمداً می‌گویند «حالا چه کار کن»، نه فقط «چه شد».
   پیامی که کاربر بعدش نداند چه کند، همان‌قدر بد است که پیام نبودن. */
function viewOf(state: string): View {
  switch (state) {
    case 'ok':
      return {
        tone: 'ok', showDetails: true,
        title: 'ثبت‌نام شما قطعی شد',
        body: 'پرداخت با موفقیت انجام شد و جای شما در مسابقه رزرو شد. جزئیات به شماره‌ی شما پیامک می‌شود.',
      };
    case 'cancelled':
      return {
        tone: 'warn', showDetails: true,
        title: 'پرداخت انجام نشد',
        body: 'شما در صفحه‌ی درگاه از پرداخت منصرف شدید. مبلغی از حساب شما کم نشده و جای شما هنوز رزرو نشده است. می‌توانید دوباره تلاش کنید.',
      };
    case 'full':
      return {
        tone: 'bad', showDetails: true,
        title: 'ظرفیت پیش از تأیید پرداخت شما تکمیل شد',
        body: 'مبلغ پرداختی شما به‌طور کامل بازگردانده می‌شود؛ این کار معمولاً تا ۷۲ ساعت طول می‌کشد. برای پیگیری با برگزارکننده تماس بگیرید.',
      };
    case 'mismatch':
      return {
        tone: 'bad', showDetails: true,
        title: 'پرداخت شما تأیید نشد',
        body: 'مبلغ پرداخت‌شده با مبلغ ثبت‌نام هم‌خوانی نداشت. اگر مبلغی از حساب شما کم شده، بازگردانده می‌شود. لطفاً با پشتیبانی تماس بگیرید.',
      };
    case 'failed':
      return {
        tone: 'bad', showDetails: true,
        title: 'پرداخت ناموفق بود',
        body: 'بانک پرداخت را تأیید نکرد. اگر مبلغی کم شده باشد، طبق روال بانک تا ۷۲ ساعت برمی‌گردد. می‌توانید دوباره تلاش کنید.',
      };
    default:
      return {
        tone: 'bad', showDetails: false,
        title: 'اطلاعات پرداخت ناقص است',
        body: 'نشانی بازگشت معتبر نبود. اگر مبلغی از حساب شما کم شده، از بخش «مسابقات من» وضعیت ثبت‌نامتان را ببینید.',
      };
  }
}

const TONE = {
  ok:   { color: '#15803D', bg: 'rgba(48,197,90,0.10)',  border: 'rgba(48,197,90,0.30)',  Icon: CheckCircle2 },
  warn: { color: '#B45309', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', Icon: Clock },
  bad:  { color: '#B91C1C', bg: 'rgba(239,68,68,0.09)',  border: 'rgba(239,68,68,0.28)',  Icon: XCircle },
} as const;

interface MyReg {
  id: string;
  tournamentId: string;
  tournamentTitle?: string;
  status: string;
  paymentStatus: string;
  amount: number;
  refId?: string | null;
}

function ResultBody() {
  const params = useSearchParams();
  const state = params.get('state') ?? '';
  const regId = params.get('r') ?? '';
  const v = viewOf(state);
  const tone = TONE[v.tone];

  /* جزئیات از سرور خوانده می‌شود، نه از پارامترهای نشانی — هرکسی
     می‌تواند `?state=ok` را دستی تایپ کند و رسیدِ جعلی ببیند. */
  const [reg, setReg] = useState<MyReg | null>(null);
  const [loading, setLoading] = useState(!!regId);

  useEffect(() => {
    if (!regId) return;
    let alive = true;
    void (async () => {
      try {
        const r = await apiFetch('/api/tournaments/my', { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json().catch(() => null) as { registrations?: MyReg[] } | null;
        const found = (j?.registrations ?? []).find(x => x.id === regId) ?? null;
        if (alive) setReg(found);
      } catch { /* بی‌صدا — نبودِ جزئیات نباید پیامِ اصلی را خراب کند */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [regId]);

  const Icon = tone.Icon;
  const fa = (n: number) => n.toLocaleString('fa-IR');

  return (
    <div dir="rtl" style={{
      minHeight: '80vh', background: '#F7F7F5', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
      fontFamily: 'Vazirmatn, Tahoma, sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: 'clamp(28px,5vw,42px)',
        maxWidth: 460, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: tone.bg, border: `2px solid ${tone.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Icon size={32} color={tone.color} />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 900, color: INK, margin: '0 0 12px', lineHeight: 1.6 }}>
          {v.title}
        </h1>
        <p style={{ fontSize: 14, color: MUT, margin: '0 0 24px', lineHeight: 2.1 }}>
          {v.body}
        </p>

        {v.showDetails && loading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Loader2 size={18} color={GOLD} style={{ animation: 'spin 0.9s linear infinite' }} />
          </div>
        )}

        {v.showDetails && reg && (
          <div style={{
            textAlign: 'right', background: '#FAFAF8', borderRadius: 16,
            padding: '14px 18px', marginBottom: 22,
            border: '1px solid rgba(0,0,0,0.05)',
          }}>
            {[
              ['مسابقه', reg.tournamentTitle ?? '—'],
              ['مبلغ', `${fa(reg.amount)} تومان`],
              ['کد پیگیری', reg.refId ?? '—'],
            ].map(([k, val]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', gap: 12,
                fontSize: 13, padding: '7px 0',
              }}>
                <span style={{ color: MUT }}>{k}</span>
                <span style={{ fontWeight: 700, color: INK, overflowWrap: 'anywhere' }}>{val}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {reg?.tournamentId && (
            <Link href={`/tournaments/${reg.tournamentId}`} style={btn(true)}>
              صفحه‌ی مسابقه
            </Link>
          )}
          <Link href="/dashboard" style={btn(!reg?.tournamentId)}>
            مسابقات من
          </Link>
          <Link href="/tournaments" style={btn(false)}>
            همه‌ی مسابقات
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function btn(primary: boolean): React.CSSProperties {
  return {
    padding: '11px 20px', borderRadius: 12, textDecoration: 'none',
    fontSize: 13.5, fontWeight: 800,
    background: primary ? 'rgba(199,166,106,0.12)' : 'rgba(0,0,0,0.04)',
    border: `1px solid ${primary ? 'rgba(199,166,106,0.34)' : 'rgba(0,0,0,0.10)'}`,
    color: primary ? GOLD_D : '#555',
  };
}

/* `useSearchParams` مرزِ Suspense می‌خواهد وگرنه کلِ صفحه در بیلد
   به رندرِ پویا می‌افتد. */
export default function TournamentResultPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', background: '#F7F7F5', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={22} color={GOLD} style={{ animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ResultBody />
    </Suspense>
  );
}
