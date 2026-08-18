'use client'
import { useState, useEffect, useRef } from 'react'
import ProfileHero from '../../../components/profile/ProfileHero'
import ProfileGallery from '../../../components/profile/ProfileGallery'
import GradeTimeline from '../../../components/profile/GradeTimeline'
import '../../../components/profile/profile-page.css'
import { fetchProfileResult } from '../../../lib/profiles/client'
import { useOwnerEdit } from '../../../lib/profiles/use-owner-edit'
import { compressImage } from '../../../lib/seller-store'
/* ⚠️ prompt/confirm بومی در این پروژه ممنوع است (گاردِ ایستا دارد):
   جریان را قفل می‌کنند، استایلِ سایت را نمی‌گیرند و روی وب‌ویوِ
   اپ رفتارشان یکسان نیست. `askText`/`ask` همان کار را با پنجره‌ی
   خودِ سایت می‌کنند. */
import { askText, ask } from '../../../lib/ui/dialogs'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useProfileImageViewer } from '@/components/ProfileImageViewer'
import { normalizeDigits } from '@/lib/text-fa'
import { Phone, Send, Copy, Check } from 'lucide-react'
import { getCoachProfile, badgeFromGrades, disciplineLabel, GRADES, type CoachProfile } from '@/lib/coach-store'

/* ─── انواع ─── */
interface GImg  { id:string; url:string; caption:string; album?:string }
/* `url` نشانیِ فایل است؛ ردیفِ قدیمی فقط بندانگشتی دارد و کارتِ
   بی‌پخش رندر می‌شود. */
interface VItem { id:string; url?:string; thumbnail:string; title:string; duration:string; album?:string }

/* شکلی که این صفحه رندر می‌کند — دقیقاً همان چیزی که پنلِ مربی
   ذخیره می‌کند، نه یک ابرمجموعه. فیلدهای مرده‌ی قبلی (امتیاز،
   افتخارات، استوری) با حذفِ داده‌ی نمایشی رفتند. */
interface CoachView {
  id:string; name:string; city:string; verified:boolean
  photo?:string; coverImage?:string
  bio:string; fullBio:string
  disciplines:string[]
  phone:string; whatsapp:string; instagram?:string; telegram?:string
  gallery:GImg[]; videos:VItem[]
}

function mapLocalToView(p: CoachProfile): CoachView {
  return {
    id: p.slug,
    name: `${p.firstNameFa} ${p.lastNameFa}`.trim(),
    city: p.city,
    verified: p.verified,
    photo: p.photo || undefined,
    coverImage: p.coverImage || undefined,
    bio: p.shortBio,
    fullBio: p.fullBio,
    disciplines: p.disciplines,
    phone: p.phone,
    whatsapp: p.whatsapp,
    instagram: p.instagram || undefined,
    telegram: p.telegram || undefined,
    gallery: p.gallery.map(g => ({ id: g.id, url: g.url, caption: g.caption, album: g.album })),
    videos: p.videos.map(v => ({ id: v.id, url: v.url, thumbnail: v.thumbnail, title: v.title, duration: v.duration, album: v.album })),
  }
}

/* ─── Page ─── */
export default function CoachProfilePage() {
  const { id } = useParams<{id:string}>()
  const [localP, setLocalP]   = useState<CoachProfile | null>(null)
  const [checked, setChecked] = useState(false)
  /* `null` هنوز نمی‌دانیم · `false` سرور جواب داد · `true` شبکه شکست.
     بدونِ این، خطای شبکه با «پیدا نشد» یکی می‌شد و به کاربر می‌گفتیم
     مربی وجود ندارد درحالی‌که فقط اینترنت قطع بود. */
  const [netFail, setNetFail] = useState(false)
  /* مالکِ ردیف — از ستونِ سرور، نه از داده‌ی داخلِ فرم. فقط برای
     نشان‌دادنِ دکمه‌های ویرایش؛ اجازه‌ی واقعی روی سرور سنجیده می‌شود. */
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'manual'>('idle')
  const flashT = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (flashT.current) clearTimeout(flashT.current) }, [])

  /* ── چرا سرور هم خوانده می‌شود ──
     این صفحه فقط `localStorage` را می‌دید، یعنی پروفایل — عکس، معرفی،
     ویدیو — تنها در مرورگرِ خودِ صاحبش دیده می‌شد. حافظه‌ی محلی اول
     می‌آید چون فوری است؛ پاسخِ سرور رویش می‌نشیند. */
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    if (!id) { setChecked(true); return }
    setLocalP(getCoachProfile(id))
    let alive = true
    setNetFail(false)
    void (async () => {
      try {
        const r = await fetchProfileResult<CoachProfile>('coach', id)
        if (!alive) return
        if (r.state === 'found') {
          setLocalP({ ...(r.profile.data as CoachProfile), slug: r.profile.slug, verified: r.profile.verified })
          setOwnerId(r.profile.ownerId)
        }
        else if (r.state === 'error') setNetFail(true)
      } catch {
        /* `fetchProfileResult` خودش خطا را می‌گیرد؛ این فقط تورِ
           ایمنی است تا یک استثنای غیرمنتظره صفحه را در اسکلت
           قفل نکند. */
        if (alive) setNetFail(true)
      } finally {
        if (alive) setChecked(true)
      }
    })()
    return () => { alive = false }
  }, [id, reloadKey])

  const coach = localP ? mapLocalToView(localP) : null
  const { open: openImage, viewer: imageViewer } = useProfileImageViewer()

  /* ── ویرایشِ درجا ──
     ⚠️ این فراخوانی *باید* پیش از هر `return`ِ شرطی باشد. یک‌بار
     پایین‌تر — بعد از گاردِ اسکلت و گاردِ «پیدا نشد» — نوشته شد و
     صفحه با React #310 («تعدادِ هوک‌ها عوض شد») سفید می‌شد؛ برای
     همه، نه فقط مالک.

     صاحبِ پروفایل بدونِ رفتن به داشبورد عکس/ویدیو/آلبوم اضافه و حذف
     می‌کند. `apply` کلِ پروفایل را با یک فیلدِ عوض‌شده ذخیره می‌کند و
     نشانیِ Storage را که سرور برمی‌گرداند می‌نشاند. */
  const edit = useOwnerEdit<CoachProfile>('coach', id, localP, ownerId, setLocalP)

  /* ⚠️ `div` خالی بود. قاعده‌ی پروژه اسکلت می‌خواهد، و روی شبکه‌ی
     کند یک صفحه‌ی تماماً سفید از خرابی قابلِ تشخیص نیست. */
  if (!checked) {
    return (
      /* `role="status"` لازم است: `aria-label` روی یک `div`ِ بی‌نقش
         را بیشترِ خواننده‌های صفحه نادیده می‌گیرند و اسکلت هیچ
         چیزی اعلام نمی‌کرد. عرضِ خطوط هم به CSS رفت — مقدارِ ثابتِ
         اینلاین جای درستش نیست. */
      <div className="ch-page ch-skel" role="status" aria-busy="true" aria-label="در حال بارگذاری پروفایل مربی">
        <div className="ch-skel-hero" />
        <div className="ch-body"><div className="ch-wrap ch-cols">
          <div className="ch-col">
            <div className="ch-skel-line ch-skel-sm" />
            <div className="ch-skel-line" /><div className="ch-skel-line" />
            <div className="ch-skel-line ch-skel-md" />
          </div>
          <div className="ch-col ch-rail"><div className="ch-skel-card" /></div>
        </div></div>
      </div>
    )
  }

  if (!coach) {
    /* خطای شبکه پیامِ خودش را می‌گیرد، با راهِ تلاشِ دوباره. */
    return (
      <div className="lq-stage ch-notfound">
        <div className="lqg ch-notfound-card">
          <h1>{netFail ? 'بارگذاری نشد' : 'این مربی پیدا نشد'}</h1>
          <p>{netFail
            ? 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.'
            : 'ممکن است نشانی اشتباه باشد یا پروفایل هنوز تأیید نشده باشد.'}</p>
          {/* راهِ بازگشت در حالتِ خطا هم می‌ماند — شاید شبکه برنگردد.
              `min-height` صریح چون `btn-sm` حدودِ ۳۶px است. */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {netFail && (
              <button type="button" className="btn btn-glass btn-sm" style={{ minHeight: 44 }}
                onClick={() => { setChecked(false); setReloadKey(k => k + 1) }}>تلاش دوباره</button>
            )}
            {/* «رفتن» نه «بازگشت»: بازدیدکننده ممکن است از صفحه‌ی
                باشگاه آمده باشد، نه از فهرستِ مربیان. */}
            <Link href="/coaches" className="btn btn-glass btn-sm" style={{ minHeight: 44 }}>رفتن به مربیان</Link>
            <Link href="/clubs" className="btn btn-glass btn-sm" style={{ minHeight: 44 }}>بازگشت به باشگاه</Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── داده‌ی مشتق ──
     همه از فیلدهای واقعی می‌آید. هیچ عددِ ساختگی (امتیاز، تعدادِ
     شاگرد، ستاره) ساخته نمی‌شود؛ پروفایلِ یک آدمِ واقعی جای جعلِ
     اعتبار نیست. */
  const badge = localP ? badgeFromGrades(localP.grades) : null
  const grade = badge ? { label: badge.label, dots: badge.dots } : undefined
  const disciplines = coach.disciplines.map(k => ({ label: disciplineLabel(k) }))

  /* ── چرا بر اساسِ رتبه مرتب می‌شود، نه سال ──
     نسخه‌ی اول با `Number(year)` مرتب می‌کرد و دو جور می‌شکست:
     سالِ خالی `0` می‌شد و ته صف می‌رفت، و سالِ فارسی («۱۳۹۸») `NaN`
     می‌داد پس مقایسه صفر می‌شد و ترتیب اصلاً اعمال نمی‌شد. آن‌وقت
     ردیفِ اول — که «بالاترین درجه» نشان می‌گیرد — می‌توانست پایین‌ترین
     درجه باشد، درحالی‌که چیپِ هیرو از `badgeFromGrades` می‌آید و
     بر اساسِ رتبه است. دو عددِ متناقض روی یک صفحه.
     حالا هر دو از یک ترتیب می‌آیند: اندیسِ `GRADES` — همان چیزی که
     `certificationLines` هم استفاده می‌کند. */
  const timeline = localP
    ? [...localP.grades]
        .sort((a, b) => GRADES.findIndex(x => x.key === b.key) - GRADES.findIndex(x => x.key === a.key))
        .map(g => ({ label: g.label, year: g.year }))
    : []

  /* «از سال» = کوچک‌ترین سالِ واقعی، مستقل از ترتیبِ تایم‌لاین.
     ارقامِ فارسی و عربی با هلپرِ مشترکِ `normalizeDigits` نرمال
     می‌شوند — وگرنه `Number('۱۳۹۸')` برابرِ NaN است. */
  const sinceYear = (() => {
    const years = (localP?.grades ?? [])
      .map(g => Number(normalizeDigits(String(g.year))))
      .filter(n => Number.isFinite(n) && n > 0)
    return years.length ? String(Math.min(...years)) : ''
  })()
  const paragraphs = (coach.fullBio || coach.bio || '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean)
  const publicUrl = `www.billiardhub.net/coaches/${coach.id}`

  /* ── چرا فالبک لازم است ──
     `navigator.clipboard` روی http (همان مسیرِ تستِ گوشی در شبکه‌ی
     محلی) و در سافاریِ قدیمی وجود ندارد. نسخه‌ی قبلی در آن حالت
     بی‌صدا `return` می‌کرد: دکمه فشرده می‌شد و هیچ اتفاقی نمی‌افتاد.
     حالا نشانی انتخاب می‌شود تا کاربر با Ctrl/⌘+C خودش بردارد. */
  const selectUrl = () => {
    const el = document.getElementById('ch-url-code')
    if (!el || typeof window.getSelection !== 'function') return
    const r = document.createRange()
    r.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(r)
  }

  /* تایمرِ قبلی هر بار پاک می‌شود: با دو کلیکِ پشتِ‌هم، تایمرِ اول
     پیامِ کلیکِ دوم را زودتر خاموش می‌کرد. */
  const flash = (s: 'ok' | 'manual') => {
    setCopyState(s)
    if (flashT.current) clearTimeout(flashT.current)
    flashT.current = setTimeout(() => setCopyState('idle'), 2200)
  }

  const copyUrl = async () => {
    if (!navigator.clipboard?.writeText) { selectUrl(); flash('manual'); return }
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`)
      flash('ok')
    } catch {
      /* اجازه‌ی کلیپ‌بورد نبود — نشانی را انتخاب می‌کنیم تا دستی بردارد */
      selectUrl(); flash('manual')
    }
  }

  const latin = localP ? `${localP.firstNameEn} ${localP.lastNameEn}`.trim().toUpperCase() : ''

  const addImages = async (files: FileList) => {
    const items = await Promise.all([...files].map(async fl => ({
      id: `m${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      url: await compressImage(fl, 1000, 0.68),
      caption: '',
    })))
    await edit.apply(d => ({ ...d, gallery: [...d.gallery, ...items] }))
  }
  const addVideo = async () => {
    const url = (await askText('افزودن ویدیو', { placeholder: 'نشانی آپارات یا یوتیوب' }))?.trim()
    if (!url) return
    const title = (await askText('عنوان ویدیو', { placeholder: 'مثلاً: تمرین ضربه' }))?.trim() || 'ویدیو'
    await edit.apply(d => ({
      ...d,
      videos: [...d.videos, { id: `v${Date.now()}`, url, thumbnail: '', title, duration: '' }],
    }))
  }
  const newAlbum = async () => {
    const name = (await askText('آلبوم تازه', { placeholder: 'مثلاً: شاگرد علی رضایی' }))?.trim()
    if (!name) return
    /* آلبوم تا وقتی رسانه‌ای نداشته باشد وجود ندارد — پس آخرین عکسِ
       بدونِ آلبوم به آن داده می‌شود و کاربر بقیه را از پنل یا با
       همین فیلد جابه‌جا می‌کند. */
    await edit.apply(d => {
      const i = [...d.gallery].reverse().findIndex(g => !(g.album ?? '').trim())
      if (i < 0) return d
      const at = d.gallery.length - 1 - i
      return { ...d, gallery: d.gallery.map((g, k) => (k === at ? { ...g, album: name } : g)) }
    })
  }
  const deleteImage = async (i: number) => {
    if (!(await ask('این تصویر حذف شود؟', { body: 'این کار برگشت‌پذیر نیست.', confirmLabel: 'حذف' }))) return
    await edit.apply(d => ({ ...d, gallery: d.gallery.filter((_, k) => k !== i) }))
  }

  return (
    <div className="ch-page">
      <ProfileHero
        name={coach.name}
        nameLatin={latin || undefined}
        city={coach.city}
        sinceYear={sinceYear || undefined}
        photo={coach.photo}
        cover={coach.coverImage}
        verified={coach.verified}
        grade={grade}
        disciplines={disciplines}
        onOpenPhoto={u => openImage(u, { title: coach.name, alt: `عکس ${coach.name}` })}
        role="coach" backHref="/coaches" backLabel="مربیان"
        publicUrl={publicUrl}
      />

      <div className="ch-body">
        <div className="ch-wrap ch-cols">

          <main className="ch-col">
            <section aria-labelledby="ch-about-h">
              <div className="ch-sec-head">
                <h2 id="ch-about-h">معرفی</h2>
                <span className="en">ABOUT</span>
                <span className="rule" aria-hidden />
              </div>
              {paragraphs.length === 0
                ? <p className="ch-empty">این مربی هنوز معرفی‌ای ننوشته است.</p>
                : paragraphs.map((t, i) => <p key={i} className="ch-prose">{t}</p>)}
            </section>

            <section aria-labelledby="ch-path-h">
              <div className="ch-sec-head">
                <h2 id="ch-path-h">مسیر مربیگری</h2>
                <span className="en">CAREER</span>
                <span className="rule" aria-hidden />
              </div>
              <GradeTimeline items={timeline} freeCoach={localP?.freeCoach ?? false} />
            </section>

            <ProfileGallery
              images={coach.gallery}
              videos={coach.videos}
              onOpenImage={(urls, index, meta) => openImage(urls, {
                index, ...meta,
                ...(edit.isOwner ? { onDelete: deleteImage } : {}),
              })}
              canEdit={edit.isOwner} busy={edit.saving}
              onAddImages={addImages} onAddVideo={addVideo} onNewAlbum={newAlbum}
            />
            {edit.error && <p className="ch-empty" role="alert">{edit.error}</p>}
          </main>

          <aside className="ch-col ch-rail" aria-label="اطلاعات مربی">
            {(coach.phone || coach.whatsapp || coach.instagram || coach.telegram) && (
              <section className="ch-card" aria-labelledby="ch-contact-h">
                <div className="ch-sec-head">
                  <h2 id="ch-contact-h">راه‌های ارتباطی</h2>
                  <span className="rule" aria-hidden />
                </div>
                <div className="ch-links">
                  {coach.phone && (
                    <a href={`tel:${coach.phone}`} className="ch-link" aria-label="تماس تلفنی">
                      <Phone size={17} aria-hidden />
                    </a>
                  )}
                  {coach.whatsapp && (
                    <a href={`https://wa.me/${coach.whatsapp}`} target="_blank" rel="noopener noreferrer"
                      className="ch-link" aria-label="واتساپ">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.28 4.9L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2z" />
                      </svg>
                    </a>
                  )}
                  {coach.instagram && (
                    <a href={`https://instagram.com/${coach.instagram}`} target="_blank" rel="noopener noreferrer"
                      className="ch-link" aria-label="اینستاگرام">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
                    </a>
                  )}
                  {coach.telegram && (
                    <a href={`https://t.me/${coach.telegram}`} target="_blank" rel="noopener noreferrer"
                      className="ch-link" aria-label="تلگرام">
                      <Send size={17} aria-hidden />
                    </a>
                  )}
                </div>
              </section>
            )}

            <section className="ch-card" aria-labelledby="ch-url-h">
              <div className="ch-sec-head">
                <h2 id="ch-url-h">آدرس اختصاصی</h2>
                <span className="en">MY LINK</span>
                <span className="rule" aria-hidden />
              </div>
              <div className="ch-url">
                <code id="ch-url-code" dir="ltr">{publicUrl}</code>
                <button type="button" onClick={copyUrl} className="ch-url-copy"
                  aria-label={copyState === 'ok' ? 'نشانی کپی شد' : 'کپی نشانی عمومی'}>
                  {copyState === 'ok' ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
                  {copyState === 'ok' ? 'کپی شد' : copyState === 'manual' ? 'دستی کپی کنید' : 'کپی'}
                </button>
              </div>
              {/* پیامِ زنده تا خواننده‌ی صفحه هم نتیجه را بشنود */}
              <p aria-live="polite" className="ch-sr-live">
                {copyState === 'ok' ? 'نشانی در کلیپ‌بورد کپی شد.'
                  : copyState === 'manual' ? 'مرورگر اجازه‌ی کپی نداد؛ نشانی انتخاب شد — با Ctrl+C بردارید.' : ''}
              </p>
            </section>
          </aside>

        </div>
      </div>

      {imageViewer}
    </div>
  )
}
