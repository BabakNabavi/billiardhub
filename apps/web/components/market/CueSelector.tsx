'use client'

/* ═══════════════════════════════════════════════════════════════
   انتخابگرِ چوب — نوع ← برند ← مدل.
   ───────────────────────────────────────────────────────────────
   ── چرا داده را fetch می‌کند و import نمی‌کند ──
   کاتالوگ ۹۸ کیلوبایت است. اگر این کامپوننت واردش کند، همان حجم در
   باندلِ هر بازدیدکننده‌ی فرم می‌نشیند. به‌جایش برندهای **همان نوعی
   که کاربر انتخاب کرده** از `/api/cue-catalog/[type]` می‌آید:
   بینِ ۶ تا ۲۲ کیلوبایت، استاتیک، با کشِ یک‌ساله. یعنی کسی که
   «میز» ثبت می‌کند اصلاً چیزی دانلود نمی‌کند.

   ── وابستگیِ آبشاری ──
   عوض‌شدنِ نوع ⇒ برند و مدل پاک می‌شوند. این اختیاری نیست: برندها
   بینِ نوع‌ها مشترک نیستند و شناسه‌ی برندِ اسنوکر در پاکت بی‌معناست.
   عوض‌شدنِ برند ⇒ مدل پاک می‌شود.

   ── «سایر» ──
   ته هر دو فهرست. در سطحِ برند، انتخابش فیلدِ مدل را هم به متنِ آزاد
   تبدیل می‌کند — چون وقتی برند در فهرست نیست، مدلش هم قطعاً نیست.

   ظاهر عمداً از `AdFormFields` می‌آید و چیزی از نو ساخته نشده.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FancySelect, Label, ErrMsg, inp, GOLD, GOLD_D, TEXT_MUT, TEXT_SEC,
  type FancyOption,
} from './AdFormFields'
/* از `cue-rules` وارد می‌شود نه `cue-catalog`: دومی JSONِ ۹۸
   کیلوبایتی را ایستا می‌آورد و این کامپوننت کلاینت است. */
import {
  MAX_CUSTOM_LEN, validateCueSelection,
  type CueBrand, type CueCountry, type CueSelection,
} from '../../lib/market/cue-rules'

export const CUE_OTHER = '__other__'

interface Payload { brands: CueBrand[]; countries: Record<string, CueCountry> }

/* کشِ درون‌حافظه‌ای: برگشتن به نوعی که قبلاً دیده شده درخواست نمی‌زند */
const cache = new Map<string, Payload>()

/* ── پرچم ──
   بدونِ کتابخانه‌ی تازه. روی iOS و اندرویدِ امروزی — که مخاطبِ اصلیِ
   این سایت‌اند — ایموجی درست رندر می‌شود؛ روی ویندوز حروف نشان
   می‌دهد و برای همان `title` و `aria-label` فارسی گذاشته شده. عرضِ
   ثابت دارد تا نامِ برندها در ستون هم‌تراز بمانند. */
function Flag({ code, countries }: { code: string | null; countries: Record<string, CueCountry> }) {
  const c = code ? countries[code] : undefined
  return (
    <span
      title={c?.fa ?? 'کشور نامشخص'}
      aria-label={c?.fa ?? 'کشور نامشخص'}
      style={{
        width: 22, flexShrink: 0, display: 'inline-block', textAlign: 'center',
        fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
        fontSize: 15, lineHeight: '22px',
      }}
    >{c?.flag ?? '—'}</span>
  )
}

export interface CueValue {
  brandId: string | null
  brandCustom: string
  modelId: string | null
  modelCustom: string
}

export const EMPTY_CUE: CueValue = { brandId: null, brandCustom: '', modelId: null, modelCustom: '' }

export default function CueSelector({
  cueType, value, onChange, errors = {},
}: {
  /** یکی از چهار نوعِ چوب؛ خالی یعنی هنوز انتخاب نشده */
  cueType: string
  value: CueValue
  /* برچسبِ نمایشی همراهِ مقدار برمی‌گردد: والد داده‌ی کاتالوگ را
     ندارد و نباید برای ساختنِ نامِ برند دوباره fetch کند. */
  onChange: (v: CueValue, labels: { brand: string; model: string }) => void
  errors?: Record<string, string>
}) {
  const [data, setData] = useState<Payload | null>(() => cache.get(cueType) ?? null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const reqId = useRef(0)

  useEffect(() => {
    if (!cueType) { setData(null); setFailed(false); return }
    const hit = cache.get(cueType)
    if (hit) { setData(hit); setFailed(false); return }

    const id = ++reqId.current
    setLoading(true); setFailed(false)
    void (async () => {
      try {
        const r = await fetch(`/api/cue-catalog/${cueType}`)
        if (!r.ok) throw new Error(String(r.status))
        const j = (await r.json()) as Payload
        cache.set(cueType, j)
        /* پاسخِ کهنه نباید روی نوعِ تازه بنشیند */
        if (id === reqId.current) setData(j)
      } catch {
        if (id === reqId.current) { setData(null); setFailed(true) }
      } finally {
        if (id === reqId.current) setLoading(false)
      }
    })()
  }, [cueType])

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
      search: [b.name_en, b.name_fa, b.country ? data.countries[b.country]?.fa : ''].join(' '),
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
          <span style={{ width: 22, textAlign: 'center', color: GOLD, fontSize: 16 }}>+</span>
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
          <span style={{ width: 22, textAlign: 'center', color: GOLD, fontSize: 16 }}>+</span>
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
    const k = value.brandCustom.trim().toLowerCase().replace(/\s+/g, '')
    if (!k || !data) return null
    return data.brands.find(
      b => b.name_en.toLowerCase().replace(/\s+/g, '') === k
        || b.name_fa.replace(/\s+/g, '') === value.brandCustom.trim().replace(/\s+/g, ''),
    ) ?? null
  }, [value.brandCustom, data])

  const emit = (next: CueValue) => {
    const b = next.brandId && next.brandId !== CUE_OTHER
      ? data?.brands.find(x => x.id === next.brandId) : undefined
    onChange(next, { brand: cueBrandText(next, b), model: cueModelText(next, b) })
  }
  const set = (patch: Partial<CueValue>) => emit({ ...value, ...patch })

  const pickBrand = (id: string) =>
    set({ brandId: id, modelId: null, modelCustom: '', brandCustom: id === CUE_OTHER ? value.brandCustom : '' })

  return (
    <>
      <div>
        <Label required>برند</Label>
        <FancySelect
          value={value.brandId ?? ''}
          onChange={pickBrand}
          options={brandOptions}
          disabled={!cueType || !data}
          error={!!errors.brand}
          placeholder={
            !cueType ? 'ابتدا نوع را انتخاب کنید'
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
              {cueBrandText(value, brand)}
              {cueModelText(value, brand) ? ` · ${cueModelText(value, brand)}` : ''}
            </span>
          </div>
        </div>
      )}
    </>
  )
}

/* ── برچسبِ نمایشی ──
   مقدارِ دستی بر شناسه مقدم است: وقتی کاربر خودش نوشته یعنی فهرست
   جوابش نداده. همین قاعده در `lib/market/cue-catalog.ts` هم هست تا
   سرور و کارتِ آگهی همان را بسازند. */
export function cueBrandText(v: CueValue, brand?: CueBrand): string {
  if (v.brandId === CUE_OTHER || !v.brandId) return v.brandCustom.trim()
  return brand?.name_en ?? ''
}

export function cueModelText(v: CueValue, brand?: CueBrand): string {
  if (v.brandId === CUE_OTHER || v.modelId === CUE_OTHER || !v.modelId) return v.modelCustom.trim()
  return brand?.models.find(m => m.id === v.modelId)?.name_en ?? ''
}

/** همان اعتبارسنجیِ سرور، با برندهای همین نوع — کاتالوگ وارد نمی‌شود */
export function checkCue(cueType: string, v: CueValue, brands: CueBrand[]) {
  const sel: CueSelection = {
    cueType,
    brandId: v.brandId === CUE_OTHER ? null : v.brandId,
    brandCustom: v.brandId === CUE_OTHER ? v.brandCustom : null,
    modelId: v.modelId === CUE_OTHER ? null : v.modelId,
    modelCustom: v.modelId === CUE_OTHER || v.brandId === CUE_OTHER ? v.modelCustom : null,
  }
  return validateCueSelection(sel, id => brands.find(b => b.id === id))
}
