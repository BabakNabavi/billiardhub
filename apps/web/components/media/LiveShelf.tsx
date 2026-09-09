'use client'

/* ─────────────────────────────────────────────────────────────
   پخش زنده در بیلیارد مدیا.

   ⚠️ داده از همان سیستمی می‌آید که از قبل روی سایت کار می‌کند
   (`/api/live`): جلسه‌ی زنده‌ی باشگاه‌ها با ضربان واقعی. جدول
   تازه‌ای ساخته نشد و هیچ جلسه‌ای شبیه‌سازی نمی‌شود.

   ⚠️ شمار بیننده *واقعی* است — خود پخش‌کننده در هر ضربان می‌فرستد.
   اگر صفر بود نشان داده نمی‌شود.

   ⚠️ اگر هیچ جلسه‌ی زنده‌ای نباشد، این بخش اصلا رندر نمی‌شود.
   «پخش زنده: موردی نیست» یک قفسه‌ی خالی است، نه اطلاعات.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Radio } from 'lucide-react'
import { fetchLiveSessions, type LiveSession } from '../../lib/live/client'
import { toFaDigits } from '../../lib/jalali'

/* ⚠️ جلسه با نفرستادن ضربان کهنه می‌شود، پس فهرست باید تازه بماند.
   ۳۰ ثانیه — نصف پنجره‌ی کهنگی سرور (۴۵ ثانیه). */
const REFRESH_MS = 30_000

export default function LiveShelf() {
  const [rows, setRows] = useState<LiveSession[]>([])

  useEffect(() => {
    let alive = true
    const load = async () => {
      const r = await fetchLiveSessions()
      if (alive) setRows(r.filter(s => !s.ended))
    }
    /* ⚠️ در تب پنهان نظرسنجی نکن. هر فراخوانی روی سرور یک
       فهرست‌گیری Storage به‌علاوه‌ی تا ۲۰۰ خواندن فایل است؛ تیک‌زدن
       آن در تبی که کسی نمی‌بیند، هزینه‌ی سرور و باتری گوشی است.
       با برگشتن کاربر بلافاصله تازه می‌شود. */
    const tick = () => { if (document.visibilityState === 'visible') void load() }
    tick()
    const t = window.setInterval(tick, REFRESH_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      alive = false
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  if (rows.length === 0) return null

  return (
    <section className="mx-sec" aria-labelledby="mx-live">
      <div className="mx-sec-hd">
        <h2 id="mx-live">
          <span className="mx-livedot" aria-hidden />
          پخش زنده
        </h2>
        <Link className="mx-all" href="/live">مشاهده همه</Link>
      </div>
      <div className="mx-shelf mx-shelf--h">
        {rows.map(s => (
          <Link key={s.id} className="mx-livecard" href={`/live/${encodeURIComponent(s.id)}`}>
            <span className="mx-livebadge"><Radio size={12} aria-hidden /> زنده</span>
            <h3>{s.title || s.clubName}</h3>
            <p>{s.clubName}</p>
            {/* ⚠️ عدد فقط وقتی می‌آید که واقعا بیننده‌ای ثبت شده باشد */}
            {s.viewers > 0 && <p className="mx-liveviewers">{toFaDigits(s.viewers)} بیننده</p>}
          </Link>
        ))}
      </div>
    </section>
  )
}
