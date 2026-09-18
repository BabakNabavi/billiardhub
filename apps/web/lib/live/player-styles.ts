/* استایلِ پخش‌کننده‌ی زنده.

   ⚠️ در این رشته هرگز بک‌تیک یا ${ ننویس — این یک template literal است
   و هر کدامشان رشته را وسطِ کار می‌بندد. (دو بار در این پروژه همین
   اتفاق افتاد و بیلد با خطاهای نامربوطِ JSX شکست.)

   چرا CSS و نه استایلِ اینلاین: پخش‌کننده hover، focus-visible،
   ترنزیشن، و حالتِ تمام‌صفحه دارد. هیچ‌کدام با style={{...}} ممکن
   نیست. */

export const PLAYER_CSS = `
.bpv {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 20px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  color: #fff;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 20px 50px rgba(0,0,0,0.22);
  /* ⚠️ سقفِ ارتفاع. با فقط aspect-ratio، در حالتِ افقیِ موبایل
     ۱۶:۹ از عرضِ کامل بلندتر از خودِ ویوپورت می‌شد: تصویر از صفحه
     می‌زد بیرون و کنترل‌ها دستِ‌نیافتنی می‌شدند.

     max-width هم لازم است، نه فقط max-height: با width:100% و
     aspect-ratio، سقفِ ارتفاع فقط ارتفاع را می‌برد و عرض سرِ جایش
     می‌ماند — نتیجه‌اش یک جعبه‌ی سیاهِ تمام‌عرض با تصویرِ کوچک در وسط
     و کنترل‌هایی چسبیده به دو لبه‌ی دور بود.

     78vh پیش از 78dvh: iOS 15.0 تا 15.3 خطِ dvh را کلا می‌اندازد. */
  max-height: 78vh;
  max-height: 78dvh;
  max-width: calc(78vh * 16 / 9);
  max-width: calc(78dvh * 16 / 9);
  margin-inline: auto;
}
/* در افقیِ گوشی جای عمودی خیلی کم است؛ کمی بیشتر سخت‌گیری. */
@media (orientation: landscape) and (max-height: 520px) {
  .bpv {
    max-height: 72vh;
    max-height: 72dvh;
    max-width: calc(72vh * 16 / 9);
    max-width: calc(72dvh * 16 / 9);
  }
}
.bpv:focus-visible { box-shadow: 0 0 0 3px rgba(199,166,106,0.75); }

.bpv video {
  width: 100%; height: 100%;
  object-fit: contain;
  display: block;
  background: #000;
}

/* ── تمام‌صفحه ──
   حالتِ بومی و حالتِ جایگزینِ CSS هر دو باید گوشه‌ها را صاف کنند و
   نسبتِ ثابت را رها کنند، وگرنه وسطِ صفحه یک مستطیلِ گرد می‌ماند. */
.bpv:fullscreen,
.bpv:-webkit-full-screen,
.bpv[data-cssfs="1"] {
  border-radius: 0;
  aspect-ratio: auto;
  width: 100%;
  height: 100%;
  max-height: none;
  max-width: none;
  box-shadow: none;
}
.bpv[data-cssfs="1"] {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  height: 100dvh;
}

/* پرده‌ی تیره پشتِ کنترل‌ها. بدونِ این، آیکونِ سفید روی تصویرِ روشنِ
   نمدِ سبز یا پیراهنِ سفیدِ بازیکن کاملا گم می‌شود. */
.bpv-scrim {
  position: absolute; inset-inline: 0; bottom: 0; height: 42%;
  background: linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0) 100%);
  pointer-events: none;
  opacity: 0; transition: opacity 0.22s ease;
}
.bpv-scrim--top {
  top: 0; bottom: auto; height: 28%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%);
}
.bpv[data-ui="1"] .bpv-scrim { opacity: 1; }

/* نوارها */
.bpv-bar {
  position: absolute; inset-inline: 0;
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px;
  opacity: 0; transform: translateY(8px);
  transition: opacity 0.22s ease, transform 0.22s ease;
  pointer-events: none;
}
.bpv-bar--top { top: 0; padding-top: max(10px, env(safe-area-inset-top)); }
.bpv-bar--bottom {
  bottom: 0;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
  padding-inline-start: max(12px, env(safe-area-inset-left));
  padding-inline-end: max(12px, env(safe-area-inset-right));
}
.bpv[data-ui="1"] .bpv-bar { opacity: 1; transform: none; pointer-events: auto; }

/* دکمه‌ها — هدفِ لمسی ۴۴ پیکسل، همان حداقلی که بقیه‌ی سایت رعایت می‌کند */
.bpv-btn {
  width: 44px; height: 44px;
  flex: 0 0 auto;
  display: inline-flex; align-items: center; justify-content: center;
  border: none; border-radius: 12px;
  background: transparent; color: #fff;
  cursor: pointer; font-family: inherit;
  transition: background 0.16s ease, transform 0.16s ease;
}
.bpv-btn:hover { background: rgba(255,255,255,0.16); }
.bpv-btn:active { transform: scale(0.93); }
.bpv-btn:focus-visible { outline: 2px solid #C7A66A; outline-offset: -2px; }
.bpv-btn[aria-pressed="true"] { color: #C7A66A; }
.bpv-btn:disabled { opacity: 0.4; cursor: default; }

.bpv-spacer { flex: 1 1 auto; }

/* ── صدا ──
   لغزنده تا وقتی با موس نزدیک نشده‌ای جمع است — همان رفتارِ یوتیوب.
   روی لمسی اصلا باز نمی‌شود چون hover ندارد؛ آن‌جا دکمه‌ی قطع/وصل
   کافی است. */
.bpv-vol { display: flex; align-items: center; }
.bpv-vol input {
  width: 0; opacity: 0; margin: 0;
  transition: width 0.2s ease, opacity 0.2s ease, margin 0.2s ease;
  accent-color: #C7A66A;
  cursor: pointer;
  height: 4px;
}
@media (hover: hover) {
  .bpv-vol:hover input, .bpv-vol:focus-within input {
    width: 74px; opacity: 1; margin-inline-end: 8px;
  }
}

/* نشانِ زنده */
.bpv-live {
  display: inline-flex; align-items: center; gap: 6px;
  background: #ef4444; color: #fff;
  border-radius: 999px; padding: 4px 11px;
  font-size: 11px; font-weight: 900; letter-spacing: 0.1em;
  border: none;
}
.bpv-live i {
  width: 7px; height: 7px; border-radius: 50%;
  background: #fff; display: inline-block;
  animation: bpvPulse 1.4s infinite;
}
@keyframes bpvPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }

.bpv-chip {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(8px);
  border-radius: 999px; padding: 5px 11px;
  font-size: 11.5px; font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ── وسطِ تصویر ── */
.bpv-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 12px; text-align: center; padding: 20px;
  pointer-events: none;
}
.bpv-center > * { pointer-events: auto; }
.bpv-center--solid { background: #000; }

.bpv-big {
  width: 76px; height: 76px; border-radius: 50%;
  border: none; cursor: pointer;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(10px);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), background 0.18s;
}
.bpv-big:hover { transform: scale(1.07); background: rgba(0,0,0,0.75); }
.bpv-big:focus-visible { outline: 2px solid #C7A66A; outline-offset: 3px; }

.bpv-msg { font-size: 13.5px; color: rgba(255,255,255,0.8); margin: 0; }
.bpv-msg--lg { font-size: 16px; font-weight: 800; color: #fff; }

.bpv-spin { animation: bpvSpin 1s linear infinite; }
@keyframes bpvSpin { to { transform: rotate(360deg) } }

/* ── دکمه‌ی صدا، وقتی مرورگر پخشِ خودکار با صدا را نبسته ──
   این شرطِ اولِ هر پخش‌کننده‌ی زنده است: مرورگر ویدیو را بی‌صدا شروع
   می‌کند و بیننده فکر می‌کند صدا ندارد. */
.bpv-unmute {
  display: inline-flex; align-items: center; gap: 7px;
  border: 1px solid rgba(255,255,255,0.28);
  background: rgba(0,0,0,0.62);
  backdrop-filter: blur(10px);
  color: #fff; cursor: pointer;
  border-radius: 999px; padding: 9px 16px;
  font-family: inherit; font-size: 13px; font-weight: 800;
  transition: background 0.16s ease;
}
.bpv-unmute:hover { background: rgba(0,0,0,0.8); }
.bpv-unmute:focus-visible { outline: 2px solid #C7A66A; outline-offset: 2px; }

/* ── دوربین‌ها ── */
.bpv-angles {
  display: flex; align-items: center; gap: 6px;
  overflow-x: auto; scrollbar-width: none;
  max-width: 46%;
}
.bpv-angles::-webkit-scrollbar { display: none; }
.bpv-angle {
  flex: 0 0 auto;
  border: 1px solid rgba(255,255,255,0.24);
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  color: #fff; cursor: pointer;
  border-radius: 999px; padding: 7px 13px;
  font-family: inherit; font-size: 12px; font-weight: 700;
  white-space: nowrap;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}
.bpv-angle:hover { background: rgba(255,255,255,0.18); }
.bpv-angle:focus-visible { outline: 2px solid #C7A66A; outline-offset: 2px; }
.bpv-angle[aria-pressed="true"] {
  background: #C7A66A; border-color: #C7A66A; color: #1C1B17;
}

/* ── پنل‌ها ── */
.bpv-panel {
  position: absolute;
  inset-inline-end: 12px;
  bottom: 68px;
  min-width: 212px; max-width: min(300px, calc(100% - 24px));
  background: rgba(16,16,18,0.94);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 14px;
  padding: 8px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  max-height: 62%; overflow-y: auto;
}
.bpv-panel h4 {
  margin: 4px 8px 8px; font-size: 11px; font-weight: 800;
  color: rgba(255,255,255,0.5); letter-spacing: 0.04em;
}
.bpv-row {
  display: flex; align-items: center; gap: 8px;
  width: 100%; box-sizing: border-box;
  padding: 10px 10px; border: none; border-radius: 10px;
  background: transparent; color: #fff;
  font-family: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; text-align: start;
  transition: background 0.14s ease;
}
.bpv-row:hover { background: rgba(255,255,255,0.1); }
.bpv-row:focus-visible { outline: 2px solid #C7A66A; outline-offset: -2px; }
.bpv-row--on { color: #C7A66A; }

/* ── آمار ──
   عددها لاتین و چپ‌به‌راست‌اند؛ این یک بلاکِ فنی است نه متنِ فارسی. */
.bpv-stats {
  position: absolute; top: 56px; inset-inline-start: 12px;
  direction: ltr; text-align: left;
  background: rgba(16,16,18,0.9);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 12px; padding: 10px 12px;
  font-size: 11.5px; line-height: 1.85;
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  color: rgba(255,255,255,0.9);
  max-width: calc(100% - 24px);
}
.bpv-stats b { color: rgba(255,255,255,0.5); font-weight: 500; }
.bpv-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.bpv-dot--good { background: #22c55e }
.bpv-dot--fair { background: #eab308 }
.bpv-dot--poor { background: #ef4444 }

.bpv-title {
  font-size: 12.5px; font-weight: 700;
  max-width: 44%; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
  color: rgba(255,255,255,0.92);
}

/* موبایل: چند کنترلِ کم‌اهمیت‌تر جا ندارند */
@media (max-width: 480px) {
  .bpv-btn { width: 40px; height: 40px; }
  .bpv-title { display: none; }
  .bpv-angles { max-width: 40%; }
}

@media (prefers-reduced-motion: reduce) {
  .bpv-scrim, .bpv-bar, .bpv-btn, .bpv-big, .bpv-angle, .bpv-row { transition: none; }
  .bpv-live i { animation: none; }
  .bpv-spin { animation-duration: 2.4s; }
}
`;
