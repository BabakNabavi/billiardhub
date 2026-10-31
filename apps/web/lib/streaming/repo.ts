import 'server-only'
import { sb } from '../finance/db'
import {
  DEFAULT_CLUB_SETTINGS,
  type ChannelAccess, type ChannelKind, type ClubLiveSettings, type ClubTier,
} from './policy'

/* ─────────────────────────────────────────────────────────────
   دسترسیِ دیتابیسِ پخش زنده (مهاجرتِ ۱۱۴) — فقط خواندن/نوشتنِ ردیف.
   قواعد در policy.ts و عملیات در service.ts است.
   ───────────────────────────────────────────────────────────── */

export class LiveError extends Error {
  constructor(message: string, readonly status = 400) { super(message) }
}

export interface Channel {
  id: string
  clubId: string
  kind: ChannelKind
  tournamentId: string | null
  title: string
  tableLabel: string | null
  access: ChannelAccess
  record: boolean
  provider: string
  providerChannelId: string
  ingestUrl: string
  streamKeyEnc: string
  playbackUrl: string | null
  isLive: boolean
  currentBroadcastId: string | null
  adminBlocked: boolean
  blockReason: string | null
  createdAt: string
  archivedAt: string | null
  /** ورودیِ WebRTCِ سرویس (مهاجرتِ ۱۱۵) — اگر باشد، مرورگر بی‌رله وصل می‌شود */
  whipUrl: string | null
  whipTokenEnc: string | null
}

export interface Broadcast {
  id: string
  channelId: string
  clubId: string
  title: string
  startedAt: string
  endedAt: string | null
  endedReason: string | null
  peakViewers: number
  viewerSeconds: number
  recordingUrl: string | null
  recordingHidden: boolean
}

type Row = Record<string, unknown>
const s = (v: unknown) => (v == null ? null : String(v))

export const toChannel = (r: Row): Channel => ({
  id: String(r.id), clubId: String(r.club_id), kind: r.kind as ChannelKind,
  tournamentId: s(r.tournament_id), title: String(r.title ?? ''), tableLabel: s(r.table_label),
  access: (r.access === 'members' ? 'members' : 'public'), record: r.record !== false,
  provider: String(r.provider ?? ''), providerChannelId: String(r.provider_channel_id ?? ''),
  ingestUrl: String(r.ingest_url ?? ''), streamKeyEnc: String(r.stream_key_enc ?? ''),
  playbackUrl: s(r.playback_url), isLive: r.is_live === true,
  currentBroadcastId: s(r.current_broadcast_id), adminBlocked: r.admin_blocked === true,
  blockReason: s(r.block_reason), createdAt: String(r.created_at ?? ''), archivedAt: s(r.archived_at),
  whipUrl: s(r.whip_url), whipTokenEnc: s(r.whip_token_enc),
})

export const toBroadcast = (r: Row): Broadcast => ({
  id: String(r.id), channelId: String(r.channel_id), clubId: String(r.club_id),
  title: String(r.title ?? ''), startedAt: String(r.started_at), endedAt: s(r.ended_at),
  endedReason: s(r.ended_reason), peakViewers: Number(r.peak_viewers) || 0,
  viewerSeconds: Number(r.viewer_seconds) || 0, recordingUrl: s(r.recording_url),
  recordingHidden: r.recording_hidden === true,
})

/* ── آماده‌بودنِ جدول‌ها ──
   پیش از اجرای مهاجرت، هیچ مسیری نباید ۵۰۰ بدهد: پنل‌ها «هنوز راه‌اندازی
   نشده» نشان می‌دهند. فقط «آماده» کش می‌شود تا پس از اجرای مهاجرت بی
   ری‌استارت کار کند. */
let ready = false
export async function tablesReady(): Promise<boolean> {
  if (ready) return true
  const { error } = await sb().from('live_channels').select('id').limit(1)
  if (!error) { ready = true; return true }
  /* فقط «جدول وجود ندارد» یعنی مهاجرت اجرا نشده؛ قطعیِ لحظه‌ای نباید پنل را
     «به‌زودی» نشان دهد — آن خطا در خودِ عملیات با پیامِ درست برمی‌گردد */
  const missing = error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message)
  if (!missing) console.error('[streaming] tablesReady', error.message)
  return !missing
}

export function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) {
    console.error(`[streaming] ${what}:`, res.error.message)
    throw new LiveError('خطای پایگاه داده در بخشِ پخش زنده', 500)
  }
  return res.data as T
}

export async function clubSettings(clubId: string): Promise<ClubLiveSettings> {
  const r = await sb().from('live_club_settings').select('*').eq('club_id', clubId).maybeSingle()
  const row = must(r, 'settings') as Row | null
  if (!row) return { ...DEFAULT_CLUB_SETTINGS }
  return {
    tier: (row.tier === 'pro' ? 'pro' : 'standard') as ClubTier,
    channelLimit: Number(row.channel_limit) || 1,
    blocked: row.blocked === true,
    blockReason: s(row.block_reason),
  }
}

export async function clubChannels(clubId: string): Promise<Channel[]> {
  const r = await sb().from('live_channels').select('*')
    .eq('club_id', clubId).is('archived_at', null).order('created_at', { ascending: true })
  return (must(r, 'club channels') as Row[]).map(toChannel)
}

export async function channelById(id: string): Promise<Channel | null> {
  const r = await sb().from('live_channels').select('*').eq('id', id).maybeSingle()
  const row = must(r, 'channel') as Row | null
  return row ? toChannel(row) : null
}

export async function patchChannel(id: string, patch: Row): Promise<void> {
  must(await sb().from('live_channels').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id), 'patch channel')
}

export async function broadcastsOf(channelIds: string[], since?: string, limit = 500): Promise<Broadcast[]> {
  if (channelIds.length === 0) return []
  let q = sb().from('live_broadcasts').select('*').in('channel_id', channelIds)
  if (since) q = q.gte('started_at', since)
  const r = await q.order('started_at', { ascending: false }).limit(limit)
  return (must(r, 'broadcasts') as Row[]).map(toBroadcast)
}

export async function clubNames(ids: string[]): Promise<Map<string, { name: string; slug: string | null; logo: string | null }>> {
  const out = new Map<string, { name: string; slug: string | null; logo: string | null }>()
  if (ids.length === 0) return out
  const r = await sb().from('clubs').select('id,name,slug,logo').in('id', [...new Set(ids)])
  for (const c of (must(r, 'clubs') as Row[])) {
    out.set(String(c.id), { name: String(c.name ?? 'باشگاه'), slug: s(c.slug), logo: s(c.logo) })
  }
  return out
}
