import 'server-only'
import { sb } from '../finance/db'
import { broadcastsOf, channelById, clubNames, clubSettings, must, tablesReady, toChannel, type Channel } from './repo'
import { sweepStale } from './service'
import { admit, beat, countOf, tally } from './viewers'
import { canWatch } from './policy'
import type { ArchiveItem, PublicChannel } from './public-types'

/* ─────────────────────────────────────────────────────────────
   خواندنِ عمومیِ پخش زنده — برای بیننده (بدونِ ثبت‌نام).
   ⚠️ هیچ‌چیز از این‌جا نشانیِ ارسال یا کلیدِ استریم را بیرون نمی‌دهد.
   ───────────────────────────────────────────────────────────── */

export type { PublicChannel, ArchiveItem } from './public-types'
/** فقط شمار — برای نشانِ «زنده» در نوارِ بالای همه‌ی صفحه‌ها (سبک: بی ردیف) */
export async function liveChannelCount(): Promise<number> {
  if (!(await tablesReady())) return 0
  const { count, error } = await sb().from('live_channels').select('id', { count: 'exact', head: true })
    .eq('is_live', true).eq('admin_blocked', false).is('archived_at', null)
  return error ? 0 : count ?? 0
}


async function openStarts(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (ids.length === 0) return out
  const r = await sb().from('live_broadcasts').select('channel_id,started_at').in('channel_id', ids).is('ended_at', null)
  for (const b of (must(r, 'open starts') as { channel_id: string; started_at: string }[])) out.set(b.channel_id, b.started_at)
  return out
}

function shape(ch: Channel, club: PublicChannel['club'], startedAt: string | null, clubBlocked = false): PublicChannel {
  const live = ch.isLive && !ch.adminBlocked && !ch.archivedAt && !clubBlocked
  return {
    id: ch.id, title: ch.title, kind: ch.kind, tableLabel: ch.tableLabel, tournamentId: ch.tournamentId,
    access: ch.access, isLive: live, startedAt: live ? startedAt : null,
    viewers: live ? countOf(ch.id) : 0, club,
  }
}

/** همه‌ی کانال‌های زنده‌ی سایت؛ با tournamentId فقط کانالِ همان مسابقه */
export async function liveChannels(filter: { tournamentId?: string; clubId?: string } = {}): Promise<PublicChannel[]> {
  await sweepStale().catch(e => console.error('[streaming] sweep', e))
  let q = sb().from('live_channels').select('*').eq('is_live', true).eq('admin_blocked', false).is('archived_at', null)
  if (filter.tournamentId) q = q.eq('tournament_id', filter.tournamentId)
  if (filter.clubId) q = q.eq('club_id', filter.clubId)
  const all = (must(await q, 'live channels') as Record<string, unknown>[]).map(toChannel)
  /* مسدودیِ باشگاه در سمتِ خواندن هم: «شروع»ی که با «مسدود کن» هم‌زمان شد
     نباید عمومی بماند */
  const blocked = new Set<string>()
  if (all.length) {
    const r = await sb().from('live_club_settings').select('club_id').eq('blocked', true).in('club_id', [...new Set(all.map(c => c.clubId))])
    for (const row of (must(r, 'blocked clubs') as { club_id: string }[])) blocked.add(String(row.club_id))
  }
  const chans = all.filter(c => !blocked.has(c.clubId))
  const [clubs, starts] = await Promise.all([clubNames(chans.map(c => c.clubId)), openStarts(chans.map(c => c.id))])
  return chans
    .map(ch => shape(ch, { id: ch.clubId, ...(clubs.get(ch.clubId) ?? { name: 'باشگاه', slug: null, logo: null }) }, starts.get(ch.id) ?? null))
    .sort((a, b) => b.viewers - a.viewers || String(b.startedAt).localeCompare(String(a.startedAt)))
}

export type ArchiveLock = 'login' | 'blocked' | null

/** یک کانال برای صفحه‌ی تماشا، همراه با آرشیوِ ضبط‌ها.
 *  ⚠️ کانالِ «اعضا»: ضبط‌ها هم فقط برای کاربرِ واردشده — نشانیِ ضبط همان
 *  محتوای پخش است. کانال یا باشگاهِ مسدود: آرشیوی بیرون نمی‌رود. */
export async function publicChannel(id: string, viewer: { loggedIn: boolean }):
  Promise<{ channel: PublicChannel; archive: ArchiveItem[]; archiveLock: ArchiveLock } | null> {
  const ch = await channelById(id)
  if (!ch || ch.archivedAt) return null
  const [clubs, starts, past, settings] = await Promise.all([
    clubNames([ch.clubId]), openStarts([ch.id]), broadcastsOf([ch.id], undefined, 40), clubSettings(ch.clubId),
  ])
  const club = { id: ch.clubId, ...(clubs.get(ch.clubId) ?? { name: 'باشگاه', slug: null, logo: null }) }
  const channel = shape(ch, club, starts.get(ch.id) ?? null, settings.blocked)
  const archiveLock: ArchiveLock = ch.adminBlocked || settings.blocked ? 'blocked'
    : !canWatch(ch.access, viewer.loggedIn) ? 'login' : null
  if (archiveLock) return { channel, archive: [], archiveLock }
  const archive = past
    .filter(b => b.recordingUrl && !b.recordingHidden && b.endedAt)
    .slice(0, 20)
    .map(b => ({ id: b.id, title: b.title, startedAt: b.startedAt, endedAt: b.endedAt, recordingUrl: b.recordingUrl! }))
  return { channel, archive, archiveLock }
}

/** تپشِ بیننده؛ آمارِ پخش هر دقیقه یک‌بار در دیتابیس می‌نشیند */
export async function viewerBeat(ch: Channel, viewerId: string, ip: string): Promise<number> {
  /* یک IP بیش از چند بیننده‌ی هم‌زمان نمی‌سازد — شمارنده با اسکریپت باد نمی‌شود */
  if (!admit(ip, ch.id, viewerId)) return countOf(ch.id)
  const n = beat(ch.id, viewerId)
  if (ch.currentBroadcastId) {
    const flush = tally(ch.currentBroadcastId, n)
    if (flush) {
      /* فقط رو به بالا (`lt`): پس از ری‌استارتِ سرور، حافظه از صفر شروع
         می‌کند و نباید عددِ بزرگ‌ترِ ذخیره‌شده را پایین بیاورد */
      const id = ch.currentBroadcastId
      const [a, b] = await Promise.all([
        sb().from('live_broadcasts').update({ peak_viewers: flush.peak })
          .eq('id', id).is('ended_at', null).lt('peak_viewers', flush.peak),
        sb().from('live_broadcasts').update({ viewer_seconds: flush.seconds })
          .eq('id', id).is('ended_at', null).lt('viewer_seconds', flush.seconds),
      ])
      if (a.error || b.error) console.error('[streaming] tally flush', a.error?.message ?? b.error?.message)
    }
  }
  return n
}
