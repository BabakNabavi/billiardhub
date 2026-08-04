'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SkipForward, ExternalLink } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   تبلیغِ پیش‌پخش — لایه‌ای روی پلیرِ موجود.

   ── قاعده‌ی اولِ این کامپوننت ──
   ویدیوی اصلی هرگز نباید به‌خاطرِ تبلیغ نپخشد. هر خطا، هر تأخیر، هر
   پاسخِ ناقص یعنی «مستقیم برو به ویدیوی اصلی». به همین دلیل هیچ‌جای
   این فایل چیزی را بلاک نمی‌کند و همه‌ی مسیرهای شکست به `finish()`
   می‌رسند.

   ── چرا تبلیغ در فایلِ اصلی merge نمی‌شود ──
   دو فایلِ جدا می‌مانند. با merge، عوض‌کردنِ تبلیغ یعنی رمزگذاریِ
   دوباره‌ی همه‌ی ویدیوها، آمارِ هر کمپین از بین می‌رود و کمپینِ تازه
   روی محتوای قدیمی نمی‌نشیند.

   ── شمارش ──
   نمایش وقتی ثبت می‌شود که تبلیغ *واقعاً شروع به پخش کرده* باشد، نه
   وقتی درخواستش رفته. «کنجکاوی» و «تماشا» یکی نیستند.
   ───────────────────────────────────────────────────────────── */

export interface PrerollAdData {
  campaignId: string
  title: string
  videoUrl: string
  clickUrl: string | null
  skipAfterSec: number | null
  maxDurationSec: number | null
}

const track = (campaignId: string, event: 'impression' | 'complete' | 'skip' | 'click') => {
  void fetch('/api/ads/preroll', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ campaignId, event }),
    keepalive: true,
  }).catch(() => { /* شمارش مهم‌تر از پخش نیست */ })
}

export default function PrerollAd({ ad, onFinish }: { ad: PrerollAdData; onFinish: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [elapsed, setElapsed] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const done = useRef(false)

  /* یک‌بار و فقط یک‌بار — هر مسیرِ پایان از این‌جا می‌گذرد */
  const finish = useCallback((why: 'complete' | 'skip') => {
    if (done.current) return
    done.current = true
    track(ad.campaignId, why)
    onFinish()
  }, [ad.campaignId, onFinish])

  /* ── شروعِ پخش ──

     `autoPlay` به‌تنهایی قابلِ اعتماد نیست: مرورگرها ویدیوی صدادار را
     بدونِ حرکتِ کاربر پخش نمی‌کنند، و حتی وقتی کاربر روی play زده،
     بعضی محیط‌ها (از جمله مرورگرِ بدونِ دستگاهِ صوتی) درخواست را رد
     می‌کنند. آزمون همین را نشان داد: تبلیغ روی صفحه بود ولی زمانش
     هیچ‌وقت جلو نمی‌رفت، پس دکمه‌ی «رد کردن» هرگز فعال نمی‌شد.

     پس صریح play می‌زنیم و اگر رد شد، بی‌صدا دوباره تلاش می‌کنیم.
     تبلیغِ بی‌صدا از تبلیغی که اصلاً پخش نمی‌شود بهتر است — و بیننده
     دستِ‌کم گیر نمی‌کند. */
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => finish('complete'))
    })
  }, [finish])

  /* تورِ ایمنی: اگر فایلِ تبلیغ خراب باشد یا هرگز شروع نشود، بعد از
     سقفِ مدت (به‌علاوه‌ی کمی مهلت) به‌هرحال می‌رویم سرِ ویدیوی اصلی.
     بدونِ این، یک تبلیغِ خرابْ صفحه را قفل می‌کند. */
  useEffect(() => {
    const cap = (ad.maxDurationSec ?? 30) + 5
    const t = setTimeout(() => finish('complete'), cap * 1000)
    return () => clearTimeout(t)
  }, [ad.maxDurationSec, finish])

  const onPlaying = () => {
    /* نمایش این‌جا ثبت می‌شود، نه در `useEffect`: تنها این‌جاست که
       مطمئنیم فریمی واقعاً روی صفحه رفته. */
    track(ad.campaignId, 'impression')
  }

  const onTime = () => {
    const v = ref.current
    if (!v) return
    setElapsed(v.currentTime)
    if (Number.isFinite(v.duration) && v.duration > 0) {
      setRemaining(Math.max(0, Math.ceil(v.duration - v.currentTime)))
    }
    /* سقفِ مدت را خودِ پلیر هم اعمال می‌کند — تبلیغِ بلندتر از آنچه
       جایگاه اجازه می‌دهد نباید وقتِ بیننده را بگیرد. */
    if (ad.maxDurationSec && v.currentTime >= ad.maxDurationSec) finish('complete')
  }

  const canSkip = ad.skipAfterSec !== null && elapsed >= ad.skipAfterSec
  const skipIn = ad.skipAfterSec !== null ? Math.max(0, Math.ceil(ad.skipAfterSec - elapsed)) : 0
  const fa = (n: number) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!)

  const openTarget = () => {
    if (!ad.clickUrl) return
    track(ad.campaignId, 'click')
    window.open(ad.clickUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
      <video
        ref={ref}
        src={ad.videoUrl}
        autoPlay
        playsInline
        preload="auto"
        onPlaying={onPlaying}
        onTimeUpdate={onTime}
        onEnded={() => finish('complete')}
        /* فایلِ خراب یا شبکه‌ی قطع ⇒ ویدیوی اصلی، نه صفحه‌ی گیرکرده */
        onError={() => finish('complete')}
        onStalled={() => { /* منتظر می‌مانیم؛ تورِ ایمنیِ بالا هست */ }}
        aria-label={`تبلیغ${ad.title ? ': ' + ad.title : ''}`}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }}
      />

      {/* برچسبِ «تبلیغ» — بیننده باید بداند این محتوای اصلی نیست */}
      <div style={{
        position: 'absolute', top: 12, insetInlineStart: 12, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 900, color: '#241B08', background: '#C7A66A',
          borderRadius: 5, padding: '3px 9px', letterSpacing: '0.02em',
        }}>تبلیغ</span>
        {remaining !== null && (
          <span style={{
            fontSize: 11.5, fontWeight: 700, color: '#fff', background: 'rgba(20,18,14,0.62)',
            borderRadius: 5, padding: '3px 9px', fontVariantNumeric: 'tabular-nums',
          }}>{fa(remaining)} ثانیه</span>
        )}
      </div>

      {/* مقصدِ تبلیغ */}
      {ad.clickUrl && (
        <button onClick={openTarget}
          style={{
            position: 'absolute', bottom: 14, insetInlineStart: 14,
            display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 15px',
            borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800,
            background: 'rgba(255,255,255,0.94)', border: 'none', color: '#1C1B17',
          }}>
          مشاهده <ExternalLink size={13} />
        </button>
      )}

      {/* رد کردن */}
      {ad.skipAfterSec !== null && (
        <button
          onClick={() => canSkip && finish('skip')}
          disabled={!canSkip}
          aria-live="polite"
          style={{
            position: 'absolute', bottom: 14, insetInlineEnd: 14,
            display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 15px',
            borderRadius: 10, cursor: canSkip ? 'pointer' : 'default',
            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800,
            background: canSkip ? 'rgba(255,255,255,0.94)' : 'rgba(20,18,14,0.58)',
            border: canSkip ? 'none' : '1px solid rgba(255,255,255,0.22)',
            color: canSkip ? '#1C1B17' : 'rgba(255,255,255,0.86)',
            transition: 'background .2s, color .2s',
          }}>
          {canSkip
            ? <>رد کردن تبلیغ <SkipForward size={13} /></>
            : <>رد کردن تا {fa(skipIn)} ثانیه</>}
        </button>
      )}
    </div>
  )
}
