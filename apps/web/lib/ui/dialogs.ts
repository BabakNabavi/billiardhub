'use client'

/* ─────────────────────────────────────────────────────────────
   سرویس پنجره‌ها — جایگزین `window.confirm` و `window.alert`.

   ── چرا سرویس سراسری و نه کامپوننت در هر صفحه ──
   هجده جای سایت این دو را صدا می‌زدند، همه داخل توابع async و
   بیشترشان به این شکل:

       if (!confirm('…')) return

   اگر جایگزین یک کامپوننت حالت‌دار باشد، هر هجده جا باید به دو
   تکه شکسته شود و هر کدام یک ظرف JSX هم لازم دارد — هجده فرصت
   تازه برای باگ، آن هم در مسیرهایی که کار برگشت‌ناپذیر می‌کنند.

   این‌جا `ask()` یک Promise می‌دهد، پس همان خط می‌شود:

       if (!(await ask('…'))) return

   ترتیب اجرا دست‌نخورده می‌ماند و هیچ صفحه‌ای JSX تازه نمی‌خواهد.
   پنجره یک‌بار در `layout` سوار می‌شود.
   ───────────────────────────────────────────────────────────── */

export type Tone = 'danger' | 'gold' | 'ok'

export interface AskOptions {
  body?: string
  confirmLabel?: string
  tone?: Tone
}

/* پنجره‌ی اطلاع‌رسانی — یک دکمه، بدونِ انتخاب.
   ⚠️ جدا از `ask` است و نه یک حالتِ آن: پنجره‌ی پرسش دو دکمه دارد
   («انصراف»/«تأیید») و برای پیامی که چیزی برای تصمیم‌گرفتن ندارد،
   دکمه‌ی انصراف یعنی «اگر انصراف بدهم چه می‌شود؟» — سوالی که پاسخ
   ندارد. */
export interface AlertState {
  title: string
  body?: string
  tone: Tone
  okLabel: string
  resolve: () => void
}

export interface DialogState {
  ask: (AskOptions & { title: string; resolve: (ok: boolean) => void }) | null
  /* پرسش متنی — جایگزین `window.prompt`. `null` یعنی انصراف. */
  /* `allowEmpty`: مقدارِ خالی هم نتیجه‌ی معتبری است (پاک‌کردنِ کپشن).
     `initial`: متنِ فعلی، تا ویرایش یعنی اصلاح نه تایپِ دوباره.
     `tone`: هر پرسشِ متنی ویرانگر نیست. */
  text: {
    title: string; body?: string; placeholder?: string; confirmLabel: string
    allowEmpty?: boolean; initial?: string; tone?: 'gold' | 'danger'
    resolve: (v: string | null) => void
  } | null
  alert: AlertState | null
  toast: { msg: string; tone: Tone; id: number } | null
}

let state: DialogState = { ask: null, text: null, alert: null, toast: null }
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

/** پرسش تأیید. `true` یعنی کاربر تأیید کرد. */
export function ask(title: string, opts: AskOptions = {}): Promise<boolean> {
  /* روی سرور پنجره‌ای در کار نیست؛ «نه» امن‌ترین پاسخ است چون هیچ
     کار برگشت‌ناپذیری بی‌اجازه انجام نمی‌شود. */
  if (typeof window === 'undefined') return Promise.resolve(false)
  /* ⚠️ پرسشِ باز پیش از جایگزینی تعیین‌تکلیف می‌شود، وگرنه
     `await ask()`ِ فراخوانِ قبلی تا ابد معلق می‌ماند. «نه» همان
     پاسخِ امنی است که این تابع روی سرور هم می‌دهد. */
  state.ask?.resolve(false)
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

/** پاسخ کاربر — فقط `DialogHost` صدایش می‌زند */
export function resolveAsk(ok: boolean) {
  const cur = state.ask
  emit({ ask: null })
  cur?.resolve(ok)
}

/* ── پیامِ مسدودکننده ──
   ⚠️ چرا پنجره و نه `notify`: پیامِ کوتاه پایینِ صفحه می‌نشیند و
   خودش می‌رود؛ برای «چرا ذخیره نشد» کافی نیست. مالک گزارش داد که
   خطای کنارِ فیلد را نمی‌بیند و مجبور است کلِ صفحه را بالا و پایین
   کند تا بفهمد کجا اشتباه شده. این پنجره وسطِ صفحه می‌آید و تا
   بسته نشود نمی‌رود.

   Promise برمی‌گرداند تا فراخوان بتواند منتظرِ بسته‌شدنش بماند —
   مثلا پیش از فوکوس‌دادن به فیلدِ ناقص. */
/* ── صف ──
   ⚠️ بدونِ صف، پیامِ دوم پیامِ اول را بی‌صدا جایگزین می‌کرد: کاربر
   اولی را هرگز نمی‌دید و Promiseی که برایش ساخته شده بود تا ابد
   معلق می‌ماند. روی همین پنل سه منبعِ ناهمگام هست (استعلامِ کد
   پستی، موقعیت مکانی، و خودِ ذخیره) که می‌توانند روی هم بیفتند —
   و «گم‌شدنِ پیامِ خطا» دقیقا همان چیزی است که این پنجره برای
   رفعش ساخته شد. */
const alertQueue: AlertState[] = []

export function alertBox(
  title: string,
  opts: { body?: string; tone?: Tone; okLabel?: string } = {},
): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  return new Promise<void>(resolve => {
    const next: AlertState = {
      title,
      body: opts.body,
      tone: opts.tone ?? 'danger',
      okLabel: opts.okLabel ?? 'باشه',
      resolve,
    }
    /* پیامِ تکراری دو بار نشان داده نمی‌شود — دو مسیر می‌توانند به
       یک علت برسند. */
    const same = (a: AlertState) => a.title === next.title && a.body === next.body
    if (state.alert && same(state.alert)) { resolve(); return }
    if (alertQueue.some(same)) { resolve(); return }
    if (state.alert) { alertQueue.push(next); return }
    emit({ alert: next })
  })
}

/** بسته‌شدن — فقط `DialogHost` صدایش می‌زند */
export function resolveAlert() {
  const cur = state.alert
  const next = alertQueue.shift() ?? null
  emit({ alert: next })
  cur?.resolve()
}

let toastId = 0
/** پیام کوتاه. برخلاف `alert` جریان را متوقف نمی‌کند. */
export function notify(msg: string, tone: Tone = 'danger') {
  if (typeof window === 'undefined') return
  emit({ toast: { msg, tone, id: ++toastId } })
}

export function clearToast() { emit({ toast: null }) }

/** پرسش متنی — جایگزین `window.prompt`. `null` یعنی انصراف. */
export function askText(
  title: string,
  opts: {
    body?: string; placeholder?: string; confirmLabel?: string
    /** خالی هم نتیجه است — برای پاک‌کردنِ کپشن یا بیرون‌آوردن از آلبوم */
    allowEmpty?: boolean
    /** متنِ فعلی که در کادر می‌نشیند */
    initial?: string
    tone?: 'gold' | 'danger'
  } = {},
): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  /* همان دلیلِ `ask`؛ `null` یعنی «انصراف»، پس چیزی ثبت نمی‌شود. */
  state.text?.resolve(null)
  return new Promise<string | null>(resolve => {
    emit({
      text: {
        title, body: opts.body, placeholder: opts.placeholder,
        confirmLabel: opts.confirmLabel ?? 'تأیید',
        allowEmpty: opts.allowEmpty, initial: opts.initial, tone: opts.tone,
        resolve,
      },
    })
  })
}

export function resolveText(v: string | null) {
  const cur = state.text
  emit({ text: null })
  cur?.resolve(v)
}
