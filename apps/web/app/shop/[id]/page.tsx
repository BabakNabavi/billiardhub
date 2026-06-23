'use client'

// apps/web/app/shop/[id]/page.tsx
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────
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
  isFeatured: boolean
  isOfficialStore: boolean
  views: number
  sellerId: string
  createdAt: string
}

// ─── Helpers ─────────────────────────────────────────────
function formatPrice(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان'
}

const CATEGORY_LABELS: Record<string, string> = {
  cue: 'چوب بیلیارد',
  ball: 'گوی',
  table: 'میز',
  accessory: 'لوازم جانبی',
  clothing: 'پوشاک',
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'نو',
  used: 'دست دوم',
  refurbished: 'بازسازی‌شده',
}

// ─── Image Gallery ────────────────────────────────────────
function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800">
        <div className="text-center text-zinc-600">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">بدون تصویر</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="w-full aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
        <img
          src={images[active]}
          alt={`${title} - تصویر ${active + 1}`}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === active ? 'border-emerald-500' : 'border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contactVisible, setContactVisible] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'محصول پیدا نشد')
        setProduct(data.product)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchProduct()
  }, [params.id])

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white" dir="rtl">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-square bg-zinc-900 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-4 bg-zinc-800 rounded w-1/4" />
              <div className="h-8 bg-zinc-800 rounded w-3/4" />
              <div className="h-4 bg-zinc-800 rounded w-1/3" />
              <div className="h-24 bg-zinc-800 rounded" />
              <div className="h-12 bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error || !product) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-5xl mb-4">🎱</p>
          <p className="text-xl text-zinc-300 mb-2">{error || 'محصول پیدا نشد'}</p>
          <Link href="/shop" className="neon-btn mt-4 inline-block">بازگشت به فروشگاه</Link>
        </div>
      </div>
    )
  }

  const finalPrice = product.discountPrice || product.price

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-300 transition-colors">خانه</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-zinc-300 transition-colors">فروشگاه</Link>
          <span>/</span>
          <span className="text-zinc-300 line-clamp-1">{product.title}</span>
        </nav>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

          {/* Left: Gallery */}
          <div>
            <Gallery images={product.images} title={product.title} />

            {/* Video */}
            {product.video && (
              <div className="mt-4">
                <video
                  src={product.video}
                  controls
                  className="w-full rounded-xl border border-zinc-800"
                />
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="space-y-5">

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.isOfficialStore && (
                <span className="bg-emerald-900/50 border border-emerald-700 text-emerald-400 text-xs px-3 py-1 rounded-full">
                  ✓ فروشگاه رسمی
                </span>
              )}
              {product.isFeatured && (
                <span className="bg-amber-900/50 border border-amber-700 text-amber-400 text-xs px-3 py-1 rounded-full">
                  ⭐ ویژه
                </span>
              )}
              <span className="bg-zinc-800 text-zinc-400 text-xs px-3 py-1 rounded-full">
                {CATEGORY_LABELS[product.category] || product.category}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full ${
                product.condition === 'new'
                  ? 'bg-blue-900/50 border border-blue-700 text-blue-400'
                  : 'bg-orange-900/50 border border-orange-700 text-orange-400'
              }`}>
                {CONDITION_LABELS[product.condition] || product.condition}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white leading-snug">{product.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
              <span>📍 {product.city}</span>
              <span>👁 {product.views.toLocaleString('fa-IR')} بازدید</span>
              {product.stock > 0 && (
                <span className="text-emerald-500">✓ موجود ({product.stock.toLocaleString('fa-IR')} عدد)</span>
              )}
              {product.stock === 0 && (
                <span className="text-red-400">✗ ناموجود</span>
              )}
            </div>

            {/* Price */}
            <div className="dark-card">
              {product.discountPrice ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-emerald-400">{formatPrice(finalPrice)}</span>
                  <div className="flex flex-col">
                    <span className="text-zinc-500 line-through text-sm">{formatPrice(product.price)}</span>
                    <span className="text-red-400 text-sm font-medium">{product.discountPercent}٪ تخفیف</span>
                  </div>
                </div>
              ) : (
                <span className="text-3xl font-bold text-emerald-400">{formatPrice(product.price)}</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wide">توضیحات</h2>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* CTA */}
            <div className="space-y-3 pt-2">
              {product.stock > 0 ? (
                <>
                  <button
                    onClick={() => setContactVisible(v => !v)}
                    className="neon-btn w-full py-3 text-base"
                  >
                    {contactVisible ? 'پنهان کردن اطلاعات تماس' : '📞 تماس با فروشنده'}
                  </button>

                  {contactVisible && (
                    <div className="dark-card border-emerald-700/50 text-sm text-zinc-300 space-y-1">
                      <p className="text-zinc-400 text-xs mb-2">برای خرید با فروشنده تماس بگیرید:</p>
                      <p>شناسه فروشنده: <span className="font-mono text-zinc-200">{product.sellerId}</span></p>
                      <p className="text-xs text-zinc-500 mt-2">⚠️ در هنگام معامله دقت کنید و پول را قبل از دریافت کالا پرداخت نکنید.</p>
                    </div>
                  )}
                </>
              ) : (
                <button disabled className="w-full py-3 rounded-lg bg-zinc-800 text-zinc-500 cursor-not-allowed">
                  ناموجود
                </button>
              )}

              <Link href="/shop" className="ghost-btn w-full py-3 text-center block">
                ← بازگشت به فروشگاه
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
