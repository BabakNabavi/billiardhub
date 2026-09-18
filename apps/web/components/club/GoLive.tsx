'use client'

/* ─────────────────────────────────────────────────────────────
   پخش زنده از باشگاه — یک تا چند دوربین.

   ── سه چیزی که این نسخه اضافه کرد ──
   ۱) انتخابِ دستگاه. دوربینِ فیلم‌برداری با کارتِ کپچرِ HDMI→USB برای
      مرورگر یک ورودیِ ویدیوی معمولی است؛ تا وقتی فقط facingMode
      داشتیم، همیشه دوربینِ خودِ گوشی گرفته می‌شد و کارتِ کپچر عملا
      غیرقابلِ استفاده بود.
   ۲) انتخابِ کیفیت با سقفِ نرخ بیتِ واقعی. قیدِ ۱۰۸۰p روی دوربین
      بدونِ بالا بردنِ نرخ بیت هیچ فرقی نمی‌کرد.
   ۳) چند دوربینِ هم‌زمان. هر دوربین یک زاویه با کانالِ سیگنالینگِ
      مستقل است، پس بیننده می‌تواند بینشان سوییچ کند.

   دوربینِ دوم و سوم از دو راه اضافه می‌شوند: یا ورودیِ دیگری روی
   همین دستگاه (حالتِ حرفه‌ای با چند کارتِ کپچر)، یا دستگاهِ دیگری که
   همین صفحه را باز کند — آن‌جا این کامپوننت پخشِ در جریانِ باشگاه را
   می‌بیند و فقط دوربین اضافه می‌کند.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Radio, Video, VideoOff, Loader2, SwitchCamera, ExternalLink, AlertCircle,
  Plus, MonitorUp, Settings2,
} from 'lucide-react'
import { startBroadcast, type Broadcaster } from '../../lib/live/webrtc'
import { startLive, beatLive, stopLive, addAngle, fetchLiveSessions, type LiveSession } from '../../lib/live/client'
import { MAIN_ANGLE, MAX_ANGLES, defaultAngleLabel } from '../../lib/live/angles'
import { QUALITY_PRESETS, DEFAULT_QUALITY, presetOf, retuneTrack, type QualityId } from '../../lib/live/quality'
import { listCameras, openCamera, openScreen, screenShareSupported, stopStream, type CamDevice } from '../../lib/live/devices'
import SelectField from '../ui/SelectField'
import FeedTile, { type Feed } from './live/FeedTile'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#6F6A5C', LINE = '#EAE5DA'
const GOLD_D = '#8F6531', RED = '#ef4444', FELT = '#0E7A38', GROUND = '#FAF8F3'
const fa = (n: number) => Number(n || 0).toLocaleString('fa-IR')

const DISCIPLINES = [
  { value: 'اسنوکر', label: 'اسنوکر' },
  { value: 'پاکت بیلیارد', label: 'پاکت بیلیارد' },
  { value: 'هی‌بال', label: 'هی‌بال' },
  { value: 'کاروم', label: 'کاروم' },
  { value: 'سایر', label: 'سایر' },
]

interface LiveFeed extends Feed { bc: Broadcaster | null }

const trackDeviceId = (s: MediaStream): string =>
  String(s.getVideoTracks()[0]?.getSettings().deviceId ?? '')

export default function GoLive({ clubId, clubName, ownerKey }: { clubId: string; clubName: string; ownerKey: string }) {
  const [session, setSession] = useState<LiveSession | null>(null)
  /** پخشی که دستگاهِ دیگری شروع کرده و این دستگاه فقط دوربین به آن اضافه می‌کند. */
  const [joinable, setJoinable] = useState<LiveSession | null>(null)
  const [feeds, setFeeds] = useState<LiveFeed[]>([])
  const [preview, setPreview] = useState<MediaStream | null>(null)

  const [title, setTitle] = useState('')
  const [discipline, setDiscipline] = useState('اسنوکر')
  const [quality, setQuality] = useState<QualityId>(DEFAULT_QUALITY)
  const [cams, setCams] = useState<CamDevice[]>([])
  const [deviceId, setDeviceId] = useState('')
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')

  /* روی سرور false و روی کلاینت true ⇒ ناهماهنگیِ هیدریشن. پس مثل
     pipSupported در پخش‌کننده، بعد از mount خوانده می‌شود. */
  const [canShare, setCanShare] = useState(false)
  useEffect(() => { setCanShare(screenShareSupported()) }, [])

  /* تا اولین پاسخِ نظرسنجی نیامده نمی‌دانیم پخشِ دیگری در جریان هست
     یا نه؛ یک لمسِ سریع روی دستگاهِ دوم می‌توانست جلسه‌ی موازیِ دوم
     برای همان باشگاه بسازد. */
  const [polled, setPolled] = useState(false)

  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')
  const [elapsed, setElapsed] = useState(0)

  const previewRef = useRef<HTMLVideoElement>(null)
  /* ⚠️ خودِ استریم آینه می‌شود، نه المانِ ویدیو. ری‌اکت refها را در
     فازِ commit جدا می‌کند — پیش از اجرای cleanupِ افکت‌ها — پس در
     لحظه‌ی پاک‌سازی، previewRef.current همیشه null است و دوربین
     روشن می‌ماند (چراغش هم روشن) تا وقتی تب بسته شود. */
  const previewStreamRef = useRef<MediaStream | null>(null)
  const feedsRef = useRef<LiveFeed[]>([])
  const sessionRef = useRef<LiveSession | null>(null)
  const ownedRef = useRef(false)
  const aliveRef = useRef(true)
  const missesRef = useRef(0)

  useEffect(() => { feedsRef.current = feeds }, [feeds])
  useEffect(() => { sessionRef.current = session }, [session])
  useEffect(() => {
    previewStreamRef.current = preview
    if (previewRef.current && preview) previewRef.current.srcObject = preview
  }, [preview])

  /* ── دوربین‌های دستگاه ──
     برچسبِ دستگاه‌ها تا پیش از دادنِ اجازه مخفی است، پس بعد از باز
     شدنِ اولین دوربین دوباره خوانده می‌شود. */
  const refreshCams = useCallback(async () => { setCams(await listCameras()) }, [])
  useEffect(() => { void refreshCams() }, [refreshCams])

  /* ── پخشِ در جریانِ همین باشگاه ──
     اگر باشگاه‌دار این صفحه را روی گوشیِ دوم باز کند، به‌جای شروعِ
     پخشِ تازه باید بتواند دوربین اضافه کند. */
  useEffect(() => {
    if (session || ownedRef.current) return
    let alive = true
    const look = async () => {
      const all = await fetchLiveSessions()
      if (!alive) return
      /* undefined یعنی نتوانستیم بپرسیم. دست نزن — نه به joinable، نه
         به شمارنده‌ی خطا. وگرنه ۴۰ ثانیه اینترنتِ بد، دوربینِ سالمِ
         مهمان را خاموش می‌کرد. */
      if (all === undefined) return
      const hit = all.find(s => s.clubId === clubId && !s.ended) ?? null
      /* ⚠️ شیءِ تازه در هر نظرسنجی = هویتِ تازه = افکتِ تپش هر ۲۰ ثانیه
         از نو ساخته می‌شود. فقط وقتی واقعا عوض شده بنویس. */
      setJoinable(prev => (prev?.id === hit?.id ? prev : hit))

      /* پخش تمام شده و این دستگاه فقط یک دوربینِ مهمان بود ⇒ باید
         دوربینش را ببندد، وگرنه تا ابد به کانالی مرده می‌فرستد.
         یک‌بار ندیدن کافی نیست: fetchLiveSessions روی خطای شبکه هم
         آرایه‌ی خالی می‌دهد و یک قطعیِ لحظه‌ای دوربین را می‌بست. */
      if (!hit && feedsRef.current.length > 0 && !ownedRef.current) {
        missesRef.current += 1
        if (missesRef.current >= 2) {
          feedsRef.current.forEach(f => { f.bc?.stop(); stopStream(f.stream) })
          setFeeds([])
          setErr('پخش توسط باشگاه پایان یافت؛ دوربین این دستگاه بسته شد.')
        }
      } else if (hit) {
        missesRef.current = 0
      }
      setPolled(true)
    }
    void look()
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') void look() }, 20_000)
    return () => { alive = false; window.clearInterval(t) }
  }, [clubId, session])

  /* پاک‌سازی هنگام بستنِ صفحه */
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      feedsRef.current.forEach(f => { f.bc?.stop(); stopStream(f.stream) })
      stopStream(previewStreamRef.current)
      previewStreamRef.current = null
      const s = sessionRef.current
      if (s && ownedRef.current) void stopLive(s.id, ownerKey)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── تپش ──
     هر دوربین تپشِ خودش را می‌فرستد، وگرنه دوربینِ دومی که قطع شده
     تا پایانِ پخش به‌عنوان گزینه‌ی مرده در فهرستِ بیننده می‌ماند. */
  const live = session ?? joinable
  useEffect(() => {
    if (!live || feeds.length === 0) return
    const beat = () => {
      for (const f of feedsRef.current) {
        void beatLive(live.id, ownerKey, f.angleId === MAIN_ANGLE ? f.viewers : 0, f.angleId, f.label)
      }
    }
    beat()
    const t = window.setInterval(beat, 15_000)
    return () => window.clearInterval(t)
  }, [live?.id, ownerKey, feeds.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session) return
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - session.startedAt) / 1000)), 1000)
    return () => window.clearInterval(t)
  }, [session])

  /* ── پیش‌نمایش پیش از شروع ── */
  const openPreview = useCallback(async () => {
    setErr('')
    const r = await openCamera(presetOf(quality), { deviceId: deviceId || undefined, facing })
    if (!r.stream) { setErr(r.error); return null }
    /* getUserMedia ممکن است پس از رفتنِ کاربر از صفحه برگردد. آن‌وقت
       setState بی‌اثر است ولی دوربین باز می‌ماند. */
    if (!aliveRef.current) { stopStream(r.stream); return null }
    const old = previewStreamRef.current
    previewStreamRef.current = r.stream
    stopStream(old)
    setPreview(r.stream)
    /* انتخابگر باید همان دوربینی را نشان دهد که واقعا باز است. بعد از
       flip، deviceId خالی می‌ماند و SelectField اولین گزینه را
       نمایش می‌داد — یعنی نامِ دوربینی که باز نیست، و برگشتن به آن هم
       ممکن نبود چون انتخابِ دوباره رویدادِ تغییر نمی‌سازد. */
    const real = trackDeviceId(r.stream)
    if (real) setDeviceId(real)
    void refreshCams()
    return r.stream
  }, [quality, deviceId, facing, refreshCams])

  /* کیفیت که عوض شد، پیش‌نمایش باید با قیدِ تازه دوباره باز شود —
     وگرنه باشگاه‌دار «۴K» را انتخاب می‌کند و همان تصویرِ ۷۲۰p را
     می‌بیند و فکر می‌کند کار نمی‌کند. */
  useEffect(() => {
    if (!preview || session) return
    void openPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, deviceId, facing])

  /* شناسه‌ی واقعیِ دستگاه، نه چیزی که در state بود. وقتی دوربینِ
     اصلی با facingMode باز شده باشد، state خالی است و «دوربینِ آزادِ
     بعدی» می‌توانست همان دوربینِ در حالِ استفاده باشد — یعنی زاویه‌ی
     دومِ تکراری یا NotReadableError. */
  const attach = useCallback((sessionId: string, angleId: string, label: string,
    stream: MediaStream, kind: 'camera' | 'screen', devId: string) => {
    /* یک گاردِ واحد برای هر دو مسیر (شروعِ پخش و افزودنِ دوربین):
       بینِ باز شدنِ دوربین و رسیدن به این‌جا دو رفت‌وبرگشتِ شبکه فاصله
       است. اگر کاربر در آن فاصله صفحه را ترک کند، setFeeds بی‌اثر
       می‌شود و Broadcaster هرگز به feedsRef نمی‌رسد — یعنی کانالِ
       Realtime و هر اتصالی که بعدا برای بیننده‌ها می‌سازد تا پایانِ
       عمرِ صفحه نشت می‌کنند. */
    if (!aliveRef.current) { stopStream(stream); return false }
    const realId = devId || trackDeviceId(stream)
    const bc = startBroadcast(sessionId, stream, n => {
      setFeeds(prev => prev.map(f => f.angleId === angleId ? { ...f, viewers: n } : f))
    }, { angleId, quality })
    if (!bc) { setErr('اتصال بی‌درنگ در دسترس نیست'); stopStream(stream); return false }
    setFeeds(prev => [...prev, { angleId, label, kind, deviceId: realId, stream, bc, viewers: 0, micOn: true }])
    return true
  }, [quality])

  /* ── شروعِ پخش ── */
  const go = async () => {
    if (busy) return
    setBusy(true); setErr('')
    const s = preview ?? await openPreview()
    if (!s) { setBusy(false); return }
    const r = await startLive({
      clubId, clubName, ownerKey,
      title: title.trim() || `پخش زنده ${clubName}`,
      discipline, angleLabel: 'دوربین اصلی',
    })
    if (!r?.ok || !r.session) { setErr(r?.message || 'شروع پخش ممکن نشد'); setBusy(false); return }
    if (!attach(r.session.id, MAIN_ANGLE, 'دوربین اصلی', s, 'camera', deviceId)) {
      /* attach خودش استریم را بسته؛ اگر preview همچنان به آن اشاره کند
         باشگاه‌دار یک تصویرِ یخ‌زده می‌بیند بدونِ هیچ توضیحی. */
      setPreview(null)
      setBusy(false); return
    }
    ownedRef.current = true
    setPreview(null)   /* استریم حالا مالِ فید است، نه پیش‌نمایش */
    setSession(r.session); setElapsed(0); setBusy(false)
  }

  /* ── افزودنِ دوربین ──
     `kind` تعیین می‌کند دوربینِ دیگری از همین دستگاه باشد یا اشتراکِ
     صفحه (برای تابلوی امتیاز و جدول). */
  const addCamera = async (kind: 'camera' | 'screen') => {
    const target = live
    if (!target || adding) return
    if (feeds.length >= MAX_ANGLES) { setErr(`بیشتر از ${fa(MAX_ANGLES)} دوربین هم‌زمان ممکن نیست`); return }
    setAdding(true); setErr('')

    /* دوربینی که هنوز استفاده نشده. اگر همه مشغول‌اند، همان پیش‌فرض
       باز می‌شود — بعضی کارت‌های کپچر چند بار باز می‌شوند. */
    const used = new Set(feeds.map(f => f.deviceId).filter(Boolean))
    const free = cams.find(c => c.deviceId && !used.has(c.deviceId))
    const label = kind === 'screen' ? 'تابلوی امتیاز' : (free?.label || defaultAngleLabel(feeds.length))

    const r = kind === 'screen'
      ? await openScreen(presetOf(quality))
      : await openCamera(presetOf(quality), { deviceId: free?.deviceId, audio: false })
    if (!r.stream) { if (r.error) setErr(r.error); setAdding(false); return }
    /* پنجره‌ی اجازه‌ی دوربین ممکن است دقایقی باز بماند؛ اگر کاربر در آن
       فاصله صفحه را ترک کند، setState بی‌اثر است ولی دوربین باز
       می‌ماند. همان گاردی که openPreview دارد. */
    if (!aliveRef.current) { stopStream(r.stream); return }

    const a = await addAngle(target.id, label.slice(0, 40))
    if (!a?.ok || !a.angle || !aliveRef.current) {
      stopStream(r.stream)
      if (aliveRef.current) { setErr(a?.message || 'افزودن دوربین ممکن نشد'); setAdding(false) }
      return
    }
    attach(target.id, a.angle.id, a.angle.label, r.stream, kind, free?.deviceId ?? '')
    setAdding(false)
  }

  /* ⚠️ اثرِ جانبی بیرون از updater. تابعِ به‌روزرسانیِ state باید خالص
     باشد؛ ری‌اکت می‌تواند دوباره اجرایش کند (StrictMode) یا زیرِ رندرِ
     همزمان دورش بیندازد و دوباره بخواند — و آن‌وقت استریمی بسته
     می‌شد که هنوز به یک فرستنده‌ی زنده وصل است. */
  const removeFeed = (angleId: string) => {
    const f = feedsRef.current.find(x => x.angleId === angleId)
    f?.bc?.stop(); stopStream(f?.stream)
    setFeeds(prev => prev.filter(x => x.angleId !== angleId))
  }

  const end = async () => {
    if (busy) return
    setBusy(true)
    feedsRef.current.forEach(f => { f.bc?.stop(); stopStream(f.stream) })
    setFeeds([])
    if (session) await stopLive(session.id, ownerKey)
    ownedRef.current = false
    setSession(null); setJoinable(null); setBusy(false)
  }

  /* فقط state عوض می‌شود؛ بازکردنِ دوربین کارِ همان افکتی است که به
     [quality, deviceId, facing] گوش می‌دهد. اگر این‌جا هم باز می‌کردیم،
     یک لمسِ کاربر دو بار getUserMedia صدا می‌زد — یعنی پرش تصویر و
     درخواستِ اضافه از دوربین.

     این دکمه فقط پیش از شروعِ پخش دیده می‌شود (وقتی پخش شروع شد،
     FeedTile جایش را می‌گیرد)، پس مسیرِ «تعویض وسطِ پخش» این‌جا لازم
     نیست؛ آن کار از راهِ انتخابِ دوربین و replaceStream انجام می‌شود. */
  const flip = () => {
    setFacing(f => (f === 'environment' ? 'user' : 'environment'))
    setDeviceId('')
  }

  const toggleMic = (angleId: string) => {
    const f = feedsRef.current.find(x => x.angleId === angleId)
    if (!f) return
    const next = !f.micOn
    f.stream.getAudioTracks().forEach(t => { t.enabled = next })
    setFeeds(prev => prev.map(x => x.angleId === angleId ? { ...x, micOn: next } : x))
  }

  const changeQuality = async (q: QualityId) => {
    setQuality(q)
    const p = presetOf(q)
    /* هر دو لازم است: سقفِ نرخ بیت روی فرستنده، و قیدِ تازه روی خودِ
       دوربین. فقط اولی یعنی پهنای باندِ بیشتر برای همان تصویرِ کوچک. */
    await Promise.all(feedsRef.current.flatMap(f => [
      f.bc?.setQuality(q),
      retuneTrack(f.stream, p),
    ]))
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0'), ss = String(elapsed % 60).padStart(2, '0')
  const mainFeed = feeds.find(f => f.angleId === MAIN_ANGLE)
  const extras = feeds.filter(f => f.angleId !== MAIN_ANGLE)
  const broadcasting = feeds.length > 0
  const camOptions = cams.filter(c => c.deviceId).map(c => ({ value: c.deviceId, label: c.label }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── دوربینِ اصلی یا پیش‌نمایش ── */}
      {mainFeed ? (
        <FeedTile feed={mainFeed} main elapsed={`${fa(+mm)}:${fa(+ss)}`}
          onToggleMic={() => toggleMic(MAIN_ANGLE)} />
      ) : (
        <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#111', aspectRatio: '16/9' }}>
          {preview ? (
            <video ref={previewRef} autoPlay muted playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,0.5)' }}>
              <VideoOff size={30} aria-hidden />
              <span style={{ fontSize: 13 }}>دوربین روشن نیست</span>
            </div>
          )}
          {preview && (
            <div style={{ position: 'absolute', bottom: 12, insetInlineEnd: 12 }}>
              <button type="button" onClick={flip} aria-label="تعویض دوربین جلو و عقب" style={ctrl}>
                <SwitchCamera size={17} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── دوربین‌های اضافه ── */}
      {extras.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
          {extras.map(f => (
            <FeedTile key={f.angleId} feed={f} main={false}
              onRemove={() => removeFeed(f.angleId)} />
          ))}
        </div>
      )}

      {/* ── دوربینِ این دستگاه به پخشِ در جریان اضافه شود ── */}
      {!session && joinable && !broadcasting && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.32)', borderRadius: 14, padding: '12px 14px' }}>
          <Radio size={16} style={{ color: GOLD_D, flexShrink: 0 }} aria-hidden />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: INK, flex: 1, lineHeight: 1.8 }}>
            «{joinable.title}» هم‌اکنون در حال پخش است. می‌توانید دوربین این دستگاه را به آن اضافه کنید.
          </span>
        </div>
      )}

      {/* ── تنظیمات ── */}
      {!broadcasting && !joinable && (
        <>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: SEC, marginBottom: 6 }}>عنوان پخش</span>
            <input value={title} onChange={e => setTitle(e.target.value.slice(0, 90))}
              placeholder={`مثلا: فینال مسابقات ${clubName}`}
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 12, border: `1px solid ${LINE}`, background: GROUND, fontSize: 13.5, fontFamily: 'inherit', color: INK, outline: 'none' }} />
          </label>
          <SelectField label="رشته" value={discipline} onChange={setDiscipline} options={DISCIPLINES} />
        </>
      )}

      {!broadcasting && camOptions.length > 1 && (
        <SelectField label="دوربین" value={deviceId || camOptions[0]?.value || ''}
          onChange={setDeviceId} options={camOptions} />
      )}

      <SelectField
        label="کیفیت تصویر"
        value={quality}
        onChange={v => void changeQuality(v as QualityId)}
        options={QUALITY_PRESETS.map(p => ({ value: p.id, label: `${p.label} — ${p.hint}` }))}
      />

      {!broadcasting && (
        <p style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11.5, color: MUT, margin: 0, lineHeight: 1.9 }}>
          <Settings2 size={14} style={{ flexShrink: 0, marginTop: 3 }} aria-hidden />
          برای پخش با دوربین فیلم‌برداری، آن را با کارت کپچر HDMI به لپ‌تاپ وصل کنید؛ در فهرست دوربین‌ها ظاهر می‌شود.
        </p>
      )}

      {err && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#B23B2E', background: 'rgba(178,59,46,0.08)', border: '1px solid rgba(178,59,46,0.2)', borderRadius: 12, padding: '10px 13px' }}>
          <AlertCircle size={15} aria-hidden /> {err}
        </div>
      )}

      {/* ── اکشن‌ها ── */}
      {!broadcasting ? (
        <>
          {!preview && !joinable && (
            <button type="button" onClick={() => void openPreview()}
              style={{ ...btn, background: '#fff', border: `1px solid ${LINE}`, color: INK }}>
              <Video size={17} aria-hidden /> روشن کردن دوربین
            </button>
          )}
          {joinable ? (
            <button type="button" onClick={() => void addCamera('camera')} disabled={adding}
              style={{ ...btn, background: GOLD_D, color: '#fff', border: 'none', opacity: adding ? .7 : 1 }}>
              {adding ? <Loader2 size={17} className="gl-spin" aria-hidden /> : <Plus size={17} aria-hidden />}
              افزودن دوربین به پخش جاری
            </button>
          ) : (
            <button type="button" onClick={go} disabled={busy || !polled}
              style={{ ...btn, background: RED, color: '#fff', border: 'none', opacity: (busy || !polled) ? .7 : 1 }}>
              {busy ? <Loader2 size={17} className="gl-spin" aria-hidden /> : <Radio size={17} aria-hidden />}
              شروع پخش زنده
            </button>
          )}
          <p style={{ fontSize: 11.5, color: MUT, textAlign: 'center', margin: 0, lineHeight: 1.9 }}>
            با شروع پخش، باشگاه شما در صفحه‌ی «پخش زنده» سایت نمایش داده می‌شود و بازدیدکنندگان می‌توانند تماشا کنند.
          </p>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(14,122,56,0.07)', border: '1px solid rgba(14,122,56,0.2)', borderRadius: 14, padding: '12px 14px' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: FELT, animation: 'glPulse 1.4s infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: INK, flex: 1 }}>
              در حال پخش — {fa(mainFeed?.viewers ?? 0)} بیننده
              {feeds.length > 1 && ` · ${fa(feeds.length)} دوربین`}
            </span>
            {live && (
              <Link href={`/live/${live.id}`} target="_blank"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: GOLD_D, textDecoration: 'none' }}>
                مشاهده <ExternalLink size={12} aria-hidden />
              </Link>
            )}
          </div>

          {feeds.length < MAX_ANGLES && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => void addCamera('camera')} disabled={adding}
                style={{ ...btn, flex: 1, background: '#fff', border: `1px solid ${LINE}`, color: INK, opacity: adding ? .7 : 1 }}>
                {adding ? <Loader2 size={16} className="gl-spin" aria-hidden /> : <Plus size={16} aria-hidden />} دوربین دیگر
              </button>
              {canShare && (
                <button type="button" onClick={() => void addCamera('screen')} disabled={adding}
                  style={{ ...btn, flex: 1, background: '#fff', border: `1px solid ${LINE}`, color: INK, opacity: adding ? .7 : 1 }}>
                  <MonitorUp size={16} aria-hidden /> تابلوی امتیاز
                </button>
              )}
            </div>
          )}

          {session ? (
            <button type="button" onClick={end} disabled={busy} style={{ ...btn, background: INK, color: '#fff', border: 'none' }}>
              {busy ? <Loader2 size={17} className="gl-spin" aria-hidden /> : <VideoOff size={17} aria-hidden />} پایان پخش
            </button>
          ) : (
            <button type="button" onClick={end} disabled={busy} style={{ ...btn, background: '#fff', border: `1px solid ${LINE}`, color: INK }}>
              <VideoOff size={17} aria-hidden /> قطع دوربین این دستگاه
            </button>
          )}
        </>
      )}

      <style>{`
        @keyframes glPulse { 0%,100% { opacity:1 } 50% { opacity:.35 } }
        @keyframes glSpin { to { transform: rotate(360deg) } }
        .gl-spin { animation: glSpin 1s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .gl-spin { animation-duration: 2.4s }
        }
      `}</style>
    </div>
  )
}

const btn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800,
}
const ctrl: React.CSSProperties = {
  width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
  background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)',
}
