'use client'

/* ─────────────────────────────────────────────────────────────
   قاب بیلیارد مدیا — نوار بالا، ریل کناری دسکتاپ، ناوبری پایین
   موبایل.

   ⚠️ مدیا عمدا ناوبری خودش را دارد. کاربری که وارد یک پلتفرم
   ویدیو می‌شود انتظار دارد «خانه / Shorts / کانال‌ها / تاریخچه» را
   کنار دستش ببیند، نه منوی عمومی سایت را. نوار سراسری بیلیارد
   هاب سر جایش می‌ماند؛ این زیر آن می‌نشیند.

   ⚠️ هیچ آیتمی که پشتوانه‌ی داده ندارد در ناوبری نیست: «اشتراک‌ها»،
   «لیست‌های پخش» و «پخش زنده» جدول ندارند، پس لینکشان هم ساخته
   نشد. لینک مرده بدتر از نبود لینک است.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, Home, Clapperboard, Users2, Trophy, Newspaper, UploadCloud, User,
} from 'lucide-react'
import SearchBox from './SearchBox'

/* ── هم‌ترازی با نوار ثابت سایت ──
   ⚠️ همان تله‌ی صفحه‌ی خدمات فنی: عدد ثابت در حالت نصب‌شده‌ی iOS
   غلط می‌شود چون ناحیه‌ی امن نوار را بلندتر می‌کند. ارتفاع از خود
   نوار پرسیده می‌شود. */
export function NavOffset() {
  useEffect(() => {
    const nav = document.querySelector('body > nav, header nav')
    if (!nav) return
    const root = document.documentElement
    const apply = () => {
      const h = Math.round(nav.getBoundingClientRect().height)
      if (h > 0) root.style.setProperty('--mx-nav', `${h}px`)
    }
    apply()
    window.addEventListener('resize', apply)
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(apply)
    ro?.observe(nav)
    return () => {
      window.removeEventListener('resize', apply)
      ro?.disconnect()
      root.style.removeProperty('--mx-nav')
    }
  }, [])
  return null
}

export interface TopBarProps {
  /** برای برچسب درست دکمه‌ی جمع‌کردن */
  railMini?: boolean
  q: string
  onQ: (v: string) => void
  onSubmit: () => void
  onToggleRail: () => void
  /** فقط وقتی کاربر واقعا می‌تواند ویدیو منتشر کند */
  onUpload?: () => void
}

export function TopBar({ q, onQ, onSubmit, onToggleRail, onUpload, railMini = false }: TopBarProps) {
  return (
    <div className="mx-top">
      <div className="mx-top-in">
        <button
          className="mx-burger" type="button" onClick={onToggleRail}
          aria-expanded={!railMini}
          aria-label={railMini ? 'باز کردن منو' : 'جمع‌کردن منو'}
        >
          <Menu size={20} />
        </button>

        <Link className="mx-brand" href="/media">
          <i aria-hidden><Clapperboard size={15} /></i>
          <span>بیلیارد مدیا</span>
        </Link>

        {/* ⚠️ جست‌وجو کامپوننت خودش را دارد: با هر حرف پیشنهاد
            می‌آورد و خودش ناوبری می‌کند، پس نوار بالا دیگر لازم
            نیست q را نگه دارد. */}
        <SearchBox initial={q} />

        <div className="mx-top-act">
          {/* ⚠️ دکمه‌ی انتشار فقط برای کسی که واقعا کانال دارد. یک
              «+» همیشگی که به دیوار «شما کانال ندارید» بخورد، وعده‌ی
              دروغ است. */}
          {onUpload && (
            <button className="mx-iconbtn" type="button" onClick={onUpload}>
              <UploadCloud size={16} /><span>انتشار</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export interface RailItem { href: string; label: string; icon: React.ReactNode }

/* ⚠️ حالت فعال از مسیر واقعی می‌آید. نسخه‌ی اول یک رشته‌ی دستی
   می‌گرفت که هرگز با `/media/channels` برابر نمی‌شد، پس آن آیتم
   هیچ‌وقت `aria-current` نمی‌گرفت. */
export function Rail({ tab }: { tab?: string }) {
  const path = usePathname()
  const main: RailItem[] = [
    { href: '/media', label: 'خانه', icon: <Home size={19} /> },
    { href: '/media?t=shorts', label: 'Shorts', icon: <Clapperboard size={19} /> },
    { href: '/media/channels', label: 'کانال‌ها', icon: <Users2 size={19} /> },
  ]
  const isOn = (href: string) =>
    href === '/media?t=shorts'
      ? path === '/media' && tab === 'shorts'
      : href === '/media'
        ? path === '/media' && tab !== 'shorts'
        : path.startsWith(href)
  /* ⚠️ تاریخچه روی همین دستگاه ذخیره می‌شود (localStorage)، نه در
     دیتابیس — پس صفحه‌ای برایش نیست و فقط در خانه دیده می‌شود. */
  return (
    <nav className="mx-rail" aria-label="ناوبری بیلیارد مدیا">
      <div className="mx-rail-g">
        {main.map(i => (
          <Link key={i.href} href={i.href} aria-current={isOn(i.href) ? 'page' : undefined}>
            {i.icon}<span>{i.label}</span>
          </Link>
        ))}
      </div>
      <div className="mx-rail-g">
        <p className="mx-rail-t">بیلیارد هاب</p>
        <Link href="/tournaments"><Trophy size={19} /><span>مسابقات</span></Link>
        <Link href="/news"><Newspaper size={19} /><span>اخبار</span></Link>
      </div>
    </nav>
  )
}

export function BottomNav({ tab, onUpload }: { tab?: string; onUpload?: () => void }) {
  const path = usePathname()
  const onHome = path === '/media' && tab !== 'shorts'
  const onShorts = path === '/media' && tab === 'shorts'
  return (
    <nav className="mx-bottom" aria-label="ناوبری پایین">
      <Link href="/media" aria-current={onHome ? 'page' : undefined}>
        <Home size={20} /><span>خانه</span>
      </Link>
      <Link href="/media?t=shorts" aria-current={onShorts ? 'page' : undefined}>
        <Clapperboard size={20} /><span>Shorts</span>
      </Link>
      {onUpload && (
        <button type="button" className="mx-plus" onClick={onUpload} aria-label="انتشار ویدیو">
          <i aria-hidden><UploadCloud size={16} /></i><span>انتشار</span>
        </button>
      )}
      <Link href="/media/channels" aria-current={path.startsWith('/media/channel') ? 'page' : undefined}>
        <Users2 size={20} /><span>کانال‌ها</span>
      </Link>
      <Link href="/dashboard">
        <User size={20} /><span>پروفایل</span>
      </Link>
    </nav>
  )
}

/** حالت باز/بسته‌ی ریل — روی همین مرورگر یادش می‌ماند. */
export function useRailState() {
  const [mini, setMini] = useState(false)
  useEffect(() => {
    try { setMini(localStorage.getItem('bh:media:rail') === 'mini') } catch { /* حالت خصوصی */ }
  }, [])
  const toggle = () => setMini(m => {
    const n = !m
    try { localStorage.setItem('bh:media:rail', n ? 'mini' : 'full') } catch { /* بی‌اهمیت */ }
    return n
  })
  return { mini, toggle }
}
