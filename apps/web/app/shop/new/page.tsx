'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

const GOLD    = '#C7A66A'
const TEXT    = '#1C1C1A'
const TEXT_SEC = 'rgba(28,28,26,0.50)'
const LQ_BG   = 'rgba(255,255,255,0.72)'
const LQ_BOR  = '1px solid rgba(255,255,255,0.82)'
const LQ_SHAD = 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.06)'

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

function fmtPrice(v: string) {
  const n = v.replace(/\D/g, '')
  return n ? Number(n).toLocaleString('fa-IR') : ''
}

export default function NewProductPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', category: '', price: '', oldPrice: '',
    description: '', sellerName: '', sellerPhone: '', sellerWhatsapp: '',
  })
  const [imgData,  setImgData]  = useState<string | null>(null)
  const [imgName,  setImgName]  = useState('')
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [success,  setSuccess]  = useState(false)
  const [dragging, setDragging] = useState(false)

  const set = (k: keyof typeof form, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setErrors(e => ({ ...e, img: 'فقط فایل تصویر قابل قبول است' })); return }
    if (file.size > 5 * 1024 * 1024)    { setErrors(e => ({ ...e, img: 'حداکثر حجم تصویر ۵ مگابایت' })); return }
    const reader = new FileReader()
    reader.onload = ev => { setImgData(ev.target?.result as string); setImgName(file.name); setErrors(e => ({ ...e, img: '' })) }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())        e.name       = 'نام محصول الزامی است'
    if (!form.category)           e.category   = 'دسته‌بندی را انتخاب کنید'
    if (!form.price)              e.price      = 'قیمت الزامی است'
    if (!form.sellerName.trim())  e.sellerName  = 'نام فروشنده الزامی است'
    if (!form.sellerPhone.trim()) e.sellerPhone = 'شماره تماس الزامی است'
    else if (!/^(\+98|0)9\d{9}$/.test(form.sellerPhone.trim())) e.sellerPhone = 'شماره موبایل معتبر وارد کنید'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const price    = Number(form.price.replace(/[,،۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d) >= 0 ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(d) : d)))
    const rawPrice = Number(form.price.replace(/\D/g, '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))
    const rawOld   = form.oldPrice ? Number(form.oldPrice.replace(/\D/g, '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))) : rawPrice
    const disc     = rawOld > rawPrice ? Math.round((1 - rawPrice / rawOld) * 100) : 0

    const product = {
      id: Date.now(),
      img: imgData ?? '/images/shop/cue_billiard_2.jpg',
      name: form.name.trim(),
      category: form.category,
      price: rawPrice,
      old: rawOld,
      disc,
      description: form.description.trim(),
      sellerName:  form.sellerName.trim(),
      sellerPhone: form.sellerPhone.trim(),
      sellerWhatsapp: (form.sellerWhatsapp.trim() || form.sellerPhone.trim()).replace(/^0/, '98'),
    }

    const existing = JSON.parse(localStorage.getItem('userProducts') ?? '[]')
    localStorage.setItem('userProducts', JSON.stringify([product, ...existing]))

    setSuccess(true)
    setTimeout(() => router.push('/shop'), 1800)
  }

  const inputStyle = (err?: string): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', borderRadius: 10, fontSize: 15,
    border: `1.5px solid ${err ? '#EF4444' : 'rgba(28,28,26,0.14)'}`,
    background: '#FAFAF9', color: TEXT,
    fontFamily: 'Vazirmatn,Tahoma,sans-serif',
    outline: 'none', transition: 'border-color 0.2s',
    direction: 'rtl',
  })

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#A07840)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 28px rgba(199,166,106,0.4)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 8 }}>محصول با موفقیت ثبت شد</h2>
        <p style={{ fontSize: 15, color: TEXT_SEC }}>در حال انتقال به فروشگاه...</p>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
        .nf:focus { border-color: ${GOLD} !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.12) !important; }
        .drop-z { transition: border-color 0.2s, background 0.2s; }
        .drop-z:hover { border-color: ${GOLD} !important; background: rgba(199,166,106,0.04) !important; }
        @media(max-width:800px) { .fg { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT }}>

        <div style={{ position: 'fixed', top: -80, right: -60, width: 400, height: 400, background: 'radial-gradient(circle,rgba(199,166,106,0.09) 0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: '28px clamp(16px,3vw,32px) 64px' }}>

          {/* back */}
          <div style={{ marginBottom: 32 }}>
            <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: TEXT_SEC, textDecoration: 'none', padding: '7px 12px', borderRadius: 10, background: LQ_BG, border: LQ_BOR, boxShadow: LQ_SHAD, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.color = TEXT_SEC)}>
              <ChevronLeft size={15} />
              بازگشت به فروشگاه
            </Link>
          </div>

          {/* heading */}
          <div style={{ marginBottom: 32, animation: 'fadeUp 0.4s ease both' }}>
            <div style={{ fontSize: 12, color: GOLD, letterSpacing: '0.18em', fontWeight: 700, marginBottom: 6 }}>NEW PRODUCT</div>
            <h1 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 900, color: TEXT, margin: 0 }}>ثبت محصول جدید</h1>
            <p style={{ fontSize: 14, color: TEXT_SEC, marginTop: 6 }}>محصول بیلیارد خود را در بیلیارد بازار ثبت کنید</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="fg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

              {/* ── product info ── */}
              <div style={{ background: LQ_BG, backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '24px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.45s ease both' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />

                <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                  <span style={{ width: 3, height: 16, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, display: 'inline-block' }} />
                  اطلاعات محصول
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>نام محصول <span style={{ color: '#EF4444' }}>*</span></label>
                    <input className="nf" type="text" placeholder="مثال: چوب حرفه‌ای Predator 314³" value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle(errors.name)} />
                    {errors.name && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.name}</p>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>دسته‌بندی <span style={{ color: '#EF4444' }}>*</span></label>
                    <select className="nf" value={form.category} onChange={e => set('category', e.target.value)} style={{ ...inputStyle(errors.category), cursor: 'pointer' }}>
                      <option value="">انتخاب دسته‌بندی...</option>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    {errors.category && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.category}</p>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>قیمت (تومان) <span style={{ color: '#EF4444' }}>*</span></label>
                      <input className="nf" type="text" inputMode="numeric" placeholder="۰" value={form.price} onChange={e => set('price', fmtPrice(e.target.value))} style={inputStyle(errors.price)} />
                      {errors.price && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.price}</p>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
                        قیمت قبل از تخفیف <span style={{ fontSize: 11, fontWeight: 400, color: TEXT_SEC }}>(اختیاری)</span>
                      </label>
                      <input className="nf" type="text" inputMode="numeric" placeholder="۰" value={form.oldPrice} onChange={e => set('oldPrice', fmtPrice(e.target.value))} style={inputStyle()} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
                      توضیحات <span style={{ fontSize: 11, fontWeight: 400, color: TEXT_SEC }}>(اختیاری)</span>
                    </label>
                    <textarea className="nf" rows={4} placeholder="ویژگی‌ها، شرایط، برند و سایر توضیحات..." value={form.description} onChange={e => set('description', e.target.value)} style={{ ...inputStyle(), resize: 'vertical', minHeight: 90 }} />
                  </div>

                  {/* image upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>تصویر محصول</label>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

                    {imgData ? (
                      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1.5px solid rgba(199,166,106,0.4)' }}>
                        <img src={imgData} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                        <button type="button" onClick={() => { setImgData(null); setImgName('') }} style={{ position: 'absolute', top: 8, left: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                        <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 11, color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 8px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imgName}</div>
                      </div>
                    ) : (
                      <div
                        className="drop-z"
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={e => { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}
                        style={{ border: `2px dashed ${dragging ? GOLD : 'rgba(28,28,26,0.16)'}`, borderRadius: 12, padding: '28px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px', display: 'block', color: GOLD }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                        <p style={{ fontSize: 13, color: TEXT_SEC, margin: 0 }}>کلیک کنید یا تصویر را اینجا رها کنید</p>
                        <p style={{ fontSize: 12, color: 'rgba(28,28,26,0.32)', marginTop: 4 }}>PNG، JPG، WEBP — حداکثر ۵ مگابایت</p>
                      </div>
                    )}
                    {errors.img && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.img}</p>}
                  </div>
                </div>
              </div>

              {/* ── seller info ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ background: LQ_BG, backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '24px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.5s ease both' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />

                  <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                    <span style={{ width: 3, height: 16, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, display: 'inline-block' }} />
                    اطلاعات فروشنده
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>نام فروشنده / فروشگاه <span style={{ color: '#EF4444' }}>*</span></label>
                      <input className="nf" type="text" placeholder="مثال: فروشگاه بیلیارد ستاره" value={form.sellerName} onChange={e => set('sellerName', e.target.value)} style={inputStyle(errors.sellerName)} />
                      {errors.sellerName && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.sellerName}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>شماره تماس <span style={{ color: '#EF4444' }}>*</span></label>
                      <input className="nf" type="tel" placeholder="09xxxxxxxxx" value={form.sellerPhone} onChange={e => set('sellerPhone', e.target.value)} style={{ ...inputStyle(errors.sellerPhone), direction: 'ltr', textAlign: 'right' }} />
                      {errors.sellerPhone && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.sellerPhone}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
                        شماره واتساپ <span style={{ fontSize: 11, fontWeight: 400, color: TEXT_SEC }}>(اختیاری)</span>
                      </label>
                      <input className="nf" type="tel" placeholder="09xxxxxxxxx" value={form.sellerWhatsapp} onChange={e => set('sellerWhatsapp', e.target.value)} style={{ ...inputStyle(), direction: 'ltr', textAlign: 'right' }} />
                    </div>
                  </div>
                </div>

                {/* note */}
                <div style={{ background: 'rgba(199,166,106,0.07)', border: '1px solid rgba(199,166,106,0.25)', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: GOLD, flexShrink: 0, marginTop: 1 }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p style={{ fontSize: 13, color: TEXT_SEC, lineHeight: 1.7, margin: 0 }}>
                      اطلاعات تماس شما مستقیماً به خریداران نمایش داده می‌شود. لطفاً اطلاعات صحیح وارد کنید.
                    </p>
                  </div>
                </div>

                {/* live preview */}
                {form.name && (
                  <div style={{ background: LQ_BG, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: LQ_BOR, borderRadius: 14, padding: '14px', boxShadow: LQ_SHAD }}>
                    <p style={{ fontSize: 12, color: TEXT_SEC, marginBottom: 8, fontWeight: 600 }}>پیش‌نمایش</p>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {imgData && <img src={imgData} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }} />}
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 4px', lineHeight: 1.4 }}>{form.name}</p>
                        {form.price && <p style={{ fontSize: 14, fontWeight: 800, color: GOLD, margin: 0 }}>{form.price} <span style={{ fontSize: 11, fontWeight: 400, color: TEXT_SEC }}>تومان</span></p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* submit row */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{
                flex: 1, padding: '15px 24px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg,${GOLD},#A07840)`,
                color: '#fff', fontSize: 16, fontWeight: 800,
                fontFamily: 'Vazirmatn,Tahoma,sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 6px 24px rgba(199,166,106,0.38)',
                transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ثبت محصول در فروشگاه
              </button>
              <Link href="/shop" style={{
                padding: '15px 20px', borderRadius: 14,
                border: '1.5px solid rgba(28,28,26,0.14)',
                background: LQ_BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                color: TEXT_SEC, fontSize: 15, fontWeight: 600,
                textDecoration: 'none', display: 'flex', alignItems: 'center',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                onMouseLeave={e => (e.currentTarget.style.color = TEXT_SEC)}
              >
                انصراف
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
