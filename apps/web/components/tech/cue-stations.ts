/* ─────────────────────────────────────────────────────────────
   ایستگاه‌های آناتومیِ چوب — فقط داده.

   ⚠️ این فهرست پیش از این کنارِ یک کامپوننتِ SVG زندگی می‌کرد. آن
   SVG حذف شد (رندرِ سه‌بعدیِ واقعی جایش را گرفت) ولی خودِ داده هنوز
   لازم است: هر ایستگاه به خدماتِ *واقعیِ* کاتالوگ گره خورده و هر ده
   خدمتِ دسته‌ی «تعمیرات چوب» این‌جا جا دارند.

   ⚠️ `id` عیناً نامِ فایلِ رندر است (`/images/cue/<id>.webp`). اگر
   عوض شد، `scripts/prerender-cue.mjs` هم باید عوض شود.
   ───────────────────────────────────────────────────────────── */

export interface CueStation {
  id: string
  /** نامِ فارسیِ قطعه */
  label: string
  /** برچسبِ فنیِ لاتین — ریزنویس، نه تیتر */
  latin: string
  /** شناسه‌ی خدماتِ کاتالوگ که روی این قطعه انجام می‌شوند */
  serviceIds: readonly string[]
}

/* ترتیب از بات به تیپ — همان جهتی که چشمِ فارسی‌زبان می‌خواند */
export const CUE_STATIONS = [
  { id: 'butt',    label: 'بات',   latin: 'BUTT',    serviceIds: ['butt-resize', 'weight', 'balance', 'extension'] },
  { id: 'joint',   label: 'جوینت', latin: 'JOINT',   serviceIds: ['joint'] },
  { id: 'shaft',   label: 'شفت',   latin: 'SHAFT',   serviceIds: ['straighten', 'full-service'] },
  { id: 'ferrule', label: 'فرول',  latin: 'FERRULE', serviceIds: ['ferrule-replace', 'ferrule-resize'] },
  { id: 'tip',     label: 'تیپ',   latin: 'TIP',     serviceIds: ['tip-replace'] },
] as const satisfies readonly CueStation[]
