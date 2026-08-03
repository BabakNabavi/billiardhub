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

    /* ── چرا کار دسته‌بندی و به وقتِ بی‌کاری موکول می‌شود ──

       اندازه‌گیریِ صفحه‌ی اصلی (scripts/perf-audit.mjs) نشان داد
       نخستین ثانیه‌های بارگذاری پر از «کارِ بلند» است — تا ۷۴ تا، و
       بلندترینشان بیش از یک ثانیه. یکی از منبع‌هایش همین‌جا بود:

       ۱) پیمایشِ کاملِ DOM دقیقاً وسطِ hydration اجرا می‌شد، همان
          لحظه‌ای که مرورگر بیشترین فشار را دارد.
       ۲) بدتر: هنگامِ hydration، React هزاران گره اضافه می‌کند و
          ناظر برای *هر دسته* دوباره پیمایش می‌کرد. یعنی همان درخت
          چندین بار از نو خوانده می‌شد.

       حالا کارها در یک صف جمع می‌شوند و در نخستین فرصتِ بی‌کاریِ
       مرورگر یک‌جا انجام می‌شوند. رشته‌ی اصلی دیگر بلوکه نمی‌شود و
       نتیجه‌ی دیده‌شده همان است — چند میلی‌ثانیه دیرتر، که چشم
       نمی‌بیند.

       `requestIdleCallback` در سافاری نیست؛ `setTimeout` جایگزینِ
       امن است و رفتار را عوض نمی‌کند. */
    const idle: (cb: () => void) => void =
      typeof (window as unknown as { requestIdleCallback?: unknown }).requestIdleCallback === 'function'
        ? cb => (window as unknown as { requestIdleCallback: (c: () => void, o?: { timeout: number }) => void })
            .requestIdleCallback(cb, { timeout: 300 })
        : cb => { setTimeout(cb, 1) }

    /* صف — گره‌های تکراری یک‌بار پردازش می‌شوند */
    let queue: Node[] = []
    let scheduled = false
    const flush = () => {
      scheduled = false
      const batch = queue; queue = []
      if (!batch.length) return
      run(() => { for (const n of batch) walk(n) })
    }
    const schedule = (n: Node) => {
      queue.push(n)
      if (scheduled) return
      scheduled = true
      idle(flush)
    }

    /* پیمایشِ اول هم بی‌درنگ نیست — hydration اولویت دارد */
    schedule(document.body)

    const obs = new MutationObserver(records => {
      if (writing) return
      for (const r of records) {
        if (r.type === 'characterData') schedule(r.target)
        else r.addedNodes.forEach(schedule)
      }
    })

    obs.observe(document.body, {
      childList: true, subtree: true, characterData: true,
    })

    return () => { obs.disconnect(); queue = [] }
  }, [])

  return null
}
