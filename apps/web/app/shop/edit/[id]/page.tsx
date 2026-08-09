'use client'

/* ═══════════════════════════════════════════════════════════════
   ویرایشِ آگهی — همان فرمِ ثبت، با داده‌ی پرشده.
   ───────────────────────────────────────────────────────────────
   نسخه‌ی قبلیِ این صفحه یک فرمِ جداگانه بود که هیچ‌چیزِ فرمِ ثبت را
   نمی‌شناخت. چهار خرابیِ واقعی داشت:

   ۱. فهرستِ دسته‌بندی‌اش دستی و غلط بود — «آموزشی» داشت که اصلاً
      دسته نیست، و «تیپ»، «گچ»، «پارچه»، «اکستنشن»، «رست»،
      «روغن»، «حوله»، «کیس چوب» و «کیف توپ» را نداشت. آگهیِ تیپ که
      باز می‌شد، دسته‌اش روی «میز بیلیارد» می‌افتاد و **ذخیره،
      دسته‌ی آگهی را واقعاً عوض می‌کرد.**
   ۲. فیلدِ «نوع» نداشت. نامِ کارت در بازار از «دسته + نوع» ساخته
      می‌شود، پس نوعِ غلط یعنی کارتِ غلط — و راهی برای اصلاحش نبود.
   ۳. مشخصاتِ فنی را جدولِ خامِ «برچسب/مقدار» نشان می‌داد: فروشنده
      به‌جای «جنس شفت» می‌دید «shaftMaterial».
   ۴. قیمتِ آگهیِ تخفیف‌دار را خراب می‌کرد. ستونِ `price` قیمتِ
      خط‌خورده است و `discountPrice` قیمتِ پرداختی؛ این صفحه هر دو
      را برعکس می‌خواند و بعد از تقسیم بر درصدِ تخفیف، عددی نجومی
      می‌ساخت.

   حالا همان اجزای فرمِ ثبت را وارد می‌کند
   (`components/market/AdFormFields`, `lib/market/chain`,
   `lib/market/specs`) — پس هر تغییری در یکی، در دیگری هم هست.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useAuthStore } from '../../../../store/auth.store'
import { uploadFile } from '../../../../lib/supabase'
import { apiFetch } from '../../../../lib/http'
import ProvinceCitySelect from '../../../../components/ProvinceCitySelect'
import { provinceOfCity } from '../../../../lib/iran-geo'
import { compressImage } from '../../../../lib/seller-store'
import { CATEGORY_OPTIONS, CONDITIONS, normalizeCategory, normalizeCondition } from '../../../../lib/market/categories'
import { GENERIC_SPECS, CATEGORY_SPECS, HIDDEN_SPEC_KEYS } from '../../../../lib/market/specs'
import { TYPE_OPTIONS, brandOptionsFor, modelOptionsFor, isTypeDrivenCategory, withOther } from '../../../../lib/market/chain'
import {
  GOLD, GOLD_D, TEXT, TEXT_SEC, TEXT_MUT, LQ_BG, LQ_BOR, LQ_SHAD,
  AD_FORM_CSS, inp, toAsciiDigits, fmtPrice, FancySelect, Label, ErrMsg, SectionTitle, SpecField,
} from '../../../../components/market/AdFormFields'

/* کلیدهایی که فرمِ ثبت داخلِ specs می‌گذارد ولی بالای فرم فیلدِ خودشان را دارند */
const TOP_LEVEL_SPEC_KEYS = ['نوع', 'مدل']

interface ImgSlot { data: string; name: string; file: File }

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = String(params.id ?? '')
  const { user } = useAuthStore()

  const [pageLoading, setPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  /* آگهیِ محلی (userProducts) — آگهی‌های قدیمیِ ساخته‌شده پیش از انتقال به سرور */
  const [isLocal, setIsLocal] = useState(false)
  const localRef = useRef<Record<string, unknown> | null>(null)

  const [form, setForm] = useState({
    category: '', type: '', typeOther: '',
    brand: '', brandOther: '', model: '', modelOther: '',
    price: '', oldPrice: '', negotiable: false,
    description: '', condition: 'new',
    province: '', city: '',
  })
  const [specs, setSpecs] = useState<Record<string, string>>({})
  const [specOthers, setSpecOthers] = useState<Record<string, string>>({})
  /* کلیدهایی که در تعریفِ دسته نیستند (داده‌ی قدیمی یا دسته‌ی عوض‌شده).
     حذف نمی‌شوند — وگرنه ویرایشِ یک آگهی، چیزی را که فروشنده وارد
     کرده بی‌صدا می‌بلعد. */
  const [legacySpecs, setLegacySpecs] = useState<{ key: string; value: string }[]>([])

  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<ImgSlot[]>([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── هیدراته‌کردنِ فرم از یک رکورد ────────────────────────────
  const hydrate = useCallback((p: Record<string, any>, opts: { local: boolean }) => {
    const category = normalizeCategory(p.category)
    const type = String(p.type ?? p.specs?.['نوع'] ?? '').trim()

    /* برند/مدل/نوع: اگر مقدارِ ذخیره‌شده در فهرستِ دراپ‌داون نباشد،
       «سایر» انتخاب می‌شود و خودِ متن در فیلدِ کناری می‌نشیند —
       وگرنه باز کردنِ فرم، برندِ فروشنده را پاک می‌کرد.

       ترتیب مهم است: فهرستِ برند به «نوع» وابسته است و فهرستِ مدل به
       (نوع، برند). پس هر مرحله با همان مقداری حساب می‌شود که در
       رندر هم استفاده می‌شود، نه با مقدارِ خام. */
    const rawBrand = String(p.brand ?? '').trim()
    const rawModel = String(p.model ?? p.specs?.['مدل'] ?? '').trim()

    const typeInList = !TYPE_OPTIONS[category] || TYPE_OPTIONS[category]!.includes(type)
    const typeValue = typeInList ? type : 'سایر'

    const bOpts = brandOptionsFor(category, typeValue)
    const brandInList = !!bOpts && bOpts.includes(rawBrand)
    const brandValue = brandInList ? rawBrand : (bOpts ? 'سایر' : rawBrand)

    const mOpts = modelOptionsFor(category, typeValue, brandValue)
    const modelInList = !!mOpts && mOpts.includes(rawModel)

    /* قیمت: ستونِ `price` قیمتِ خط‌خورده است وقتی تخفیف هست، و
       `discountPrice` قیمتِ پرداختی. */
    let current = 0, struck = 0
    if (opts.local) {
      current = Number(p.price) || 0
      struck = Number(p.old) > current ? Number(p.old) : 0
    } else {
      const listed = Number(p.price) || 0
      const discounted = Number(p.discountPrice) || 0
      current = discounted > 0 ? discounted : listed
      struck = discounted > 0 ? listed : 0
    }

    setForm({
      category,
      type: typeValue,
      typeOther: typeInList ? '' : type,
      brand: brandValue,
      brandOther: brandInList || !bOpts ? '' : rawBrand,
      model: modelInList ? rawModel : (mOpts ? 'سایر' : rawModel),
      modelOther: modelInList || !mOpts ? '' : rawModel,
      price: current ? fmtPrice(String(current)) : '',
      oldPrice: struck ? fmtPrice(String(struck)) : '',
      negotiable: p.negotiable === true,
      description: String(p.description ?? ''),
      condition: normalizeCondition(p.condition),
      province: String(p.province ?? p.sellerProvince ?? provinceOfCity(String(p.city ?? p.sellerCity ?? '')) ?? ''),
      city: String(p.city ?? p.sellerCity ?? ''),
    })

    // ── مشخصاتِ فنی ──
    const raw = (p.specs && typeof p.specs === 'object' && !Array.isArray(p.specs))
      ? (p.specs as Record<string, unknown>) : {}
    const defs = CATEGORY_SPECS[category] ?? GENERIC_SPECS
    const known = new Set(defs.map(d => d.key))
    const nextSpecs: Record<string, string> = {}
    const nextOthers: Record<string, string> = {}
    const leftovers: { key: string; value: string }[] = []
    for (const [k, v] of Object.entries(raw)) {
      const value = String(v ?? '').trim()
      if (!value) continue
      if (TOP_LEVEL_SPEC_KEYS.includes(k)) continue      // نوع/مدل بالای فرم‌اند
      if (!known.has(k)) { leftovers.push({ key: k, value }); continue }
      /* فرمِ ثبت مقدارِ «سایر» را به شکلِ «سایر: متن» ذخیره می‌کند */
      if (value.startsWith('سایر:')) {
        nextSpecs[k] = 'سایر'
        nextOthers[k] = value.slice('سایر:'.length).trim()
      } else {
        nextSpecs[k] = value
      }
    }
    setSpecs(nextSpecs)
    setSpecOthers(nextOthers)
    setLegacySpecs(leftovers)

    setExistingImages(Array.isArray(p.images) ? p.images.filter(Boolean).map(String) : [])
    setPageLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    let alive = true
    void (async () => {
      try {
        const r = await fetch(`/api/market/ads/${id}`, { cache: 'no-store' })
        if (!r.ok) throw new Error('not found')
        const p = (await r.json()).ad
        if (!alive) return
        hydrate(p, { local: false })
        return
      } catch { /* پایین‌تر: فالبکِ محلی */ }

      if (!alive) return
      try {
        const list = JSON.parse(localStorage.getItem('userProducts') ?? '[]')
        const p = Array.isArray(list) ? list.find((x: any) => String(x.id) === String(id)) : null
        if (p) {
          localRef.current = p
          setIsLocal(true)
          hydrate({ ...p, description: p.description, images: p.images ?? (p.img ? [p.img] : []) }, { local: true })
          return
        }
      } catch { /* localStorage خراب — مثلِ نبودِ آگهی رفتار می‌کند */ }
      setNotFound(true)
      setPageLoading(false)
    })()
    return () => { alive = false }
  }, [id, user, hydrate])

  // ── setters ───────────────────────────────────────────────────
  const set = (k: keyof typeof form, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k as string]; return n })
  }

  const handleCategoryChange = (cat: string) => {
    setForm(f => ({ ...f, category: cat, type: '', typeOther: '', brand: '', brandOther: '', model: '', modelOther: '' }))
    setErrors(e => { const n = { ...e }; delete n.category; delete n.type; delete n.brand; delete n.model; return n })
    setSpecs({}); setSpecOthers({})
  }
  const setType = (v: string) => {
    setForm(f => ({ ...f, type: v, typeOther: '', ...(isTypeDrivenCategory(f.category) ? { brand: '', brandOther: '', model: '', modelOther: '' } : {}) }))
    setErrors(e => { const n = { ...e }; delete n.type; if (isTypeDrivenCategory(form.category)) { delete n.brand; delete n.model } return n })
  }
  const setBrand = (v: string) => {
    setForm(f => ({ ...f, brand: v, model: '', modelOther: '' }))
    setErrors(e => { const n = { ...e }; delete n.brand; delete n.model; return n })
  }

  const brandOptions = brandOptionsFor(form.category, form.type)
  const modelOptions = modelOptionsFor(form.category, form.type, form.brand)
  const effBrand = form.brand === 'سایر' ? form.brandOther.trim() : form.brand.trim()
  const effModel = form.model === 'سایر' ? form.modelOther.trim() : form.model.trim()
  const effType  = form.type  === 'سایر' ? form.typeOther.trim()  : form.type.trim()
  const catLabel = CATEGORY_OPTIONS.find(c => c.id === form.category)?.label ?? ''

  // ── تصاویر ────────────────────────────────────────────────────
  const totalImages = existingImages.length + newImages.length
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const remaining = 5 - (existingImages.length + newImages.length)
    if (remaining <= 0) return
    Array.from(files).slice(0, remaining).forEach(file => {
      if (!file.type.startsWith('image/')) { setErrors(e => ({ ...e, images: 'فقط فایل تصویر قابل قبول است' })); return }
      if (file.size > 5 * 1024 * 1024) { setErrors(e => ({ ...e, images: 'حداکثر حجم هر تصویر ۵ مگابایت' })); return }
      const reader = new FileReader()
      reader.onload = ev => {
        setNewImages(prev => prev.length + existingImages.length < 5
          ? [...prev, { data: ev.target?.result as string, name: file.name, file }] : prev)
        setErrors(e => { const n = { ...e }; delete n.images; return n })
      }
      reader.readAsDataURL(file)
    })
  }, [existingImages.length, newImages.length])

  // ── اعتبارسنجی ────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.category) e.category = 'دسته‌بندی را انتخاب کنید'
    if (!effType) e.type = form.type === 'سایر' ? 'برای «سایر» توضیح بنویسید' : 'نوع را مشخص کنید'
    if (!effBrand) e.brand = 'برند الزامی است'
    if (!form.negotiable && !form.price) e.price = 'قیمت را وارد کنید یا «توافقی» را بزنید'
    if (!form.negotiable && form.price && form.oldPrice) {
      const p = Number(toAsciiDigits(form.price).replace(/\D/g, ''))
      const o = Number(toAsciiDigits(form.oldPrice).replace(/\D/g, ''))
      if (o > 0 && o <= p) e.oldPrice = 'قیمت قبل از تخفیف باید بیشتر از قیمت فعلی باشد'
    }
    if (!form.province) e.province = 'استان را انتخاب کنید'
    if (!form.city) e.city = 'شهر را انتخاب کنید'
    return e
  }

  // ── ذخیره ─────────────────────────────────────────────────────
  const buildSpecs = () => {
    const out: Record<string, string> = { نوع: effType, مدل: effModel }
    Object.entries(specs).forEach(([k, v]) => {
      if (v === 'سایر' && specOthers[k]) out[k] = `سایر: ${specOthers[k]}`
      else if (v) out[k] = v
    })
    legacySpecs.forEach(({ key, value }) => { if (value.trim()) out[key] = value.trim() })
    return out
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)

    const price = Number(toAsciiDigits(form.price).replace(/\D/g, '')) || 0
    const oldRaw = form.oldPrice ? Number(toAsciiDigits(form.oldPrice).replace(/\D/g, '')) : 0
    const old = oldRaw > price ? oldRaw : price
    /* نامِ آگهی دقیقاً مثلِ فرمِ ثبت ساخته می‌شود — «دسته + نوع».
       اگر این‌جا فرقی داشت، ویرایشِ ساده‌ی یک آگهی، عنوانِ کارتش را
       در بازار عوض می‌کرد. */
    const composedName = [catLabel, effType].filter(Boolean).join(' ')
      || [effBrand, effModel].filter(Boolean).join(' ') || 'محصول'

    void (async () => {
      try {
        // ── آگهیِ محلی ──
        if (isLocal) {
          const urls = await Promise.all(newImages.map(s => compressImage(s.file, 1200, 0.7)))
          const imgs = [...existingImages, ...urls].filter(Boolean)
          const updated = {
            ...(localRef.current ?? {}),
            name: composedName,
            category: form.category, type: effType,
            brand: effBrand, model: effModel,
            description: form.description.trim(), condition: form.condition,
            price: form.negotiable ? 0 : price,
            old: form.negotiable ? 0 : old,
            disc: !form.negotiable && old > price ? Math.round((1 - price / old) * 100) : 0,
            negotiable: form.negotiable,
            sellerProvince: form.province, sellerCity: form.city,
            img: imgs[0] ?? (localRef.current as any)?.img,
            images: imgs.length ? imgs : (localRef.current as any)?.images,
            specs: buildSpecs(),
          }
          const list = JSON.parse(localStorage.getItem('userProducts') ?? '[]')
          localStorage.setItem('userProducts', JSON.stringify(
            (Array.isArray(list) ? list : []).map((x: any) => String(x.id) === String(id) ? updated : x)))
          setSaved(true)
          return
        }

        // ── آگهیِ سرور ──
        const stamp = Date.now()
        const uploaded: string[] = []
        for (let i = 0; i < newImages.length; i++) {
          const url = await uploadFile('club-media', newImages[i]!.file, `products/${stamp}-${i}`)
          if (!url) {
            setErrors({ submit: `بارگذاری تصویر ${i + 1} انجام نشد؛ دوباره تلاش کنید` })
            setSubmitting(false); return
          }
          uploaded.push(url)
        }

        const r = await apiFetch(`/api/market/ads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: composedName,
            category: form.category, type: effType,
            brand: effBrand, model: effModel,
            price: form.negotiable ? 0 : price,
            old: form.negotiable ? 0 : old,
            negotiable: form.negotiable,
            description: form.description.trim(), condition: form.condition,
            specs: buildSpecs(),
            images: [...existingImages, ...uploaded],
            province: form.province, city: form.city,
          }),
        })
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          setErrors({ submit: j?.message || 'ویرایش آگهی انجام نشد' })
          setSubmitting(false); return
        }
        setSaved(true)
      } catch {
        setErrors({ submit: 'خطا در ارتباط با سرور؛ دوباره تلاش کنید' })
        setSubmitting(false)
      }
    })()
  }

  // ── حالت‌های صفحه ─────────────────────────────────────────────
  if (pageLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT_MUT, fontFamily: 'Vazirmatn,Tahoma,sans-serif', direction: 'rtl' }}>
      در حال بارگذاری آگهی...
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn,Tahoma,sans-serif', direction: 'rtl' }}>
      <p style={{ color: TEXT_SEC, margin: 0 }}>این آگهی پیدا نشد یا حذف شده است.</p>
      <Link href="/dashboard/shop" style={{ padding: '10px 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, textDecoration: 'none', color: GOLD_D, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)' }}>آگهی‌های من</Link>
    </div>
  )

  if (saved) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 82, height: 82, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#A07840)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', boxShadow: '0 12px 36px rgba(199,166,106,0.45)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 10 }}>تغییرات ذخیره شد</h2>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
          <Link href="/dashboard/shop" style={{ padding: '11px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, textDecoration: 'none', color: GOLD_D, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)' }}>آگهی‌های من</Link>
          <button type="button" onClick={() => router.push(`/shop/${id}`)} style={{ padding: '11px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', color: TEXT_SEC, background: 'rgba(28,28,26,0.04)', border: '1px solid rgba(28,28,26,0.10)', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>دیدن آگهی</button>
        </div>
      </div>
    </div>
  )

  const currentDefs = form.category ? (CATEGORY_SPECS[form.category] ?? GENERIC_SPECS) : []
  const hidden = HIDDEN_SPEC_KEYS[form.category] ?? ['brand']
  const specFields = currentDefs.filter(f => f.key !== 'condition' && !hidden.includes(f.key))

  const card: React.CSSProperties = {
    background: LQ_BG, backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)',
    border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: 24, position: 'relative', overflow: 'hidden',
  }
  const gloss: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, right: 0, height: '46%',
    background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none',
  }

  return (
    <>
      <style>{AD_FORM_CSS}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT, overflowX: 'hidden' }}>
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(199,166,106,0.08) 0%,transparent 65%)', filter: 'blur(70px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: 'clamp(18px,3vw,32px) clamp(14px,3vw,28px) 80px' }}>

          {/* ── راهِ برگشت ── */}
          <div style={{ marginBottom: 26 }}>
            <Link href="/dashboard/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: TEXT_SEC, textDecoration: 'none', padding: '8px 14px', borderRadius: 11, background: LQ_BG, border: LQ_BOR, boxShadow: LQ_SHAD, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <ChevronLeft size={15} />
              بازگشت به آگهی‌های من
            </Link>
          </div>

          <div style={{ marginBottom: 28, animation: 'fadeUp 0.4s ease both' }}>
            <p style={{ fontSize: 11, color: GOLD, letterSpacing: '0.2em', fontWeight: 700, margin: '0 0 3px' }}>EDIT LISTING</p>
            <h1 style={{ fontSize: 'clamp(20px,2.6vw,26px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>ویرایش آگهی</h1>
            {catLabel && (
              <p style={{ fontSize: 13.5, color: TEXT_SEC, margin: '8px 0 0' }}>
                {[catLabel, effType].filter(Boolean).join(' ')}
                {effBrand ? <span style={{ color: TEXT_MUT }}>{' — '}{[effBrand, effModel].filter(Boolean).join(' ')}</span> : null}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── دسته / نوع / برند / مدل ── */}
            <div style={{ ...card, animation: 'fadeUp 0.44s ease both' }}>
              <div style={gloss} />
              <SectionTitle>اطلاعات محصول</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>

                <div>
                  <Label required>دسته‌بندی</Label>
                  <FancySelect value={form.category} onChange={handleCategoryChange}
                    options={CATEGORY_OPTIONS.map(c => ({ value: c.id, label: c.label }))}
                    placeholder="انتخاب دسته‌بندی..." error={!!errors.category} />
                  <ErrMsg msg={errors.category} />
                </div>

                <div>
                  <Label required>نوع</Label>
                  {form.category && TYPE_OPTIONS[form.category] ? (
                    <FancySelect value={form.type} onChange={setType}
                      options={withOther(TYPE_OPTIONS[form.category]!).map(o => ({ value: o, label: o }))}
                      placeholder="انتخاب نوع..." error={!!errors.type} />
                  ) : (
                    <input className="nf" type="text" placeholder="مثال: اسنوکر" value={form.type}
                      onChange={e => set('type', e.target.value)} style={inp(errors.type)} />
                  )}
                  {form.type === 'سایر' && (
                    <input className="nf" type="text" value={form.typeOther}
                      onChange={e => set('typeOther', e.target.value)}
                      placeholder="توضیح دهید — مثال: توپِ تمرینیِ نشانه‌دار"
                      style={{ ...inp(errors.type), marginTop: 8, background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
                  )}
                  <ErrMsg msg={errors.type} />
                </div>

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
                    <input className="nf" type="text" placeholder="نام برند" value={form.brand}
                      onChange={e => set('brand', e.target.value)} style={inp(errors.brand)} />
                  )}
                  <ErrMsg msg={errors.brand} />
                </div>

                <div>
                  <Label>مدل</Label>
                  {modelOptions ? (
                    <>
                      <FancySelect value={form.model} onChange={v => set('model', v)}
                        options={withOther(modelOptions).map(o => ({ value: o, label: o }))}
                        placeholder="انتخاب مدل..." />
                      {form.model === 'سایر' && (
                        <input className="nf" type="text" placeholder="مدل را وارد کنید..." value={form.modelOther}
                          onChange={e => set('modelOther', e.target.value)}
                          style={{ ...inp(), marginTop: 8, background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
                      )}
                    </>
                  ) : (
                    <input className="nf" type="text" placeholder="مثال: 314³" value={form.model}
                      onChange={e => set('model', e.target.value)} style={inp()} />
                  )}
                </div>

              </div>
            </div>

            {/* ── مشخصات فنی + وضعیت + توضیحات ── */}
            <div key={form.category || 'no-cat'} style={{ ...card, animation: 'fadeIn 0.35s ease both' }}>
              <div style={gloss} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${GOLD},#A07840)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(199,166,106,0.32)', flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 10.5, color: GOLD, letterSpacing: '0.18em', fontWeight: 700, margin: '0 0 1px' }}>SPECIFICATIONS</p>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: 0 }}>
                      {form.category ? `مشخصات فنی — ${catLabel}` : 'مشخصات و وضعیت محصول'}
                    </h3>
                  </div>
                </div>

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
                            if (isParent) specFields.filter(f => f.dependsOn === field.key).forEach(f => { next[f.key] = '' })
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

                {/* ── مشخصاتی که در تعریفِ این دسته نیستند ──
                    آگهی‌های قدیمی (یا آگهی‌ای که دسته‌اش عوض شده) کلیدهایی
                    دارند که فرم نمی‌شناسد. نشان‌ندادنشان یعنی ذخیره‌ی بعدی
                    پاکشان می‌کند. */}
                {legacySpecs.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <Label>مشخصات ثبت‌شده‌ی دیگر</Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {legacySpecs.map((row, i) => (
                        <div key={`${row.key}-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ minWidth: 120, fontSize: 12.5, color: TEXT_SEC, fontWeight: 700 }}>{row.key}</span>
                          <input className="nf" type="text" value={row.value}
                            onChange={e => setLegacySpecs(list => list.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                            style={{ ...inp(), flex: 1 }} />
                          <button type="button" onClick={() => setLegacySpecs(list => list.filter((_, j) => j !== i))}
                            title="حذف این مشخصه"
                            style={{ border: 'none', background: 'transparent', color: TEXT_MUT, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ height: 1, background: 'rgba(28,28,26,0.08)', margin: '4px 0 18px' }} />

                <div style={{ marginBottom: 16 }}>
                  <Label required>وضعیت کالا</Label>
                  <FancySelect value={form.condition} onChange={v => set('condition', v)}
                    options={CONDITIONS.map(c => ({ value: c.id, label: c.label }))} />
                </div>

                <div>
                  <Label>توضیحات محصول</Label>
                  <textarea className="nf" rows={4} placeholder="ویژگی‌ها، شرایط استفاده و سایر توضیحات..."
                    value={form.description} onChange={e => set('description', e.target.value)}
                    style={{ ...inp(), resize: 'vertical', minHeight: 100, lineHeight: 1.7 }} />
                </div>
              </div>
            </div>

            {/* ── تصاویر ── */}
            <div style={{ ...card, animation: 'fadeUp 0.5s ease both' }}>
              <div style={gloss} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <SectionTitle>تصاویر محصول</SectionTitle>
                  <span style={{ fontSize: 12, fontWeight: 700, color: totalImages >= 5 ? GOLD : TEXT_MUT, padding: '4px 10px', background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.2)', borderRadius: 20 }}>
                    {totalImages}/۵ تصویر
                  </span>
                </div>

                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

                {totalImages > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 8, marginBottom: 10 }}>
                    {existingImages.map((src, i) => (
                      <div key={`ex-${i}`} className="img-thumb" style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', border: i === 0 ? `2px solid ${GOLD}` : '1.5px solid rgba(28,28,26,0.1)' }}>
                        <img loading="lazy" decoding="async" src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {i === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(199,166,106,0.85),transparent)', padding: '10px 4px 4px', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>اصلی</div>}
                        <button type="button" onClick={() => setExistingImages(p => p.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: 4, left: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}>×</button>
                      </div>
                    ))}
                    {newImages.map((img, i) => (
                      <div key={`new-${i}`} className="img-thumb" style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', border: '1.5px solid rgba(28,28,26,0.1)' }}>
                        <img loading="lazy" decoding="async" src={img.data} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(28,28,26,0.75),transparent)', padding: '10px 4px 4px', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>جدید</div>
                        <button type="button" onClick={() => setNewImages(p => p.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: 4, left: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                {totalImages < 5 && (
                  <div className="drop-area" onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
                    style={{ border: `2px dashed ${dragging ? GOLD : 'rgba(28,28,26,0.16)'}`, borderRadius: 12, padding: totalImages > 0 ? 16 : '28px 16px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(199,166,106,0.04)' : 'transparent' }}>
                    <p style={{ fontSize: 13, color: TEXT_SEC, margin: '0 0 3px', fontWeight: 600 }}>کلیک کنید یا بکشید و رها کنید</p>
                    <p style={{ fontSize: 12, color: TEXT_MUT, margin: 0 }}>PNG، JPG، WEBP — حداکثر ۵ مگابایت | تا {5 - totalImages} تصویر دیگر</p>
                  </div>
                )}
                <ErrMsg msg={errors.images} />
              </div>
            </div>

            {/* ── قیمت ── */}
            <div style={{ ...card, animation: 'fadeUp 0.52s ease both' }}>
              <div style={gloss} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <SectionTitle>قیمت‌گذاری</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.negotiable} onChange={e => set('negotiable', e.target.checked)}
                      style={{ width: 17, height: 17, accentColor: GOLD_D }} />
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1C1B17' }}>قیمت توافقی است</span>
                    <span style={{ fontSize: 11.5, color: '#8A8474' }}>— روی آگهی «توافقی» نوشته می‌شود</span>
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, opacity: form.negotiable ? 0.45 : 1 }}>
                    <div>
                      <Label required={!form.negotiable}>قیمت (تومان)</Label>
                      <input className="nf" type="text" inputMode="numeric" placeholder="۰" disabled={form.negotiable}
                        value={form.negotiable ? '' : form.price}
                        onChange={e => set('price', fmtPrice(e.target.value))} style={inp(errors.price)} />
                      <ErrMsg msg={errors.price} />
                    </div>
                    <div>
                      <Label>قیمت قبل از تخفیف</Label>
                      <input className="nf" type="text" inputMode="numeric" placeholder="۰" disabled={form.negotiable}
                        value={form.negotiable ? '' : form.oldPrice}
                        onChange={e => set('oldPrice', fmtPrice(e.target.value))} style={inp(errors.oldPrice)} />
                      <ErrMsg msg={errors.oldPrice} />
                    </div>
                  </div>

                  {!form.negotiable && form.price && form.oldPrice && (() => {
                    const p = Number(toAsciiDigits(form.price).replace(/\D/g, ''))
                    const o = Number(toAsciiDigits(form.oldPrice).replace(/\D/g, ''))
                    if (o <= p) return null
                    const d = Math.round((1 - p / o) * 100)
                    return (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.22)', borderRadius: 10 }}>
                        <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>{d}٪</span>
                        <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>تخفیف {d}٪ اعمال می‌شود</span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* ── محل ── */}
            <div style={{ ...card, animation: 'fadeUp 0.54s ease both' }}>
              <div style={gloss} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <SectionTitle>محل کالا</SectionTitle>
                <ProvinceCitySelect
                  value={{ province: form.province, city: form.city }}
                  onChange={v => setForm(f => ({ ...f, province: v.province, city: v.city }))}
                  required provinceError={errors.province} cityError={errors.city}
                />
              </div>
            </div>

            {errors.submit && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#B91C1C', fontSize: 13.5 }}>
                {errors.submit}
              </div>
            )}

            <button type="submit" disabled={submitting}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: submitting ? 'default' : 'pointer',
                background: `linear-gradient(135deg,${GOLD},#A07840)`, color: '#fff', fontSize: 15.5, fontWeight: 800,
                fontFamily: 'Vazirmatn,Tahoma,sans-serif', opacity: submitting ? 0.6 : 1,
                boxShadow: '0 10px 28px rgba(199,166,106,0.38)',
              }}>
              {submitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
