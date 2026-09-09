'use client'

/* ─────────────────────────────────────────────────────────────
   نوار جست‌وجوی بیلیارد مدیا — با مکانیزم یوتوب.

   چیزهایی که یوتوب می‌کند و این‌جا هم هست:
     · با هر حرف (از دو حرف به بالا) پیشنهاد می‌آید، نه بعد از Enter
     · درخواست‌ها debounce می‌شوند تا هر کلید یک درخواست نزند
     · پاسخ کهنه دور ریخته می‌شود؛ فقط آخرین درخواست می‌نویسد
     · بالا/پایین بین پیشنهادها، Enter انتخاب، Escape بستن
     · بخشی از عبارت که تایپ شده در پیشنهاد پررنگ می‌شود
     · تاریخچه جست‌وجوی همین مرورگر بالای فهرست می‌آید و پاک‌شدنی است
     · انتخاب کانال مستقیم به صفحه کانال می‌رود، نه به نتایج

   ⚠️ «ترندهای جست‌وجو» ساخته نشد: چنین داده‌ای وجود ندارد و
   ساختنش یعنی فهرستی از عبارت‌های خیالی.

   ⚠️ تاریخچه در localStorage همین دستگاه است — داده واقعی خود
   کاربر، نه پیشنهاد جعلی سرور.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, Hash, User, Play } from 'lucide-react'

interface Suggestion {
  kind: 'video' | 'channel' | 'tag' | 'history'
  text: string
  key?: string
}

const HIST_KEY = 'bh:media:searches'
const HIST_MAX = 8
const DEBOUNCE_MS = 160

const readHist = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(HIST_KEY) ?? '[]') as unknown
    return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, HIST_MAX) : []
  } catch { return [] }
}
const pushHist = (t: string) => {
  try {
    const next = [t, ...readHist().filter(x => x !== t)].slice(0, HIST_MAX)
    localStorage.setItem(HIST_KEY, JSON.stringify(next))
  } catch { /* حالت خصوصی */ }
}

/* بخش تایپ‌شده را پررنگ می‌کند — همان کاری که یوتوب در پیشنهادها
   می‌کند و کمک می‌کند کاربر تفاوت را ببیند. */
function Mark({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <b>{text.slice(i, i + q.length)}</b>
      {text.slice(i + q.length)}
    </>
  )
}

const ICON = {
  history: Clock, video: Play, channel: User, tag: Hash,
} as const

export default function SearchBox({ initial = '' }: { initial?: string }) {
  const router = useRouter()
  const [q, setQ] = useState(initial)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Suggestion[]>([])
  const [hist, setHist] = useState<string[]>([])
  const [active, setActive] = useState(-1)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setQ(initial) }, [initial])
  useEffect(() => { setHist(readHist()) }, [])

  /* ⚠️ شماره درخواست: تایپ سریع یعنی چند درخواست هم‌زمان و پاسخ‌ها
     لزوما به ترتیب نمی‌رسند. بدون این، پیشنهاد «اسنو» می‌توانست روی
     پیشنهاد «اسنوکر» بنشیند. */
  const reqId = useRef(0)

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setItems([]); return }
    const id = ++reqId.current
    const t = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/media/suggest?q=${encodeURIComponent(term)}`, { cache: 'no-store' })
        const j = await r.json() as { items?: Suggestion[] }
        if (id === reqId.current) setItems(j.items ?? [])
      } catch { /* پیشنهاد نیامد — تایپ ادامه دارد */ }
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  /* تاریخچه فقط وقتی جعبه خالی است — مثل یوتوب */
  const rows: Suggestion[] = useMemo(() => {
    if (q.trim().length >= 2) return items
    return hist.map(h => ({ kind: 'history' as const, text: h }))
  }, [q, items, hist])

  const go = useCallback((s: Suggestion) => {
    setOpen(false)
    setActive(-1)
    if (s.kind === 'channel' && s.key) {
      router.push(`/media/channel/${encodeURIComponent(s.key)}`)
      return
    }
    if (s.kind === 'video' && s.key) {
      pushHist(s.text); setHist(readHist())
      router.push(`/media/${encodeURIComponent(s.key)}`)
      return
    }
    pushHist(s.text); setHist(readHist())
    setQ(s.text)
    router.push(`/media?q=${encodeURIComponent(s.text)}`)
  }, [router])

  const submit = () => {
    const term = q.trim()
    if (!term) return
    pushHist(term); setHist(readHist())
    setOpen(false); setActive(-1)
    router.push(`/media?q=${encodeURIComponent(term)}`)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setActive(-1); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setOpen(true)
      setActive(a => Math.min(a + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => Math.max(a - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const s = rows[active]
      if (active >= 0 && s) go(s)
      else submit()
    }
  }

  const clearHist = () => {
    try { localStorage.removeItem(HIST_KEY) } catch { /* بی‌اهمیت */ }
    setHist([])
  }

  return (
    <div className="mx-search" ref={boxRef}>
      <form
        className="mx-search-form" role="search"
        onSubmit={e => { e.preventDefault(); submit() }}
      >
        <div className="mx-search-box">
          <label className="mx-sr-only" htmlFor="mx-q">جست‌وجو در ویدیوها</label>
          <input
            ref={inputRef} id="mx-q" type="search" value={q}
            onChange={e => { setQ(e.target.value); setOpen(true); setActive(-1) }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder="جست‌وجوی ویدیو، بازیکن، مسابقه یا کانال…"
            autoComplete="off"
            role="combobox" aria-expanded={open && rows.length > 0}
            aria-controls="mx-suggest" aria-autocomplete="list"
          />
          {q !== '' && (
            <button
              type="button" className="mx-search-clear" aria-label="پاک کردن"
              onClick={() => { setQ(''); setItems([]); inputRef.current?.focus() }}
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>
        <button className="mx-search-go" type="submit" aria-label="جست‌وجو">
          <Search size={17} aria-hidden />
        </button>
      </form>

      {open && rows.length > 0 && (
        <div className="mx-suggest" id="mx-suggest" role="listbox">
          {rows.map((s, i) => {
            const Icon = ICON[s.kind]
            return (
              <button
                key={s.kind + s.text} type="button" role="option"
                aria-selected={i === active}
                className={'mx-sg' + (i === active ? ' is-active' : '')}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(s)}
              >
                <Icon size={15} aria-hidden />
                <span className="mx-sg-t"><Mark text={s.text} q={q.trim()} /></span>
                {s.kind === 'channel' && <span className="mx-sg-k">کانال</span>}
                {s.kind === 'tag' && <span className="mx-sg-k">برچسب</span>}
              </button>
            )
          })}

          {rows[0]?.kind === 'history' && (
            <button type="button" className="mx-sg-clear" onClick={clearHist}>
              پاک کردن تاریخچه جست‌وجو
            </button>
          )}
        </div>
      )}
    </div>
  )
}
