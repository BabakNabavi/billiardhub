/* ─────────────────────────────────────────────────────────────
   اطلاع‌رسانی رویدادهای رزرو — یک‌جا، تا مسیرهای مالی شلوغ نشوند.
   همه‌ی توابع بی‌صدا هستند: خطای پیامک نباید پرداخت یا لغو را بشکند.
   ───────────────────────────────────────────────────────────── */

import { sb } from './finance/db'
import { notify, SMS } from './sms-server'
import { faDate, faTimeRange } from './jalali'

/* نام فارسی نوع میز — برای متن پیامک */
const TABLE_LABEL: Record<string, string> = {
  snooker: 'میز اسنوکر', pocket: 'میز پاکت', highball: 'میز هی‌بال',
  vip_snooker: 'میز VIP اسنوکر', vip_pocket: 'میز VIP پاکت',
  airhockey: 'ایرهاکی', dart: 'دارت', playstation: 'پلی‌استیشن',
}

interface BookingRow {
  id: string
  userId: string
  clubId: string
  bookingDate: string
  timeSlots: string | null
  booking_reference: string | null
  tableId: string | null
}

async function loadBooking(bookingId: string) {
  const { data } = await sb().from('bookings')
    .select('id,"userId","clubId","bookingDate","timeSlots",booking_reference,"tableId"')
    .eq('id', bookingId).maybeSingle()
  return (data ?? null) as BookingRow | null
}

async function phoneOf(userId: string): Promise<string | null> {
  const { data } = await sb().from('users').select('phone').eq('id', userId).maybeSingle()
  return (data as { phone?: string } | null)?.phone ?? null
}

async function clubOf(clubId: string): Promise<{ name: string; ownerId: string | null; notifyPhone: string | null } | null> {
  const { data } = await sb().from('clubs').select('name,"ownerId","notifyPhone"').eq('id', clubId).maybeSingle()
  if (!data) return null
  const c = data as { name?: string; ownerId?: string; notifyPhone?: string }
  return { name: c.name ?? 'باشگاه', ownerId: c.ownerId ?? null, notifyPhone: c.notifyPhone || null }
}

/** نام نمایشی کاربر — برای پیامک باشگاه‌دار */
async function nameOf(userId: string): Promise<string> {
  const { data } = await sb().from('users').select('"firstName","lastName"').eq('id', userId).maybeSingle()
  const u = (data ?? {}) as { firstName?: string; lastName?: string }
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
}

/* ── نقشِ حرفه‌ای ────────────────────────────────────────────────
   خطِ دومِ پیامک، مخصوصِ هر نقش. عمداً این‌جاست نه در `lib/roles`:
   آن فایل به کلاینت هم می‌رود و این متن‌ها فقط سمتِ سرور لازم‌اند.

   «کاربر عادی» عمداً نیست — نقشی که بررسی نمی‌شود پیامکِ تأیید هم
   ندارد. */
/* ⚠️ هیچ‌کدام به «گرامی» ختم نمی‌شوند: خطِ اول از قبل «{نام} گرامی»
   است و «سارا رضایی گرامی / مربی گرامی» دو بار سلام‌کردن است. */
const ROLE_LINE: Record<string, string> = {
  referee: 'داور ارزنده‌ی کشور',
  coach: 'مربی ارجمند',
  player: 'بازیکن ارجمند',
  club_owner: 'مدیر محترم باشگاه',
  seller: 'فروشنده‌ی محترم',
  manufacturer: 'تولیدکننده‌ی محترم',
  technician: 'متخصص محترم',
}

/** نقش تأیید شد — با یا بدونِ تیکِ آبی */
export async function notifyRoleApproved(
  userId: string, role: string, withTick: boolean,
): Promise<void> {
  try {
    const phone = await phoneOf(userId)
    if (!phone) return
    notify(phone, SMS.roleApproved(await nameOf(userId), ROLE_LINE[role] ?? '', withTick))
  } catch { /* اطلاع‌رسانی نباید تأیید را بشکند */ }
}

/** نقش رد شد — دلیل همیشه همراهش می‌رود */
export async function notifyRoleRejected(
  userId: string, role: string, reason: string,
): Promise<void> {
  try {
    const phone = await phoneOf(userId)
    if (!phone) return
    notify(phone, SMS.roleRejected(await nameOf(userId), ROLE_LINE[role] ?? '', reason))
  } catch { /* اطلاع‌رسانی نباید رد را بشکند */ }
}

/* ── گزارشِ تخلف ────────────────────────────────────────────────
   تا امروز گزارش فقط در جدول می‌نشست و ادمین تنها وقتی خبردار می‌شد
   که خودش سراغِ صفحه‌ی گزارش‌ها می‌رفت. برای آگهیِ کلاهبرداری، آن
   فاصله همان مدتی است که آگهی روی سایت می‌ماند.

   شماره از تنظیماتِ `report_alert_phone` خوانده می‌شود، نه از کد:
   شماره‌ی ادمین عوض می‌شود و نباید دیپلوی بخواهد. خالی بودنش یعنی
   «پیامک نفرست» و هیچ خطایی نمی‌دهد. */
export async function notifyReportCreated(input: {
  targetType: string
  targetTitle: string | null
  reasonLabel: string
}): Promise<void> {
  try {
    const { data } = await sb().from('app_settings')
      .select('value').eq('key', 'report_alert_phone').maybeSingle()
    const raw = (data as { value?: unknown } | null)?.value
    const phone = typeof raw === 'string' ? raw.trim() : ''
    if (!phone) return

    const KIND: Record<string, string> = {
      product: 'آگهی', club: 'باشگاه', user: 'کاربر', media: 'ویدیو', ad: 'تبلیغ',
    }
    notify(phone, SMS.reportCreated(
      KIND[input.targetType] ?? 'محتوا',
      input.targetTitle ?? '',
      input.reasonLabel,
    ))
  } catch { /* اطلاع‌رسانی هرگز نباید ثبتِ گزارش را بشکند */ }
}

/** رزرو قطعی شد — به کاربر، و خبر رزرو جدید به باشگاه‌دار */
export async function notifyBookingConfirmed(bookingId: string): Promise<void> {
  const b = await loadBooking(bookingId)
  if (!b) return
  const club = await clubOf(b.clubId)
  const date = faDate(b.bookingDate)
  const time = faTimeRange(b.timeSlots)

  const userPhone = await phoneOf(b.userId)
  const userName = await nameOf(b.userId)
  notify(userPhone, SMS.bookingConfirmed(userName, club?.name ?? 'باشگاه', date, time, b.booking_reference ?? '—'))

  /* باشگاه‌دار هم باید بداند میزش پر شده.

     مقصد لزوماً شماره‌ی خود مالک نیست: بسیاری از باشگاه‌ها به نام یک
     نفر ثبت‌اند ولی کس دیگری اداره‌شان می‌کند. اگر «شماره‌ی
     اطلاع‌رسانی» تنظیم شده باشد، پیامک به همان می‌رود. */
  if (club && club.ownerId !== b.userId) {
    let tableName = ''
    if (b.tableId) {
      const { data } = await sb().from('tables').select('name,number,type').eq('id', b.tableId).maybeSingle()
      const t = data as { name?: string; number?: number; type?: string } | null
      const kind = TABLE_LABEL[t?.type ?? ''] ?? ''
      tableName = t?.name
        || [kind, t?.number ? `شماره ${t.number}` : ''].filter(Boolean).join(' ')
        || ''
    }
    const target = club.notifyPhone ?? (club.ownerId ? await phoneOf(club.ownerId) : null)
    /* نامِ خودِ مالک برای خطاب، و نامِ رزروکننده داخلِ متن */
    const ownerName = club.ownerId ? await nameOf(club.ownerId) : ''
    notify(target, SMS.newBookingForOwner(ownerName, club.name, date, time, tableName, userName))
  }
}

/** رزرو لغو شد — با مبلغ بازگشتی */
export async function notifyBookingCancelled(bookingId: string, refund: number): Promise<void> {
  const b = await loadBooking(bookingId)
  if (!b) return
  const club = await clubOf(b.clubId)
  notify(await phoneOf(b.userId), SMS.bookingCancelled(await nameOf(b.userId), club?.name ?? 'باشگاه', faDate(b.bookingDate), refund))
}

/** تسویه به حساب باشگاه‌دار واریز شد */
export async function notifySettlementPaid(clubId: string, amount: number): Promise<void> {
  const club = await clubOf(clubId)
  if (!club?.ownerId) return
  notify(await phoneOf(club.ownerId), SMS.settlementPaid(await nameOf(club.ownerId), amount))
}

/* ─────────────────────────────────────────────────────────────
   رویدادهای ماژول باشگاه — تأیید، رد، و مسابقات.

   تا امروز هیچ‌کدام اعلانی نداشتند: ادمین باشگاهی را رد می‌کرد و
   مالک هیچ‌وقت خبردار نمی‌شد؛ فقط اگر تصادفاً به داشبوردش سر می‌زد
   وضعیت را می‌دید — آن‌هم بدون علت.
   ───────────────────────────────────────────────────────────── */

async function ownerPhoneOf(clubId: string): Promise<{ phone: string | null; name: string; owner: string }> {
  const c = await clubOf(clubId)
  if (!c) return { phone: null, name: 'باشگاه', owner: '' }
  /* نامِ مالک برای خطابِ پیامک؛ شماره‌ی اعلانِ باشگاه اگر ثبت شده،
     وگرنه موبایلِ مالک. */
  const owner = c.ownerId ? await nameOf(c.ownerId) : ''
  if (c.notifyPhone) return { phone: c.notifyPhone, name: c.name, owner }
  const phone = c.ownerId ? await phoneOf(c.ownerId) : null
  return { phone, name: c.name, owner }
}

/** باشگاه تأیید و منتشر شد */
export async function notifyClubApproved(clubId: string): Promise<void> {
  const { phone, name, owner } = await ownerPhoneOf(clubId)
  if (!phone) return
  notify(phone, SMS.wrap(owner, `باشگاه «${name}» تأیید شد و از این پس در سایت نمایش داده می‌شود.`))
}

/** باشگاه رد شد — علت حتماً گفته می‌شود، وگرنه مالک نمی‌داند چه را اصلاح کند */
export async function notifyClubRejected(clubId: string, reason: string): Promise<void> {
  const { phone, name, owner } = await ownerPhoneOf(clubId)
  if (!phone) return
  const why = reason?.trim() ? `\nعلت: ${reason.trim()}` : ''
  notify(phone, SMS.wrap(owner, `ثبت باشگاه «${name}» تأیید نشد.${why}\nپس از اصلاح، از داشبورد دوباره ارسال کنید.`))
}

/** مسابقه‌ی تازه‌ای در باشگاه ثبت شد — به مالک، به‌عنوان رسید ثبت */
export async function notifyTournamentCreated(clubId: string, title: string): Promise<void> {
  const { phone, name, owner } = await ownerPhoneOf(clubId)
  if (!phone) return
  notify(phone, SMS.wrap(owner, `مسابقه «${title}» در باشگاه ${name} ثبت شد.`))
}

/** مسابقه لغو شد — به همه‌ی ثبت‌نام‌کننده‌های قطعی */
export async function notifyTournamentCancelled(tournamentId: string): Promise<void> {
  const { data: t } = await sb().from('tournaments').select('title').eq('id', tournamentId).maybeSingle()
  const title = (t as { title?: string } | null)?.title ?? 'مسابقه'

  const { data: regs } = await sb().from('tournament_registrations')
    .select('user_id,payment_status').eq('tournament_id', tournamentId).eq('status', 'CONFIRMED')

  for (const r of (regs ?? []) as { user_id: string; payment_status: string }[]) {
    const phone = await phoneOf(r.user_id)
    if (!phone) continue
    const money = r.payment_status === 'PAID'
      ? '\nمبلغ پرداختی طی روزهای آینده بازگردانده می‌شود.' : ''
    notify(phone, SMS.wrap(await nameOf(r.user_id), `مسابقه «${title}» لغو شد.${money}`))
  }
}

/** ثبت‌نام مسابقه قطعی شد */
export async function notifyTournamentRegistered(registrationId: string): Promise<void> {
  const { data: r } = await sb().from('tournament_registrations')
    .select('user_id,tournament_id').eq('id', registrationId).maybeSingle()
  const reg = r as { user_id?: string; tournament_id?: string } | null
  if (!reg?.user_id) return

  const { data: t } = await sb().from('tournaments')
    .select('title,starts_at').eq('id', reg.tournament_id!).maybeSingle()
  const tt = (t ?? {}) as { title?: string; starts_at?: string }

  const phone = await phoneOf(reg.user_id)
  if (!phone) return
  const when = tt.starts_at ? `\nتاریخ: ${faDate(tt.starts_at)}` : ''
  notify(phone, SMS.wrap(await nameOf(reg.user_id), `ثبت‌نام شما در «${tt.title ?? 'مسابقه'}» قطعی شد.${when}`))
}

/** نوبت کسی که در لیست انتظار بود رسید */
export async function notifyWaitlistPromoted(registrationId: string, needsPayment: boolean): Promise<void> {
  const { data: r } = await sb().from('tournament_registrations')
    .select('user_id,tournament_id,amount').eq('id', registrationId).maybeSingle()
  const reg = r as { user_id?: string; tournament_id?: string; amount?: number } | null
  if (!reg?.user_id) return

  const { data: t } = await sb().from('tournaments')
    .select('title').eq('id', reg.tournament_id!).maybeSingle()
  const title = (t as { title?: string } | null)?.title ?? 'مسابقه'

  const phone = await phoneOf(reg.user_id)
  if (!phone) return

  /* پیام پولی حتماً باید فوریت را برساند: صندلی نگه داشته شده ولی
     تا پرداخت‌نشدن قطعی نیست. */
  const body = needsPayment
    ? `جا در «${title}» برای شما باز شد.\nبرای قطعی‌شدن، هزینه‌ی ثبت‌نام را از داشبورد پرداخت کنید.`
    : `جا در «${title}» برای شما باز شد و ثبت‌نامتان قطعی شد.`

  notify(phone, SMS.wrap(await nameOf(reg.user_id), body))
}
