'use client'

/* ═══════════════════════════════════════════════════════════════
   فیلدهای مشخصاتِ فنی — ساخته‌شده از `specs_catalog.json`.
   ───────────────────────────────────────────────────────────────
   نسخه‌ی قبلی ده فیلدِ هاردکد بود که فقط برچسب و گزینه داشتند.
   چیزی که فروشنده لازم دارد و نداشت:

     · **متنِ راهنما** زیرِ برچسب — «اسنوکر: ۸.۵ تا ۱۰ · پاکت
       بیلیارد آمریکایی: ۱۱.۸ تا ۱۳». زیرِ برچسب، نه tooltip:
       روی موبایل tooltip اصلاً باز نمی‌شود.
     · **چیپِ مقدارِ رایج** زیرِ فیلدهای عددی — یک لمس به‌جای تایپ.
     · **توضیح زیرِ هر گزینه** — فروشنده‌ی دستِ‌دوم نمی‌داند سنگِ
       میزش ایتالیایی است یا چینی؛ «تیره‌تر، ریزدانه» راهنمایی‌اش
       می‌کند و داده‌ی درست‌تر می‌سازد.
     · **سوییچِ بله/خیر** به‌جای دراپ‌داونِ «دارد/ندارد».
     · **چیپِ چندانتخابی** برای «لوازم همراه».

   ظاهر از `AdFormFields` می‌آید — همان ورودی، همان طلایی، همان
   شعاعِ گوشه. چیزی از نو ساخته نشده.
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from 'react'

import { FancySelect, Label, ErrMsg, inp, GOLD, GOLD_D, TEXT_MUT, TEXT_SEC, type FancyOption } from './AdFormFields'
import { specKey, type SpecField } from '../../lib/market/spec-rules'

export const SPEC_OTHER = '__other__'

/* ── فیلدهای دسته ──
   `specs_catalog.json` سی‌وهشت کیلوبایت است و فرم فیلدهای **یک**
   دسته را می‌خواهد، نه همه را. پس مثل کاتالوگِ برند از مسیرِ
   استاتیک می‌آید و در باندلِ کلاینت نمی‌نشیند. */
const specCache = new Map<string, SpecField[]>()
const specInflight = new Map<string, Promise<SpecField[]>>()

export function useSpecFields(category: string): { fields: SpecField[]; loading: boolean } {
  const [fields, setFields] = useState<SpecField[]>(() => specCache.get(category) ?? [])
  const [loading, setLoading] = useState(false)
  const reqId = useRef(0)

  useEffect(() => {
    const id = ++reqId.current
    if (!category) { setFields([]); setLoading(false); return }
    const hit = specCache.get(category)
    if (hit) { setFields(hit); setLoading(false); return }

    setLoading(true)
    let p = specInflight.get(category)
    if (!p) {
      p = (async () => {
        const r = await fetch(`/api/specs/${category}`)
        if (!r.ok) throw new Error(String(r.status))
        const j = (await r.json()) as { fields: SpecField[] }
        specCache.set(category, j.fields)
        return j.fields
      })().finally(() => { specInflight.delete(category) })
      specInflight.set(category, p)
    }
    void p
      .then(f => { if (id === reqId.current) setFields(f) })
      /* دسته‌ای که تعریفِ اختصاصی ندارد ۴۰۴ می‌دهد — خطا نیست،
         یعنی فقط فیلدهای عمومی دارد. */
      .catch(() => { if (id === reqId.current) setFields([]) })
      .finally(() => { if (id === reqId.current) setLoading(false) })
  }, [category])

  /* فیلدهای دسته‌ی قبلی نباید یک رندر روی دسته‌ی تازه بمانند */
  return { fields: specCache.get(category) === fields ? fields : (specCache.get(category) ?? fields), loading }
}

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const toFa = (n: number | string) =>
  String(n).replace(/[0-9]/g, d => FA_DIGITS[Number(d)] ?? d)

/* ── راهنما ──
   ۱۱.۵ پیکسل و خاکستری: باید خوانده شود ولی برچسب را زیر سایه
   نبرد. زیرِ برچسب می‌نشیند و بالای خودِ ورودی. */
function Help({ text }: { text?: string }) {
  if (!text) return null
  return (
    <p style={{ margin: '0 0 6px', fontSize: 11.5, lineHeight: 1.7, color: TEXT_MUT }}>{text}</p>
  )
}

/* ── چیپِ مقدارِ رایج ──
   انتخاب‌شده طلایی می‌شود تا معلوم باشد مقدارِ فعلی از همین آمده. */
function CommonChips({
  values, current, onPick,
}: { values: number[]; current: string; onPick: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
      {values.map(v => {
        const on = String(v) === current.trim()
        return (
          <button key={v} type="button" onClick={() => onPick(String(v))}
            style={{
              padding: '4px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
              fontFamily: 'Vazirmatn,Tahoma,sans-serif',
              color: on ? GOLD_D : TEXT_MUT,
              background: on ? 'rgba(199,166,106,0.14)' : 'rgba(28,28,26,0.04)',
              border: `1px solid ${on ? 'rgba(199,166,106,0.42)' : 'rgba(28,28,26,0.08)'}`,
            }}>
            {toFa(v)}
          </button>
        )
      })}
    </div>
  )
}

/* ── سوییچِ بله/خیر ──
   دراپ‌داونِ «دارد/ندارد» دو لمس می‌خواست و در فهرستِ بیست فیلد گم
   می‌شد. تاگل یک لمس است و حالتش از دور پیداست. */
function Toggle({
  label, help, on, onChange,
}: { label: string; help?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      style={{
        display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'start',
        padding: '11px 13px', borderRadius: 12, cursor: 'pointer',
        fontFamily: 'Vazirmatn,Tahoma,sans-serif',
        background: on ? 'rgba(199,166,106,0.08)' : 'rgba(28,28,26,0.02)',
        border: `1px solid ${on ? 'rgba(199,166,106,0.34)' : 'rgba(28,28,26,0.07)'}`,
      }}>
      <span aria-hidden style={{
        width: 38, height: 22, borderRadius: 11, flexShrink: 0, position: 'relative',
        background: on ? GOLD : 'rgba(28,28,26,0.16)', transition: 'background .18s',
      }}>
        {/* در RTL دسته باید از سمتِ راست حرکت کند، پس منطقی است نه چپ/راست */}
        <span style={{
          position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.22)',
          insetInlineStart: on ? 19 : 3, transition: 'inset-inline-start .18s',
        }} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: on ? GOLD_D : TEXT_SEC }}>{label}</span>
        {help && <span style={{ display: 'block', fontSize: 11, color: TEXT_MUT, marginTop: 2 }}>{help}</span>}
      </span>
    </button>
  )
}

/* ── چندانتخابی ──
   چیپ، نه فهرستِ چک‌باکس: «لوازم همراه» نُه گزینه دارد و فهرستِ
   عمودی نُه ردیف ارتفاع می‌گرفت. */
function MultiChips({
  field, value, onChange,
}: { field: SpecField; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {(field.options ?? []).map(o => {
        const on = value.includes(o.id)
        return (
          <button key={o.id} type="button" aria-pressed={on}
            onClick={() => onChange(on ? value.filter(x => x !== o.id) : [...value, o.id])}
            style={{
              padding: '7px 13px', borderRadius: 10, cursor: 'pointer', fontSize: 12.5,
              fontFamily: 'Vazirmatn,Tahoma,sans-serif',
              color: on ? GOLD_D : TEXT_SEC, fontWeight: on ? 700 : 500,
              background: on ? 'rgba(199,166,106,0.12)' : 'rgba(28,28,26,0.03)',
              border: `1px solid ${on ? 'rgba(199,166,106,0.40)' : 'rgba(28,28,26,0.08)'}`,
            }}>
            {o.label_fa}
          </button>
        )
      })}
    </div>
  )
}

export interface SpecFieldProps {
  field: SpecField
  value: unknown
  /** متنِ «سایر» — با پسوندِ `_other` جدا ذخیره می‌شود */
  otherValue?: string
  onChange: (v: unknown) => void
  onOtherChange?: (v: string) => void
  error?: string
  /** گزینه‌های فیلدهای `source`دار (اندازه، برند پارچه، …) از بیرون می‌آیند */
  sourceOptions?: FancyOption[]
  disabled?: boolean
}

export function SpecFieldRow({
  field, value, otherValue = '', onChange, onOtherChange, error, sourceOptions, disabled,
}: SpecFieldProps) {
  const str = value === undefined || value === null ? '' : String(value)

  if (field.type === 'boolean') {
    return (
      <Toggle label={field.label_fa} help={field.help_fa}
        on={value === true} onChange={onChange} />
    )
  }

  if (field.type === 'multi_select') {
    return (
      <div>
        <Label>{field.label_fa}</Label>
        <Help text={field.help_fa} />
        <MultiChips field={field} value={Array.isArray(value) ? value as string[] : []} onChange={onChange} />
        <ErrMsg msg={error} />
      </div>
    )
  }

  if (field.type === 'select') {
    /* فیلدِ `source`دار فهرستش را از بیرون می‌گیرد — اندازه از
       کاتالوگِ میز می‌آید، برندِ پارچه از کاتالوگِ پارچه. */
    const base: FancyOption[] = sourceOptions ?? (field.options ?? []).map(o => ({
      value: o.id,
      label: o.label_fa,
      search: `${o.label_fa} ${o.label_en ?? ''} ${o.note_fa ?? ''}`,
      node: (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 600 }}>{o.label_fa}</span>
          {o.note_fa && <span style={{ fontSize: 11.5, color: TEXT_MUT }}>{o.note_fa}</span>}
        </span>
      ),
    }))
    const opts = field.allow_other
      ? [...base, {
        value: SPEC_OTHER,
        label: 'سایر',
        search: 'سایر other',
        node: (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden style={{ width: 18, textAlign: 'center', color: GOLD, fontSize: 15 }}>+</span>
            <span style={{ color: GOLD_D, fontWeight: 700 }}>سایر</span>
          </span>
        ),
      }]
      : base

    return (
      <div>
        <Label required={field.required}>{field.label_fa}</Label>
        <Help text={field.help_fa} />
        <FancySelect value={str} onChange={onChange} options={opts}
          error={!!error} disabled={disabled}
          placeholder={disabled ? 'ابتدا فیلد قبلی را کامل کنید' : 'انتخاب کنید...'} />
        {str === SPEC_OTHER && (
          <input className="nf" type="text" autoFocus maxLength={field.max_length ?? 60}
            value={otherValue} onChange={e => onOtherChange?.(e.target.value)}
            placeholder={`${field.label_fa} را وارد کنید`}
            style={{ ...inp(error), marginTop: 8, background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
        )}
        <ErrMsg msg={error} />
      </div>
    )
  }

  /* عدد و متن */
  return (
    <div>
      <Label required={field.required}>{field.label_fa}</Label>
      <Help text={field.help_fa} />
      <input className="nf"
        type={field.type === 'number' ? 'text' : 'text'}
        inputMode={field.type === 'number' ? 'decimal' : undefined}
        /* عدد در فیلدِ عددی لاتین می‌ماند، حتی در متنِ فارسی */
        dir={field.type === 'number' ? 'ltr' : undefined}
        maxLength={field.max_length ?? undefined}
        value={str}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder ?? ''}
        style={{ ...inp(error), ...(field.type === 'number' ? { textAlign: 'start' as const } : null) }} />
      {field.type === 'number' && field.common?.length ? (
        <CommonChips values={field.common} current={str} onPick={onChange} />
      ) : null}
      <ErrMsg msg={error} />
    </div>
  )
}

/* ── شمارنده‌ی پیشرفت ──
   عمداً درصد نیست. درصد فشار می‌آورد که پر شود، در حالی که همه‌ی
   این‌ها جز وضعیت اختیاری‌اند و فروشنده‌ی دستِ‌دوم واقعاً بعضی‌شان
   را نمی‌داند — عددِ الکی از خالی بدتر است. */
export function SpecProgress({ filled, total }: { filled: number; total: number }) {
  return (
    <div style={{ marginTop: 4, paddingTop: 14, borderTop: '1px solid rgba(28,28,26,0.07)' }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT_SEC }}>
        {toFa(filled)} فیلد از {toFa(total)} تکمیل شد
      </p>
      <p style={{ margin: '3px 0 0', fontSize: 11.5, color: TEXT_MUT }}>
        جز وضعیت کالا، همه اختیاری‌اند
      </p>
    </div>
  )
}

export { specKey }
