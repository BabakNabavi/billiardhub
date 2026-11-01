'use client'

/* ─────────────────────────────────────────────────────────────
   «پخش با دوربینِ همین دستگاه» به سرویسِ پخش (آروان) — سمتِ مرورگر.

   یک نشستِ سراسری (نه state کامپوننت): عوض‌کردنِ تبِ داشبورد یا بسته‌شدنِ
   پنل نباید پخش را قطع کند — همان درسی که پخشِ قدیمی (broadcast-store) داد.

   دو راه، هر دو بی‌دخالتِ باشگاه‌دار (سرور انتخاب می‌کند):
   - whip:  RTCPeerConnection ← POSTِ SDP به نشانیِ WHIPِ سرویس
   - relay: MediaRecorder (تکه‌های ۱ ثانیه‌ای) ← WebSocket ← رله ← RTMP

   ⚠️ قاعده‌ی اصلی: هر قطعیِ پس از «زنده»شدن (دوربین قطع، قفلِ صفحه‌ی iOS،
   افتادنِ اینترنت، خطای رله) باید کانال را روی سایت هم خاموش کند (`onEnded`)
   — وگرنه بیننده‌ها پخشِ مرده‌ای را «زنده» می‌بینند.
   ───────────────────────────────────────────────────────────── */

export type PublishPhase = 'idle' | 'starting' | 'camera' | 'connecting' | 'live' | 'error'

export interface PublishState {
  phase: PublishPhase
  channelId: string | null
  stream: MediaStream | null
  facing: 'environment' | 'user'
  error: string
  /** شبکه کُند است (صفِ ارسال پر می‌شود) — فقط هشدار */
  slow: boolean
  /** لحظه‌ی زنده‌شدن (ms) — ساعتِ استودیو پس از بازکردنِ دوباره از همین می‌شمارد */
  liveSince: number | null
}

const EMPTY: PublishState = { phase: 'idle', channelId: null, stream: null, facing: 'environment', error: '', slow: false, liveSince: null }
/* رله «live» را نفرستاد (ffmpeg به آروان نرسید) ⟵ بیش از این در «اتصال» نماند */
const CONNECT_TIMEOUT_MS = 25_000
let state: PublishState = EMPTY
const subs = new Set<() => void>()
const set = (p: Partial<PublishState>) => { state = { ...state, ...p }; subs.forEach(f => f()) }

export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
export const getSnapshot = () => state
export const getServerSnapshot = () => EMPTY

type Session = { mode: 'whip'; url: string; token: string | null } | { mode: 'relay'; url: string; token: string }

let teardown: (() => void) | null = null
let onEndedCb: ((unloading: boolean) => void) | null = null
let wakeLock: { release: () => Promise<void> } | null = null
/* هر start/stop یک نسل؛ کارِ ناهم‌زمانی که نسلش کهنه شد، خودش را جمع می‌کند */
let gen = 0

const liveTrack = (s: MediaStream | null) => !!s && s.getVideoTracks().some(t => t.readyState === 'live')

export async function openCamera(facing: 'environment' | 'user' = state.facing): Promise<MediaStream | null> {
  state.stream?.getTracks().forEach(t => t.stop())
  set({ stream: null })
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      audio: { echoCancellation: false, noiseSuppression: false },
    })
    set({ stream, facing, phase: state.phase === 'idle' || state.phase === 'error' ? 'camera' : state.phase, error: '' })
    return stream
  } catch (e) {
    const denied = e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
    set({ phase: 'error', stream: null, error: denied ? 'اجازه‌ی دوربین داده نشد. از تنظیماتِ مرورگر اجازه دهید و دوباره بزنید.' : 'دوربین باز نشد.' })
    return null
  }
}

/* WebM برای کروم/اندروید (ffmpeg از pipe راحت‌تر می‌خواندش)، MP4 فقط وقتی WebM
   نیست (سافاریِ iOS). رله در هر حال به H.264 بازکد می‌کند. */
function pickMime(): string {
  const list = ['video/webm;codecs=h264,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4']
  return list.find(m => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ?? ''
}

function startRelay(sess: Extract<Session, { mode: 'relay' }>, stream: MediaStream, onLive: () => void): () => void {
  const mime = pickMime()
  /* ۲٫۵ مگابیت: تصویر دو بار فشرده می‌شود (این‌جا و در رله)؛ با ۱٫۵ کیفیت «معمولی»
     بود (تستِ آرتا، ۱ نوامبر ۲۰۲۶). روی ۴Gِ معمولی هنوز جا دارد؛ اگر نه، هشدارِ «کند» می‌آید */
  const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 128_000 })
  const ws = new WebSocket(`${sess.url}?t=${encodeURIComponent(sess.token)}`)
  ws.binaryType = 'arraybuffer'
  let closedByUs = false
  ws.onopen = () => rec.start(1000)
  rec.ondataavailable = ev => {
    if (ws.readyState !== WebSocket.OPEN || ev.data.size === 0) return
    const slow = ws.bufferedAmount > 4 * 1024 * 1024
    if (slow !== state.slow) set({ slow })
    ws.send(ev.data)
  }
  rec.onerror = () => { if (!closedByUs) fail('ضبطِ دوربین متوقف شد؛ پخش قطع شد.') }
  rec.onstop = () => { if (!closedByUs) fail('دوربین قطع شد (قفلِ صفحه یا تماس)؛ پخش قطع شد.') }
  ws.onmessage = ev => {
    try {
      const m = JSON.parse(String(ev.data)) as { type?: string; message?: string }
      if (m.type === 'live') onLive()
      if (m.type === 'error') { closedByUs = true; fail(m.message || 'پخش قطع شد') }
    } catch { /* پیامِ ناشناخته */ }
  }
  ws.onclose = () => { if (!closedByUs) fail('اتصالِ پخش قطع شد. اینترنت را بررسی کنید و دوباره «پخش» را بزنید.') }
  return () => {
    closedByUs = true
    try { if (rec.state !== 'inactive') rec.stop() } catch { /* ضبط از قبل بسته */ }
    try { ws.close() } catch { /* اتصال از قبل بسته */ }
  }
}

async function startWhip(sess: Extract<Session, { mode: 'whip' }>, stream: MediaStream, onLive: () => void): Promise<() => void> {
  const pc = new RTCPeerConnection({ bundlePolicy: 'max-bundle' })
  let resource: string | null = null
  let dropTimer = 0
  const close = () => {
    window.clearTimeout(dropTimer)
    pc.close()
    /* ⚠️ Location فقط اگر سرویس Access-Control-Expose-Headers بدهد خوانا است */
    if (resource) void fetch(new URL(resource, sess.url), { method: 'DELETE', ...(sess.token ? { headers: { Authorization: `Bearer ${sess.token}` } } : {}) }).catch(() => undefined)
  }
  try {
    stream.getTracks().forEach(t => pc.addTransceiver(t, { direction: 'sendonly', streams: [stream] }))
    await pc.setLocalDescription(await pc.createOffer())
    /* WHIP بی‌trickle: صبر تا ICE جمع شود (حداکثر ۲ ثانیه) */
    await new Promise<void>(res => {
      if (pc.iceGatheringState === 'complete') return res()
      const t = window.setTimeout(res, 2000)
      pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { window.clearTimeout(t); res() } })
    })
    const r = await fetch(sess.url, {
      method: 'POST', body: pc.localDescription?.sdp ?? '',
      headers: { 'Content-Type': 'application/sdp', ...(sess.token ? { Authorization: `Bearer ${sess.token}` } : {}) },
    })
    if (!r.ok) throw new Error(`whip ${r.status}`)
    resource = r.headers.get('Location')
    await pc.setRemoteDescription({ type: 'answer', sdp: await r.text() })
  } catch (e) { close(); throw e }
  pc.onconnectionstatechange = () => {
    window.clearTimeout(dropTimer)
    if (pc.connectionState === 'connected') onLive()
    else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') fail('اتصالِ مستقیم به سرویسِ پخش قطع شد.')
    /* قطعیِ لحظه‌ای: ۱۰ ثانیه فرصت برای برگشتن */
    else if (pc.connectionState === 'disconnected') dropTimer = window.setTimeout(() => fail('اتصالِ مستقیم به سرویسِ پخش قطع شد.'), 10_000)
  }
  return close
}

async function keepAwake() {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    wakeLock = (await nav.wakeLock?.request('screen')) ?? null
  } catch { /* پشتیبانی نمی‌شود */ }
}
function releaseAwake() { void wakeLock?.release().catch(() => undefined); wakeLock = null }

function fail(msg: string) {
  gen++
  teardown?.(); teardown = null
  releaseAwake()
  const ended = onEndedCb; onEndedCb = null
  set({ phase: 'error', error: msg, slow: false, liveSince: null })
  /* زنده شده بود ⟵ کانال روی سایت هم خاموش شود */
  ended?.(false)
}

/** شروعِ پخش.
 *  `getSession` توکن را از سایت می‌گیرد؛ `onLive` کانال را روی سایت زنده می‌کند؛
 *  `onEnded` پس از قطعیِ ناخواسته‌ی پخشِ زنده، کانال را روی سایت خاموش می‌کند. */
export async function startPublish(
  channelId: string,
  getSession: () => Promise<Session>,
  onLive: () => Promise<void>,
  /** `unloading`: صفحه دارد بسته می‌شود — درخواست باید keepalive باشد */
  onEnded: (unloading: boolean) => void,
) {
  if (state.phase === 'starting' || state.phase === 'connecting' || state.phase === 'live') return
  const my = ++gen
  set({ phase: 'starting', channelId, error: '' })
  const stream = liveTrack(state.stream) ? state.stream : await openCamera()
  if (my !== gen) return
  if (!stream) return
  set({ phase: 'connecting', channelId, error: '' })
  let announced = false
  const live = () => {
    if (announced || my !== gen) return
    announced = true
    onEndedCb = onEnded
    set({ phase: 'live', liveSince: Date.now() })
    void onLive().catch(() => fail('پخش به سرویس رسید ولی روی سایت ثبت نشد؛ دوباره «پخش» را بزنید.'))
  }
  /* دوربین وسطِ پخش قطع شد (قفلِ صفحه، تماس، برداشتنِ اجازه) */
  stream.getTracks().forEach(t => { t.onended = () => { if (my === gen && isPublishing()) fail('دوربین قطع شد؛ پخش قطع شد.') } })
  try {
    const sess = await getSession()
    if (my !== gen) return
    const down = sess.mode === 'whip' ? await startWhip(sess, stream, live) : startRelay(sess, stream, live)
    if (my !== gen) { down(); return }
    teardown = down
    window.setTimeout(() => {
      if (my === gen && state.phase === 'connecting') fail('تصویر به سرویسِ پخش نرسید. اینترنت را بررسی کنید و دوباره شروع کنید.')
    }, CONNECT_TIMEOUT_MS)
    await keepAwake()
  } catch (e) {
    if (my !== gen) return
    fail(e instanceof Error && /[؀-ۿ]/.test(e.message) ? e.message : 'اتصال به سرویسِ پخش ممکن نشد.')
  }
}

export function stopPublish() {
  gen++
  onEndedCb = null
  teardown?.(); teardown = null
  releaseAwake()
  state.stream?.getTracks().forEach(t => t.stop())
  set({ ...EMPTY, facing: state.facing })
}

export const isPublishing = () => state.phase === 'connecting' || state.phase === 'live'

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', e => { if (isPublishing()) { e.preventDefault(); e.returnValue = '' } })
  /* بستنِ صفحه با وجودِ هشدار: کانال روی سایت خاموش شود (keepalive از بسته‌شدن جان سالم می‌برد) */
  window.addEventListener('pagehide', () => { if (state.phase === 'live') { const cb = onEndedCb; onEndedCb = null; cb?.(true) } })
  /* مرورگر قفلِ روشن‌ماندنِ صفحه را با پنهان‌شدنِ تب پس می‌گیرد — با برگشتن، دوباره */
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && isPublishing()) void keepAwake() })
}
