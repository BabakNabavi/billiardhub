/* ─────────────────────────────────────────────────────────────
   آواتار کارت فهرست — یک قاب برای مربی و داور.

   ── چرا مشترک ──
   این قاب دو بار، حرف‌به‌حرف، در `app/coaches/page.tsx` و
   `app/referees/page.tsx` کپی شده بود؛ تنها فرقشان نام پراپ بود.
   حالت بدون عکس هم در هر دو یک سایه‌ی خاکستری هاردکد بود که با
   نشان هیروی پروفایل (`RoleGlyph`) فرق داشت — یعنی یک نفر در دو
   صفحه‌ی سایت دو جای‌گزین متفاوت می‌گرفت.

   ⚠️ `size` می‌تواند درصد باشد (`"58%"`): کارت شبکه‌ای اندازه‌اش را
   نسبت به عرض خودش می‌دهد و کارت فهرستی پیکسل ثابت.
   ───────────────────────────────────────────────────────────── */

import RoleGlyph, { type RoleGlyphKind } from './RoleGlyph'

const GOLD_D = '#8F6531'

export default function RoleAvatar({ kind, photo, name, size }: {
  kind: RoleGlyphKind
  /** نبودنش یعنی نشان نقش نشان داده شود */
  photo?: string
  name: string
  size: string
}) {
  return (
    <div
      className="cavatar"
      style={{ width: size, aspectRatio: '1 / 1', borderRadius: '50%', padding: '3px', flexShrink: 0,
        background: 'linear-gradient(150deg,#FFFDF8,#EBDFC6)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex' }}>
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
        border: '2.5px solid #FFFFFF', background: '#E7ECF1',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photo ? (
          <img loading="lazy" decoding="async" src={photo} alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(150deg,rgba(199,166,106,0.16),rgba(255,255,255,0.55))', color: GOLD_D }}>
            <RoleGlyph kind={kind} size="58%" />
          </div>
        )}
      </div>
    </div>
  )
}
