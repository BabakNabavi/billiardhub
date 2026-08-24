'use client'

/* بخشِ کلاینتِ صفحه‌ی کمکیِ رندر.
   ⚠️ فقط ورودیِ `scripts/prerender-cue.mjs` است. جداشدنش از
   `page.tsx` عمدی است: صفحه‌ی سرور می‌تواند `metadata` صادر کند و
   در پروداکشن `notFound()` بدهد؛ یک کامپوننتِ کلاینت هیچ‌کدام را
   نمی‌تواند. */

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CueScene } from '@/components/tech/cue3d/CueScene'
import './stage.css'

function Scene() {
  const q = useSearchParams()
  const n = (k: string, d: number) => {
    const v = Number(q.get(k))
    return q.get(k) !== null && Number.isFinite(v) ? v : d
  }
  return (
    <div className={q.get('bare') === '1' ? 'cue-shot is-bare' : 'cue-shot'}>
      <CueScene view={{
        target: n('target', 7.55), dist: n('dist', 1.15),
        spin: n('spin', 0.5), tilt: n('tilt', -0.2),
      }} />
    </div>
  )
}

export default function Stage() {
  return <Suspense fallback={null}><Scene /></Suspense>
}
