'use client'

/* پخش زنده از گوشی باشگاه‌دار — دوربین گوشی روی صفحه «پخش زنده» سایت. */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Radio, Video, VideoOff, Users, Loader2, SwitchCamera, Mic, MicOff, ExternalLink, AlertCircle } from 'lucide-react'
import { startBroadcast, type Broadcaster } from '../../lib/live/webrtc'
import { startLive, beatLive, stopLive, type LiveSession } from '../../lib/live/client'
import SelectField from '../ui/SelectField'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', RED = '#ef4444', FELT = '#0E7A38', GROUND = '#FAF8F3'
const fa = (n: number) => Number(n || 0).toLocaleString('fa-IR')

const DISCIPLINES = [
  { value: 'اسنوکر', label: 'اسنوکر' },
  { value: 'پاکت بیلیارد', label: 'پاکت بیلیارد' },
  { value: 'هی‌بال', label: 'هی‌بال' },
  { value: 'کاروم', label: 'کاروم' },
  { value: 'سایر', label: 'سایر' },
]

export default function GoLive({ clubId, clubName, ownerKey }: { clubId: string; clubName: string; ownerKey: string }) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [session, setSession] = useState<LiveSession | null>(null)
  const [viewers, setViewers] = useState(0)
  const [title, setTitle] = useState('')
  const [discipline, setDiscipline] = useState('اسنوکر')
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')
  const [micOn, setMicOn] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [elapsed, setElapsed] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const bcRef = useRef<Broadcaster | null>(null)
  const sessionRef = useRef<LiveSession | null>(null)
  const viewersRef = useRef(0)

  useEffect(() => { sessionRef.current = session }, [session])
  useEffect(() => { viewersRef.current = viewers }, [viewers])

  /* دوربین */
  const openCamera = useCallback(async (mode: 'user' | 'environment') => {
    setErr('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      setStream(prev => { prev?.getTracks().forEach(t => t.stop()); return s })
      return s
    } catch {
      setErr('دسترسی به دوربین ممکن نشد. اجازه‌ی دوربین و میکروفون را بدهید.')
      return null
    }
  }, [])

  useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream }, [stream])
  useEffect(() => () => {
    bcRef.current?.stop()
    stream?.getTracks().forEach(t => t.stop())
    const s = sessionRef.current
    if (s) stopLive(s.id, ownerKey)
  }, []) // eslint-disable-line

  /* تپش + شمارنده‌ی زمان */
  useEffect(() => {
    if (!session) return
    const beat = setInterval(() => { beatLive(session.id, ownerKey, viewersRef.current) }, 15_000)
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - session.startedAt) / 1000)), 1000)
    return () => { clearInterval(beat); clearInterval(tick) }
  }, [session, ownerKey])

  const go = async () => {
    if (busy) return
    setBusy(true); setErr('')
    const s = stream ?? await openCamera(facing)
    if (!s) { setBusy(false); return }
    const r = await startLive({ clubId, clubName, ownerKey, title: title.trim() || `پخش زنده ${clubName}`, discipline })
    if (!r?.ok || !r.session) { setErr(r?.message || 'شروع پخش ممکن نشد'); setBusy(false); return }
    const bc = startBroadcast(r.session.id, s, n => setViewers(n))
    if (!bc) { setErr('اتصال بی‌درنگ در دسترس نیست'); setBusy(false); return }
    bcRef.current = bc; setSession(r.session); setElapsed(0); setBusy(false)
  }

  const end = async () => {
    if (busy) return
    setBusy(true)
    bcRef.current?.stop(); bcRef.current = null
    if (session) await stopLive(session.id, ownerKey)
    setSession(null); setViewers(0); setBusy(false)
  }

  const flip = async () => {
    const next = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    const s = await openCamera(next)
    /* هنگام پخش، تعویض دوربین نیازمند شروع دوباره‌ی اتصال‌هاست */
    if (s && session) {
      bcRef.current?.stop()
      const bc = startBroadcast(session.id, s, n => setViewers(n))
      bcRef.current = bc
    }
  }

  const toggleMic = () => {
    if (!stream) return
    const next = !micOn
    stream.getAudioTracks().forEach(t => { t.enabled = next })
    setMicOn(next)
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0'), ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* پیش‌نمایش دوربین */}
      <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#111', aspectRatio: '16/9' }}>
        {stream ? (
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,0.5)' }}>
            <VideoOff size={30} />
            <span style={{ fontSize: 13 }}>دوربین روشن نیست</span>
          </div>
        )}

        {session && (
          <div style={{ position: 'absolute', top: 12, insetInlineStart: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: RED, color: '#fff', borderRadius: 999, padding: '4px 11px', fontSize: 11, fontWeight: 900, letterSpacing: '.1em' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'glPulse 1.4s infinite' }} /> LIVE
            </span>
            <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 999, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {fa(+mm)}:{fa(+ss)}
            </span>
          </div>
        )}
        {session && (
          <span style={{ position: 'absolute', top: 12, insetInlineEnd: 12, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 999, padding: '4px 11px', fontSize: 11.5, fontWeight: 800 }}>
            <Users size={12} /> {fa(viewers)}
          </span>
        )}

        {stream && (
          <div style={{ position: 'absolute', bottom: 12, insetInlineEnd: 12, display: 'flex', gap: 8 }}>
            <button onClick={flip} aria-label="تعویض دوربین" style={ctrl}><SwitchCamera size={17} /></button>
            <button onClick={toggleMic} aria-label="میکروفون" style={{ ...ctrl, color: micOn ? '#fff' : RED }}>
              {micOn ? <Mic size={17} /> : <MicOff size={17} />}
            </button>
          </div>
        )}
      </div>

      {/* تنظیمات پیش از شروع */}
      {!session && (
        <>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: SEC, marginBottom: 6 }}>عنوان پخش</span>
            <input value={title} onChange={e => setTitle(e.target.value.slice(0, 90))}
              placeholder={`مثلاً: فینال مسابقات ${clubName}`}
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 12, border: `1px solid ${LINE}`, background: GROUND, fontSize: 13.5, fontFamily: 'inherit', color: INK, outline: 'none' }} />
          </label>
          <SelectField label="رشته" value={discipline} onChange={setDiscipline} options={DISCIPLINES} />
        </>
      )}

      {err && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#B23B2E', background: 'rgba(178,59,46,0.08)', border: '1px solid rgba(178,59,46,0.2)', borderRadius: 12, padding: '10px 13px' }}>
          <AlertCircle size={15} /> {err}
        </div>
      )}

      {/* اکشن‌ها */}
      {!session ? (
        <>
          {!stream && (
            <button onClick={() => openCamera(facing)}
              style={{ ...btn, background: '#fff', border: `1px solid ${LINE}`, color: INK }}>
              <Video size={17} /> روشن کردن دوربین
            </button>
          )}
          <button onClick={go} disabled={busy}
            style={{ ...btn, background: RED, color: '#fff', border: 'none', opacity: busy ? .7 : 1 }}>
            {busy ? <Loader2 size={17} className="gl-spin" /> : <Radio size={17} />} شروع پخش زنده
          </button>
          <p style={{ fontSize: 11.5, color: MUT, textAlign: 'center', margin: 0, lineHeight: 1.9 }}>
            با شروع پخش، باشگاه شما در صفحه‌ی «پخش زنده» سایت نمایش داده می‌شود و بازدیدکنندگان می‌توانند تماشا کنند.
          </p>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(14,122,56,0.07)', border: '1px solid rgba(14,122,56,0.2)', borderRadius: 14, padding: '12px 14px' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: FELT, animation: 'glPulse 1.4s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: INK, flex: 1 }}>در حال پخش — {fa(viewers)} بیننده</span>
            <Link href={`/live/${session.id}`} target="_blank"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: GOLD_D, textDecoration: 'none' }}>
              مشاهده <ExternalLink size={12} />
            </Link>
          </div>
          <button onClick={end} disabled={busy} style={{ ...btn, background: INK, color: '#fff', border: 'none' }}>
            {busy ? <Loader2 size={17} className="gl-spin" /> : <VideoOff size={17} />} پایان پخش
          </button>
        </>
      )}

      <style>{`
        @keyframes glPulse { 0%,100% { opacity:1 } 50% { opacity:.35 } }
        @keyframes glSpin { to { transform: rotate(360deg) } }
        .gl-spin { animation: glSpin 1s linear infinite; }
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
