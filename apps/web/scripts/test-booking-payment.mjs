/* مسیرِ رزرو و پرداخت — عمیق.
       node scripts/test-booking-payment.mjs

   ⚠️ عمداً هیچ پرداختی *تأیید* نمی‌شود. تأییدِ پرداخت به دفترِ
   append-only می‌نویسد و ردیفش پاک‌شدنی نیست. رزرو و ساختِ پرداخت
   به دفتر دست نمی‌زنند، پس همان‌ها آزموده می‌شوند و در پایان بررسی
   می‌شود که دفتر یک ردیف هم اضافه نکرده باشد.

   هر رزرو/پرداختِ آزمایشی در پایان پاک می‌شود. */
import fs from 'node:fs'
import jwt from 'jsonwebtoken'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY, S = env.JWT_SECRET
const B = process.env.BH_BASE ?? 'http://localhost:3000'

const rest = async (p, i) => {
  const r = await fetch(U + '/rest/v1/' + p, {
    ...(i ?? {}),
    headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(i?.headers ?? {}) },
  })
  const t = await r.text()
  return { s: r.status, b: t ? JSON.parse(t) : null }
}

const me = (await rest('users?select=id,phone,"primaryRole"&phone=eq.09001327283')).b[0]
if (!me) { console.log('  ✗ حسابِ آزمایشی نیست'); process.exit(1) }
const other = (await rest('users?select=id,phone&id=neq.' + me.id + '&limit=1')).b[0]

const madeBookings = []
const cleanup = async () => {
  for (const id of madeBookings) {
    try { await rest('payments?booking_id=eq.' + id, { method: 'DELETE' }) } catch { /* */ }
    try { await rest('booking_slots?booking_id=eq.' + id, { method: 'DELETE' }) } catch { /* */ }
    try { await rest('bookings?id=eq.' + id, { method: 'DELETE' }) } catch { /* */ }
  }
}
for (const sg of ['SIGINT', 'SIGTERM', 'SIGPIPE']) process.on(sg, () => { cleanup().finally(() => process.exit(130)) })

let pass = 0, fail = 0
const t = (n, ok, x = '') => { ok ? pass++ : fail++; console.log('  ' + (ok ? '✓' : '✗') + ' ' + n + (ok ? '' : '  ← ' + x)) }
const head = x => console.log('\n■ ' + x)
const note = x => console.log('  ⓘ ' + x)
const tok = u => jwt.sign({ sub: u.id, role: 'user', phone: u.phone }, S, { expiresIn: '20m' })
const call = async (p, i, k) => {
  const r = await fetch(B + p, { ...(i ?? {}), headers: { ...(k ? { Authorization: 'Bearer ' + k } : {}), 'Content-Type': 'application/json', ...(i?.headers ?? {}) } })
  let b = null; try { b = await r.json() } catch { /* */ }
  return { s: r.status, b }
}

const ledgerBefore = ((await rest('ledger_entries?select=id')).b ?? []).length
const myTok = tok(me)

/* تاریخِ آینده تا با رزروِ واقعیِ کسی تداخل نکند */
const d = new Date(Date.now() + 40 * 24 * 3600_000)
const DATE = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
/* API بازه را با ISO می‌گیرد و ساعت‌ها را خودش از UTC درمی‌آورد */
const slot = (from, to) => ({ startTime: `${DATE}T${String(from).padStart(2, '0')}:00:00.000Z`,
                              endTime:   `${DATE}T${String(to).padStart(2, '0')}:00:00.000Z` })

try {
  head('پیش‌نیاز — میزی با قیمت')
  const table = (await rest('tables?select=id,"clubId","pricePerHour","isActive"&limit=20')).b
    ?.find(x => Number(x.pricePerHour) > 0 && x.isActive !== false)
  if (!table) { note('هیچ میزی با قیمت نیست — بخشِ رزرو رد شد'); throw new Error('SKIP') }
  t('میزِ قیمت‌دار پیدا شد', true, '')
  const PRICE = Number(table.pricePerHour)
  note('میز ' + table.id.slice(0, 8) + ' — ' + PRICE.toLocaleString('fa-IR') + ' تومان/ساعت')

  head('ساختِ رزرو')
  t('مهمان نمی‌تواند رزرو کند',
    (await call('/api/bookings', { method: 'POST', body: JSON.stringify({ clubId: table.clubId, tableId: table.id, ...slot(10, 11) }) }, null)).s === 401, '')

  const mk = await call('/api/bookings', {
    method: 'POST',
    body: JSON.stringify({ clubId: table.clubId, tableId: table.id, ...slot(10, 12), playerCount: 1 }),
  }, myTok)
  const bid = mk.b?.id
  if (bid) madeBookings.push(bid)
  t('رزرو ساخته می‌شود', mk.s === 201 && !!bid, 'HTTP ' + mk.s + ' ' + JSON.stringify(mk.b).slice(0, 120))

  head('قیمت از سرور می‌آید، نه از کلاینت')
  const row = (await rest('bookings?select=*&id=eq.' + bid)).b[0]
  t('مبلغ = قیمتِ میز × ساعت', Number(row.final_amount) === PRICE * 2 - Number(row.discount_amount ?? 0),
    'final=' + row.final_amount + ' base=' + row.base_amount + ' off=' + row.discount_amount)
  const forged = await call('/api/bookings', {
    method: 'POST',
    body: JSON.stringify({ clubId: table.clubId, tableId: table.id, ...slot(14, 15), playerCount: 1,
      finalAmount: 1, baseAmount: 1, price: 1, final_amount: 1 }),
  }, myTok)
  if (forged.b?.id) madeBookings.push(forged.b.id)
  const forgedRow = forged.b?.id ? (await rest('bookings?select=final_amount&id=eq.' + forged.b.id)).b[0] : null
  t('مبلغِ ارسالیِ کلاینت نادیده گرفته می‌شود',
    !forgedRow || Number(forgedRow.final_amount) === PRICE, 'شد ' + forgedRow?.final_amount)

  head('رزروِ تکراری — قفلِ سطحِ دیتابیس')
  const dup = await call('/api/bookings', {
    method: 'POST',
    body: JSON.stringify({ clubId: table.clubId, tableId: table.id, ...slot(11, 13), playerCount: 1 }),
  }, myTok)
  if (dup.b?.id) madeBookings.push(dup.b.id)
  t('ساعتِ گرفته‌شده دوباره رزرو نمی‌شود', dup.s === 409, 'HTTP ' + dup.s)
  t('و ساعتِ آزادِ کنارش هم قفل نمی‌ماند',
    ((await rest('booking_slots?select=hour&booking_id=eq.' + bid)).b ?? []).length === 2, '')

  head('ورودیِ نامعتبر')
  for (const [label, body] of [
    ['میزِ باشگاهِ دیگر', { clubId: table.clubId, tableId: '00000000-0000-0000-0000-000000000000', ...slot(15, 16) }],
    ['بازه‌ی صفر', { clubId: table.clubId, tableId: table.id, ...slot(16, 16) }],
    ['پایان پیش از شروع', { clubId: table.clubId, tableId: table.id, ...slot(18, 17) }],
    ['تاریخِ بی‌معنی', { clubId: table.clubId, tableId: table.id, startTime: 'چرت', endTime: 'چرت' }],
    ['رزرو در گذشته', { clubId: table.clubId, tableId: table.id, startTime: '2020-01-01T10:00:00.000Z', endTime: '2020-01-01T11:00:00.000Z' }],
  ]) {
    const r = await call('/api/bookings', { method: 'POST', body: JSON.stringify(body) }, myTok)
    if (r.b?.id) madeBookings.push(r.b.id)
    t(label + ' رد می‌شود', r.s >= 400, 'HTTP ' + r.s)
  }

  head('مالکیت — رزروِ کسِ دیگر')
  if (other) {
    const otherTok = tok(other)
    t('کاربرِ دیگر رزروِ من را نمی‌بیند',
      (await call('/api/bookings/' + bid, null, otherTok)).s >= 400, '')
    t('کاربرِ دیگر رزروِ من را لغو نمی‌کند',
      (await call('/api/bookings/' + bid + '/cancel', { method: 'POST', body: '{}' }, otherTok)).s >= 400, '')
    t('رزرو هنوز سرِ جایش است',
      ((await rest('bookings?select=id&id=eq.' + bid)).b ?? []).length === 1, '')
  } else note('کاربرِ دومی نیست — بخشِ مالکیت رد شد')

  head('پرداخت')
  t('مهمان پرداخت نمی‌سازد',
    (await call('/api/payments/create', { method: 'POST', body: JSON.stringify({ bookingId: bid }) }, null)).s === 401, '')
  if (other) {
    const r = await call('/api/payments/create', { method: 'POST', body: JSON.stringify({ bookingId: bid }) }, tok(other))
    t('کاربرِ دیگر برای رزروِ من پرداخت نمی‌سازد', r.s === 403 || r.s === 404, 'HTTP ' + r.s)
  }
  const pay1 = await call('/api/payments/create', { method: 'POST', body: JSON.stringify({ bookingId: bid }) }, myTok)
  t('صاحبِ رزرو پرداخت می‌سازد', pay1.s === 200 || pay1.s === 201, 'HTTP ' + pay1.s + ' ' + JSON.stringify(pay1.b).slice(0, 110))
  const pays = (await rest('payments?select=id,amount,status&booking_id=eq.' + bid)).b ?? []
  t('مبلغِ پرداخت = مبلغِ رزرو', pays[0] && Number(pays[0].amount) === Number(row.final_amount),
    'pay=' + pays[0]?.amount + ' booking=' + row.final_amount)

  const pay2 = await call('/api/payments/create', { method: 'POST', body: JSON.stringify({ bookingId: bid }) }, myTok)
  const pays2 = (await rest('payments?select=id&booking_id=eq.' + bid)).b ?? []
  t('درخواستِ دوم پرداختِ تکراری نمی‌سازد', pays2.length === 1, pays2.length + ' ردیفِ پرداخت')
  t('و همان پرداختِ باز را برمی‌گرداند', pay2.s === 200 || pay2.s === 201, 'HTTP ' + pay2.s)

  head('رزروِ منقضی قابلِ پرداخت نیست')
  await rest('bookings?id=eq.' + bid, { method: 'PATCH', body: JSON.stringify({ expires_at: new Date(Date.now() - 3600_000).toISOString() }) })
  const expired = await call('/api/payments/create', { method: 'POST', body: JSON.stringify({ bookingId: bid }) }, myTok)
  t('پرداختِ رزروِ منقضی رد می‌شود', expired.s === 410 || expired.s === 409, 'HTTP ' + expired.s)

} catch (e) {
  if (String(e.message) !== 'SKIP') { console.error(e); fail++ }
} finally {
  head('پاک‌سازی')
  await cleanup()
  t('هیچ رزروِ آزمایشی نماند', ((await rest('bookings?select=id&id=in.(' + (madeBookings.join(',') || '00000000-0000-0000-0000-000000000000') + ')')).b ?? []).length === 0, '')
  const ledgerAfter = ((await rest('ledger_entries?select=id')).b ?? []).length
  t('دفترِ مالی یک ردیف هم اضافه نشد', ledgerAfter === ledgerBefore, ledgerBefore + ' → ' + ledgerAfter)
  const slots = ((await rest('booking_slots?select=id&booking_date=eq.' + DATE)).b ?? []).length
  t('هیچ ساعتی قفل نماند', slots === 0, slots + ' ساعت')
}

console.log('\n  موفق: ' + pass + '   ناموفق: ' + fail + '\n')
process.exit(fail ? 1 : 0)
