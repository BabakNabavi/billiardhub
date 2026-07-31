'use client'
import { useEffect, useState } from 'react'
import { Power, ShieldCheck, Loader2, Info } from 'lucide-react'
import { toast } from '../../../components/ui/Toast'

/* ─────────────────────────────────────────────────────────────
   مدیریتِ Feature Flagها.

   مقدار از `/api/admin/settings` خوانده و همان‌جا نوشته می‌شود — همان
   مسیری که بقیه‌ی تنظیماتِ پلتفرم از آن می‌گذرند. آن مسیر ادمین‌بودن را
   از نشست و دیتابیس تأیید می‌کند (نه از هیچ چیزی که کلاینت بفرستد) و هر
   تغییر را در audit ثبت می‌کند.

   این صفحه فقط رابط است: هیچ تصمیمِ امنیتی این‌جا گرفته نمی‌شود. اگر
   کاربرِ غیرادمین هم به این آدرس برسد، درخواستش با ۴۰۳ برمی‌گردد.
   ───────────────────────────────────────────────────────────── */

const GOLD_D = '#9A6E38'
const FELT = '#0E7A38'
const LINE = 'rgba(0,0,0,0.08)'
const SEC = '#5B5B5B'

interface Flag {
  key: string
  title: string
  desc: string
  /** چیزهایی که این پرچم خاموششان می‌کند */
  covers: string[]
  /** چیزهایی که عمداً زیرِ این پرچم نیستند */
  unaffected: string[]
}

const FLAGS: Flag[] = [
  {
    key: 'social_interactions_enabled',
    title: 'تعاملات اجتماعی',
    desc: 'فعال/غیرفعال کردن لایک، ری‌اکشن، پاسخ به استوری و پیام خصوصی',
    covers: [
      'لایک استوری',
      'ری‌اکشن و استیکر',
      'پاسخ به استوری',
      'پیام خصوصی (دایرکت)',
      'اعلان‌های همین تعاملات',
      'نوتیفیکیشن پوش همین تعاملات',
    ],
    unaffected: [
      'دیدن استوری — برای همه، حتی کاربر مهمان',
      'انتشار استوری توسط صاحبان استوری',
      'اعلان‌های سیستمی، رزرو، مسابقات و پرداخت',
    ],
  },
]

export default function AdminFeaturesPage() {
  const [state, setState] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/settings', { cache: 'no-store', credentials: 'include' })
        const j = await r.json().catch(() => ({}))
        const s = j?.settings ?? {}
        const next: Record<string, boolean> = {}
        for (const f of FLAGS) next[f.key] = s[f.key] === true
        setState(next)
      } catch {
        toast('خواندنِ تنظیمات انجام نشد', 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const toggle = async (flag: Flag) => {
    const next = !state[flag.key]
    setBusy(flag.key)
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [flag.key]: next }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        toast(j?.message ?? 'ذخیره انجام نشد', 'error')
        return
      }
      setState(p => ({ ...p, [flag.key]: next }))
      toast(next ? `«${flag.title}» روشن شد` : `«${flag.title}» خاموش شد`, 'success')
    } catch {
      toast('ارتباط با سرور برقرار نشد', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '22px 18px 60px', direction: 'rtl' }}>
      {/* دکمه‌ی بازگشت را خودِ app/admin/layout.tsx می‌گذارد — این‌جا تکرار نشود */}
      <header style={{ margin: '10px 0 22px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 900, color: '#111', display: 'flex', alignItems: 'center', gap: 9 }}>
          <ShieldCheck size={20} style={{ color: GOLD_D }} /> قابلیت‌های پلتفرم
        </h1>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.9, color: SEC }}>
          روشن یا خاموش کردنِ قابلیت‌ها بدونِ حذفِ داده. خاموش‌کردن فقط رابط را پنهان نمی‌کند —
          سرور هم درخواست‌های مربوط را رد می‌کند.
        </p>
      </header>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 30, color: SEC, fontSize: 13 }}>
          <Loader2 size={16} className="spin" /> در حالِ خواندن…
        </div>
      ) : FLAGS.map(f => {
        const on = state[f.key] === true
        return (
          <section key={f.key} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '18px 18px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <h2 style={{ margin: '0 0 6px', fontSize: 15.5, fontWeight: 800, color: '#111' }}>{f.title}</h2>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.95, color: SEC }}>{f.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => toggle(f)}
                disabled={busy === f.key}
                aria-pressed={on}
                aria-label={`${f.title} — ${on ? 'روشن' : 'خاموش'}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  minHeight: 44, padding: '0 18px', borderRadius: 12,
                  fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
                  cursor: busy === f.key ? 'wait' : 'pointer',
                  background: on ? 'rgba(14,122,56,0.10)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${on ? 'rgba(14,122,56,0.32)' : LINE}`,
                  color: on ? FELT : SEC,
                  opacity: busy === f.key ? 0.6 : 1,
                }}>
                {busy === f.key ? <Loader2 size={15} className="spin" /> : <Power size={15} />}
                {on ? 'روشن' : 'خاموش'}
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', marginTop: 16, paddingTop: 15, borderTop: `1px dashed ${LINE}` }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: on ? FELT : '#B23B2E', marginBottom: 7 }}>
                  {on ? 'در حالِ حاضر فعال:' : 'در حالِ حاضر غیرفعال:'}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
                  {f.covers.map(c => (
                    <li key={c} style={{ fontSize: 12.5, lineHeight: 1.8, color: SEC }}>• {c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: FELT, marginBottom: 7 }}>
                  همیشه فعال (مستقل از این کلید):
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
                  {f.unaffected.map(c => (
                    <li key={c} style={{ fontSize: 12.5, lineHeight: 1.8, color: SEC }}>• {c}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '15px 0 0', padding: '10px 12px', background: 'rgba(199,166,106,0.07)', border: '1px solid rgba(199,166,106,0.22)', borderRadius: 10, fontSize: 12, lineHeight: 1.9, color: '#6B5225' }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 3 }} />
              <span>
                خاموش‌کردن هیچ داده‌ای را حذف نمی‌کند. گفتگوها، پاسخ‌ها و اعلان‌های قبلی
                دست‌نخورده می‌مانند و با روشن‌کردنِ دوباره سرِ جای خودشان‌اند.
                تغییر بلافاصله برای همه اعمال می‌شود.
              </span>
            </p>
          </section>
        )
      })}

      <style>{'.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
