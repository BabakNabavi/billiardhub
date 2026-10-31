'use client'

/* ─────────────────────────────────────────────────────────────
   کپشنِ استوری با لینکِ لمس‌شدنی — مثلِ اینستاگرام.

   لینک‌های داخلِ متن (`lib/linkify`) تراشه‌ی لینک می‌شوند:
     · لینکِ خودِ سایت ⟵ همان زبانه، استوری بسته می‌شود
     · لینکِ بیرونی    ⟵ زبانه‌ی تازه، `noopener noreferrer nofollow ugc`
       (محتوای کاربر است: نه ارجاع‌دهنده، نه اعتبارِ سئو)
   لمسِ لینک استوری را نگه می‌دارد (`onHold`) تا بیننده که برمی‌گردد،
   استوریِ بعدی جایش نیامده باشد. کپشن بالای نواحیِ لمسِ قبلی/بعدی
   است، پس لمسِ لینک استوری را ورق نمی‌زند.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { Link2 } from 'lucide-react'
import { splitLinks } from '@/lib/linkify'

interface Props {
  text: string
  /** لینکِ داخلی — قبل از ناوبری استوری بسته شود */
  onInternal: () => void
  /** لینکِ بیرونی باز شد — استوری تا بازگشتِ بیننده نگه داشته شود */
  onHold: () => void
}

const CHIP = 'mx-1 inline-flex max-w-full items-center gap-1 rounded-full bg-white/90 px-3 py-1 align-middle text-sm font-bold text-ink no-underline ' +
  'shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40'

export function StoryCaption({ text, onInternal, onHold }: Props) {
  const parts = splitLinks(text)
  return (
    <p className="m-0 whitespace-pre-line text-base font-medium leading-loose text-white">
      {parts.map((p, i) => {
        if (p.kind === 'text') return <span key={i}>{p.text}</span>
        const body = (
          <>
            <Link2 size={14} aria-hidden className="shrink-0" />
            <span dir="ltr" className="min-w-0 truncate">{p.label}</span>
          </>
        )
        return p.internal ? (
          <Link key={i} href={p.href} title={p.label} onClick={e => { e.stopPropagation(); onInternal() }} className={CHIP}>{body}</Link>
        ) : (
          <a key={i} href={p.href} title={p.href} target="_blank" rel="noopener noreferrer nofollow ugc"
            /* Ctrl/Cmd/Shift ⟵ زبانه‌ی پس‌زمینه؛ بیننده همین‌جا می‌ماند، پس نگه نمی‌داریم */
            onClick={e => { e.stopPropagation(); if (!e.metaKey && !e.ctrlKey && !e.shiftKey) onHold() }} className={CHIP}>
            {body}<span className="sr-only"> (در زبانه‌ی تازه)</span>
          </a>
        )
      })}
    </p>
  )
}
