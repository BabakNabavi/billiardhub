/* شماره‌ی ثابت با کد شهر — منطقِ خالص، بدون شبکه و دیتابیس.
       npx tsx scripts/test-iran-tel.mjs
   یا `npm run test:tel`. (tsx وابستگیِ پروژه نیست؛ npx موقتی می‌آوردش —
   این فایل از `lib/*.ts` مستقیم import می‌کند تا همان کدِ واقعی سنجیده
   شود، نه یک کپی.)

   چرا تست دارد: هر سه باگی که این‌جا سنجیده می‌شود یک‌بار در کدِ
   واقعی اتفاق افتاده‌اند — ارقامِ فارسی که به رشته‌ی خالی تبدیل
   می‌شدند، شهرِ هم‌نام که کدِ استانِ اشتباه می‌گرفت، و کدی که کاربر
   دستی تایپ کرده بود و دوباره اضافه می‌شد. */

import { iranTel, normalizeLocalPhone, provincesOfCity } from '../lib/iran-geo.ts'

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)

head('۱) شماره‌ی محلی + کد استان')
{
  const r = iranTel('22859551', 'تهران')
  t('تهران ⇒ ۰۲۱-۲۲۸۵۹۵۵۱', r.text === '021-22859551' && r.href === '02122859551', JSON.stringify(r))
}
{
  const r = iranTel('33334444', 'اصفهان')
  t('اصفهان ⇒ ۰۳۱', r.href === '03133334444', JSON.stringify(r))
}

head('۲) ارقام فارسی — تله‌ی replace(/\\D/g)')
{
  const r = iranTel('۲۲۸۵۹۵۵۱', 'تهران')
  t('ارقام فارسی خالی نمی‌شود', r.digits === '22859551', JSON.stringify(r))
  t('و کد می‌گیرد', r.href === '02122859551', JSON.stringify(r))
}
{
  const r = iranTel('۰۹۱۲۳۴۵۶۷۸۹', 'تهران')
  t('موبایلِ فارسی هم لاتین می‌شود', r.digits === '09123456789', JSON.stringify(r))
}

head('۳) شماره‌ای که خودش کامل است')
{
  const r = iranTel('02122859551', 'تهران')
  t('کد دوباره اضافه نمی‌شود', r.href === '02122859551', JSON.stringify(r))
}
{
  const r = iranTel('09123456789', 'تهران')
  t('موبایل کد شهر نمی‌گیرد', r.href === '09123456789', JSON.stringify(r))
}

head('۴) شهرِ هم‌نام — کد غلط نباید ساخته شود')
{
  /* رودبار هم در گیلان (۰۱۳) است هم کرمان (۰۳۴) */
  const many = provincesOfCity('رودبار')
  t('رودبار در بیش از یک استان است', many.length > 1, JSON.stringify(many))
  const r = iranTel('44445555', null, 'رودبار')
  t('بدونِ استان، کد حدس زده نمی‌شود', r.href === '44445555', JSON.stringify(r))
  const r2 = iranTel('44445555', 'گیلان', 'رودبار')
  t('با استانِ صریح، کد درست می‌آید', r2.href === '01344445555', JSON.stringify(r2))
}
{
  const one = provincesOfCity('تهران')
  t('تهران یکتاست', one.length === 1, JSON.stringify(one))
  const r = iranTel('22859551', null, 'تهران')
  t('شهرِ یکتا ⇒ کد از شهر مشتق می‌شود', r.href === '02122859551', JSON.stringify(r))
}

head('۵) ورودی‌های خراب')
for (const [v, why] of [['', 'خالی'], ['—', 'خط تیره'], ['تماس بگیرید', 'متن']]) {
  const r = iranTel(v, 'تهران')
  t(`${why} ⇒ لینک ساخته نمی‌شود`, r.digits === '' && r.href === '', JSON.stringify(r))
}

head('۶) نرمال‌سازی پیش از ذخیره')
{
  t('کد با صفر برداشته می‌شود', normalizeLocalPhone('02122859551', 'تهران') === '22859551')
  t('کد بی‌صفر هم برداشته می‌شود', normalizeLocalPhone('2122859551', 'تهران') === '22859551')
  t('ارقام فارسی لاتین می‌شود', normalizeLocalPhone('۲۲۸۵۹۵۵۱', 'تهران') === '22859551')
  t('فاصله و خط تیره می‌رود', normalizeLocalPhone('021-2285 9551', 'تهران') === '22859551')
  t('موبایل دست‌نخورده می‌ماند', normalizeLocalPhone('09123456789', 'تهران') === '09123456789')
  t('بدونِ استان فقط رقم‌ها می‌ماند', normalizeLocalPhone('۲۲۸۵۹۵۵۱', '') === '22859551')
}

head('۷) رفت‌وبرگشت')
{
  const stored = normalizeLocalPhone('۰۲۱-۲۲۸۵۹۵۵۱', 'تهران')
  const shown = iranTel(stored, 'تهران')
  t('ذخیره ← نمایش بدونِ تکرارِ کد', shown.href === '02122859551', `${stored} → ${shown.href}`)
}

console.log('\n' + '─'.repeat(52))
console.log(`  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
