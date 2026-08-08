/* ─────────────────────────────────────────────────────────────
   پیامکِ باشگاه به اعضا — منطقِ سمتِ سرور.

   یک جا نگه داشته می‌شود چون سه مسیر به آن نیاز دارند: برآوردِ
   هزینه، ساختِ کمپین، و ارسال پس از پرداخت. اگر قیمت در دو جا
   حساب شود، روزی یکی عوض می‌شود و کاربر مبلغی غیر از آنچه دیده
   پرداخت می‌کند.
   ───────────────────────────────────────────────────────────── */

import { sb } from '../finance/db'
import { clubTemplate, renderTemplate, smsParts } from './club-templates'
import { sendPattern, type PatternKey } from '../sms-server'

export interface ClubSmsPricing { unitPrice: number; setupFee: number; enabled: boolean }

const FALLBACK: ClubSmsPricing = { unitPrice: 200, setupFee: 2500, enabled: false }

/** نرخ‌نامه از تنظیمات — در کد نیست چون ادمین عوضش می‌کند */
export async function pricing(): Promise<ClubSmsPricing> {
  try {
    const { data } = await sb().from('app_settings')
      .select('value').eq('key', 'club_sms_pricing').maybeSingle()
    const v = (data as { value?: Record<string, unknown> } | null)?.value
    if (!v || typeof v !== 'object') return FALLBACK
    const num = (x: unknown, d: number) => {
      const n = Number(x)
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : d
    }
    return {
      unitPrice: num(v.unitPrice, FALLBACK.unitPrice),
      setupFee: num(v.setupFee, FALLBACK.setupFee),
      /* نبودِ کلید یعنی خاموش — یک تنظیمِ ناقص نباید ناخواسته
         امکانِ ارسالِ انبوه را باز کند. */
      enabled: v.enabled === true,
    }
  } catch { return FALLBACK }
}

export interface Recipient { userId: string; mobile: string; name: string }

/* ── گیرنده‌ها ──
   شماره و نام از پروفایلِ خودِ کاربر خوانده می‌شود، نه از چیزی که
   باشگاه‌دار وارد کرده.

   سه فیلتر عمدی‌اند:
     • `sms_opt_out` — عضوی که نه گفته
     • شماره‌ی نامعتبر — ردیف‌های قدیمی یا ناقص
     • خودِ مالک — پیامکِ خودش به خودش، هم بی‌معنی هم پولی */
export async function recipientsOf(clubId: string, ownerId: string): Promise<Recipient[]> {
  const { data: rows } = await sb().from('club_members')
    .select('user_id').eq('club_id', clubId).eq('sms_opt_out', false)
  const ids = (rows as { user_id: string }[] ?? []).map(r => r.user_id).filter(id => id !== ownerId)
  if (!ids.length) return []

  const { data: users } = await sb().from('users')
    .select('id,phone,"firstName","lastName"').in('id', ids)

  const out: Recipient[] = []
  for (const u of (users as { id: string; phone?: string; firstName?: string; lastName?: string }[] ?? [])) {
    const mobile = String(u.phone ?? '')
      .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[^0-9]/g, '')
    if (!/^09\d{9}$/.test(mobile)) continue
    const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
    /* نامِ خالی یعنی «{0} عزیز» می‌شود « عزیز» — بی‌آبرو ولی نه خطا.
       «هم‌باشگاهی» جای خالی را پر می‌کند و پیامک همچنان معنا دارد. */
    out.push({ userId: u.id, mobile, name: name || 'هم‌باشگاهی' })
  }
  return out
}

/* ── چرا «هیچ عضوی پیدا نشد» کافی نیست ──
   این جمله شبیهِ خرابی است، در حالی که سه حالتِ کاملاً متفاوت به
   آن می‌رسند و کارِ باشگاه‌دار در هر سه فرق می‌کند:

     • هنوز کسی عضو نشده        ⇒ باید نشانیِ باشگاهش را پخش کند
     • تنها عضو خودش است        ⇒ همه‌چیز درست است، فقط کسی نیست
     • همه پیامک را خاموش کرده  ⇒ کاری از دستش برنمی‌آید

   باشگاه‌داری که «پیدا نشد» می‌بیند فکر می‌کند سیستم عضوهایش را
   گم کرده. */
async function noRecipientReason(clubId: string, ownerId: string): Promise<string> {
  const { data } = await sb().from('club_members')
    .select('user_id,sms_opt_out').eq('club_id', clubId)
  const rows = (data ?? []) as { user_id: string; sms_opt_out?: boolean }[]

  if (!rows.length) return 'هنوز هیچ‌کس عضو این باشگاه نشده است'

  const others = rows.filter(r => r.user_id !== ownerId)
  if (!others.length) {
    return 'تنها عضو این باشگاه خودتان هستید — پیامک به خودتان فرستاده نمی‌شود'
  }
  if (others.every(r => r.sms_opt_out === true)) {
    return 'همه‌ی اعضا دریافت پیامک باشگاه را خاموش کرده‌اند'
  }
  return 'هیچ عضوی با شماره‌ی موبایلِ معتبر پیدا نشد'
}

export interface Quote {
  recipients: number
  unitPrice: number
  setupFee: number
  total: number
  /* بیشترین تعداد بخش در میانِ گیرنده‌ها — طولِ نام فرق می‌کند، پس
     یک عدد برای همه درست نیست. */
  maxParts: number
  sample: string
}

/** برآوردِ هزینه — همان محاسبه‌ای که هنگام ساختِ کمپین هم اجرا می‌شود */
export async function quote(
  clubId: string, ownerId: string, clubName: string, templateKey: string, args: string[],
): Promise<Quote | { error: string }> {
  const tpl = clubTemplate(templateKey)
  if (!tpl) return { error: 'متن انتخابی معتبر نیست' }

  const p = await pricing()
  if (!p.enabled) return { error: 'ارسال پیامک به اعضا فعلاً غیرفعال است' }

  const list = await recipientsOf(clubId, ownerId)
  if (!list.length) return { error: await noRecipientReason(clubId, ownerId) }

  /* `{1}` نامِ باشگاه است و از دیتابیس می‌آید — نه از فرم */
  const full = [clubName, ...args]

  let maxParts = 1
  for (const r of list) {
    const parts = smsParts(renderTemplate(tpl.body, r.name, full)).parts
    if (parts > maxParts) maxParts = parts
  }

  return {
    recipients: list.length,
    unitPrice: p.unitPrice,
    setupFee: p.setupFee,
    total: list.length * p.unitPrice + p.setupFee,
    maxParts,
    sample: renderTemplate(tpl.body, list[0]?.name ?? 'هم‌باشگاهی', full),
  }
}

/* ── ارسال ──
   پس از تأییدِ پرداخت اجرا می‌شود. هیچ‌وقت throw نمی‌کند: پول گرفته
   شده و یک استثنا نباید کمپین را در حالتِ نامعلوم رها کند.

   ردیفِ گیرنده با کلیدِ مرکب نوشته می‌شود، پس اجرای دوباره‌ی همین
   تابع پیامکِ تکراری نمی‌فرستد. */
export async function sendCampaign(campaignId: string): Promise<{ sent: number; failed: number }> {
  const { data: cRow } = await sb().from('club_sms_campaigns')
    .select('id,club_id,created_by,template_key,args,status').eq('id', campaignId).maybeSingle()
  const c = cRow as {
    id: string; club_id: string; created_by: string
    template_key: string; args: string[]; status: string
  } | null
  if (!c) return { sent: 0, failed: 0 }

  const tpl = clubTemplate(c.template_key)
  if (!tpl) {
    await sb().from('club_sms_campaigns').update({
      status: 'FAILED', error_note: 'متن یافت نشد', updated_at: new Date().toISOString(),
    }).eq('id', c.id)
    return { sent: 0, failed: 0 }
  }

  const { data: club } = await sb().from('clubs').select('name').eq('id', c.club_id).maybeSingle()
  const clubName = (club as { name?: string } | null)?.name ?? 'باشگاه'

  await sb().from('club_sms_campaigns')
    .update({ status: 'SENDING', updated_at: new Date().toISOString() }).eq('id', c.id)

  /* کسانی که قبلاً در همین کمپین پیامک گرفته‌اند دوباره نمی‌گیرند */
  const { data: doneRows } = await sb().from('club_sms_recipients')
    .select('user_id').eq('campaign_id', c.id)
  const already = new Set((doneRows as { user_id: string }[] ?? []).map(r => r.user_id))

  const list = (await recipientsOf(c.club_id, c.created_by)).filter(r => !already.has(r.userId))
  const args = [clubName, ...(Array.isArray(c.args) ? c.args : [])]

  let sent = 0, failed = 0
  for (const r of list) {
    /* آرگومان‌ها به همان ترتیبی می‌روند که متن در پنل ثبت شده */
    const res = await sendPattern(c.template_key as PatternKey, r.mobile, [r.name, ...args])
    if (res.ok) sent++; else failed++

    await sb().from('club_sms_recipients').upsert({
      campaign_id: c.id, user_id: r.userId, mobile: r.mobile,
      ok: res.ok, note: res.ok ? null : (res.message ?? null),
    }, { onConflict: 'campaign_id,user_id', ignoreDuplicates: true })
  }

  const prev = already.size
  await sb().from('club_sms_campaigns').update({
    status: sent > 0 ? 'SENT' : 'FAILED',
    sent_count: prev + sent, failed_count: failed,
    sent_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    error_note: sent === 0 ? 'هیچ پیامکی ارسال نشد' : null,
  }).eq('id', c.id)

  return { sent, failed }
}
