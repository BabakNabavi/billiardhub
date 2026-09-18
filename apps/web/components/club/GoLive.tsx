'use client'

/* ─────────────────────────────────────────────────────────────
   پخش زنده از باشگاه — تا چهار دوربین، روی یک یا چند دستگاه.

   ── الگوی کار ──
   یک دستگاه پخش را شروع می‌کند. هر دستگاهِ دیگری که با **همین حساب**
   وارد شود و همین تب را باز کند، پخشِ در جریان را می‌بیند و دوربینِ
   خودش را به آن اضافه می‌کند. پس چهار نفر با چهار گوشی می‌توانند
   چهار میز را هم‌زمان پخش کنند. روی یک دستگاه هم اگر چند ورودیِ
   ویدیو باشد (کارتِ کپچرِ دوربینِ حرفه‌ای) همان‌جا اضافه می‌شوند.

   ── این کامپوننت مالکِ پخش نیست ──
   حالتِ پخش در `lib/live/broadcast-store` است، بیرون از ری‌اکت. دلیلش
   در همان فایل توضیح داده شده: این کامپوننت با
   `{activeTab === 'live' && …}` رندر می‌شود و هر بار که کاربر تب را
   عوض می‌کرد یا لینکی او را از صفحه می‌برد، پخشِ در جریان می‌مرد.
   این‌جا فقط پنجره‌ای به آن حالت است.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  Radio, Video, VideoOff, Loader2, SwitchCamera, ExternalLink, AlertCircle,
  Plus, MonitorUp, Settings2, Link2, Check, Users,
} from 'lucide-react'
import {
  subscribe, getSnapshot, getServerSnapshot, isBroadcasting,
  startSession, adoptSession, addFeed, removeFeed, toggleMic,
  endLocal, dropLocalFeeds, replaceMain, setQuality as storeSetQuality, setError as storeSetError,
} from '../../lib/live/broadcast-store'
import { fetchLiveSessions, type LiveSession } from '../../lib/live/client'
import { MAIN_ANGLE, MAX_ANGLES, defaultAngleLabel } from '../../lib/live/angles'
import { QUALITY_PRESETS, presetOf, type QualityId } from '../../lib/live/quality'
import { listCameras, openCamera, openScreen, screenShareSupported, stopStream, type CamDevice } from '../../lib/live/devices'
import SelectField from '../ui/SelectField'
import FeedTile from './live/FeedTile'
import AddCameraPanel from './live/AddCameraPanel'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#6F6A5C', LINE = '#EAE5DA'
const GOLD_D = '#8F6531', RED = '#ef4444', FELT = '#0E7A38', GROUND = '#FAF8F3'
const fa = (n: number) => Number(n || 0).toLocaleString('fa-IR')

const trackDeviceId = (s: MediaStream): string =>
  String(s.getVideoTracks()[0]?.getSettings().deviceId ?? '')

export default function GoLive({ clubId, clubName, ownerKey }: { clubId: string; clubName: string; ownerKey: string }) {
  const st = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  /** پخشی که دستگاهِ دیگری شروع کرده و این دستگاه هنوز چیزی به آن نداده. */
  const [joinable, setJoinable] = useState<LiveSession | null>(null)
  const [polled, setPolled] = useState(false)
  const [preview, setPreview] = useState<MediaStream | null>(null)

  const [title, setTitle] = useState('')
  const [mainLabel, setMainLabel] = useState(defaultAngleLabel(0))
  const [cams, setCams] = useState<CamDevice[]>([])
  const [deviceId, setDeviceId] = useState('')
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')

  const [canShare, setCanShare] = useState(false)
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [copied, setCopied] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [localErr, setLocalErr] = useState('')
  const [elapsed, setElapsed] = useState(0)

  const previewRef = useRef<HTMLVideoElement>(null)
  const previewStreamRef = useRef<MediaStream | null>(null)
  const aliveRef = useRef(true)
  const missesRef = useRef(0)

  const broadcasting = st.feeds.length > 0
  const live = st.session ?? joinable
  const err = localErr || st.error
  /* ⚠️ استور سراسری است ولی این کامپوننت برای هر باشگاه جدا رندر
     می‌شود. مالکی که دو باشگاه دارد می‌توانست پخشِ باشگاه الف را
     ببیند در حالی که باشگاه ب انتخاب شده — و «دوربین دیگر» زاویه را
     به جلسه‌ی الف اضافه می‌کرد. */
  const otherClub = st.session != null && st.session.clubId !== clubId

  useEffect(() => { setCanShare(screenShareSupported()) }, [])

  useEffect(() => {
    previewStreamRef.current = preview
    if (previewRef.current && preview) previewRef.current.srcObject = preview
  }, [preview])

  /* ⚠️ فقط پیش‌نمایش بسته می‌شود، نه پخش. بستنِ پخش در همین‌جا همان
     باگی بود که با عوض‌کردنِ تب، پخشِ در جریان را می‌کشت. */
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      stopStream(previewStreamRef.current)
      previewStreamRef.current = null
    }
  }, [])

  const refreshCams = useCallback(async () => { setCams(await listCameras()) }, [])
  useEffect(() => { void refreshCams() }, [refreshCams])

  /* ── پخشِ در جریانِ همین باشگاه ── */
  useEffect(() => {
    let alive = true
    const look = async () => {
      const all = await fetchLiveSessions()
      if (!alive) return
      /* undefined یعنی نتوانستیم بپرسیم. دست نزن — نه به joinable، نه
         به شمارنده‌ی خطا. وگرنه چند ثانیه اینترنتِ بد، دوربینِ سالمِ
         مهمان را خاموش می‌کرد. */
      if (all === undefined) return
      const hit = all.find(s => s.clubId === clubId && !s.ended) ?? null
      setJoinable(prev => (prev?.id === hit?.id ? prev : hit))

      /* مالکْ پخش را بسته و این دستگاه فقط مهمان بود ⇒ دوربینش را
         ببندد، وگرنه تا ابد به کانالی مرده می‌فرستد. */
      if (!hit && isBroadcasting() && !getSnapshot().owned) {
        missesRef.current += 1
        if (missesRef.current >= 2) {
          missesRef.current = 0
          dropLocalFeeds('پخش توسط باشگاه پایان یافت؛ دوربین این دستگاه بسته شد.')
        }
      } else if (hit) {
        missesRef.current = 0
      }
      setPolled(true)
    }
    void look()
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') void look() }, 20_000)
    return () => { alive = false; window.clearInterval(t) }
  }, [clubId])

  useEffect(() => {
    const s = st.session
    if (!s) { setElapsed(0); return }
    const tick = () => setElapsed(Math.floor((Date.now() - s.startedAt) / 1000))
    tick()
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [st.session])

  /* ── پیش‌نمایش ── */
  const openPreview = useCallback(async () => {
    setLocalErr(''); storeSetError('')
    const r = await openCamera(presetOf(st.quality), { deviceId: deviceId || undefined, facing })
    if (!r.stream) { setLocalErr(r.error); return null }
    if (!aliveRef.current) { stopStream(r.stream); return null }
    const old = previewStreamRef.current
    previewStreamRef.current = r.stream
    stopStream(old)
    setPreview(r.stream)
    /* انتخابگر باید همان دوربینی را نشان دهد که واقعا باز است. */
    const real = trackDeviceId(r.stream)
    if (real) setDeviceId(real)
    void refreshCams()
    return r.stream
  }, [st.quality, deviceId, facing, refreshCams])

  /* کیفیت یا دوربین که عوض شد، پیش‌نمایش با قیدِ تازه دوباره باز شود —
     وگرنه «۴K» انتخاب می‌شود و همان تصویرِ قبلی دیده می‌شود. */
  useEffect(() => {
    if (!preview || broadcasting) return
    void openPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.quality, deviceId, facing])

  /* ── شروع ── */
  const go = async () => {
    if (busy) return
    setBusy(true); setLocalErr('')
    const s = preview ?? await openPreview()
    if (!s) { setBusy(false); return }
    /* استریم از این لحظه مالِ استور است؛ پاک‌سازیِ پیش‌نمایش نباید
       بعدا ببنددش. */
    previewStreamRef.current = null
    setPreview(null)
    await startSession({
      clubId, clubName, ownerKey,
      title: title.trim() || `پخش زنده ${clubName}`,
      stream: s,
      deviceId: trackDeviceId(s) || deviceId,
      mainLabel: mainLabel.trim() || defaultAngleLabel(0),
    })
    setBusy(false)
  }

  /* ── افزودنِ دوربین ── */
  const addCam = async (devId: string, label: string) => {
    const target = live
    if (!target || adding) return
    setAdding(true); setLocalErr('')
    if (!st.session) adoptSession(target, ownerKey)

    const r = await openCamera(presetOf(st.quality), { deviceId: devId, audio: false })
    if (!r.stream) { if (r.error) setLocalErr(r.error); setAdding(false); return }
    if (!aliveRef.current) { stopStream(r.stream); setAdding(false); return }

    const ok = await addFeed({ stream: r.stream, kind: 'camera', deviceId: devId, label })
    if (ok) setShowAdd(false)
    setAdding(false)
  }

  const addScreen = async () => {
    const target = live
    if (!target || adding) return
    setAdding(true); setLocalErr('')
    if (!st.session) adoptSession(target, ownerKey)
    const r = await openScreen(presetOf(st.quality))
    if (!r.stream) { if (r.error) setLocalErr(r.error); setAdding(false); return }
    if (!aliveRef.current) { stopStream(r.stream); setAdding(false); return }
    await addFeed({ stream: r.stream, kind: 'screen', deviceId: '', label: 'تابلوی امتیاز' })
    setAdding(false)
  }

  const end = async () => {
    if (busy) return
    setBusy(true)
    await endLocal()
    setJoinable(null); missesRef.current = 0
    setBusy(false)
  }

  /* دکمه فقط پیش از شروعِ پخش دیده می‌شود؛ خودِ افکت دوربین را باز
     می‌کند، پس این‌جا فقط state عوض می‌شود. */
  const flip = () => {
    setFacing(f => (f === 'environment' ? 'user' : 'environment'))
    setDeviceId('')
  }

  /* ── تعویضِ دوربینِ اصلی ──
     پیش از شروع فقط پیش‌نمایش عوض می‌شود. وسطِ پخش، تصویر با
     replaceTrack جابه‌جا می‌شود و هیچ بیننده‌ای قطع نمی‌شود. */
  const pickMainCamera = async (id: string) => {
    setDeviceId(id)
    if (!mainFeed || swapping) return
    setSwapping(true); setLocalErr('')
    const r = await openCamera(presetOf(st.quality), { deviceId: id })
    if (!r.stream) { setLocalErr(r.error); setSwapping(false); return }
    if (!aliveRef.current) { stopStream(r.stream); setSwapping(false); return }
    await replaceMain(r.stream, id)
    setSwapping(false)
  }

  const copyLink = async () => {
    if (!live) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/live/${live.id}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch { setLocalErr('کپی لینک ممکن نشد') }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0'), ss = String(elapsed % 60).padStart(2, '0')
  const mainFeed = st.feeds.find(f => f.angleId === MAIN_ANGLE)
  const extras = st.feeds.filter(f => f.angleId !== MAIN_ANGLE)
  const camOptions = cams.filter(c => c.deviceId).map(c => ({ value: c.deviceId, label: c.label }))
  const totalViewers = st.feeds.reduce((n, f) => n + f.viewers, 0)

  if (otherClub) {
    return (
      <div role="status" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.32)', borderRadius: 14, padding: '14px 16px' }}>
        <Radio size={16} style={{ color: GOLD_D, flexShrink: 0, marginTop: 2 }} aria-hidden />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: INK, flex: 1, lineHeight: 1.9 }}>
          هم‌اکنون پخشِ باشگاه دیگری روی این دستگاه در جریان است. برای شروعِ پخش این باشگاه، اول آن را پایان دهید.
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── تصویرِ اصلی یا پیش‌نمایش ── */}
      {mainFeed ? (
        <FeedTile feed={mainFeed} main elapsed={`${fa(+mm)}:${fa(+ss)}`}
          onToggleMic={() => toggleMic(MAIN_ANGLE)} />
      ) : broadcasting ? null : (
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

      {/* ── دوربین‌های دیگرِ همین دستگاه ── */}
      {extras.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
          {extras.map(f => (
            /* دوربین‌های اضافه بدونِ صدا باز می‌شوند (صدای یک سالن از
               چند میکروفون یعنی پژواک). پس دکمه‌ی میکروفون فقط وقتی
               نشان داده می‌شود که واقعا ترکِ صدایی وجود داشته باشد،
               وگرنه دکمه‌ای بود که آیکونش عوض می‌شد و کاری نمی‌کرد. */
            <FeedTile key={f.angleId} feed={f} main={false}
              onRemove={() => removeFeed(f.angleId)}
              onToggleMic={f.stream.getAudioTracks().length > 0 ? () => toggleMic(f.angleId) : undefined} />
          ))}
        </div>
      )}

      {/* ── این دستگاه مهمانِ پخشِ دیگری است ── */}
      {!st.session && joinable && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.32)', borderRadius: 14, padding: '12px 14px' }}>
          <Radio size={16} style={{ color: GOLD_D, flexShrink: 0, marginTop: 2 }} aria-hidden />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: INK, flex: 1, lineHeight: 1.9 }}>
            «{joinable.title}» هم‌اکنون در حال پخش است. دوربین این دستگاه را به‌عنوان یک میز دیگر به همان پخش اضافه کنید.
          </span>
        </div>
      )}

      {/* ── تنظیمات پیش از شروع ── */}
      {!broadcasting && !joinable && (
        <>
          <label style={{ display: 'block' }}>
            <span style={lbl}>عنوان پخش</span>
            <input value={title} onChange={e => setTitle(e.target.value.slice(0, 90))}
              placeholder={`مثلا: فینال مسابقات ${clubName}`} style={inp} />
          </label>
          <label style={{ display: 'block' }}>
            <span style={lbl}>نام این دوربین (برای بیننده دیده می‌شود)</span>
            <input value={mainLabel} onChange={e => setMainLabel(e.target.value.slice(0, 40))}
              placeholder="مثلا: میز ۱" style={inp} />
          </label>
        </>
      )}

      {camOptions.length > 1 && (!broadcasting || mainFeed) && (
        <SelectField
          label={mainFeed ? 'دوربین اصلی' : 'دوربین'}
          value={(mainFeed ? mainFeed.deviceId : deviceId) || camOptions[0]?.value || ''}
          onChange={v => void pickMainCamera(v)}
          disabled={swapping}
          options={camOptions} />
      )}

      <SelectField
        label="کیفیت تصویر"
        value={st.quality}
        onChange={v => void storeSetQuality(v as QualityId)}
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
            showAdd ? (
              <AddCameraPanel cams={cams} usedIds={[]} busy={adding}
                suggestedLabel={defaultAngleLabel(1)}
                onAdd={(d, l) => void addCam(d, l)} onCancel={() => setShowAdd(false)} />
            ) : (
              <button type="button" onClick={() => setShowAdd(true)}
                style={{ ...btn, background: GOLD_D, color: '#fff', border: 'none' }}>
                <Plus size={17} aria-hidden /> افزودن دوربین این دستگاه
              </button>
            )
          ) : (
            <button type="button" onClick={() => void go()} disabled={busy || !polled}
              style={{ ...btn, background: RED, color: '#fff', border: 'none', opacity: (busy || !polled) ? .7 : 1 }}>
              {busy ? <Loader2 size={17} className="gl-spin" aria-hidden /> : <Radio size={17} aria-hidden />}
              شروع پخش زنده
            </button>
          )}
          <p style={{ fontSize: 11.5, color: MUT, textAlign: 'center', margin: 0, lineHeight: 1.9 }}>
            برای پخش هم‌زمانِ چند میز، همین صفحه را روی گوشی یا لپ‌تاپ دیگری با همین حساب باز کنید و از آن‌جا دوربین اضافه کنید — تا {fa(MAX_ANGLES)} دوربین.
          </p>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(14,122,56,0.07)', border: '1px solid rgba(14,122,56,0.2)', borderRadius: 14, padding: '12px 14px', flexWrap: 'wrap' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: FELT, animation: 'glPulse 1.4s infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: INK, flex: 1 }}>
              در حال پخش{st.feeds.length > 1 && ` · ${fa(st.feeds.length)} دوربین`}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: SEC }}>
              <Users size={13} aria-hidden /> {fa(totalViewers)}
            </span>
          </div>

          {/* ⚠️ «مشاهده» عمدا در تبِ تازه باز می‌شود. روی موبایل، ناوبری
              در همان تب یعنی ترکِ این صفحه — و همان چیزی که گزارش شد:
              کاربر ناگهان از پخش بیرون می‌افتاد و تماشاگر می‌شد.
              کپیِ لینک راهِ امنِ فرستادنش برای دیگران است. */}
          {live && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => void copyLink()}
                style={{ ...btn, flex: 1, background: '#fff', border: `1px solid ${LINE}`, color: INK }}>
                {copied ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
                {copied ? 'کپی شد' : 'کپی لینک پخش'}
              </button>
              <Link href={`/live/${live.id}`} target="_blank" rel="noopener noreferrer"
                style={{ ...btn, flex: 1, background: '#fff', border: `1px solid ${LINE}`, color: INK, textDecoration: 'none' }}>
                مشاهده <ExternalLink size={14} aria-hidden />
              </Link>
            </div>
          )}

          {st.feeds.length < MAX_ANGLES && (
            showAdd ? (
              <AddCameraPanel cams={cams} busy={adding}
                usedIds={st.feeds.map(f => f.deviceId).filter(Boolean)}
                suggestedLabel={defaultAngleLabel(st.feeds.length)}
                onAdd={(d, l) => void addCam(d, l)} onCancel={() => setShowAdd(false)} />
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowAdd(true)} disabled={adding}
                  style={{ ...btn, flex: 1, background: '#fff', border: `1px solid ${LINE}`, color: INK }}>
                  <Plus size={16} aria-hidden /> دوربین دیگر
                </button>
                {canShare && (
                  <button type="button" onClick={() => void addScreen()} disabled={adding}
                    style={{ ...btn, flex: 1, background: '#fff', border: `1px solid ${LINE}`, color: INK, opacity: adding ? .7 : 1 }}>
                    <MonitorUp size={16} aria-hidden /> تابلوی امتیاز
                  </button>
                )}
              </div>
            )
          )}

          <button type="button" onClick={() => void end()} disabled={busy}
            style={{ ...btn, background: st.owned ? INK : '#fff', color: st.owned ? '#fff' : INK, border: st.owned ? 'none' : `1px solid ${LINE}` }}>
            {busy ? <Loader2 size={17} className="gl-spin" aria-hidden /> : <VideoOff size={17} aria-hidden />}
            {st.owned ? 'پایان پخش' : 'قطع دوربین این دستگاه'}
          </button>

          <p style={{ fontSize: 11.5, color: MUT, textAlign: 'center', margin: 0, lineHeight: 1.9 }}>
            می‌توانید به تب‌های دیگر پنل بروید؛ پخش تا وقتی این صفحه باز است ادامه دارد.
          </p>
        </>
      )}

      <style>{`
        @keyframes glPulse { 0%,100% { opacity:1 } 50% { opacity:.35 } }
        @keyframes glSpin { to { transform: rotate(360deg) } }
        .gl-spin { animation: glSpin 1s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .gl-spin { animation-duration: 2.4s } }
      `}</style>
    </div>
  )
}

const btn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800,
}
const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 12,
  border: `1px solid ${LINE}`, background: GROUND, fontSize: 13.5, fontFamily: 'inherit', color: INK, outline: 'none',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11.5, fontWeight: 800, color: SEC, marginBottom: 6,
}
const ctrl: React.CSSProperties = {
  width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
  background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)',
}
