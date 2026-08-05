/* آزمونِ خواندنِ بازگشت از درگاه — بدونِ شبکه و بدونِ دیتابیس.

   چرا لازم است: پی‌پینگ با POST و `x-www-form-urlencoded` برمی‌گردد،
   زرین‌پال با GET و کوئری. اگر این تابع یکی از دو شکل را نفهمد،
   نتیجه‌اش پولِ گرفته‌شده و سفارشِ فعال‌نشده است — و در آزمونِ دستی
   هم دیده نمی‌شود چون فقط با پرداختِ واقعی رخ می‌دهد.

   اجرا:  node apps/web/scripts/test-gateway-return.mjs */

import path from 'path'
import { pathToFileURL } from 'url'

const { readGatewayReturn } = await import(
  pathToFileURL(path.join(process.cwd(), 'apps/web/lib/payments/return.ts')).href)

let pass = 0, fail = 0
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) { pass++; console.log('  ✅', name) }
  else { fail++; console.log('  ❌', name, '\n      گرفت:', JSON.stringify(got), '\n      باید:', JSON.stringify(want)) }
}

/* ادای NextRequest — فقط چیزی که تابع لمس می‌کند */
const mk = (url, { method = 'GET', body = null, ct = '' } = {}) => ({
  method,
  nextUrl: new URL(url),
  headers: new Headers(ct ? { 'content-type': ct } : {}),
  json: async () => JSON.parse(body),
  formData: async () => {
    const f = new FormData()
    for (const [k, v] of new URLSearchParams(body)) f.append(k, v)
    return f
  },
})

const pick = r => ({ authority: r.authority, refId: r.refId, clientRefId: r.clientRefId, canceled: r.canceled })

console.log('\n── زرین‌پال: GET با کوئری ──')
t('پرداخت موفق',
  pick(await readGatewayReturn(mk('https://x.ir/cb?payment=P1&Authority=A00123&Status=OK'))),
  { authority: 'A00123', refId: '', clientRefId: '', canceled: false })

t('لغو توسط کاربر',
  pick(await readGatewayReturn(mk('https://x.ir/cb?payment=P1&Authority=A00123&Status=NOK'))),
  { authority: 'A00123', refId: '', clientRefId: '', canceled: true })

console.log('\n── پی‌پینگ: POST با فرم ──')
const okBody = new URLSearchParams({
  status: '1', errorCode: '',
  data: JSON.stringify({
    clientRefId: 'P1', paymentCode: 'PC-77', paymentRefId: 990011,
    amount: 120000, gatewayAmount: 120000, cardNumber: '6037****1234',
  }),
}).toString()

t('پرداخت موفق',
  pick(await readGatewayReturn(mk('https://x.ir/cb?payment=P1', {
    method: 'POST', body: okBody, ct: 'application/x-www-form-urlencoded' }))),
  { authority: 'PC-77', refId: '990011', clientRefId: 'P1', canceled: false })

const failBody = new URLSearchParams({
  status: '0', errorCode: '15',
  data: JSON.stringify({ clientRefId: 'P1', paymentCode: 'PC-77', amount: 120000 }),
}).toString()

t('پرداخت ناموفق',
  pick(await readGatewayReturn(mk('https://x.ir/cb?payment=P1', {
    method: 'POST', body: failBody, ct: 'application/x-www-form-urlencoded' }))),
  { authority: 'PC-77', refId: '', clientRefId: 'P1', canceled: true })

console.log('\n── حالت‌های مرزی ──')
t('بدنه‌ی خالی، مسیر نمی‌شکند',
  pick(await readGatewayReturn(mk('https://x.ir/cb?payment=P1', {
    method: 'POST', body: '', ct: 'application/x-www-form-urlencoded' }))),
  { authority: '', refId: '', clientRefId: '', canceled: false })

t('`data` که JSON نیست، نادیده گرفته می‌شود',
  pick(await readGatewayReturn(mk('https://x.ir/cb', {
    method: 'POST', body: 'status=1&paymentCode=PC-9&data=notjson',
    ct: 'application/x-www-form-urlencoded' }))),
  { authority: 'PC-9', refId: '', clientRefId: '', canceled: false })

t('بدنه‌ی JSON هم پذیرفته است',
  pick(await readGatewayReturn(mk('https://x.ir/cb', {
    method: 'POST', ct: 'application/json',
    body: JSON.stringify({ status: 1, data: { paymentCode: 'PC-5', paymentRefId: 42 } }) }))),
  { authority: 'PC-5', refId: '42', clientRefId: '', canceled: false })

console.log(`\n${pass} قبول · ${fail} رد\n`)
process.exit(fail ? 1 : 0)
