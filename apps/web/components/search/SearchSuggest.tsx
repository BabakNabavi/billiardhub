'use client'

/* ─────────────────────────────────────────────────────────────
   پیشنهادِ زنده زیرِ کادرِ جست‌وجوی نوار.

   با تایپ (دست‌کم دو حرف، ۲۲۰ میلی‌ثانیه پس از آخرین کلید) از
   `/api/search/suggest` می‌خواند: بازیکنِ رنکینگ با رده، رتبه و امتیاز؛
   مربی و داور و فروشگاه؛ باشگاه؛ مسابقه. Enter همچنان صفحه‌ی کاملِ
   `/search` است و پایینِ فهرست هم لینکش هست.

   درخواستِ قبلی با هر کلیدِ تازه لغو می‌شود — روی شبکه‌ی کند، جوابِ
   «مح» نباید بعد از جوابِ «محمد» برسد و آن را بپوشاند.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { GROUP_META, Thumb } from '@/components/search/SearchResults'
import { MIN_QUERY } from '@/lib/search/match'
import { faNum } from '@/lib/jalali'
import type { SuggestHit } from '@/lib/search/types'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; q: string; hits: SuggestHit[] }
  | { kind: 'error' }

interface Props {
  q: string
  /** بعد از انتخابِ یک نتیجه — نوار کادر را خالی و بسته می‌کند */
  onPick: () => void
  /** شناسه‌ی فهرست — کادرِ نوار با `aria-controls` به آن اشاره می‌کند */
  id: string
  className?: string
}

export function SearchSuggest({ q, onPick, id, className = '' }: Props) {
  const term = q.trim()
  const [state, setState] = useState<State>({ kind: 'idle' })
  /* بسته‌شدن برای *همین* عبارت — تایپِ بعدی خودبه‌خود دوباره باز می‌کند */
  const [dismissedFor, setDismissedFor] = useState<string | null>(null)
  const dismissed = dismissedFor === term
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (term.replace(/\s/g, '').length < MIN_QUERY) { setState({ kind: 'idle' }); return }
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setState({ kind: 'loading' })
      try {
        const r = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        if (!r.ok) throw new Error(`suggest ${r.status}`)
        const j = (await r.json()) as { hits?: SuggestHit[] }
        setState({ kind: 'done', q: term, hits: j.hits ?? [] })
      } catch (e) {
        if (ctrl.signal.aborted) return
        console.error('[suggest]', e)
        setState({ kind: 'error' })
      }
    }, 220)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [term])

  /* بسته‌شدن: کلیک بیرونِ کادر و فهرست، Escape، یا رفتنِ فوکوس با Tab به بیرون.
     پیمایش: ↓ از کادر به اولین نتیجه، ↑/↓ بینِ نتیجه‌ها، ↑ از اولی به کادر. */
  useEffect(() => {
    if (state.kind === 'idle' || dismissed) return
    /* قاب = کادر و فهرست با هم (`data-suggest-box`)؛ کلیک روی خودِ کادر نبندد */
    const box = rootRef.current?.closest<HTMLElement>('[data-suggest-box]') ?? rootRef.current?.parentElement
    if (!box) return
    const close = () => setDismissedFor(term)
    const onDown = (e: PointerEvent) => { if (!box.contains(e.target as Node)) close() }
    const onOut = (e: FocusEvent) => { if (e.relatedTarget && !box.contains(e.relatedTarget as Node)) close() }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      const links = [...(rootRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])]
      if (links.length === 0) return
      const i = links.indexOf(document.activeElement as HTMLAnchorElement)
      const input = box.querySelector<HTMLInputElement>('input[name="q"]')
      e.preventDefault()
      if (e.key === 'ArrowDown') links[Math.min(i + 1, links.length - 1)]?.focus()
      else if (i <= 0) input?.focus()
      else links[i - 1]?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    box.addEventListener('focusout', onOut)
    box.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      box.removeEventListener('focusout', onOut)
      box.removeEventListener('keydown', onKey)
    }
  }, [state.kind, dismissed, term])

  const open = state.kind !== 'idle' && !dismissed
  /* اعلامِ صفحه‌خوان — همیشه سوار، تا تغییرِ متن خوانده شود */
  const announce = !open ? ''
    : state.kind === 'done' ? (state.hits.length ? `${faNum(state.hits.length)} پیشنهاد؛ با کلیدِ پایین بروید` : 'پیشنهادی پیدا نشد')
    : state.kind === 'error' ? 'جست‌وجو جواب نداد' : ''

  return (
    <>
    <span role="status" aria-live="polite" className="sr-only">{announce}</span>
    {open && (
    <div ref={rootRef} className={`absolute top-full z-50 mt-2 overflow-hidden rounded-card border border-line/10 bg-surface shadow-lg ${className}`}>
      {state.kind === 'loading' && (
        <ul aria-hidden className="m-0 list-none p-2">
          {[0, 1, 2].map(i => (
            <li key={i} className="flex items-center gap-3 p-2">
              <span className="size-12 shrink-0 animate-pulse rounded-card bg-mist" />
              <span className="flex flex-1 flex-col gap-2">
                <span className="h-3 w-1/2 animate-pulse rounded bg-mist" />
                <span className="h-3 w-3/4 animate-pulse rounded bg-mist" />
              </span>
            </li>
          ))}
        </ul>
      )}

      {state.kind === 'error' && (
        <p className="m-0 p-4 text-sub text-danger-ink">جست‌وجو الان جواب نداد. Enter را بزنید تا صفحه‌ی نتیجه باز شود.</p>
      )}

      {state.kind === 'done' && state.hits.length === 0 && (
        <p className="m-0 p-4 text-sub text-ink-2">برای «{state.q}» در بازیکنان، افراد و باشگاه‌ها چیزی پیدا نشد.</p>
      )}

      {state.kind === 'done' && state.hits.length > 0 && (
        /* کم‌رنگ تا جوابِ عبارتِ تازه برسد — فهرستِ کهنه زیرِ «همه‌ی نتیجه‌ها برای …»ِ تازه گمراه می‌کرد.
           ارتفاعِ موبایل کمتر: زیرِ پیلِ بالا و با کیبوردِ باز، فهرستِ بلند پشتِ کیبورد می‌رفت. */
        <ul id={id} aria-label="پیشنهادها" className={`m-0 max-h-64 list-none overflow-y-auto overscroll-contain p-2 transition-opacity sm:max-h-96 ${state.q !== term ? 'opacity-60' : ''}`}>
          {state.hits.map(h => {
            const meta = GROUP_META[h.key]
            return (
              <li key={h.href}>
                <Link href={h.href} prefetch={false} onClick={onPick}
                  className="flex items-center gap-3 rounded-field p-2 text-inherit no-underline hover:bg-mist
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
                  <Thumb image={h.image} Icon={meta.Icon} rank={h.rank} />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-body font-bold text-ink">{h.title}</span>
                    <span className="truncate text-sub text-ink-2">{h.sub || meta.label}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {state.kind !== 'loading' && (
        <Link href={`/search?q=${encodeURIComponent(term)}`} prefetch={false} onClick={onPick}
          className="flex min-h-11 items-center justify-between gap-2 border-t border-line/10 px-4 text-sub font-bold text-gold-text no-underline
                     hover:bg-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-deep">
          همه‌ی نتیجه‌ها برای «{term}»
          <ArrowLeft size={14} aria-hidden />
        </Link>
      )}
    </div>
    )}
    </>
  )
}
