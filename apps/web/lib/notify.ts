/* ─────────────────────────────────────────────────────────────
   اطلاع‌رسانیِ رویدادهای رزرو — یک‌جا، تا مسیرهای مالی شلوغ نشوند.
   همه‌ی توابع بی‌صدا هستند: خطای پیامک نباید پرداخت یا لغو را بشکند.
   ───────────────────────────────────────────────────────────── */

import { sb } from './finance/db'
import { notify, SMS } from './sms-server'
import { faDate, faTimeRange } from './jalali'

/* نامِ فارسیِ نوعِ میز — برای متنِ پیامک */
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

/** نامِ نمایشیِ کاربر — برای پیامکِ باشگاه‌دار */
async function nameOf(userId: string): Promise<string> {
  const { data } = await sb().from('users').select('"firstName","lastName"').eq('id', userId).maybeSingle()
  const u = (data ?? {}) as { firstName?: string; lastName?: string }
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
}

/** رزرو قطعی شد — به کاربر، و خبرِ رزروِ جدید به باشگاه‌دار */
export async function notifyBookingConfirmed(bookingId: string): Promise<void> {
  const b = await loadBooking(bookingId)
  if (!b) return
  const club = await clubOf(b.clubId)
  const date = faDate(b.bookingDate)
  const time = faTimeRange(b.timeSlots)

  const userPhone = await phoneOf(b.userId)
  notify(userPhone, SMS.bookingConfirmed(club?.name ?? 'باشگاه', date, time, b.booking_reference ?? '—'))

  /* باشگاه‌دار هم باید بداند میزش پر شده.

     مقصد لزوماً شماره‌ی خودِ مالک نیست: بسیاری از باشگاه‌ها به نامِ یک
     نفر ثبت‌اند ولی کسِ دیگری اداره‌شان می‌کند. اگر «شماره‌ی
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
    notify(target, SMS.newBookingForOwner(club.name, date, time, tableName, await nameOf(b.userId)))
  }
}

/** رزرو لغو شد — با مبلغِ بازگشتی */
export async function notifyBookingCancelled(bookingId: string, refund: number): Promise<void> {
  const b = await loadBooking(bookingId)
  if (!b) return
  const club = await clubOf(b.clubId)
  notify(await phoneOf(b.userId), SMS.bookingCancelled(club?.name ?? 'باشگاه', faDate(b.bookingDate), refund))
}

/** تسویه به حسابِ باشگاه‌دار واریز شد */
export async function notifySettlementPaid(clubId: string, amount: number): Promise<void> {
  const club = await clubOf(clubId)
  if (!club?.ownerId) return
  notify(await phoneOf(club.ownerId), SMS.settlementPaid(amount))
}
