import Link from 'next/link'
import { buttonClasses } from '@/components/ui/button-classes'

/* ─────────────────────────────────────────────────────────────
   پایان — یک ردیف: دعوت در سمتِ شروع، راه‌ها در سمتِ پایان، هم‌کفِ هم.
   ایمیل و شهر همان‌هایی‌اند که فوترِ سایت نشان می‌دهد
   ───────────────────────────────────────────────────────────── */

export function ClosingBand() {
  return (
    <section className="ab-close" aria-labelledby="ab-close-h">
      <div className="ab-grid">
        <div className="ab-close-text ab-rise">
          <h2 id="ab-close-h" className="ab-display">جای شما در بیلیارد هاب است</h2>
          <p className="ab-lead">باشگاه دارید، مربی یا داورید، یا تجهیزات می‌سازید و می‌فروشید؟ پروفایل حرفه‌ای خودتان را بسازید</p>
        </div>
        <div className="ab-close-links ab-rise">
          <div className="flex flex-wrap gap-3">
            <Link href="/register" prefetch={false} className={buttonClasses({ size: 'lg' })}>ساخت حساب</Link>
            <Link href="/contact" prefetch={false} className={buttonClasses({ variant: 'secondary', size: 'lg' })}>تماس با ما</Link>
          </div>
          <p className="ab-close-meta">تهران · <a href="mailto:info@billiardhub.net" dir="ltr" className="ab-link">info@billiardhub.net</a></p>
        </div>
      </div>
    </section>
  )
}
