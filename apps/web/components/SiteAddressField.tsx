'use client';

/* ─────────────────────────────────────────────────────────────
   «آدرس اختصاصی سایت شما» — منبعِ واحد

   تا امروز سه نسخه‌ی جداگانه از این فیلد وجود داشت (ثبتِ باشگاه،
   داشبوردِ مربی، داشبوردِ داور) و پنلِ مدیریتِ باشگاه اصلاً نداشت —
   یعنی باشگاه‌دار پس از ثبت، دیگر راهی برای دیدن یا عوض‌کردنِ نشانیِ
   صفحه‌اش نداشت.

   نکته‌ی اصلیِ طراحی: کاربر باید *همان لحظه‌ی تایپِ هر حرف* نشانیِ
   نهایی را کامل — با `.net` — ببیند. نسخه‌های قبلی یا پیشوند را جدا و
   کم‌رنگ کنارِ فیلد می‌گذاشتند یا فقط `www.billiardhub.net/...` را با سه
   نقطه نشان می‌دادند؛ در هر دو حالت کاربر نمی‌فهمید نشانیِ واقعی چه
   می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react';
import { persianToSlug, isValidSlug } from '@/lib/slug';

const GOLD = '#C7A66A';
const GOLD_D = '#9A6E38';
const OK = '#0E7A38';
const BAD = '#B23B2E';

export type SlugStatus = 'idle' | 'invalid' | 'checking' | 'ok' | 'taken';

export interface SiteAddressFieldProps {
  value: string;
  onChange: (v: string) => void;
  /** بخشِ ثابتِ مسیر — `clubs` ⇒ billiardhub.net/clubs/… */
  /* هر نقشی که صفحه‌ی عمومی دارد. `services` مسیرِ تکنسین است و
     `players`/`manufacturers` هم همین‌طور — تا امروز فقط باشگاه از
     این فیلد استفاده می‌کرد و بقیه با نامکِ خودکار می‌ماندند. */
  basePath: 'clubs' | 'coaches' | 'referees' | 'sellers' | 'services' | 'players' | 'manufacturers';
  /** نامِ فارسی که دکمه‌ی «پیشنهاد» از رویش نشانی می‌سازد */
  suggestFrom?: string;
  /** سازنده‌ی نشانیِ بررسیِ در‌دسترس‌بودن؛ باید `{ available: boolean }` برگرداند.
   *  نبودنش یعنی بررسی‌ای انجام نشود (برای موجودیت‌هایی که هنوز مسیرش را ندارند). */
  checkUrl?: (slug: string) => string;
  /** وضعیت به بیرون هم داده می‌شود تا فرم بتواند جلوی ذخیره‌ی نشانیِ تکراری را بگیرد */
  onStatusChange?: (s: SlugStatus) => void;
  required?: boolean;
  label?: string;
  error?: string;
}

export default function SiteAddressField({
  value, onChange, basePath, suggestFrom, checkUrl, onStatusChange,
  required = false, label = 'آدرس اختصاصی سایت شما', error,
}: SiteAddressFieldProps) {
  const [status, setStatus] = useState<SlugStatus>('idle');
  const [copied, setCopied] = useState(false);
  /* ── چرا هر دو تابع در ref می‌نشینند ──
     هر دو به‌صورتِ تابعِ درجا (`s => …`) از والد می‌آیند، پس در هر
     رندر شناسه‌ی تازه می‌گیرند. اگر در آرایه‌ی وابستگیِ افکت باشند،
     حلقه‌ی بی‌پایان می‌سازند:

       رندر → checkUrl تازه → افکت دوباره → setStatus('checking')
       → onStatusChange → setState در والد → رندر → …

     چیزی که کاربر می‌دید همین بود: «در حال بررسی…» و پیامِ سبز که
     بدونِ دست‌زدن به فیلد پشتِ سرِ هم روشن و خاموش می‌شدند، و یک
     درخواستِ slug-check در هر دور.

     ref مقدارِ تازه را نگه می‌دارد بدونِ آن‌که وابستگی باشد. */
  const statusRef = useRef(onStatusChange);
  statusRef.current = onStatusChange;
  const checkRef = useRef(checkUrl);
  checkRef.current = checkUrl;

  useEffect(() => { statusRef.current?.(status); }, [status]);

  /* ── بررسیِ در دسترس بودن ──
     با تأخیر، وگرنه هر حرفی که تایپ می‌شود یک درخواست می‌فرستد. */
  useEffect(() => {
    if (!value) { setStatus('idle'); return; }
    if (!isValidSlug(value)) { setStatus('invalid'); return; }
    if (!checkRef.current) { setStatus('ok'); return; }

    setStatus('checking');
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(checkRef.current!(value), { cache: 'no-store' });
        const j = await r.json() as { available?: boolean };
        if (alive) setStatus(j?.available ? 'ok' : 'taken');
      } catch {
        /* شبکه قطع ⇒ راه را نمی‌بندیم؛ سرور موقعِ ذخیره تصمیم می‌گیرد */
        if (alive) setStatus('idle');
      }
    }, 450);
    return () => { alive = false; clearTimeout(t); };
  }, [value]);

  const borderColor =
    status === 'ok' ? 'rgba(14,122,56,0.45)'
      : status === 'taken' || status === 'invalid' || error ? 'rgba(178,59,46,0.45)'
        : '#E5E7EB';

  const suggestion = suggestFrom ? persianToSlug(suggestFrom) : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
        {label}{required && <span style={{ color: BAD }}> *</span>}
      </label>

      <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
        <input
          type="text"
          value={value}
          dir="ltr"
          lang="en"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="url"
          placeholder="arta-club"
          aria-label={label}
          onChange={e => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60))}
          style={{
            flex: 1, minWidth: 0, boxSizing: 'border-box',
            border: `1px solid ${borderColor}`, borderRadius: 8, padding: '9px 12px',
            fontSize: 14, background: '#FAFAFA', color: '#1A1A18', outline: 'none',
            direction: 'ltr', textAlign: 'left',
            fontFamily: '"Courier New", Courier, monospace',
          }}
        />
        {suggestion && suggestion !== value && (
          <button
            type="button"
            onClick={() => onChange(suggestion)}
            style={{
              flexShrink: 0, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'var(--font-base)',
              background: 'rgba(199,166,106,0.12)', border: `1px solid ${GOLD}55`, color: GOLD_D,
            }}>
            پیشنهاد
          </button>
        )}
      </div>

      {/* ── پیش‌نمایشِ زنده ──
          همیشه دیده می‌شود، حتی وقتی فیلد خالی است: کاربر باید بداند
          چه چیزی دارد می‌سازد پیش از آنکه اولین حرف را بزند. */}
      <div style={{
        marginTop: 3, display: 'flex', alignItems: 'stretch', gap: 6,
      }}>
        <div className="bh-latin" style={{
          flex: 1, minWidth: 0, direction: 'ltr', textAlign: 'left',
          fontSize: 13, fontWeight: 700, lineHeight: 1.8,
          color: value ? '#1C1B17' : 'rgba(0,0,0,0.32)',
          background: value ? 'rgba(199,166,106,0.08)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${value ? 'rgba(199,166,106,0.22)' : 'rgba(0,0,0,0.07)'}`,
          borderRadius: 9, padding: '7px 11px', wordBreak: 'break-all',
          transition: 'background .15s, border-color .15s',
        }}>
          {/* بدونِ `www` — دامنه یکی شده و `www` با ۳۰۱ به همین‌جا
              می‌آید (`nginx-canonical.sh`). نشان‌دادنِ نشانیِ هدایت‌شونده
              یعنی کاربر لینکی را کپی کند که یک پرش اضافه دارد. */}
          billiardhub.net/{basePath}/
          <span style={{ color: value ? GOLD_D : 'inherit' }}>{value || '…'}</span>
        </div>
        {/* ── کپی ──
            نشانی برای این ساخته می‌شود که جایی فرستاده شود؛ بدونِ این
            دکمه کاربر باید متنِ سه‌تکه را دستی انتخاب می‌کرد.
            `navigator.clipboard` روی HTTP در دسترس نیست، پس فالبکِ
            انتخاب‌ومتنِ قدیمی هم هست. */}
        <button
          type="button" disabled={!value} aria-label="کپیِ نشانی"
          onClick={async () => {
            const url = `https://billiardhub.net/${basePath}/${value}`
            try { await navigator.clipboard.writeText(url) }
            catch {
              const ta = document.createElement('textarea')
              ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0'
              document.body.appendChild(ta); ta.select()
              try { document.execCommand('copy') } catch { /* مرورگر اجازه نداد */ }
              document.body.removeChild(ta)
            }
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1800)
          }}
          style={{
            flexShrink: 0, width: 40, borderRadius: 9, cursor: value ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 800,
            color: copied ? OK : GOLD_D,
            background: copied ? 'rgba(14,122,56,0.10)' : 'rgba(199,166,106,0.12)',
            border: `1px solid ${copied ? 'rgba(14,122,56,0.34)' : 'rgba(199,166,106,0.34)'}`,
            opacity: value ? 1 : 0.45,
            transition: 'background .15s, border-color .15s, color .15s',
          }}>
          {copied ? '✓' : 'کپی'}
        </button>
      </div>

      <div style={{ fontSize: 11.5, minHeight: 16, lineHeight: 1.9 }}>
        {error                     && <span style={{ color: BAD }}>{error}</span>}
        {!error && status === 'checking' && <span style={{ color: 'rgba(0,0,0,0.40)' }}>در حال بررسی…</span>}
        {!error && status === 'ok' && checkUrl && <span style={{ color: OK }}>✓ این نشانی در دسترس است</span>}
        {!error && status === 'taken'    && <span style={{ color: BAD }}>✗ این نشانی قبلاً رزرو شده — نامِ دیگری بگذارید</span>}
        {!error && status === 'invalid'  && <span style={{ color: BAD }}>فقط حروف انگلیسی کوچک، عدد و خط تیره — دستِ‌کم ۲ حرف</span>}
        {!error && status === 'idle' && !value && (
          <span style={{ color: 'rgba(0,0,0,0.35)' }}>نشانیِ کوتاهی که به‌جای شناسه‌ی بلند در نوار مرورگر دیده می‌شود</span>
        )}
      </div>
    </div>
  );
}
