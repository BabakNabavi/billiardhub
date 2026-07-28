/* ─────────────────────────────────────────────────────────────
   اطلاع‌رسانیِ رویدادهای رزرو — یک‌جا، تا مسیرهای مالی شلوغ نشوند.
   همه‌ی توابع بی‌صدا هستند: خطای پیامک نباید پرداخت یا لغو را بشکند.
   ───────────────────────────────────────────────────────────── */

import { sb } from './finance/db'
import { notify, SMS } from './sms-server'
import { faDate, faTimeRange } from './jalali'

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

async function clubOf(clubId: string): Promise<{ name: string; ownerId: string | null } | null> {
  const { data } = await sb().from('clubs').select('name,"ownerId"').eq('id', clubId).maybeSingle()
  if (!data) return null
  const c = data as { name?: string; ownerId?: string }
  return { name: c.name ?? 'باشگاه', ownerId: c.ownerId ?? null }
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

  /* باشگاه‌دار هم باید بداند میزش پر شده */
  if (club?.ownerId && club.ownerId !== b.userId) {
    let tableName = ''
    if (b.tableId) {
      const { data } = await sb().from('tables').select('name,number').eq('id', b.tableId).maybeSingle()
      const t = data as { name?: string; number?: number } | null
      tableName = t?.name ?? (t?.number ? `میز ${t.number}` : '')
    }
    notify(await phoneOf(club.ownerId), SMS.newBookingForOwner(date, time, tableName))
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
