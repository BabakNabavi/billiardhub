import Link from 'next/link'
import './auth.css'

/* ─────────────────────────────────────────────────────────────
   تکه‌های مشترکِ صفحه‌های ورود، ثبت‌نام و بازیابی — بی‌state، پس هم از
   صفحه‌ی کلاینت قابلِ استفاده‌اند و هم چیزی به باندل اضافه نمی‌کنند.
   ───────────────────────────────────────────────────────────── */

/* رکِ پانزده‌توپی: ۵ ردیف، شعاعِ ۱۰، فاصله‌ی مرکزها ۲۱ */
const BALLS = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: row + 1 }, (_, i) => ({ cx: 60 + (i - row / 2) * 21, cy: 14 + row * 18.4 })),
).flat()

function Rack({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 120 104" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M60 1 L119 103 L1 103 Z" strokeLinejoin="round" />
      {BALLS.map(b => <circle key={`${b.cx}-${b.cy}`} cx={b.cx} cy={b.cy + 3} r="9.4" />)}
    </svg>
  )
}

/** زمینه‌ی آرام: دو هاله‌ی طلایی و سبز و دو رکِ خطیِ کم‌رنگ */
export function AuthBackdrop() {
  return (
    <div className="au-bg" aria-hidden>
      <i className="au-blob a" />
      <i className="au-blob b" />
      <i className="au-blob c" />
      <Rack className="au-rack" />
      <Rack className="au-rack r2" />
    </div>
  )
}

/** نشانِ برند بالای کارت — پیوند به خانه */
export function AuthBrand() {
  return (
    <div className="au-brand">
      <Link href="/" aria-label="بیلیارد هاب، صفحه اصلی">
        {/* eslint-disable-next-line @next/next/no-img-element -- نشانِ ۲۵۶پیکسلیِ ثابت؛ next/image فقط لایه اضافه می‌کند */}
        <img src="/images/Logo/bh-mark-256-v12.webp" alt="" width={38} height={38} decoding="async" />
      </Link>
    </div>
  )
}

/** سوییچِ ورود و ثبت‌نام */
export function AuthTabs({ active }: { active: 'login' | 'register' }) {
  return (
    <nav className="au-tabs" aria-label="ورود یا ساخت حساب">
      <Link href="/login" aria-current={active === 'login' ? 'page' : undefined} replace>ورود</Link>
      <Link href="/register" aria-current={active === 'register' ? 'page' : undefined} replace>ساخت حساب</Link>
    </nav>
  )
}
