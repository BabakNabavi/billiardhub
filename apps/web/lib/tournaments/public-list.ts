import 'server-only'
import { listPublicTournaments, seatsLeft } from './server'
import { toTournament } from './shape'
import type { Tournament } from '../mock-tournaments'

/* فهرستِ عمومیِ مسابقات به شکلِ صفحه — همان چیزی که GET /api/tournaments
   (بی clubId) برمی‌گرداند و fetchTournaments در مرورگر نگاشت می‌کند، این‌جا
   برای HTMLِ اولِ /tournaments. */
export async function loadPublicTournaments(): Promise<Tournament[]> {
  const rows = await listPublicTournaments()
  const withSeats = await Promise.all(rows.map(async t => ({ ...t, seatsLeft: await seatsLeft(t.id) })))
  return withSeats.map(toTournament)
}
