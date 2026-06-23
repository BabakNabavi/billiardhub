'use client'

// apps/web/app/shop/[id]/page.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description: string
  price: number
  discountPrice?: number
  discountPercent?: number
  category: string
  condition: string
  status: string
  city: string
  stock: number
  images: string[]
  video?: string
  isOfficialStore: boolean
  isDailyDeal: boolean
  isSpecialSale: boolean
  views: number
  sellerId: string
  createdAt: string
}

const FALLBACK_IMAGES: Record<string, string[]> = {
  cue:       ['/images/cue_billiard.jpg', '/images/cue_billiard_2.jpg', '/images/rest-pool-2.jpg'],
  ball:      ['/images/Ball-1.jpg', '/images/Ball.jpg'],
  table:     ['/images/Pro_table.jpg', '/images/Home_table.jpg', '/images/snooker-table.jpg', '/images/snooker-table-2.jpg'],
  accessory: ['/images/pool_chalk_1.jpg', '/images/pool_chalk_2.jpg', '/images/rest-pool.webp'],
  clothing:  ['/images/photo_2026-05-25_08-57-23.jpg'],
  default:   ['/images/billiadr-club-3.jpg', '/images/billiadr-club-5.jpg'],
}

function getImage(product: Product, index = 0): string {
  if (product.images && product.images.length > index) return product.images[index]
  const arr = FALLBACK_IMAGES[product.category] || FALLBACK_IMAGES.default
  return arr[(product.id.charCodeAt(0) + index) % arr.length]
}

function getAllImages(product: Product): string[] {
  const fallback = FALLBACK_IMAGES[product.category] || FALLBACK_IMAGES.default
  if (product.images && product.images.length > 0) return product.images
  return fallback.slice(0, 3)
}

const CATEGORY_LABELS: Record<string, string> = {
  cue: 'چوب بیلیارد', ball: 'گوی', table: 'میز', accessory: 'لوازم جانبی', clothing: 'پوشاک',
}
const CONDITION_LABELS: Record<string, string> = {
  new: 'نو', used: 'دست دوم', refurbished: 'بازسازی‌شده',
}

function formatPrice(n: number) { return n.toLocaleString('fa-IR') }

function StarRating({ score = 4.2, count = 0, big = false }: { score?: number; count?: number; big?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1,2,3,4,5].map(i => (
          <svg key={i} className={`${big ? 'w-4 h-4' : 'w-3 h-3'} ${i <= Math.round(score) ? 'text-amber-400' : 'text-zinc-700'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
      <span className={`${big ? 'text-sm' : 'text-xs'} text-zinc-400`}>{score.toFixed(1)}</span>
      {count > 0 && <span className={`${big ? 'text-sm' : 'text-xs'} text-zinc-500`}>({count.toLocaleString('fa-IR')} نظر)</span>}
    </div>
  )
}

// فروشندگان مشابه (mock — در آینده از API)
const MOCK_SELLERS = [
  { name: 'فروشگاه رسمی بیلیارد پلاس', score: '۱۰۰٪', badge: 'عالی', delivery: 'ارسال سریع (تهران و کرج)' },
  { name: 'بیلیارد مرکزی', score: '۹۸٪', badge: 'عالی', delivery: 'ارسال پستی سراسری' },
  { name: 'فروشگاه کیو پرو', score: '۹۵٪', badge: 'خوب', delivery: 'ارسال به تهران' },
]

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [contactVisible, setContactVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'sellers'|'specs'|'similar'>('sellers')

  useEffect(() => {
    async function load() {
      if (!params.id) return
      setLoading(true)
      try {
        const res = await fetch(`/api/products/${params.id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'محصول پیدا نشد')
        setProduct(data.product)

        // محصولات مشابه از همون دسته‌بندی
        const rel = await fetch(`/api/products?category=${data.product.category}&limit=6`)
        const relData = await rel.json()
        setRelated((relData.products || []).filter((p: Product) => p.id !== data.product.id).slice(0, 5))
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 text-white" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-zinc-900 rounded-2xl"/>
          <div className="space-y-4">
            <div className="h-4 bg-zinc-800 rounded w-1/4"/><div className="h-8 bg-zinc-800 rounded w-3/4"/>
            <div className="h-4 bg-zinc-800 rounded w-1/3"/><div className="h-24 bg-zinc-800 rounded"/>
            <div className="h-14 bg-zinc-800 rounded"/>
          </div>
        </div>
      </div>
    </div>
  )

  if (error || !product) return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <p className="text-5xl mb-4">🎱</p>
        <p className="text-xl text-zinc-300 mb-4">{error || 'محصول پیدا نشد'}</p>
        <Link href="/shop" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl inline-block">بازگشت به فروشگاه</Link>
      </div>
    </div>
  )

  const images = getAllImages(product)
  const finalPrice = product.discountPrice || product.price

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-5">
          <Link href="/" className="hover:text-zinc-300">خانه</Link><span>/</span>
          <Link href="/shop" className="hover:text-zinc-300">فروشگاه</Link><span>/</span>
          <Link href={`/shop?category=${product.category}`} className="hover:text-zinc-300">{CATEGORY_LABELS[product.category]}</Link><span>/</span>
          <span className="text-zinc-300 line-clamp-1">{product.title}</span>
        </nav>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
              <img src={images[activeImg]} alt={product.title}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }}/>
              {product.discountPercent && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold w-12 h-12 rounded-full flex items-center justify-center">
                  {product.discountPercent}٪
                </div>
              )}
              {product.isDailyDeal && (
                <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">🔥 پیشنهاد روز</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i===activeImg?'border-emerald-500':'border-zinc-700 hover:border-zinc-500'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = '/images/pool_chalk_1.jpg' }}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.isOfficialStore && (
                <span className="bg-emerald-900/50 border border-emerald-700 text-emerald-400 text-xs px-3 py-1 rounded-full">✓ فروشگاه رسمی</span>
              )}
              <span className="bg-zinc-800 text-zinc-400 text-xs px-3 py-1 rounded-full">{CATEGORY_LABELS[product.category]}</span>
              <span className={`text-xs px-3 py-1 rounded-full border ${product.condition==='new' ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'bg-orange-900/30 border-orange-700 text-orange-400'}`}>
                {CONDITION_LABELS[product.condition]}
              </span>
            </div>

            <h1 className="text-xl font-bold text-white leading-snug">{product.title}</h1>

            <div className="flex items-center gap-4">
              <StarRating score={4.2} count={12} big />
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-500 text-sm">📍 {product.city}</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-500 text-sm">👁 {product.views.toLocaleString('fa-IR')} بازدید</span>
            </div>

            {/* Price box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              {product.discountPrice ? (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-zinc-500 line-through text-sm">{formatPrice(product.price)} تومان</p>
                    <p className="text-emerald-400 font-bold text-3xl">{formatPrice(finalPrice)}</p>
                    <p className="text-zinc-400 text-sm">تومان</p>
                  </div>
                  <div className="bg-red-500 text-white font-bold text-lg w-14 h-14 rounded-full flex items-center justify-center">
                    {product.discountPercent}٪
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-emerald-400 font-bold text-3xl">{formatPrice(finalPrice)}</p>
                  <p className="text-zinc-400 text-sm">تومان</p>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800">
                {product.stock > 0 ? (
                  <span className="text-emerald-500 text-sm">✓ موجود در انبار ({product.stock} عدد)</span>
                ) : (
                  <span className="text-red-400 text-sm">✗ ناموجود</span>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-2">
              {product.stock > 0 ? (
                <button onClick={() => setContactVisible(v => !v)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-colors text-base">
                  {contactVisible ? '✕ بستن اطلاعات تماس' : '📞 تماس با فروشنده'}
                </button>
              ) : (
                <button disabled className="w-full bg-zinc-800 text-zinc-500 font-bold py-3.5 rounded-xl cursor-not-allowed">ناموجود</button>
              )}
              {contactVisible && (
                <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-4 text-sm space-y-2">
                  <p className="text-emerald-400 font-medium">اطلاعات فروشنده</p>
                  <p className="text-zinc-300">شناسه: <span className="font-mono text-zinc-200 text-xs">{product.sellerId}</span></p>
                  <p className="text-zinc-500 text-xs">⚠️ قبل از واریز وجه، کالا را تحویل بگیرید.</p>
                </div>
              )}
              <Link href="/shop" className="w-full block text-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium py-3 rounded-xl transition-colors">
                ← بازگشت به فروشگاه
              </Link>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {icon:'🛡️', label:'ضمانت اصالت'},
                {icon:'🚚', label:'ارسال سریع'},
                {icon:'↩️', label:'۷ روز مرجوعی'},
              ].map(b => (
                <div key={b.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col items-center gap-1 text-center">
                  <span className="text-xl">{b.icon}</span>
                  <p className="text-zinc-400 text-xs">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs: فروشندگان / مشخصات / مشابه ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-8">
          <div className="flex border-b border-zinc-800">
            {([
              {key:'sellers', label:'فروشندگان این کالا'},
              {key:'specs',   label:'مشخصات'},
              {key:'similar', label:'محصولات مشابه'},
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors border-b-2
                  ${activeTab===tab.key ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* فروشندگان */}
            {activeTab==='sellers' && (
              <div className="space-y-3">
                {MOCK_SELLERS.map((seller, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center text-emerald-400 font-bold text-sm">
                        {seller.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{seller.name}</p>
                        <p className="text-xs text-zinc-500">{seller.delivery}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-emerald-400 text-xs">رضایت {seller.score}</span>
                          <span className="bg-emerald-900/50 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-800">{seller.badge}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-emerald-400 font-bold text-sm">{formatPrice(finalPrice + i * 50000)} تومان</p>
                      <button className="mt-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                        افزودن به سبد
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* مشخصات */}
            {activeTab==='specs' && (
              <div className="space-y-0 divide-y divide-zinc-800">
                {[
                  ['دسته‌بندی', CATEGORY_LABELS[product.category]],
                  ['وضعیت', CONDITION_LABELS[product.condition]],
                  ['شهر', product.city],
                  ['موجودی', `${product.stock} عدد`],
                  ['بازدید', product.views.toLocaleString('fa-IR')],
                  ['تاریخ ثبت', new Date(product.createdAt).toLocaleDateString('fa-IR')],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between py-3">
                    <span className="text-zinc-500 text-sm">{k}</span>
                    <span className="text-zinc-200 text-sm font-medium">{v}</span>
                  </div>
                ))}
                {product.description && (
                  <div className="pt-4">
                    <p className="text-zinc-400 text-sm mb-2 font-medium">توضیحات</p>
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* محصولات مشابه */}
            {activeTab==='similar' && (
              related.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {related.map(p => {
                    const img = getImage(p)
                    const fp = p.discountPrice || p.price
                    return (
                      <Link key={p.id} href={`/shop/${p.id}`}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 flex flex-col gap-2 hover:border-emerald-600/50 transition-colors group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-zinc-800">
                          <img src={img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={e => { (e.target as HTMLImageElement).src = '/images/pool_chalk_1.jpg' }}/>
                        </div>
                        <p className="text-xs text-zinc-300 line-clamp-2 leading-snug">{p.title}</p>
                        <p className="text-emerald-400 font-bold text-xs">{formatPrice(fp)} <span className="text-zinc-500 font-normal">ت</span></p>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-8">محصول مشابهی پیدا نشد</p>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
