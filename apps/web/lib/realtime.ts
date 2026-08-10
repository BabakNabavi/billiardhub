'use client'
import type { DMsg } from './social'

/* باید دقیقاً با safeKey/dmTopic سمت‌سرور یکی باشد. */
const topicOf = (key: string) => `dm-user-${(key || 'x').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80)}`

export interface MsgEvent { convId: string; message: DMsg; from: { key: string; name: string; role?: string } }
export interface ReadEvent { convId: string; reader: string; at: number }
export interface PollEvent { convId: string; at: number }

export interface DMHandlers {
  onMsg?: (p: MsgEvent) => void
  onRead?: (p: ReadEvent) => void
  onPoll?: (p: PollEvent) => void   // حضور طرف مقابل ⇒ تیک «رسیده»ی آنی
  onStatus?: (s: string) => void
}

/* اشتراک به کانال دایرکت خودم؛ تابع لغو برمی‌گرداند.

   ── چرا کتابخانه پویا وارد می‌شود ──
   `Navbar` این تابع را صدا می‌زند و `Navbar` در هر صفحه‌ی سایت است.
   با `import` ایستا، کلِ `@supabase/supabase-js` (۲۰۱ کیلوبایتِ خام)
   در باندلِ **هر صفحه** می‌نشست — حتی برای بازدیدکننده‌ای که وارد
   نشده و هیچ دایرکتی ندارد.

   امضای تابع عمداً همگام مانده تا هیچ فراخوانی عوض نشود: تابعِ لغو
   همان لحظه برمی‌گردد و اگر اشتراک هنوز برقرار نشده باشد، پرچمِ
   `cancelled` جلوی برقرارشدنش را می‌گیرد. */
export function subscribeDM(meKey: string, h: DMHandlers): () => void {
  if (!meKey) return () => {}

  let stop: (() => void) | null = null
  let cancelled = false

  void (async () => {
    const { getSupabaseBrowser } = await import('./supabase-browser')
    const sb = getSupabaseBrowser()
    if (!sb || cancelled) return

    const ch = sb.channel(topicOf(meKey), { config: { broadcast: { self: false } } })
    if (h.onMsg) ch.on('broadcast', { event: 'msg' }, (p: { payload: MsgEvent }) => h.onMsg!(p.payload))
    if (h.onRead) ch.on('broadcast', { event: 'read' }, (p: { payload: ReadEvent }) => h.onRead!(p.payload))
    if (h.onPoll) ch.on('broadcast', { event: 'poll' }, (p: { payload: PollEvent }) => h.onPoll!(p.payload))
    ch.subscribe((status) => { h.onStatus?.(status) })

    stop = () => { try { sb.removeChannel(ch) } catch { /* noop */ } }
    /* اگر بینِ بارگذاری و این‌جا لغو شده باشد، همین حالا می‌بندیم */
    if (cancelled) stop()
  })()

  return () => { cancelled = true; stop?.() }
}
