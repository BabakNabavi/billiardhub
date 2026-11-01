'use client'

/* ─────────────────────────────────────────────────────────────
   پل مسابقات به سرور — برای صفحه‌های عمومی.

   شش صفحه‌ی مسابقات از `SAMPLE_TOURNAMENTS` (آرایه‌ی هاردکد) می‌خواندند،
   یعنی کاربر مسابقه‌های ساختگی می‌دید و هیچ‌کدام قابل ثبت‌نام واقعی
   نبودند.

   این‌جا داده‌ی واقعی خوانده و به **همان شکلی** نگاشت می‌شود که صفحه‌ها
   از قبل انتظار دارند (`Tournament`). این‌طور شش صفحه بدون بازنویسی
   وصل می‌شوند و ریسک شکستن چیدمان صفر است.
   ───────────────────────────────────────────────────────────── */

import type { Tournament } from '../mock-tournaments'
import { toTournament, type DbTournament } from './shape'

/* نگاشت در shape.ts است (سرور هم می‌خواندش)؛ این‌جا برای واردکننده‌های قبلی */
export { toTournament, type DbTournament }

/** همه‌ی مسابقات عمومی */
export async function fetchTournaments(clubId?: string): Promise<Tournament[]> {
  try {
    const q = clubId ? `?clubId=${encodeURIComponent(clubId)}` : ''
    const r = await fetch(`/api/tournaments${q}`, { cache: 'no-store' })
    if (!r.ok) return []
    const j = await r.json().catch(() => null) as { tournaments?: DbTournament[] } | null
    return (j?.tournaments ?? []).map(toTournament)
  } catch { return [] }
}

/** یک مسابقه با شناسه.
 *
 *  ── چرا مستقیم و نه از فهرست ──
 *  پیش‌تر کل فهرست عمومی گرفته می‌شد و بینش دنبال شناسه می‌گشتیم.
 *  سه ایراد داشت: صدها ردیف برای یک صفحه، سقف ۲۰۰ ردیفی فهرست (که
 *  با زیادشدن مسابقات، قدیمی‌ترها را نامرئی می‌کرد)، و مهم‌تر از
 *  همه اینکه مالک باشگاه هم نمی‌توانست پیش‌نویس خودش را ببیند —
 *  چون فهرست عمومی پیش‌نویس‌ها را فیلتر می‌کند در حالی که مسیر
 *  تک‌مسابقه‌ای برای مالک بازش می‌گذارد.
 *
 *  ظرفیت را همان مسیر برنمی‌گرداند، پس جداگانه پرسیده می‌شود. */
export async function fetchTournament(
  id: string,
): Promise<(Tournament & { myStatus?: string | null }) | null> {
  try {
    const r = await fetch(`/api/tournaments/${encodeURIComponent(id)}`, { cache: 'no-store' })
    if (!r.ok) return null
    const j = await r.json().catch(() => null) as { tournament?: DbTournament } | null
    const row = j?.tournament
    if (!row) return null
    const seats = await fetchSeats(id)
    /* `myStatus` وضعیتِ ثبت‌نامِ همین کاربر است (یا null) — از همان
       درخواستِ ظرفیت می‌آید، بی‌درخواستِ اضافه. */
    return {
      ...toTournament({ ...row, seatsLeft: seats?.seatsLeft ?? row.max_players }),
      myStatus: seats?.myStatus ?? null,
    }
  } catch { return null }
}

/** ظرفیت و وضعیت لحظه‌ای — برای صفحه‌ی ثبت‌نام */
export async function fetchSeats(id: string): Promise<{
  seatsLeft: number; maxPlayers: number; entryFee: number; status: string
  myStatus?: string | null
} | null> {
  try {
    const r = await fetch(`/api/tournaments/${id}/register`, { cache: 'no-store' })
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}
