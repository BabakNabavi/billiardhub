'use client'

/* نتیجه‌ی بازگشت از درگاهِ خریدِ تبلیغ.
   این صفحه هیچ تصمیمی نمی‌گیرد — فقط نتیجه‌ای را که سرور پس از
   verify گرفته نشان می‌دهد. */

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

function Result() {
  const sp = useSearchParams()
  const ok = sp.get('ok') === '1'
  const reason = sp.get('reason') || ''

  return (
    <div dir="rtl" style={{
      fontFamily: 'var(--font-base)', maxWidth: 560, margin: '0 auto',
      padding: 'clamp(28px,6vw,64px) clamp(16px,4vw,28px)', minHeight: '62vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      {ok ? <CheckCircle2 size={54} style={{ color: FELT }} /> : <XCircle size={54} style={{ color: RED }} />}

      <h1 style={{ fontSize: 20, fontWeight: 900, color: INK, margin: '18px 0 10px' }}>
        {ok ? 'پرداخت با موفقیت انجام شد' : 'پرداخت انجام نشد'}
      </h1>

      <p style={{ fontSize: 13.5, color: SEC, lineHeight: 2.1, margin: '0 0 22px' }}>
        {ok
          ? 'تبلیغِ شما ثبت شد و برای بررسی به تیمِ ما رفت. پس از تأیید، مدتی که خریده‌اید از همان لحظه شروع می‌شود و کمپین روی سایت نمایش داده خواهد شد.'
          : (reason || 'اگر مبلغی از حسابِ شما کم شده باشد، طیِ چند روزِ کاری به‌صورت خودکار برمی‌گردد.')}
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/advertise/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
          background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
          color: GOLD_D, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800,
        }}>
          تبلیغاتِ من <ArrowLeft size={14} />
        </Link>
        <Link href="/advertise" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
          border: `1px solid ${LINE}`, color: SEC, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800,
        }}>
          بازگشت به صفحه‌ی تبلیغات
        </Link>
      </div>

      <p style={{ fontSize: 11.5, color: MUT, marginTop: 20 }}>
        در صورتِ هر ابهامی در پرداخت، با پشتیبانی تماس بگیرید.
      </p>
    </div>
  )
}

export default function Page() {
  return <Suspense fallback={null}><Result /></Suspense>
}
