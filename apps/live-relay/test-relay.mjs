/* تستِ رله — بی ffmpeg و بی آروان.
       node apps/live-relay/test-relay.mjs

   رله را با ffmpegِ ساختگی بالا می‌آورد و می‌سنجد:
   ۱) توکنِ نامعتبر ⟵ ۴۰۱؛ مبدأِ بیگانه ⟵ ۴۰۳
   ۲) توکنِ درست ⟵ «ready»، و پس از رسیدنِ داده ⟵ «live»
   ۳) اتصالِ دوم به همان کانال، اولی را کنار می‌گذارد
   ۴) /health شمارِ پخش‌ها را درست می‌دهد */

import { spawn } from 'node:child_process'
import { createCipheriv, randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import WebSocket from 'ws'
import { relayKey, openToken } from './token.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const SECRET = 'test-relay-secret'
const PORT = 4199
let pass = 0, fail = 0
const t = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `  ← ${extra}`}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

function seal(p, exp = Date.now() + 60_000) {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', relayKey(SECRET), iv)
  const ct = Buffer.concat([c.update(JSON.stringify({ ...p, exp })), c.final()])
  return [iv.toString('base64url'), c.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.')
}

console.log('\n── توکن ──')
const good = seal({ rtmp: 'rtmp://push.example.ir:1935/app/key123', ch: 'ch-1' })
t('توکنِ درست باز می‌شود', openToken(good, SECRET)?.ch === 'ch-1')
t('رازِ دیگر ⟵ null', openToken(good, 'other') === null)
t('منقضی ⟵ null', openToken(seal({ rtmp: 'rtmp://a.b:1935/app/k', ch: 'x' }, Date.now() - 1), SECRET) === null)
t('RTMPِ بی‌کلید ⟵ null', openToken(seal({ rtmp: 'rtmp://a.b:1935/app', ch: 'x' }), SECRET) === null)
t('دست‌کاری ⟵ null', openToken(good.slice(0, -3) + 'AAA', SECRET) === null)

const srv = spawn(process.execPath, [join(here, 'server.mjs')], {
  env: { ...process.env, LIVE_RELAY_SECRET: SECRET, RELAY_PORT: String(PORT), RELAY_FAKE_FFMPEG: '1', NODE_ENV: 'production', RELAY_IDLE_MS: '3000' },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let log = ''
srv.stdout.on('data', d => { log += d }); srv.stderr.on('data', d => { log += d })
for (let i = 0; i < 40 && !log.includes('listening'); i++) await sleep(100)

const ORIGIN = 'https://billiardhub.net'
const connect = (tok, origin = ORIGIN) => new Promise(res => {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/live-relay?t=${encodeURIComponent(tok)}`, { origin })
  const msgs = []
  ws.on('message', d => { try { msgs.push(JSON.parse(String(d)).type) } catch { /* */ } })
  ws.on('unexpected-response', (_req, r) => res({ status: r.statusCode }))
  ws.on('open', () => res({ ws, msgs }))
  ws.on('error', () => res({ status: -1 }))
})

console.log('\n── دسترسی ──')
t('توکنِ نامعتبر ⟵ ۴۰۱', (await connect('nope')).status === 401)
t('مبدأِ بیگانه ⟵ ۴۰۳', (await connect(good, 'https://evil.example')).status === 403)

console.log('\n── پخش ──')
const a = await connect(good)
t('اتصالِ درست باز شد', !!a.ws)
await sleep(300)
t('پیامِ ready', a.msgs.includes('ready'), a.msgs.join(','))
for (let i = 0; i < 4; i++) { a.ws.send(randomBytes(64 * 1024)); await sleep(50) }
await sleep(3200)
t('پس از داده ⟵ live', a.msgs.includes('live'), a.msgs.join(','))
const h1 = await (await fetch(`http://127.0.0.1:${PORT}/live-relay/health`)).json()
t('health: یک پخش', h1.live === 1, JSON.stringify(h1))

let aClosed = false
a.ws.on('close', () => { aClosed = true })
const b = await connect(good)
await sleep(500)
t('اتصالِ دوم به همان کانال، اولی را بست', aClosed && !!b.ws)
b.ws.close()
await sleep(500)
const h2 = await (await fetch(`http://127.0.0.1:${PORT}/live-relay/health`)).json()
t('پس از بستن، صفر پخش', h2.live === 0, JSON.stringify(h2))
const c = await connect(seal({ rtmp: 'rtmp://push.example.ir:1935/app/key123', ch: 'ch-idle' }))
let cClosed = false
c.ws.on('close', () => { cClosed = true })
await sleep(5500)
t('اتصالِ بی‌داده پس از مهلت بسته شد', cClosed && c.msgs.includes('error'), c.msgs.join(','))
t('کلیدِ RTMP در لاگ نیامد', !log.includes('key123'), log)

await new Promise(r => { srv.once('exit', r); srv.kill() })
console.log(`\n${fail === 0 ? '✓' : '✗'} نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exitCode = fail === 0 ? 0 : 1
