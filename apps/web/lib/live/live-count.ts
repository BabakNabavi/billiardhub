'use client';

import { probeLive } from './client';

/* ─────────────────────────────────────────────────────────────
   «چند پخش زنده در جریان است؟» — یک شمارنده برای کلِ اپ.

   ── چرا سینگلتون ──
   نشانِ نوارِ بالا دو بار mount می‌شود (نسخه‌ی دسکتاپ و موبایل؛ یکی
   فقط با CSS پنهان است). اگر هرکدام تایمرِ خودش را داشت، هر تب دو
   برابر درخواست می‌فرستاد و با هر visibilitychange هم دو تای دیگر.

   این‌جا یک تایمر هست و هر تعداد مشترک. وقتی آخرین مشترک برود تایمر
   خاموش می‌شود.
   ───────────────────────────────────────────────────────────── */

const POLL_MS = 60_000;

let count = 0;
let timer: number | null = null;
const subs = new Set<() => void>();

function emit(next: number): void {
  if (next === count) return;
  count = next;
  subs.forEach(cb => cb());
}

async function tick(): Promise<void> {
  if (typeof document === 'undefined') return;
  /* در تبِ پنهان نپرس — هزینه‌ی سرور و باتریِ گوشی. با برگشتنِ کاربر
     بلافاصله تازه می‌شود. */
  if (document.visibilityState !== 'visible') return;
  emit(await probeLive());
}

function start(): void {
  if (typeof window === 'undefined' || timer !== null) return;
  void tick();
  timer = window.setInterval(() => void tick(), POLL_MS);
  document.addEventListener('visibilitychange', onVisible);
}

function stop(): void {
  if (timer === null) return;
  window.clearInterval(timer);
  timer = null;
  document.removeEventListener('visibilitychange', onVisible);
}

function onVisible(): void { void tick() }

export function subscribeLiveCount(cb: () => void): () => void {
  subs.add(cb);
  start();
  return () => {
    subs.delete(cb);
    if (subs.size === 0) stop();
  };
}

export function getLiveCount(): number { return count }
export function getServerLiveCount(): number { return 0 }
