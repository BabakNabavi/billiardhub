'use client'

/* ─────────────────────────────────────────────────────────────
   ویرایشِ مشخصاتِ ویدیویی که از قبل منتشر شده.

   ── چرا هست ──
   فرمِ مشخصات فقط هنگامِ آپلود پرسیده می‌شود، ولی ویدیوهایی که
   *پیش‌تر* با نامِ فایل منتشر شده‌اند همان عنوان را نگه داشته بودند و
   هیچ صفحه‌ای راهی برای اصلاحشان نداشت. مسیرِ ادمین این کار را
   می‌کرد ولی صاحبِ ویدیو به آن دسترسی ندارد.

   ── دو جا باید عوض شود ──
   ویدیو دو نسخه دارد: ردیفِ گالریِ پروفایل و ردیفِ جدولِ `videos`.
   این هوک دومی را خودش می‌زند و اولی را به صفحه می‌سپارد (هر نقش
   جای ذخیره‌ی خودش را دارد).

   ⚠️ اگر ذخیره‌ی گالری شکست بخورد، مدیا هم دست نمی‌خورد: دو عنوانِ
   متفاوت برای یک ویدیو بدتر از عنوانِ بد است.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useRef, useState } from 'react'
import VideoDetailsDialog, { type DetailTarget } from './VideoDetailsDialog'
import { type VideoDetail } from '@/lib/media/video-details'
import { apiFetch } from '@/lib/http'

export interface EditableVideo {
  /** نشانیِ فایل — کلیدِ یافتنِ ردیفِ مدیا */
  url?: string
  thumbnail?: string
  title?: string
}

export function useVideoEdit(
  /** ذخیره‌ی عنوانِ تازه در گالریِ خودِ صفحه. `false` یعنی نشد. */
  saveToGallery: (v: EditableVideo, d: VideoDetail) => Promise<boolean> | boolean,
  /* ⚠️ لحنِ پیش‌فرضِ `notify` «خطا» است؛ بدونِ `tone`، پیامِ موفقیت
     قرمز نشان داده می‌شد. */
  notify?: (msg: string, tone?: 'ok' | 'gold' | 'danger') => void,
) {
  const [open, setOpen] = useState<{ v: EditableVideo; targets: DetailTarget[]; initial: VideoDetail[] } | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const busy = useRef(false)

  const edit = useCallback((v: EditableVideo) => {
    if (!v.url) return
    setErr(''); setSaving(false)
    setOpen({
      v,
      /* ⚠️ یک‌بار ساخته می‌شود، نه در JSX: آرایه‌ی تازه در هر رندر
         افکتِ پیش‌نمایشِ پنجره را بی‌دلیل می‌دواند. */
      targets: [{ name: v.title ?? '', poster: v.thumbnail || undefined }],
      /* ⚠️ دسته‌بندی خالی می‌ماند و در حالتِ ویرایش هم اجباری نیست:
         گالری دسته‌ی فعلی را نگه نمی‌دارد، پس اگر اجباری بود کاربر
         مجبور می‌شد چیزی را که نمی‌بیند دوباره انتخاب کند — و هر
         تغییرِ نام، دسته‌بندیِ درست را بی‌صدا عوض می‌کرد. */
      initial: [{ title: v.title ?? '', category: '', description: '', publish: true }],
    })
  }, [])

  const close = useCallback(() => { if (!busy.current) { setOpen(null); setErr('') } }, [])

  /* ⚠️ پنجره تا پایانِ ذخیره باز می‌ماند. نسخه‌ی اول همان اول می‌بستش:
     اگر ذخیره شکست می‌خورد، عنوانی که کاربر تایپ کرده بود رفته بود و
     باید از نو می‌نوشت. */
  const save = useCallback(async (d: VideoDetail[]) => {
    if (busy.current || !open) return
    busy.current = true
    setSaving(true); setErr('')
    const detail = d[0]!
    const target = open.v
    const done = (msg: string, tone: 'ok' | 'danger' = 'ok') => {
      notify?.(msg, tone); setOpen(null); setErr('')
    }
    try {
      /* اول گالری: اگر این نشد، مدیا هم نباید عوض شود — دو عنوانِ
         متفاوت برای یک ویدیو بدتر از عنوانِ بد است. */
      if (!(await saveToGallery(target, detail))) {
        setErr('ذخیره‌ی عنوان در گالری انجام نشد؛ چیزی عوض نشد.')
        return
      }
      const r = await apiFetch('/api/media', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          src: target.url, title: detail.title,
          ...(detail.category ? { category: detail.category } : {}),
          ...(detail.description ? { description: detail.description } : {}),
        }),
      })
      if (r.ok) { done('عنوان به‌روز شد.'); return }
      const j = await r.json().catch(() => ({})) as { message?: string; code?: string }
      /* ⚠️ فقط `code` قابلِ اعتماد است: ۴۰۴ زمانی «چند ردیفِ هم‌نشانی»
         و «خطای خواندن» را هم می‌گرفت و به کاربر می‌گفت «منتشر نشده». */
      if (j.code === 'no-media-row') {
        done('عنوان در گالری به‌روز شد. این ویدیو در بیلیارد مدیا منتشر نشده است.', 'ok')
        return
      }
      setErr(`عنوان در گالری عوض شد ولی در بیلیارد مدیا نه: ${j.message ?? `خطای ${r.status}`}`)
    } catch {
      setErr('عنوان در گالری عوض شد ولی ارتباط با بیلیارد مدیا برقرار نشد.')
    } finally { busy.current = false; setSaving(false) }
  }, [open, saveToGallery, notify])

  const dialog = open ? (
    <VideoDetailsDialog
      key={open.v.url}
      mode="edit"
      targets={open.targets}
      initial={open.initial}
      busy={saving}
      error={err}
      onDone={d => void save(d)}
      onClose={close}
    />
  ) : null

  return { dialog, edit }
}
