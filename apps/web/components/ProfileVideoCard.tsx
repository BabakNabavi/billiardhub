/* ─────────────────────────────────────────────────────────────
   کارتِ ویدیوی پروفایل — مربی و داور، یک شکل.

   ── چرا یک کامپوننت ──
   دو صفحه‌ی عمومی همین کارت را عیناً تکرار کرده بودند. وقتی آپلودِ
   واقعیِ ویدیو اضافه شد، فقط یکی‌شان به‌روز شد و صفحه‌ی داور تا
   امروز دکمه‌ی پخشِ تزئینی داشت: تصویری با مثلثِ سفید که هیچ کاری
   نمی‌کرد.

   ── دو حالت ──
   ردیفِ تازه نشانیِ فایل دارد و واقعاً پخش می‌شود. ردیفِ قدیمی فقط
   بندانگشتی دارد؛ همان تصویر می‌ماند، ولی دیگر مثلثِ پخش نمی‌گیرد —
   دکمه‌ای که کاری نمی‌کند بدتر از نبودنش است.
   ───────────────────────────────────────────────────────────── */

export interface ProfileVideo {
  id: string
  url?: string
  thumbnail: string
  title: string
  duration: string
}

export default function ProfileVideoCard({ v }: { v: ProfileVideo }) {
  const caption = (v.title || v.duration) && (
    <div style={{ padding: '7px 9px 9px' }}>
      {v.title && (
        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.5, color: '#1C1C1A' }}>{v.title}</div>
      )}
      {v.duration && (
        <div style={{ fontSize: 11, color: 'rgba(17,17,16,0.55)', marginTop: 2 }} dir="ltr">{v.duration}</div>
      )}
    </div>
  )

  /* ── چرا کارتِ قابلِ پخش کلاسِ gcard نمی‌گیرد ──
  آن کلاس `cursor:pointer` و `:hover{transform:scale(1.03)}` دارد.
  روی کارتی که `<video controls>` دارد یعنی نوارِ زمان زیرِ انگشت
  تکان می‌خورد و با بیرون‌رفتنِ نشانگر برمی‌گردد. */
  if (v.url) {
    return (
      <div style={{ background: 'rgba(17,17,16,0.05)', borderRadius: 14, overflow: 'hidden' }}>
        {/* عنوان زیرِ ویدیو می‌نشیند نه رویش: روی ویدیو، نوارِ کنترلِ
            مرورگر را می‌پوشاند و دقیقاً همان‌جاست که انگشت می‌رود. */}
        <video
          controls playsInline preload="none"
          poster={v.thumbnail || undefined}
          aria-label={v.title ? `پخش ویدیو: ${v.title}` : 'پخش ویدیو'}
          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', background: '#000' }}
        >
          <source src={v.url} />
        </video>
        {caption}
      </div>
    )
  }

  return (
    <div className="gcard" style={{ aspectRatio: '16/9', background: 'rgba(17,17,16,0.05)', position: 'relative', overflow: 'hidden' }}>
      {/* `src=""` صفحه را دوباره درخواست می‌کند؛ استخراجِ فریم بهترین‌تلاش
          است و می‌تواند خالی برگردد. */}
      {v.thumbnail && (
        <img loading="lazy" decoding="async" src={v.thumbnail} alt={v.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      )}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 55%)',
      }} />
      <div style={{ position: 'absolute', bottom: 10, right: 10, left: 10, color: '#fff', pointerEvents: 'none' }}>
        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>{v.title}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', marginTop: 2 }} dir="ltr">{v.duration}</div>
      </div>
    </div>
  )
}
