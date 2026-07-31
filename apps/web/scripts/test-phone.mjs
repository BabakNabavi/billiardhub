/* تستِ نرمال‌سازی و اعتبارسنجیِ شماره‌ی موبایل.
   اجرا:  node scripts/test-phone.mjs */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, '../lib/auth/phone.ts'), 'utf8')
const js = ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
const { normalizePhone, normalizeMobile, hasAssignedPrefix } =
  await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

let pass = 0, fail = 0
const t = (name, got, want) => {
  const ok = got === want
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n      انتظار: ${JSON.stringify(want)}   دریافت: ${JSON.stringify(got)}`}`)
}

console.log('\nنرمال‌سازی — شکل‌های مختلفِ یک شماره')
for (const [input, want] of [
  ['09123456789',      '09123456789'],
  ['۰۹۱۲۳۴۵۶۷۸۹',      '09123456789'],   // ارقامِ فارسی
  ['٠٩١٢٣٤٥٦٧٨٩',      '09123456789'],   // ارقامِ عربی
  ['+989123456789',    '09123456789'],
  ['00989123456789',   '09123456789'],
  ['989123456789',     '09123456789'],
  ['9123456789',       '09123456789'],
  ['0912 345 6789',    '09123456789'],
  ['0912-345-6789',    '09123456789'],
  ['',                 ''],
  ['abc',              ''],
  ['0912345678',       ''],              // یک رقم کم
  ['091234567890',     ''],              // یک رقم زیاد
]) t(`«${input || '(خالی)'}»`, normalizePhone(input), want)

console.log('\nپیشوندهای تخصیص‌یافته — باید بپذیرد')
for (const p of [
  '09123456789',  // همراه اول
  '09101234567', '09191234567',
  '09351234567', '09301234567', '09391234567',  // ایرانسل
  '09011234567', '09051234567',
  '09201234567', '09221234567',                 // رایتل
  '09411234567',                                 // TD-LTE
  '09901234567', '09981234567', '09991234567',   // نسل جدید
]) t(p, hasAssignedPrefix(p), true)

console.log('\nپیشوندهای تخصیص‌نیافته — باید رد کند')
for (const p of [
  '09001234567',   // ← همان موردی که در دیتابیس پیدا شد
  '09061234567', '09091234567',
  '09231234567', '09291234567',
  '09401234567', '09421234567',
  '09501234567', '09891234567',
]) t(p, hasAssignedPrefix(p), false)

console.log('\nnormalizeMobile = نرمال‌سازی + پیشوندِ واقعی')
t('۰۹۱۲… فارسی',       normalizeMobile('۰۹۱۲۳۴۵۶۷۸۹'), '09123456789')
t('+98912…',           normalizeMobile('+989123456789'), '09123456789')
t('0900… رد می‌شود',    normalizeMobile('09001234567'), '')
t('شکلِ نامعتبر',        normalizeMobile('123'), '')

console.log(`\n${'─'.repeat(46)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
