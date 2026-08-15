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

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../../../store/auth.store'
import { uploadFile } from '../../../../lib/supabase'
import { apiFetch } from '../../../../lib/http'
import ProvinceCitySelect from '../../../../components/ProvinceCitySelect'
import { provinceOfCity } from '../../../../lib/iran-geo'
import { compressImage } from '../../../../lib/seller-store'
import { CATEGORY_OPTIONS, CONDITIONS, normalizeCategory, normalizeCondition } from '../../../../lib/market/categories'
import { GENERIC_SPECS, CATEGORY_SPECS } from '../../../../lib/market/specs'
import { withCurrent, TYPE_OPTIONS, brandOptionsFor, modelOptionsFor, isTypeDrivenCategory, withOther } from '../../../../lib/market/chain'
import { modernizeType } from '../../../../lib/market/title'
import { typeIdOf, isAccessoryCategory, isProductCatalog, ACCESSORY_TYPE_OF, type CatalogId } from '../../../../lib/market/catalog-rules'
import CatalogSelector, { EMPTY_CATALOG_VALUE, type CatalogValue, useCatalogType } from '../../../../components/market/CatalogSelector'
import { sizeOptions, SpecFieldRow, SpecProgress, useSpecFields, specKey } from '../../../../components/market/SpecFields'
import { formTypeFieldOf, optionIdOf, splitFields, countFilled, applySpecChange, isFieldLocked, isFieldHidden, typeDependentKeys, fillFromModel, fromLegacyDefs, type SpecField, type LegacySpecDef } from '../../../../lib/market/spec-rules'
import { brandSearchTerms } from '../../../../lib/market/catalog-rules'
import CountryFlag from '../../../../components/CountryFlag'
import {
  GOLD, GOLD_D, TEXT, TEXT_SEC, TEXT_MUT, LQ_BG, LQ_BOR, LQ_SHAD,
  AD_FORM_CSS, inp, type FancyOption, toAsciiDigits, fmtPrice, FancySelect, Label, ErrMsg, SectionTitle, 
  AlertDialog,
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
  /* پیام‌ها وسطِ صفحه می‌آیند، نه نوارِ بالای فرم — همان دلیلِ فرمِ ثبت */
  const [alert, setAlert] = useState<{ title: string; lines: string[] } | null>(null)

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
  const [specs, setSpecs] = useState<Record<string, unknown>>({})
  const [rawSpecs, setRawSpecs] = useState<Record<string, unknown>>({})
  const [specOthers, setSpecOthers] = useState<Record<string, string>>({})
  /* کلیدهایی که در تعریفِ دسته نیستند (داده‌ی قدیمی یا دسته‌ی عوض‌شده).
     حذف نمی‌شوند — وگرنه ویرایشِ یک آگهی، چیزی را که فروشنده وارد
     کرده بی‌صدا می‌بلعد. */
  const [legacySpecs, setLegacySpecs] = useState<{ key: string; value: unknown }[]>([])
  /* انتخابِ چوب و نامِ رشته‌ایِ آگهیِ موجود، تا انتخابگر بتواند
     یک‌بار آن را به شناسه نگاشت کند */
  const [cue, setCue] = useState<CatalogValue>(EMPTY_CATALOG_VALUE)
  const [legacyCue, setLegacyCue] = useState<{ brand: string; model: string } | undefined>(undefined)

  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<ImgSlot[]>([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── هیدراته‌کردنِ فرم از یک رکورد ────────────────────────────
  const hydrate = useCallback((p: Record<string, any>, opts: { local: boolean }) => {
    const category = normalizeCategory(p.category)
    /* نوعِ ذخیره‌شده از همان نگاشتِ نمایش می‌گذرد: «کیس سخت» دقیقاً
       همان «هارد کیس»ِ کاتالوگ است، پس روی گزینه‌ی واقعی می‌نشیند و
       ذخیره‌ی بعدی شناسه‌اش را هم می‌نویسد — نه دو ردیفِ هم‌معنا. */
    const type = modernizeType(String(p.type ?? p.specs?.['نوع'] ?? '').trim())

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

    /* ── مشخصاتِ فنی ──
       تعریفِ فیلدها با fetch می‌آید و ممکن است هنوز نرسیده باشد، پس
       این‌جا فقط مقدارِ **خام** نگه داشته می‌شود و تفکیکِ
       «شناخته‌شده / باقی‌مانده» در یک effect انجام می‌شود که به
       `specDefs` وابسته است.

       ⚠️ نسخه‌ی قبلی این‌جا با فهرستِ قدیمیِ `CATEGORY_SPECS` تفکیک
       می‌کرد. نتیجه‌اش این بود که کلیدهای دسته‌هایی که کاتالوگِ تازه
       ندارند (توپ، تیپ، گچ) «شناخته‌شده» حساب می‌شدند، هیچ‌جا رندر
       نمی‌شدند، در `legacySpecs` هم نبودند — و ذخیره‌ی دوباره
       **پاکشان می‌کرد**. */
    const raw = (p.specs && typeof p.specs === 'object' && !Array.isArray(p.specs))
      ? (p.specs as Record<string, unknown>) : {}
    setRawSpecs(raw)

    setLegacyCue({ brand: rawBrand, model: rawModel })
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
    setCue(EMPTY_CATALOG_VALUE); setLegacyCue(undefined)
  }
  const setType = (v: string) => {
    /* ── فهرست‌های وابسته به نوع پاک می‌شوند ──
       بدونِ پاک‌شدن، `12ft` روی پاکت و قطرِ اسنوکر روی کارامبول
       می‌ماند — دراپ‌داون خالی نشان می‌دهد و سرور ۴۰۰. فهرست از
       خودِ تعریفِ فیلدها می‌آید، نه دستی. */
    setSpecs(s => {
      const n = { ...s }
      for (const k of typeDependentKeys(specDefs, form.category)) delete n[k]
      /* ── نوعی که خودش یک فیلدِ مشخصات است ──
         بالای فرم برچسبِ فارسی انتخاب می‌شود ولی ذخیره‌شدنی شناسه
         است؛ وگرنه صفحه‌ی آگهی و فیلترها مقدار را پیدا نمی‌کنند. */
      if (specTypeField) n[specKey(specTypeField.id)] = optionIdOf(specTypeField, v)
      return n
    })
    setSpecOthers(s => {
      const n = { ...s }
      for (const k of typeDependentKeys(specDefs, form.category)) delete n[k]
      return n
    })
    setForm(f => ({ ...f, type: v, typeOther: '', ...(isTypeDrivenCategory(f.category) ? { brand: '', brandOther: '', model: '', modelOther: '' } : {}) }))
    setErrors(e => { const n = { ...e }; delete n.type; if (isTypeDrivenCategory(form.category)) { delete n.brand; delete n.model } return n })
    /* برندها بینِ نوع‌ها مشترک نیستند و سایزها هم — شناسه‌ی نوعِ
       قبلی روی نوعِ تازه بی‌معناست و سرور ردش می‌کند. */
    setCue(EMPTY_CATALOG_VALUE)
  }
  const setBrand = (v: string) => {
    setForm(f => ({ ...f, brand: v, model: '', modelOther: '' }))
    setErrors(e => { const n = { ...e }; delete n.brand; delete n.model; return n })
  }

  /* چوب از کاتالوگ می‌آید؛ بقیه‌ی دسته‌ها از chain.ts */
  /* ── کدام دسته‌ها کاتالوگ دارند ──
     پنج دسته کاتالوگِ خودشان را دارند و ده دسته‌ی لوازم زیرِ یک
     کاتالوگِ مشترک‌اند که نوعش همان دسته است. */
  /* سوییچِ «پلمب / استفاده‌نشده» — وضعیتِ کالا را قطعی می‌کند */
  const sealed = specs.isSealed === true
  /* ── یک مقدار، نه دو ──
     نمایشِ «نو» بدونِ عوض‌شدنِ خودِ مقدار یعنی فروشنده «نو» می‌دید و
     سرور «کارکرده» ذخیره می‌کرد. همه‌ی مصرف‌کننده‌ها — دراپ‌داون،
     پیش‌نمایش و بدنه‌ی درخواست — از همین یکی می‌خوانند. */
  const effCondition = sealed ? 'new' : form.condition
  const catCategory: CatalogId | null =
    isProductCatalog(form.category) ? form.category
      : isAccessoryCategory(form.category) ? 'accessories' : null
  /* پارچه دو جا هست: کاتالوگِ خودش (برند/مدل) و دسته‌ی لوازم
     (مشخصات). برندش از کاتالوگِ پارچه می‌آید، نه از لوازم. */
  const catTypeId = catCategory === 'accessories'
    ? ACCESSORY_TYPE_OF[form.category] ?? ''
    : catCategory ? typeIdOf(catCategory, form.type) : ''
  /* همان ورودیِ کش‌شده‌ی انتخابگر — درخواستِ تازه‌ای نمی‌زند */
  const catFreeInput = !!useCatalogType(catCategory ?? 'cue', catCategory ? catTypeId : '').data?.forceFreeInput
  const { fields: catalogSpecs, loading: specsLoading } = useSpecFields(form.category)
  /* ── دسته‌هایی که هنوز در کاتالوگ نیستند ──
     تیپ، گچ و کیس تعریفِ دستیِ خودشان را در `specs.ts` دارند. بدونِ
     این پل، فرمشان فقط «وضعیت کالا» نشان می‌داد — همان چیزی که
     انتقال به کاتالوگ بی‌صدا شکسته بود. */
  const specDefs = useMemo(
    () => (catalogSpecs.length
      ? catalogSpecs
      : fromLegacyDefs((CATEGORY_SPECS[form.category] ?? GENERIC_SPECS) as LegacySpecDef[])),
    [catalogSpecs, form.category],
  )
  /* ── «نوع» از کجا می‌آید ──
     شش دسته‌ی کاتالوگ‌دار فهرستشان در `TYPE_OPTIONS` است. ده دسته‌ی
     لوازم ندارند؛ زیرمجموعه‌شان یک **فیلدِ مشخصات** است:
     `case_type` (۶ گزینه)، `bag_type` (۵)، `ext_type`، `rest_type`،
     `oil_type`، `accessory_type` (۲۲).

     ── چرا کیس و کیف هم از این‌جا می‌آیند ──
     تا دیروز `TYPE_OPTIONS` یک فهرستِ چهارتاییِ مشترک برایشان داشت
     که با برچسب‌های کاتالوگ یکی نبود. نتیجه‌اش بی‌صدا بود:
     `optionIdOf` برای برچسبِ بی‌تطبیق رشته‌ی خالی برمی‌گرداند، پس
     هر آگهیِ کیفِ توپ با `bagType: ''` ذخیره می‌شد — هیچ‌کدام از
     «هارد کیس/سافت کیس/کیف/کوله‌پشتی» در `bag_type` نبود.

     فیلد همیشه پیدا می‌شود تا از کارتِ مشخصات برداشته شود؛ فهرست
     فقط وقتی از آن می‌آید که `TYPE_OPTIONS` چیزی نداشته باشد. */
  const specTypeField = formTypeFieldOf(specDefs)
  const typeChoices: string[] | undefined = TYPE_OPTIONS[form.category]
    ? withOther(TYPE_OPTIONS[form.category]!)
    : (specTypeField
      ? [...(specTypeField.options ?? []).map(o => o.label_fa),
        ...(specTypeField.allow_other ? ['سایر'] : [])]
      : undefined)
  /* مقدارِ فعلی همیشه در فهرست می‌ماند — دلیلش در `withCurrent` */
  const typeOptions = withCurrent(typeChoices, form.type)

  /* ── تفکیکِ مقدارِ خام، وقتی تعریفِ فیلدها رسید ──
     هرچه در کاتالوگ نیست دست‌نخورده در `legacySpecs` می‌ماند و
     موقعِ ذخیره عیناً برمی‌گردد — بولین و آرایه هم به رشته تبدیل
     نمی‌شوند، وگرنه `['balls','cues']` می‌شد «balls,cues» و
     دفعه‌ی بعد دیگر آرایه نبود. */
  useEffect(() => {
    const known = new Set(specDefs.map(f => specKey(f.id)))
    const nextSpecs: Record<string, unknown> = {}
    const nextOthers: Record<string, string> = {}
    const leftovers: { key: string; value: unknown }[] = []
    for (const [k, v] of Object.entries(rawSpecs)) {
      if (v === undefined || v === null || v === '') continue
      if (TOP_LEVEL_SPEC_KEYS.includes(k)) continue
      /* کلیدِ جفتِ «سایر» را کنارِ کلیدِ اصلی برمی‌داریم. اگر کلیدِ
         اصلی در کاتالوگ نباشد، این هم باید باقی‌مانده بماند وگرنه
         متنی که فروشنده نوشته بی‌صدا پاک می‌شود. */
      if (k.endsWith('_other')) {
        const base = k.slice(0, -'_other'.length)
        if (!known.has(base)) leftovers.push({ key: k, value: v })
        continue
      }
      if (!known.has(k)) { leftovers.push({ key: k, value: v }); continue }
      const other = rawSpecs[`${k}_other`]
      if (other) { nextSpecs[k] = '__other__'; nextOthers[k] = String(other).trim(); continue }
      /* آگهیِ قدیمی «سایر: متن» ذخیره می‌کرد */
      const s = typeof v === 'string' ? v : ''
      if (s.startsWith('سایر:')) { nextSpecs[k] = '__other__'; nextOthers[k] = s.slice('سایر:'.length).trim(); continue }
      nextSpecs[k] = v
    }
    setSpecs(nextSpecs)
    setSpecOthers(nextOthers)
    setLegacySpecs(leftovers)
  }, [rawSpecs, specDefs])
  const cloth = useCatalogType('cloth', form.category === 'table' ? catTypeId : '')
  const tableCat = useCatalogType('table', form.category === 'table' ? catTypeId : '')
  const tipCat = useCatalogType('tip', form.category === 'tip' ? catTypeId : '')
  /* payloadِ همان دسته‌ای که الان فعال است — برای پر شدنِ خودکار */
  const activeCat = useCatalogType(catCategory ?? 'cue', catCategory ? catTypeId : '')
  const catData = activeCat.data
  const clothBrandId = String(specs.clothBrand ?? '')

  const sourceOptionsFor = (id: string): FancyOption[] | undefined => {
    /* قطرِ تیپ هم `source: types[].sizes` دارد — همان مکانیزمِ
       سایزِ میز، فقط از کاتالوگِ تیپ. */
    if (id === 'diameter' && form.category === 'tip') {
      return sizeOptions(tipCat.data?.sizes)
    }
    /* ── توپ ──
       قطر و «نوع ست» هر دو به نوعِ توپ وابسته‌اند و از همان
       payloadِ فعال می‌آیند؛ منبعشان در JSON نوشته شده. */
    if (form.category === 'ball' && (id === 'diameter_mm' || id === 'set_type')) {
      return sizeOptions(id === 'diameter_mm' ? catData?.sizes : catData?.setTypes)
    }
    if (id === 'size') {
      return sizeOptions(tableCat.data?.sizes)
    }
    if (id === 'cloth_brand') {
      return (cloth.data?.brands ?? []).map(b => ({
        value: b.id, label: b.name_en,
        search: brandSearchTerms(b, b.country ? cloth.data?.countries[b.country]?.fa : '').join(' '),
        node: (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <CountryFlag code={b.country} label={b.country ? cloth.data?.countries[b.country]?.fa ?? '' : 'نامشخص'} />
            <span style={{ fontWeight: 600 }}>{b.name_en}</span>
            <span style={{ fontSize: 12, color: TEXT_MUT }}>{b.name_fa}</span>
          </span>
        ),
      }))
    }
    if (id === 'cloth_model') {
      const br = cloth.data?.brands.find(b => b.id === clothBrandId)
      return (br?.models ?? []).map(m => ({
        value: m.id, label: m.name_en,
        search: `${m.name_en} ${m.name_fa}`,
        node: (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>{m.name_en}</span>
            {m.note_fa && <span style={{ fontSize: 11.5, color: TEXT_MUT }}>{m.note_fa}</span>}
          </span>
        ),
      }))
    }
    return undefined
  }

  /* آبشار از خودِ داده می‌آید: `depends_on` وابسته‌ها را پاک
     می‌کند و `auto_from` مقدارِ خودکار را می‌نشاند. پیش‌تر هر دو
     این‌جا هاردکد بودند و اضافه‌شدنِ وابستگیِ بعدی کد می‌خواست. */
  const onSpecChange = (field: SpecField, v: unknown) => {
    /* ویژگی‌های مدلِ پارچه — منبعِ پر شدنِ خودکارِ نوع و وزن */
    let picked: Record<string, string | undefined> | undefined
    if (field.id === 'cloth_model') {
      const br = cloth.data?.brands.find(b => b.id === clothBrandId)
      const m = br?.models.find(x => x.id === v)
      if (m) picked = { type: m.type, weight_oz: m.weight_oz }
    }
    setSpecs(prev => applySpecChange(specDefs, field, v, prev, picked))
    setErrors(er => { const n = { ...er }; delete n[specKey(field.id)]; return n })
  }

  /* رشته برای نمایش، شناسه برای یکپارچگی — همان قاعده‌ی فرمِ ثبت */
  const onCatalogChange = (v: CatalogValue, labels: { brand: string; model: string }) => {
    /* ── مدلِ کاتالوگ، مشخصات را پر می‌کند ──
       مدلِ تیپ سختی و ساختار و Shore D را با خودش دارد. برند و
       مدل بالای فرم‌اند و هرگز از مسیرِ `onSpecChange` نمی‌گذرند،
       پس این‌جا انجام می‌شود. قفل نمی‌شوند. */
    const picked = v.modelId && v.modelId !== '__other__'
      ? catData?.brands.find(b => b.id === v.brandId)?.models.find(m => m.id === v.modelId)
      : undefined
    setSpecs(prev => fillFromModel(specDefs, prev, picked as Record<string, unknown> | undefined))
    setCue(v)
    setForm(f => ({ ...f, brand: labels.brand, brandOther: '', model: labels.model, modelOther: '' }))
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
    /* ── برندِ اختیاری ──
       نوعی که `force_free_input` دارد («میز خانگی») اغلب برندِ
       مشخصی ندارد؛ اجبار یا آگهی را رها می‌کند یا داده‌ی الکی
       می‌سازد. شرط روی پرچمِ داده است نه شناسه‌ی نوع. */
    if (!effBrand && !catFreeInput) e.brand = "برند الزامی است"
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
  /* ── ساختِ مقدارِ ستونِ specs ──
     شناسه ذخیره می‌شود نه برچسب: بدونش فرمِ ویرایش نمی‌تواند گزینه
     را از روی متنِ فارسی پیدا کند. `legacySpecs` کلیدهایی‌اند که در
     کاتالوگ نیستند و دست‌نخورده منتقل می‌شوند تا چیزی گم نشود. */
  const buildSpecs = () => {
    const out: Record<string, unknown> = { نوع: effType, مدل: effModel }
    /* باقی‌مانده‌ها **اول** ریخته می‌شوند تا حلقه‌ی کاتالوگ رویشان
       بنویسد؛ برعکسش یعنی مقدارِ قدیمی روی چیزی که کاربر همین حالا
       عوض کرده می‌نشیند. */
    legacySpecs.forEach(({ key, value }) => {
      if (typeof value === 'string' ? value.trim() : value !== undefined && value !== null) out[key] = value
    })
    for (const f of specDefs) {
      /* ── فیلدی که دیده نمی‌شود ذخیره هم نمی‌شود ──
         «رنگ توپ» را با نوعِ «تکی» پر کن و بعد نوع را به اسنوکر
         عوض کن: فیلد از فرم می‌رود ولی مقدارش می‌ماند و در صفحه‌ی
         جزئیات ظاهر می‌شود. */
      if (isFieldHidden(f, specs, specDefs, catTypeId)) continue
      const key = specKey(f.id)
      const v = specs[key]
      if (v === undefined || v === null || v === '') continue
      if (f.type === 'boolean') { if (v === true) out[key] = true; continue }
      if (f.type === 'multi_select') { const arr = Array.isArray(v) ? v : []; if (arr.length) out[key] = arr; continue }
      if (v === '__other__') {
        const other = specOthers[key]?.trim()
        if (other) { out[key] = '__other__'; out[`${key}_other`] = other }
        continue
      }
      out[key] = v
    }
    return out
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    /* ── تعریفِ فیلدها هنوز نرسیده ──
       بدونِ آن، حلقه‌ی سریال‌سازی روی آرایه‌ی خالی می‌چرخد و آگهی
       بدونِ هیچ مشخصه‌ای ذخیره می‌شود. روی موبایلِ کند نادر نیست. */
    if (specsLoading) {
      setAlert({ title: 'لحظه‌ای صبر کنید', lines: ['فهرست مشخصات فنی هنوز بارگذاری نشده است.'] })
      return
    }
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setAlert({ title: 'فرم کامل نیست', lines: Object.values(errs) })
      return
    }
    setSubmitting(true)

    const price = Number(toAsciiDigits(form.price).replace(/\D/g, '')) || 0
    const oldRaw = form.oldPrice ? Number(toAsciiDigits(form.oldPrice).replace(/\D/g, '')) : 0
    const old = oldRaw > price ? oldRaw : price
    /* نامِ آگهی دقیقاً مثلِ فرمِ ثبت ساخته می‌شود — «دسته + نوع».
       اگر این‌جا فرقی داشت، ویرایشِ ساده‌ی یک آگهی، عنوانِ کارتش را
       در بازار عوض می‌کرد. */
    /* همان تابعی که فرمِ ثبت استفاده می‌کند — بدونش، ذخیره‌ی دوباره‌ی
       یک آگهیِ قدیمی «اکسسوری …» و «کیس سخت» را برمی‌گرداند روی
       عنوانی که تازه تمیز شده بود. */
    const composedName = modernizeType([catLabel, effType].filter(Boolean).join(' '))
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
            cueType: form.category === 'cue' ? catTypeId || undefined : undefined,
            tableType: form.category === 'table' ? catTypeId || undefined : undefined,
            /* پارچه ستونِ نوع ندارد؛ این فقط برای اعتبارسنجیِ سرور
               است تا بداند برند به کدام رشته تعلق دارد. */
            catalogType: catTypeId || null,
            brandId: catTypeId && cue.brandId !== '__other__' ? cue.brandId : null,
            modelId: catTypeId && cue.modelId !== '__other__' ? cue.modelId : null,
            tableSizeId: form.category === 'table' && specs.size && specs.size !== '__other__' ? String(specs.size) : null,
            tableSizeCustom: form.category === 'table' && specs.size === '__other__' ? (specOthers.size ?? '').trim() || null : null,
            /* پارچه: شناسه کنارِ رشته، مثل برندِ خودِ محصول */
            clothBrandId: form.category === 'table' && specs.clothBrand && specs.clothBrand !== '__other__' ? String(specs.clothBrand) : null,
            clothBrandCustom: form.category === 'table' && specs.clothBrand === '__other__' ? (specOthers.clothBrand ?? '').trim() || null : null,
            clothModelId: form.category === 'table' && specs.clothModel && specs.clothModel !== '__other__' ? String(specs.clothModel) : null,
            clothModelCustom: form.category === 'table' && specs.clothModel === '__other__' ? (specOthers.clothModel ?? '').trim() || null : null,
            description: form.description.trim(), condition: effCondition,
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
            setAlert({ title: 'بارگذاری تصویر انجام نشد', lines: [`تصویر ${i + 1} بالا نرفت؛ دوباره تلاش کنید.`] })
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
            cueType: form.category === 'cue' ? catTypeId || undefined : undefined,
            tableType: form.category === 'table' ? catTypeId || undefined : undefined,
            /* بقیه‌ی کاتالوگ‌ها ستونِ خودشان را ندارند و نوع را از همین
               فیلد می‌گیرند. نبودنش یعنی سرور نوع را نمی‌داند و فیلدهای
               وابسته به نوع را اشتباه می‌سنجد — آگهیِ توپ ویرایش‌ناپذیر
               می‌شد. */
            catalogType: catTypeId || undefined,
            brandId: catTypeId && cue.brandId !== '__other__' ? cue.brandId : null,
            modelId: catTypeId && cue.modelId !== '__other__' ? cue.modelId : null,
            tableSizeId: form.category === 'table' && specs.size && specs.size !== '__other__' ? String(specs.size) : null,
            tableSizeCustom: form.category === 'table' && specs.size === '__other__' ? (specOthers.size ?? '').trim() || null : null,
            price: form.negotiable ? 0 : price,
            old: form.negotiable ? 0 : old,
            negotiable: form.negotiable,
            description: form.description.trim(), condition: effCondition,
            specs: buildSpecs(),
            images: [...existingImages, ...uploaded],
            province: form.province, city: form.city,
          }),
        })
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))

        /* ── خطای فیلد از سرور ──
           سرور برای انتخابِ نامعتبرِ کاتالوگ نقشه‌ی خطا برمی‌گرداند.
           بدونِ نشاندنش روی فیلد، کاربر فقط یک پیامِ کلی می‌دید و
           نمی‌فهمید کدام باکس ایراد دارد. */
        if (j?.errors && typeof j.errors === 'object') {
          setErrors(e => ({ ...e, ...(j.errors as Record<string, string>) }))
        }
          setAlert({ title: 'ویرایش انجام نشد', lines: [j?.message || 'ویرایش آگهی روی سرور انجام نشد'] })
          setSubmitting(false); return
        }
        setSaved(true)
      } catch {
        setAlert({ title: 'خطا در ارتباط با سرور', lines: ['ارتباط برقرار نشد؛ دوباره تلاش کنید.'] })
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

  const HIDE_SPEC = new Set(['brand', 'model', 'cue_type', 'table_type', 'condition'])
  /* فیلدی که بالای فرم پرسیده شد این‌جا تکرار نمی‌شود */
  const usableSpecs = specDefs.filter(f => !HIDE_SPEC.has(f.id) && f.id !== specTypeField?.id)
                  /* فیلدی که شرطش برقرار نیست اصلاً رندر نمی‌شود —
                     «تعداد لایه» برای تیپِ تک‌لایه و «نوع نگهدارنده»
                     وقتی نگهدارنده‌ای نیست. از شمارشِ پیشرفت هم بیرون
                     است، وگرنه هدفی شمرده می‌شد که دیده نمی‌شود. */
                  /* وابستگی از `specDefs` — دلیلش در فرمِ ثبت */
                  const shown = usableSpecs.filter(f => !isFieldHidden(f, specs, specDefs, catTypeId))
                  const { main: mainSpecs, toggles: toggleSpecs } = splitFields(shown)
  const specProgress = countFilled(shown, specs)

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

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: 'clamp(18px,3vw,32px) clamp(14px,3vw,28px) 80px' }}>

          {/* ── راهِ برگشت ── */}
          <div style={{ marginTop: -6, marginBottom: 20 }}>
            <Link href="/dashboard/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.2, color: TEXT_SEC, textDecoration: 'none', padding: '7px 12.5px', borderRadius: 10, background: LQ_BG, border: LQ_BOR, boxShadow: LQ_SHAD, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <ChevronRight size={13.5} />
              بازگشت به آگهی‌های من
            </Link>
          </div>

          <div style={{ marginBottom: 16, animation: 'fadeUp 0.4s ease both' }}>
            {/* «EDIT LISTING» و سطرِ خلاصه‌ی محصول برداشته شدند: روی
                موبایل فقط ارتفاع می‌گرفتند و همان اطلاعات چند سانتیمتر
                پایین‌تر داخلِ خودِ فیلدها هست. */}
            <h1 style={{ fontSize: 'clamp(19px,2.6vw,26px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>ویرایش آگهی</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="ad-cols" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── دسته / نوع / برند / مدل ── */}
            <div className="span-cols" style={{ ...card, animation: 'fadeUp 0.44s ease both' }}>
              <div style={gloss} />
              <SectionTitle>اطلاعات محصول</SectionTitle>
              <div className="info-grid" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>

                <div>
                  <Label required>دسته‌بندی</Label>
                  <FancySelect value={form.category} onChange={handleCategoryChange}
                    options={CATEGORY_OPTIONS.map(c => ({
                      value: c.id, label: c.label, search: c.label,
                      node: (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                          <img src={c.img} alt="" width={22} height={22} loading="lazy" decoding="async"
                            style={{ borderRadius: 5, flexShrink: 0, objectFit: 'contain' }} />
                          <span style={{ fontWeight: 600 }}>{c.label}</span>
                        </span>
                      ),
                    }))}
                    placeholder="انتخاب دسته‌بندی..." error={!!errors.category} />
                  <ErrMsg msg={errors.category} />
                </div>

                <div>
                  <Label required>نوع</Label>
                  {/* ── چرا `specsLoading` هم شرط است ──
                          فهرستِ نوعِ دسته‌های لوازم از `/api/specs` می‌آید. تا
                          نرسیدنش `typeOptions` تهی است و این فیلد به متنِ آزاد
                          می‌افتاد — یعنی کاربرِ تندنویس می‌توانست نوعی بنویسد که
                          در هیچ فهرستی نیست و شناسه‌اش خالی ذخیره شود. */}
                      {form.category && (typeOptions || specsLoading) ? (
                    <FancySelect value={form.type} onChange={setType}
                      options={(typeOptions ?? []).map(o => ({ value: o, label: o }))}
                      disabled={!typeOptions}
                          placeholder={typeOptions ? 'انتخاب نوع...' : 'در حال بارگذاری…'} error={!!errors.type} />
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

                {/* ── چوب: انتخابگرِ کاتالوگ ──
                    همان کامپوننتی که فرمِ ثبت دارد. اگر این‌جا نسخه‌ی
                    دیگری می‌گذاشتیم، دقیقاً همان دو-فرمِ ناهمگونی
                    ساخته می‌شد که هفته‌ی پیش یکی‌اش کردیم. */}
                {catCategory && catTypeId ? (
                  <CatalogSelector
                    category={catCategory}
                    type={catTypeId}
                    value={cue}
                    onChange={onCatalogChange}
                    errors={errors}
                    resolveFrom={legacyCue}
                  />
                ) : (
                <>
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
                </>
                )}

              </div>
            </div>

            {/* ── مشخصات فنی + وضعیت + توضیحات ── */}
            <div key={form.category || 'no-cat'} className="span-cols" style={{ ...card, animation: 'fadeIn 0.35s ease both' }}>
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
                    {mainSpecs.map(field => (
                      <SpecFieldRow
                        key={`${form.category}-${field.id}`}
                        field={field}
                        value={specs[specKey(field.id)]}
                        otherValue={specOthers[specKey(field.id)] ?? ''}
                        error={errors[specKey(field.id)]}
                        sourceOptions={sourceOptionsFor(field.id)}
                        disabled={isFieldLocked(field, specs, !!catTypeId)}
                        onChange={v => onSpecChange(field, v)}
                        onOtherChange={v => setSpecOthers(s => ({ ...s, [specKey(field.id)]: v }))}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '11px 14px', background: 'rgba(199,166,106,0.07)', border: '1px solid rgba(199,166,106,0.20)', borderRadius: 10, marginBottom: 18 }}>
                    <p style={{ fontSize: 13, color: TEXT_MUT, margin: 0 }}>⬆ ابتدا دسته‌بندی را انتخاب کنید تا مشخصات فنی نمایش یابد</p>
                  </div>
                )}

                {toggleSpecs.length > 0 && (
                  <>
                    <div style={{ height: 1, background: 'rgba(28,28,26,0.08)', margin: '4px 0 14px' }} />
                    <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
                      {toggleSpecs.map(field => (
                        <SpecFieldRow
                          key={`${form.category}-${field.id}`}
                          field={field}
                          value={specs[specKey(field.id)] === true}
                          onChange={v => onSpecChange(field, v)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {specDefs.length > 0 && (
                  <SpecProgress filled={specProgress.filled} total={specProgress.total} />
                )}

                {/* ── مشخصاتی که در تعریفِ این دسته نیستند ──
                    آگهی‌های قدیمی (یا آگهی‌ای که دسته‌اش عوض شده) کلیدهایی
                    دارند که فرم نمی‌شناسد. نشان‌ندادنشان یعنی ذخیره‌ی بعدی
                    پاکشان می‌کند. */}
                {legacySpecs.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <Label>مشخصات ثبت‌شده‌ی دیگر</Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {legacySpecs.map((row, i) => {
                        /* بولین و آرایه در فیلدِ متنی ویرایش‌پذیر
                           نیستند: تبدیلشان به رشته داده را نابود
                           می‌کند. فقط نشان داده می‌شوند و می‌شود
                           حذفشان کرد. */
                        const editable = typeof row.value === 'string' || typeof row.value === 'number'
                        return (
                        <div key={`${row.key}-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ minWidth: 120, fontSize: 12.5, color: TEXT_SEC, fontWeight: 700 }}>{row.key}</span>
                          {editable ? (
                            <input className="nf" type="text" value={String(row.value)}
                              onChange={e => setLegacySpecs(list => list.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                              style={{ ...inp(), flex: 1 }} />
                          ) : (
                            <span style={{ flex: 1, fontSize: 12.5, color: TEXT_MUT }}>
                              {Array.isArray(row.value) ? row.value.join('، ') : String(row.value)}
                            </span>
                          )}
                          <button type="button" onClick={() => setLegacySpecs(list => list.filter((_, j) => j !== i))}
                            title="حذف این مشخصه" aria-label={`حذف ${row.key}`}
                            style={{ border: 'none', background: 'transparent', color: TEXT_MUT, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
                        </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div style={{ height: 1, background: 'rgba(28,28,26,0.08)', margin: '4px 0 18px' }} />

                <div style={{ marginBottom: 16 }}>
                  <Label required>وضعیت کالا</Label>
                  {/* ── پلمب ⇒ وضعیت قطعی است ──
                      کالای پلمب و استفاده‌نشده به تعریف «نو» است؛ پرسیدنِ دوباره‌اش
                      یعنی فروشنده می‌تواند «کارکرده»ی پلمب‌شده ثبت کند. با روشن‌شدنِ
                      آن سوییچ، این فیلد روی «نو» می‌نشیند و غیرفعال می‌شود. */}
                  <FancySelect value={effCondition}
                    onChange={v => set('condition', v)} disabled={sealed}
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
                    <span style={{ fontSize: 11.5, color: '#6F6A5C' }}>— روی آگهی «توافقی» نوشته می‌شود</span>
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

            {/* دو دکمه‌ی هم‌اندازه در یک سطر — مثلِ فرمِ ثبت */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
              <button type="submit" disabled={submitting}
                style={{
                  flex: 1, minWidth: 0, padding: '12px 10px', borderRadius: 13, cursor: submitting ? 'not-allowed' : 'pointer',
                  border: `1.5px solid ${GOLD}`, background: 'rgba(199,166,106,0.14)',
                  color: GOLD_D, fontSize: 14, fontWeight: 800, fontFamily: 'Vazirmatn,Tahoma,sans-serif',
                  opacity: submitting ? 0.65 : 1, boxShadow: '0 5px 18px rgba(199,166,106,0.20), inset 0 1px 0 rgba(255,255,255,0.55)',
                }}>
                {submitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
              <Link href="/dashboard/shop" style={{
                flex: 1, minWidth: 0, padding: '12px 10px', borderRadius: 13, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.88)', background: 'rgba(255,255,255,0.78)',
                color: TEXT_SEC, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 4px 14px rgba(0,0,0,0.06)',
              }}>انصراف</Link>
            </div>
          </form>

          <AlertDialog
            open={!!alert}
            title={alert?.title ?? ''}
            lines={alert?.lines ?? []}
            onClose={() => setAlert(null)}
          />
        </div>
      </div>
    </>
  )
}
