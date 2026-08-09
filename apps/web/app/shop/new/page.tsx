'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../../store/auth.store'
import { findSellerByOwner } from '../../../lib/seller-store'
import { fetchMyProfile } from '../../../lib/profiles/client'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'
import { apiFetch } from '../../../lib/http'
import { uploadFile } from '../../../lib/supabase'
import { CATEGORY_OPTIONS, CONDITIONS, conditionLabel } from '../../../lib/market/categories'
/* تعریفِ مشخصاتِ فنی از این‌جا رفت به `lib/market/specs.ts` تا صفحه‌ی
   جزئیاتِ محصول هم بتواند برچسبِ فارسیِ هر کلید را بخواند. */
import { GENERIC_SPECS, CATEGORY_SPECS, HIDDEN_SPEC_KEYS } from '../../../lib/market/specs'
import { productTitleParts } from '../../../lib/market/title'
import { TYPE_OPTIONS, brandOptionsFor, modelOptionsFor, isTypeDrivenCategory, withOther } from '../../../lib/market/chain'
import {
  GOLD, GOLD_D, TEXT, TEXT_SEC, TEXT_MUT, LQ_BG, LQ_BOR, LQ_SHAD, ERR,
  AD_FORM_CSS, inp, toAsciiDigits, fmtPrice, FancySelect, Label, ErrMsg, SectionTitle, SpecField,
  AlertDialog, type AlertAction,
} from '../../../components/market/AdFormFields'


/* دسته‌ها از منبعِ واحد (lib/market/categories).

   پیش‌تر این فهرست دستی بود و با فهرستِ صفحه‌ی بازار یکی نبود: این‌جا
   فقط «کیس و کیف» (`case-bag`) بود و آن‌جا «کیس چوب» و «کیف توپ» —
   یعنی فروشنده هرگز نمی‌توانست «کیف توپ» را انتخاب کند و آن فیلتر در
   بازار همیشه خالی بود. */
const CATEGORIES = CATEGORY_OPTIONS

// شهر/استان از ProvinceCitySelect می‌آید — لیست هاردکد حذف شد (single source of truth)




// ── Image slot ────────────────────────────────────────────────
/* `data` فقط برای پیش‌نمایشِ محلی است؛ چیزی که ثبت می‌شود `file` است
   که پیش از ارسال به Storage می‌رود. پیش‌تر همان `data` — رشته‌ی
   base64 — در دیتابیس ذخیره می‌شد. */
interface ImgSlot { data: string; name: string; file: File }

// ── Main Page ─────────────────────────────────────────────────
export default function NewProductPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    category: '', type: '', typeOther: '', model: '', modelOther: '', price: '', oldPrice: '', negotiable: false,
    description: '', brand: '', brandOther: '', condition: 'new',
    shopName: '', ownerName: '', sellerPhone: '', sellerWhatsapp: '',
    province: '', city: '', address: '',
  })
  const [storeSlug, setStoreSlug] = useState('')
  const [geoLocked, setGeoLocked] = useState(false)       // استان/شهر/آدرس از فروشگاه ⇒ قفل
  const [images,   setImages]   = useState<ImgSlot[]>([])
  const [dragging, setDragging] = useState(false)
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [success,  setSuccess]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [acceptRules, setAcceptRules] = useState(false)
  const [quotaMsg, setQuotaMsg] = useState('')   // سهمیه‌ی آگهی تمام شده   // پذیرش قوانین بیلیارد بازار
  const [quotaNeedsIdentity, setQuotaNeedsIdentity] = useState(false)   // ۴۲۹ به‌خاطر نبود هویت تأییدشده
  const [specs,     setSpecs]     = useState<Record<string, string>>({})
  const [specOthers, setSpecOthers] = useState<Record<string, string>>({})
  /* هر پیامِ خطا از این‌جا می‌گذرد و وسطِ صفحه نمایش داده می‌شود */
  const [alert, setAlert] = useState<{ title: string; lines: string[]; tone?: 'error' | 'warn'; action?: AlertAction } | null>(null)
  const showAlert = (title: string, lines: string[], tone: 'error' | 'warn' = 'error', action?: AlertAction) =>
    setAlert({ title, lines, tone, action })

  const { user } = useAuthStore()
  const [shopNameLocked,  setShopNameLocked]  = useState(false)
  const [ownerNameLocked, setOwnerNameLocked] = useState(false)

  useEffect(() => {
    if (!user) return
    const u = user as any
    const authName = [u.firstName || '', u.lastName || ''].filter(Boolean).join(' ') || u.name || ''
    /* ── فروشگاه از سرور، نه از localStorage ──
       `findSellerByOwner()` حافظه‌ی همین مرورگر را می‌خواند، ولی
       فروشگاه‌ها مدت‌هاست در جدولِ `profiles` هستند. پس این تابع
       چیزی پیدا نمی‌کرد و کلِ این بلوک بی‌اثر بود: نه نامِ فروشگاه
       پیش‌پر می‌شد، نه شهر و آدرس، و نه نامکِ فروشگاه به آگهی
       می‌چسبید.

       نسخه‌ی محلی به‌عنوان فالبکِ آفلاین می‌ماند تا فرم روی شبکه‌ی
       قطع هم پیش‌پر شود. */
    void (async () => {
      const mine = await fetchMyProfile<Record<string, any>>('seller').catch(() => null)
      const p = mine?.data
      if (!p) return
      setStoreSlug(mine.slug || '')
      if (p.title) { setForm(f => ({ ...f, shopName: String(p.title) })); setShopNameLocked(true) }
      if (p.ownerName) { setForm(f => ({ ...f, ownerName: String(p.ownerName) })); setOwnerNameLocked(true) }
      setGeoLocked(!!(p.province || p.city || p.address))
      setForm(f => ({
        ...f,
        province:       p.province || f.province,
        city:           p.city || f.city,
        address:        p.address || f.address,
        sellerPhone:    p.contactPhone || f.sellerPhone,
        sellerWhatsapp: p.whatsapp || f.sellerWhatsapp,
      }))
    })()

    const store = findSellerByOwner({ id: u.id, phone: u.phone })

    // نام فروشگاه: از پروفایل فروشگاه، وگرنه از حساب. قفل — روی محصول قابل تغییر نیست.
    const autoName = store?.title || u.shopName || authName
    if (autoName) { setForm(f => ({ ...f, shopName: autoName })); setShopNameLocked(true) }

    // نام مالک: همان نام احرازشده. قفل.
    const autoOwner = store?.ownerName || authName || u.ownerName || ''
    if (autoOwner) { setForm(f => ({ ...f, ownerName: autoOwner })); setOwnerNameLocked(true) }

    // استان/شهر/آدرس/تماس: از همان فروشگاه پیش‌پر و قفل می‌شوند
    if (store) {
      setStoreSlug(store.slug || '')
      setGeoLocked(!!(store.province || store.city || store.address))
      setForm(f => ({
        ...f,
        province:       store.province || f.province,
        city:           store.city || f.city,
        address:        store.address || f.address,
        sellerPhone:    store.contactPhone || f.sellerPhone,
        sellerWhatsapp: store.whatsapp || f.sellerWhatsapp,
      }))
    }
  }, [user])

  /* `boolean` هم پذیرفته می‌شود چون تیکِ «قیمت توافقی» اضافه شد؛
     همه‌ی فیلدهای دیگر همچنان رشته‌اند. */
  const set = (k: keyof typeof form, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  /* برند/مدل — اگر لیست داشت دراپ‌داون، وگرنه متن دستی.
     چوب: برند بر اساس نوع (اسنوکر/پاکت). بقیه‌ی دسته‌ها: برند ثابت همان دسته. مدل همیشه بر اساس برند. */
  const brandOptions = brandOptionsFor(form.category, form.type)
  const modelOptions = modelOptionsFor(form.category, form.type, form.brand)
  /* مقدار مؤثر: اگر «سایر» انتخاب شده، متن دستی جای آن می‌نشیند */
  const effBrand = form.brand === 'سایر' ? form.brandOther.trim() : form.brand.trim()
  const effModel = form.model === 'سایر' ? form.modelOther.trim() : form.model.trim()
  /* «سایر» یعنی متنی که خودِ فروشنده نوشته، نه واژه‌ی «سایر» */
  const effType = form.type === 'سایر' ? form.typeOther.trim() : form.type.trim()
  /* هر چهار فیلدِ کارتِ «اطلاعات فروشنده» از فروشگاه قفل شده‌اند؟
     پس کارتی که هیچ‌کدامش قابلِ تغییر نیست نمایش داده نمی‌شود. */
  const sellerLocked = shopNameLocked && geoLocked

  const handleCategoryChange = (cat: string) => {
    setForm(f => ({ ...f, category: cat, type: '', brand: '', brandOther: '', model: '', modelOther: '' }))
    setErrors(e => { const n = { ...e }; delete n.category; delete n.type; delete n.brand; delete n.model; return n })
    setSpecs({})
    setSpecOthers({})
  }
  /* تغییر نوع ⇒ در دسته‌های نوع‌محور (چوب/میز/تیپ/گچ) برند/مدل ریست می‌شوند */
  const typeDrivenCat = isTypeDrivenCategory
  const setType = (v: string) => {
    /* عوض‌شدنِ نوع ⇒ توضیحِ «سایر» هم پاک می‌شود، وگرنه متنِ
       نوعِ قبلی روی نوعِ تازه می‌ماند */
    setForm(f => ({ ...f, type: v, typeOther: '', ...(typeDrivenCat(f.category) ? { brand: '', brandOther: '', model: '', modelOther: '' } : {}) }))
    setErrors(e => { const n = { ...e }; delete n.type; if (typeDrivenCat(form.category)) { delete n.brand; delete n.model } return n })
  }
  /* تغییر برند ⇒ ریست مدل */
  const setBrand = (v: string) => {
    setForm(f => ({ ...f, brand: v, model: '', modelOther: '' }))
    setErrors(e => { const n = { ...e }; delete n.brand; delete n.model; return n })
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const remaining = 5 - images.length
    if (remaining <= 0) return
    Array.from(files).slice(0, remaining).forEach(file => {
      if (!file.type.startsWith('image/')) {
        setErrors(e => ({ ...e, images: 'فقط فایل تصویر قابل قبول است' }))
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(e => ({ ...e, images: 'حداکثر حجم هر تصویر ۵ مگابایت' }))
        return
      }
      const reader = new FileReader()
      reader.onload = ev => {
        setImages(prev => prev.length < 5
          ? [...prev, { data: ev.target?.result as string, name: file.name, file }]
          : prev
        )
        setErrors(e => { const n = { ...e }; delete n.images; return n })
      }
      reader.readAsDataURL(file)
    })
  }, [images.length])

  const removeImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.category)           e.category    = 'دسته‌بندی را انتخاب کنید'
    if (!effType)                 e.type        = form.type === 'سایر'
      ? 'برای «سایر» توضیح بنویسید' : 'نوع را مشخص کنید'
    if (!effBrand)                e.brand       = 'برند الزامی است'
    /* مدل اختیاری است: خیلی از فروشنده‌ها مدلِ دقیقِ جنسِ دستِ دوم
       را نمی‌دانند و اجبارِ آن یعنی یا آگهی ثبت نمی‌شود یا چیزی
       الکی نوشته می‌شود — که بدتر است. */
    /* آگهیِ توافقی قیمت نمی‌خواهد — همان قاعده‌ای که سرور هم دارد */
    if (!form.negotiable && !form.price) e.price = 'قیمت را وارد کنید یا «توافقی» را بزنید'

    /* ── قیمتِ قبل از تخفیف ──
       اگر کمتر از قیمتِ اصلی باشد یعنی «تخفیفِ منفی»، و کد پایین‌تر
       بی‌صدا درصد را صفر می‌کرد. فروشنده فکر می‌کرد تخفیف گذاشته و
       آگهی هیچ تخفیفی نشان نمی‌داد. */
    if (!form.negotiable && form.price && form.oldPrice) {
      const p = Number(toAsciiDigits(form.price).replace(/D/g, ''))
      const o = Number(toAsciiDigits(form.oldPrice).replace(/D/g, ''))
      if (o > 0 && o <= p) e.oldPrice = 'قیمت قبل از تخفیف باید بیشتر از قیمت فعلی باشد'
    }
    if (!form.shopName.trim())    e.shopName    = 'نام فروشگاه | فروشنده الزامی است'
    if (!form.sellerPhone.trim()) e.sellerPhone = 'شماره تماس الزامی است'
    else if (!/^(\+98|0)9\d{9}$/.test(form.sellerPhone.trim()))
      e.sellerPhone = 'شماره موبایل معتبر وارد کنید (09xxxxxxxxx)'
    if (!form.province)           e.province    = 'استان را انتخاب کنید'
    if (!form.city)               e.city        = 'شهر را انتخاب کنید'
    if (!acceptRules)             e.acceptRules = 'برای ثبت آگهی، قوانین بیلیارد بازار را بپذیرید'
    return e
  }

  /* ثبت: اول اعتبارسنجی، بعد مودال انتخاب سکشن؛ کاربر سکشن را می‌زند و finalize ذخیره می‌کند */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      /* روی موبایل کاربر پایینِ فرم است و فیلدِ ناقص را نمی‌بیند؛
         فهرستِ کامل همان‌جا جلوی چشمش می‌آید. */
      showAlert('فرم کامل نیست', Object.values(errs))
      return
    }
    /* ── چرا پنجره‌ی «محصول کجا نمایش داده شود» برداشته شد ──
       آن پنجره جایگاهِ نمایش را از فروشنده می‌پرسید، در حالی که
       ثبتِ آگهی رایگان است و هیچ جایگاهی فروخته نمی‌شود. یعنی یک
       تصمیمِ بی‌اثر که فقط یک قدم به مسیرِ ثبت اضافه می‌کرد.

       جایگاه حالا از راهِ درستش خریده می‌شود: «فوری» (مهاجرت ۰۷۹). */
    finalize('newest')
  }

  const finalize = (section: 'weekly' | 'party' | 'newest') => {
    setSubmitting(true)

    const rawPrice = Number(toAsciiDigits(form.price).replace(/\D/g, ''))
    const rawOld   = form.oldPrice ? Number(toAsciiDigits(form.oldPrice).replace(/\D/g, '')) : rawPrice
    const disc     = rawOld > rawPrice ? Math.round((1 - rawPrice / rawOld) * 100) : 0

    const finalSpecs: Record<string, string> = { نوع: effType, مدل: effModel }
    Object.entries(specs).forEach(([k, v]) => {
      if (v === 'سایر' && specOthers[k]) finalSpecs[k] = `سایر: ${specOthers[k]}`
      else if (v) finalSpecs[k] = v
    })

    /* ── نامِ آگهی: دسته‌بندی و بعد نوع ──
       پیش‌تر برند و مدل بود، یعنی کارتِ آگهی «Aramith Tournament
       Champion» نشان می‌داد و خریدار نمی‌فهمید اصلاً توپ است یا
       چوب. دسته و نوع همان چیزی است که چشم دنبالش می‌گردد؛ برند و
       مدل داخلِ مشخصات هستند. */
    const composedName = [catLabel, effType].filter(Boolean).join(' ')
      || [effBrand, effModel].filter(Boolean).join(' ') || 'محصول'

    /* آگهی روی سرور ثبت می‌شود تا بقیه هم ببینندش. پیش‌تر فقط در
       localStorage می‌ماند و عملاً هیچ‌کس جز خود آگهی‌دهنده نمی‌دیدش. */
    void (async () => {
      try {
        /* ── عکس‌ها اول به Storage ──
           پیش‌تر رشته‌ی base64 داخلِ همین بدنه‌ی JSON می‌رفت و همان‌جا
           در ستونِ `images` می‌نشست: پنج عکسِ دومگابایتی ⇒ بدنه‌ی
           ۱۴ مگابایتی، و بعد همان متن در هر بارگذاریِ بازار
           برمی‌گشت. حالا فایل بالا می‌رود و فقط نشانی‌اش ثبت می‌شود.

           آپلود از `/api/upload` می‌گذرد که نوعِ واقعیِ فایل را از
           بایت‌ها می‌سنجد و مسیر را محدود می‌کند. */
        const stamp = Date.now()
        const uploaded: string[] = []
        for (let i = 0; i < images.length; i++) {
          const slot = images[i]!
          const url = await uploadFile('club-media', slot.file, `products/${stamp}-${i}`)
          /* یک عکسِ بالا نرفته، آگهی را بی‌صدا بی‌عکس نمی‌کند:
             فروشنده باید بداند و دوباره تلاش کند. */
          if (!url) {
            showAlert('بارگذاری تصویر انجام نشد', [`تصویر ${i + 1} بالا نرفت؛ دوباره تلاش کنید.`])
            setSubmitting(false)
            return
          }
          uploaded.push(url)
        }
        const imgList = uploaded

        const r = await apiFetch('/api/market/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: composedName, category: form.category, type: effType,
            brand: effBrand, model: effModel,
            price: form.negotiable ? 0 : rawPrice, old: form.negotiable ? 0 : rawOld,
            negotiable: form.negotiable,
            description: form.description.trim(), condition: form.condition,
            specs: finalSpecs, images: imgList, section,
            province: form.province, city: form.city, address: form.address.trim(),
            sellerName: form.shopName.trim(), sellerPhone: form.sellerPhone.trim(),
            sellerWhatsapp: (form.sellerWhatsapp.trim() || form.sellerPhone.trim()).replace(/^0/, '98'),
            storeSlug: storeSlug || undefined,
          }),
        })
        const j = await r.json().catch(() => ({}))

        if (r.status === 429) {
          /* دو حالت متفاوت: سهمیه تمام شده، یا هویت هنوز تأیید نشده */
          const needsId = !!j?.identityRequired
          setQuotaNeedsIdentity(needsId)
          setQuotaMsg(j?.message || 'سهمیه‌ی آگهی شما تمام شده است')
          showAlert(
            needsId ? 'هویت شما هنوز تأیید نشده است' : 'سهمیه‌ی آگهی شما تمام شده است',
            [j?.message || 'سهمیه‌ی آگهی شما تمام شده است'],
            'warn',
            needsId ? { href: '/profile/verify', label: 'تأیید هویت' } : { href: '/plans', label: 'بسته‌های آگهی' },
          )
          setSubmitting(false); return
        }
        if (!r.ok) { showAlert('ثبت آگهی انجام نشد', [j?.message || 'ثبت آگهی روی سرور انجام نشد']); setSubmitting(false); return }

        /* ── چرا دیگر خودکار به بازار نمی‌رود ──
           آگهی‌دهنده پرت می‌شد وسطِ فهرستِ بازار و هیچ‌وقت نمی‌فهمید
           آگهیِ خودش کجا مدیریت می‌شود — برای حذف یا ارتقا باید
           صفحه‌ای را حدس می‌زد که هیچ لینکی به آن نداشت. حالا همان
           لحظه دو راه پیشِ رویش است. */
        setSuccess(true)
      } catch {
        showAlert('خطا در ارتباط با سرور', ['ارتباط برقرار نشد؛ دوباره تلاش کنید.'])
        setSubmitting(false)
      }
    })()
  }

  // ── Success screen ─────────────────────────────────────────
  if (success) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#F7F7F5 0%,#F0EDE7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ textAlign: 'center', animation: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#A07840)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: `0 12px 36px rgba(199,166,106,0.45)` }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: TEXT, marginBottom: 10 }}>آگهی شما ثبت شد!</h2>
        <p style={{ fontSize: 14.5, color: TEXT_SEC, marginBottom: 22, lineHeight: 1.9 }}>
          ویرایش، حذف و ارتقای آگهی از «آگهی‌های من» انجام می‌شود.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard/shop" style={{
            padding: '11px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700,
            textDecoration: 'none', color: '#9A6E38',
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
          }}>آگهی‌های من</Link>
          <Link href="/shop" style={{
            padding: '11px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700,
            textDecoration: 'none', color: TEXT_SEC,
            background: 'rgba(28,28,26,0.04)', border: '1px solid rgba(28,28,26,0.10)',
          }}>دیدن در بازار</Link>
        </div>
      </div>
      <style>{`
        @keyframes popIn { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  )

  const catLabel = CATEGORIES.find(c => c.id === form.category)?.label ?? ''
  /* پیش‌نمایش دقیقاً همان دو تکه‌ای را نشان می‌دهد که کارتِ بازار
     نشان خواهد داد: «چوب اسنوکر» درشت و «O'min classic» ریزتر.
     اگر دسته و نوع هنوز انتخاب نشده‌اند، برند و مدل خودشان تکه‌ی
     درشت می‌شوند تا پیش‌نمایش خالی نماند. */
  const previewName = [catLabel, effType].filter(Boolean).join(' ')
    || [effBrand, effModel].filter(Boolean).join(' ')
  const previewParts = productTitleParts({
    name: previewName || 'محصول', brand: effBrand, model: effModel,
  })

  return (
    <>
      <style>{AD_FORM_CSS}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT, overflowX: 'hidden' }}>

        {/* ambient blobs — داخل لایه‌ی fixed با overflow:hidden تا آفست منفی‌شان سرریز افقی نسازد */}
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(199,166,106,0.08) 0%,transparent 65%)', filter: 'blur(70px)' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -60, width: 400, height: 400, background: 'radial-gradient(circle,rgba(199,166,106,0.05) 0%,transparent 65%)', filter: 'blur(60px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px) 80px' }}>

          {/* ── Top nav ──
              فلش به راست است، نه چپ: در RTL «برگشت» یعنی حرکت به راست. */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -6, marginBottom: 16 }}>
            {/* ── چرا router.back و نه یک نشانیِ ثابت ──
                این دکمه همیشه به `/shop` می‌رفت، حتی وقتی کاربر از
                «آگهی‌های من» آمده بود — یعنی «بازگشت» او را جایی
                می‌برد که نبوده. حالا به همان صفحه‌ی قبلی برمی‌گردد؛
                و اگر تاریخچه‌ای نباشد (نشانی مستقیم باز شده)، به
                «آگهی‌های من» می‌رود. */}
            <button type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) router.back()
                else router.push('/dashboard/shop')
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.2, color: TEXT_SEC, cursor: 'pointer', fontFamily: 'Vazirmatn,Tahoma,sans-serif', padding: '7px 12.5px', borderRadius: 10, background: LQ_BG, border: LQ_BOR, boxShadow: LQ_SHAD, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.color = TEXT_SEC)}>
              <ChevronRight size={13.5} />
              بازگشت به فروشگاه من
            </button>
          </div>

          {/* ── Steps indicator ──
              سرتیترِ صفحه («NEW PRODUCT»، «ثبت محصول جدید» و توضیحش)
              برداشته شد: روی موبایل یک صفحه‌ی کامل جا می‌گرفت و کاربر
              باید اسکرول می‌کرد تا به اولین فیلد برسد.

              nowrap تا هر سه در یک سطر بمانند؛ اندازه‌ها کوچک‌اند و
              متن کوتاه نمی‌شود، پس روی باریک‌ترین صفحه هم جا می‌شود. */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'nowrap', animation: 'fadeUp 0.45s ease both' }}>
            {[{ n: '۱', t: 'اطلاعات محصول' }, { n: '۲', t: 'اطلاعات فروشنده' }, { n: '۳', t: 'ثبت نهایی' }].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 16, minWidth: 0, background: i < 2 ? `rgba(199,166,106,0.10)` : 'rgba(28,28,26,0.05)', border: `1px solid ${i < 2 ? 'rgba(199,166,106,0.28)' : 'rgba(28,28,26,0.08)'}` }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: i < 2 ? `linear-gradient(135deg,${GOLD},#A07840)` : 'rgba(28,28,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800, color: i < 2 ? '#fff' : TEXT_MUT, flexShrink: 0 }}>{s.n}</span>
                <span style={{ fontSize: 10.8, fontWeight: 700, color: i < 2 ? GOLD : TEXT_MUT, whiteSpace: 'nowrap' }}>{s.t}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

              {/* ═══════════════════════════════════════════════════
                  RIGHT COLUMN — product info
              ═══════════════════════════════════════════════════ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* card: basic info */}
                <div style={{ background: LQ_BG, backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '24px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.46s ease both' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
                  <SectionTitle>اطلاعات محصول</SectionTitle>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>

                    {/* دسته‌بندی */}
                    <div>
                      <Label required>دسته‌بندی</Label>
                      <FancySelect value={form.category} onChange={handleCategoryChange}
                        options={CATEGORIES.map(c => ({ value: c.id, label: c.label }))}
                        placeholder="انتخاب دسته‌بندی..." error={!!errors.category} />
                      <ErrMsg msg={errors.category} />
                    </div>

                    {/* نوع — دراپ‌داون اگر دسته لیست نوع دارد، وگرنه متن */}
                    <div>
                      <Label required>نوع</Label>
                      {form.category && TYPE_OPTIONS[form.category] ? (
                        <FancySelect value={form.type} onChange={setType}
                          options={TYPE_OPTIONS[form.category]!.map(o => ({ value: o, label: o }))}
                          placeholder="انتخاب نوع..." error={!!errors.type} />
                      ) : (
                        <input className="nf" type="text" placeholder="مثال: اسنوکر" value={form.type} onChange={e => set('type', e.target.value)} style={inp(errors.type)} />
                      )}
                      {/* ── «سایر» ──
                          فهرستِ بسته هرچقدر هم کامل باشد، همیشه چیزی
                          بیرونش می‌ماند. بدونِ این فیلد، فروشنده یا
                          نزدیک‌ترین گزینه‌ی غلط را می‌زند یا آگهی را
                          رها می‌کند. */}
                      {form.type === 'سایر' && (
                        <input className="nf" type="text" value={form.typeOther}
                          onChange={e => set('typeOther', e.target.value)}
                          placeholder="توضیح دهید — مثال: توپِ تمرینیِ نشانه‌دار"
                          style={{ ...inp(errors.type), marginTop: 8, background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
                      )}
                      <ErrMsg msg={errors.type} />
                    </div>

                    {/* برند — چوب: دراپ‌داون برند بر اساس نوع؛ «سایر» ⇒ فیلد متن. بقیه: متن آزاد */}
                    <div>
                      <Label required>برند</Label>
                      {brandOptions ? (
                        <>
                          <FancySelect value={form.brand} onChange={setBrand}
                            options={withOther(brandOptions).map(o => ({ value: o, label: o }))}
                            placeholder="انتخاب برند..." error={!!errors.brand} />
                          {form.brand === 'سایر' && (
                            <input className="nf" type="text" placeholder="نام برند را وارد کنید..." value={form.brandOther}
                              onChange={e => set('brandOther', e.target.value)}
                              style={{ ...inp(errors.brand), marginTop: 8, background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
                          )}
                        </>
                      ) : (
                        <input className="nf" type="text" placeholder="نام برند" value={form.brand} onChange={e => set('brand', e.target.value)} style={inp(errors.brand)} />
                      )}
                      <ErrMsg msg={errors.brand} />
                    </div>

                    {/* مدل — چوب: دراپ‌داون مدل بر اساس برند؛ «سایر» ⇒ فیلد متن. بقیه: متن آزاد */}
                    <div>
                      <Label required>مدل</Label>
                      {modelOptions ? (
                        <>
                          <FancySelect value={form.model} onChange={v => set('model', v)}
                            options={withOther(modelOptions).map(o => ({ value: o, label: o }))}
                            placeholder="انتخاب مدل... (اختیاری)" error={!!errors.model} />
                          {form.model === 'سایر' && (
                            <input className="nf" type="text" placeholder="مدل را وارد کنید..." value={form.modelOther}
                              onChange={e => set('modelOther', e.target.value)}
                              style={{ ...inp(errors.model), marginTop: 8, background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
                          )}
                        </>
                      ) : (
                        <input className="nf" type="text" placeholder="مثال: 314³" value={form.model} onChange={e => set('model', e.target.value)} style={inp(errors.model)} />
                      )}
                      <ErrMsg msg={errors.model} />
                    </div>

                  </div>
                </div>

                {/* card: specs + condition + description — always visible */}
                {(() => {
                  const currentSpecs = form.category ? (CATEGORY_SPECS[form.category] ?? GENERIC_SPECS) : []
                  const hidden = HIDDEN_SPEC_KEYS[form.category] ?? ['brand']   // نوع/برند/مدل بالای فرم آمده‌اند
                  const specFields = currentSpecs.filter(f => f.key !== 'condition' && !hidden.includes(f.key))
                  return (
                    <div key={form.category || 'no-cat'} style={{ background: LQ_BG, backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '24px', position: 'relative', overflow: 'hidden', animation: 'fadeIn 0.35s ease both' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
                      <div style={{ position: 'relative', zIndex: 1 }}>

                        {/* header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${GOLD},#A07840)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px rgba(199,166,106,0.32)`, flexShrink: 0 }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round">
                              <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                            </svg>
                          </div>
                          <div>
                            <p style={{ fontSize: 10.5, color: GOLD, letterSpacing: '0.18em', fontWeight: 700, margin: '0 0 1px' }}>SPECIFICATIONS</p>
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: 0 }}>
                              {form.category ? `مشخصات فنی — ${catLabel}` : 'مشخصات و وضعیت محصول'}
                            </h3>
                          </div>
                        </div>

                        {/* category-specific specs OR placeholder */}
                        {form.category ? (
                          <div className="spec-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                            {specFields.map(field => {
                              const isParent = specFields.some(f => f.dependsOn === field.key)
                              return (
                                <SpecField
                                  key={`${form.category}-${field.key}`}
                                  field={field}
                                  value={specs[field.key] ?? ''}
                                  otherValue={specOthers[field.key] ?? ''}
                                  dependencyValue={field.dependsOn ? specs[field.dependsOn] ?? '' : undefined}
                                  onChange={v => setSpecs(s => {
                                    const next = { ...s, [field.key]: v }
                                    if (isParent) {
                                      specFields
                                        .filter(f => f.dependsOn === field.key)
                                        .forEach(f => { next[f.key] = '' })
                                    }
                                    return next
                                  })}
                                  onOtherChange={v => setSpecOthers(s => ({ ...s, [field.key]: v }))}
                                />
                              )
                            })}
                          </div>
                        ) : (
                          <div style={{ padding: '11px 14px', background: 'rgba(199,166,106,0.07)', border: '1px solid rgba(199,166,106,0.20)', borderRadius: 10, marginBottom: 18 }}>
                            <p style={{ fontSize: 13, color: TEXT_MUT, margin: 0 }}>⬆ ابتدا دسته‌بندی را انتخاب کنید تا مشخصات فنی نمایش یابد</p>
                          </div>
                        )}

                        {/* divider */}
                        <div style={{ height: 1, background: 'rgba(28,28,26,0.08)', margin: '4px 0 18px' }} />

                        {/* condition — دراپ‌داون حرفه‌ای */}
                        <div style={{ marginBottom: 16 }}>
                          <Label required>وضعیت کالا</Label>
                          {/* ── چرا از CONDITIONS خوانده می‌شود ──
                              این‌جا دستی «like-new» نوشته شده بود، ولی کلیدِ
                              معتبر «like_new» است. سرور کلیدِ ناشناخته را به
                              «نو» برمی‌گرداند، پس هر آگهیِ «در حد نو» بی‌صدا
                              «نو» ذخیره می‌شد. */}
                          <FancySelect value={form.condition} onChange={v => set('condition', v)}
                            options={CONDITIONS.map(c => ({ value: c.id, label: c.label }))} />
                        </div>

                        {/* description */}
                        <div>
                          <Label optional>توضیحات محصول</Label>
                          <textarea className="nf" rows={4} placeholder="ویژگی‌ها، مشخصات فنی، شرایط استفاده و سایر توضیحات..." value={form.description} onChange={e => set('description', e.target.value)} style={{ ...inp(), resize: 'vertical', minHeight: 100, lineHeight: 1.7 }} />
                        </div>

                      </div>
                    </div>
                  )
                })()}

                {/* card: images */}
                <div style={{ background: LQ_BG, backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '24px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.5s ease both' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <SectionTitle>تصاویر محصول</SectionTitle>
                      <span style={{ fontSize: 12, fontWeight: 700, color: images.length >= 5 ? GOLD : TEXT_MUT, padding: '4px 10px', background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.2)', borderRadius: 20 }}>
                        {images.length}/۵ تصویر
                      </span>
                    </div>

                    <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

                    {/* image grid */}
                    {images.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 8, marginBottom: 10 }}>
                        {images.map((img, i) => (
                          <div key={i} className="img-thumb" style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', border: i === 0 ? `2px solid ${GOLD}` : '1.5px solid rgba(28,28,26,0.1)' }}>
                            <img loading="lazy" decoding="async" src={img.data} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            {i === 0 && (
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: `linear-gradient(to top,rgba(199,166,106,0.85),transparent)`, padding: '10px 4px 4px', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>اصلی</div>
                            )}
                            <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 4, left: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* drop zone */}
                    {images.length < 5 && (
                      <div className="drop-area" onClick={() => fileRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }} style={{ border: `2px dashed ${dragging ? GOLD : 'rgba(28,28,26,0.16)'}`, borderRadius: 12, padding: images.length > 0 ? '16px' : '28px 16px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(199,166,106,0.04)' : 'transparent', transform: dragging ? 'scale(1.01)' : 'none' }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px', display: 'block', color: GOLD }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                        <p style={{ fontSize: 13, color: TEXT_SEC, margin: '0 0 3px', fontWeight: 600 }}>کلیک کنید یا بکشید و رها کنید</p>
                        <p style={{ fontSize: 12, color: TEXT_MUT, margin: 0 }}>PNG، JPG، WEBP — حداکثر ۵ مگابایت | تا {5 - images.length} تصویر دیگر</p>
                      </div>
                    )}
                    <ErrMsg msg={errors.images} />

                    {images.length === 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, fontSize: 12, color: TEXT_MUT }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        اگر تصویر ندهید، از تصویر پیش‌فرض استفاده می‌شود
                      </div>
                    )}
                  </div>
                </div>

                {/* card: pricing — after images */}
                <div style={{ background: LQ_BG, backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '24px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.52s ease both' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <SectionTitle>قیمت‌گذاری</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* ── قیمتِ توافقی ──
                          بدونِ این گزینه، فروشنده‌ای که نمی‌خواست قیمت بنویسد
                          مجبور بود صفر بگذارد و کارتِ بازار «۰ تومان» نشان
                          می‌داد. با روشن‌شدنش فیلدهای قیمت غیرفعال می‌شوند تا
                          عددی که قرار نیست دیده شود اصلاً وارد نشود. */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.negotiable}
                          onChange={e => set('negotiable', e.target.checked)}
                          style={{ width: 17, height: 17, accentColor: '#9A6E38' }} />
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1C1B17' }}>قیمت توافقی است</span>
                        <span style={{ fontSize: 11.5, color: '#8A8474' }}>— روی آگهی «توافقی» نوشته می‌شود</span>
                      </label>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, opacity: form.negotiable ? 0.45 : 1 }}>
                        <div>
                          {form.negotiable ? <Label optional>قیمت (تومان)</Label> : <Label required>قیمت (تومان)</Label>}
                          <input className="nf" type="text" inputMode="numeric" placeholder="۰" disabled={form.negotiable}
                            value={form.negotiable ? '' : form.price} onChange={e => set('price', fmtPrice(e.target.value))} style={inp(errors.price)} />
                          <ErrMsg msg={errors.price} />
                        </div>
                        <div>
                          <Label optional>قیمت قبل از تخفیف</Label>
                          <input className="nf" type="text" inputMode="numeric" placeholder="۰" disabled={form.negotiable}
                            value={form.negotiable ? '' : form.oldPrice} onChange={e => set('oldPrice', fmtPrice(e.target.value))} style={inp(errors.oldPrice)} />
                          <ErrMsg msg={errors.oldPrice} />
                        </div>
                      </div>
                      {form.price && form.oldPrice && (() => {
                        const p = Number(toAsciiDigits(form.price).replace(/\D/g,''))
                        const o = Number(toAsciiDigits(form.oldPrice).replace(/\D/g,''))
                        if (o > p) {
                          const d = Math.round((1 - p/o)*100)
                          return (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.22)', borderRadius: 10 }}>
                              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>{d}٪</span>
                              <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>تخفیف {d}٪ اعمال می‌شود</span>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════
                  LEFT COLUMN — seller info
              ═══════════════════════════════════════════════════ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── چرا این کارت گاهی نیست ──
                    نام فروشگاه، نام مالک، استان/شهر و آدرس همگی از
                    پروفایلِ فروشگاه پر و قفل می‌شوند. وقتی هر چهارتا
                    قفل‌اند، کارت فقط چهار فیلدِ غیرقابلِ تغییر را نشان
                    می‌دهد و بی‌جهت ارتفاع می‌گیرد — پس نمایش داده
                    نمی‌شود. مقدارها سرِ جایشان‌اند و با آگهی ثبت می‌شوند.

                    «اطلاعات تماس» جدا می‌ماند، چون شماره‌ی تماس واقعاً
                    قابلِ تغییر است. */}
                {!sellerLocked && (
                <div style={{ background: LQ_BG, backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '24px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.5s ease both' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
                  <SectionTitle>اطلاعات فروشنده</SectionTitle>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>

                    <div>
                      <Label required>نام فروشگاه | فروشنده</Label>
                      <div style={{ position: 'relative' }}>
                        <input className="nf" type="text" value={form.shopName} onChange={e => !shopNameLocked && set('shopName', e.target.value)} readOnly={shopNameLocked} style={inp(errors.shopName, shopNameLocked)} />
                        {shopNameLocked && (
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          </span>
                        )}
                      </div>
                      {shopNameLocked && <p style={{ fontSize: 11, color: GOLD_D, marginTop: 4, opacity: 0.8 }}>از حساب شما اتومات پر شده</p>}
                      <ErrMsg msg={errors.shopName} />
                    </div>

                    <div>
                      <Label optional>نام مالک فروشگاه</Label>
                      <div style={{ position: 'relative' }}>
                        <input className="nf" type="text" value={form.ownerName} onChange={e => !ownerNameLocked && set('ownerName', e.target.value)} readOnly={ownerNameLocked} style={inp(undefined, ownerNameLocked)} />
                        {ownerNameLocked && (
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          </span>
                        )}
                      </div>
                    </div>

                    <ProvinceCitySelect
                      value={{ province: form.province, city: form.city }}
                      onChange={v => !geoLocked && setForm(f => ({ ...f, province: v.province, city: v.city }))}
                      required disabled={geoLocked} provinceError={errors.province} cityError={errors.city}
                    />
                    {geoLocked && <p style={{ fontSize: 11, color: GOLD_D, marginTop: -6, opacity: 0.8 }}>از فروشگاه شما پر شده و قفل است</p>}

                    <div>
                      <Label>آدرس</Label>
                      <textarea className="nf" rows={2} placeholder="خیابان، کوچه، پلاک..." value={form.address} readOnly={geoLocked} onChange={e => !geoLocked && set('address', e.target.value)} style={{ ...inp(undefined, geoLocked), resize: 'vertical', minHeight: 72, lineHeight: 1.7 }} />
                    </div>

                  </div>
                </div>
                )}

                {/* card: contact info */}
                <div style={{ background: LQ_BG, backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '24px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.54s ease both' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
                  <SectionTitle>اطلاعات تماس</SectionTitle>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>

                    <div>
                      <Label required>شماره تماس</Label>
                      <div style={{ position: 'relative' }}>
                        <input className="nf" type="tel" placeholder="09xxxxxxxxx" value={form.sellerPhone} onChange={e => set('sellerPhone', e.target.value)} style={{ ...inp(errors.sellerPhone), direction: 'ltr', textAlign: 'right', paddingRight: '42px' }} />
                        <div style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </div>
                      </div>
                      <ErrMsg msg={errors.sellerPhone} />
                    </div>

                    <div>
                      <Label optional>شماره واتساپ</Label>
                      <div style={{ position: 'relative' }}>
                        <input className="nf" type="tel" placeholder="09xxxxxxxxx" value={form.sellerWhatsapp} onChange={e => set('sellerWhatsapp', e.target.value)} style={{ ...inp(), direction: 'ltr', textAlign: 'right', paddingRight: '42px' }} />
                        <div style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: TEXT_MUT, marginTop: 5 }}>اگر وارد نکنید، از شماره تماس استفاده می‌شود</p>
                    </div>
                  </div>
                </div>

                {/* info note */}
                <div style={{ background: 'rgba(199,166,106,0.07)', border: '1px solid rgba(199,166,106,0.25)', borderRadius: 16, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ color: GOLD, flexShrink: 0, marginTop: 1 }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                      <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <p style={{ fontSize: 13, color: TEXT_SEC, lineHeight: 1.75, margin: 0 }}>
                      اطلاعات تماس شما مستقیماً به خریداران نمایش داده می‌شود ، خریدار مستقیم با شما تماس می‌گیرد.
                    </p>
                  </div>
                </div>

                {/* live preview */}
                {(previewName || images.length > 0) && (
                  <div style={{ background: LQ_BG, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: LQ_BOR, borderRadius: 16, padding: '16px', boxShadow: LQ_SHAD, animation: 'fadeIn 0.3s ease both' }}>
                    <p style={{ fontSize: 11.5, color: TEXT_MUT, marginBottom: 12, fontWeight: 700, letterSpacing: '0.1em' }}>پیش‌نمایش محصول</p>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px', background: '#fff', borderRadius: 12, border: '1.5px solid rgba(28,28,26,0.08)' }}>
                      <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', background: '#F4F3F1', flexShrink: 0 }}>
                        {images.length > 0 && images[0]
                          ? <img loading="lazy" decoding="async" src={images[0].data} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, opacity: 0.3 }}>🎱</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* همان دو خطی که کارتِ بازار نشان می‌دهد:
                            بولد بالا، برند و مدل با وزنِ معمولی پایینش */}
                        <p style={{ fontSize: 13.5, fontWeight: 800, color: TEXT, margin: '0 0 3px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {previewParts.head}
                        </p>
                        {previewParts.tail && (
                          <p style={{ fontSize: 11.5, fontWeight: 400, color: TEXT_MUT, margin: '0 0 4px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {previewParts.tail}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          {catLabel && <span style={{ fontSize: 11, color: GOLD, fontWeight: 600, background: 'rgba(199,166,106,0.1)', padding: '1px 7px', borderRadius: 10 }}>{catLabel}</span>}
                          {form.condition !== 'new' && <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600, background: 'rgba(180,83,9,0.08)', padding: '1px 7px', borderRadius: 10 }}>{conditionLabel(form.condition)}</span>}
                        </div>
                        {form.price && (
                          <p style={{ fontSize: 14, fontWeight: 800, color: GOLD, margin: '5px 0 0' }}>
                            {form.price} <span style={{ fontSize: 11, fontWeight: 400, color: TEXT_MUT }}>تومان</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* پیام‌های خطا و سهمیه در پنجره‌ی وسطِ صفحه می‌آیند (AlertDialog)،
                نه نوارِ بالای فرم — روی موبایل آن نوار هرگز دیده نمی‌شد. */}

            {/* ── پذیرش قوانین بازار ── */}
            <div style={{ background: LQ_BG, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: errors.acceptRules ? '1.5px solid rgba(200,60,60,0.42)' : LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '16px 22px', marginBottom: 14, transition: 'border-color .2s' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={acceptRules}
                  onChange={e => { setAcceptRules(e.target.checked); if (e.target.checked) setErrors(p => { const n = { ...p }; delete n.acceptRules; return n }) }}
                  style={{ width: 17, height: 17, marginTop: 2, accentColor: GOLD, cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ fontSize: 13, lineHeight: 2, color: 'rgba(28,27,23,0.66)' }}>
                  با ثبت این آگهی،{' '}
                  <a href="/terms#market" target="_blank" rel="noopener noreferrer" style={{ color: GOLD_D, fontWeight: 800, textDecoration: 'none' }}>
                    قوانین و مقررات بیلیارد بازار
                  </a>
                  {' '}را مطالعه و می‌پذیرم.
                </span>
              </label>
              {errors.acceptRules && (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#C0392B', paddingRight: 27 }}>{errors.acceptRules}</div>
              )}
            </div>

            {/* ── Submit bar ──
                دو دکمه هم‌اندازه در یک سطر (هرکدام `flex:1`). راهنمای
                «* فیلدهای الزامی» برداشته شد: فیلدهای نیازمند، خودشان
                ستاره دارند و پیامِ خطا حالا وسطِ صفحه می‌آید. */}
            <div style={{ background: LQ_BG, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'stretch', animation: 'fadeUp 0.6s ease both', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />

              <button type="submit" disabled={submitting} style={{ flex: 1, minWidth: 0, padding: '12px 10px', borderRadius: 13, border: `1.5px solid ${GOLD}`, cursor: submitting ? 'not-allowed' : 'pointer', background: 'rgba(199,166,106,0.14)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', color: GOLD_D, fontSize: 14, fontWeight: 800, fontFamily: 'Vazirmatn,Tahoma,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 5px 18px rgba(199,166,106,0.20), inset 0 1px 0 rgba(255,255,255,0.55)', transition: 'opacity 0.2s, transform 0.15s, box-shadow 0.2s', opacity: submitting ? 0.65 : 1, position: 'relative', zIndex: 1 }}
                onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 7px 22px rgba(199,166,106,0.32), inset 0 1px 0 rgba(255,255,255,0.55)`; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 5px 18px rgba(199,166,106,0.20), inset 0 1px 0 rgba(255,255,255,0.55)'; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M5 13l4 4L19 7" stroke={GOLD_D} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                ثبت محصول
              </button>

              <Link href="/shop" style={{ flex: 1, minWidth: 0, padding: '12px 10px', borderRadius: 13, border: '1px solid rgba(255,255,255,0.88)', background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(200%)', WebkitBackdropFilter: 'blur(20px) saturate(200%)', color: TEXT_SEC, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 4px 14px rgba(0,0,0,0.06)', transition: 'color 0.2s', position: 'relative', zIndex: 1 }}
                onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                onMouseLeave={e => (e.currentTarget.style.color = TEXT_SEC)}>
                انصراف
              </Link>
            </div>
          </form>

          <AlertDialog
            open={!!alert}
            title={alert?.title ?? ''}
            lines={alert?.lines ?? []}
            tone={alert?.tone ?? 'error'}
            action={alert?.action}
            onClose={() => setAlert(null)}
          />
        </div>

      </div>
    </>
  )
}
