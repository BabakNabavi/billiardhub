import Link from 'next/link'
import type { ReactNode } from 'react'
import { Mail, Phone, MapPin, ChevronDown, Megaphone, ArrowLeft } from 'lucide-react'
import { ContactForm } from '@/components/contact/ContactForm'
import { CopyEmailButton } from '@/components/contact/CopyEmailButton'
import '@/styles/reveal.css'

/* ─────────────────────────────────────────────────────────────
   تماس با ما — بازطراحیِ آبانِ ۱۴۰۵.

   به‌جای هیروی تیره و برچسب‌های انگلیسیِ نسخه‌ی قبل: سربرگِ روشن و
   جمع‌وجور، سه راهِ مستقیمِ ارتباط در اولین نما، بعد فرم کنارِ پاسخِ
   پرسش‌های پرتکرار (تا خیلی‌ها اصلاً لازم نباشد بنویسند).
   صفحه Server Component است؛ فقط فرم و دکمه‌ی کپی کلاینتی‌اند.
   حرکتِ ورود و ظاهرشدن با اسکرول از styles/reveal.css می‌آید (کلاس‌های ab-).
   ───────────────────────────────────────────────────────────── */

const EMAIL = 'info@billiardhub.net'
const PHONE = '۰۲۱-۲۲۸۵۹۵۵۱'
const PHONE_DIAL = '02122859551'
const ADDRESS = 'تهران، پاسداران، خیابان شهید محمود گل نبی، پلاک ۳۶'
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`

const FAQ = [
  {
    q: 'پاسخ پیام من کجا می‌آید؟',
    a: <>هر پیام یک تیکت می‌سازد؛ اگر هنگام ارسال وارد حساب باشید پاسخ در بخش <Link href="/support" className="font-bold text-gold-text underline-offset-4 hover:underline">تیکت‌های من</Link> ثبت می‌شود و در غیر این صورت از راه ایمیل یا شماره‌ای که نوشته‌اید پیگیری می‌شود</>,
  },
  {
    q: 'کد پستی یا اطلاعات بانکی‌ام قفل شده، چطور تغییرش بدهم؟',
    a: <>این دو بعد از استعلام قفل می‌شوند؛ در فرم همین صفحه موضوع «درخواست تغییر کد پستی» یا «درخواست ویرایش اطلاعات بانکی» را انتخاب کنید</>,
  },
  {
    q: 'برای تبلیغات در سایت با چه کسی صحبت کنم؟',
    a: <>جایگاه‌های تبلیغاتی و تعرفه‌ها در صفحه <Link href="/advertise" className="font-bold text-gold-text underline-offset-4 hover:underline">تبلیغات</Link> است و درخواست از همان‌جا ثبت می‌شود</>,
  },
  {
    q: 'چطور باشگاه یا پروفایل حرفه‌ای‌ام را ثبت کنم؟',
    a: <><Link href="/register" className="font-bold text-gold-text underline-offset-4 hover:underline">حساب بسازید</Link> و از داشبورد، پروفایل باشگاه، مربی، داور یا فروشگاه خود را بسازید تا بعد از بررسی منتشر شود</>,
  },
]

const WRAP = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'
const CARD = 'flex flex-col gap-4 rounded-panel bg-surface p-6 shadow-e1'
const LINK = 'inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-body font-bold text-gold-text transition-colors duration-base hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep'

function ChannelIcon({ children }: { children: ReactNode }) {
  return <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-card bg-gold/[.12] text-gold-text">{children}</span>
}

export default function ContactPage() {
  return (
    <div className="overflow-x-clip bg-paper text-ink">
      {/* ═══ سربرگ + سه راهِ ارتباط ═══ */}
      <section className={`${WRAP} pb-12 pt-8 lg:pb-16 lg:pt-16`}>
        <div className="ab-in flex max-w-3xl flex-col gap-4">
          <p className="text-body font-bold text-gold-text">تماس با ما</p>
          <h1 className="text-display">
            با ما در ارتباط باشید
            <span className="block text-ink-2">هر پیام به دست تیم ما می‌رسد</span>
          </h1>
        </div>

        <ul className="mt-8 grid gap-4 md:grid-cols-3 lg:mt-12">
          <li className={`ab-reveal ${CARD}`}>
            <ChannelIcon><Mail size={24} /></ChannelIcon>
            <div className="flex flex-col gap-1">
              <h2 className="text-section">ایمیل</h2>
              <a href={`mailto:${EMAIL}`} dir="ltr" className="self-start rounded-field text-body text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">{EMAIL}</a>
            </div>
            <div className="-ms-3 mt-auto"><CopyEmailButton email={EMAIL} /></div>
          </li>
          <li className={`ab-reveal ${CARD}`}>
            <ChannelIcon><Phone size={24} /></ChannelIcon>
            <div className="flex flex-col gap-1">
              <h2 className="text-section">تلفن</h2>
              <span dir="ltr" className="self-start text-body text-ink-2">{PHONE}</span>
            </div>
            <a href={`tel:${PHONE_DIAL}`} className={`${LINK} -ms-3 mt-auto self-start`}>تماس مستقیم</a>
          </li>
          <li className={`ab-reveal ${CARD}`}>
            <ChannelIcon><MapPin size={24} /></ChannelIcon>
            <div className="flex flex-col gap-1">
              <h2 className="text-section">دفتر</h2>
              <address className="text-body not-italic text-ink-2">{ADDRESS}</address>
            </div>
            <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className={`${LINK} -ms-3 mt-auto self-start`}>مسیریابی در نقشه<span className="sr-only"> (در پنجره جدید)</span></a>
          </li>
        </ul>
      </section>

      {/* ═══ فرم + پرسش‌های پرتکرار ═══ */}
      <section className="bg-mist py-12 lg:py-24">
        <div className={`${WRAP} grid gap-8 lg:grid-cols-12 lg:gap-12`}>
          <div className="ab-reveal rounded-hero bg-surface p-6 shadow-e2 sm:p-8 lg:col-span-7 lg:p-12">
            <h2 className="text-display">پیام بگذارید</h2>
            <p className="mb-8 mt-2 text-body text-ink-2">برای دیدن پاسخ در تیکت‌های من، پیش از ارسال وارد حساب شوید</p>
            <ContactForm />
          </div>

          <aside className="flex flex-col gap-6 lg:col-span-5" aria-labelledby="ct-faq">
            <h2 id="ct-faq" className="ab-reveal text-section">پیش از نوشتن، شاید جوابتان اینجا باشد</h2>
            <div className="flex flex-col gap-3">
              {FAQ.map(item => (
                <details key={item.q} className="ab-reveal group rounded-panel bg-surface shadow-e0 open:shadow-e1">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-panel px-6 py-4 text-body font-bold text-ink transition-colors duration-base hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown size={18} aria-hidden className="shrink-0 text-ink-2 transition-transform duration-base group-open:rotate-180" />
                  </summary>
                  <p className="px-6 pb-6 text-body text-ink-2">{item.a}</p>
                </details>
              ))}
            </div>

            <div className="ab-reveal mt-2">
            <Link href="/advertise" prefetch={false}
              className="ab-card group flex items-center gap-4 rounded-panel bg-ink p-6 text-surface shadow-e2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-mist">
              <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-gold/20 text-gold-light"><Megaphone size={24} /></span>
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-section">تبلیغات در بیلیارد هاب</span>
                <span className="text-body text-surface/70">جایگاه‌ها، تعرفه و ثبت درخواست</span>
              </span>
              <ArrowLeft size={20} aria-hidden className="shrink-0 text-gold-light transition-transform duration-base group-hover:-translate-x-1" />
            </Link>
            </div>

            <Link href="/about" prefetch={false} className={`${LINK} ab-reveal -ms-3 self-start`}>
              بیشتر درباره بیلیارد هاب بدانید <ArrowLeft size={16} aria-hidden />
            </Link>
          </aside>
        </div>
      </section>
    </div>
  )
}
