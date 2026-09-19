'use client'

/* ─────────────────────────────────────────────────────────────
   دروازه‌ی بارگذاریِ پنل‌های پروفایل.

   ── چرا وجود دارد ──
   هر پنل نقش (تولیدکننده، فروشگاه، بازیکن، خدمات فنی، مربی) اول
   نسخه‌ی مرورگر را در فرم می‌نشاند و بعد، وقتی پاسخِ سرور رسید،
   `setForm` می‌زند. هرچه کاربر در آن فاصله وارد کرده باشد بی‌صدا
   پاک می‌شود. روی شبکه‌ی کند این یعنی «دو محصول ثبت کردم، فقط
   آخری ماند» — همان چیزی که مالک گزارش کرد.

   راه‌حل حذفِ خودِ مسابقه است: تا وقتی پایه‌ی داده نرسیده، فرم باز
   نمی‌شود. این دو نما همان حالت‌اند، یک‌بار — پنج کپی یعنی پنج
   نسخه که از فردا از هم دور می‌شوند.
   ───────────────────────────────────────────────────────────── */

const SHELL: React.CSSProperties = {
  direction: 'rtl',
  fontFamily: "'Vazirmatn',Tahoma,sans-serif",
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
}

export function ProfileLoadSpinner({ bg = '#F7F5F0' }: { bg?: string }) {
  return (
    <div style={{ ...SHELL, background: bg }} role="status" aria-live="polite">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '2px solid rgba(199,166,106,0.28)', borderTopColor: '#C7A66A',
          animation: 'plgSpin .8s linear infinite',
        }} />
        <span style={{ fontSize: 13, color: 'rgba(17,17,16,0.42)' }}>در حال خواندن پروفایل…</span>
      </div>
      <style>{'@keyframes plgSpin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

export function ProfileLoadError({ onRetry, bg = '#F7F5F0' }: { onRetry: () => void; bg?: string }) {
  return (
    <div style={{ ...SHELL, background: bg, textAlign: 'center' }} role="alert">
      <div style={{ maxWidth: 420 }}>
        <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111110' }}>پروفایل خوانده نشد</h1>
        <p style={{ fontSize: 13, lineHeight: 2, color: 'rgba(17,17,16,0.52)', marginTop: 8 }}>
          ارتباط با سرور برقرار نشد. تا وقتی نسخه‌ی ثبت‌شده خوانده نشود فرم باز نمی‌شود،
          وگرنه ذخیره‌ی بعدی می‌تواند اطلاعات قبلی را پاک کند.
        </p>
        <button
          type="button" onClick={onRetry}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            marginTop: 14, padding: '11px 22px', borderRadius: 10, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: '#8F6531',
          }}
        >
          تلاش دوباره
        </button>
      </div>
    </div>
  )
}
