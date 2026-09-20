'use client'

/* ─────────────────────────────────────────────────────────────
   صفحه‌ی محصولِ تولیدی.

   ── چرا صفحه، نه پنجره ──
   اول پنجره بود و مالک گفت باید مثل صفحه‌ی محصولِ بیلیارد بازار
   باشد. حق داشت: محصولِ یک تولیدکننده ممکن است ده عکس و یک متنِ
   بلند داشته باشد، و پنجره برای هیچ‌کدام جا ندارد. صفحه نشانیِ
   خودش را هم دارد، پس قابلِ هم‌رسانی است.

   ── چرا از پروفایل خوانده می‌شود نه از جدولِ محصولات ──
   این‌ها آگهیِ بازار نیستند؛ کاتالوگِ تولیدی‌اند و داخلِ همان
   `profiles.data` ذخیره می‌شوند. پس مسیرِ داده همان مسیرِ صفحه‌ی
   تولیدکننده است و درخواستِ تازه‌ای به جدولِ `products` نمی‌رود.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, MapPin, Phone } from 'lucide-react'
import { ProfileMissing, ProfileLoading } from '@/components/profile/ProfileMissing'
import { useProfileImageViewer } from '@/components/ProfileImageViewer'
import { fetchProfileResult } from '../../../../../lib/profiles/client'
import { profileToManufacturer } from '../../../../../lib/manufacturer-store'
import type { ManufacturerProfile } from '../../../../../lib/manufacturer-store'
import { productImages, type MfrProduct } from '../../../../../lib/manufacturers-data'
import { waNumber } from '../../../../../lib/phone-wa'
import { iranTel } from '../../../../../lib/iran-geo'
import { toFa, MONO } from '../../../../sellers/[id]/shared'
import './product-page.css'

export default function MfrProductPage() {
  const params = useParams()
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
  const mfrId = one(params?.id)
  const pid = one(params?.pid)

  const [mfr, setMfr] = useState<ReturnType<typeof profileToManufacturer> | null>(null)
  const [checked, setChecked] = useState(false)
  const [netFail, setNetFail] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [shown, setShown] = useState(0)
  const { open: openImage, viewer } = useProfileImageViewer()

  useEffect(() => {
    if (!mfrId) return
    let alive = true
    setChecked(false); setNetFail(false)
    void (async () => {
      try {
        const res = await fetchProfileResult<ManufacturerProfile>('manufacturer', mfrId)
        if (!alive) return
        if (res.state === 'error') { setNetFail(true); return }
        if (res.state === 'found') {
          const raw = { ...res.profile.data, slug: res.profile.slug, verified: res.profile.verified } as ManufacturerProfile
          setMfr(profileToManufacturer(raw))
        }
      } catch {
        if (alive) setNetFail(true)
      } finally {
        if (alive) setChecked(true)
      }
    })()
    return () => { alive = false }
  }, [mfrId, reloadKey])

  const product: MfrProduct | null = useMemo(
    () => (mfr?.products ?? []).find(p => p.id === pid) ?? null,
    [mfr, pid],
  )
  const gallery = useMemo(() => (product ? productImages(product) : []), [product])
  /* فهرست که کوتاه شود، نشانگر نباید بیرون بماند */
  const active = gallery.length ? Math.min(shown, gallery.length - 1) : 0

  /* محصول که عوض شود نشانگرِ گالری باید سرِ اول برگردد */
  useEffect(() => { setShown(0) }, [pid])

  const tel = iranTel(mfr?.phone, null, mfr?.city)
  const wa = waNumber(mfr?.whatsapp)

  /* یونیونِ تفکیک‌شده‌ی ProfileMissing یا هر دو پراپ را می‌خواهد یا
     هیچ‌کدام را — پس یک‌جا ساخته و پخش می‌شود. */
  const retryProps = netFail
    ? { netFail: true as const, onRetry: () => setReloadKey(k => k + 1) }
    : {}

  if (!checked) return <ProfileLoading />
  if (!mfr || !product) {
    return (
      <ProfileMissing
        icon={<MapPin size={34} />}
        title="محصول پیدا نشد"
        message="ممکن است این محصول حذف شده باشد یا نشانی تغییر کرده باشد."
        backHref={`/manufacturers/${mfrId}`} backLabel="بازگشت به تولیدکننده"
        {...retryProps}
      />
    )
  }

  return (
    <div dir="rtl" className="mpp">
      <div className="mpp-wrap">
        <nav aria-label="مسیر" className="mpp-crumb">
          <Link href="/">خانه</Link><span aria-hidden>/</span>
          <Link href="/manufacturers">تولیدکنندگان</Link><span aria-hidden>/</span>
          <Link href={`/manufacturers/${mfrId}`}>{mfr.name}</Link><span aria-hidden>/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="mpp-grid">
          {/* ── رسانه ── */}
          <div className="mpp-media">
            <div className="mpp-stage">
              {gallery.length ? (
                <button
                  type="button" className="mpp-zoom"
                  onClick={() => openImage(gallery, { index: active, title: product.name, alt: product.name })}
                  aria-label="بزرگ‌نمایی تصویر"
                >
                  <img src={gallery[active]} alt={product.name} decoding="async" />
                </button>
              ) : (
                <span className="mpp-noimg">بدون تصویر</span>
              )}
              {product.badge && <span className="mpp-badge">{product.badge}</span>}
            </div>

            {/* نوار عکس‌ها — فقط وقتی بیش از یکی هست */}
            {gallery.length > 1 && (
              <div className="mpp-thumbs">
                {gallery.map((src, i) => (
                  <button
                    key={`${src}-${i}`} type="button" onClick={() => setShown(i)}
                    aria-label={`تصویر ${toFa(i + 1)}`} aria-current={i === active}
                    className={i === active ? 'on' : undefined}
                  >
                    <img src={src} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── اطلاعات ── */}
          <div className="mpp-info">
            {product.category && <span className="mpp-cat">{product.category}</span>}
            <h1 className="mpp-name">{product.name}</h1>
            <Link href={`/manufacturers/${mfrId}`} className="mpp-maker">
              ساختِ {mfr.name}
              <ChevronLeft size={14} aria-hidden />
            </Link>

            {product.description && (
              <section className="mpp-block">
                <h2>توضیحات محصول</h2>
                <p>{product.description}</p>
              </section>
            )}

            {(product.specs ?? []).length > 0 && (
              <section className="mpp-block">
                <h2>مشخصات فنی</h2>
                <ul className="mpp-specs">
                  {(product.specs ?? []).map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </section>
            )}

            {/* ⚠️ قیمت و «افزودن به سبد» عمدا نیست: محصولِ کاتالوگ
                قیمت ندارد و راهِ ادامه تماس با خودِ تولیدکننده است. */}
            <div className="mpp-cta">
              {tel.href && (
                <a className="mpp-call" href={`tel:${tel.href}`}>
                  <Phone size={16} aria-hidden />
                  استعلام و سفارش
                  <span dir="ltr" className={MONO}>{toFa(tel.text)}</span>
                </a>
              )}
              {wa && (
                <a className="mpp-wa" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                  واتساپ
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      {viewer}
    </div>
  )
}
