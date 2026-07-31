/* تست منطق راهنمای «افزودن به صفحه‌ی اصلی» — با UAهای واقعی دستگاه‌ها.
   اجرا:  node scripts/test-a2hs.mjs
   (منطق در lib/pwa/a2hs.ts عمداً از DOM جدا است تا همین‌جا تست شود.) */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, '../lib/pwa/a2hs.ts'), 'utf8')
const js = ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
const { decide, A2HS_CONFIG, nextState, parseState, isMuted, detectIosDevice } = mod

const UA = {
  iphoneSafari:  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ipadSafari13:  'Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1',
  ipadOS17:      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  iosChrome:     'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1',
  iosFirefox:    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15',
  instagram:     'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 331.0.0.35.90',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  macSafari:     'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
}

const NOW = 1_800_000_000_000
const DAY = 86_400_000

/** محیط پیش‌فرض: سافاری آیفون، نصب‌نشده، بدون سابقه‌ی رد کردن */
const env = (o = {}) => ({
  ua: UA.iphoneSafari, maxTouchPoints: 5, standaloneFlag: false,
  displayModeApp: false, now: NOW, stored: null, ...o,
})

let pass = 0, fail = 0
const t = (name, got, want) => {
  const ok = got === want
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n      انتظار: ${want}   دریافت: ${got}`}`)
}
const verdict = e => { const d = decide(e); return d.show ? `show:${d.device}` : `hide:${d.reason}` }

console.log('\nA — آیفون + سافاری + اولین ورود')
t('نمایش داده می‌شود', verdict(env()), 'show:iphone')

console.log('\nB — «متوجه شدم» ⇒ دقیقاً دو روز سکوت')
{
  const s = JSON.stringify(nextState(null, 'ok', NOW))
  t('بلافاصله بعد از رفرش پنهان', verdict(env({ stored: s })), 'hide:muted')
  t('یک روز بعد هنوز پنهان', verdict(env({ stored: s, now: NOW + 1 * DAY })), 'hide:muted')
  t('۴۷ ساعت بعد هنوز پنهان', verdict(env({ stored: s, now: NOW + 47 * 3600e3 })), 'hide:muted')
  t('سه روز بعد دوباره ظاهر', verdict(env({ stored: s, now: NOW + 3 * DAY })), 'show:iphone')
}

console.log('\nبستن ساده (× / پس‌زمینه / Escape) ⇒ فقط همین بازدید')
{
  const s = nextState(null, 'dismiss', NOW)
  t('رفرش بعدی دوباره نشان می‌دهد', verdict(env({ stored: JSON.stringify(s), now: NOW + 1000 })), 'show:iphone')
  let acc = null
  for (let i = 0; i < 5; i++) acc = nextState(acc, 'dismiss', NOW)
  t('پنج بار بستن هم چیزی را قفل نمی‌کند', verdict(env({ stored: JSON.stringify(acc), now: NOW + 1000 })), 'show:iphone')
}

console.log('\nدیگر سقف نمایش وجود ندارد — تا نصب‌نشدن هر دو روز برمی‌گردد')
{
  let s = null
  for (let i = 0; i < 5; i++) s = nextState(s, 'ok', NOW)
  t('پنج بار «متوجه شدم» هم فقط دو روز سکوت می‌دهد',
    verdict(env({ stored: JSON.stringify(s), now: NOW + 3 * DAY })), 'show:iphone')
}

console.log('\nسازگاری با رکوردهای قدیمی «بعداً»')
{
  /* دکمه‌اش حذف شده ولی مرورگرهایی که با نسخه‌ی قبلی ذخیره کرده‌اند
     نباید در سکوت قدیمی گیر بمانند */
  const legacy = JSON.stringify({ s: 'later', t: NOW, n: 1 })
  t('رکورد قدیمی خوانده می‌شود', parseState(legacy)?.s, 'later')
  t('و با همان قاعده‌ی دوروزه سنجیده می‌شود',
    verdict(env({ stored: legacy, now: NOW + 3 * DAY })), 'show:iphone')
  t('پیش از دو روز هنوز پنهان', verdict(env({ stored: legacy, now: NOW + 1 * DAY })), 'hide:muted')
}

console.log('\nD — نصب‌شده / standalone')
t('navigator.standalone = true', verdict(env({ standaloneFlag: true })), 'hide:installed')
t('display-mode: standalone', verdict(env({ displayModeApp: true })), 'hide:installed')
t('هر دو همزمان', verdict(env({ standaloneFlag: true, displayModeApp: true })), 'hide:installed')

console.log('\nE/F — اندروید و دسکتاپ')
t('اندروید کروم', verdict(env({ ua: UA.androidChrome, maxTouchPoints: 5 })), 'hide:not-ios')
t('دسکتاپ کروم (ویندوز)', verdict(env({ ua: UA.desktopChrome, maxTouchPoints: 0, standaloneFlag: undefined })), 'hide:not-ios')
t('سافاری مک (بدون لمس)', verdict(env({ ua: UA.macSafari, maxTouchPoints: 0 })), 'hide:not-ios')

console.log('\nG — آیپد')
t('آیپد قدیمی (UA دارای iPad)', verdict(env({ ua: UA.ipadSafari13 })), 'show:ipad')
t('iPadOS 17 که خود را Macintosh می‌نامد', verdict(env({ ua: UA.ipadOS17, maxTouchPoints: 5 })), 'show:ipad')
t('مک واقعی با همان UA ولی بدون لمس', verdict(env({ ua: UA.ipadOS17, maxTouchPoints: 0 })), 'hide:not-ios')

console.log('\nمرورگرهای غیر سافاری روی iOS')
t('کروم iOS', verdict(env({ ua: UA.iosChrome })), 'hide:not-safari')
t('فایرفاکس iOS', verdict(env({ ua: UA.iosFirefox })), 'hide:not-safari')
t('وب‌ویو اینستاگرام', verdict(env({ ua: UA.instagram })), 'hide:not-safari')

console.log('\nمقاومت در برابر داده‌ی خراب')
t('JSON خراب ⇒ مثل نبود رکورد', verdict(env({ stored: '{{{' })), 'show:iphone')
t('رشته‌ی بی‌ربط', verdict(env({ stored: 'true' })), 'show:iphone')
t('کلید ناشناخته', verdict(env({ stored: '{"s":"maybe","t":1}' })), 'show:iphone')
t('زمان آینده (ساعت عقب‌کشیده)', verdict(env({ stored: '{"s":"ok","t":' + (NOW + 5 * DAY) + ',"n":1}' })), 'hide:muted')
t('parseState روی null', parseState(null), null)
t('isMuted روی null', isMuted(null, NOW), false)
t('detectIosDevice با UA خالی', detectIosDevice('', 0), null)

console.log('\nتنظیمات')
t('کلید ذخیره‌سازی', mod.A2HS_STORAGE_KEY, 'bh_a2hs_ios_v2')
t('تأخیر نمایش ≥ ۱ ثانیه', A2HS_CONFIG.showDelayMs >= 1000, true)
t('تأخیر نمایش ≤ ۲ ثانیه', A2HS_CONFIG.showDelayMs <= 2000, true)

console.log(`\n${'─'.repeat(46)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
