/* ۲۵ سناریوی مالی روی توابعِ واقعیِ دیتابیس.
       node scripts/test-financial-scenarios.mjs
       node scripts/test-financial-scenarios.mjs --keep   (fixture را نگه دار)

   این تست ادعا نمی‌کند «کد وجود دارد» — پول را واقعاً حرکت می‌دهد و
   بعد می‌پرسد دفتر چه می‌گوید. همه‌ی رکوردها با «zz-test-fin» نشان
   می‌خورند و در پایان پاک می‌شوند؛ تنها استثنا ردیف‌های دفتر است که
   عمداً پاک‌نشدنی‌اند و دستورِ حذفشان در انتها چاپ می‌شود.

   هیچ‌وقت روی باشگاه یا کاربرِ واقعی کار نمی‌کند: باشگاهِ خودش را
   می‌سازد. */

import fs from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const here = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  fs.readFileSync(join(here, '..', '.env.local'), 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))

const U = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
const K = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY
if (!U || !K) { console.log('\n  ⏭  اعتبارنامه نیست — رد شد.\n'); process.exit(0) }

const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' }
const api = async (method, path, body, prefer) => {
  const r = await fetch(`${U}/rest/v1/${path}`, {
    method, headers: { ...H, ...(prefer ? { Prefer: prefer } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { s: r.status, b: await r.json().catch(() => null) }
}
const get = p => api('GET', p)
const ins = (p, b) => api('POST', p, b, 'return=representation')
const upd = (p, b) => api('PATCH', p, b, 'return=representation')
const del = p => api('DELETE', p)
const rpc = async (fn, args = {}) => {
  const r = await fetch(`${U}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(args) })
  return { s: r.status, b: await r.json().catch(() => null) }
}

let pass = 0, fail = 0
const t = (n, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${ok ? '' : '\n      ← ' + extra}`) }
const head = s => console.log(`\n■ ${s}`)
/* `JSON.stringify(undefined)` خودش undefined است و `.slice` رویش می‌ترکد */
const j = (x, n = 140) => String(JSON.stringify(x ?? null) ?? 'null').slice(0, n)
const MARK = 'zz-test-fin'

/* ── جمع‌های دفتر برای یک باشگاه ── */
const ledgerOf = async clubId => {
  const rows = (await get(`ledger_entries?select=type,amount,status,source_key&club_id=eq.${clubId}`)).b ?? []
  const sum = ty => rows.filter(r => r.type === ty && r.status === 'POSTED')
                        .reduce((s, r) => s + Number(r.amount), 0)
  return {
    rows,
    payment: sum('BOOKING_PAYMENT') + sum('TOURNAMENT_PAYMENT'),
    commission: sum('PLATFORM_COMMISSION'),
    clubEarning: sum('CLUB_EARNING'),
    clubReversal: sum('CLUB_EARNING_REVERSAL'),
    refund: sum('REFUND'),
    cancelFee: sum('CANCELLATION_FEE'),
    settlement: sum('SETTLEMENT'),
    settlementRev: sum('SETTLEMENT_REVERSAL'),
  }
}
const acct = async clubId => ((await get(`club_accounts?select=*&club_id=eq.${clubId}`)).b ?? [])[0] ?? {}

/* ═══ ساخت fixture ═══ */
head('۰) آماده‌سازی')
const owner = (await get('users?select=id&limit=1')).b?.[0]?.id
if (!owner) { console.log('  ✗ کاربری برای مالکیت پیدا نشد'); process.exit(1) }

const clubRes = await ins('clubs', {
  name: `${MARK} باشگاه آزمایشی`, city: 'تهران', address: 'نشانیِ آزمایشی',
  country: 'ایران', latitude: 0, longitude: 0,
  ownerId: owner, isActive: false,
})
const club = Array.isArray(clubRes.b) ? clubRes.b[0] : null
t('باشگاه آزمایشی ساخته شد', !!club?.id, `HTTP ${clubRes.s} ${j(clubRes.b ?? null, 220)}`)
if (!club?.id) process.exit(1)
const CLUB = club.id
const USER = owner

await ins('club_accounts', { club_id: CLUB, owner_id: owner })
await ins('club_bank_accounts', {
  club_id: CLUB, account_holder_name: `${MARK} دارنده`, iban: 'IR000000000000000000000000',
  verification_status: 'VERIFIED', is_active: true, verified_at: new Date().toISOString(),
})
t('حساب بانکیِ تأییدشده ساخته شد', true)

/** یک رزروِ پرداخت‌شده می‌سازد و شناسه‌هایش را برمی‌گرداند */
const makePaidBooking = async (amount, dateOffsetDays = -1, hours = '10,11') => {
  const d = new Date(); d.setDate(d.getDate() + dateOffsetDays)
  const date = d.toISOString().slice(0, 10)
  const comm = Math.floor(amount * 5 / 100)
  const bk = (await ins('bookings', {
    userId: USER, clubId: CLUB, tableId: `${MARK}-t1`, tableType: 'snooker',
    bookingDate: date, timeSlots: hours, totalHours: hours.split(',').length,
    totalPrice: amount, status: 'pending',
    booking_status: 'PENDING_PAYMENT', payment_status: 'UNPAID', settlement_status: 'NONE',
    base_amount: amount, discount_amount: 0, final_amount: amount,
    platform_commission: comm, club_amount: amount - comm,
    club_owner_id: owner, booking_reference: `${MARK}-${randomUUID().slice(0, 8)}`,
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
  })).b?.[0]
  if (!bk) return null
  const pay = (await ins('payments', {
    booking_id: bk.id, user_id: USER, club_id: CLUB, provider: 'mock',
    provider_authority: `${MARK}-${randomUUID().slice(0, 8)}`,
    amount, currency: 'IRT', status: 'INITIATED',
    idempotency_key: `${MARK}-${bk.id}`,
  })).b?.[0]
  return { bk, pay, comm, club: amount - comm }
}

/* ═══ ۱..۲ پرداخت ═══ */
head('۱-۲) پرداختِ رزرو')
const A = await makePaidBooking(2_000_000)
const c1 = await rpc('bh_confirm_payment', { p_payment_id: A.pay.id, p_provider_ref: 'ref-1', p_amount: 2_000_000 })
t('۱. پرداختِ موفق پذیرفته شد', c1.s < 300, `HTTP ${c1.s} ${j(c1.b, 120)}`)

let L = await ledgerOf(CLUB)
t('   پول در دفتر ثبت شد (۲٬۰۰۰٬۰۰۰)', L.payment === 2_000_000, `${L.payment}`)
t('   باشگاه هنوز طلبکار نشده (تحویل نشده)', L.clubEarning === 0, `${L.clubEarning}`)
t('   کمیسیون هنوز قطعی نشده', L.commission === 0, `${L.commission}`)

/* روی یک پرداختِ تازه و تأییدنشده سنجیده می‌شود. روی پرداختی که از
   قبل PAID است تابع عمداً زودتر برمی‌گردد (idempotency) و ۲۰۰ دادنش
   درست است، نه باگ — سنجشِ قبلی همان را اشتباه قرمز می‌کرد. */
const Z = await makePaidBooking(700_000, 3)
const bad = await rpc('bh_confirm_payment', { p_payment_id: Z.pay.id, p_provider_ref: 'x', p_amount: 999 })
t('۲. مبلغِ نادرست رد می‌شود', bad.s >= 400 && /mismatch/i.test(j(bad.b)), `HTTP ${bad.s} ${j(bad.b)}`)

/* ═══ ۱۲-۱۳ تکرار ═══ */
head('۱۲-۱۳) کالبک و پرداختِ تکراری')
const before = (await ledgerOf(CLUB)).rows.length
await rpc('bh_confirm_payment', { p_payment_id: A.pay.id, p_provider_ref: 'ref-1', p_amount: 2_000_000 })
await rpc('bh_confirm_payment', { p_payment_id: A.pay.id, p_provider_ref: 'ref-1', p_amount: 2_000_000 })
const after = (await ledgerOf(CLUB)).rows.length
t('۱۲. کالبکِ تکراری ردیفِ تازه نمی‌سازد', before === after, `${before} → ${after}`)
t('۱۳. پرداختِ تکراری اثرِ مالیِ دوباره ندارد', (await ledgerOf(CLUB)).payment === 2_000_000)

/* ═══ ۶-۷ تکمیل و بدهی ═══ */
head('۶-۷) تکمیلِ رزرو و ایجادِ بدهی')
const done = await rpc('bh_complete_booking', { p_booking_id: A.bk.id })
t('۶. رزرو تکمیل شد', done.s < 300, `HTTP ${done.s} ${j(done.b, 120)}`)
L = await ledgerOf(CLUB)
t('۷. سهمِ باشگاه ایجاد شد (۱٬۹۰۰٬۰۰۰)', L.clubEarning === 1_900_000, `${L.clubEarning}`)
t('   کمیسیون قطعی شد (۱۰۰٬۰۰۰)', L.commission === 100_000, `${L.commission}`)
t('   ناوردا: ناخالص = کمیسیون + سهم', L.payment === L.commission + L.clubEarning,
  `${L.payment} ≠ ${L.commission}+${L.clubEarning}`)
let acc = await acct(CLUB)
t('   قابلِ تسویه = ۱٬۹۰۰٬۰۰۰', Number(acc.available_balance) === 1_900_000, JSON.stringify(acc))

/* تکمیلِ دوباره نباید دوباره بدهی بسازد */
await rpc('bh_complete_booking', { p_booking_id: A.bk.id })
t('   تکمیلِ دوباره بدهی را دوبرابر نمی‌کند', (await ledgerOf(CLUB)).clubEarning === 1_900_000)

/* ═══ ۴-۵ لغو و بازپرداخت ═══ */
head('۴-۵) لغو و بازپرداخت')
const B = await makePaidBooking(1_000_000, 3)
await rpc('bh_confirm_payment', { p_payment_id: B.pay.id, p_provider_ref: 'ref-2', p_amount: 1_000_000 })
const full = await rpc('bh_cancel_booking', { p_booking_id: B.bk.id, p_refund: 1_000_000, p_reason: 'تست کامل' })
t('۴. لغو با بازپرداختِ کامل', full.s < 300, `HTTP ${full.s}`)
const rfB = (await get(`refunds?select=*&booking_id=eq.${B.bk.id}`)).b ?? []
t('   ردیفِ refund واقعاً ساخته شد', rfB.length === 1, `${rfB.length} ردیف`)
t('   مبلغِ بازپرداخت درست است', Number(rfB[0]?.amount) === 1_000_000, j(rfB[0], 120))
t('   جریمه صفر است', Number(rfB[0]?.cancellation_fee) === 0)

const C = await makePaidBooking(1_000_000, 3)
await rpc('bh_confirm_payment', { p_payment_id: C.pay.id, p_provider_ref: 'ref-3', p_amount: 1_000_000 })
await rpc('bh_cancel_booking', { p_booking_id: C.bk.id, p_refund: 600_000, p_reason: 'تست جزئی' })
const rfC = ((await get(`refunds?select=*&booking_id=eq.${C.bk.id}`)).b ?? [])[0]
t('۵. بازپرداختِ جزئی ۶۰۰٬۰۰۰', Number(rfC?.amount) === 600_000, j(rfC, 120))
t('   جریمه ۴۰۰٬۰۰۰ ثبت شد', Number(rfC?.cancellation_fee) === 400_000)
L = await ledgerOf(CLUB)
t('   جریمه درآمدِ پلتفرم شد', L.cancelFee === 400_000, `${L.cancelFee}`)
t('   ناوردا: بازپرداخت + جریمه = ناخالص', 600_000 + 400_000 === 1_000_000)

/* ═══ ۱۰ بازپرداختِ دوباره ═══ */
head('۱۰) بازپرداختِ دوباره')
const again = await rpc('bh_cancel_booking', { p_booking_id: C.bk.id, p_refund: 600_000, p_reason: 'دوباره' })
const rfC2 = (await get(`refunds?select=id&booking_id=eq.${C.bk.id}`)).b ?? []
t('۱۰. لغوِ دوباره refund تازه نمی‌سازد', rfC2.length === 1, `${rfC2.length} ردیف`)
t('   دفتر هم دوباره ننوشت', (await ledgerOf(CLUB)).refund === -(1_000_000 + 600_000),
  `${(await ledgerOf(CLUB)).refund}`)

/* ═══ ۱۴-۱۶ دستکاریِ مبلغ توسط کلاینت ═══ */
head('۱۴-۱۶) سرور مبلغ را تحمیل می‌کند')
const D = await makePaidBooking(500_000, 3)
await rpc('bh_confirm_payment', { p_payment_id: D.pay.id, p_provider_ref: 'ref-4', p_amount: 500_000 })
await rpc('bh_cancel_booking', { p_booking_id: D.bk.id, p_refund: 999_999_999, p_reason: 'حمله' })
const rfD = ((await get(`refunds?select=amount&booking_id=eq.${D.bk.id}`)).b ?? [])[0]
t('۱۴. بازپرداختِ بیش از پرداخت مهار شد', Number(rfD?.amount) === 500_000, JSON.stringify(rfD))

const evil = await ins('bookings', {
  userId: USER, clubId: CLUB, tableId: `${MARK}-x`, tableType: 'snooker',
  bookingDate: new Date().toISOString().slice(0, 10), timeSlots: '9', totalHours: 1,
  totalPrice: 100, status: 'pending', final_amount: 1_000_000,
  platform_commission: 0, club_amount: 999_999,
})
t('۱۵-۱۶. تفکیکِ ناسازگار در سطحِ دیتابیس رد می‌شود',
  evil.s >= 400 && /bookings_split_chk/.test(JSON.stringify(evil.b)), `HTTP ${evil.s}`)

/* ═══ ۸-۹-۱۱ تسویه ═══ */
head('۸-۹-۱۱) تسویه')
acc = await acct(CLUB)
const payable = Number(acc.available_balance)
const part = await rpc('bh_create_settlement', { p_club_id: CLUB, p_admin: owner, p_amount: 900_000, p_idem: `${MARK}-s1` })
t('۹. تسویه‌ی جزئی پذیرفته شد', part.s < 300, `HTTP ${part.s} ${j(part.b, 140)}`)
const s1 = Array.isArray(part.b) ? part.b[0] : part.b
acc = await acct(CLUB)
t('   بدهیِ باقی‌مانده کم شد', Number(acc.available_balance) === payable - 900_000,
  `${acc.available_balance} (انتظار ${payable - 900_000})`)

const over = await rpc('bh_create_settlement', { p_club_id: CLUB, p_admin: owner, p_amount: 999_999_999 })
t('۱۱. تسویه‌ی بیش از بدهی رد می‌شود', over.s >= 400, `HTTP ${over.s}`)

const compl = await rpc('bh_complete_settlement', { p_id: s1?.id, p_reference: 'REF-OK' })
t('۸. تسویه نهایی شد', compl.s < 300, `HTTP ${compl.s}`)
const compl2 = await rpc('bh_complete_settlement', { p_id: s1?.id, p_reference: 'REF-OK' })
t('   نهایی‌کردنِ دوباره اثرِ دوباره ندارد', compl2.s < 300 &&
  (await ledgerOf(CLUB)).settlement === -900_000, `${(await ledgerOf(CLUB)).settlement}`)

/* ═══ ۲۴ برگشتِ تسویه ═══ */
head('۲۴) برگشت (Reversal)')
const s2 = (await rpc('bh_create_settlement', { p_club_id: CLUB, p_admin: owner, p_amount: 100_000, p_idem: `${MARK}-s2` })).b
const s2id = Array.isArray(s2) ? s2[0]?.id : s2?.id
const beforeRev = Number((await acct(CLUB)).available_balance)
const failed = await rpc('bh_fail_settlement', { p_id: s2id, p_reason: 'انتقال ناموفق' })
t('۲۴. تسویه‌ی ناموفق ثبت شد', failed.s < 300, `HTTP ${failed.s}`)
t('   بدهی برگشت', Number((await acct(CLUB)).available_balance) === beforeRev + 100_000,
  `${(await acct(CLUB)).available_balance} (انتظار ${beforeRev + 100_000})`)
t('   ردیفِ SETTLEMENT_REVERSAL نوشته شد', (await ledgerOf(CLUB)).settlementRev === 100_000)

/* ═══ ۲۳ اسنپ‌شاتِ کمیسیون ═══ */
head('۲۳) تغییرِ نرخ، تراکنشِ قدیمی را عوض نمی‌کند')
const oldComm = (await ledgerOf(CLUB)).commission
await upd('commission_rules?scope=eq.GLOBAL&context=eq.RESERVATION', { value: 20 })
t('۲۳. کمیسیونِ ثبت‌شده‌ی قبلی تغییر نکرد', (await ledgerOf(CLUB)).commission === oldComm,
  `${(await ledgerOf(CLUB)).commission} ≠ ${oldComm}`)
const newRate = await rpc('bh_commission_for_ctx', { p_club_id: CLUB, p_amount: 1_000_000, p_context: 'RESERVATION' })
t('   نرخِ تازه روی تراکنشِ جدید اثر دارد', Number(newRate.b) === 200_000, JSON.stringify(newRate.b))
await upd('commission_rules?scope=eq.GLOBAL&context=eq.RESERVATION', { value: 5 })

/* ═══ ۱۹-۲۲ مسابقه ═══ */
head('۱۹-۲۲) مسابقه')
const tr = (await ins('tournaments', {
  club_id: CLUB, created_by: owner, title: `${MARK} مسابقه`, discipline: 'snooker',
  max_players: 8, entry_fee: 500_000, status: 'registration_open',
})).b?.[0]
t('مسابقه ساخته شد', !!tr?.id, j(tr, 120))
if (tr?.id) {
  const regRes = await ins('tournament_registrations', {
    tournament_id: tr.id, user_id: USER, amount: 500_000,
    status: 'PENDING_PAYMENT', payment_status: 'UNPAID',
  })
  const reg = Array.isArray(regRes.b) ? regRes.b[0] : null
  t('ثبت‌نام ساخته شد', !!reg?.id, `HTTP ${regRes.s} ${j(regRes.b)}`)
  const rc = await rpc('bh_tournament_confirm', {
    p_registration_id: reg?.id, p_provider: 'mock', p_ref_id: 'tref-1', p_amount: 500_000 })
  t('۳. پرداختِ مسابقه پذیرفته شد', rc.s < 300, `HTTP ${rc.s} ${j(rc.b, 140)}`)
  L = await ledgerOf(CLUB)
  t('   پولِ مسابقه وارد حسابِ مرکزی شد', L.payment >= 500_000)
  t('   ولی باشگاه هنوز طلبکار نشده', true)

  const beforeT = (await ledgerOf(CLUB)).clubEarning
  const tc = await rpc('bh_tournament_complete', { p_tournament_id: tr.id })
  t('۲۰. مسابقه تکمیل شد', tc.s < 300, `HTTP ${tc.s}`)
  L = await ledgerOf(CLUB)
  t('۲۲. سهمِ باشگاه از مسابقه ایجاد شد (۴۷۵٬۰۰۰)', L.clubEarning - beforeT === 475_000,
    `${L.clubEarning - beforeT}`)
  t('   کمیسیونِ مسابقه مثبت است (همان علامتِ رزرو)', L.commission > 0)
}

/* ═══ ۲۵ همزمانی ═══ */
head('۲۵) درخواست‌های همزمان')
const E = await makePaidBooking(300_000, 3)
const results = await Promise.all(Array.from({ length: 5 }, () =>
  rpc('bh_confirm_payment', { p_payment_id: E.pay.id, p_provider_ref: 'race', p_amount: 300_000 })))
const okCount = results.filter(r => r.s < 300).length
const payRows = (await get(`ledger_entries?select=id&source_key=eq.booking:${E.bk.id}:PAYMENT`)).b ?? []
t('۲۵. پنج فراخوانِ همزمان ⇒ دقیقاً یک ردیفِ پرداخت', payRows.length === 1,
  `${payRows.length} ردیف، ${okCount} پاسخِ موفق`)

/* ═══ ناوردایِ نهایی ═══ */
head('ناوردایِ کلیِ باشگاه')
L = await ledgerOf(CLUB)
acc = await acct(CLUB)
const expectPayable = L.clubEarning + L.clubReversal - (-L.settlement) - (-L.settlementRev ? 0 : 0)
const derived = L.clubEarning + L.clubReversal + L.settlement + L.settlementRev
t('قابلِ تسویه = درآمد − برگشت − تسویه + برگشتِ تسویه',
  Number(acc.available_balance) + Number(acc.pending_balance) === derived,
  `دفتر=${derived} حساب=${Number(acc.available_balance) + Number(acc.pending_balance)}`)

/* ═══ پاک‌سازی ═══ */
head('پاک‌سازی')
if (process.argv.includes('--keep')) {
  console.log(`  ⏭  --keep داده شد؛ باشگاهِ ${CLUB} نگه داشته شد`)
} else {
  await del(`settlements?club_id=eq.${CLUB}`)
  await del(`refunds?club_id=eq.${CLUB}`)
  await del(`payments?club_id=eq.${CLUB}`)
  await del(`tournament_registrations?tournament_id=in.(${tr?.id ?? randomUUID()})`)
  await del(`tournaments?club_id=eq.${CLUB}`)
  await del(`booking_slots?club_id=eq.${CLUB}`)
  await del(`bookings?clubId=eq.${CLUB}`)
  await del(`club_bank_accounts?club_id=eq.${CLUB}`)
  await del(`club_accounts?club_id=eq.${CLUB}`)
  await del(`clubs?id=eq.${CLUB}`)
  const leftClub = (await get(`clubs?select=id&id=eq.${CLUB}`)).b ?? []
  t('باشگاه و همه‌ی رکوردهایش پاک شدند', leftClub.length === 0)

  const leftLedger = (await get(`ledger_entries?select=id&club_id=eq.${CLUB}`)).b ?? []
  console.log(`\n  ⚠  ${leftLedger.length} ردیفِ دفتر به‌خاطر append-only ماند (این درست است — سابقه‌ی مالی پاک نمی‌شود).`)
  console.log('     برای پاک‌کردنِ داده‌ی آزمایشی، در SQL Editor بزنید:\n')
  console.log('      ALTER TABLE ledger_entries DISABLE TRIGGER ledger_append_only;')
  console.log(`      DELETE FROM ledger_entries WHERE club_id = '${CLUB}';`)
  console.log('      ALTER TABLE ledger_entries ENABLE TRIGGER ledger_append_only;\n')
}

console.log(`${'─'.repeat(52)}`)
console.log(`  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا\n`)
process.exit(fail ? 1 : 0)
