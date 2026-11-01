'use client'

/* آرشیوِ ضبط‌های یک کانال — کلیک روی هر مورد، همان‌جا پخشش می‌کند. */

import { useState } from 'react'
import { Film, PlayCircle } from 'lucide-react'
import { faDateTime } from '@/lib/jalali'
import type { ArchiveItem } from '@/lib/streaming/public-types'
import { HlsPlayer } from './HlsPlayer'

type ArchiveEntry = Pick<ArchiveItem, 'id' | 'title' | 'startedAt' | 'recordingUrl'>

export function ArchiveList({ items }: { items: ArchiveEntry[] }) {
  const [playing, setPlaying] = useState<ArchiveEntry | null>(null)

  if (items.length === 0) return (
    <p className="flex items-center gap-2 rounded-card bg-ink/[.03] px-4 py-6 text-sub text-ink-3">
      <Film className="h-4 w-4" aria-hidden /> هنوز ضبطی از این کانال در آرشیو نیست
    </p>
  )

  return (
    <div className="flex flex-col gap-4">
      {playing && <HlsPlayer key={playing.id} src={playing.recordingUrl} live={false} title={playing.title} />}
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map(it => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => setPlaying(it)}
              aria-pressed={playing?.id === it.id}
              className="flex min-h-11 w-full items-center gap-3 rounded-card border border-line/10 bg-surface px-4 py-3 text-start transition-colors hover:border-gold/40 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep aria-pressed:border-gold/50"
            >
              <PlayCircle className="h-5 w-5 shrink-0 text-gold-text" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate text-sub font-bold text-ink">{it.title}</span>
                <span className="block text-meta text-ink-3">{faDateTime(it.startedAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
