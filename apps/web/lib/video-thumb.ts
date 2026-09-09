/* ─────────────────────────────────────────────────────────────
   بندانگشتی و مدت ویدیو — از خود فایل، در مرورگر.

   ── چرا در مرورگر و نه سرور ──
   استخراج فریم روی سرور یعنی ffmpeg، یعنی یک وابستگی سنگین و پردازش
   CPU روی همان دو هسته‌ای که سایت را سرو می‌کند. مرورگر همین حالا
   ویدیو را برای پیش‌نمایش دیکد می‌کند؛ گرفتن یک فریم از آن مجانی است.

   ── چرا ثانیه‌ی اول نه ──
   فریم اول اغلب سیاه است. کمی جلوتر می‌رویم تا تصویری واقعی بیفتد،
   ولی نه آن‌قدر که از ویدیوهای کوتاه رد شویم.
   ───────────────────────────────────────────────────────────── */

export interface VideoMeta {
  /** فریم گرفته‌شده، آماده‌ی آپلود */
  thumb: File | null
  /** مدت به ثانیه — صفر یعنی مرورگر نتوانست بخواند */
  durationSec: number
  width: number
  height: number
}

/** «۹۳» ⟵ «۱:۳۳» — همان شکلی که کارت نشان می‌دهد */
export function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return ''
  /* گرد کردن **پیش از** تقسیم: با `Math.round(sec % 60)` یک ویدیوی
     ۱۱۹.۷ ثانیه‌ای «۱:۶۰» می‌شد. */
  const t = Math.round(sec)
  const m = Math.floor(t / 60)
  const s = t % 60
  const fa = (n: number) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)
  return `${fa(m)}:${fa(s).padStart(2, '۰')}`
}

function frameOf(video: HTMLVideoElement): File | null {
  try {
    const w = 640
    const h = Math.round(w * (video.videoHeight / (video.videoWidth || w))) || 360
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, w, h)
    const data = canvas.toDataURL('image/jpeg', 0.82)
    const bin = atob(data.split(',')[1] ?? '')
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new File([bytes], 'thumb.jpg', { type: 'image/jpeg' })
  } catch { return null }
}

/**
 * فایل ویدیو ⟵ بندانگشتی و متادیتا.
 *
 * هرگز پرتاب نمی‌کند: ویدیویی که مرورگر نتواند دیکدش کند، متادیتای
 * خالی می‌دهد و آپلود سر جایش انجام می‌شود — بندانگشتی را می‌شود
 * دستی گذاشت، ولی نبودنش نباید کل کار را متوقف کند.
 */
export function videoMeta(file: File, seekTo = 1): Promise<VideoMeta> {
  return new Promise(resolve => {
    const empty: VideoMeta = { thumb: null, durationSec: 0, width: 0, height: 0 }
    let url = ''
    let settled = false
    let v: HTMLVideoElement | null = null
    /* ── چرا پرچم `settled` ──
       نگهبان زمان و رویداد دیرهنگام هر دو می‌توانند صدا بزنند؛ بدون
       این، `revokeObjectURL` دو بار اجرا می‌شد.

       `src` هم پاک می‌شود: بافر دیکدشده‌ی یک فایل ۲۵ مگابایتی تا
       زباله‌روبی در حافظه می‌ماند. */
    const done = (m: VideoMeta) => {
      if (settled) return
      settled = true
      if (v) { v.removeAttribute('src'); try { v.load() } catch { /* مرورگر قدیمی */ } }
      if (url) URL.revokeObjectURL(url)
      resolve(m)
    }
    try {
      url = URL.createObjectURL(file)
      const el = document.createElement('video')
      v = el
      el.preload = 'metadata'
      el.muted = true
      /* بدون این، سافاری iOS ویدیو را تمام‌صفحه باز می‌کند */
      el.playsInline = true
      /* ── تور ایمنی ──
         فایل خراب می‌تواند هیچ رویدادی ندهد. ولی اگر متادیتا از قبل
         خوانده شده، دور ریختنش بی‌دلیل است: ویدیوی غیرقابل seek
         (بعضی webm و mov) بندانگشتی ندارد ولی مدتش را دارد. */
      let partial: VideoMeta = empty
      const timer = setTimeout(() => done(partial), 8000)
      el.onerror = () => { clearTimeout(timer); done(empty) }
      el.onloadedmetadata = () => {
        const dur = Number.isFinite(el.duration) ? el.duration : 0
        const meta = { thumb: null as File | null, durationSec: dur, width: el.videoWidth, height: el.videoHeight }
        partial = meta
        el.onseeked = () => {
          clearTimeout(timer)
          done({ ...meta, thumb: frameOf(el) })
        }
        /* ── مدت ناخوانا ──
           `currentTime = 0` روی ویدیویی که مدتش خوانده نشده یک seek
           بی‌اثر است و بعضی مرورگرها `seeked` نمی‌دهند — نتیجه‌اش هشت
           ثانیه انتظار پیش از شروع آپلود، با دکمه‌ی قفل‌شده. */
        if (!dur) { clearTimeout(timer); done(meta); return }
        /* ویدیوی کوتاه‌تر از نقطه‌ی هدف: وسطش را می‌گیریم */
        el.currentTime = dur > seekTo ? seekTo : dur / 2
      }
      el.src = url
    } catch { done(empty) }
  })
}
