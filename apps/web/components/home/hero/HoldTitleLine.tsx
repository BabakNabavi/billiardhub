'use client'

/* ─────────────────────────────────────────────────────────────
   تیترِ هیرو تا رسیدنِ فونتِ دانا یک‌خط می‌ماند — آذرِ ۱۴۰۵.

   ── چرا ──
   در بازدیدِ اول (فونت هنوز در کشِ مرورگر نیست) تیتر با فونتِ جایگزین ~۱۳٪
   پهن‌تر است: در عرضِ ۳۹۰ تا ۴۳۰ (رایج‌ترین گوشی‌ها) و دسکتاپ دو خط (۷۷px)
   می‌شد و با رسیدنِ دانا یک خط (۳۹px)؛ همه‌ی بخش‌های زیرش ۳۹ پیکسل بالا
   می‌پریدند (CLS ۰٫۱ِ صفحه‌ی اصلی). در عرضِ ۳۶۰ و ۳۷۵ با هر دو فونت دو خط است
   و پرشی نبود.

   ── چه می‌کند ──
   اسکریپتِ کوچکِ درون‌خطی هنگامِ خواندنِ HTML (پیش از اولین نقاشی): اگر دانا
   هنوز نرسیده و تیتر با دانا یک خط می‌شد، همان یک خط با فونتِ جایگزین نگه داشته
   می‌شود — بی‌شکستن و در صورتِ لزوم کمی کوچک‌تر، با همان ارتفاعِ خط — و با
   رسیدنِ دانا همه‌چیز به کلاس‌ها برمی‌گردد. ظاهرِ نهایی هیچ تغییری نمی‌کند؛ فقط
   همان یکی‌دو ثانیه‌ی پیش از فونت متفاوت است.

   ⚠️ `danaEm`: پهنای یک‌خطیِ تیتر با دانا به واحدِ اندازه‌ی فونت — کنارِ خودِ متن در
   hero-title.ts، با آزمونی که تغییرِ متن بی اندازه‌گیریِ دوباره را می‌گیرد.

   رها شدن: با رسیدن یا شکستِ فونت، و با تغییرِ *عرضِ* پنجره (چرخاندنِ گوشی) — عرضِ
   اندازه‌گرفته دیگر معتبر نیست و تیترِ یک‌خطی بریده می‌شد. فقط عرض: سافاریِ iOS با
   جمع‌شدنِ نوارِ ابزار هم resize می‌فرستد.
   خطای اسکریپت عمدا بلعیده می‌شود: اسکریپتِ پیش از hydration است و نبودنش یعنی همان
   رفتارِ قبلی (دو خط و بعد یک خط)، نه صفحه‌ی شکسته.

   فقط در HTMLِ سرور و hydration رندر می‌شود: در ناوبریِ درون‌برنامه‌ای فونت از قبل
   بار شده و <script>ِ ساخته‌شده در مرورگر هم اجرا نمی‌شود (و React خطای توسعه می‌دهد).
   ───────────────────────────────────────────────────────────── */

import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

export function HoldTitleLine({ targetId, danaEm }: { targetId: string; danaEm: number }) {
  const ssrPass = useSyncExternalStore(noopSubscribe, () => false, () => true)
  if (!ssrPass) return null
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: holdScript(targetId, danaEm) }} />
}

function holdScript(id: string, danaEm: number): string {
  return `(function(){try{var d=document;if(!d.fonts||d.fonts.check('800 16px Dana'))return;`
    + `var h=d.getElementById(${JSON.stringify(id).replace(/</g, '\\u003c')});if(!h)return;`
    + `var cs=getComputedStyle(h),fs=parseFloat(cs.fontSize),box=h.clientWidth;`
    + `if(!fs||!box||${Number(danaEm)}*fs>box)return;`
    + `var lh=cs.lineHeight==='normal'?fs*1.35+'px':cs.lineHeight;`
    + `h.style.whiteSpace='nowrap';h.style.lineHeight=lh;`
    + `var nat=h.scrollWidth;if(nat>box)h.style.fontSize=(fs*box/nat*0.98)+'px';`
    + `var done=function(){h.style.whiteSpace='';h.style.lineHeight='';h.style.fontSize=''};`
    + `var w=innerWidth,off=function(){removeEventListener('resize',onR)},onR=function(){if(innerWidth!==w){done();off()}};`
    + `addEventListener('resize',onR);`
    + `d.fonts.load('800 16px Dana').then(function(){done();off()},function(){done();off()})`
    + `}catch(e){}})()`
}
