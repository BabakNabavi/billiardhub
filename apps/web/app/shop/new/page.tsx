'use client'

// apps/web/app/shop/new/page.tsx
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────
interface FormData {
  title: string
  description: string
  price: string
  discountPrice: string
  category: string
  condition: string
  city: string
  stock: string
  images: string[]         // URLهای آپلود‌شده
  video: string
}

const CATEGORIES = [
  { value: 'cue', label: 'چوب بیلیارد' },
  { value: 'ball', label: 'گوی' },
  { value: 'table', label: 'میز' },
  { value: 'accessory', label: 'لوازم جانبی' },
  { value: 'clothing', label: 'پوشاک' },
]

const CONDITIONS = [
  { value: 'new', label: 'نو' },
  { value: 'used', label: 'دست دوم' },
  { value: 'refurbished', label: 'بازسازی‌شده' },
]

const CITIES = [
  'تهران', 'اصفهان', 'مشهد', 'شیراز', 'تبریز',
  'کرج', 'اهواز', 'قم', 'رشت', 'زاهدان',
]

// ─── Field Components ─────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
      {children}
      {required && <span className="text-red-400 mr-1">*</span>}
    </label>
  )
}

function Input({
  value, onChange, placeholder, type = 'text', dir
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  dir?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      dir={dir}
      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
    />
  )
}

// ─── Image URL Input ──────────────────────────────────────
// فعلاً URL وارد می‌کنیم؛ وقتی Supabase Storage آماده شد، آپلود واقعی اضافه می‌شود
function ImageInput({
  images,
  onChange,
}: {
  images: string[]
  onChange: (imgs: string[]) => void
}) {
  const [urlInput, setUrlInput] = useState('')
  const [error, setError] = useState('')

  function addUrl() {
    const url = urlInput.trim()
    if (!url) return
    if (!url.startsWith('http')) {
      setError('URL باید با http شروع شود')
      return
    }
    if (images.length >= 5) {
      setError('حداکثر ۵ تصویر')
      return
    }
    if (images.includes(url)) {
      setError('این تصویر قبلاً اضافه شده')
      return
    }
    onChange([...images, url])
    setUrlInput('')
    setError('')
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
          placeholder="https://example.com/image.jpg"
          dir="ltr"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 text-sm"
        />
        <button
          type="button"
          onClick={addUrl}
          className="ghost-btn px-4 text-sm flex-shrink-0"
        >
          + اضافه
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Preview */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group w-20 h-20">
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover rounded-lg border border-zinc-700"
                onError={e => { (e.target as HTMLImageElement).src = '' }}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 right-0 left-0 text-center bg-black/60 text-white text-xs py-0.5 rounded-b-lg">
                  اصلی
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-zinc-600 text-xs">
        {images.length}/5 تصویر · اولین تصویر به عنوان تصویر اصلی نمایش داده می‌شود
      </p>
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────
export default function NewProductPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    category: '',
    condition: 'new',
    city: '',
    stock: '1',
    images: [],
    video: '',
  })

  function set(key: keyof FormData, value: string | string[]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setFieldErrors(prev => ({ ...prev, [key]: '' }))
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormData, string>> = {}
    if (!form.title.trim()) errors.title = 'عنوان الزامی است'
    else if (form.title.length < 5) errors.title = 'عنوان باید حداقل ۵ کاراکتر باشد'

    if (!form.price) errors.price = 'قیمت الزامی است'
    else if (isNaN(Number(form.price)) || Number(form.price) <= 0) errors.price = 'قیمت معتبر نیست'

    if (form.discountPrice) {
      const disc = Number(form.discountPrice)
      if (isNaN(disc) || disc <= 0) errors.discountPrice = 'قیمت تخفیف معتبر نیست'
      else if (disc >= Number(form.price)) errors.discountPrice = 'قیمت تخفیف باید کمتر از قیمت اصلی باشد'
    }

    if (!form.category) errors.category = 'دسته‌بندی الزامی است'
    if (!form.city) errors.city = 'شهر الزامی است'

    if (form.stock && (isNaN(Number(form.stock)) || Number(form.stock) < 0)) {
      errors.stock = 'موجودی معتبر نیست'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setServerError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // محاسبه درصد تخفیف
      let discountPercent: number | null = null
      if (form.discountPrice && form.price) {
        const orig = Number(form.price)
        const disc = Number(form.discountPrice)
        discountPercent = Math.round(((orig - disc) / orig) * 100)
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
          discountPercent,
          category: form.category,
          condition: form.condition,
          city: form.city,
          stock: Number(form.stock) || 1,
          images: form.images,
          video: form.video.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت محصول')

      // موفق — برو به صفحه محصول
      router.push(`/shop/${data.product.id}`)
    } catch (e: any) {
      setServerError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/shop" className="text-zinc-400 hover:text-zinc-200 transition-colors">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold">ثبت محصول جدید</h1>
            <p className="text-zinc-500 text-sm">محصول خود را در فروشگاه Billiard Plus بفروشید</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* عنوان */}
          <div>
            <Label required>عنوان محصول</Label>
            <Input
              value={form.title}
              onChange={v => set('title', v)}
              placeholder="مثال: چوب بیلیارد Predator P3 - نو"
            />
            {fieldErrors.title && <p className="text-red-400 text-xs mt-1">{fieldErrors.title}</p>}
          </div>

          {/* توضیحات */}
          <div>
            <Label>توضیحات</Label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="توضیحات کامل محصول، ویژگی‌ها، وضعیت، دلیل فروش و..."
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* دسته‌بندی و وضعیت */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>دسته‌بندی</Label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">انتخاب کنید</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {fieldErrors.category && <p className="text-red-400 text-xs mt-1">{fieldErrors.category}</p>}
            </div>
            <div>
              <Label required>وضعیت</Label>
              <select
                value={form.condition}
                onChange={e => set('condition', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {CONDITIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* قیمت */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>قیمت (تومان)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={v => set('price', v)}
                placeholder="مثال: 5000000"
                dir="ltr"
              />
              {fieldErrors.price && <p className="text-red-400 text-xs mt-1">{fieldErrors.price}</p>}
            </div>
            <div>
              <Label>قیمت با تخفیف (اختیاری)</Label>
              <Input
                type="number"
                value={form.discountPrice}
                onChange={v => set('discountPrice', v)}
                placeholder="مثال: 4500000"
                dir="ltr"
              />
              {fieldErrors.discountPrice && <p className="text-red-400 text-xs mt-1">{fieldErrors.discountPrice}</p>}
              {form.price && form.discountPrice && !fieldErrors.discountPrice && Number(form.discountPrice) < Number(form.price) && (
                <p className="text-emerald-500 text-xs mt-1">
                  {Math.round(((Number(form.price) - Number(form.discountPrice)) / Number(form.price)) * 100)}٪ تخفیف
                </p>
              )}
            </div>
          </div>

          {/* شهر و موجودی */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>شهر</Label>
              <select
                value={form.city}
                onChange={e => set('city', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">انتخاب کنید</option>
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {fieldErrors.city && <p className="text-red-400 text-xs mt-1">{fieldErrors.city}</p>}
            </div>
            <div>
              <Label>موجودی (عدد)</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={v => set('stock', v)}
                placeholder="۱"
                dir="ltr"
              />
              {fieldErrors.stock && <p className="text-red-400 text-xs mt-1">{fieldErrors.stock}</p>}
            </div>
          </div>

          {/* تصاویر */}
          <div>
            <Label>تصاویر محصول</Label>
            <ImageInput images={form.images} onChange={imgs => set('images', imgs)} />
            <p className="text-zinc-600 text-xs mt-1">
              فعلاً URL تصویر وارد کنید · آپلود مستقیم به‌زودی اضافه می‌شود
            </p>
          </div>

          {/* ویدیو */}
          <div>
            <Label>لینک ویدیو (اختیاری)</Label>
            <Input
              value={form.video}
              onChange={v => set('video', v)}
              placeholder="https://..."
              dir="ltr"
            />
          </div>

          {/* Server error */}
          {serverError && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="neon-btn flex-1 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  در حال ثبت...
                </span>
              ) : '✓ ثبت محصول'}
            </button>
            <Link href="/shop" className="ghost-btn px-6 py-3 text-center">
              انصراف
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}
