'use client'

/* ─────────────────────────────────────────────────────────────
   نمایش فارسی همه‌ی ارقام — یک‌جا برای کل سایت.

   چرا این‌طوری و نه فایل‌به‌فایل: در پروژه بیش از ۸۵ نسخه‌ی محلی
   `toFa` وجود دارد و هر عددی که از دیتابیس، `toLocaleString`، یا
   کتابخانه‌ی بیرونی می‌آید از دستشان در می‌رود. این کامپوننت به‌جای
   دنبال‌کردن منبع اعداد، خروجی نهایی را اصلاح می‌کند: هر متن
   رندرشده در صفحه.

   چیزهایی که عمداً دست نمی‌خورند:
     • ورودی‌ها (input/textarea/select) — مقدارشان باید لاتین بماند
       وگرنه فرم و اعتبارسنجی می‌شکند
     • کد، مسیر، و هر چیزی که با `bh-latin` یا `data-no-fa` علامت خورده
     • ویژگی‌ها (attribute) — فقط متن دیده‌شده عوض می‌شود

   نکته‌ی مهم همزیستی با React: وقتی React یک متن را دوباره می‌نویسد،
   نسخه‌ی لاتین برمی‌گردد؛ MutationObserver همان لحظه دوباره فارسی‌اش
   می‌کند. برای اینکه این رفت‌وبرگشت حلقه نشود، تغییر خودمان با یک
   پرچم علامت می‌خورد و نادیده گرفته می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useEffect } from 'react'

const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const HAS_LATIN = /[0-9]/

/* برچسب‌هایی که محتوایشان نباید لمس شود */
/* `OPTION` و `SELECT` عمداً **حذف شده‌اند** از این فهرست: متن گزینه
   چیزی است که کاربر می‌بیند و باید فارسی باشد، و `value` که منطق با آن
   کار می‌کند یک ویژگی جداست و دست نمی‌خورد. بودنشان این‌جا باعث شده
   بود همه‌ی عددهای داخل دراپ‌داون‌ها انگلیسی بمانند.

   `INPUT` و `TEXTAREA` می‌مانند: مقدارشان به سرور می‌رود. */
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT',
  'CODE', 'PRE', 'KBD', 'SAMP', 'TIME',
])

function skip(el: Element | null): boolean {
  for (let n = el; n; n = n.parentElement) {
    if (SKIP_TAGS.has(n.tagName)) return true
    if (n.classList?.contains('bh-latin')) return true
    if (n.hasAttribute?.('data-no-fa')) return true
    if (n.getAttribute?.('contenteditable') === 'true') return true
  }
  return false
}

const faify = (s: string) => s.replace(/[0-9]/g, d => FA[+d]!)

export default function PersianDigits() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    /* در حال نوشتن خودمان ⇒ رویدادهای ناشی از آن نادیده گرفته شوند */
    let writing = false

    const fixNode = (node: Text) => {
      const v = node.nodeValue
      if (!v || !HAS_LATIN.test(v)) return
      if (skip(node.parentElement)) return
      const next = faify(v)
      if (next !== v) node.nodeValue = next
    }

    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) { fixNode(root as Text); return }
      if (root.nodeType !== Node.ELEMENT_NODE) return
      if (skip(root as Element)) return
      const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const batch: Text[] = []
      for (let n = it.nextNode(); n; n = it.nextNode()) batch.push(n as Text)
      batch.forEach(fixNode)
    }

    const run = (fn: () => void) => {
      writing = true
      try { fn() } finally { writing = false }
    }

    run(() => walk(document.body))

    const obs = new MutationObserver(records => {
      if (writing) return
      run(() => {
        for (const r of records) {
          if (r.type === 'characterData') fixNode(r.target as Text)
          else r.addedNodes.forEach(walk)
        }
      })
    })

    obs.observe(document.body, {
      childList: true, subtree: true, characterData: true,
    })

    return () => obs.disconnect()
  }, [])

  return null
}
