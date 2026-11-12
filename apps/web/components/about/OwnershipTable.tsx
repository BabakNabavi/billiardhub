import Link from 'next/link'
import { ArrowLeft, ArrowUpLeft } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   مالکیت — «جمله، جدولِ رانده به سمتِ پایان» (list: statement, table).

   جمله‌ی مالک همان متنی است که خودش داد. جدول فقط حقیقت‌های موجود را دارد:
   شرکتِ مالک، برند، وب‌سایتِ شرکت، دامنه‌ی پلتفرم، راهِ تماس — هیچ شماره‌ی
   ثبت، جایزه یا آمارِ ساختگی. دو نشانِ واقعی (بیلیارد هاب و آرتا) در
   ستون‌های شروع، هم‌ترازِ آخرین ردیف
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
      <div className="ab-grid ab-own-head">
        {/* جمله‌ی مالک، همان‌طور که خودش نوشت، خودش تیترِ بخش است */}
        <h2 id="ab-own-h" className="ab-display ab-own-h ab-rise">بیلیارد هاب متعلق به شرکت بازرگانی آرتا تجارت بین‌الملل آپادانا میباشد</h2>
      </div>
      <div className="ab-grid ab-own-body">
        <div className="ab-own-marks ab-rise" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- نشانِ ثابت */}
          <span className="ab-own-tile"><img src="/images/Logo/bh-tile-256-v13.webp" alt="" width={96} height={96} loading="lazy" decoding="async" /></span>
          {/* eslint-disable-next-line @next/next/no-img-element -- نشانِ ثابت */}
          <span className="ab-own-tile"><img src="/images/Logo/Arta.svg" alt="" width={96} height={96} loading="lazy" decoding="async" className="ab-own-arta" /></span>
        </div>
        <dl className="ab-own-table ab-rise">
          {ROWS.map(r => (
            <div key={r.k} className="ab-own-row">
              <dt>{r.k}</dt>
              <dd>
                {r.href ? (
                  r.ext ? (
                    <a href={r.href} target="_blank" rel="noopener noreferrer" className="ab-link">
                      <span dir="ltr">{r.v}</span><ArrowUpLeft size={16} aria-hidden /><span className="sr-only">(در پنجره جدید)</span>
                    </a>
                  ) : (
                    <Link href={r.href} prefetch={false} className="ab-link">
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
