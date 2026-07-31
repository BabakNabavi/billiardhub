import 'server-only'
import { sb } from '../finance/db'
import { notifyWaitlistPromoted } from '../notify'

/* ارتقای نفر اول صف انتظار وقتی صندلی آزاد می‌شود.

   هرجا یک ثبت‌نام قطعی از بین می‌رود (بازپرداخت، لغو، انقضای پرداخت)
   باید صدا زده شود — وگرنه لیست انتظار فقط یک فهرست تزئینی است.

   خودش بی‌صداست: شکست ارتقا نباید عملیات اصلی (که پول در آن
   جابه‌جا شده) را برگرداند. */
export async function promoteWaitlist(tournamentId: string): Promise<number> {
  try {
    const { data, error } = await sb().rpc('bh_tournament_promote_waitlist', {
      p_tournament: tournamentId,
    })
    if (error) { console.error('[waitlist/promote]', error.message); return 0 }

    const res = data as {
      ok: boolean; promoted?: number; registrationId?: string; needsPayment?: boolean
    }
    if (!res?.ok || !res.promoted) return 0

    /* کاربر باید بداند نوبتش شد — به‌خصوص وقتی باید پول بدهد و
       صندلی محدود نگه داشته می‌شود. */
    if (res.registrationId) {
      void notifyWaitlistPromoted(res.registrationId, !!res.needsPayment)
        .catch(() => { /* بی‌صدا */ })
    }
    return res.promoted
  } catch (e) {
    console.error('[waitlist/promote]', e)
    return 0
  }
}
