/* تست لینک واتساپ و تماس.
   اجرا:  node scripts/test-wa-link.mjs

   ⚠️ چرا این تست: لینک واتساپ از مقدار خام فیلد ساخته می‌شد، پس
   «@» و فاصله و نشانی کامل wa.me عینا داخل نشانی می‌رفتند و پیام
   دادن به متخصص کار نمی‌کرد. */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const here = dirname(fileURLToPath(import.meta.url))

/* `phone-wa.ts` از `./auth/phone` می‌خواند. به‌جای حل‌کردن مسیرها،
   هر دو فایل به یک ماژول چسبانده می‌شوند: تست باید *همان* منطق را
   بسنجد، نه یک کپی. */
const strip = f => readFileSync(join(here, f), 'utf8')
  .replace(/^\s*import[^\n]*\n/gm, '')

const src = strip('../lib/auth/phone.ts') + '\n' + strip('../lib/phone-wa.ts')
const js = ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
const { waNumber, telNumber, waLink } =
  await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

let pass = 0, fail = 0
const t = (name, got, want) => {
  const ok = got === want
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n      انتظار: ${JSON.stringify(want)}   دریافت: ${JSON.stringify(got)}`}`)
}

console.log('\nشماره‌ی واتساپ — شکل‌هایی که کاربر واقعا وارد می‌کند')
for (const [input, want] of [
  ['09123456789',                '989123456789'],
  ['9123456789',                 '989123456789'],
  ['+989123456789',              '989123456789'],
  ['00989123456789',             '989123456789'],
  ['989123456789',               '989123456789'],
  ['0912 345 6789',              '989123456789'],
  ['0912-345-6789',              '989123456789'],
  ['۰۹۱۲۳۴۵۶۷۸۹',                '989123456789'],
  ['٠٩١٢٣٤٥٦٧٨٩',                '989123456789'],
  /* ⚠️ همان چیزی که باگ را ساخت */
  ['@989123456789',              '989123456789'],
  ['https://wa.me/989123456789', '989123456789'],
  ['wa.me/09123456789',          '989123456789'],
  /* نامعتبرها باید خالی برگردند تا دکمه اصلا ساخته نشود */
  ['0912345678',                 ''],
  ['02112345678',                ''],
  ['',                           ''],
  ['سلام',                       ''],
]) t(`«${input || '(خالی)'}»`, waNumber(input), want)

console.log('\nشماره‌ی تماس — شکل محلی')
t('«+98 912 345 6789»', telNumber('+98 912 345 6789'), '09123456789')
t('نامعتبر', telNumber('123'), '')

console.log('\nنشانی کامل')
t('بدون متن', waLink('09123456789'), 'https://wa.me/989123456789')
t('با متن', waLink('@989123456789', 'سلام'), 'https://wa.me/989123456789?text=%D8%B3%D9%84%D8%A7%D9%85')
t('نامعتبر ⟵ رشته‌ی خالی', waLink('123'), '')
/* ⚠️ بدون این، «@» داخل مسیر می‌رفت و واتساپ شماره را پیدا نمی‌کرد */
t('هیچ‌وقت «@» در نشانی نمی‌ماند', /@/.test(waLink('@989123456789')), false)

console.log(`\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail === 0 ? 0 : 1)
