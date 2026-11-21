import type { ReactNode } from 'react'
import { faNum } from '@/lib/jalali'

/* اجزای مشترکِ دو کارتِ صفحه‌ی /app (اندروید و آیفون).
   برجسته‌شدنِ کارتِ مناسب با `group-data-[os=…]/os` از DeviceHint می‌آید —
   گروهِ نام‌دار تا هاورِ گروهیِ بی‌نامی داخلِ کارت با کلِ شبکه درگیر نشود.
   فقط حلقه و برچسب، نه جابه‌جایی: هیچ‌کدام چیدمان را تکان نمی‌دهد.
   کلاس‌ها کامل نوشته شده‌اند تا Tailwind پیدایشان کند. */

const CARD_BASE = 'flex flex-col gap-6 rounded-panel bg-surface p-6 shadow-e1 ring-gold/40'

export const CARD_CLASS = {
  android: `${CARD_BASE} group-data-[os=android]/os:ring-2`,
  ios: `${CARD_BASE} group-data-[os=ios]/os:ring-2`,
} as const

const BADGE_CLASS = {
  android: 'hidden group-data-[os=android]/os:inline-flex',
  ios: 'hidden group-data-[os=ios]/os:inline-flex',
} as const

/** عنوانِ کارت؛ `id` همان است که article با aria-labelledby به آن اشاره می‌کند */
export function CardHead({ os, title, desc }: { os: 'android' | 'ios'; title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id={`app-${os}`} className="text-section">{title}</h2>
        <span className={`${BADGE_CLASS[os]} items-center rounded-full bg-gold/[.12] px-3 text-body font-bold text-gold-text`}>
          مناسب گوشی شما
        </span>
      </div>
      <p className="text-body text-ink-2">{desc}</p>
    </div>
  )
}

export interface Step {
  text: string
  icon?: ReactNode
}

/** فهرستِ شماره‌دارِ مراحل؛ شماره‌ها فارسی و فقط تزئینی‌اند (خودِ ol شماره دارد).
 *  role="list" چون list-style: noneِ preflight معنای فهرست را در VoiceOverِ سافاری می‌گیرد */
export function StepList({ steps }: { steps: readonly Step[] }) {
  return (
    <ol role="list" className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <li key={s.text} className="flex items-center gap-3">
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/[.12] text-body font-bold text-gold-text">
            {faNum(i + 1)}
          </span>
          <span className="min-w-0 flex-1 text-body">{s.text}</span>
          {s.icon && (
            <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-field border border-line/10 text-ink-2">
              {s.icon}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}
