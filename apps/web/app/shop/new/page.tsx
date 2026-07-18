'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useAuthStore } from '../../../store/auth.store'
import { findSellerByOwner } from '../../../lib/seller-store'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'

const GOLD     = '#C7A66A'
const GOLD_D   = '#9A6E38'
const TEXT     = '#1C1C1A'
const TEXT_SEC = 'rgba(28,28,26,0.52)'
const TEXT_MUT = 'rgba(28,28,26,0.30)'
const LQ_BG    = 'rgba(255,255,255,0.82)'
const LQ_BOR   = '1px solid rgba(255,255,255,0.85)'
const LQ_SHAD  = 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)'
const ERR      = '#EF4444'

const CATEGORIES = [
  { id: 'cue',       label: 'چوب'        },
  { id: 'table',     label: 'میز'        },
  { id: 'ball',      label: 'توپ'        },
  { id: 'tip',       label: 'تیپ'        },
  { id: 'chalk',     label: 'گچ'         },
  { id: 'extension', label: 'اکستنشن'    },
  { id: 'case-bag',  label: 'کیس و کیف'  },
  { id: 'rest',      label: 'رست'        },
  { id: 'cloth',     label: 'پارچه'      },
  { id: 'oil',       label: 'روغن'       },
  { id: 'towel',     label: 'حوله'       },
  { id: 'clothing',  label: 'پوشاک'      },
  { id: 'accessory', label: 'اکسسوری'    },
  { id: 'other',     label: 'سایر'       },
]

// شهر/استان از ProvinceCitySelect می‌آید — لیست هاردکد حذف شد (single source of truth)

// ── Spec field definitions ─────────────────────────────────────
interface SpecFieldDef {
  key: string; label: string
  type: 'dropdown' | 'number' | 'text'
  options?: string[]; unit?: string; placeholder?: string; wide?: boolean
  dependsOn?: string                              // key of the field this field's options depend on
  optionsByDependency?: Record<string, string[]>  // options for each value of dependsOn
}

const GENERIC_SPECS: SpecFieldDef[] = [
  { key: 'brand',     label: 'برند',   type: 'text',     placeholder: 'نام برند' },
  { key: 'condition', label: 'وضعیت', type: 'dropdown', options: ['نو','کارکرده'] },
]

const CATEGORY_SPECS: Record<string, SpecFieldDef[]> = {
  cue: [
    { key: 'cueType', label: 'نوع', type: 'dropdown', options: ['پاکت بیلیارد','اسنوکر','هی‌بال','کارامبول','سایر'] },
    {
      key: 'brand', label: 'برند', type: 'dropdown',
      dependsOn: 'cueType',
      optionsByDependency: {
        'اسنوکر':         ['John Parris','Trevor White','Robert Osborne','Will Hunt','Peradon','Riley','Riley Burwat','BCE','PowerGlide','Cue Craft','Cannon','O\'Min','Phoenix','Master Cue','Dufferin','سایر'],
        'پاکت بیلیارد':  ['Predator','Mezz','McDermott','Meucci','Pechauer','Cuetec','Lucasi','Viking','Jacoby','Schon','Joss','Players','Poison','Action','Griffin','سایر'],
        'هی‌بال':         ['Mezz','Predator','McDermott','Lucasi','Players','سایر'],
        'کارامبول':       ['Joosep','Longoni','Predac','Fury','سایر'],
      },
    },
    { key: 'length',        label: 'طول',           type: 'number',   unit: 'سانتیمتر', placeholder: '147' },
    { key: 'weight',        label: 'وزن',           type: 'number',   unit: 'اونس',      placeholder: '19' },
    { key: 'tipDiameter',   label: 'قطر تیپ',       type: 'number',   unit: 'میلیمتر',  placeholder: '13' },
    { key: 'buttDiameter',  label: 'قطر بات',       type: 'number',   unit: 'میلیمتر',  placeholder: '30' },
    { key: 'shaftMaterial', label: 'جنس شفت',       type: 'dropdown', options: ['چوب افرا','کربن فایبر','ترکیبی','سایر'] },
    { key: 'tipType',       label: 'نوع تیپ',       type: 'text',     placeholder: 'مثال: Kamui Black' },
    { key: 'pieces',        label: 'تعداد تکه',     type: 'dropdown', options: ['یک تکه','دو تکه'] },
    { key: 'condition',     label: 'وضعیت',         type: 'dropdown', options: ['نو','کارکرده'] },
  ],
  table: [
    { key: 'tableType',      label: 'نوع',          type: 'dropdown', options: ['پاکت بیلیارد','اسنوکر','هی‌بال','کارامبول','خانگی'] },
    { key: 'size',           label: 'اندازه',       type: 'dropdown', options: ['۷ فوت','۸ فوت','۹ فوت','۱۰ فوت','۱۲ فوت'] },
    { key: 'bodyMaterial',   label: 'جنس بدنه',     type: 'dropdown', options: ['اسلیت','MDF','چوب ماسیو','سایر'] },
    { key: 'slateThickness', label: 'ضخامت سنگ',   type: 'number',   unit: 'میلیمتر', placeholder: '45' },
    { key: 'clothType',      label: 'نوع پارچه',    type: 'dropdown', options: ['وُرستد','پشم','نایلون','سایر'] },
    { key: 'clothColor',     label: 'رنگ پارچه',    type: 'dropdown', options: ['سبز','آبی','قرمز','طوسی','سایر'] },
    { key: 'cushionType',    label: 'نوع باند',      type: 'dropdown', options: ['گوم طبیعی','سینتتیک','سایر'] },
    { key: 'brand',          label: 'برند',          type: 'dropdown', options: ['استار','شندر','ویراکا','لوتوس','برونزویک','دایموند','سایر'] },
    { key: 'model',          label: 'مدل',           type: 'text',     placeholder: 'مثال: Gold Crown VI', wide: true },
    { key: 'condition',      label: 'وضعیت',         type: 'dropdown', options: ['نو','کارکرده'] },
  ],
  ball: [
    { key: 'brand',     label: 'برند',      type: 'dropdown', options: ['آرامیت','سیکلوپ','سایر'] },
    { key: 'setType',   label: 'نوع ست',    type: 'dropdown', options: ['۱۵ تایی پاکت بیلیارد','۲۲ تایی اسنوکر','۳ تایی کارامبول','سایر'] },
    { key: 'diameter',  label: 'قطر',       type: 'number',   unit: 'میلیمتر', placeholder: '57.2' },
    { key: 'material',  label: 'جنس',       type: 'dropdown', options: ['فنولیک رزین','پلی‌استر','سایر'] },
    { key: 'condition', label: 'وضعیت',     type: 'dropdown', options: ['نو','کارکرده'] },
  ],
  tip: [
    { key: 'brand',        label: 'برند',          type: 'dropdown', options: ['Kamui','Taom','Moori','Elk Master','Tiger','Triangle','Le Pro','Predator','HOW Tips','Nili','سایر'] },
    { key: 'model',        label: 'مدل',            type: 'text',     placeholder: 'مثال: Kamui Black' },
    { key: 'diameter',     label: 'قطر',            type: 'dropdown', options: ['۹','۱۰','۱۱','۱۲','۱۲.۵','۱۳','۱۳.۵','۱۴ میلیمتر'] },
    { key: 'hardness',     label: 'سختی',           type: 'dropdown', options: ['خیلی نرم','نرم','متوسط','سخت','خیلی سخت'] },
    { key: 'tipType',      label: 'نوع',            type: 'dropdown', options: ['تک لایه چرم','چندلایه چرم','سینتتیک','فنولیک'] },
    { key: 'leatherType',  label: 'جنس چرم',        type: 'dropdown', options: ['چرم خوک','چرم گاو','چرم بوفالو','سایر'] },
    { key: 'layers',       label: 'تعداد لایه',     type: 'number',   placeholder: '1' },
    { key: 'packageCount', label: 'تعداد در بسته',  type: 'dropdown', options: ['تک فروشی','۵ عددی','۱۰ عددی'] },
  ],
  chalk: [
    { key: 'brand',        label: 'برند',          type: 'dropdown', options: ['Master','Predator','Taom','Triangle','Silver Cup','سایر'] },
    { key: 'packageCount', label: 'تعداد در بسته', type: 'dropdown', options: ['تک فروشی','۵ عددی','۱۲ عددی','۱۴۴ عددی'] },
    { key: 'color',        label: 'رنگ',           type: 'dropdown', options: ['آبی','سبز','سایر'] },
  ],
  'case-bag': [
    { key: 'caseType',  label: 'نوع',     type: 'dropdown', options: ['کیس سخت','کیس نرم','کیف','کوله‌پشتی'] },
    { key: 'capacity',  label: 'ظرفیت',  type: 'dropdown', options: ['۱×۱','۲×۲','۲×۴','۳×۵','۴×۸'] },
    { key: 'material',  label: 'جنس',    type: 'dropdown', options: ['چرم طبیعی','چرم مصنوعی','نایلون','سایر'] },
    { key: 'brand',     label: 'برند',   type: 'text',     placeholder: 'نام برند' },
    { key: 'condition', label: 'وضعیت', type: 'dropdown', options: ['نو','کارکرده'] },
  ],
}

function SpecField({ field, value, otherValue, onChange, onOtherChange, dependencyValue }: {
  field: SpecFieldDef; value: string; otherValue: string
  onChange: (v: string) => void; onOtherChange: (v: string) => void
  dependencyValue?: string
}) {
  const hasDep   = Boolean(field.dependsOn)
  // cueType === 'سایر' → free-text input for brand
  const depOther = hasDep && dependencyValue === 'سایر'
  // no cueType selected yet → disable the brand dropdown
  const noDepYet = hasDep && !dependencyValue

  // resolve the correct options list
  const resolvedOptions: string[] =
    hasDep && field.optionsByDependency && dependencyValue && !depOther
      ? field.optionsByDependency[dependencyValue] ?? []
      : field.options ?? []

  const effectiveType = depOther ? 'text' : field.type
  const showOther = effectiveType === 'dropdown' && resolvedOptions.includes('سایر') && value === 'سایر'
  const labelText = field.unit ? `${field.label} (${field.unit})` : field.label

  return (
    <div style={{ gridColumn: field.wide ? '1 / -1' : undefined }}>
      <Label optional>{labelText}</Label>

      {/* Wrap in a keyed div so the fade-in triggers every time dependency changes */}
      <div key={`dep-${dependencyValue ?? '__none__'}`}
        style={{ animation: hasDep ? 'fadeIn 0.25s ease both' : undefined }}>

        {effectiveType === 'dropdown' ? (
          <select className="nf" value={value} onChange={e => onChange(e.target.value)}
            disabled={noDepYet}
            style={sel(undefined, noDepYet)}>
            <option value="">{noDepYet ? 'ابتدا نوع را انتخاب کنید' : 'انتخاب...'}</option>
            {resolvedOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : effectiveType === 'number' ? (
          <input className="nf" type="number" placeholder={field.placeholder ?? ''} value={value}
            onChange={e => onChange(e.target.value)}
            style={{ ...inp(), direction: 'ltr', textAlign: 'right' }} />
        ) : (
          <input className="nf" type="text"
            placeholder={depOther ? 'نام برند را وارد کنید...' : (field.placeholder ?? '')}
            value={depOther ? otherValue : value}
            onChange={e => depOther ? onOtherChange(e.target.value) : onChange(e.target.value)}
            style={{ ...inp(), ...(depOther ? { background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' } : {}) }} />
        )}

        {showOther && (
          <div style={{ marginTop: 8, animation: 'fadeIn 0.25s ease both' }}>
            <input className="nf" type="text" placeholder="لطفاً توضیح دهید..." value={otherValue}
              onChange={e => onOtherChange(e.target.value)}
              style={{ ...inp(), background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
          </div>
        )}
      </div>
    </div>
  )
}

// parse Persian/Arabic numerals → pure digits
function toAsciiDigits(s: string) {
  return s.replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0))
         .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
}

function fmtPrice(v: string) {
  const n = toAsciiDigits(v).replace(/\D/g, '')
  return n ? Number(n).toLocaleString('fa-IR') : ''
}

// ── Shared input style ─────────────────────────────────────────
function inp(err?: string, locked?: boolean): React.CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px', borderRadius: 11, fontSize: 14.5,
    border: `1.5px solid ${err ? ERR : locked ? 'rgba(199,166,106,0.32)' : 'rgba(28,28,26,0.13)'}`,
    background: locked ? 'rgba(199,166,106,0.06)' : '#FAFAFA',
    color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif',
    outline: 'none', direction: 'rtl',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    cursor: locked ? 'default' : undefined,
  }
}

// ── Modern select style ─────────────────────────────────────────
function sel(err?: string, disabled?: boolean): React.CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box' as const,
    padding: '12px 14px 12px 38px', borderRadius: 11, fontSize: 14.5,
    border: `1.5px solid ${err ? ERR : disabled ? 'rgba(28,28,26,0.07)' : 'rgba(28,28,26,0.13)'}`,
    background: disabled ? 'rgba(28,28,26,0.03)' : '#FAFAFA',
    color: disabled ? 'rgba(28,28,26,0.30)' : TEXT,
    fontFamily: 'Vazirmatn,Tahoma,sans-serif',
    outline: 'none', direction: 'rtl',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    appearance: 'none' as any, WebkitAppearance: 'none' as any,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C7A66A' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'left 12px center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
  }
}

function Label({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 7 }}>
      {children}
      {required && <span style={{ color: ERR, marginRight: 3 }}>*</span>}
      {optional && <span style={{ fontSize: 11, fontWeight: 400, color: TEXT_MUT, marginRight: 4 }}>(اختیاری)</span>}
    </label>
  )
}

function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p style={{ fontSize: 12, color: ERR, marginTop: 4, margin: '4px 0 0' }}>{msg}</p>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 22px', display: 'flex', alignItems: 'center', gap: 9, position: 'relative', zIndex: 1 }}>
      <span style={{ width: 3, height: 17, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, flexShrink: 0, display: 'inline-block' }} />
      {children}
    </h2>
  )
}

// ── Image slot ────────────────────────────────────────────────
interface ImgSlot { data: string; name: string }

// ── Main Page ─────────────────────────────────────────────────
export default function NewProductPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', category: '', price: '', oldPrice: '',
    description: '', brand: '', condition: 'new',
    shopName: '', ownerName: '', sellerPhone: '', sellerWhatsapp: '',
    province: '', city: '', address: '',
  })
  const [images,   setImages]   = useState<ImgSlot[]>([])
  const [dragging, setDragging] = useState(false)
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [success,  setSuccess]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [specs,     setSpecs]     = useState<Record<string, string>>({})
  const [specOthers, setSpecOthers] = useState<Record<string, string>>({})

  const { user } = useAuthStore()
  const [shopNameLocked,  setShopNameLocked]  = useState(false)
  const [ownerNameLocked, setOwnerNameLocked] = useState(false)

  useEffect(() => {
    if (!user) return
    const u = user as any
    const authName = [u.firstName || '', u.lastName || ''].filter(Boolean).join(' ') || u.name || ''
    /* فروشگاهِ ثبت‌شده‌ی همین فروشنده — منبعِ نامِ فروشگاه/شهر/آدرس/تماس روی فرم محصول */
    const store = findSellerByOwner(u.phone ?? '')

    // نام فروشگاه: از پروفایلِ فروشگاه، وگرنه از حساب. قفل — روی محصول قابل تغییر نیست.
    const autoName = store?.title || u.shopName || authName
    if (autoName) { setForm(f => ({ ...f, shopName: autoName })); setShopNameLocked(true) }

    // نام مالک: همان نامِ احرازشده. قفل.
    const autoOwner = store?.ownerName || authName || u.ownerName || ''
    if (autoOwner) { setForm(f => ({ ...f, ownerName: autoOwner })); setOwnerNameLocked(true) }

    // استان/شهر/آدرس/تماس: از همان فروشگاه پیش‌پر می‌شوند (قابل ویرایش)
    if (store) {
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

  const set = (k: keyof typeof form, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const handleCategoryChange = (cat: string) => {
    set('category', cat)
    setSpecs({})
    setSpecOthers({})
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
          ? [...prev, { data: ev.target?.result as string, name: file.name }]
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
    if (!form.name.trim())        e.name        = 'نام محصول الزامی است'
    if (!form.category)           e.category    = 'دسته‌بندی را انتخاب کنید'
    if (!form.price)              e.price       = 'قیمت الزامی است'
    if (!form.shopName.trim())    e.shopName    = 'نام فروشگاه | فروشنده الزامی است'
    if (!form.sellerPhone.trim()) e.sellerPhone = 'شماره تماس الزامی است'
    else if (!/^(\+98|0)9\d{9}$/.test(form.sellerPhone.trim()))
      e.sellerPhone = 'شماره موبایل معتبر وارد کنید (09xxxxxxxxx)'
    if (!form.province)           e.province    = 'استان را انتخاب کنید'
    if (!form.city)               e.city        = 'شهر را انتخاب کنید'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)

    const rawPrice = Number(toAsciiDigits(form.price).replace(/\D/g, ''))
    const rawOld   = form.oldPrice ? Number(toAsciiDigits(form.oldPrice).replace(/\D/g, '')) : rawPrice
    const disc     = rawOld > rawPrice ? Math.round((1 - rawPrice / rawOld) * 100) : 0
    const imgList  = images.map(i => i.data)

    const finalSpecs: Record<string, string> = {}
    Object.entries(specs).forEach(([k, v]) => {
      if (v === 'سایر' && specOthers[k]) finalSpecs[k] = `سایر: ${specOthers[k]}`
      else if (v) finalSpecs[k] = v
    })

    const product = {
      id: Date.now(),
      img:       imgList[0] ?? '/images/shop/cue_billiard_2.jpg',
      images:    imgList.length > 0 ? imgList : ['/images/shop/cue_billiard_2.jpg'],
      name:      form.name.trim(),
      category:  form.category,
      price:     rawPrice,
      old:       rawOld,
      disc,
      description:    form.description.trim(),
      brand:          form.brand.trim(),
      condition:      form.condition,
      specs:          finalSpecs,
      sellerName:     form.shopName.trim(),
      ownerName:      form.ownerName.trim(),
      sellerPhone:    form.sellerPhone.trim(),
      sellerWhatsapp: (form.sellerWhatsapp.trim() || form.sellerPhone.trim()).replace(/^0/, '98'),
      sellerProvince: form.province,
      sellerCity:     form.city,
      address:        form.address.trim(),
    }

    try {
      const existing = JSON.parse(localStorage.getItem('userProducts') ?? '[]')
      localStorage.setItem('userProducts', JSON.stringify([product, ...existing]))
    } catch { /* ignore */ }

    setSuccess(true)
    setTimeout(() => router.push('/shop'), 2000)
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
        <h2 style={{ fontSize: 24, fontWeight: 900, color: TEXT, marginBottom: 10 }}>محصول با موفقیت ثبت شد!</h2>
        <p style={{ fontSize: 15, color: TEXT_SEC, marginBottom: 24 }}>در حال انتقال به فروشگاه...</p>
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: 0.3 + i * 0.35, animation: `pulse 1s ${i * 0.25}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes popIn { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.4)} }
      `}</style>
    </div>
  )

  const catLabel = CATEGORIES.find(c => c.id === form.category)?.label ?? ''

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        * { box-sizing: border-box; }
        .nf:focus { border-color: ${GOLD} !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.14) !important; }
        .nf::placeholder { color: rgba(28,28,26,0.28); }
        .drop-area { transition: border-color 0.2s, background 0.2s, transform 0.15s; }
        .drop-area:hover { border-color: ${GOLD} !important; background: rgba(199,166,106,0.04) !important; }
        .img-thumb { transition: transform 0.2s, box-shadow 0.2s; }
        .img-thumb:hover { transform: scale(1.04); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
        .cond-btn { transition: all 0.2s; cursor: pointer; }
        .cond-btn:hover { border-color: ${GOLD} !important; }
        @media(max-width:820px) { .two-col { grid-template-columns: 1fr !important; } .spec-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT }}>

        {/* ambient blobs */}
        <div style={{ position: 'fixed', top: -120, right: -80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(199,166,106,0.08) 0%,transparent 65%)', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: -100, left: -60, width: 400, height: 400, background: 'radial-gradient(circle,rgba(199,166,106,0.05) 0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px) 80px' }}>

          {/* ── Top nav ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
            <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: TEXT_SEC, textDecoration: 'none', padding: '8px 14px', borderRadius: 11, background: LQ_BG, border: LQ_BOR, boxShadow: LQ_SHAD, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.color = TEXT_SEC)}>
              <ChevronLeft size={15} />
              بازگشت به فروشگاه
            </Link>
          </div>

          {/* ── Page Header ── */}
          <div style={{ marginBottom: 40, animation: 'fadeUp 0.4s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${GOLD},#A07840)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px rgba(199,166,106,0.36)` }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 11, color: GOLD, letterSpacing: '0.2em', fontWeight: 700, margin: '0 0 2px' }}>NEW PRODUCT</p>
                <h1 style={{ fontSize: 'clamp(21px,2.8vw,28px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>ثبت محصول جدید</h1>
              </div>
              {/* «ذخیره خودکار فعال» — کنارِ عنوان (قبلاً گوشه‌ی بالا بود و دیده نمی‌شد) */}
              <div style={{ marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: GOLD_D, background: LQ_BG, border: LQ_BOR, boxShadow: LQ_SHAD, borderRadius: 20, padding: '6px 13px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                <span>ذخیره خودکار فعال</span>
              </div>
            </div>
            <p style={{ fontSize: 14.5, color: TEXT_SEC, margin: '0 0 0 54px', lineHeight: 1.6 }}>
              محصول خود را در بیلیارد هاب معرفی کنید و مستقیماً با خریداران در ارتباط باشید
            </p>
          </div>

          {/* ── Steps indicator ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, animation: 'fadeUp 0.45s ease both' }}>
            {[{ n: '۱', t: 'اطلاعات محصول' }, { n: '۲', t: 'اطلاعات فروشنده' }, { n: '۳', t: 'ثبت نهایی' }].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: i < 2 ? `rgba(199,166,106,0.10)` : 'rgba(28,28,26,0.05)', border: `1px solid ${i < 2 ? 'rgba(199,166,106,0.28)' : 'rgba(28,28,26,0.08)'}` }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: i < 2 ? `linear-gradient(135deg,${GOLD},#A07840)` : 'rgba(28,28,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: i < 2 ? '#fff' : TEXT_MUT, flexShrink: 0 }}>{s.n}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: i < 2 ? GOLD : TEXT_MUT }}>{s.t}</span>
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

                    {/* name */}
                    <div>
                      <Label required>نام محصول</Label>
                      <input className="nf" type="text" placeholder="مثال: چوب حرفه‌ای Predator 314³" value={form.name} onChange={e => set('name', e.target.value)} style={inp(errors.name)} />
                      <ErrMsg msg={errors.name} />
                    </div>

                    {/* category — full width */}
                    <div>
                      <Label required>دسته‌بندی</Label>
                      <select className="nf" value={form.category} onChange={e => handleCategoryChange(e.target.value)} style={sel(errors.category)}>
                        <option value="">انتخاب...</option>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                      <ErrMsg msg={errors.category} />
                    </div>

                  </div>
                </div>

                {/* card: specs + condition + description — always visible */}
                {(() => {
                  const currentSpecs = form.category ? (CATEGORY_SPECS[form.category] ?? GENERIC_SPECS) : []
                  const specFields = currentSpecs.filter(f => f.key !== 'condition')
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

                        {/* condition */}
                        <div style={{ marginBottom: 16 }}>
                          <Label required>وضعیت کالا</Label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {([
                              ['new',      'نو',       '🟢'],
                              ['like-new', 'در حد نو', '🔵'],
                              ['used',     'کارکرده',  '🟡'],
                            ] as [string,string,string][]).map(([val, lbl, icon]) => (
                              <button key={val} type="button" className="cond-btn" onClick={() => set('condition', val)} style={{ flex: 1, padding: '10px 6px', borderRadius: 11, border: `1px solid ${form.condition === val ? GOLD : 'rgba(199,166,106,0.22)'}`, background: form.condition === val ? 'rgba(199,166,106,0.15)' : 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px) saturate(200%)', WebkitBackdropFilter: 'blur(16px) saturate(200%)', boxShadow: form.condition === val ? `0 4px 16px rgba(199,166,106,0.28), inset 0 1px 0 rgba(255,255,255,0.60)` : 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.04)', fontSize: 13, fontWeight: 700, color: form.condition === val ? GOLD_D : TEXT_SEC, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
                                <span style={{ fontSize: 15 }}>{icon}</span>
                                {lbl}
                              </button>
                            ))}
                          </div>
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
                            <img src={img.data} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <Label required>قیمت (تومان)</Label>
                          <input className="nf" type="text" inputMode="numeric" placeholder="۰" value={form.price} onChange={e => set('price', fmtPrice(e.target.value))} style={inp(errors.price)} />
                          <ErrMsg msg={errors.price} />
                        </div>
                        <div>
                          <Label optional>قیمت قبل از تخفیف</Label>
                          <input className="nf" type="text" inputMode="numeric" placeholder="۰" value={form.oldPrice} onChange={e => set('oldPrice', fmtPrice(e.target.value))} style={inp()} />
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

                {/* card: shop info */}
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
                      onChange={v => setForm(f => ({ ...f, province: v.province, city: v.city }))}
                      required provinceError={errors.province} cityError={errors.city}
                    />

                    <div>
                      <Label optional>آدرس</Label>
                      <textarea className="nf" rows={2} placeholder="خیابان، کوچه، پلاک..." value={form.address} onChange={e => set('address', e.target.value)} style={{ ...inp(), resize: 'vertical', minHeight: 72, lineHeight: 1.7 }} />
                    </div>

                  </div>
                </div>

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
                      اطلاعات تماس شما مستقیماً به خریداران نمایش داده می‌شود. این سایت مثل دیوار عمل می‌کند — خریدار مستقیم با شما تماس می‌گیرد.
                    </p>
                  </div>
                </div>

                {/* live preview */}
                {(form.name || images.length > 0) && (
                  <div style={{ background: LQ_BG, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: LQ_BOR, borderRadius: 16, padding: '16px', boxShadow: LQ_SHAD, animation: 'fadeIn 0.3s ease both' }}>
                    <p style={{ fontSize: 11.5, color: TEXT_MUT, marginBottom: 12, fontWeight: 700, letterSpacing: '0.1em' }}>پیش‌نمایش کارت</p>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px', background: '#fff', borderRadius: 12, border: '1.5px solid rgba(28,28,26,0.08)' }}>
                      <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', background: '#F4F3F1', flexShrink: 0 }}>
                        {images.length > 0 && images[0]
                          ? <img src={images[0].data} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, opacity: 0.3 }}>🎱</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: TEXT, margin: '0 0 3px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.name || 'نام محصول'}</p>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          {catLabel && <span style={{ fontSize: 11, color: GOLD, fontWeight: 600, background: 'rgba(199,166,106,0.1)', padding: '1px 7px', borderRadius: 10 }}>{catLabel}</span>}
                          {form.condition !== 'new' && <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600, background: 'rgba(180,83,9,0.08)', padding: '1px 7px', borderRadius: 10 }}>{form.condition === 'like-new' ? 'در حد نو' : 'کارکرده'}</span>}
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

            {/* ── Submit bar ── */}
            <div style={{ background: LQ_BG, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '20px 24px', display: 'flex', gap: 12, alignItems: 'center', animation: 'fadeUp 0.6s ease both', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />

              <button type="submit" disabled={submitting} style={{ flex: 1, padding: '16px 24px', borderRadius: 14, border: `1.5px solid ${GOLD}`, cursor: submitting ? 'not-allowed' : 'pointer', background: 'rgba(199,166,106,0.14)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', color: GOLD_D, fontSize: 16, fontWeight: 800, fontFamily: 'Vazirmatn,Tahoma,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 6px 24px rgba(199,166,106,0.22), inset 0 1px 0 rgba(255,255,255,0.55)', transition: 'opacity 0.2s, transform 0.15s, box-shadow 0.2s', opacity: submitting ? 0.65 : 1, position: 'relative', zIndex: 1 }}
                onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 28px rgba(199,166,106,0.34), inset 0 1px 0 rgba(255,255,255,0.55)`; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(199,166,106,0.22), inset 0 1px 0 rgba(255,255,255,0.55)'; }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke={GOLD_D} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                ثبت محصول در فروشگاه
              </button>

              <Link href="/shop" style={{ padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.88)', background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(200%)', WebkitBackdropFilter: 'blur(20px) saturate(200%)', color: TEXT_SEC, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 4px 14px rgba(0,0,0,0.06)', transition: 'color 0.2s', position: 'relative', zIndex: 1 }}
                onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                onMouseLeave={e => (e.currentTarget.style.color = TEXT_SEC)}>
                انصراف
              </Link>

              {/* required fields hint */}
              <p style={{ fontSize: 12, color: TEXT_MUT, whiteSpace: 'nowrap', position: 'relative', zIndex: 1 }}>
                <span style={{ color: ERR }}>*</span> فیلدهای الزامی
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
