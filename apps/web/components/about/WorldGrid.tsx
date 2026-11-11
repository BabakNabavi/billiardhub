import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   «دنیاهای بیلیارد هاب» — شبکه‌ی بنتو از بخش‌های واقعیِ پلتفرم.

   هر دنیا رنگِ یک توپِ اسنوکر را می‌گیرد: همان زبانِ رنگیِ نقش‌دار که
   مالک گفت «روح» سایت است. فقط مسیرهای باز؛ «بازیکنان» عمداً نیست
   (lib/nav-gates آن را بسته). هیچ آمار یا عددِ ساختگی.
   ───────────────────────────────────────────────────────────── */

type World = { href: string; title: string; desc: string; ball: string; span?: string }

const WORLDS: World[] = [
  {
    href: '/clubs', title: 'باشگاه‌ها و رزرو میز', ball: '#1B7A4B', span: 'lg:col-span-2',
    desc: 'باشگاه نزدیک خود را پیدا کنید، ساعت کاری و میزهایش را ببینید و میز را آنلاین رزرو کنید',
  },
  {
    href: '/coaches', title: 'مربیان و داوران', ball: '#3D63E6',
    desc: 'مربیان و داوران با سطح و سابقه؛ داور بدون بارگذاری مدرک داوری ثبت نمی‌شود و نشان تأیید فقط بعد از بررسی مدرک داده می‌شود',
  },
  {
    href: '/shop', title: 'بیلیارد بازار', ball: '#F06EAE',
    desc: 'خرید و فروش تجهیزات نو و دست دوم، از چوب و توپ تا میز',
  },
  {
    href: '/tournaments', title: 'مسابقات و رنکینگ', ball: '#E8B93A',
    desc: 'ثبت‌نام آنلاین در مسابقات و جایگاه بازیکنان در جدول رنکینگ',
  },
  {
    href: '/media', title: 'بیلیارد مدیا و پخش زنده', ball: '#A9613F',
    desc: 'ویدیوهای آموزشی، کانال باشگاه‌ها و مربیان و پخش زنده مسابقات',
  },
  {
    href: '/sellers', title: 'فروشگاه‌ها و تولیدکنندگان', ball: '#17150F', span: 'lg:col-span-2',
    desc: 'فروشگاه‌های تخصصی و تولیدکنندگان تجهیزات، هرکدام با صفحه، محصولات و راه ارتباط مستقیم',
  },
  {
    href: '/services', title: 'خدمات فنی', ball: '#C43D2E',
    desc: 'نصب، تعمیر و نگهداری میز و تجهیزات به دست متخصصان',
  },
]

export function WorldGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {WORLDS.map(w => (
        <li key={w.href} className={`ab-reveal ${w.span ?? ''}`}>
          <Link href={w.href} prefetch={false}
            className="ab-card group flex h-full flex-col gap-6 rounded-panel bg-surface p-6 shadow-e1 hover:shadow-e3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:p-8">
            <span aria-hidden className="ab-ball block h-12 w-12 rounded-full" style={{ ['--ball' as string]: w.ball }} />
            <span className="flex flex-1 flex-col gap-2">
              <h3 className="text-section text-ink">{w.title}</h3>
              <span className="text-body text-ink-2">{w.desc}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-body font-bold text-gold-text">
              ورود به بخش
              <ArrowLeft size={16} aria-hidden className="transition-transform duration-base group-hover:-translate-x-1" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
