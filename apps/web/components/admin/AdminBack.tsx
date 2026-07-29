'use client'

/* ─────────────────────────────────────────────────────────────
   دکمه‌ی «بازگشت» پنلِ ادمین — یک شکل برای همه‌ی صفحه‌ها.

   تا امروز ۱۶ صفحه‌ی ادمین هیچ راهِ برگشتی نداشتند و تنها راه، دکمه‌ی
   Backِ مرورگر بود. چند صفحه هم لینکِ برگشت داشتند ولی هرکدام با
   ظاهر و متنِ خودش.

   این‌جا در layout نشسته، پس هر صفحه‌ی تازه‌ای هم خودبه‌خود دارد.

   دو حالت:
     • در ریشه‌ی پنل (`/admin`) اصلاً نمایش داده نمی‌شود
     • در بقیه، به یک سطح بالاتر می‌رود — نه `router.back()`، چون
       تاریخچه‌ی مرورگر ممکن است از جای دیگری آمده باشد
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

/* نامِ فارسیِ بخش‌ها — برای «بازگشت به …» */
const PARENT_LABEL: Record<string, string> = {
  '/admin': 'پنل مدیریت',
}

export default function AdminBack() {
  const pathname = usePathname() ?? '/admin'

  /* ریشه‌ی پنل جایی برای برگشت ندارد */
  if (pathname === '/admin' || pathname === '/admin/') return null

  const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  const parent = '/' + segments.slice(0, -1).join('/')
  const label = PARENT_LABEL[parent] ?? 'صفحه‌ی قبل'

  return (
    <div style={{
      maxWidth: 1180, margin: '0 auto',
      padding: 'clamp(14px,3vw,22px) clamp(16px,4vw,32px) 0',
    }}>
      <Link href={parent} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 15px', borderRadius: 11, textDecoration: 'none',
        background: '#fff', border: '1px solid #E7E2D6',
        color: '#5B564B', fontSize: 13, fontWeight: 700,
        transition: 'border-color .2s, color .2s',
      }}
        className="admin-back-btn">
        <ArrowRight size={14} />
        بازگشت به {label}
      </Link>
    </div>
  )
}
