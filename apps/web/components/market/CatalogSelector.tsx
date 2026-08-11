'use client'

/* ═══════════════════════════════════════════════════════════════
   انتخابگرِ کاتالوگ — نوع ← برند ← مدل. برای چوب و میز، یکی.
   ───────────────────────────────────────────────────────────────
   ── چرا داده را fetch می‌کند و import نمی‌کند ──
   دو کاتالوگ روی هم بیش از صد کیلوبایت‌اند. اگر این کامپوننت واردشان
   کند، همان حجم در باندلِ هر بازدیدکننده‌ی فرم می‌نشیند. به‌جایش
   برندهای **همان نوعی که کاربر انتخاب کرده** از
   `/api/catalog/[category]/[type]` می‌آید: بینِ ۶ تا ۲۲ کیلوبایت،
   استاتیک، با کشِ یک‌ساله. کسی که «تیپ» ثبت می‌کند چیزی دانلود
   نمی‌کند.

   ── چرا یک کامپوننت برای هر دو ──
   ساختارِ دو کاتالوگ یکی است. نسخه‌ی دومی که فقط `cue` را به
   `table` عوض می‌کرد، همان الگوی «دو سیستم برای یک چیز» می‌شد که
   در این پروژه بارها باگ ساخته: دو فرمِ آگهی، سه سازنده‌ی کارت، دو
   منبعِ فروشگاه. پس دسته یک prop است.

   ── وابستگیِ آبشاری ──
   عوض‌شدنِ نوع ⇒ برند و مدل پاک می‌شوند. این اختیاری نیست: برندها
   بینِ نوع‌ها مشترک نیستند و شناسه‌ی برندِ اسنوکر در پاکت بی‌معناست.
   عوض‌شدنِ برند ⇒ مدل پاک می‌شود.

   ── «سایر» ──
   ته هر دو فهرست. در سطحِ برند، انتخابش فیلدِ مدل را هم به متنِ آزاد
   تبدیل می‌کند — چون وقتی برند در فهرست نیست، مدلش هم قطعاً نیست.

   ── نوعِ بدونِ فهرست ──
   «میز خانگی» `force_free_input` دارد: هیچ دراپ‌داونی نمی‌آید و هر
   دو فیلد متنِ آزادند. منطق روی همان پرچمِ داده نوشته شده، نه روی
   شناسه‌ی نوع.

   ظاهر عمداً از `AdFormFields` می‌آید و چیزی از نو ساخته نشده.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FancySelect, Label, ErrMsg, inp, GOLD, GOLD_D, TEXT_MUT, TEXT_SEC,
  type FancyOption,
} from './AdFormFields'
/* از `catalog-rules` وارد می‌شود نه `catalog`: دومی هر دو JSON را
   ایستا می‌آورد و این کامپوننت کلاینت است. */
import {
  MAX_CUSTOM_LEN, validateSelection,
  type CatalogBrand, type CatalogCountry, type CatalogId,
  type CatalogSelection, type CatalogSize,
  brandSearchTerms, brandMatchesName, normalizeBrandKey,
} from '../../lib/market/catalog-rules'
import CountryFlag from '../CountryFlag'

export const CUE_OTHER = '__other__'

export interface CatalogPayload {
  category: CatalogId
  type: string
  label_fa: string
  brands: CatalogBrand[]
  sizes: CatalogSize[]
  forceFreeInput: boolean
  countries: Record<string, CatalogCountry>
}

/* کشِ درون‌حافظه‌ای: برگشتن به نوعی که قبلاً دیده شده درخواست نمی‌زند.
   کلید شاملِ دسته است، وگرنه «اسنوکرِ چوب» و «اسنوکرِ میز» — که هر دو
   `snooker` نام دارند — روی هم می‌افتادند. */
const cache = new Map<string, CatalogPayload>()

export interface CatalogFetchState {
  data: CatalogPayload | null
  loading: boolean
  failed: boolean
}
/* ── یک درخواست، دو مصرف‌کننده ──
   فیلدِ سایز در کارتِ «مشخصات فنی» است و این انتخابگر در کارتِ برند،
   ولی هر دو همین payload را می‌خواهند. کشِ ماژول به‌تنهایی کافی نبود:
   هر دو در یک commit سوار می‌شوند و چون کش فقط **پس از** رسیدنِ پاسخ
   پر می‌شود، هر دو کش را خالی می‌دیدند و دو درخواستِ هم‌زمان می‌زدند.
   پس وعده‌ی در جریان هم نگه داشته می‌شود.

   ── چرا خروجی با نوع سنجیده می‌شود ──
   با عوض‌شدنِ نوع، یک رندر پیش از اجرای effect اتفاق می‌افتد و در آن
   رندر `data` هنوز payloadِ **نوعِ قبلی** است. مصرف‌کننده در همان
   لحظه فهرستِ برندِ نوعِ قبلی را زنده نشان می‌دهد و فیلدِ سایز
   پیش‌فرضِ نوعِ قبلی را می‌نشاند — و سرور بعداً همان را رد می‌کند.
   payload خودش دسته و نوعش را دارد، پس همین‌جا تطبیق داده می‌شود. */
const inflight = new Map<string, Promise<CatalogPayload>>()

function loadCatalog(category: CatalogId, type: string): Promise<CatalogPayload> {
  const key = `${category}/${type}`
  const running = inflight.get(key)
  if (running) return running
  const p = (async () => {
    const r = await fetch(`/api/catalog/${category}/${type}`)
    if (!r.ok) throw new Error(String(r.status))
    const j = (await r.json()) as CatalogPayload
    cache.set(key, j)
    return j
  })().finally(() => { inflight.delete(key) })
  inflight.set(key, p)
  return p
}

export function useCatalogType(category: CatalogId, type: string): CatalogFetchState {
  const key = `${category}/${type}`
  const [data, setData] = useState<CatalogPayload | null>(() => cache.get(key) ?? null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const reqId = useRef(0)

  useEffect(() => {
    /* هر اجرا پاسخ‌های در راه را باطل می‌کند — از جمله وقتی نوعِ تازه
       در کش هست و اصلاً درخواستی زده نمی‌شود. بدونِ این، پاسخِ کهنه
       روی داده‌ی درست می‌نشست. */
    const id = ++reqId.current
    if (!type) { setData(null); setLoading(false); setFailed(false); return }

    const hit = cache.get(key)
    if (hit) { setData(hit); setLoading(false); setFailed(false); return }

    setLoading(true); setFailed(false)
    void loadCatalog(category, type)
      .then(j => { if (id === reqId.current) { setData(j); setFailed(false) } })
      .catch(() => { if (id === reqId.current) { setData(null); setFailed(true) } })
      .finally(() => { if (id === reqId.current) setLoading(false) })
  }, [key, category, type])

  /* داده‌ی نوعِ قبلی هرگز به مصرف‌کننده نمی‌رسد */
  const fresh = data && data.category === category && data.type === type ? data : null
  return { data: fresh, loading: loading || (!fresh && !failed && !!type), failed }
}

/* ── پرچم ──
   ایموجی بود و روی ویندوز به «GB» تبدیل می‌شد؛ حالا SVG است.
   دلیلِ کامل در خودِ `CountryFlag`. عرضِ ثابت دارد تا نامِ برندها
   در ستون هم‌تراز بمانند. */
function Flag({ code, countries }: { code: string | null; countries: Record<string, CatalogCountry> }) {
  const c = code ? countries[code] : undefined
  return <CountryFlag code={code} label={c?.fa ?? 'کشور نامشخص'} />
}

export interface CatalogValue {
  brandId: string | null
  brandCustom: string
  modelId: string | null
  modelCustom: string
}

export const EMPTY_CATALOG_VALUE: CatalogValue =
  { brandId: null, brandCustom: '', modelId: null, modelCustom: '' }

export default function CatalogSelector({
  category, type, value, onChange, errors = {}, resolveFrom,
}: {
  /** `cue` یا `table` — کدام کاتالوگ */
  category: CatalogId
  /** شناسه‌ی نوع در همان کاتالوگ؛ خالی یعنی هنوز انتخاب نشده */
  type: string
  value: CatalogValue
  /* برچسبِ نمایشی همراهِ مقدار برمی‌گردد: والد داده‌ی کاتالوگ را
     ندارد و نباید برای ساختنِ نامِ برند دوباره fetch کند. */
  onChange: (v: CatalogValue, labels: { brand: string; model: string }) => void
  errors?: Record<string, string>
  /* آگهیِ موجود فقط نامِ رشته‌ای دارد، نه شناسه. یک‌بار پس از
     آمدنِ داده تلاش می‌کنیم نام را به برندِ کاتالوگ نگاشت کنیم؛ اگر
     نشد، همان نام در «سایر» می‌نشیند تا چیزی گم نشود. */
  resolveFrom?: { brand: string; model: string }
}) {
  const { data, loading, failed } = useCatalogType(category, type)
  const freeInput = !!data?.forceFreeInput

  /* ── بازیابیِ آگهیِ قدیمی ──
     فقط یک‌بار و فقط وقتی هنوز چیزی انتخاب نشده. تطبیق بدونِ
     حساسیتِ حروف و فاصله، روی نامِ انگلیسی و فارسی. ناموفق ⇒ همان
     رشته در «سایر» می‌نشیند؛ هیچ داده‌ای دور ریخته نمی‌شود. */
  const resolved = useRef(false)
  useEffect(() => {
    if (resolved.current || !data || !resolveFrom) return
    if (value.brandId || value.brandCustom) { resolved.current = true; return }
    const want = resolveFrom.brand.trim()
    if (!want) return
    resolved.current = true
    /* تطبیق از تابعِ مشترکِ catalog-rules می‌آید — همان که جست‌وجو
       هم از آن استفاده می‌کند، پس aliases هر دو جا کار می‌کند. */
    const hit = data.brands.find(b => brandMatchesName(b, want))
    if (!hit) {
      emit({ brandId: CUE_OTHER, brandCustom: want, modelId: null, modelCustom: resolveFrom.model.trim() })
      return
    }
    const mWant = resolveFrom.model.trim()
    const mHit = mWant ? hit.models.find(m => normalizeBrandKey(m.name_en) === normalizeBrandKey(mWant) || normalizeBrandKey(m.name_fa) === normalizeBrandKey(mWant)) : undefined
    emit({
      brandId: hit.id,
      brandCustom: "",
      modelId: mHit ? mHit.id : (mWant ? CUE_OTHER : null),
      modelCustom: mHit ? "" : mWant,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, resolveFrom])

  const brand = useMemo(
    () => (value.brandId ? data?.brands.find(b => b.id === value.brandId) : undefined),
    [data, value.brandId],
  )
  const isOtherBrand = value.brandId === CUE_OTHER
  const isOtherModel = value.modelId === CUE_OTHER

  const brandOptions: FancyOption[] = useMemo(() => {
    if (!data) return []
    const rows: FancyOption[] = data.brands.map(b => ({
      value: b.id,
      label: b.name_en,
      /* جست‌وجو روی انگلیسی، فارسی و نامِ کشور — کاربر ممکن است
         «پرادون» یا «Peradon» یا «انگلستان» تایپ کند */
      search: brandSearchTerms(b, b.country ? data.countries[b.country]?.fa : '').join(' '),
      node: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Flag code={b.country} countries={data.countries} />
          <span style={{ fontWeight: 600 }}>{b.name_en}</span>
          <span style={{ fontSize: 12, color: TEXT_MUT }}>{b.name_fa}</span>
          <span style={{ marginInlineStart: 'auto', fontSize: 11, color: TEXT_MUT, flexShrink: 0 }}>
            {b.models.length.toLocaleString('fa-IR')} مدل
          </span>
        </span>
      ),
    }))
    rows.push({
      value: CUE_OTHER,
      label: 'سایر',
      search: 'سایر other',
      node: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 21, textAlign: 'center', color: GOLD, fontSize: 16 }}>+</span>
          <span style={{ color: GOLD_D, fontWeight: 700 }}>سایر</span>
          <span style={{ fontSize: 12, color: TEXT_MUT }}>برند در فهرست نیست</span>
        </span>
      ),
    })
    return rows
  }, [data])

  const modelOptions: FancyOption[] = useMemo(() => {
    if (!brand) return []
    /* منسوخ‌ها ته فهرست — چوبِ دستِ‌دوم است و باید بمانند */
    const ordered = [...brand.models].sort(
      (a, b) => Number(!!a.discontinued) - Number(!!b.discontinued),
    )
    const rows: FancyOption[] = ordered.map(m => ({
      value: m.id,
      label: m.name_en,
      search: `${m.name_en} ${m.name_fa}`,
      group: m.group,
      node: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontWeight: 600 }}>{m.name_en}</span>
          <span style={{ fontSize: 12, color: TEXT_MUT }}>{m.name_fa}</span>
          {m.discontinued && (
            <span style={{ marginInlineStart: 'auto', fontSize: 10, color: TEXT_MUT, background: 'rgba(28,28,26,0.06)', padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>
              منسوخ
            </span>
          )}
        </span>
      ),
    }))
    rows.push({
      value: CUE_OTHER,
      label: 'سایر',
      search: 'سایر other',
      node: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 21, textAlign: 'center', color: GOLD, fontSize: 16 }}>+</span>
          <span style={{ color: GOLD_D, fontWeight: 700 }}>سایر</span>
          <span style={{ fontSize: 12, color: TEXT_MUT }}>مدل در فهرست نیست</span>
        </span>
      ),
    })
    return rows
  }, [brand])

  /* ── هشدارِ تکراری ──
     اگر متنِ دستی با نامِ یک برندِ موجود یکی درآمد، پیش از ساختنِ
     رکوردِ تکراری به کاربر بگو. مقایسه بدونِ فاصله و حساسیتِ حروف. */
  const dupBrand = useMemo(() => {
    if (!data || !value.brandCustom.trim()) return null
    return data.brands.find(b => brandMatchesName(b, value.brandCustom)) ?? null
  }, [value.brandCustom, data])

  const emit = (next: CatalogValue) => {
    const b = next.brandId && next.brandId !== CUE_OTHER
      ? data?.brands.find(x => x.id === next.brandId) : undefined
    onChange(next, { brand: brandText(next, b), model: modelText(next, b) })
  }
  const set = (patch: Partial<CatalogValue>) => emit({ ...value, ...patch })

  const pickBrand = (id: string) =>
    set({ brandId: id, modelId: null, modelCustom: '', brandCustom: id === CUE_OTHER ? value.brandCustom : '' })

  /* ── نوعِ بدونِ فهرست ──
     «میز خانگی» برند و مدلِ مشخصی ندارد؛ اجبار به انتخاب از فهرست
     یا آگهی را رها می‌کند یا داده‌ی الکی می‌سازد. پس هر دو فیلد متنِ
     آزادند و هیچ‌کدام ستاره ندارد. شرط روی پرچمِ داده است نه روی
     شناسه‌ی نوع، تا نوعِ بعدی فقط با عوض‌شدنِ داده همین شود. */
  if (freeInput) {
    return (
      <>
        <div>
          <Label>برند</Label>
          <input className="nf" type="text" maxLength={MAX_CUSTOM_LEN}
            value={value.brandCustom}
            onChange={e => set({ brandId: null, modelId: null, brandCustom: e.target.value })}
            placeholder="نام برند (اگر می‌دانید)"
            style={inp(errors.brand)} />
          <ErrMsg msg={errors.brand} />
        </div>
        <div>
          <Label>مدل</Label>
          <input className="nf" type="text" maxLength={MAX_CUSTOM_LEN}
            value={value.modelCustom}
            onChange={e => set({ modelId: null, modelCustom: e.target.value })}
            placeholder="نام یا توضیح مدل (اختیاری)"
            style={inp(errors.model)} />
          <ErrMsg msg={errors.model} />
        </div>
      </>
    )
  }

  return (
    <>
      <div>
        <Label required>برند</Label>
        <FancySelect
          value={value.brandId ?? ''}
          onChange={pickBrand}
          options={brandOptions}
          disabled={!type || !data}
          error={!!errors.brand}
          placeholder={
            !type ? 'ابتدا نوع را انتخاب کنید'
              : loading ? 'در حال بارگذاری برندها...'
                : failed ? 'فهرست برندها نیامد — دوباره تلاش کنید'
                  : 'انتخاب برند...'
          }
        />
        {isOtherBrand && (
          <>
            <input className="nf" type="text" autoFocus maxLength={MAX_CUSTOM_LEN}
              value={value.brandCustom}
              onChange={e => set({ brandCustom: e.target.value })}
              placeholder="نام برند را وارد کنید"
              style={{ ...inp(errors.brand), marginTop: 8, background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
            {dupBrand && (
              <button type="button" onClick={() => pickBrand(dupBrand.id)}
                style={{ marginTop: 6, width: '100%', textAlign: 'start', padding: '9px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Vazirmatn,Tahoma,sans-serif', fontSize: 12.5, color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.32)' }}>
                منظورتان <b>{dupBrand.name_en}</b> است؟ برای انتخاب از فهرست بزنید.
              </button>
            )}
          </>
        )}
        <ErrMsg msg={errors.brand} />
      </div>

      <div>
        {/* مدل عمداً ستاره ندارد: فروشنده‌ی دستِ‌دوم اغلب مدلِ دقیق را
            نمی‌داند و اجبارش یا آگهی را رها می‌کند یا داده‌ی الکی می‌سازد */}
        <Label>مدل</Label>
        {isOtherBrand ? (
          <input className="nf" type="text" maxLength={MAX_CUSTOM_LEN}
            value={value.modelCustom}
            onChange={e => set({ modelCustom: e.target.value })}
            placeholder="نام مدل (اختیاری)"
            style={inp()} />
        ) : (
          <>
            <FancySelect
              value={value.modelId ?? ''}
              onChange={id => set({ modelId: id, modelCustom: id === CUE_OTHER ? value.modelCustom : '' })}
              options={modelOptions}
              disabled={!brand}
              error={!!errors.model}
              placeholder={brand ? 'انتخاب مدل...' : 'ابتدا برند را انتخاب کنید'}
            />
            {isOtherModel && (
              <input className="nf" type="text" autoFocus maxLength={MAX_CUSTOM_LEN}
                value={value.modelCustom}
                onChange={e => set({ modelCustom: e.target.value })}
                placeholder="نام مدل را وارد کنید"
                style={{ ...inp(), marginTop: 8, background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
            )}
          </>
        )}
        <ErrMsg msg={errors.model} />
      </div>

      {(brand || value.brandCustom.trim()) && (
        <div style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(199,166,106,0.07)', border: '1px solid rgba(199,166,106,0.22)' }}>
          <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 4 }}>ثبت می‌شود</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700 }}>
            {brand && data && <Flag code={brand.country} countries={data.countries} />}
            <span style={{ color: TEXT_SEC }}>
              {brandText(value, brand)}
              {modelText(value, brand) ? ` · ${modelText(value, brand)}` : ''}
            </span>
          </div>
        </div>
      )}
    </>
  )
}

/* ── برچسبِ نمایشی ──
   مقدارِ دستی بر شناسه مقدم است: وقتی کاربر خودش نوشته یعنی فهرست
   جوابش نداده. همین قاعده در `lib/market/catalog.ts` هم هست تا
   سرور و کارتِ آگهی همان را بسازند. */
export function brandText(v: CatalogValue, brand?: CatalogBrand): string {
  if (v.brandId === CUE_OTHER || !v.brandId) return v.brandCustom.trim()
  return brand?.name_en ?? ''
}

export function modelText(v: CatalogValue, brand?: CatalogBrand): string {
  if (v.brandId === CUE_OTHER || v.modelId === CUE_OTHER || !v.modelId) return v.modelCustom.trim()
  return brand?.models.find(m => m.id === v.modelId)?.name_en ?? ''
}

/** همان اعتبارسنجیِ سرور، با برندهای همین نوع — کاتالوگ وارد نمی‌شود */
export function checkCatalog(
  category: CatalogId, type: string, v: CatalogValue,
  brands: CatalogBrand[], opts: { forceFreeInput?: boolean } = {},
) {
  const sel: CatalogSelection = {
    category,
    type,
    brandId: v.brandId === CUE_OTHER ? null : v.brandId,
    brandCustom: v.brandId === CUE_OTHER ? v.brandCustom : null,
    modelId: v.modelId === CUE_OTHER ? null : v.modelId,
    modelCustom: v.modelId === CUE_OTHER || v.brandId === CUE_OTHER ? v.modelCustom : null,
  }
  return validateSelection(sel, id => brands.find(b => b.id === id), opts)
}
