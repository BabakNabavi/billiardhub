'use client'

/* دکمه‌ی گردِ نیمه‌شفافِ روی تصویرِ استودیو — هدفِ لمسیِ ۴۸ پیکسل */
export function StudioButton({ label, onClick, disabled, pressed, children }: {
  label: string; onClick: () => void; disabled?: boolean
  /** دکمه‌ی دوحالته (بی‌صدا) — برچسب ثابت، وضعیت با aria-pressed */
  pressed?: boolean; children: React.ReactNode
}) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} aria-pressed={pressed}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-35">
      {children}
    </button>
  )
}
