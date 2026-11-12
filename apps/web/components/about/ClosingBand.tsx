import Link from 'next/link'
import { buttonClasses } from '@/components/ui/button-classes'
import { IMG } from './imagery'
import { Photo } from './Photo'

/* ─────────────────────────────────────────────────────────────
   پایان — نوارِ سینماییِ تمام‌عرض: میز زیرِ چراغ، و دعوت روی همان صحنه.
   تیتر، جمله و دکمه‌ی اصلی پشتِ سرِ هم در ترتیبِ خواندن؛ راهِ تماس در فوترِ
   سایت هست، پس این‌جا تکرار نمی‌شود
   ───────────────────────────────────────────────────────────── */

export function ClosingBand() {
  return (
    <section className="ab-close" aria-labelledby="ab-close-h">
      <div className="ab-close-media" aria-hidden>
        <Photo img={IMG.hero} sizes="100vw" alt="" />
      </div>
      <div className="ab-close-in ab-rise">
        <h2 id="ab-close-h" className="ab-close-h">جای شما در بیلیارد هاب است</h2>
        <p className="ab-close-lead">باشگاه دارید، مربی یا داورید، یا تجهیزات می‌سازید و می‌فروشید؟ پروفایل حرفه‌ای خودتان را بسازید</p>
        <div className="ab-close-actions">
          <Link href="/register" prefetch={false} className={buttonClasses({ size: 'lg', className: 'ab-on-dark-felt' })}>ساخت حساب</Link>
          <Link href="/contact" prefetch={false} className={buttonClasses({ variant: 'ghost', size: 'lg', className: 'ab-on-dark-ghost' })}>تماس با ما</Link>
        </div>
      </div>
    </section>
  )
}
