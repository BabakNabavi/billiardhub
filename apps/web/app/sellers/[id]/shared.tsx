/* مشترک بین دو نسخه‌ی صفحه فروشگاه (فلت و شیشه‌ای) */

export const toFa  = (v: string | number) => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
export const faNum = (n: number, dec = 0) => n.toLocaleString('fa-IR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
export const faToEn = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
export const parsePrice = (v: string) => { const n = parseInt(faToEn(v).replace(/[^0-9]/g, ''), 10); return Number.isNaN(n) ? null : n }

/* اعداد و قیمت‌ها: مونو + ارقام هم‌عرض */
export const MONO = 'font-mono [font-variant-numeric:tabular-nums]'

/* ─── طرح LQ: شیشه‌ی کامل (blur + سایه + جاروی نور) ─── */
export const SHEEN =
  "relative overflow-hidden before:content-[''] before:pointer-events-none before:absolute before:inset-0 before:-translate-x-[160%] before:skew-x-[-15deg] before:bg-[linear-gradient(110deg,transparent_40%,rgba(255,255,255,0.55)_50%,transparent_60%)] before:transition-transform before:duration-700 hover:before:translate-x-[200%]"

/* دکمه‌ی LQ — طرح دکمه‌های «مشاهده و رزرو» صفحه‌ی اصلی:
   پس‌زمینه‌ی رنگی محو + بوردر نازک هم‌رنگ + متن هم‌رنگ (بدون سطح توپُر و بدون بلور سنگین).
   رنگ بg/بوردر/متن را واریانت هر دکمه می‌دهد */
export const LQ =
  'border transition-all duration-200 hover:-translate-y-px active:scale-95'

/* دکمه‌ی آیکونی LQ (سطوح خیلی کوچک) */
export const LQI =
  'border border-[#E7E2D6] bg-[rgba(28,24,20,0.03)] transition-all duration-200 hover:bg-[rgba(28,24,20,0.07)] active:scale-95'

/* واریانت‌های LQ — رنگ محو + بوردر نازک + متن هم‌رنگ */
export const LQ_NEUTRAL = 'bg-[rgba(28,24,20,0.04)] border-[#E7E2D6] text-[#1C1B17] hover:bg-[rgba(28,24,20,0.08)]'
export const LQ_FELT    = 'bg-[rgba(20,83,45,0.10)] border-[rgba(20,83,45,0.32)] text-[#14532D] hover:bg-[rgba(20,83,45,0.16)]'
export const LQ_FELT_ON = 'bg-[rgba(20,83,45,0.18)] border-[rgba(20,83,45,0.42)] text-[#14532D] ring-1 ring-[rgba(20,83,45,0.20)]'
export const LQ_GREEN   = 'bg-[rgba(37,211,102,0.12)] border-[rgba(37,211,102,0.34)] text-[#0E7A38] hover:bg-[rgba(37,211,102,0.20)]'

export const toggleSet = <T,>(set: Set<T>, v: T): Set<T> => {
  const next = new Set(set)
  if (next.has(v)) next.delete(v); else next.add(v)
  return next
}

export function Stars({ r }: { r: number }) {
  return (
    <span className="tracking-tight text-[#D9A441]" aria-hidden="true">
      {'★★★★★'.slice(0, Math.round(r))}
      <span className="opacity-25">{'★★★★★'.slice(Math.round(r))}</span>
    </span>
  )
}

export const Icon = {
  search:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  /* قلب — مسیرِ امروزیِ lucide (به‌جای مسیر قدیمیِ گرد و کلفت). دو حالت: توپر و خطی */
  heart:   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
  heartO:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
  pin:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  /* لوگوی پیش‌فرضِ فروشگاه وقتی هنوز چیزی آپلود نشده — سبکِ خطیِ آیکون‌های فوتر */
  storefront: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>,
  /* آیکون آپلود برای گالری */
  upload:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5-5 5 5"/><path d="M12 5v12"/></svg>,
  trash:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>,
  phone:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.4 2.1L8.1 9.7a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.4c.9.3 1.8.5 2.7.6a2 2 0 011.7 2z"/></svg>,
  clock:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  truck:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>,
  wa:      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.28 4.9L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2zm5.8 14.11c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11a16.6 16.6 0 01-1.6-.6c-2.83-1.22-4.67-4.08-4.81-4.27-.14-.19-1.15-1.53-1.15-2.92s.72-2.06.98-2.34c.24-.27.53-.34.71-.34l.51.01c.16 0 .38-.06.6.45.24.57.8 1.97.87 2.11.08.14.13.31.02.5-.1.19-.16.31-.31.48-.16.17-.33.38-.47.51-.16.15-.32.32-.14.63.19.31.83 1.36 1.78 2.2 1.22 1.09 2.25 1.43 2.56 1.59.31.16.49.14.67-.08.19-.22.79-.92.99-1.24.2-.31.41-.26.68-.16.28.1 1.77.83 2.07.98.31.16.51.23.58.36.08.14.08.78-.16 1.45z"/></svg>,
  insta:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>,
  check:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>,
  chevron: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>,
  funnel:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>,
  close:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
}
