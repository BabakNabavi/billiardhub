/* راستی‌آزماییِ مهاجرت ۰۳۹ روی همان دیتابیسی که برنامه استفاده می‌کند.
       node scripts/verify-migration-039.mjs

   چرا لازم است: کلِ قفل روی وجودِ این ستون‌ها ایستاده، و کد عمداً طوری
   نوشته شده که نبودشان چیزی را نشکند — یعنی اگر مهاجرت اجرا نشده
   باشد، همه‌چیز سالم به‌نظر می‌رسد ولی قفل بی‌اثر است. این اسکریپت
   همان تفاوتِ خاموش را آشکار می‌کند. */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/* اعتبارنامه از .env.local خوانده می‌شود و هرگز چاپ نمی‌شود */
let env = {}
try {
  env = Object.fromEntries(
    readFileSync(join(here, '..', '.env.local'), 'utf8')
      .split(/\r?\n/)
      .filter(l => l.trim() && !l.trim().startsWith('#'))
      .map(l => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
      }),
  )
} catch { /* بدونِ فایل هم از محیط می‌خوانیم */ }

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY

if (!URL_ || !KEY) {
  console.log('\n  ⏭  اعتبارنامه‌ی Supabase پیدا نشد — رد شد.\n')
  process.exit(0)
}

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}

const q = async (path) => {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  return { status: r.status, body: await r.json().catch(() => null) }
}

console.log('\n■ ستون‌های قفل')

/* اگر ستون نباشد PostgREST خطای 42703 می‌دهد؛ بودنش یعنی مهاجرت رفته */
const c = await q('clubs?select=id,"postalCodeVerified","postalCodeVerifiedAt"&limit=1')
t('clubs.postalCodeVerified هست', c.status === 200, JSON.stringify(c.body)?.slice(0, 120))

const u = await q('users?select=id,bank_card_verified,bank_card_verified_at&limit=1')
t('users.bank_card_verified هست', u.status === 200, JSON.stringify(u.body)?.slice(0, 120))

console.log('\n■ جدولِ تیکت')
const s = await q('support_tickets?select=id&limit=1')
t('support_tickets ساخته شده', s.status === 200, JSON.stringify(s.body)?.slice(0, 120))

console.log('\n■ بک‌فیل')
/* بدونِ بک‌فیل، هر کاربرِ فعلی یک استعلامِ رایگانِ اضافه می‌گرفت */
const unlockedCards = await q('users?select=id&bank_card=not.is.null&bank_card_verified=is.false&limit=5')
t('کاربرِ دارای کارتِ قفل‌نشده نمانده',
  unlockedCards.status === 200 && Array.isArray(unlockedCards.body) && unlockedCards.body.length === 0,
  `${Array.isArray(unlockedCards.body) ? unlockedCards.body.length : '?'} ردیف`)

const unlockedPostal = await q('clubs?select=id,"postalCode"&"postalCode"=not.is.null&"postalCodeVerified"=is.false&limit=5')
const bad = Array.isArray(unlockedPostal.body)
  ? unlockedPostal.body.filter(x => /^\d{10}$/.test(String(x.postalCode ?? '')))
  : []
t('باشگاهِ دارای کد پستیِ قفل‌نشده نمانده', unlockedPostal.status === 200 && bad.length === 0,
  `${bad.length} ردیف`)

console.log(`\n  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا\n`)
process.exit(fail ? 1 : 0)
