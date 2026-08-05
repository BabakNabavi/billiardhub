'use client'

/* پیامک‌های سایت — کدِ متنِ هر الگو، و ارسالِ آزمایشی.

   چرا این صفحه لازم شد: خطِ خدماتیِ ملی‌پیامک متنِ آزاد نمی‌پذیرد. هر
   متن یک‌بار در پنلِ آن‌ها ثبت و تأیید می‌شود و کدی می‌گیرد. تا پیش از
   این صفحه، آن کدها فقط با نوشتنِ مستقیم در دیتابیس وارد می‌شدند —
   یعنی عملاً هیچ راهی نبود.

   ارسالِ آزمایشی هم حدس را برمی‌دارد: تا یک پیامکِ واقعی نرود، معلوم
   نیست کد درست وارد شده، ترتیبِ متغیرها درست است، یا کلیدِ سرویس
   کار می‌کند. */

import { useCallback, useEffect, useState } from 'react'
import { MessageSquare, Loader2, Send, Check, AlertCircle, Save } from 'lucide-react'
import { toFaDigits } from '../../../lib/jalali'
import { apiFetch } from '../../../lib/http'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

/* برچسبِ فارسی و توضیحِ «کِی فرستاده می‌شود» — ترتیب همان ترتیبِ
   سندِ docs/sms-patterns.md است تا ادمین بتواند سطر به سطر جلو برود. */
const LABEL: Record<string, { fa: string; when: string }> = {
  booking_confirmed:        { fa: '۱) رزرو قطعی', when: 'پس از پرداختِ موفقِ رزرو — به کاربر' },
  booking_cancelled_refund: { fa: '۲) لغو رزرو با بازگشت وجه', when: 'وقتی رزرو لغو و مبلغ برگشت داده شود' },
  booking_cancelled:        { fa: '۳) لغو رزرو', when: 'لغو بدونِ بازگشت وجه' },
  booking_for_owner:        { fa: '۴) رزرو جدید باشگاه', when: 'به باشگاه‌دار، وقتی میزش رزرو شود' },
  settlement_paid:          { fa: '۵) واریز تسویه', when: 'وقتی سهم باشگاه واریز شود' },
  role_approved:            { fa: '۶) تأیید پروفایل', when: 'تأیید نقش بدونِ تیک آبی' },
  role_approved_tick:       { fa: '۷) تأیید پروفایل با نشان', when: 'تأیید نقش همراه با تیک آبی' },
  role_rejected:            { fa: '۸) رد پروفایل', when: 'وقتی درخواستِ نقش رد شود' },
  club_approved:            { fa: '۹) تأیید باشگاه', when: 'به مالک، پس از تأییدِ باشگاه' },
  club_rejected:            { fa: '۱۰) رد ثبت باشگاه', when: 'به مالک، وقتی باشگاه رد شود' },
  tournament_registered:    { fa: '۱۱) ثبت‌نام مسابقه', when: 'پس از قطعی‌شدنِ ثبت‌نام' },
  tournament_cancelled:     { fa: '۱۲) لغو مسابقه', when: 'به همه‌ی ثبت‌نام‌کننده‌ها' },
  waitlist_promoted:        { fa: '۱۳) باز شدن جا', when: 'وقتی از لیستِ انتظار جا باز شود' },
  report_created:           { fa: '۱۴) گزارش تخلف', when: 'به شماره‌ی هشدارِ ادمین' },
}

interface State { patterns: string[]; ids: Record<string, number>; enabled: boolean; hasKey: boolean }

export default function AdminSms() {
  const [st, setSt] = useState<State | null>(null)
  const [err, setErr] = useState('')
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState('')
  const [result, setResult] = useState<Record<string, { ok: boolean; msg: string }>>({})

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/admin/sms/test', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'دسترسی مجاز نیست'); return }
      setSt(j)
      const d: Record<string, string> = {}
      for (const k of j.patterns as string[]) d[k] = j.ids[k] ? String(j.ids[k]) : ''
      setDraft(d); setErr('')
    } catch { setErr('خطا در ارتباط با سرور') }
  }, [])
  useEffect(() => { void load() }, [load])

  const save = async () => {
    setSaving(true); setErr('')
    try {
      /* فقط کدهای معتبر می‌روند. رشته‌ی خالی یعنی «هنوز ثبت نشده» و
         باید از نگاشت بیرون بماند، نه این‌که صفر ذخیره شود. */
      const ids: Record<string, number> = {}
      for (const [k, v] of Object.entries(draft)) {
        const n = Number(String(v).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, ''))
        if (Number.isInteger(n) && n > 0) ids[k] = n
      }
      const r = await apiFetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sms_body_ids: ids }),
      })
      if (!r.ok) { setErr('ذخیره انجام نشد'); return }
      await load()
    } catch { setErr('خطا در ارتباط با سرور') } finally { setSaving(false) }
  }

  const test = async (key: string) => {
    setBusy(key)
    setResult(p => ({ ...p, [key]: { ok: false, msg: '' } }))
    try {
      const r = await apiFetch('/api/admin/sms/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, phone }),
      })
      const j = await r.json().catch(() => ({}))
      setResult(p => ({ ...p, [key]: { ok: !!j.ok, msg: j.message || (r.ok ? '' : 'ارسال نشد') } }))
    } catch {
      setResult(p => ({ ...p, [key]: { ok: false, msg: 'خطا در ارتباط با سرور' } }))
    } finally { setBusy('') }
  }

  const phoneOk = /^09\d{9}$/.test(phone.replace(/[^0-9]/g, ''))
  const changed = !!st && st.patterns.some(k => String(st.ids[k] ?? '') !== String(draft[k] ?? '').replace(/[^0-9]/g, ''))
  const done = st ? st.patterns.filter(k => st.ids[k]).length : 0

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <MessageSquare size={21} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>پیامک‌های سایت</h1>
        {st ? (
          <span style={{
            fontSize: 11.5, fontWeight: 800, borderRadius: 20, padding: '4px 11px',
            color: done === st.patterns.length ? FELT : GOLD_D,
            background: done === st.patterns.length ? 'rgba(14,122,56,0.09)' : 'rgba(199,166,106,0.13)',
          }}>
            {toFaDigits(done)} از {toFaDigits(st.patterns.length)} الگو آماده
          </span>
        ) : null}
      </div>

      <p style={{ fontSize: 12.5, color: SEC, lineHeight: 2, margin: '0 0 16px', maxWidth: 780 }}>
        هر متن یک‌بار در پنلِ ملی‌پیامک ثبت و تأیید می‌شود و کدی می‌گیرد. آن کد را این‌جا
        بگذارید و ذخیره کنید. متنِ آماده‌ی هر پانزده الگو در فایلِ <code style={{
          background: '#F6F4EE', borderRadius: 5, padding: '1px 6px', fontSize: 11.5,
        }}>docs/sms-patterns.md</code> هست.
      </p>

      {/* ── وضعیتِ سرویس ──
          بدونِ این، یک ارسالِ ناموفق سه علتِ کاملاً متفاوت می‌تواند
          داشته باشد و ادمین نمی‌داند دنبالِ کدام بگردد. */}
      {st ? (
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
          border: `1px solid ${LINE}`, borderRadius: 14, padding: '11px 15px', marginBottom: 14,
          background: st.enabled && st.hasKey ? 'rgba(14,122,56,0.04)' : 'rgba(178,59,46,0.05)',
        }}>
          <Flag2 ok={st.enabled} label="ارسال پیامک" on="روشن" off="خاموش — SMS_NOTIFICATIONS را on کنید" />
          <Flag2 ok={st.hasKey} label="کلید سرویس" on="تنظیم شده" off="تنظیم نشده — SMS_API_KEY را بگذارید" />
        </div>
      ) : null}

      {/* شماره‌ی مقصدِ آزمایش */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        border: `1px solid ${LINE}`, borderRadius: 14, padding: '12px 15px', marginBottom: 18,
      }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: SEC, whiteSpace: 'nowrap' }}>
          پیامک آزمایشی به:
        </span>
        <input
          value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="09121234567" inputMode="numeric" dir="ltr"
          style={{
            flex: '1 1 170px', maxWidth: 210, border: `1px solid ${LINE}`, borderRadius: 10,
            padding: '9px 12px', fontSize: 13.5, fontFamily: 'var(--font-base)',
            textAlign: 'center', letterSpacing: 1, color: INK, background: '#fff',
          }} />
        <span style={{ fontSize: 11.5, color: MUT, lineHeight: 1.8 }}>
          مقدارها ساختگی‌اند («کاربر آزمایشی»، «باشگاه نمونه») — هیچ داده‌ی واقعی فرستاده نمی‌شود.
        </span>
      </div>

      {err ? (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', color: RED, fontSize: 13,
          background: 'rgba(178,59,46,0.06)', borderRadius: 12, padding: '10px 14px', marginBottom: 14,
        }}>
          <AlertCircle size={16} /> {err}
        </div>
      ) : null}

      {!st ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={22} className="animate-spin" style={{ color: MUT }} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {st.patterns.map(k => {
              const meta = LABEL[k] ?? { fa: k, when: '' }
              const has = !!st.ids[k]
              const res = result[k]
              return (
                <div key={k} style={{
                  display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
                  border: `1px solid ${has ? 'rgba(14,122,56,0.22)' : LINE}`, borderRadius: 14,
                  padding: '12px 15px', background: has ? 'rgba(14,122,56,0.03)' : '#fff',
                }}>
                  <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, marginBottom: 3 }}>{meta.fa}</div>
                    <div style={{ fontSize: 11.5, color: MUT, lineHeight: 1.7 }}>{meta.when}</div>
                  </div>

                  <input
                    value={draft[k] ?? ''} onChange={e => setDraft(p => ({ ...p, [k]: e.target.value }))}
                    placeholder="کد متن" inputMode="numeric" dir="ltr"
                    style={{
                      width: 108, border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 10px',
                      fontSize: 13, fontFamily: 'var(--font-base)', textAlign: 'center',
                      color: INK, background: '#fff',
                    }} />

                  <button
                    onClick={() => void test(k)}
                    disabled={!has || !phoneOk || busy === k}
                    title={!has ? 'اول کد متن را ذخیره کنید' : !phoneOk ? 'شماره‌ی آزمایش را وارد کنید' : 'ارسال آزمایشی'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid',
                      borderColor: !has || !phoneOk ? LINE : 'rgba(199,166,106,0.34)',
                      background: !has || !phoneOk ? '#F7F6F2' : 'rgba(199,166,106,0.12)',
                      color: !has || !phoneOk ? MUT : GOLD_D, borderRadius: 10,
                      padding: '8px 13px', fontSize: 12.5, fontWeight: 800,
                      fontFamily: 'var(--font-base)', cursor: !has || !phoneOk ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}>
                    {busy === k ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    آزمایش
                  </button>

                  {res?.msg ? (
                    <span style={{
                      flex: '1 1 100%', fontSize: 11.5, fontWeight: 700, lineHeight: 1.8,
                      color: res.ok ? FELT : RED,
                    }}>
                      {res.ok ? '✅ ' : '❌ '}{res.msg}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 18, flexWrap: 'wrap' }}>
            <button
              onClick={() => void save()} disabled={!changed || saving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                border: '1px solid', borderColor: changed ? 'rgba(199,166,106,0.34)' : LINE,
                background: changed ? 'rgba(199,166,106,0.12)' : '#F7F6F2',
                color: changed ? GOLD_D : MUT, borderRadius: 10, padding: '10px 18px',
                fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-base)',
                cursor: changed && !saving ? 'pointer' : 'not-allowed',
              }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              ذخیره‌ی کدها
            </button>
            {!changed && !saving ? (
              <span style={{ fontSize: 12, color: MUT }}>تغییری برای ذخیره نیست</span>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

/* نشانگرِ روشن/خاموشِ یک پیش‌نیاز */
function Flag2({ ok, label, on, off }: { ok: boolean; label: string; on: string; off: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
      {ok
        ? <Check size={15} style={{ color: FELT }} />
        : <AlertCircle size={15} style={{ color: RED }} />}
      <span style={{ fontWeight: 800, color: SEC }}>{label}:</span>
      <span style={{ color: ok ? FELT : RED, fontWeight: 700 }}>{ok ? on : off}</span>
    </span>
  )
}
