'use client'
import { useCallback, useEffect, useRef } from 'react'
import { persistDismissal, type A2hsAction } from '../../lib/pwa/a2hs'

/* ─────────────────────────────────────────────────────────────
   شیت راهنمای «افزودن به صفحه‌ی اصلی» — فقط iOS/Safari.

   این کامپوننت هیچ تصمیمی درباره‌ی «نشان بدهم یا نه» نمی‌گیرد؛ آن کار
   در `AddToHomeScreenGate` انجام شده و این‌جا فقط نمایش است. به همین
   دلیل هم با `dynamic(..., { ssr:false })` بارگذاری می‌شود و کدش اصلاً
   به دست کاربر اندروید/دسکتاپ نمی‌رسد.

   چرا CSS در <style> و نه inline: به media query (آیپد/لنداسکیپ)،
   `env(safe-area-inset-*)`، `:focus-visible` و `prefers-reduced-motion`
   نیاز داریم و هیچ‌کدام با استایل inline ممکن نیست.
   ───────────────────────────────────────────────────────────── */

const TEXT = {
  title: 'بیلیارد هاب را به صفحه اصلی اضافه کنید',
  desc: 'با این کار، می‌توانید سریع‌تر و بدون نیاز به باز کردن مرورگر از بیلیارد هاب استفاده کنید.',
  steps: [
    'روی دکمه Share در نوار پایین Safari بزنید.',
    'گزینه Add to Home Screen / افزودن به صفحه اصلی را انتخاب کنید.',
    'روی Add / افزودن بزنید.',
  ],
  gotIt: 'متوجه شدم',
  close: 'بستن راهنما',
  dialogLabel: 'راهنمای افزودن بیلیارد هاب به صفحه اصلی',
} as const

/* آیکون رسمی Share در iOS: مربع باز با فلش رو به بالا. */
function ShareIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 15V3.5" />
      <path d="M8.2 7.1 12 3.3l3.8 3.8" />
      <path d="M7.5 10.2H6.2A2.2 2.2 0 0 0 4 12.4v6.4a2.2 2.2 0 0 0 2.2 2.2h11.6a2.2 2.2 0 0 0 2.2-2.2v-6.4a2.2 2.2 0 0 0-2.2-2.2h-1.3" />
    </svg>
  )
}

/* آیکون «Add to Home Screen» در منوی Share: مربع گرد با علامت + */
function AddSquareIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" />
      <path d="M12 8.4v7.2M8.4 12h7.2" />
    </svg>
  )
}

function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  )
}

/* شماره + متن + آیکون کنار هم، تا ترتیبشان نتواند از هم بیفتد */
const STEPS = [
  { n: '۱', text: TEXT.steps[0], Icon: ShareIcon },
  { n: '۲', text: TEXT.steps[1], Icon: AddSquareIcon },
  { n: '۳', text: TEXT.steps[2], Icon: CheckIcon },
]

export default function AddToHomeScreenSheet({ onClose }: { onClose: () => void }) {
  const sheetRef = useRef<HTMLDivElement>(null)
  /* فوکوس باید بعد از بسته‌شدن به همان‌جایی برگردد که بود — وگرنه کاربر
     صفحه‌خوان/کیبورد به ابتدای صفحه پرت می‌شود. */
  const restoreTo = useRef<HTMLElement | null>(null)

  const dismiss = useCallback((action: A2hsAction) => {
    persistDismissal(action)
    onClose()
  }, [onClose])

  useEffect(() => {
    restoreTo.current = document.activeElement as HTMLElement | null
    /* فوکوس روی خود دیالوگ، نه روی دکمه — تا صفحه‌خوان اول عنوان و
       توضیح را بخواند و کاربر ندانسته «متوجه شدم» را نزند. */
    sheetRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); dismiss('dismiss'); return }
      if (e.key !== 'Tab') return

      /* حلقه‌ی فوکوس: تا وقتی دیالوگ باز است، Tab نباید به پشت آن برود. */
      const nodes = Array.from(sheetRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [])
      const first = nodes.at(0)
      const last = nodes.at(-1)
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    /* عمداً `document.body.style.overflow` را قفل نمی‌کنیم: این یک راهنمای
       اختیاری است، نه یک مودال مسدودکننده. ضمناً قفل بدنه با قفل منوی
       موبایل Navbar تداخل پیدا می‌کرد و اسکرول را برای همیشه می‌بست. */
  }, [dismiss])

  useEffect(() => () => { restoreTo.current?.focus?.() }, [])

  return (
    <>
      <style>{CSS}</style>
      {/* پس‌زمینه، × و Escape ⇒ فقط بستن؛ راهنما دفعه‌ی بعد دوباره می‌آید.
          تنها «متوجه شدم» — که انتخاب آگاهانه است — دو روز سکوت می‌سازد. */}
      <div className="bh-a2hs-scrim" onClick={() => dismiss('dismiss')} aria-hidden="true" />

      <div className="bh-a2hs-wrap" role="presentation">
        <div
          ref={sheetRef}
          className="bh-a2hs-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={TEXT.dialogLabel}
          tabIndex={-1}
        >
          <div className="bh-a2hs-grip" aria-hidden="true" />

          <button type="button" className="bh-a2hs-x" onClick={() => dismiss('dismiss')} aria-label={TEXT.close}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth={2.1} strokeLinecap="round" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div className="bh-a2hs-head">
            <div className="bh-a2hs-badge">
              {/* آیکون برند — همان فایلی که iOS برای Home Screen استفاده می‌کند */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/Logo/bh-apple-180-v3.png" alt="" width={52} height={52} decoding="async" />
            </div>
            <div className="bh-a2hs-titles">
              <h2 className="bh-a2hs-title">{TEXT.title}</h2>
              <p className="bh-a2hs-desc">{TEXT.desc}</p>
            </div>
          </div>

          <ol className="bh-a2hs-steps">
            {STEPS.map(({ n, text, Icon }) => (
              <li key={n} className="bh-a2hs-step">
                <span className="bh-a2hs-num" aria-hidden="true">{n}</span>
                <span className="bh-a2hs-steptext">{text}</span>
                <span className="bh-a2hs-glyph" aria-hidden="true"><Icon size={19} /></span>
              </li>
            ))}
          </ol>

          {/* یک دکمه، یک تصمیم.

              «بعداً» حذف شد: دو دکمه با دو مدت سکوت متفاوت هم انتخاب را
              سخت می‌کرد هم رفتار را غیرقابل‌پیش‌بینی. کسی که الان وقت
              ندارد، همان × بالا را می‌زند و راهنما دفعه‌ی بعد برمی‌گردد. */}
          <div className="bh-a2hs-actions">
            <button type="button" className="bh-a2hs-primary" onClick={() => dismiss('ok')}>
              {TEXT.gotIt}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────
   z-index ۹۹۹۰ عمدی است:
     • بالاتر از همه‌ی محتوای صفحات (بیشینه‌ی موجود ۴۰۰۰)
     • پایین‌تر از منوی موبایل Navbar و Toast (۹۹۹۹) و
       ClubStoryModal (۹۹۹۹۸) — چیزی که کاربر *فعالانه* باز می‌کند باید
       روی یک راهنمای *منفعل* بنشیند، نه برعکس.

   کنتراست‌ها محاسبه شده‌اند (WCAG AA):
     #111 روی #FFF = ۱۸٫۹ : ۱ | #5B5B5B روی #FFF = ۶٫۸ : ۱
     #FFF روی #141413 = ۱۷٫۹ : ۱ | #8A6430 روی #F6F1E8 = ۴٫۷ : ۱
   (طلایی برند #C7A66A با متن سفید فقط ۲٫۳ : ۱ می‌داد و رد شد.)
   ───────────────────────────────────────────────────────────── */
const CSS = `
.bh-a2hs-scrim{
  position:fixed; inset:0; z-index:9990;
  background:rgba(17,17,17,.34);
  -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px);
  animation:bhA2hsFade .28s ease both;
}
.bh-a2hs-wrap{
  position:fixed; z-index:9991;
  left:0; right:0; bottom:0;
  display:flex; justify-content:center;
  padding:0 max(10px, env(safe-area-inset-left)) 0 max(10px, env(safe-area-inset-right));
  pointer-events:none;
}
.bh-a2hs-sheet{
  pointer-events:auto;
  position:relative;
  width:100%; max-width:460px;
  box-sizing:border-box;
  background:#FFFFFF;
  border:1px solid rgba(0,0,0,.06);
  border-bottom:0;
  border-radius:24px 24px 0 0;
  box-shadow:0 -8px 24px rgba(0,0,0,.08), 0 -32px 64px rgba(0,0,0,.10);
  padding:10px 20px calc(18px + env(safe-area-inset-bottom)) 20px;
  /* در لنداسکیپ آیفون ارتفاع بسیار کم است — شیت خودش اسکرول می‌شود */
  max-height:min(88vh, 88dvh);
  overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain;
  animation:bhA2hsUp .38s cubic-bezier(.32,.72,0,1) both;
}
.bh-a2hs-sheet:focus{ outline:none; }
.bh-a2hs-grip{
  width:38px; height:4px; border-radius:4px; margin:0 auto 12px;
  background:rgba(0,0,0,.13);
}
.bh-a2hs-x{
  position:absolute; top:6px; left:6px;
  width:44px; height:44px;          /* هدف لمسی ۴۴px طبق HIG و WCAG */
  display:flex; align-items:center; justify-content:center;
  border:0; background:transparent; cursor:pointer;
  color:#767676; border-radius:50%;
  -webkit-tap-highlight-color:transparent;
}
.bh-a2hs-x:hover{ color:#141413; background:rgba(0,0,0,.04); }
.bh-a2hs-head{ display:flex; gap:14px; align-items:flex-start; margin:2px 0 16px; }
.bh-a2hs-badge{
  flex-shrink:0; width:56px; height:56px; border-radius:14px;
  display:flex; align-items:center; justify-content:center;
  background:#FAF8F4; border:1px solid rgba(199,166,106,.30);
  box-shadow:0 2px 8px rgba(160,120,64,.10); overflow:hidden;
}
.bh-a2hs-badge img{ width:52px; height:52px; border-radius:11px; display:block; }
.bh-a2hs-titles{ min-width:0; }      /* بدون این، متن بلند فلکس را پهن می‌کند */
.bh-a2hs-title{
  margin:2px 0 6px; font-size:16.5px; font-weight:800; line-height:1.55;
  color:#111111; letter-spacing:-.2px; text-wrap:balance;
}
.bh-a2hs-desc{ margin:0; font-size:13px; line-height:1.85; color:#5B5B5B; }
.bh-a2hs-steps{
  list-style:none; margin:0 0 18px; padding:14px 14px 4px;
  background:#FAFAF8; border:1px solid rgba(0,0,0,.05); border-radius:16px;
}
.bh-a2hs-step{ display:flex; align-items:center; gap:10px; padding-bottom:12px; }
.bh-a2hs-num{
  flex-shrink:0; width:23px; height:23px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  background:#F6F1E8; color:#8A6430; font-size:11.5px; font-weight:800;
}
.bh-a2hs-steptext{ flex:1; min-width:0; font-size:13px; line-height:1.8; color:#2E2E2C; }
.bh-a2hs-glyph{
  flex-shrink:0; width:34px; height:34px; border-radius:10px;
  display:flex; align-items:center; justify-content:center;
  background:#FFFFFF; border:1px solid rgba(0,0,0,.07); color:#0A72E8;   /* آبی کنترل‌های iOS */
  box-shadow:0 1px 2px rgba(0,0,0,.04);
}
.bh-a2hs-actions{ display:flex; }
.bh-a2hs-primary{
  width:100%; min-height:48px; border-radius:13px; cursor:pointer;
  font-size:14.5px; font-weight:700; font-family:inherit;
  background:#141413; color:#FFFFFF; border:1px solid #141413;
  transition:background .16s ease, transform .16s ease;
  -webkit-tap-highlight-color:transparent;
}
.bh-a2hs-primary:hover{ background:#000000; }
.bh-a2hs-primary:active{ transform:scale(.985); }
.bh-a2hs-sheet :focus-visible{ outline:2px solid #8A6430; outline-offset:2px; }

/* آیپد و صفحه‌های بزرگ‌تر: کارت شناور به‌جای شیت چسبیده به لبه */
@media (min-width:640px){
  .bh-a2hs-wrap{ padding-bottom:max(24px, env(safe-area-inset-bottom)); }
  .bh-a2hs-sheet{
    border-radius:22px; border-bottom:1px solid rgba(0,0,0,.06);
    padding-bottom:20px;
    box-shadow:0 12px 32px rgba(0,0,0,.10), 0 40px 80px rgba(0,0,0,.12);
  }
}
/* لنداسکیپ آیفون: ارتفاع بحرانی است — فشرده‌تر می‌شود */
@media (max-height:460px){
  .bh-a2hs-sheet{ max-height:94vh; padding-top:6px; }
  .bh-a2hs-head{ margin-bottom:12px; }
  .bh-a2hs-badge{ width:44px; height:44px; }
  .bh-a2hs-badge img{ width:40px; height:40px; }
  .bh-a2hs-steps{ margin-bottom:12px; padding-top:10px; }
  .bh-a2hs-step{ padding-bottom:9px; }
}

@keyframes bhA2hsFade{ from{opacity:0} to{opacity:1} }
@keyframes bhA2hsUp{ from{opacity:0; transform:translate3d(0,26px,0)} to{opacity:1; transform:none} }

@media (prefers-reduced-motion:reduce){
  .bh-a2hs-scrim,.bh-a2hs-sheet{ animation:bhA2hsFade .01ms both; }
  .bh-a2hs-primary{ transition:none; }
  .bh-a2hs-primary:active{ transform:none; }
}
`
