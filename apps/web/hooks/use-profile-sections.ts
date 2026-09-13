'use client'

/* ─────────────────────────────────────────────────────────────
   آشکارسازیِ بخش‌ها هنگام اسکرول + روشن‌کردنِ تبِ فعال.

   صفحه‌ی مربی و صفحه‌ی داور هر دو چیدمانِ کانالی (`.ch-ch`) دارند
   و این منطق بینشان بیت‌به‌بیت یکی بود. تنها فرقشان فهرستِ
   `ids` است، پس همان یک چیز پارامتر شد.
   ───────────────────────────────────────────────────────────── */

import { useEffect } from 'react'

/**
 * @param ids شناسه‌ی بخش‌ها به همان ترتیبِ نوارِ تب
 * @param deps چیزهایی که با تغییرشان DOM دوباره ساخته می‌شود
 *             (مثلا `checked` و `reloadKey`).
 *             ⚠️ **طولش باید بین رندرها ثابت بماند** — این آرایه
 *             spread می‌شود و آرایه‌ی وابستگیِ با طولِ متغیر یعنی
 *             هشدارِ React و ناظرهای کهنه. آرایه‌ی لیترال بده،
 *             نه چیزی که شرطی ساخته شود.
 */
export function useProfileSections(ids: readonly string[], deps: readonly unknown[]) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    /* ── آشکارسازی ──
       ⚠️ `animation-timeline: view()` هنوز همه‌جا نیست، پس ناظرِ
       تقاطع. حرکت فقط opacity/transform است.
       ⚠️ حالتِ پایه **آشکار** است و کلاسِ پنهان‌کننده را خودِ
       اسکریپت می‌گذارد؛ پس اگر جاوااسکریپت نرسد یا کاربر حرکتِ کم
       بخواهد، محتوا دیده می‌شود نه اینکه برای همیشه نامرئی بماند. */
    const els = Array.from(document.querySelectorAll('.ch-rv'))
    /* ⚠️ چیزی که همین الان داخلِ قاب است نباید پنهان شود: روی
       گوشیِ کند رنگ‌آمیزی شده، بعد hydration پنهانش می‌کند و نیم
       ثانیه بعد برمی‌گردد — یک پرشِ دیدنی. */
    const below = els.filter(el => el.getBoundingClientRect().top >= window.innerHeight * 0.9)
    below.forEach(el => el.classList.add('ch-rv--off'))
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.remove('ch-rv--off')
        io.unobserve(e.target)
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 })
    below.forEach(el => io.observe(el))

    /* ── تبِ فعال ──
       بدونِ این، شیارِ ۲ پیکسلیِ زیرِ تب‌ها هیچ‌وقت روشن نمی‌شد و
       نوار نمی‌گفت کجای صفحه‌ای.
       ⚠️ `aria-current` کنارِ `data-on` می‌آید: بدونِ آن، «کجا
       هستم» فقط یک خطِ رنگی است و برای صفحه‌خوان اصلا وجود ندارد. */
    const marks = ids.map(i => document.getElementById(i)).filter(Boolean) as Element[]
    const spy = new IntersectionObserver(entries => {
      const hit = entries.filter(e => e.isIntersecting)
        .sort((x, y) => y.intersectionRatio - x.intersectionRatio)[0]
      if (!hit) return
      for (const l of document.querySelectorAll('.ch-tabsbar a')) {
        const on = l.getAttribute('href') === '#' + hit.target.id
        l.toggleAttribute('data-on', on)
        if (on) l.setAttribute('aria-current', 'true')
        else l.removeAttribute('aria-current')
      }
    }, { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.2, 0.6] })
    marks.forEach(el => spy.observe(el))

    return () => { io.disconnect(); spy.disconnect() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(','), ...deps])
}
