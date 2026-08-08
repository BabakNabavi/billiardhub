'use client'

/* ─────────────────────────────────────────────────────────────
   سرویسِ پنجره‌ها — جایگزینِ `window.confirm` و `window.alert`.

   ── چرا سرویسِ سراسری و نه کامپوننت در هر صفحه ──
   هجده جای سایت این دو را صدا می‌زدند، همه داخلِ توابعِ async و
   بیشترشان به این شکل:

       if (!confirm('…')) return

   اگر جایگزین یک کامپوننتِ حالت‌دار باشد، هر هجده جا باید به دو
   تکه شکسته شود و هر کدام یک ظرفِ JSX هم لازم دارد — هجده فرصتِ
   تازه برای باگ، آن هم در مسیرهایی که کارِ برگشت‌ناپذیر می‌کنند.

   این‌جا `ask()` یک Promise می‌دهد، پس همان خط می‌شود:

       if (!(await ask('…'))) return

   ترتیبِ اجرا دست‌نخورده می‌ماند و هیچ صفحه‌ای JSX تازه نمی‌خواهد.
   پنجره یک‌بار در `layout` سوار می‌شود.
   ───────────────────────────────────────────────────────────── */

export type Tone = 'danger' | 'gold' | 'ok'

export interface AskOptions {
  body?: string
  confirmLabel?: string
  tone?: Tone
}

export interface DialogState {
  ask: (AskOptions & { title: string; resolve: (ok: boolean) => void }) | null
  /* پرسشِ متنی — جایگزینِ `window.prompt`. `null` یعنی انصراف. */
  text: { title: string; body?: string; placeholder?: string; confirmLabel: string; resolve: (v: string | null) => void } | null
  toast: { msg: string; tone: Tone; id: number } | null
}

let state: DialogState = { ask: null, text: null, toast: null }
const listeners = new Set<(s: DialogState) => void>()

function emit(next: Partial<DialogState>) {
  state = { ...state, ...next }
  listeners.forEach(l => l(state))
}

export function subscribe(l: (s: DialogState) => void): () => void {
  listeners.add(l)
  l(state)
  return () => { listeners.delete(l) }
}

/** پرسشِ تأیید. `true` یعنی کاربر تأیید کرد. */
export function ask(title: string, opts: AskOptions = {}): Promise<boolean> {
  /* روی سرور پنجره‌ای در کار نیست؛ «نه» امن‌ترین پاسخ است چون هیچ
     کارِ برگشت‌ناپذیری بی‌اجازه انجام نمی‌شود. */
  if (typeof window === 'undefined') return Promise.resolve(false)
  return new Promise<boolean>(resolve => {
    emit({
      ask: {
        title,
        body: opts.body,
        confirmLabel: opts.confirmLabel ?? 'تأیید',
        tone: opts.tone ?? 'danger',
        resolve,
      },
    })
  })
}

/** پاسخِ کاربر — فقط `DialogHost` صدایش می‌زند */
export function resolveAsk(ok: boolean) {
  const cur = state.ask
  emit({ ask: null })
  cur?.resolve(ok)
}

let toastId = 0
/** پیامِ کوتاه. برخلافِ `alert` جریان را متوقف نمی‌کند. */
export function notify(msg: string, tone: Tone = 'danger') {
  if (typeof window === 'undefined') return
  emit({ toast: { msg, tone, id: ++toastId } })
}

export function clearToast() { emit({ toast: null }) }

/** پرسشِ متنی — جایگزینِ `window.prompt`. `null` یعنی انصراف. */
export function askText(
  title: string, opts: { body?: string; placeholder?: string; confirmLabel?: string } = {},
): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  return new Promise<string | null>(resolve => {
    emit({
      text: {
        title, body: opts.body, placeholder: opts.placeholder,
        confirmLabel: opts.confirmLabel ?? 'تأیید', resolve,
      },
    })
  })
}

export function resolveText(v: string | null) {
  const cur = state.text
  emit({ text: null })
  cur?.resolve(v)
}
