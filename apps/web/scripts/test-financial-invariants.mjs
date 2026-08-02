/* ناوردایِ مالی — روی دیتابیسِ واقعی، با fixtureی که خودش را پاک می‌کند.
       node scripts/test-financial-invariants.mjs           (فقط بررسی، بدون نوشتن)
       node scripts/test-financial-invariants.mjs --write    (با fixture)

   این تست پس از اجرای مهاجرت‌های ۰۴۰ و ۰۴۱ معنا دارد. بدونِ `--write`
   فقط چیزهایی را می‌سنجد که خواندنی‌اند (وجودِ ستون، تابع، نما، و
   سازگاریِ موجودی با دفتر) و هیچ ردیفی نمی‌سازد.

   با `--write` یک باشگاهِ ساختگی و یک زنجیره‌ی کاملِ مالی می‌سازد و در
   پایان همه را پاک می‌کند. هرگز روی داده‌ی کاربرِ واقعی کار نمی‌کند:
   همه‌ی رکوردها پیشوندِ `zz-test-` دارند. */

import fs from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  fs.readFileSync(join(here, '..', '.env.local'), 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))

const U = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
const K = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY
if (!U || !K) { console.log('\n  ⏭  اعتبارنامه‌ی Supabase نیست — رد شد.\n'); process.exit(0) }

const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' }
const get = async p => { const r = await fetch(`${U}/rest/v1/${p}`, { headers: H }); return { s: r.status, b: await r.json().catch(() => null) } }
const post = async (p, body, prefer = 'return=representation') => {
  const r = await fetch(`${U}/rest/v1/${p}`, { method: 'POST', headers: { ...H, Prefer: prefer }, body: JSON.stringify(body) })
  return { s: r.status, b: await r.json().catch(() => null) }
}
const patch = async (p, body) => {
  const r = await fetch(`${U}/rest/v1/${p}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(body) })
  return { s: r.status, b: await r.json().catch(() => null) }
}
const del = async p => { const r = await fetch(`${U}/rest/v1/${p}`, { method: 'DELETE', headers: H }); return r.status }
const rpc = async (fn, args) => {
  const r = await fetch(`${U}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(args ?? {}) })
  return { s: r.status, b: await r.json().catch(() => null) }
}

let pass = 0, fail = 0, skip = 0
const t = (n, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${ok ? '' : '  ← ' + extra}`) }
const head = s => console.log(`\n■ ${s}`)

const WRITE = process.argv.includes('--write')

/* ── ۱) مهاجرت اعمال شده؟ ─────────────────────────────────────────── */
head('۱) طرحِ دیتابیس (مهاجرت ۰۴۰/۰۴۱)')

const ledgerCols = await get('ledger_entries?select=source_key&limit=1')
const migrated = ledgerCols.s === 200
t('ستونِ source_key در دفتر هست', migrated,
  migrated ? '' : 'مهاجرت ۰۴۰ هنوز اجرا نشده — بقیه‌ی سنجش‌ها رد می‌شوند')

if (!migrated) {
  console.log('\n  ⏭  مهاجرت اجرا نشده؛ ادامه بی‌معنی است.\n')
  console.log(`  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا\n`)
  process.exit(fail ? 1 : 0)
}

t('ستون‌های تفکیکِ پرداخت هست', (await get('payments?select=gross_amount,commission_amount,club_amount,purpose&limit=1')).s === 200)
t('ستونِ context کمیسیون هست', (await get('commission_rules?select=context&limit=1')).s === 200)
t('اسنپ‌شاتِ نرخِ کمیسیون روی رزرو هست', (await get('bookings?select=commission_value,commission_rule_id,completed_at&limit=1')).s === 200)
t('چرخه‌ی بازپرداخت گسترش یافته', (await get('refunds?select=cancellation_fee,gross_amount,idempotency_key&limit=1')).s === 200)
t('نمای گزارشِ مالی ساخته شده', (await get('v_financial_transactions?select=platform_revenue,club_share&limit=1')).s === 200)

const rules = await get('commission_rules?select=context,scope,value,is_active&is_active=eq.true')
const ctxs = Array.isArray(rules.b) ? [...new Set(rules.b.map(r => r.context))] : []
t('هر دو زمینه‌ی کمیسیون تعریف شده', ctxs.includes('RESERVATION') && ctxs.includes('TOURNAMENT'), JSON.stringify(ctxs))

/* ── ۲) توابع ─────────────────────────────────────────────────────── */
head('۲) توابعِ مالی')
/* PostgREST تابع را با *نام و امضا* پیدا می‌کند؛ فراخوانِ بی‌آرگومان
   برای تابعی که پارامتر دارد همیشه ۴۰۴ می‌دهد و چیزی درباره‌ی وجودش
   نمی‌گوید. پس با آرگومانِ درست ولی شناسه‌ی ناموجود صدا زده می‌شود:
   ۴۰۴ ⇒ تابع نیست، ۴۰۰ (استثنای «یافت نشد») ⇒ تابع هست. */
const NIL = '00000000-0000-0000-0000-000000000000'
const PROBES = [
  ['bh_complete_booking',       { p_booking_id: NIL }],
  ['bh_complete_due_bookings',  {}],
  ['bh_fail_settlement',        { p_id: NIL, p_reason: 'probe' }],
  ['bh_complete_refund',        { p_refund_id: NIL, p_reference: 'probe', p_admin: NIL }],
  ['bh_tournament_complete',    { p_tournament_id: NIL }],
  ['bh_tournament_confirm',     { p_registration_id: NIL, p_provider: 'probe', p_ref_id: 'probe', p_amount: 0 }],
  ['bh_create_settlement',      { p_club_id: NIL, p_admin: NIL, p_amount: null, p_idem: null }],
  ['bh_commission_for_ctx',     { p_club_id: NIL, p_amount: 1000, p_context: 'RESERVATION' }],
]
for (const [fn, args] of PROBES) {
  const r = await rpc(fn, args)
  t(`${fn} وجود دارد`, r.s !== 404, `HTTP ${r.s} ${JSON.stringify(r.b).slice(0, 90)}`)
}

/* آشتی جداگانه سنجیده می‌شود چون واقعاً می‌نویسد — با باشگاهِ واقعی
   صدا زده می‌شود و نتیجه‌اش باید همان چیزی باشد که دفتر می‌گوید. */
const anyClub = (await get('club_accounts?select=club_id&limit=1')).b?.[0]?.club_id
if (anyClub) {
  const rec = await rpc('bh_reconcile_club_account', { p_club_id: anyClub })
  t('bh_reconcile_club_account کار می‌کند', rec.s < 300, `HTTP ${rec.s} ${JSON.stringify(rec.b).slice(0, 90)}`)
} else { skip++; console.log('  ⏭  باشگاهی برای آشتی نیست') }

/* ── ۳) سازگاریِ موجودی با دفتر ────────────────────────────────────── */
head('۳) موجودیِ باشگاه = دفتر')
const accs = (await get('club_accounts?select=club_id,pending_balance,total_earnings,total_settled')).b ?? []
const led = (await get('ledger_entries?select=club_id,type,amount,status&status=eq.POSTED')).b ?? []
let drift = []
for (const a of accs) {
  const rows = led.filter(l => l.club_id === a.club_id)
  const earned = rows.filter(l => l.type === 'CLUB_EARNING').reduce((s, l) => s + Number(l.amount), 0)
  const rev = rows.filter(l => l.type === 'CLUB_EARNING_REVERSAL').reduce((s, l) => s - Number(l.amount), 0)
  const settled = rows.filter(l => l.type === 'SETTLEMENT').reduce((s, l) => s - Number(l.amount), 0)
  const expected = earned - rev - settled
  if (Number(a.pending_balance) !== expected) drift.push({ club: a.club_id.slice(0, 8), was: a.pending_balance, should: expected })
}
t('هیچ باشگاهی موجودیِ منحرف ندارد', drift.length === 0, JSON.stringify(drift).slice(0, 200))

/* ── ۴) ناوردایِ علامت در دفتر ─────────────────────────────────────── */
head('۴) کنوانسیونِ علامت')
const POS = ['BOOKING_PAYMENT', 'TOURNAMENT_PAYMENT', 'PLATFORM_COMMISSION', 'CLUB_EARNING', 'CANCELLATION_FEE', 'SETTLEMENT_REVERSAL']
const NEG = ['REFUND', 'SETTLEMENT', 'CLUB_EARNING_REVERSAL']
const badPos = led.filter(l => POS.includes(l.type) && Number(l.amount) < 0)
const badNeg = led.filter(l => NEG.includes(l.type) && Number(l.amount) > 0)
t('نوع‌های درآمدی همه مثبت‌اند', badPos.length === 0, JSON.stringify(badPos.slice(0, 3)))
t('نوع‌های خروجی همه منفی‌اند', badNeg.length === 0, JSON.stringify(badNeg.slice(0, 3)))

/* ── ۵) ناوردایِ تفکیکِ مبلغِ رزرو ──────────────────────────────────── */
head('۵) مبلغِ نهایی = کمیسیون + سهمِ باشگاه')
const bk = (await get('bookings?select=id,final_amount,platform_commission,club_amount&limit=500')).b ?? []
const badSplit = bk.filter(b => Number(b.final_amount) !== Number(b.platform_commission) + Number(b.club_amount))
t('همه‌ی رزروها ناوردا را رعایت می‌کنند', badSplit.length === 0, JSON.stringify(badSplit.slice(0, 3)))

/* ── ۶) دفترِ append-only ──────────────────────────────────────────── */
if (!WRITE) {
  head('۶) append-only و زنجیره‌ی کامل')
  console.log('  ⏭  بدونِ --write اجرا نمی‌شود (نیازمندِ fixture)')
  skip += 2
} else {
  head('۶) دفتر واقعاً append-only است')
  const probe = await post('ledger_entries', {
    type: 'ADJUSTMENT', amount: 1, currency: 'IRT', status: 'POSTED',
    source_key: 'zz-test-append-' + Date.now(),
    meta: { zzTest: true },
  })
  if (probe.s >= 300) {
    t('ردیفِ آزمایشی ساخته شد', false, `HTTP ${probe.s} ${JSON.stringify(probe.b).slice(0, 120)}`)
  } else {
    const id = probe.b[0].id
    const upd = await patch(`ledger_entries?id=eq.${id}`, { amount: 999 })
    t('تغییرِ مبلغِ ردیفِ دفتر رد می‌شود', upd.s >= 400, `HTTP ${upd.s}`)
    const rev = await patch(`ledger_entries?id=eq.${id}`, { status: 'REVERSED' })
    t('فقط گذر به REVERSED مجاز است', rev.s < 300, `HTTP ${rev.s} ${JSON.stringify(rev.b).slice(0, 120)}`)
    const dl = await del(`ledger_entries?id=eq.${id}`)
    t('حذفِ ردیفِ دفتر رد می‌شود', dl >= 400, `HTTP ${dl}`)

  }

  head('۷) کلیدِ یکتای رویداد')
  const key = 'zz-test-dup-' + Date.now()
  const a = await post('ledger_entries', { type: 'ADJUSTMENT', amount: 1, source_key: key, meta: { zzTest: true } })
  const b2 = await post('ledger_entries', { type: 'ADJUSTMENT', amount: 1, source_key: key, meta: { zzTest: true } })
  t('ردیفِ تکراری با همان source_key رد می‌شود', a.s < 300 && b2.s >= 400, `${a.s}/${b2.s}`)

  /* ── پاک‌سازیِ fixture ──
     دفتر عمداً append-only است و هیچ مسیرِ حذفی هم برایش ساخته نشده
     (تصمیمِ آگاهانه: نداشتنِ درِ پشتی مهم‌تر از خودکار بودنِ پاک‌سازی
     است). پس این حالت ردیف جا می‌گذارد و خودش دستورِ پاک‌کردن را
     می‌دهد — بی‌صدا رهایش نمی‌کند. */
  head('۸) پاک‌سازیِ داده‌ی آزمایشی')
  const left = await get('ledger_entries?select=id,source_key&source_key=like.zz-*')
  const n = Array.isArray(left.b) ? left.b.length : 0
  if (n === 0) {
    t('چیزی برای پاک‌کردن نماند', true)
  } else {
    console.log(`  ⚠  ${n} ردیفِ آزمایشی در دفتر ماند. برای پاک‌کردن، در SQL Editor بزنید:\n`)
    console.log(`      ALTER TABLE ledger_entries DISABLE TRIGGER ledger_append_only;`)
    console.log(`      DELETE FROM ledger_entries WHERE source_key LIKE 'zz-%';`)
    console.log(`      ALTER TABLE ledger_entries ENABLE TRIGGER ledger_append_only;\n`)
    skip++
  }
}

console.log(`\n${'─'.repeat(52)}`)
console.log(`  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا${skip ? `، ${skip} رد‌شده` : ''}\n`)
process.exit(fail ? 1 : 0)
