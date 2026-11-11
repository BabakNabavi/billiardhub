'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Send, Check } from 'lucide-react'
import { apiFetch } from '@/lib/http'
import { isContactSubject } from '@/lib/contact-subjects'
import { buttonClasses } from '@/components/ui/button-classes'
import { Field, SubjectChips } from './fields'

/* ─────────────────────────────────────────────────────────────
   فرمِ تماس — منطقِ نسخه‌ی قبل بی‌تغییر، ظاهر تازه.

   - به `/api/contact` می‌رود و تیکتِ واقعی می‌سازد؛ در شکست خطا نشان
     می‌دهد، نه موفقیتِ دروغین.
   - `apiFetch` هدرِ CSRF را می‌گذارد؛ با fetchِ خام کاربرِ واردشده ۴۰۳
     می‌گرفت.
   - `?subject=` و `?clubId=` از پیامِ قفلِ کد پستی/اطلاعات بانکی می‌آیند
     تا تیکت در صفِ درست بنشیند.
   - فوکوس: خطا ⟵ اولین فیلدِ نامعتبر؛ موفقیت ⟵ تیترِ پیامِ موفقیت.
   ───────────────────────────────────────────────────────────── */

type Form = { name: string; email: string; phone: string; subject: string; message: string }
const EMPTY: Form = { name: '', email: '', phone: '', subject: '', message: '' }

export function ContactForm() {
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof Form | 'submit', string>>>({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [clubId, setClubId] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const doneRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const s = q.get('subject') ?? ''
    if (isContactSubject(s)) {
      setForm(f => ({ ...f, subject: s }))
      /* کمی صبر تا لی‌اوت بنشیند، وگرنه اسکرول به جای اشتباه می‌رود */
      window.setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350)
    }
    setClubId(q.get('clubId') ?? '')
  }, [])

  useEffect(() => { if (sent) doneRef.current?.focus() }, [sent])

  const set = (k: keyof Form) => (v: string) => {
    if (k === 'phone') v = v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '').slice(0, 11)
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!form.subject) e.subject = 'موضوع را انتخاب کنید'
    if (!form.name.trim()) e.name = 'نام و نام خانوادگی الزامی است'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'ایمیل معتبر نیست'
    if (form.phone && !/^09\d{9}$/.test(form.phone)) e.phone = 'شماره باید ۱۱ رقم و با ۰۹ شروع شود'
    if (form.message.trim().length < 10) e.message = 'پیام باید حداقل ۱۰ کاراکتر باشد'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!validate()) {
      /* بعد از رندرِ خطاها: اولین فیلدِ نامعتبر، یا اولین تراشه‌ی موضوع */
      window.requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('fieldset[aria-describedby] input, [aria-invalid="true"]')?.focus()
      })
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, clubId: clubId || undefined }),
      })
      let j: { message?: string } = {}
      try { j = await res.json() } catch { j = {} }
      if (!res.ok) { setErrors({ submit: j.message || 'ارسال پیام انجام نشد، دوباره تلاش کنید' }); return }
      setSent(true)
    } catch {
      setErrors({ submit: 'ارتباط با سرور برقرار نشد، اتصال اینترنت را بررسی کنید' })
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div ref={ref} className="flex flex-col items-center gap-4 py-12 text-center">
        <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold-text">
          <Check size={32} />
        </span>
        <h3 ref={doneRef} tabIndex={-1} className="text-section focus:outline-none">پیام شما ثبت شد</h3>
        <p className="max-w-sm text-body text-ink-2">
          اگر وارد حساب باشید، پاسخ در{' '}
          <Link href="/support" className="font-bold text-gold-text underline-offset-4 hover:underline">تیکت‌های من</Link>
          {' '}ثبت می‌شود؛ در غیر این صورت از راه ایمیل یا شماره‌ای که نوشته‌اید پیگیری می‌شود
        </p>
        <button type="button" className={buttonClasses({ variant: 'secondary' })}
          onClick={() => { setSent(false); setForm(EMPTY) }}>
          ارسال پیام جدید
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="scroll-mt-24">
      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
        <SubjectChips value={form.subject} onChange={set('subject')} error={errors.subject} />
        <Field label="نام و نام خانوادگی" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="ایمیل" value={form.email} onChange={set('email')} error={errors.email} type="email" ltr autoComplete="email" />
          <Field label="شماره تماس (اختیاری)" value={form.phone} onChange={set('phone')} error={errors.phone} type="tel" ltr inputMode="numeric" maxLength={11} autoComplete="tel" />
        </div>
        <Field label="پیام شما" value={form.message} onChange={set('message')} error={errors.message} textarea />
        {errors.submit && (
          <p role="alert" className="rounded-field border border-danger/20 bg-danger/[.06] px-4 py-3 text-body font-bold text-danger">
            {errors.submit}
          </p>
        )}
        <button type="submit" disabled={loading} aria-busy={loading} className={buttonClasses({ size: 'lg', block: true })}>
          {loading
            ? <><span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-gold-text/30 border-t-gold-text" />در حال ارسال</>
            : <>ارسال پیام <Send size={16} aria-hidden className="-scale-x-100" /></>}
        </button>
      </form>
    </div>
  )
}
