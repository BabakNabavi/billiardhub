import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { isClosedSection } from '@/lib/nav-gates'

/* ─────────────────────────────────────────────────────────────
   اکوسیستمِ بیلیارد هاب — امضای صفحه‌ی درباره ما.

   هشت نقش یک شبکه‌اند نه هشت کارت: نمودار (تزئینی) نشان می‌دهد هر نقش به
   هاب و به کدام نقش‌های دیگر وصل است؛ فهرستِ کنارش (معنایی، با لینکِ واقعی)
   همان هشت را توضیح می‌دهد. نشانگر یا فوکوس روی هر ردیفِ فهرست، گره و
   پیوندهایش را در نمودار روشن می‌کند — با :has در about.css، بی جاوااسکریپت.
   پیوندها رابطه‌های واقعیِ همین صنعت‌اند (باشگاه با بازیکن و مربی، داور با مسابقه،
   فروشگاه با تولیدکننده و باشگاه، متخصصِ فنی با باشگاه) — نه ادعای قابلیت.
   «بازیکنان» بسته است (lib/nav-gates) پس به رنکینگ می‌رود
   ───────────────────────────────────────────────────────────── */

type Node = { k: string; name: string; href: string; desc: string }

const NODES: Node[] = [
  { k: 'clubs', name: 'باشگاه‌ها', href: '/clubs', desc: 'ساعت کاری، میزها و رزرو آنلاین میز' },
  { k: 'players', name: 'بازیکنان', href: '/players', desc: 'پروفایل، سابقه مسابقات و جایگاه در رنکینگ' },
  { k: 'coaches', name: 'مربیان', href: '/coaches', desc: 'مربیان با سطح و سابقه برای آموزش حرفه‌ای' },
  { k: 'referees', name: 'داوران', href: '/referees', desc: 'داوری که مدرکش بررسی شده، نه فقط ادعا' },
  { k: 'tournaments', name: 'مسابقات', href: '/tournaments', desc: 'ثبت‌نام آنلاین، جدول و نتایج' },
  { k: 'services', name: 'خدمات فنی', href: '/services', desc: 'نصب، تعمیر و نگهداری میز و تجهیزات' },
  { k: 'manufacturers', name: 'تولیدکنندگان', href: '/manufacturers', desc: 'سازندگان میز و تجهیزات با محصولات و گواهینامه' },
  { k: 'sellers', name: 'فروشگاه‌ها', href: '/sellers', desc: 'فروشگاه‌های تخصصی با محصولات و تماس مستقیم' },
]

/* رابطه‌های میانِ نقش‌ها (جدا از پیوندِ همه به هاب) */
const EDGES: Array<[string, string]> = [
  ['clubs', 'players'], ['clubs', 'coaches'], ['clubs', 'tournaments'], ['coaches', 'players'],
  ['players', 'tournaments'], ['referees', 'tournaments'], ['services', 'clubs'],
  ['manufacturers', 'sellers'], ['sellers', 'clubs'],
]

const R = 36
const pos = (i: number) => {
  const a = (i / NODES.length) * Math.PI * 2 - Math.PI / 2
  return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) }
}
const at = Object.fromEntries(NODES.map((n, i) => [n.k, pos(i)]))

export function Ecosystem() {
  return (
    <div className="ab-eco grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
      <div aria-hidden className="ab-eco-map relative mx-auto aspect-square w-full max-w-xl lg:col-span-7">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {NODES.map(n => (
            <line key={n.k} className="ab-spoke" data-e={n.k} x1="50" y1="50" x2={at[n.k]!.x} y2={at[n.k]!.y} pathLength="100" />
          ))}
          {EDGES.map(([a, b]) => (
            <line key={a + b} className="ab-edge" data-e={`${a} ${b}`} x1={at[a]!.x} y1={at[a]!.y} x2={at[b]!.x} y2={at[b]!.y} pathLength="100" />
          ))}
          <circle cx="50" cy="50" r="9" className="ab-hub-ring" />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element -- نشانِ ثابت و کوچک */}
        <img src="/images/Logo/bh-tile-256-v13.webp" alt="" width={72} height={72} loading="lazy" decoding="async"
          className="absolute start-1/2 top-1/2 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-card sm:h-16 sm:w-16" />
        {NODES.map((n, i) => {
          const p = pos(i)
          return (
            <span key={n.k} data-n={n.k} className="ab-node absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <span className="ab-sight" />
              <span className="whitespace-nowrap text-body font-bold">{n.name}</span>
            </span>
          )
        })}
      </div>

      <ul className="ab-eco-list lg:col-span-5">
        {NODES.map(n => {
          const closed = isClosedSection(n.href)
          const href = closed ? '/ranking' : n.href
          return (
            <li key={n.k} data-k={n.k}>
              <Link href={href} prefetch={false}
                className="ab-eco-row group flex items-center gap-4 py-4 focus-visible:outline-none">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h3 className="text-body font-extrabold text-ink">{n.name}</h3>
                  <span className="text-body text-ink-2">{closed ? 'جایگاه بازیکنان در رنکینگ' : n.desc}</span>
                </div>
                <ArrowLeft size={18} aria-hidden className="ab-eco-arrow shrink-0 text-ink-2" />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
