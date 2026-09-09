'use client'

/* آپلود ویدیو + ساخت خودکار کانال (مثل یوتیوب) — فقط کاربر لاگین‌کرده.
   مدت ویدیو و تامبنیل خودکار از فریم گرفته می‌شوند؛ آپلود روی Supabase Storage. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { mediaUploadPath } from '../lib/media/keys'
import { createPortal } from 'react-dom'
import { X, UploadCloud, Film, Image as ImageIcon, Check, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { uploadFile } from '../lib/supabase'
import { postUserVideo, fetchMyChannels, saveChannel, type UserChannel } from '../lib/media-user'
import { MEDIA_CATEGORIES, faDigits, type MediaVideo } from '../lib/media-data'
import { publicDisplayName } from '../lib/public-name'
import SelectField from './ui/SelectField'
import { ChannelCreate, ChannelPicker } from './media/ChannelStep'
import { INK, SEC, MUT, LINE, GOLD, GOLD_D, Field, inp, SPIN_CSS } from './media/upload-ui'

/* رنگ‌ها و ورودی‌ها با مرحله‌ی کانال مشترک‌اند — یک منبع، نه دو کپی */
/* ── چرا ۲۵ و نه ۲۰۰ ──
   سقف واقعی `MAX_VIDEO` در `lib/upload/policy.ts` است و سطل
   `club-media` هم روی همان ۲۵ مگابایت بسته شده. عدد ۲۰۰ فقط روی این
   صفحه نوشته بود و کاربر بعد از انتخاب فایل ۱۰۰ مگابایتی خطا
   می‌گرفت. بالا بردن سقف یعنی اول سطل و کانتینر و nginx باید عوض
   شوند، نه این عدد. */
const MAX_MB = 25

/* ── چرا randomUUID مستقیم صدا زده نمی‌شود ──
   فقط در secure context و روی موتورهای تازه هست؛ وب‌ویوهای قدیمی
   اندروید و مرورگرهای داخل اپ — بخش واقعی از مخاطب این سایت —
   ندارندش. خطایش هم داخل catch گم می‌شد و کاربر پیام «اتصال را
   بررسی کنید» می‌گرفت و دنبال اینترنتش می‌گشت. */
function newId(): string {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID()
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  b[6] = (b[6]! & 0x0f) | 0x40
  b[8] = (b[8]! & 0x3f) | 0x80
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

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
  /* پاسخ کند از بازکردن قبلی نباید روی حالت تازه بنشیند */
  const aliveRef = useRef(true)

  /* کانال — مثل یوتیوب، برای انتشار لازم است و مرحله‌ی صریحی دارد.

     ⚠️ این پنجره تا امروز فقط *یک* کانال می‌شناخت و کورکورانه در
     اولین فهرست منتشر می‌کرد. از وقتی هر نقش می‌تواند کانال خودش
     را داشته باشد، «اولین» یعنی هر کدام که زودتر ساخته شده — و
     ویدیوی مربی می‌رفت زیر کانال فروشگاه. */
  const [channels, setChannels] = useState<UserChannel[]>([])
  const [channel, setChannel] = useState<UserChannel | null>(null)
  /** کاربر صریحا «کانال تازه» زده — با اینکه کانال دارد */
  const [making, setMaking] = useState(false)
  const [chLoaded, setChLoaded] = useState(false)
  /* ⚠️ «خطا داریم و فهرست خالی است» کافی نبود: نام پیشنهادی
     خواندن *قبلی* گارد را خاموش می‌کرد و فرم «کانال بساز» به
     کاربری که کانال داشت نشان داده می‌شد. */
  const [chFailed, setChFailed] = useState(false)
  const [chName, setChName] = useState('')
  const [chHandle, setChHandle] = useState('')
  const [chBio, setChBio] = useState('')

  const ownerKey = user ? (user.phone || user.id || user.firstName || 'user') : ''

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl) }, [videoUrl])
  /* `user` فقط برای نام پیشنهادی لازم است. اگر در وابستگی‌ها بماند،
     هر به‌روزرسانی استور احراز هویت افکت را دوباره می‌دواند و
     انتخاب کاربر را وسط آپلود به کانال اول برمی‌گرداند. */
  const userRef = useRef(user)
  /* نوشتن روی ref در بدنه‌ی رندر عارضه‌ی جانبی است؛ در افکت امن است. */
  useEffect(() => { userRef.current = user }, [user])

  const loadChannels = useCallback(async () => {
    if (!ownerKey) return
    setErr(''); setChLoaded(false); setChFailed(false)
    const list = await fetchMyChannels(ownerKey)
    if (!aliveRef.current) return
    /* `null` یعنی نتوانستیم بخوانیم — نه «ندارد». فرم «کانال بساز»
       در آن حالت دروغ می‌گفت و کاربر کانال تکراری می‌ساخت. پس
       فهرست کهنه هم باید برود؛ وگرنه کنار پیام خطا چیپ‌های
       دفعه‌ی قبل دیده می‌شوند. */
    if (list === null) {
      setChannels([]); setChannel(null); setChLoaded(true); setChFailed(true)
      setErr('فهرست کانال‌ها خوانده نشد.')
      return
    }
    setChannels(list)
    /* انتخاب فعلی اگر هنوز هست بماند — رفرش فهرست نباید مقصد
       انتشار را زیر دست کاربر عوض کند. */
    setChannel(cur => list.find(c => (c.id ?? c.handle) === (cur?.id ?? cur?.handle)) ?? list[0] ?? null)
    setChLoaded(true)
    /* نام پیشنهادی همان نام عمومی است — حساب رسمی نباید نام شخص
       را روی کانال ویدیو ببرد. */
    if (!list.length) { setChName(publicDisplayName(userRef.current, '')); setChHandle('') }
  }, [ownerKey])

  useEffect(() => {
    if (!open || !ownerKey) return
    aliveRef.current = true
    setMaking(false)
    void loadChannels()
    return () => { aliveRef.current = false }
  }, [open, ownerKey, loadChannels])

  const createChannel = async () => {
    if (busy) return
    setErr(''); setBusy(true)
    const r = await saveChannel({ name: chName, handle: chHandle, bio: chBio })
    setBusy(false)
    if (!r?.ok || !r.channel) { setErr(r?.message || 'ساخت کانال ناموفق بود'); return }
    const made = r.channel
    setChannels(list => [...list.filter(c => (c.id ?? c.handle) !== (made.id ?? made.handle)), made])
    setChannel(made); setMaking(false)
    setChName(''); setChHandle(''); setChBio('')
  }

  /* فرم ساخت وقتی باز است که کانالی نیست، یا کاربر خودش خواسته */
  const creating = !channel || making

  /* متادیتای واقعی فایل، از خود مرورگر.

     تا امروز فقط رشته‌ی «۰۴:۱۳» برای نمایش ساخته می‌شد و ثانیه/ابعاد
     دور ریخته می‌شد. آن اعداد همان چیزی‌اند که `VideoObject` و نقشه‌ی
     سایت ویدیو لازم دارند — و بدونشان یا آن فیلد نمی‌آید یا باید
     عدد ساختگی گذاشت، که به گوگل دروغ می‌گوید.

     همه‌جا NULL می‌ماند اگر مرورگر نتوانست بخواند؛ صفر گذاشته نمی‌شود. */
  const [meta, setMeta] = useState<{ durationSec?: number; width?: number; height?: number }>({})

  /* ⚠️ هر هوک باید *بالای* بازگشت زودهنگام باشد. این یکی پایین بود و
     فقط چون تنها مصرف‌کننده‌اش پنجره را با `open` ثابت true سوار
     می‌کند نمی‌ترکید؛ اولین کسی که `open={x}` بنویسد «Rendered more
     hooks than during the previous render» می‌گرفت. */

  if (!open) return null

  const pickVideo = (f?: File) => {
    setErr('')
    if (!f) return
    if (!f.type.startsWith('video/')) { setErr('لطفا یک فایل ویدیویی انتخاب کنید'); return }
    if (f.size > MAX_MB * 1024 * 1024) { setErr(`حجم ویدیو نباید بیش از ${faDigits(MAX_MB)} مگابایت باشد`); return }
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    const url = URL.createObjectURL(f)
    setFile(f); setVideoUrl(url); setDuration(''); setThumbFile(null); setThumbPrev('')
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').slice(0, 120))
  }

  const onMeta = () => {
    const v = vref.current; if (!v) return
    setDuration(fmtDur(v.duration))
    setMeta({
      durationSec: Number.isFinite(v.duration) && v.duration > 0 ? Math.round(v.duration) : undefined,
      width: v.videoWidth || undefined,
      height: v.videoHeight || undefined,
    })
    try { v.currentTime = Math.min(1.2, (v.duration || 3) / 3) } catch { /* */ }
  }
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
      /* ── چرا UUID و نه مهر زمانی ──
         `uv-1786547589258-4213` قابل حدس است: کسی که یک نشانی دارد
         می‌تواند نشانی‌های همسایه را بسازد. پسوند هم این‌جا ساخته
         نمی‌شود — سرور از روی بایت‌های واقعی می‌گذاردش. */
      const id = newId()
      setPhase('در حال آپلود ویدیو…')
      const src = await uploadFile('club-media', file, mediaUploadPath('videos', id))
      if (!src) throw new Error('upload-video')
      let thumb = ''
      if (thumbFile) { setPhase('در حال آپلود تصویر…'); thumb = (await uploadFile('club-media', thumbFile, mediaUploadPath('thumbnails', id))) || '' }
      setPhase('در حال انتشار…')
      const res = await postUserVideo({
        title: title.trim(), category,
        creatorName: channel.name,
        creatorHandle: channel.handle,
        thumb, src,
        description: desc.trim(),
        tags: tags.split(/[،,]/).map(t => t.trim()).filter(Boolean).slice(0, 8),
        /* متادیتای واقعی فایل — پایه‌ی VideoObject و نقشه‌ی سایت */
        durationSec: meta.durationSec,
        width: meta.width,
        height: meta.height,
        mime: file.type || undefined,
        sizeBytes: file.size || undefined,
      })
      if (!res?.ok || !res.video) throw new Error('publish')
      const v = res.video
      onUploaded({
        /* شناسه‌ی نمایشی حالا همان نشانی عمومی است */
        id: v.slug, title: v.title, category: v.category as MediaVideo['category'],
        creator: { id: v.creatorHandle, name: v.creatorName, handle: v.creatorHandle },
        duration: duration || '',
        durationSec: meta.durationSec ?? null, width: meta.width ?? null, height: meta.height ?? null,
        views: 0, likes: 0, comments: 0,
        date: todayFa(), ts: Date.now(),
        thumb: v.thumb, src: v.src,
        description: v.description ? v.description.split('\n').filter(Boolean) : [],
        tags: v.tags ?? [],
      })
      onClose()
      // ریست
      setFile(null); setVideoUrl(''); setDuration(''); setMeta({}); setThumbFile(null); setThumbPrev(''); setTitle(''); setDesc(''); setTags('')
    } catch {
      setErr('آپلود ناموفق بود؛ اتصال را بررسی کنید و دوباره تلاش کنید')
    } finally { setBusy(false); setPhase('') }
  }

  return createPortal(
    <div onClick={() => !busy && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(20,18,14,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(16px,5vh,60px) 16px', paddingTop: 'calc(clamp(16px,5vh,60px) + env(safe-area-inset-top))', paddingBottom: 'calc(clamp(16px,5vh,60px) + env(safe-area-inset-bottom))', overflowY: 'auto', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }} dir="rtl">
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 22, border: `1px solid ${LINE}`, boxShadow: '0 40px 90px rgba(20,18,14,0.32)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ display: 'inline-flex', width: 34, height: 34, borderRadius: 10, background: 'rgba(199,166,106,0.14)', color: GOLD_D, alignItems: 'center', justifyContent: 'center' }}><UploadCloud size={18} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 900, color: INK }}>{creating ? 'ساخت کانال' : 'آپلود ویدیو'}</div>
            <div style={{ fontSize: 11.5, color: MUT }}>
              {creating
                ? (channels.length ? 'کانال تازه‌ای برای انتشار بسازید' : 'برای انتشار ویدیو ابتدا کانال خود را بسازید')
                : <>انتشار در کانال <b style={{ color: SEC }}>{channel?.name}</b></>}
            </div>
          </div>
          <button onClick={() => !busy && onClose()} aria-label="بستن" style={{ background: '#F4F3F1', border: `1px solid ${LINE}`, borderRadius: 10, padding: 8, cursor: 'pointer', color: SEC, display: 'flex' }}><X size={17} /></button>
        </div>

        {/* ── مرحله‌ی کانال (اگر هنوز ندارد) ── */}
        {creating ? (
          <ChannelCreate
            loaded={chLoaded} failed={chFailed} err={err} hasChannels={channels.length > 0} busy={busy}
            name={chName} handle={chHandle} bio={chBio}
            onName={v => { setChName(v); setErr('') }}
            onHandle={v => { setChHandle(v); setErr('') }}
            onBio={setChBio}
            onCreate={() => void createChannel()}
            onRetry={() => void loadChannels()}
            onBack={() => { setMaking(false); setErr('') }}
          />
        ) : (
        <>
        <ChannelPicker
          channels={channels} channel={channel}
          onPick={setChannel}
          onNew={() => { setMaking(true); setErr(''); setChName(publicDisplayName(userRef.current, '')); setChHandle('') }}
        />
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
                <input value={title} onChange={e => setTitle(e.target.value)} maxLength={160} placeholder="مثلا: آموزش کنترل توپ سفید" style={inp} />
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
          <style>{SPIN_CSS}</style>
        </div>
        </>
        )}
      </div>
    </div>,
    document.body,
  )
}

