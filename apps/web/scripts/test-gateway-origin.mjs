/* آزمونِ اینکه کالبکِ درگاه از بررسیِ Origin رد می‌شود.

   چرا هست: پی‌پینگ با یک POSTِ مرورگری برمی‌گردد و مرورگر `Origin`
   دامنه‌ی درگاه را رویش می‌گذارد. اگر پروکسی آن را رد کند، پول از
   حساب کم می‌شود و رزرو هرگز قطعی نمی‌شود — و در آزمونِ دستی هم
   دیده نمی‌شود، چون فقط با پرداختِ واقعی رخ می‌دهد.

   اجرا (روی سرورِ محلیِ بیلدشده):
     node apps/web/scripts/test-gateway-origin.mjs http://localhost:3000
*/

const BASE = process.argv[2] || 'http://localhost:3000'

const CASES = [
  // مسیر, Origin, باید رد شود؟
  ['/api/payments/callback/payping?payment=x', 'https://api.payping.ir', false],
  ['/api/tournaments/callback/payping?paymentId=x', 'https://api.payping.ir', false],
  ['/api/clubs/sms/callback/payping?campaign=x', 'https://api.payping.ir', false],
  ['/api/ads/campaigns/callback/payping?order=x', 'https://api.payping.ir', false],
  /* هر مسیرِ دیگری باید همچنان رد شود — معافیت نباید نشت کند */
  ['/api/bookings', 'https://evil.example.com', true],
  ['/api/users/profile', 'https://evil.example.com', true],
]

let pass = 0, fail = 0

for (const [path, origin, mustReject] of CASES) {
  let status = 0, body = ''
  try {
    const r = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Origin': origin, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'status=0',
      redirect: 'manual',
    })
    status = r.status
    body = await r.text().catch(() => '')
  } catch (e) {
    console.log('  ⚠️  ', path, '— سرور پاسخ نداد:', e.message)
    fail++
    continue
  }

  const rejected = status === 403 && /دامنه/.test(body)
  const ok = rejected === mustReject
  if (ok) { pass++; console.log('  ✅', mustReject ? 'رد شد' : 'گذشت  ', path) }
  else {
    fail++
    console.log('  ❌', path, '\n       انتظار:', mustReject ? 'رد' : 'عبور',
      '| گرفت: HTTP', status, rejected ? '(رد بر اساس دامنه)' : '')
  }
}

console.log(`\n${pass} قبول · ${fail} رد\n`)
process.exit(fail ? 1 : 0)
