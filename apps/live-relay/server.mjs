/* ─────────────────────────────────────────────────────────────
   رله‌ی پخش زنده‌ی بیلیارد هاب.

   مرورگرِ گوشی/لپ‌تاپِ باشگاه‌دار RTMP بلد نیست؛ سرویسِ پخش (آروان) فقط
   RTMP/SRT می‌گیرد. این رله وسط می‌نشیند:

     مرورگر ──(MediaRecorder، تکه‌های ۱ ثانیه‌ای روی WebSocket)──► رله
     رله ──(ffmpeg: H.264 + AAC، کلیدفریم هر ۲ ثانیه)──► RTMPِ آروان
     آروان ──(HLS روی CDNِ خودش)──► همه‌ی بیننده‌ها

   ⚠️ فقط تصویرِ **ورودیِ باشگاه** از این‌جا رد می‌شود (هر پخش ~۳ مگابیت).
   بیننده‌ها هرگز به این‌جا نمی‌آیند — تعدادشان هیچ باری روی سرور ندارد.
   هزینه‌ی واقعی CPUِ ffmpeg است: هر پخشِ هم‌زمان حدودِ یک هسته (RELAY_MAX).

   هیچ دسترسی‌ای به دیتابیس ندارد. مقصدِ RTMP را از توکنی می‌گیرد که سایت
   پس از سنجشِ مالکیت ساخته و رمز کرده (token.mjs). هرگز آن را لاگ نمی‌کند.

   env:
     LIVE_RELAY_SECRET   مشترک با سایت (الزامی)
     RELAY_PORT          پیش‌فرض 4100 (فقط 127.0.0.1؛ nginx جلویش است)
     RELAY_MAX           سقفِ پخشِ هم‌زمان (پیش‌فرض 6)
     RELAY_ORIGINS       مبدأهای مجاز، با ویرگول (پیش‌فرض https://billiardhub.net)
     FFMPEG_BIN          پیش‌فرض ffmpeg
   ───────────────────────────────────────────────────────────── */

import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { WebSocketServer } from 'ws'
import { openToken } from './token.mjs'

const SECRET = process.env.LIVE_RELAY_SECRET || ''
const PORT = Number(process.env.RELAY_PORT || 4100)
const MAX = (n => (Number.isFinite(n) && n > 0 ? n : 2))(Number(process.env.RELAY_MAX || 6))
const ORIGINS = (process.env.RELAY_ORIGINS || 'https://billiardhub.net,https://www.billiardhub.net')
  .split(',').map(s => s.trim()).filter(Boolean)
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg'
/* اگر مرورگر بیش از این جلوتر از ffmpeg باشد (اینترنتِ سرور به آروان کُند)،
   پخش قطع می‌شود — صفِ بی‌انتها یعنی حافظه‌ی بی‌انتها و تأخیرِ دقیقه‌ای */
const MAX_BACKLOG = 4 * 1024 * 1024
/* اتصالی که داده نمی‌فرستد (تبِ پس‌زمینه‌ی iOS، گوشیِ قطع‌شده) جای پخش را نگه ندارد */
const IDLE_MS = Number(process.env.RELAY_IDLE_MS) || 15_000
/* هیچ پخشی بیش از این (همان سقفِ سایت در lib/streaming/policy) */
const MAX_SESSION_MS = 12 * 60 * 60 * 1000

if (!SECRET) { console.error('[relay] LIVE_RELAY_SECRET تنظیم نشده'); process.exit(1) }

/** channelId ⟶ نشست؛ هر کانال یک پخش — اتصالِ تازه، قبلی را می‌بندد */
const sessions = new Map()

function ffmpegArgs(rtmp) {
  return [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    /* ورودیِ MediaRecorder زمان‌بندیِ نامنظم دارد — زمان‌ها از نو ساخته شوند */
    '-fflags', '+genpts', '-thread_queue_size', '1024',
    '-i', 'pipe:0',
    '-map', '0:v:0', '-map', '0:a:0?',
    /* H.264 با کلیدفریمِ ثابتِ ۲ ثانیه — HLSِ آروان روی همین تکه می‌شود */
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-profile:v', 'main',
    '-pix_fmt', 'yuv420p', '-vf', 'scale=-2:min(720\\,ih)', '-r', '30',
    '-g', '60', '-keyint_min', '60', '-sc_threshold', '0',
    /* ۳ مگابیت برای ۷۲۰ — با ۲٫۵ کیفیت «معمولی» بود (تستِ آرتا) */
    '-b:v', '3000k', '-maxrate', '3500k', '-bufsize', '7000k', '-threads', '2',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2',
    '-f', 'flv', rtmp,
  ]
}

function send(ws, msg) { try { if (ws.readyState === 1) ws.send(JSON.stringify(msg)) } catch { /* بسته */ } }

/** `hard`: بی‌درنگ کشتنِ ffmpeg (جایگزینی — نامِ استریمِ RTMP باید فوراً آزاد شود) */
function endSession(s, why, hard = false) {
  if (s.ended) return s.exited
  s.ended = true
  if (sessions.get(s.ch) === s) sessions.delete(s.ch)
  try { s.ff.stdin.end() } catch { /* بسته */ }
  if (hard) { try { s.ff.kill('SIGKILL') } catch { /* مرده */ } }
  /* ffmpeg فرصتِ بستنِ تمیزِ RTMP را دارد؛ بعد کشته می‌شود */
  else setTimeout(() => { try { s.ff.kill('SIGKILL') } catch { /* مرده */ } }, 4000).unref()
  try { s.ws.close(1000, why.slice(0, 100)) } catch { /* بسته */ }
  console.info(`[relay] end ch=${s.ch.slice(0, 8)} reason=${why} bytes=${s.bytes} live=${sessions.size}`)
  return s.exited
}

const http = createServer((req, res) => {
  if (req.url?.startsWith('/live-relay/health')) {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
    res.end(JSON.stringify({ ok: true, live: sessions.size, max: MAX }))
    return
  }
  res.writeHead(404); res.end()
})

const wss = new WebSocketServer({
  noServer: true,
  /* هر تکه‌ی ۱ ثانیه‌ای حداکثر چند صد کیلوبایت است */
  maxPayload: 8 * 1024 * 1024,
  perMessageDeflate: false,
})

http.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', 'http://relay')
  const origin = req.headers.origin || ''
  const dev = /^http:\/\/localhost(:\d+)?$/.test(origin) && process.env.NODE_ENV !== 'production'
  if (url.pathname !== '/live-relay' || !(ORIGINS.includes(origin) || dev)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); socket.destroy(); return
  }
  const t = openToken(url.searchParams.get('t'), SECRET)
  if (!t) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy(); return }
  wss.handleUpgrade(req, socket, head, ws => { void onSession(ws, t) })
})

async function onSession(ws, t) {
  /* همان کانال از دستگاهِ دیگر (یا وصلِ دوباره پس از قطعی) ⟵ قبلی کنار می‌رود.
     ⚠️ ffmpegِ قبلی **پیش از** ساختِ تازه باید مرده باشد: آروان ناشرِ دوم روی
     همان نامِ استریم را رد می‌کند («already publishing») */
  const old = sessions.get(t.ch)
  if (old) await Promise.race([endSession(old, 'replaced', true), new Promise(r => setTimeout(r, 3000))])
  if (ws.readyState !== 1) return
  if (sessions.size >= MAX) {
    send(ws, { type: 'error', message: 'ظرفیتِ پخشِ هم‌زمانِ سایت پر است؛ چند دقیقه‌ی دیگر دوباره تلاش کنید' })
    ws.close(1013, 'busy'); return
  }

  /* RELAY_FAKE_FFMPEG=1 فقط برای test-relay.mjs: پروسه‌ای که ورودی را می‌بلعد */
  const ff = process.env.RELAY_FAKE_FFMPEG === '1'
    ? spawn(process.execPath, ['-e', 'process.stdin.resume()'], { stdio: ['pipe', 'ignore', 'pipe'] })
    : spawn(FFMPEG, ffmpegArgs(t.rtmp), { stdio: ['pipe', 'ignore', 'pipe'] })
  const s = { ch: t.ch, ws, ff, bytes: 0, ended: false, live: false, checking: false, lastErr: '',
    started: Date.now(), lastData: Date.now(), alive: true, exited: null }
  s.exited = new Promise(r => ff.once('exit', r))
  sessions.set(t.ch, s)
  console.info(`[relay] start ch=${t.ch.slice(0, 8)} live=${sessions.size}`)

  ff.stderr.on('data', d => {
    /* فقط آخرین خط برای پیامِ خطا — نشانیِ RTMP (کلید) را پاک می‌کنیم */
    s.lastErr = String(d).replace(/rtmps?:\/\/\S+/g, 'rtmp://…').trim().split('\n').pop()?.slice(0, 200) ?? ''
  })
  ff.on('error', e => {
    send(ws, { type: 'error', message: 'رله آماده نیست (ffmpeg)' })
    console.error('[relay] ffmpeg spawn', e.message)
    endSession(s, 'spawn-failed')
  })
  ff.on('exit', code => {
    if (!s.ended) {
      send(ws, { type: 'error', message: 'اتصال به سرویسِ پخش قطع شد', detail: s.lastErr })
      endSession(s, `ffmpeg-exit-${code}`)
    }
  })
  ff.stdin.on('error', () => { /* ffmpeg بسته شد؛ exit پیامش را می‌دهد */ })

  send(ws, { type: 'ready' })

  ws.on('message', (data, isBinary) => {
    if (!isBinary || s.ended) return
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
    s.bytes += buf.length
    s.lastData = Date.now()
    if (ff.stdin.writableLength > MAX_BACKLOG) {
      send(ws, { type: 'error', message: 'ارسالِ تصویر به سرویسِ پخش عقب افتاد؛ پخش را دوباره شروع کنید' })
      endSession(s, 'backlog'); return
    }
    ff.stdin.write(buf)
    /* ffmpeg پس از چند ثانیه داده هنوز زنده است ⟵ پخش واقعاً به آروان رفته */
    if (!s.live && !s.checking && s.bytes > 200_000) {
      s.checking = true
      setTimeout(() => {
        if (!s.ended && !s.live && ff.exitCode === null) { s.live = true; send(ws, { type: 'live' }) }
      }, 2500).unref()
    }
  })
  ws.on('pong', () => { s.alive = true })
  ws.on('close', () => endSession(s, 'client-closed'))
  ws.on('error', () => endSession(s, 'ws-error'))
}

/* پیامِ زنده‌بودن هر ۲۰ ثانیه (nginx اتصالِ بی‌صدا را بعد از ۶۰ ثانیه می‌بندد)؛
   پاسخ نداد ⟵ اتصالِ نیمه‌باز است، قطع */
setInterval(() => {
  for (const s of [...sessions.values()]) {
    if (!s.alive) { try { s.ws.terminate() } catch { /* بسته */ } endSession(s, 'no-pong'); continue }
    s.alive = false
    try { s.ws.ping() } catch { /* بسته */ }
  }
}, 20_000).unref()

/* داده نمی‌آید یا پخش از سقف گذشت ⟵ جای پخش آزاد شود */
setInterval(() => {
  const now = Date.now()
  for (const s of [...sessions.values()]) {
    if (now - s.lastData > IDLE_MS) { send(s.ws, { type: 'error', message: 'تصویری از دوربین نمی‌رسد؛ پخش قطع شد' }); endSession(s, 'idle') }
    else if (now - s.started > MAX_SESSION_MS) endSession(s, 'max-length')
  }
}, 2_000).unref()

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => { for (const s of [...sessions.values()]) endSession(s, 'shutdown'); setTimeout(() => process.exit(0), 1500) })
}

http.listen(PORT, '127.0.0.1', () => console.info(`[relay] listening 127.0.0.1:${PORT} max=${MAX}`))
