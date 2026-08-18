'use client'

/* ─────────────────────────────────────────────────────────────
   بازکردنِ عکسِ پروفایل و کاور در نمای تمام‌صفحه.

   ── چرا هوک و نه کامپوننت ──
   هشت صفحه‌ی نقش، هشت مارک‌آپِ متفاوت دارند: یکی آواتار را داخل
   دکمه‌ی استوری گذاشته، یکی کاور را در اسلایدر، یکی لوگو را در
   `ClubLogo`. کامپوننتِ پوشاننده یعنی دست‌بردن در هر هشت چیدمان.
   هوک فقط *حالت* را می‌دهد و هر صفحه همان‌جا که دارد یک `onClick`
   اضافه می‌کند.

   ── چرا `ImageLightbox` و نه یک نمای تازه ──
   آن یکی از قبل کلید‌های صفحه‌کلید، کشیدنِ انگشت، قفلِ اسکرول و
   دکمه‌ی بازگشتِ گوشی را درست هندل می‌کند. چهار صفحه‌ی این پروژه
   هرکدام نسخه‌ی ناقصِ خودشان را ساخته بودند؛ این پنجمی نمی‌شود.

   ── نبودِ عکس ──
   `open` با فهرستِ خالی هیچ‌کاری نمی‌کند. پس صفحه می‌تواند بدونِ
   شرط صدایش بزند و کاربری که عکس نگذاشته، دکمه‌ای می‌بیند که
   هیچ اتفاقی نمی‌اندازد — نه پنجره‌ی خالی.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useState } from 'react'
import ImageLightbox from './market/ImageLightbox'

interface ViewerState {
  images: string[]
  index: number
  alt: string
  title: string
  onDelete?: (i: number) => void | Promise<void>
}

export function useProfileImageViewer() {
  const [state, setState] = useState<ViewerState | null>(null)

  const open = useCallback(
    (images: string | string[], opts?: { index?: number; alt?: string; title?: string; onDelete?: (i: number) => void | Promise<void> }) => {
      const list = (Array.isArray(images) ? images : [images]).filter(Boolean)
      if (!list.length) return
      setState({
        images: list,
        index: Math.min(Math.max(opts?.index ?? 0, 0), list.length - 1),
        alt: opts?.alt ?? '',
        title: opts?.title ?? 'تصاویر',
        /* حذف فقط وقتی داده می‌شود که بیننده صاحبِ همین رسانه باشد */
        onDelete: opts?.onDelete,
      })
    },
    [],
  )

  const viewer = state ? (
    <ImageLightbox
      images={state.images}
      index={state.index}
      alt={state.alt}
      title={state.title}
      onIndex={i => setState(s => (s ? { ...s, index: i } : s))}
      onClose={() => setState(null)}
      {...(state.onDelete ? { onDelete: async (i: number) => { await state.onDelete!(i); setState(null) } } : {})}
    />
  ) : null

  return { open, viewer, isOpen: state !== null }
}

/* ── چرا این‌جا کامپوننتِ «دکمه‌ی بزرگ‌نمایی» نیست ──
   یک `ZoomableImage` نوشته شد و بعد پاک شد: هیچ‌کدام از هفت صفحه
   نتوانستند استفاده‌اش کنند. جایی که دکمه لازم است، یا باید روی
   لوگوی موجود بنشیند که خودش از قبل دکمه است (فروشگاه، باشگاه)، یا
   یک روکشِ `position:absolute` روی کاور است که باید زیرِ عناصرِ
   بعدی بماند. هیچ شکلِ مشترکی بینشان نبود و آن کامپوننت صادر می‌شد
   بی‌آنکه کسی واردش کند — همان دوباره‌کاری‌ای که قرار بود جلویش را
   بگیرد. چیزی که واقعاً مشترک است، *حالت* است و در هوکِ بالاست. */
