import Link from 'next/link'
import { ArrowLeft, ArrowUpLeft } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   مالکیت — یک نوارِ تمام‌عرضِ زمردی، تایپوگرافیک.

   جمله‌ی مالک به اندازه‌ی تیتر، دو نشانِ واقعی (بیلیارد هاب و آرتا) کنارِ هم
   به‌صورتِ یک قفلِ کوچک — بی کارت، بی خطِ پیوند. فهرستِ حقیقت‌ها فقط آن‌چه
   واقعاً هست: شرکت، برند، وب‌سایتِ شرکت، دامنه، راهِ تماس — هیچ شماره‌ی ثبت،
   جایزه یا آمارِ ساختگی
   ───────────────────────────────────────────────────────────── */

const ROWS: Array<{ k: string; v: string; href?: string; ext?: boolean; ltr?: boolean }> = [
  { k: 'مالک', v: 'شرکت بازرگانی آرتا تجارت بین‌الملل آپادانا' },
  { k: 'برند', v: 'بیلیارد هاب، برند ثبت‌شده این شرکت' },
  { k: 'وب‌سایت شرکت', v: 'www.artaintl.com', href: 'https://www.artaintl.com', ext: true, ltr: true },
  { k: 'پلتفرم', v: 'billiardhub.net', href: '/', ltr: true },
  { k: 'ارتباط', v: 'صفحه تماس با ما', href: '/contact' },
]

export function OwnershipTable() {
  return (
    <section className="ab-own" aria-labelledby="ab-own-h">
      <div className="ab-grid ab-own-in">
        <div className="ab-own-lock ab-rise" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- نشانِ ثابت */}
          <img src="/images/Logo/bh-tile-256-v13.webp" alt="" width={56} height={56} loading="lazy" decoding="async" className="ab-own-bh" />
          {/* eslint-disable-next-line @next/next/no-img-element -- نشانِ ثابت */}
          <img src="/images/Logo/Arta.svg" alt="" width={56} height={56} loading="lazy" decoding="async" className="ab-own-arta" />
        </div>
        {/* جمله‌ی مالک، با نگارشی که خودش در بریفِ آبانِ ۱۴۰۵ داد (می‌باشد با نیم‌فاصله) */}
        <h2 id="ab-own-h" className="ab-own-h ab-rise">بیلیارد هاب متعلق به شرکت بازرگانی آرتا تجارت بین‌الملل آپادانا می‌باشد</h2>
        <dl className="ab-own-table ab-rise">
          {ROWS.map(r => (
            <div key={r.k} className="ab-own-row">
              <dt>{r.k}</dt>
              <dd>
                {r.href ? (
                  r.ext ? (
                    <a href={r.href} target="_blank" rel="noopener noreferrer" className="ab-link ab-link-inv">
                      <span dir="ltr">{r.v}</span><ArrowUpLeft size={16} aria-hidden /><span className="sr-only">(در پنجره جدید)</span>
                    </a>
                  ) : (
                    <Link href={r.href} prefetch={false} className="ab-link ab-link-inv">
                      <span dir={r.ltr ? 'ltr' : undefined}>{r.v}</span><ArrowLeft size={16} aria-hidden />
                    </Link>
                  )
                ) : r.v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
