'use client'

/* ─────────────────────────────────────────────────────────────
   کلیدهای جهت روی نوار تب.

   ── چرا هوک ──
   `role="tab"` به صفحه‌خوان وعده می‌دهد که فلش‌ها بین تب‌ها حرکت
   می‌کنند. نوشتن همین ده خط در هر صفحه یعنی یکی از آن‌ها روزی جا
   می‌ماند و آن وعده در همان یک صفحه دروغ می‌شود — سه نسخه‌ی جدا از
   این منطق در مربی، داور و باشگاه نوشته شده بود.

   ── جهت در راست‌به‌چپ ──
   «چپ» یعنی تب بعدی، چون در RTL تب بعدی سمت چپ دیده می‌شود. این
   همان چیزی است که چشم می‌بیند، نه ترتیب منطقی آرایه.

   ── Home/End ──
   بخشی از الگوی استاندارد تب‌هاست و دو خط است؛ نبودنش برای کسی که با
   کیبورد کار می‌کند یعنی پیمودن کل نوار برای رسیدن به تب اول.
   ───────────────────────────────────────────────────────────── */

import type { KeyboardEvent } from 'react'

export function useTabKeys<T extends string>(
  keys: readonly T[],
  current: T,
  setCurrent: (k: T) => void,
  /** پیشوند `id` دکمه‌ها — برای بردن فوکوس روی تب تازه */
  idPrefix: string,
) {
  return (e: KeyboardEvent) => {
    const i = keys.indexOf(current)
    if (i < 0) return

    let next: T | undefined
    if (e.key === 'ArrowLeft') next = keys[(i + 1) % keys.length]
    else if (e.key === 'ArrowRight') next = keys[(i - 1 + keys.length) % keys.length]
    else if (e.key === 'Home') next = keys[0]
    else if (e.key === 'End') next = keys[keys.length - 1]
    if (!next) return

    e.preventDefault()
    setCurrent(next)
    /* فوکوس باید همراه انتخاب برود، وگرنه فلش بعدی از تب قبلی
       شمرده می‌شود و حرکت یکی‌درمیان می‌شود. */
    document.getElementById(`${idPrefix}${next}`)?.focus()
  }
}
