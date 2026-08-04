'use client'

/* ─────────────────────────────────────────────────────────────
   خریدِ مستقیمِ جایگاه تبلیغاتی.

   تا امروز صفحه‌ی /advertise فقط یک فرمِ درخواست بود: کاربر مشخصاتش
   را می‌فرستاد و منتظر می‌ماند «تعرفه برایتان ارسال شود». در حالی که
   کلِ زنجیره‌ی خرید در بک‌اند وجود داشت و کار می‌کرد — قیمت‌گذاریِ
   سرورساید، ساختِ سفارش، درگاه، کالبک، بازبینیِ ادمین — و فقط هیچ
   رابطی به آن وصل نبود.

   ── مرزهایی که این کامپوننت رعایت می‌کند ──
   · هیچ قیمتی از این‌جا فرستاده نمی‌شود. کلاینت فقط می‌گوید «کدام
     جایگاه، کدام پله»؛ مبلغ را سرور از ردیفِ همان پله می‌خواند.
   · فهرستِ جایگاه‌ها از `/api/ads/campaigns/options` می‌آید که خودش
     بر اساس نقشِ *تأییدشده*ی کاربر فیلتر می‌کند — نه نقشِ خوداظهار.
   · ظرفیتِ آزاد پیش از خرید نشان داده می‌شود، و تصمیمِ نهایی هم باز
     سمتِ سرور و زیرِ قفلِ ردیف گرفته می‌شود؛ این‌جا فقط جلوی رفتنِ
     بیهوده به درگاه گرفته می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Upload, Check, ShoppingCart, AlertCircle, Film, Image as ImageIcon } from 'lucide-react'
import Select from '../ui/Select'
import { apiFetch } from '../../lib/http'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const CARD: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: 22 }
const INPUT: React.CSSProperties = {
  width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '11px 14px',
  fontSize: 13.5, fontFamily: 'inherit', color: INK, background: '#FAFAF7', outline: 'none',
}
const LABEL: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5, minHeight: 20,
  fontSize: 12.5, fontWeight: 800, color: SEC, marginBottom: 6,
}

const toFa = (v: string | number) => String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
const money = (n: number) => toFa(n.toLocaleString('en-US'))

interface Plan { id: string; name: string; description: string | null; price: number; durationDays: number; badge: string | null }
interface Option {
  key: string; title: string; description: string | null
  contentKind: string; entityType: string | null
  skipAfterSec: number | null; maxDurationSec: number | null
  capacity: number; used: number; free: number
  plans: Plan[]
}

export default function BuyPlacement({ userId }: { userId: string }) {
  const [opts, setOpts] = useState<Option[] | null>(null)
  const [identityRequired, setIdentityRequired] = useState(false)
  const [key, setKey] = useState('')
  const [planId, setPlanId] = useState('')
  const [title, setTitle] = useState('')
  const [advertiser, setAdvertiser] = useState('')
  const [creative, setCreative] = useState('')     // نشانیِ فایلِ بارگذاری‌شده
  const [duration, setDuration] = useState<number | null>(null)
  const [dest, setDest] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [upBusy, setUpBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const r = await apiFetch('/api/ads/campaigns/options')
        const j = await r.json().catch(() => ({}))
        setIdentityRequired(!!j?.identityRequired)
        setOpts(Array.isArray(j?.placements) ? j.placements : [])
      } catch { setOpts([]) }
    })()
  }, [])

  const slot = useMemo(() => opts?.find(o => o.key === key) ?? null, [opts, key])
  const plan = useMemo(() => slot?.plans.find(p => p.id === planId) ?? null, [slot, planId])

  /* با عوض‌شدنِ جایگاه، همه‌ی چیزهای وابسته پاک می‌شوند — وگرنه فایلِ
     جایگاهِ قبلی روی جایگاهِ تازه می‌ماند و سرور ردش می‌کند. */
  useEffect(() => { setPlanId(''); setCreative(''); setDuration(null); setDest(''); setErr('') }, [key])

  const full = !!slot && slot.free === 0
  const isVideo = slot?.contentKind === 'video'
  const isBanner = slot?.contentKind === 'banner'
  const isEntity = slot?.contentKind === 'entity'

  const probeDuration = (f: File) => new Promise<number | null>(res => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src)
      res(Number.isFinite(v.duration) && v.duration > 0 ? Math.round(v.duration) : null)
    }
    v.onerror = () => { URL.revokeObjectURL(v.src); res(null) }
    v.src = URL.createObjectURL(f)
  })

  const pick = async (f?: File) => {
    if (!f || !slot) return
    setErr(''); setCreative(''); setDuration(null)

    if (isVideo) {
      /* مدت پیش از آپلود در مرورگر سنجیده می‌شود: فرستادنِ ویدیوی بلند
         و بعد رد شدنش، هم وقتِ کاربر را می‌گیرد هم پهنای‌باند را.
         سقفِ نهایی را باز سرور اعمال می‌کند. */
      const dur = await probeDuration(f)
      if (dur === null) { setErr('این فایل ویدیوی معتبری نیست'); return }
      const cap = slot.maxDurationSec
      if (cap && dur > cap) {
        setErr(`مدت ویدیو ${toFa(dur)} ثانیه است؛ حداکثر ${toFa(cap)} ثانیه مجاز است`)
        return
      }
      setDuration(dur)
    }

    setUpBusy(true)
    try {
      const { uploadFile } = await import('../../lib/supabase')
      /* مسیر زیرِ شناسه‌ی خودِ کاربر — سیاستِ آپلود همین را بررسی می‌کند */
      const url = await uploadFile('club-media', f, `ads/${userId}/${Date.now()}`)
      if (!url) { setErr('بارگذاری انجام نشد؛ حجم یا فرمت فایل را بررسی کنید'); return }
      setCreative(url)
    } catch { setErr('خطا در بارگذاری فایل') } finally { setUpBusy(false) }
  }

  const buy = async () => {
    if (!slot || !plan) { setErr('جایگاه و مدت را انتخاب کنید'); return }
    if (!title.trim()) { setErr('عنوان تبلیغ را بنویسید'); return }
    if ((isVideo || isBanner) && !creative) { setErr('فایل تبلیغ را بارگذاری کنید'); return }
    if (isBanner && !/^https?:\/\//.test(dest.trim())) { setErr('نشانی مقصد بنر را وارد کنید'); return }
    if (!agreed) { setErr('برای ادامه باید قوانین تبلیغات را بپذیرید'); return }

    setBusy(true); setErr('')
    try {
      /* مبلغ عمداً فرستاده نمی‌شود. سرور آن را از ردیفِ همین پله
         می‌خواند؛ هر عددی که از این‌جا برود نادیده گرفته می‌شود. */
      const r = await apiFetch('/api/ads/campaigns/buy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementKey: slot.key,
          planId: plan.id,
          title: title.trim(),
          advertiser: advertiser.trim() || title.trim(),
          ...(isVideo ? { videoUrl: creative, clickUrl: dest.trim() || null } : {}),
          ...(isBanner ? { imageUrl: creative, linkUrl: dest.trim() } : {}),
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.redirectUrl) { setErr(j?.message || 'اتصال به درگاه انجام نشد'); return }
      window.location.href = j.redirectUrl
    } catch { setErr('خطا در ارتباط با سرور') } finally { setBusy(false) }
  }

  if (opts === null) {
    return (
      <div style={{ ...CARD, textAlign: 'center', color: MUT, fontSize: 13 }}>
        <Loader2 size={18} className="animate-spin" style={{ verticalAlign: 'middle' }} /> در حال خواندن جایگاه‌ها…
      </div>
    )
  }

  if (identityRequired) {
    return (
      <div style={{ ...CARD, background: 'rgba(178,59,46,0.04)', borderColor: 'rgba(178,59,46,0.2)' }}>
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <AlertCircle size={17} style={{ color: RED, flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: SEC, lineHeight: 2 }}>
            برای خرید جایگاه تبلیغاتی ابتدا باید هویتتان (کد ملی) تأیید شود.
            پس از تأیید، جایگاه‌های مرتبط با کسب‌وکارتان همین‌جا نمایش داده می‌شوند.
          </div>
        </div>
      </div>
    )
  }

  if (opts.length === 0) {
    return (
      <div style={{ ...CARD, fontSize: 13, color: SEC, lineHeight: 2 }}>
        در حال حاضر جایگاهی برای خرید مستقیم در دسترس شما نیست. جایگاه‌ها به نقشِ
        تأییدشده‌ی کسب‌وکار گره خورده‌اند؛ اگر باشگاه، فروشگاه یا تولیدکننده‌اید و
        هنوز تأیید نشده‌اید، پس از تأیید این بخش فعال می‌شود.
        <br />
        برای تبلیغ خارج از جایگاه‌های استاندارد، از فرم «درخواست تبلیغ سفارشی» پایین همین صفحه استفاده کنید.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* ── کارتِ هر جایگاه ── */}
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))' }}>
        {opts.map(o => {
          const on = o.key === key
          const soldOut = o.free === 0
          const from = o.plans.reduce((m, p) => Math.min(m, p.price), Infinity)
          return (
            <button key={o.key} type="button" onClick={() => setKey(on ? '' : o.key)}
              style={{
                textAlign: 'right', cursor: soldOut ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                background: on ? 'rgba(199,166,106,0.08)' : '#fff',
                border: `1px solid ${on ? 'rgba(199,166,106,0.5)' : LINE}`,
                borderRadius: 14, padding: '14px 15px', opacity: soldOut ? 0.55 : 1,
              }}
              disabled={soldOut}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                {o.contentKind === 'video' ? <Film size={14} style={{ color: GOLD_D }} /> : <ImageIcon size={14} style={{ color: GOLD_D }} />}
                <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>{o.title}</span>
              </div>
              {o.description && (
                <div style={{ fontSize: 11.5, color: MUT, lineHeight: 1.9, marginBottom: 8 }}>{o.description}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {Number.isFinite(from) && (
                  <span style={{ fontSize: 12.5, fontWeight: 900, color: GOLD_D, fontVariantNumeric: 'tabular-nums' }}>
                    از {money(from)} تومان
                  </span>
                )}
                {/* ظرفیت: ‎-1 یعنی جایگاه سقفی ندارد و عددش گمراه‌کننده است */}
                {o.free >= 0 && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 800, borderRadius: 20, padding: '2px 8px',
                    color: soldOut ? RED : FELT,
                    background: soldOut ? 'rgba(178,59,46,0.08)' : 'rgba(14,122,56,0.09)',
                  }}>
                    {soldOut ? 'ظرفیت تکمیل' : `${toFa(o.free)} جای آزاد`}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── فرمِ خرید ── */}
      {slot && (
        <div style={CARD}>
          {full ? (
            <div style={{ fontSize: 13, color: RED, lineHeight: 2 }}>
              ظرفیت این جایگاه در بازه‌ی پیشِ رو تکمیل است. با آزاد شدن یک جا، همین‌جا قابل خرید می‌شود.
            </div>
          ) : isEntity ? (
            <div style={{ fontSize: 13, color: SEC, lineHeight: 2 }}>
              این جایگاه محتوایش را از موجودیت‌های ثبت‌شده‌ی سایت می‌گیرد و خرید آنلاینش هنوز باز نشده است.
              برای رزروش از فرم «درخواست تبلیغ سفارشی» استفاده کنید.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {/* مدت و قیمت */}
              <div>
                <label style={LABEL}>مدت و تعرفه</label>
                <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))' }}>
                  {slot.plans.map(p => {
                    const on = p.id === planId
                    return (
                      <button key={p.id} type="button" onClick={() => setPlanId(p.id)}
                        style={{
                          textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit',
                          background: on ? 'rgba(14,122,56,0.06)' : '#FAFAF7',
                          border: `1px solid ${on ? 'rgba(14,122,56,0.4)' : LINE}`,
                          borderRadius: 12, padding: '11px 13px',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: INK }}>{p.name}</span>
                          {p.badge && (
                            <span style={{ fontSize: 10, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.14)', borderRadius: 20, padding: '1px 7px' }}>{p.badge}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: MUT, marginTop: 3 }}>{toFa(p.durationDays)} روز</div>
                        <div style={{ fontSize: 13.5, fontWeight: 900, color: GOLD_D, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                          {money(p.price)} <span style={{ fontSize: 11, fontWeight: 700 }}>تومان</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                <div>
                  <label style={LABEL}>عنوان تبلیغ</label>
                  <input style={INPUT} value={title} maxLength={160}
                    onChange={e => { setTitle(e.target.value); setErr('') }}
                    placeholder="مثلاً: فروش ویژه‌ی چوب‌های حرفه‌ای" />
                </div>
                <div>
                  <label style={LABEL}>نام برند / کسب‌وکار</label>
                  <input style={INPUT} value={advertiser} maxLength={160}
                    onChange={e => setAdvertiser(e.target.value)}
                    placeholder="اگر خالی بماند، عنوان تبلیغ استفاده می‌شود" />
                </div>
              </div>

              {/* فایل تبلیغ */}
              <div>
                <label style={LABEL}>
                  {isVideo ? <Film size={13} /> : <ImageIcon size={13} />}
                  {isVideo ? 'ویدیوی تبلیغ' : 'تصویر بنر'}
                  {isVideo && slot.maxDurationSec ? ` (حداکثر ${toFa(slot.maxDurationSec)} ثانیه)` : ''}
                </label>
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  border: `1px dashed ${creative ? 'rgba(14,122,56,0.45)' : LINE}`, borderRadius: 12,
                  padding: '16px 14px', cursor: upBusy ? 'wait' : 'pointer',
                  background: creative ? 'rgba(14,122,56,0.04)' : '#FAFAF7',
                  fontSize: 12.5, fontWeight: 700, color: creative ? FELT : SEC,
                }}>
                  <input type="file" accept={isVideo ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
                    style={{ display: 'none' }} disabled={upBusy}
                    onChange={e => void pick(e.target.files?.[0])} />
                  {upBusy
                    ? <><Loader2 size={15} className="animate-spin" /> در حال بارگذاری…</>
                    : creative
                      ? <><Check size={15} /> بارگذاری شد{duration ? ` — ${toFa(duration)} ثانیه` : ''}</>
                      : <><Upload size={15} /> انتخاب فایل</>}
                </label>
              </div>

              <div>
                <label style={LABEL}>{isBanner ? 'نشانی مقصد (اجباری)' : 'نشانی مقصد کلیک (اختیاری)'}</label>
                <input style={{ ...INPUT, direction: 'ltr', textAlign: 'left' }} value={dest} maxLength={800}
                  onChange={e => { setDest(e.target.value); setErr('') }}
                  placeholder="https://…" />
              </div>

              {/* قوانین */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); setErr('') }}
                  style={{ marginTop: 3, width: 16, height: 16, accentColor: GOLD_D }} />
                <span style={{ fontSize: 12, color: SEC, lineHeight: 1.95 }}>
                  می‌پذیرم محتوای تبلیغ پیش از انتشار توسط ادمین بررسی می‌شود و در صورت مغایرت با
                  قوانین سایت، رد خواهد شد. مبلغ پرداختی در صورت رد شدن بازگردانده می‌شود.
                </span>
              </label>

              {err && (
                <div style={{ fontSize: 12.5, color: RED, background: 'rgba(178,59,46,0.06)', borderRadius: 10, padding: '9px 12px', lineHeight: 1.9 }}>
                  {err}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => void buy()} disabled={busy || upBusy || !plan}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
                    color: GOLD_D, borderRadius: 10, padding: '12px 22px',
                    fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit',
                    cursor: (busy || !plan) ? 'default' : 'pointer', opacity: (busy || !plan) ? 0.55 : 1,
                  }}>
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
                  {plan ? `پرداخت ${money(plan.price)} تومان` : 'مدت را انتخاب کنید'}
                </button>
                <span style={{ fontSize: 11.5, color: MUT, lineHeight: 1.9 }}>
                  مبلغ از تعرفه‌ی همین پله در سرور خوانده می‌شود.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
