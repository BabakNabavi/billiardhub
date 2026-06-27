'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '../../store/cart.store'

function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}
function fmt(n: number) { return Number(n).toLocaleString('fa-IR') }

export default function CartPage() {
  const { items, removeItem, updateQty, clear, totalPrice, totalItems } = useCartStore()
  const [removing, setRemoving] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState('')

  const total = totalPrice()
  const count = totalItems()
  const shipping = total > 5000000 ? 0 : 250000
  const discount = promoApplied ? Math.floor(total * 0.1) : 0
  const grand = total - discount + shipping

  const handleRemove = (id: string) => {
    setRemoving(id)
    setTimeout(() => {
      removeItem(id)
      setRemoving(null)
    }, 300)
  }

  const handlePromo = () => {
    if (promoCode.trim().toUpperCase() === 'BILLIARD10') {
      setPromoApplied(true)
      setPromoError('')
    } else {
      setPromoError('کد تخفیف نامعتبر است')
    }
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes fadeOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(0.95)} }
        .cart-item { animation: fadeUp 0.35s ease both; transition: opacity 0.3s, transform 0.3s; }
        .cart-item.removing { animation: fadeOut 0.3s ease forwards; }
        .qty-btn:hover { background: rgba(199,166,106,0.15) !important; }
        .rm-btn:hover { color: #ef4444 !important; border-color: rgba(239,68,68,0.3) !important; background: rgba(239,68,68,0.06) !important; }
        @media(max-width:900px){ .cart-layout { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn,Tahoma,sans-serif', direction: 'rtl', color: '#111111' }}>
        {/* ambient orb */}
        <div style={{ position: 'fixed', top: -100, right: -80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(199,166,106,0.06)0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '32px 20px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(0,0,0,0.45)', textDecoration: 'none', marginBottom: 16, transition: 'color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C7A66A' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(0,0,0,0.45)' }}>
              <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
              بازگشت به فروشگاه
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-shopping-cart" style={{ fontSize: 24, color: '#A07840' }} />
              </div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111111', margin: '0 0 4px' }}>سبد خرید</h1>
                <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                  {count > 0 ? <>{toFa(count)} محصول در سبد شما</> : 'سبد خرید خالی است'}
                </p>
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            /* Empty state */
            <div style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeUp 0.5s ease both' }}>
              <div style={{ width: 100, height: 100, borderRadius: 24, background: '#F3F2EF', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <i className="ti ti-shopping-cart-off" style={{ fontSize: 48, color: 'rgba(0,0,0,0.30)' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111111', margin: '0 0 10px' }}>سبد خرید خالی است</h2>
              <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.45)', margin: '0 0 32px', lineHeight: 1.7 }}>هنوز محصولی به سبد اضافه نکرده‌اید.<br/>به فروشگاه بروید و بهترین تجهیزات را انتخاب کنید.</p>
              <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff', padding: '14px 28px', borderRadius: 14, textDecoration: 'none', fontWeight: 800, fontSize: 17, boxShadow: '0 8px 28px rgba(199,166,106,0.35)' }}>
                <i className="ti ti-shopping-bag" style={{ fontSize: 20 }} />
                رفتن به فروشگاه
              </Link>
            </div>
          ) : (
            <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28 }}>

              {/* ── Cart Items ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Clear all */}
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 4 }}>
                  <button onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(0,0,0,0.38)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 8, transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#475569'; (e.currentTarget as HTMLElement).style.background = 'none' }}>
                    <i className="ti ti-trash" style={{ fontSize: 15 }} />
                    حذف همه
                  </button>
                </div>

                {items.map((item, idx) => {
                  const fp = item.discountPrice ?? item.price
                  const isRemoving = removing === item.id
                  return (
                    <div
                      key={item.id}
                      className={`cart-item${isRemoving ? ' removing' : ''}`}
                      style={{ animationDelay: `${idx * 0.05}s`, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, overflow: 'hidden', display: 'flex', gap: 0 }}
                    >
                      {/* Image */}
                      <Link href={`/shop/${item.id}`} style={{ flexShrink: 0, width: 130, position: 'relative', display: 'block', overflow: 'hidden' }}>
                        <img
                          src={item.image || '/images/billiadr-club-3.jpg'}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 130, transition: 'transform 0.4s' }}
                          onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.06)' }}
                          onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
                          onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.10))' }} />
                      </Link>

                      {/* Info */}
                      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <Link href={`/shop/${item.id}`} style={{ textDecoration: 'none' }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111111', margin: '0 0 6px', lineHeight: 1.4 }}>{item.title}</h3>
                          </Link>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <i className="ti ti-tag" style={{ fontSize: 13, color: '#A07840' }} />
                              {item.category}
                            </span>
                            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <i className="ti ti-map-pin" style={{ fontSize: 13, color: '#A07840' }} />
                              {item.city}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                          {/* Qty */}
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                            <button
                              className="qty-btn"
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              style={{ width: 34, height: 34, background: '#F3F2EF', border: 'none', cursor: 'pointer', color: '#111111', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(0,0,0,0.08)', transition: 'all 0.2s' }}
                            >−</button>
                            <span style={{ minWidth: 36, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#111111' }}>{toFa(item.quantity)}</span>
                            <button
                              className="qty-btn"
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              style={{ width: 34, height: 34, background: '#F3F2EF', border: 'none', cursor: 'pointer', color: '#111111', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(0,0,0,0.08)', transition: 'all 0.2s' }}
                            >+</button>
                          </div>

                          {/* Price */}
                          <div style={{ textAlign: 'left' }}>
                            {item.discountPrice && (
                              <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.25)', textDecoration: 'line-through', margin: '0 0 2px', textAlign: 'right' }}>
                                {fmt(item.price * item.quantity)} تومان
                              </p>
                            )}
                            <p style={{ fontSize: 20, fontWeight: 900, color: '#A07840', margin: 0, textShadow: '0 0 20px rgba(199,166,106,0.30)', textAlign: 'right' }}>
                              {fmt(fp * item.quantity)}
                              <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(0,0,0,0.45)', marginRight: 4 }}>تومان</span>
                            </p>
                            {item.quantity > 1 && (
                              <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.38)', margin: '2px 0 0', textAlign: 'right' }}>
                                {toFa(item.quantity)} × {fmt(fp)} تومان
                              </p>
                            )}
                          </div>

                          {/* Remove */}
                          <button
                            className="rm-btn"
                            onClick={() => handleRemove(item.id)}
                            style={{ padding: '6px 10px', borderRadius: 8, background: '#F3F2EF', border: '1px solid rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.38)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.2s' }}
                          >
                            <i className="ti ti-trash" style={{ fontSize: 15 }} />
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── Order Summary ── */}
              <div style={{ position: 'sticky', top: 80, height: 'fit-content' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 24, overflow: 'hidden' }}>
                  {/* top neon line */}
                  <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.50),transparent)' }} />

                  <div style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111111', margin: '0 0 24px' }}>خلاصه سفارش</h2>

                    {/* Promo code */}
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 8 }}>کد تخفیف</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={promoCode}
                          onChange={e => { setPromoCode(e.target.value); setPromoError('') }}
                          disabled={promoApplied}
                          placeholder="کد تخفیف را وارد کنید"
                          style={{ flex: 1, background: '#F7F7F5', border: `1px solid ${promoError ? 'rgba(239,68,68,0.40)' : promoApplied ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.10)'}`, borderRadius: 10, padding: '9px 12px', color: '#111111', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                        />
                        <button
                          onClick={handlePromo}
                          disabled={promoApplied}
                          style={{ padding: '9px 14px', borderRadius: 10, background: promoApplied ? 'rgba(199,166,106,0.15)' : 'rgba(199,166,106,0.10)', border: `1px solid ${promoApplied ? 'rgba(199,166,106,0.40)' : 'rgba(199,166,106,0.25)'}`, color: '#A07840', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: promoApplied ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {promoApplied ? '✓ اعمال شد' : 'اعمال'}
                        </button>
                      </div>
                      {promoError && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 6 }}>{promoError}</p>}
                      {promoApplied && <p style={{ fontSize: 13, color: '#A07840', marginTop: 6 }}>تخفیف ۱۰٪ اعمال شد!</p>}
                    </div>

                    {/* Price breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>جمع کالاها ({toFa(count)})</span>
                        <span style={{ color: '#111111', fontWeight: 600 }}>{fmt(total)} تومان</span>
                      </div>
                      {discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                          <span style={{ color: 'rgba(0,0,0,0.45)' }}>تخفیف کد</span>
                          <span style={{ color: '#A07840', fontWeight: 600 }}>− {fmt(discount)} تومان</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                        <span style={{ color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          هزینه ارسال
                          {shipping === 0 && <span style={{ fontSize: 12, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.20)', color: '#A07840', borderRadius: 20, padding: '1px 7px', fontWeight: 700 }}>رایگان</span>}
                        </span>
                        <span style={{ color: shipping === 0 ? '#C7A66A' : '#e2e8f0', fontWeight: 600 }}>
                          {shipping === 0 ? 'رایگان' : `${fmt(shipping)} تومان`}
                        </span>
                      </div>
                    </div>

                    {/* Grand total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#111111' }}>مجموع نهایی</span>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 24, fontWeight: 900, color: '#A07840', margin: 0, textShadow: '0 0 24px rgba(199,166,106,0.30)' }}>{fmt(grand)}</p>
                        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', margin: '2px 0 0', textAlign: 'right' }}>تومان</p>
                      </div>
                    </div>

                    {/* Free shipping threshold */}
                    {shipping > 0 && (
                      <div style={{ background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.12)', borderRadius: 10, padding: '10px 12px', marginBottom: 16, fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>
                        <span style={{ color: '#A07840', fontWeight: 700 }}>{fmt(5000000 - total)} تومان</span> تا ارسال رایگان
                      </div>
                    )}

                    {/* Checkout CTA */}
                    <Link href="/checkout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff', padding: '15px', borderRadius: 14, textDecoration: 'none', fontWeight: 800, fontSize: 17, boxShadow: '0 8px 28px rgba(199,166,106,0.35)', transition: 'all 0.3s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 36px rgba(199,166,106,0.50)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(199,166,106,0.35)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                      <i className="ti ti-lock" style={{ fontSize: 18 }} />
                      پرداخت امن
                    </Link>

                    {/* Trust icons */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                      {[
                        { icon: 'ti-shield-check', label: 'پرداخت امن' },
                        { icon: 'ti-truck', label: 'ارسال سریع' },
                        { icon: 'ti-rotate', label: 'مرجوعی رایگان' },
                      ].map(b => (
                        <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <i className={`ti ${b.icon}`} style={{ fontSize: 18, color: '#A07840', opacity: 0.7 }} />
                          <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.38)', textAlign: 'center' }}>{b.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Continue shopping */}
                <Link href="/shop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, padding: '12px', borderRadius: 12, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.45)', textDecoration: 'none', fontSize: 15, transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#111111'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.09)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(0,0,0,0.45)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.05)' }}>
                  <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
                  ادامه خرید
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
