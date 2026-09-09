'use client'

/* ═══════════════════════════════════════════════════════════════
   سایز میز — در کارت «مشخصات فنی»، وابسته به نوع میز.
   ───────────────────────────────────────────────────────────────
   ── چرا این‌جا و نه در زنجیره‌ی برند ──
   سایز مشخصه‌ی خود میز است، نه بخشی از «برند ← مدل». جایش همان
   کارتی است که برای چوب طول و وزن و قطر تیپ گرفته می‌شود.

   ── چرا فهرست مشترک نداریم ──
   قبلا `specs.ts` یک فهرست ثابت «۷ تا ۱۲ فوت» برای هر میزی می‌داد.
   سه چیز را خراب می‌کرد:
     · کارامبول اصلا با فوت اندازه نمی‌شود (۲.۸۴×۱.۴۲ متر است).
     · میز اسنوکر ۱۲ فوت هست، پاکت نیست.
     · «۸ فوت» در اسنوکر و پاکت دو ابعاد متفاوت است — سطح بازی
       اسنوکر بزرگ‌تر است.
   پس فهرست از `types[].sizes` همان نوع می‌آید و `playing_area_cm`
   زیر هر گزینه نوشته می‌شود تا فروشنده مطمئن انتخاب کند.

   داده از همان hook `CatalogSelector` می‌آید، پس درخواست دومی به
   شبکه زده نمی‌شود.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'
import { FancySelect, Label, ErrMsg, inp, GOLD, GOLD_D, TEXT_MUT, type FancyOption } from './AdFormFields'
import { useCatalogType, CUE_OTHER } from './CatalogSelector'
import { MAX_SIZE_LEN, type CatalogSize } from '../../lib/market/catalog-rules'

export interface SizeValue { sizeId: string | null; sizeCustom: string }

export const EMPTY_SIZE: SizeValue = { sizeId: null, sizeCustom: '' }

/** برچسبی که در مشخصات فنی ذخیره می‌شود — دستی بر فهرست مقدم است */
export function sizeText(v: SizeValue, sizes: CatalogSize[]): string {
  if (v.sizeId === CUE_OTHER || !v.sizeId) return v.sizeCustom.trim()
  return sizes.find(s => s.id === v.sizeId)?.label_fa ?? ''
}

export default function TableSizeField({
  type, value, onChange, error, autoDefault = true,
}: {
  /** شناسه‌ی نوع میز؛ خالی یعنی هنوز انتخاب نشده */
  type: string
  value: SizeValue
  onChange: (v: SizeValue, label: string) => void
  error?: string
  /** پیش‌انتخاب رایج‌ترین سایز — در فرم ویرایش خاموش است */
  autoDefault?: boolean
}) {
  const { data, loading, failed } = useCatalogType('table', type)
  const sizes = data?.sizes ?? []

  /* ── پیش‌انتخاب رایج‌ترین سایز ──
     فقط وقتی کاربر هنوز چیزی نزده. یک‌بار برای هر نوع — وگرنه هر
     رندر انتخاب کاربر را پس می‌زد. */
  const seeded = useRef('')
  useEffect(() => {
    if (!autoDefault || !data || seeded.current === type) return
    seeded.current = type
    if (value.sizeId || value.sizeCustom.trim()) return
    const def = sizes.find(s => s.default)
    if (def) onChange({ sizeId: def.id, sizeCustom: '' }, def.label_fa)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, type, autoDefault])

  const options: FancyOption[] = sizes.map(s => ({
    value: s.id,
    label: s.label_fa,
    search: `${s.label_fa} ${s.label_en ?? ''} ${s.playing_area_cm ?? ''}`,
    node: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontWeight: 600 }}>{s.label_fa}</span>
        {s.playing_area_cm && (
          /* ابعاد لاتین است و در متن راست‌به‌چپ باید جهتش صریح شود */
          <span dir="ltr" style={{ fontSize: 12, color: TEXT_MUT }}>{s.playing_area_cm} cm</span>
        )}
        {s.note_fa && (
          <span style={{ marginInlineStart: 'auto', fontSize: 11, color: TEXT_MUT, flexShrink: 0 }}>{s.note_fa}</span>
        )}
      </span>
    ),
  }))
  options.push({
    value: CUE_OTHER,
    label: 'سایر / نامشخص',
    search: 'سایر نامشخص other',
    node: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 21, textAlign: 'center', color: GOLD, fontSize: 16 }}>+</span>
        <span style={{ color: GOLD_D, fontWeight: 700 }}>سایر / نامشخص</span>
      </span>
    ),
  })

  const isOther = value.sizeId === CUE_OTHER
  const set = (v: SizeValue) => onChange(v, sizeText(v, sizes))

  return (
    <div>
      {/* سایز عمدا ستاره ندارد: فروشنده‌ی دست‌دوم گاهی سایز دقیق را نمی‌داند */}
      <Label>سایز میز</Label>
      <FancySelect
        value={value.sizeId ?? ''}
        onChange={id => set({ sizeId: id, sizeCustom: id === CUE_OTHER ? value.sizeCustom : '' })}
        options={options}
        disabled={!type || !data}
        error={!!error}
        placeholder={
          !type ? 'ابتدا نوع میز را انتخاب کنید'
            : loading ? 'در حال بارگذاری سایزها...'
              : failed ? 'فهرست سایزها نیامد — دوباره تلاش کنید'
                : 'انتخاب سایز...'
        }
      />
      {isOther && (
        <input className="nf" type="text" autoFocus maxLength={MAX_SIZE_LEN}
          value={value.sizeCustom}
          onChange={e => set({ sizeId: CUE_OTHER, sizeCustom: e.target.value })}
          placeholder="سایز را وارد کنید (مثلا ۱۱ فوت)"
          style={{ ...inp(error), marginTop: 8, background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
      )}
      <ErrMsg msg={error} />
    </div>
  )
}
