'use client'

/* آپلود ویدیو + ساخت خودکار کانال (مثل یوتیوب) — فقط کاربر لاگین‌کرده.
   مدت ویدیو و تامبنیل خودکار از فریم گرفته می‌شوند؛ آپلود روی Supabase Storage. */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, UploadCloud, Film, Image as ImageIcon, Check, Loader2, Tv } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { uploadFile } from '../lib/supabase'
import { postUserVideo, fetchMyChannel, saveChannel, type UserChannel } from '../lib/media-user'
import { MEDIA_CATEGORIES, faDigits, type MediaVideo } from '../lib/media-data'
import SelectField from './ui/SelectField'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38'
const MAX_MB = 200

const fmtDur = (sec: number) => {
  if (!isFinite(sec) || sec <= 0) return '۰۰:۰۰'
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60)
  return faDigits(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
}
const todayFa = () => {
  try { return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()) } catch { return '' }
}

function captureFrame(video: HTMLVideoElement): Promise<File | null> {
  return new Promise(resolve => {
    try {
      const w = 640, h = Math.round(640 * (video.videoHeight / (video.videoWidth || 640))) || 360
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d'); if (!ctx) return resolve(null)
      ctx.drawImage(video, 0, 0, w, h)
      canvas.toBlob(b => resolve(b ? new File([b], 'thumb.jpg', { type: 'image/jpeg' }) : null), 'image/jpeg', 0.82)
    } catch { resolve(null) }
  })
}

export default function MediaUpload({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded: (v: MediaVideo) => void }) {
  const { user } = useAuthStore()
  const [file, setFile]         = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [duration, setDuration] = useState('')
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [thumbPrev, setThumbPrev] = useState('')
  const [title, setTitle]       = useState('')
  const [category, setCategory] = useState<string>(MEDIA_CATEGORIES[0]!.key)
  const [desc, setDesc]         = useState('')
  const [tags, setTags]         = useState('')
  const [busy, setBusy]         = useState(false)
  const [phase, setPhase]       = useState('')
  const [err, setErr]           = useState('')
  const vref = useRef<HTMLVideoElement>(null)

  /* کانال — مثل یوتیوب، برای انتشار لازم است و مرحله‌ی صریحی دارد */
  const [channel, setChannel] = useState<UserChannel | null>(null)
  const [chLoaded, setChLoaded] = useState(false)
  const [chName, setChName] = useState('')
  const [chHandle, setChHandle] = useState('')
  const [chBio, setChBio] = useState('')

  const ownerKey = user ? (user.phone || user.id || user.firstName || 'user') : ''

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl) }, [videoUrl])
  useEffect(() => {
    if (!open || !ownerKey) return
    setErr(''); setChLoaded(false)
    fetchMyChannel(ownerKey).then(c => {
      setChannel(c); setChLoaded(true)
      /* نام از پروفایل پیشنهاد می‌شود؛ هندل را خود کاربر انتخاب می‌کند */
      if (!c) { setChName(`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()); setChHandle('') }
    })
  }, [open, ownerKey, user])

  const createChannel = async () => {
    if (busy) return
    setErr(''); setBusy(true)
    const r = await saveChannel({ ownerKey, name: chName, handle: chHandle, bio: chBio })
    setBusy(false)
    if (!r?.ok || !r.channel) { setErr(r?.message || 'ساخت کانال ناموفق بود'); return }
    setChannel(r.channel)
  }

  if (!open) return null

  const pickVideo = (f?: File) => {
    setErr('')
    if (!f) return
    if (!f.type.startsWith('video/')) { setErr('لطفاً یک فایل ویدیویی انتخاب کنید'); return }
    if (f.size > MAX_MB * 1024 * 1024) { setErr(`حجم ویدیو نباید بیش از ${faDigits(MAX_MB)} مگابایت باشد`); return }
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    const url = URL.createObjectURL(f)
    setFile(f); setVideoUrl(url); setDuration(''); setThumbFile(null); setThumbPrev('')
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').slice(0, 120))
  }

  const onMeta = () => { const v = vref.current; if (v) { setDuration(fmtDur(v.duration)); try { v.currentTime = Math.min(1.2, (v.duration || 3) / 3) } catch { /* */ } } }
  const onSeeked = async () => {
    const v = vref.current; if (!v || thumbFile) return
    const f = await captureFrame(v)
    if (f) { setThumbFile(f); setThumbPrev(URL.createObjectURL(f)) }
  }
  const pickThumb = (f?: File) => { if (f && f.type.startsWith('image/')) { setThumbFile(f); setThumbPrev(URL.createObjectURL(f)) } }

  const submit = async () => {
    if (busy) return
    setErr('')
    if (!user) { setErr('برای آپلود باید وارد شوید'); return }
    if (!channel) { setErr('ابتدا کانال خود را بسازید'); return }
    if (!file) { setErr('ویدیو را انتخاب کنید'); return }
    if (!title.trim()) { setErr('عنوان ویدیو را بنویسید'); return }
    setBusy(true)
    try {
      const id = `uv-${Date.now()}-${Math.floor(Math.random() * 1e4)}`
      const ext = (file.name.match(/\.[^.]+$/)?.[0] || '.mp4').toLowerCase()
      setPhase('در حال آپلود ویدیو…')
      const src = await uploadFile('club-media', file, `social/media/vid/${id}${ext}`)
      if (!src) throw new Error('upload-video')
      let thumb = ''
      if (thumbFile) { setPhase('در حال آپلود تصویر…'); thumb = (await uploadFile('club-media', thumbFile, `social/media/thumb/${id}.jpg`)) || '' }
      setPhase('در حال انتشار…')
      const res = await postUserVideo({
        id, title: title.trim(), category, ownerKey,
        creatorName: channel.name,
        creatorHandle: channel.handle,
        duration: duration || '۰۰:۰۰', date: todayFa(), thumb, src,
        description: desc.trim() ? desc.trim().split(/\n+/).filter(Boolean).slice(0, 6) : [],
        tags: tags.split(/[،,]/).map(t => t.trim()).filter(Boolean).slice(0, 8),
      })
      if (!res?.ok || !res.video) throw new Error('publish')
      onUploaded({
        id: res.video.id, title: res.video.title, category: res.video.category as MediaVideo['category'],
        creator: { id: res.video.ownerKey, name: res.video.creatorName, handle: res.video.creatorHandle },
        duration: res.video.duration, views: 0, likes: 0, date: res.video.date, ts: res.video.ts,
        thumb: res.video.thumb, src: res.video.src, description: res.video.description, tags: res.video.tags,
      })
      onClose()
      // ریست
      setFile(null); setVideoUrl(''); setDuration(''); setThumbFile(null); setThumbPrev(''); setTitle(''); setDesc(''); setTags('')
    } catch {
      setErr('آپلود ناموفق بود؛ اتصال را بررسی کنید و دوباره تلاش کنید')
    } finally { setBusy(false); setPhase('') }
  }

  return createPortal(
    <div onClick={() => !busy && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(20,18,14,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(16px,5vh,60px) 16px', overflowY: 'auto', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }} dir="rtl">
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 22, border: `1px solid ${LINE}`, boxShadow: '0 40px 90px rgba(20,18,14,0.32)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ display: 'inline-flex', width: 34, height: 34, borderRadius: 10, background: 'rgba(199,166,106,0.14)', color: GOLD_D, alignItems: 'center', justifyContent: 'center' }}><UploadCloud size={18} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 900, color: INK }}>{channel ? 'آپلود ویدیو' : 'ساخت کانال'}</div>
            <div style={{ fontSize: 11.5, color: MUT }}>
              {channel ? <>انتشار در کانال <b style={{ color: SEC }}>{channel.name}</b></> : 'برای انتشار ویدیو ابتدا کانال خود را بسازید'}
            </div>
          </div>
          <button onClick={() => !busy && onClose()} aria-label="بستن" style={{ background: '#F4F3F1', border: `1px solid ${LINE}`, borderRadius: 10, padding: 8, cursor: 'pointer', color: SEC, display: 'flex' }}><X size={17} /></button>
        </div>

        {/* ── مرحله‌ی کانال (اگر هنوز ندارد) ── */}
        {!channel ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!chLoaded ? (
              <div style={{ textAlign: 'center', padding: 30, color: MUT }}><Loader2 size={22} className="bm-spin" /></div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FAF8F3', border: `1px solid ${LINE}`, borderRadius: 16, padding: 14 }}>
                  <span style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 900,
                    color: chName ? '#241B08' : MUT,
                    background: chName ? 'linear-gradient(135deg,#E8CE96,#8A6020)' : '#EDE9E1' }}>
                    {chName ? chName.slice(0, 1) : <Tv size={20} />}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: chName ? INK : MUT }}>{chName || 'نام کانال'}</div>
                    {chHandle && <div style={{ fontSize: 11.5, color: MUT, direction: 'ltr', textAlign: 'right' }}>@{chHandle}</div>}
                  </div>
                </div>
                <Field label="نام کانال">
                  <input value={chName} onChange={e => { setChName(e.target.value.slice(0, 60)); setErr('') }} placeholder="مثلاً: آکادمی بیلیارد من" style={inp} />
                </Field>
                <Field label="هندل کانال (انگلیسی)">
                  <div style={{ ...inp, display: 'flex', alignItems: 'center', gap: 6, padding: '0 13px' }}>
                    <span style={{ color: MUT, fontSize: 14 }}>@</span>
                    <input value={chHandle} onChange={e => { setChHandle(e.target.value.replace(/[^A-Za-z0-9._-]/g, '').toLowerCase().slice(0, 30)); setErr('') }}
                      placeholder="my.channel"
                      style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontSize: 13.5, fontFamily: 'inherit', color: INK, direction: 'ltr', textAlign: 'left' }} />
                  </div>
                </Field>
                <Field label="درباره‌ی کانال (اختیاری)">
                  <textarea value={chBio} onChange={e => setChBio(e.target.value.slice(0, 200))} rows={2} placeholder="در چه زمینه‌ای ویدیو منتشر می‌کنید؟" style={{ ...inp, resize: 'vertical', lineHeight: 1.9 }} />
                </Field>
                {err && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#B23B2E', background: 'rgba(178,59,46,0.08)', border: '1px solid rgba(178,59,46,0.2)', borderRadius: 10, padding: '9px 12px' }}>{err}</div>}
                <button onClick={createChannel} disabled={busy}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, background: GOLD, color: '#241B08' }}>
                  {busy ? <><Loader2 size={17} className="bm-spin" /> در حال ساخت…</> : <><Tv size={17} /> ساخت کانال و ادامه</>}
                </button>
                <p style={{ fontSize: 11, color: MUT, textAlign: 'center', margin: 0, lineHeight: 1.9 }}>
                  کانال یک‌بار ساخته می‌شود و همه‌ی ویدیوهای بعدی شما زیر همان منتشر می‌شود.
                </p>
              </>
            )}
            <style>{`@keyframes bmspin { to { transform: rotate(360deg); } } .bm-spin { animation: bmspin 1s linear infinite; }`}</style>
          </div>
        ) : (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ویدیو */}
          {!videoUrl ? (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '30px 18px', border: `2px dashed ${LINE}`, borderRadius: 16, cursor: 'pointer', background: '#FAF8F3', textAlign: 'center' }}>
              <span style={{ display: 'inline-flex', width: 46, height: 46, borderRadius: 14, background: 'rgba(199,166,106,0.12)', color: GOLD_D, alignItems: 'center', justifyContent: 'center' }}><Film size={22} /></span>
              <span style={{ fontSize: 14, fontWeight: 800, color: INK }}>انتخاب فایل ویدیو</span>
              <span style={{ fontSize: 11.5, color: MUT }}>MP4/MOV/WebM — حداکثر {faDigits(MAX_MB)} مگابایت</span>
              <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => pickVideo(e.target.files?.[0])} />
            </label>
          ) : (
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#000' }}>
              <video ref={vref} src={videoUrl} onLoadedMetadata={onMeta} onSeeked={onSeeked} muted playsInline controls
                style={{ width: '100%', maxHeight: 240, display: 'block', background: '#000' }} />
              {duration && <span style={{ position: 'absolute', bottom: 8, insetInlineStart: 8, fontSize: 11, fontWeight: 800, color: '#fff', background: 'rgba(20,18,14,0.7)', borderRadius: 7, padding: '2px 8px' }}>{duration}</span>}
              <button onClick={() => { if (videoUrl) URL.revokeObjectURL(videoUrl); setFile(null); setVideoUrl(''); setThumbFile(null); setThumbPrev('') }}
                style={{ position: 'absolute', top: 8, insetInlineEnd: 8, background: 'rgba(20,18,14,0.6)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={15} /></button>
            </div>
          )}

          {videoUrl && (
            <>
              <Field label="عنوان">
                <input value={title} onChange={e => setTitle(e.target.value)} maxLength={160} placeholder="مثلاً: آموزش کنترل توپ سفید" style={inp} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <SelectField label="دسته‌بندی" value={category} onChange={setCategory}
                    options={MEDIA_CATEGORIES.map(c => ({ value: c.key, label: c.label, dot: c.dot }))} />
                </div>
                <Field label="تصویر شاخص (اختیاری)">
                  <label style={{ ...inp, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: SEC, overflow: 'hidden' }}>
                    {thumbPrev ? <img loading="lazy" decoding="async" src={thumbPrev} alt="" style={{ width: 30, height: 20, objectFit: 'cover', borderRadius: 4 }} /> : <ImageIcon size={16} />}
                    <span style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{thumbPrev ? 'انتخاب‌شده — تعویض' : 'از فریم ساخته شد'}</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => pickThumb(e.target.files?.[0])} />
                  </label>
                </Field>
              </div>
              <Field label="توضیحات (اختیاری)">
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="دربارهٔ ویدیو…" style={{ ...inp, resize: 'vertical', lineHeight: 1.9 }} />
              </Field>
              <Field label="برچسب‌ها (با ویرگول جدا کنید)">
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="اسنوکر، آموزش، برک بیلدینگ" style={inp} />
              </Field>
            </>
          )}

          {err && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#B23B2E', background: 'rgba(178,59,46,0.08)', border: '1px solid rgba(178,59,46,0.2)', borderRadius: 10, padding: '9px 12px' }}>{err}</div>}

          <button onClick={submit} disabled={busy || !videoUrl}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', cursor: busy || !videoUrl ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, background: videoUrl ? GOLD : '#EDE9E1', color: videoUrl ? '#241B08' : MUT, transition: 'background .2s' }}>
            {busy ? <><Loader2 size={17} className="bm-spin" /> {phase || 'در حال آپلود…'}</> : <><Check size={17} /> انتشار ویدیو</>}
          </button>
          <style>{`@keyframes bmspin { to { transform: rotate(360deg); } } .bm-spin { animation: bmspin 1s linear infinite; }`}</style>
        </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 13px', borderRadius: 11, border: `1px solid ${LINE}`,
  background: '#FAF8F3', fontSize: 13.5, fontFamily: 'inherit', color: INK, outline: 'none',
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: SEC, marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  )
}
