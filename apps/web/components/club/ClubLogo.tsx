/* ─────────────────────────────────────────────────────────────
   لوگوی باشگاه — با نشانِ پیش‌فرض وقتی لوگویی آپلود نشده.

   پیش‌تر جای لوگو حرفِ اولِ نامِ باشگاه نوشته می‌شد. مشکلش فقط زیبایی
   نبود: باشگاه‌هایی که نامشان با یک حرف شروع می‌شود («باشگاه ...»)
   همه یک شکل می‌شدند، و حرفِ تنها در دایره بیشتر شبیه آواتارِ کاربر
   بود تا نشانِ یک مکان.

   نشانِ پیش‌فرض یک توپِ بیلیارد با شماره‌ی هشت است — شناخته‌شده‌ترین
   نمادِ این ورزش، که در هر اندازه‌ای خوانا می‌ماند چون SVG است و به
   فونت وابسته نیست.
   ───────────────────────────────────────────────────────────── */

const GOLD = '#C7A66A'

export default function ClubLogo({ src, name, size = 62, rounded = '50%', tone = 'light' }: {
  /** نشانیِ لوگوی آپلودشده؛ اگر نبود نشانِ پیش‌فرض می‌آید */
  src?: string | null
  name?: string
  size?: number
  /** شعاعِ گوشه — دایره برای آواتار، مقدارِ دیگر برای کارت */
  rounded?: string | number
  /** روی پس‌زمینه‌ی تیره یا روشن می‌نشیند */
  tone?: 'light' | 'dark'
}) {
  const wrap: React.CSSProperties = {
    width: size, height: size, borderRadius: rounded, overflow: 'hidden', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  if (src) {
    return (
      <span style={wrap}>
        <img src={src} alt={name ?? 'باشگاه'} loading="lazy" decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </span>
    )
  }

  /* شماره‌ی هشت با دو دایره کشیده می‌شود نه با متن: متن به فونت وابسته
     است و اگر فونت دیر برسد، لحظه‌ای با شکلِ دیگری دیده می‌شود. */
  const ink = tone === 'dark' ? '#0E0C0A' : '#141210'
  const bg = tone === 'dark' ? 'rgba(199,166,106,0.16)' : 'rgba(199,166,106,0.14)'

  return (
    <span style={{ ...wrap, background: bg }} aria-label={name ?? 'باشگاه'} role="img">
      {/* بدونِ <defs>/gradient: در فهرستِ باشگاه‌ها ده‌ها نسخه از این
          نشان کنارِ هم می‌آید و idهای تکراری در یک صفحه نامعتبرند.
          حجم با دو دایره‌ی هم‌مرکز و یک برقِ گوشه ساخته می‌شود. */}
      <svg viewBox="0 0 48 48" width="62%" height="62%" fill="none" aria-hidden>
        {/* توپ */}
        <circle cx="24" cy="24" r="21" fill={ink} />
        {/* هاله‌ی روشنِ بالا-چپ، جای گرادیانِ شعاعی */}
        <circle cx="19" cy="19" r="15" fill="#fff" opacity="0.10" />
        {/* برقِ بالا-چپ — همان چیزی که توپ را گرد نشان می‌دهد */}
        <ellipse cx="16" cy="14" rx="6.2" ry="4.2" fill="#fff" opacity="0.22" transform="rotate(-24 16 14)" />
        {/* قابِ سفیدِ شماره */}
        <circle cx="24" cy="24" r="10.5" fill="#F7F5F0" />
        {/* هشت — دو حلقه، بدونِ وابستگی به فونت */}
        <circle cx="24" cy="20.4" r="3.5" stroke={ink} strokeWidth="2.1" />
        <circle cx="24" cy="27.4" r="4.3" stroke={ink} strokeWidth="2.1" />
        {/* لبه‌ی طلایی — پیوند با هویتِ رنگیِ سایت */}
        <circle cx="24" cy="24" r="21" stroke={GOLD} strokeWidth="1.6" opacity="0.5" />
      </svg>
    </span>
  )
}
