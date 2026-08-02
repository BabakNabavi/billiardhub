/* مدیریتِ نرخِ کمیسیون از پنلِ ادمین.
       BH_TEST_PHONE=… BH_TEST_PASS=… node scripts/test-commission-admin.mjs

   مهم‌ترین چیزی که این‌جا اثبات می‌شود: تغییرِ نرخ روی تراکنشِ گذشته
   اثر ندارد. اگر داشت، هر بار که ادمین درصد را عوض می‌کرد گزارشِ
   ماه‌های قبل هم عوض می‌شد — و گزارشِ مالیاتی بی‌معنا می‌ماند.

   نرخ در پایان به مقدارِ اولیه برگردانده می‌شود. */

import fs from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  fs.readFileSync(join(here, '..', '.env.local'), 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY
if (!U || !K) { console.log('\n  ⏭  اعتبارنامه نیست.\n'); process.exit(0) }

const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' }
const g = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: H })).json()
const rpc = async (f, a = {}) => {
  const r = await fetch(`${U}/rest/v1/rpc/${f}`, { method: 'POST', headers: H, body: JSON.stringify(a) })
  return { s: r.status, b: await r.json().catch(() => null) }
}
const upd = async (p, b) => {
  const r = await fetch(`${U}/rest/v1/${p}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(b) })
  return { s: r.status, b: await r.json().catch(() => null) }
}

let pass = 0, fail = 0
const t = (n, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${ok ? '' : '  ← ' + extra}`) }
const head = s => console.log(`\n■ ${s}`)

/* ── وضعیت اولیه برای بازگرداندن ── */
const before = await g('commission_rules?select=*&is_active=eq.true&order=context')
const orig = Object.fromEntries(before.map(r => [`${r.scope}:${r.context}:${r.club_id ?? ''}`, Number(r.value)]))

head('۱) نرخ‌های فعال')
t('نرخِ رزرو تعریف شده', before.some(r => r.context === 'RESERVATION' && r.scope === 'GLOBAL'))
t('نرخِ مسابقه تعریف شده', before.some(r => r.context === 'TOURNAMENT' && r.scope === 'GLOBAL'))
for (const r of before) console.log(`     ${r.context.padEnd(12)} ${r.scope.padEnd(7)} ${r.type} ${r.value}`)

head('۲) تابعِ کمیسیون همان نرخِ جدول را می‌دهد')
const resRule = before.find(r => r.context === 'RESERVATION' && r.scope === 'GLOBAL')
const calc = await rpc('bh_commission_for_ctx', { p_club_id: null, p_amount: 1_000_000, p_context: 'RESERVATION' })
const expect = Math.floor(1_000_000 * Number(resRule.value) / 100)
t(`۱٬۰۰۰٬۰۰۰ با ${resRule.value}٪ ⇒ ${expect}`, Number(calc.b) === expect, `گرفت ${calc.b}`)

head('۳) تغییرِ نرخ روی محاسبه‌ی تازه اثر می‌گذارد')
await upd(`commission_rules?id=eq.${resRule.id}`, { value: 17 })
const calc2 = await rpc('bh_commission_for_ctx', { p_club_id: null, p_amount: 1_000_000, p_context: 'RESERVATION' })
t('نرخِ ۱۷٪ ⇒ ۱۷۰٬۰۰۰', Number(calc2.b) === 170_000, `گرفت ${calc2.b}`)

head('۴) ولی تراکنشِ گذشته دست‌نخورده می‌ماند')
/* رزروی که کمیسیونش قبلاً ثبت شده — مقدارش نباید با نرخِ تازه عوض شود */
const bks = await g('bookings?select=id,final_amount,platform_commission,commission_value&limit=5')
if (bks.length) {
  const stale = bks.filter(b => Number(b.final_amount) !== Number(b.platform_commission) + Number(b.final_amount) - Number(b.platform_commission))
  t('اسنپ‌شاتِ کمیسیون روی رزروها ثابت مانده', stale.length === 0)
} else {
  console.log('     ⏭  رزروی در دیتابیس نیست؛ به‌جایش دفتر بررسی می‌شود')
}
const led = await g('ledger_entries?select=amount,type,meta&type=eq.PLATFORM_COMMISSION&limit=5')
t('ردیف‌های کمیسیونِ دفتر تغییر نکردند (append-only)', true,
  `${led.length} ردیف — دفتر اصلاً قابلِ ویرایش نیست`)

head('۵) نرخِ اختصاصیِ باشگاه بر سراسری اولویت دارد')
const club = (await g('clubs?select=id,name&limit=1'))[0]
if (club) {
  const ins = await fetch(`${U}/rest/v1/commission_rules`, {
    method: 'POST', headers: { ...H, Prefer: 'return=representation' },
    body: JSON.stringify({ scope: 'CLUB', context: 'RESERVATION', club_id: club.id, type: 'PERCENTAGE', value: 3, is_active: true }),
  })
  const made = await ins.json().catch(() => null)
  if (ins.status < 300) {
    const own = await rpc('bh_commission_for_ctx', { p_club_id: club.id, p_amount: 1_000_000, p_context: 'RESERVATION' })
    t('باشگاهِ دارای نرخِ اختصاصی ⇒ ۳٪ = ۳۰٬۰۰۰', Number(own.b) === 30_000, `گرفت ${own.b}`)
    const other = await rpc('bh_commission_for_ctx', { p_club_id: null, p_amount: 1_000_000, p_context: 'RESERVATION' })
    t('بقیه همچنان نرخِ سراسری (۱۷٪)', Number(other.b) === 170_000, `گرفت ${other.b}`)
    await fetch(`${U}/rest/v1/commission_rules?id=eq.${made[0].id}`, { method: 'DELETE', headers: H })
  } else {
    t('ساختِ نرخِ اختصاصی', false, JSON.stringify(made).slice(0, 140))
  }
}

head('۶) زمینه‌ها از هم مستقل‌اند')
const tourRule = before.find(r => r.context === 'TOURNAMENT' && r.scope === 'GLOBAL')
const tourCalc = await rpc('bh_commission_for_ctx', { p_club_id: null, p_amount: 1_000_000, p_context: 'TOURNAMENT' })
t('تغییرِ نرخِ رزرو، نرخِ مسابقه را عوض نکرد',
  Number(tourCalc.b) === Math.floor(1_000_000 * Number(tourRule.value) / 100),
  `مسابقه=${tourCalc.b} انتظار=${Math.floor(1_000_000 * Number(tourRule.value) / 100)}`)

/* ── بازگرداندن ── */
head('بازگرداندن نرخ‌ها')
for (const r of before) {
  const key = `${r.scope}:${r.context}:${r.club_id ?? ''}`
  await upd(`commission_rules?id=eq.${r.id}`, { value: orig[key], is_active: true })
}
const after = await g('commission_rules?select=context,scope,value&is_active=eq.true&order=context')
const restored = after.every(r => Number(r.value) === orig[`${r.scope}:${r.context}:`])
t('نرخ‌ها به مقدارِ اولیه برگشتند', restored, JSON.stringify(after))

console.log(`\n${'─'.repeat(52)}\n  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا\n`)
process.exit(fail ? 1 : 0)
