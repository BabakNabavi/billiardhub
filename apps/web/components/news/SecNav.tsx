/* ─────────────────────────────────────────────────────────────
   ناوبریِ بخش‌های تحریریه.

   ⚠️ لینکِ ساده است، نه دکمه‌ی state‌دار: هر بخش نشانیِ خودش را دارد
   (`/news?s=snooker`)، پس قابلِ اشتراک‌گذاری و ایندکس‌شدنی است و
   بدونِ جاوااسکریپت هم کار می‌کند. نسخه‌ی قبلی فیلترِ کلاینتی بود و
   هیچ بخشی نشانی نداشت.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { NAV_SECTIONS } from '@/lib/news/sections'

export function SecNav({ active }: { active: string | null }) {
  return (
    <nav className="nr-secnav" aria-label="بخش‌های خبری">
      <ul>
        <li>
          <Link href="/news" aria-current={active ? undefined : 'page'}>آخرین اخبار</Link>
        </li>
        {NAV_SECTIONS.map(s => (
          <li key={s.key}>
            <Link href={`/news?s=${s.key}`} aria-current={active === s.key ? 'page' : undefined}>
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
