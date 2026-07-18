'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '../../store/cart.store'
import ProvinceCitySelect from '../../components/ProvinceCitySelect'

const GOLD = '#C7A66A'
const GOLD_DARK = '#A07840'

function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}
function fmt(n: number) { return Number(n).toLocaleString('fa-IR') }

type Step = 'address' | 'payment' | 'confirm'

// استان/شهر از ProvinceCitySelect می‌آید — لیست هاردکد حذف شد (single source of truth)

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string; icon: string }[] = [
    { key: 'address', label: 'آدرس', icon: 'ti-map-pin' },
    { key: 'payment', label: 'پرداخت', icon: 'ti-credit-card' },
    { key: 'confirm', label: 'تأیید', icon: 'ti-check' },
  ]
  const idx = steps.findIndex(s => s.key === current)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < idx ? 'linear-gradient(135deg,#C7A66A,#A07840)' : i === idx ? 'rgba(199,166,106,0.15)' : 'rgba(0,0,0,0.04)',
              border: i <= idx ? '2px solid rgba(199,166,106,0.60)' : '2px solid rgba(0,0,0,0.06)',
              color: i <= idx ? '#A07840' : 'rgba(0,0,0,0.45)',
              fontSize: i < idx ? 16 : 18,
              transition: 'all 0.4s',
              boxShadow: i === idx ? '0 0 20px rgba(199,166,106,0.30)' : 'none',
            }}>
              {i < idx
                ? <i className="ti ti-check" style={{ fontSize: 18, color: '#fff' }} />
                : <i className={`ti ${s.icon}`} style={{ fontSize: 18 }} />
              }
            </div>
            <span style={{ fontSize: 13, fontWeight: i === idx ? 700 : 400, color: i <= idx ? '#A07840' : 'rgba(0,0,0,0.45)' }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 80, height: 2, background: i < idx ? 'linear-gradient(90deg,#C7A66A,#A07840)' : 'rgba(0,0,0,0.05)', marginBottom: 20, transition: 'all 0.4s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function CheckoutPage() {
  const { items, totalPrice, totalItems, clear } = useCartStore()
  const [step, setStep] = useState<Step>('address')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNum, setOrderNum] = useState('')

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', province: '', city: '', address: '', postalCode: '',
    payMethod: 'online',
    cardNum: '', cardName: '', cardExpiry: '', cardCvv: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const total = totalPrice()
  const count = totalItems()
  const shipping = total > 5000000 ? 0 : 250000
  const grand = total + shipping

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validateAddress = () => {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'نام الزامی است'
    if (!form.lastName.trim()) e.lastName = 'نام خانوادگی الزامی است'
    if (!form.phone.trim() || form.phone.length < 10) e.phone = 'شماره موبایل نامعتبر است'
    if (!form.province) e.province = 'استان را انتخاب کنید'
    if (!form.city.trim()) e.city = 'شهر الزامی است'
    if (!form.address.trim()) e.address = 'آدرس الزامی است'
    if (!form.postalCode.trim() || form.postalCode.length < 10) e.postalCode = 'کد پستی نامعتبر است'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const placeOrder = () => {
    const num = `BP-${Date.now().toString().slice(-8)}`
    setOrderNum(num)
    setOrderPlaced(true)
    clear()
  }

  const labelStyle = { fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.50)', marginBottom: 6, display: 'block' }
  const inputStyle = (err?: string) => ({
    width: '100%', boxSizing: 'border-box' as const,
    background: '#F7F7F5', border: `1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: 12, padding: '12px 14px', color: '#111111', fontSize: 16, fontFamily: 'inherit',
    outline: 'none', transition: 'border-color 0.2s',
  })

  if (orderPlaced) return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn,Tahoma,sans-serif', direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(199,166,106,0.10)', border: '2px solid rgba(199,166,106,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 40px rgba(199,166,106,0.20)' }}>
            <i className="ti ti-check" style={{ fontSize: 44, color: '#C7A66A' }} />
          </div>
          <h1 style={{ fontSize: 29, fontWeight: 900, color: '#111111', margin: '0 0 12px' }}>سفارش ثبت شد!</h1>
          <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.45)', lineHeight: 1.7, margin: '0 0 24px' }}>
            سفارش شما با موفقیت ثبت شد.<br />
            کد پیگیری: <strong style={{ color: '#C7A66A', fontSize: 18 }}>{orderNum}</strong>
          </p>
          <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.38)', margin: '0 0 32px', background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.12)', borderRadius: 12, padding: '12px 16px' }}>
            پس از تأیید پرداخت، کالا در سریع‌ترین زمان ممکن ارسال خواهد شد.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff', padding: '13px 24px', borderRadius: 14, textDecoration: 'none', fontWeight: 800, fontSize: 16, boxShadow: '0 8px 24px rgba(199,166,106,0.35)' }}>
              <i className="ti ti-shopping-bag" style={{ fontSize: 18 }} /> ادامه خرید
            </Link>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.50)', padding: '13px 24px', borderRadius: 14, textDecoration: 'none', fontSize: 16 }}>
              بازگشت به خانه
            </Link>
          </div>
        </div>
      </div>
    </>
  )

  if (items.length === 0) return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn,Tahoma,sans-serif', direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="ti ti-shopping-cart-off" style={{ fontSize: 66, color: 'rgba(0,0,0,0.35)', display: 'block', marginBottom: 16 }} />
          <p style={{ fontSize: 18, color: 'rgba(0,0,0,0.45)', marginBottom: 20 }}>سبد خرید خالی است</p>
          <Link href="/shop" style={{ background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>
            رفتن به فروشگاه
          </Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        input:focus, select:focus { border-color: rgba(199,166,106,0.50) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.08) !important; }
        .next-btn { transition: all 0.3s !important; }
        .next-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 12px 36px rgba(199,166,106,0.45) !important; }
        @media(max-width:900px){ .checkout-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn,Tahoma,sans-serif', direction: 'rtl', color: '#111111' }}>
        <div style={{ position: 'fixed', top: -100, right: -80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(199,166,106,0.06)0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Link href="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(0,0,0,0.45)', textDecoration: 'none', marginBottom: 20, transition: 'color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C7A66A' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(0,0,0,0.45)' }}>
              <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
              بازگشت به سبد خرید
            </Link>
            <h1 style={{ fontSize: 29, fontWeight: 900, color: '#111111', margin: '0 0 8px' }}>تکمیل خرید</h1>
            <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.45)', margin: 0 }}>{toFa(count)} محصول — مجموع: {fmt(grand)} تومان</p>
          </div>

          <StepIndicator current={step} />

          <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>

            {/* ── Left: Form ── */}
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 24, overflow: 'hidden' }}>
              <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.50),transparent)' }} />
              <div style={{ padding: '28px' }}>

                {/* ─ STEP 1: Address ─ */}
                {step === 'address' && (
                  <div style={{ animation: 'fadeUp 0.35s ease both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-map-pin" style={{ fontSize: 19, color: '#C7A66A' }} />
                      </div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111111', margin: 0 }}>اطلاعات تحویل</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {[
                        { key: 'firstName', label: 'نام', placeholder: 'نام خود را وارد کنید', col: 1 },
                        { key: 'lastName', label: 'نام خانوادگی', placeholder: 'نام خانوادگی', col: 1 },
                        { key: 'phone', label: 'شماره موبایل', placeholder: '۰۹۱۲۳۴۵۶۷۸۹', col: 2 },
                      ].map(f => (
                        <div key={f.key} style={{ gridColumn: `span ${f.col}` }}>
                          <label style={labelStyle}>{f.label}</label>
                          <input
                            value={(form as Record<string,string>)[f.key]}
                            onChange={e => set(f.key, e.target.value)}
                            placeholder={f.placeholder}
                            style={inputStyle(errors[f.key])}
                          />
                          {errors[f.key] && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{errors[f.key]}</p>}
                        </div>
                      ))}

                      <div style={{ gridColumn: 'span 2' }}>
                        <ProvinceCitySelect
                          value={{ province: form.province, city: form.city }}
                          onChange={v => setForm(f => ({ ...f, province: v.province, city: v.city }))}
                          required provinceError={errors.province} cityError={errors.city}
                        />
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>آدرس کامل</label>
                        <textarea
                          value={form.address}
                          onChange={e => set('address', e.target.value)}
                          placeholder="خیابان، پلاک، طبقه، واحد..."
                          rows={3}
                          style={{ ...inputStyle(errors.address), resize: 'vertical', lineHeight: 1.7 }}
                        />
                        {errors.address && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{errors.address}</p>}
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>کد پستی</label>
                        <input value={form.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="۱۲۳۴۵۶۷۸۹۰" maxLength={10} style={inputStyle(errors.postalCode)} />
                        {errors.postalCode && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{errors.postalCode}</p>}
                      </div>
                    </div>

                    <button
                      className="next-btn"
                      onClick={() => { if (validateAddress()) setStep('payment') }}
                      style={{ width: '100%', marginTop: 24, padding: '15px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff', fontSize: 17, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 28px rgba(199,166,106,0.35)' }}
                    >
                      ادامه — انتخاب روش پرداخت <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
                    </button>
                  </div>
                )}

                {/* ─ STEP 2: Payment ─ */}
                {step === 'payment' && (
                  <div style={{ animation: 'fadeUp 0.35s ease both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-credit-card" style={{ fontSize: 19, color: '#C7A66A' }} />
                      </div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111111', margin: 0 }}>روش پرداخت</h2>
                    </div>

                    {/* Payment methods */}
                    {[
                      { key: 'online', icon: 'ti-world', label: 'درگاه پرداخت آنلاین', desc: 'پرداخت ایمن از طریق درگاه بانکی (زرین‌پال، پی‌آی‌آر)' },
                      { key: 'cod', icon: 'ti-cash', label: 'پرداخت در محل', desc: 'پرداخت هنگام تحویل کالا (فقط تهران و کرج)' },
                      { key: 'card', icon: 'ti-credit-card', label: 'انتقال کارت به کارت', desc: 'واریز مستقیم به حساب فروشنده' },
                    ].map(pm => (
                      <div
                        key={pm.key}
                        onClick={() => set('payMethod', pm.key)}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 14, border: `1px solid ${form.payMethod === pm.key ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.07)'}`, background: form.payMethod === pm.key ? 'rgba(199,166,106,0.06)' : 'rgba(0,0,0,0.02)', cursor: 'pointer', marginBottom: 10, transition: 'all 0.2s' }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: form.payMethod === pm.key ? 'rgba(199,166,106,0.12)' : 'rgba(0,0,0,0.04)', border: `1px solid ${form.payMethod === pm.key ? 'rgba(199,166,106,0.30)' : 'rgba(0,0,0,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`ti ${pm.icon}`} style={{ fontSize: 20, color: form.payMethod === pm.key ? '#C7A66A' : 'rgba(0,0,0,0.45)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 16, fontWeight: 700, color: form.payMethod === pm.key ? '#111111' : 'rgba(0,0,0,0.50)', margin: '0 0 3px' }}>{pm.label}</p>
                          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.38)', margin: 0 }}>{pm.desc}</p>
                        </div>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${form.payMethod === pm.key ? '#C7A66A' : 'rgba(0,0,0,0.12)'}`, background: form.payMethod === pm.key ? '#C7A66A' : 'none', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {form.payMethod === pm.key && <i className="ti ti-check" style={{ fontSize: 12, color: '#fff' }} />}
                        </div>
                      </div>
                    ))}

                    {/* Card details (if card selected) */}
                    {form.payMethod === 'card' && (
                      <div style={{ marginTop: 16, padding: '16px', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 14 }}>
                        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="ti ti-info-circle" style={{ fontSize: 16, color: '#C7A66A' }} />
                          شماره کارت فروشنده پس از تأیید سفارش برای شما ارسال می‌شود.
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                      <button onClick={() => setStep('address')} style={{ padding: '14px 20px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', background: '#FFFFFF', color: 'rgba(0,0,0,0.50)', fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-arrow-right" style={{ fontSize: 17 }} /> برگشت
                      </button>
                      <button
                        className="next-btn"
                        onClick={() => setStep('confirm')}
                        style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff', fontSize: 17, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 28px rgba(199,166,106,0.35)' }}
                      >
                        بررسی نهایی سفارش <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ─ STEP 3: Confirm ─ */}
                {step === 'confirm' && (
                  <div style={{ animation: 'fadeUp 0.35s ease both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-clipboard-check" style={{ fontSize: 19, color: '#C7A66A' }} />
                      </div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111111', margin: 0 }}>بررسی نهایی</h2>
                    </div>

                    {/* Address summary */}
                    <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 14, padding: '16px 20px', marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.45)', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <i className="ti ti-map-pin" style={{ fontSize: 15, color: '#C7A66A' }} /> آدرس تحویل
                        </p>
                        <button onClick={() => setStep('address')} style={{ fontSize: 13, color: '#C7A66A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>ویرایش</button>
                      </div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#111111', margin: '0 0 4px' }}>{form.firstName} {form.lastName}</p>
                      <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.50)', margin: '0 0 2px' }}>{form.province} — {form.city}</p>
                      <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.50)', margin: '0 0 2px' }}>{form.address}</p>
                      <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: 0 }}>کد پستی: {toFa(form.postalCode)}</p>
                    </div>

                    {/* Payment summary */}
                    <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.45)', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <i className="ti ti-credit-card" style={{ fontSize: 15, color: '#C7A66A' }} /> روش پرداخت
                        </p>
                        <button onClick={() => setStep('payment')} style={{ fontSize: 13, color: '#C7A66A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>ویرایش</button>
                      </div>
                      <p style={{ fontSize: 16, color: '#111111', margin: 0 }}>
                        {{ online: 'درگاه پرداخت آنلاین', cod: 'پرداخت در محل', card: 'کارت به کارت' }[form.payMethod]}
                      </p>
                    </div>

                    {/* Items summary */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                      {items.map(item => {
                        const fp = item.discountPrice ?? item.price
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 12 }}>
                            <img src={item.image || '/images/billiadr-club-3.jpg'} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                              onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 15, fontWeight: 600, color: '#111111', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                              <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', margin: 0 }}>{toFa(item.quantity)} عدد</p>
                            </div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: '#C7A66A', margin: 0, flexShrink: 0 }}>{fmt(fp * item.quantity)} ت</p>
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setStep('payment')} style={{ padding: '14px 20px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', background: '#FFFFFF', color: 'rgba(0,0,0,0.50)', fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-arrow-right" style={{ fontSize: 17 }} /> برگشت
                      </button>
                      <button
                        onClick={placeOrder}
                        style={{ flex: 1, padding: '15px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff', fontSize: 17, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 28px rgba(199,166,106,0.40)' }}
                      >
                        <i className="ti ti-lock" style={{ fontSize: 20 }} />
                        ثبت نهایی و پرداخت — {fmt(grand)} تومان
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div style={{ height: 'fit-content', position: 'sticky', top: 80 }}>
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 24, overflow: 'hidden' }}>
                <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.50),transparent)' }} />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111111', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="ti ti-receipt" style={{ fontSize: 18, color: '#C7A66A' }} />
                    خلاصه سفارش
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.04)', marginBottom: 16 }}>
                    {items.slice(0, 4).map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={item.image || '/images/billiadr-club-3.jpg'} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                          onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }} />
                        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.50)', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                        <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', flexShrink: 0 }}>×{toFa(item.quantity)}</span>
                      </div>
                    ))}
                    {items.length > 4 && <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)', margin: 0 }}>و {toFa(items.length - 4)} محصول دیگر...</p>}
                  </div>

                  {[
                    { label: 'جمع کالاها', value: `${fmt(total)} ت` },
                    { label: 'هزینه ارسال', value: shipping === 0 ? 'رایگان' : `${fmt(shipping)} ت`, green: shipping === 0 },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 10 }}>
                      <span style={{ color: 'rgba(0,0,0,0.45)' }}>{r.label}</span>
                      <span style={{ color: r.green ? '#16a34a' : '#111111', fontWeight: 600 }}>{r.value}</span>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                    <span style={{ color: '#111111' }}>مجموع نهایی</span>
                    <span style={{ color: '#C7A66A' }}>{fmt(grand)} ت</span>
                  </div>
                </div>
              </div>

              {/* Security badges */}
              <div style={{ marginTop: 16, padding: '16px', background: 'rgba(199,166,106,0.04)', border: '1px solid rgba(199,166,106,0.10)', borderRadius: 14, textAlign: 'center' }}>
                <i className="ti ti-shield-check" style={{ fontSize: 26, color: '#C7A66A', display: 'block', marginBottom: 8 }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111111', margin: '0 0 4px' }}>خرید ۱۰۰٪ امن</p>
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)', margin: 0 }}>اطلاعات شما با رمزنگاری SSL محافظت می‌شود</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
