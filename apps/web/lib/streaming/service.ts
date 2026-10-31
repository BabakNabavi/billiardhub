import 'server-only'
import { sb } from '../finance/db'
import { getStreamProvider, StreamProviderError, type StreamProvider } from './index'
import {
  canCreateChannel, canGoLive, channelLimitOf, isStale, PRO_DEFAULT_LIMIT,
  type ChannelAccess, type ChannelKind, type ClubTier,
} from './policy'
import {
  LiveError, must, channelById, clubChannels, clubSettings, patchChannel, toBroadcast,
  type Channel,
} from './repo'
import { seal } from './secret'
import { finishTally, reset } from './viewers'

/* ─────────────────────────────────────────────────────────────
   عملیاتِ پخش زنده — هر تغییرِ وضعیت فقط از این‌جا.
   مسیرها (route.ts) فقط هویت و ورودی را می‌سنجند و این‌ها را صدا می‌زنند.
   ───────────────────────────────────────────────────────────── */

function provider(): StreamProvider {
  const p = getStreamProvider()
  if (!p) throw new LiveError('سرویسِ پخش زنده هنوز وصل نشده است', 503)
  return p
}

/* خطای سرویس پیامِ فارسیِ خودش را دارد؛ بقیه پیامِ عمومی */
async function viaProvider<T>(what: string, fn: () => Promise<T>): Promise<T> {
  try { return await fn() } catch (e) {
    if (e instanceof StreamProviderError) throw new LiveError(e.message, e.status)
    console.error(`[streaming] provider ${what} failed`, e)
    throw new LiveError('ارتباط با سرویسِ پخش برقرار نشد؛ کمی بعد دوباره تلاش کنید', 502)
  }
}

export interface NewChannel {
  clubId: string; kind: ChannelKind; title: string; tableLabel?: string | null
  tournamentId?: string | null; access: ChannelAccess; record: boolean; actorId: string
}

export async function createChannel(n: NewChannel): Promise<Channel> {
  const [settings, existing] = await Promise.all([clubSettings(n.clubId), clubChannels(n.clubId)])
  let tournamentHasChannel = false
  if (n.kind === 'tournament') {
    if (!n.tournamentId) throw new LiveError('مسابقه انتخاب نشده است')
    const t = must(await sb().from('tournaments').select('id,club_id,status')
      .eq('id', n.tournamentId).maybeSingle(), 'tournament') as { club_id?: string; status?: string } | null
    if (!t || String(t.club_id) !== n.clubId) throw new LiveError('این مسابقه متعلق به این باشگاه نیست', 403)
    /* همان فیلترِ فهرستِ پنل: پیش‌نویس، تمام‌شده و لغوشده کانال نمی‌گیرند */
    if (['cancelled', 'completed', 'draft'].includes(String(t.status))) throw new LiveError('برای این مسابقه نمی‌شود کانالِ پخش ساخت')
    tournamentHasChannel = existing.some(c => c.tournamentId === n.tournamentId)
  }
  const v = canCreateChannel(settings, existing, n.kind, { tournamentHasChannel })
  if (!v.ok) throw new LiveError(v.reason, 409)

  const p = provider()
  const made = await viaProvider('create', () => p.createChannel({ title: `bh-${n.clubId.slice(0, 8)}-${n.title}`, record: n.record }))
  const r = await sb().from('live_channels').insert({
    club_id: n.clubId, kind: n.kind, tournament_id: n.kind === 'tournament' ? n.tournamentId : null,
    title: n.title, table_label: n.kind === 'table' ? (n.tableLabel || null) : null,
    access: n.access, record: n.record, provider: p.name,
    provider_channel_id: made.providerChannelId, ingest_url: made.ingestUrl,
    stream_key_enc: seal(made.streamKey), playback_url: made.playbackUrl, created_by: n.actorId,
  }).select('*').single()
  if (r.error) {
    /* ردیف نشست ⇒ کانالِ سرویس یتیم نماند */
    await p.deleteChannel(made.providerChannelId).catch(() => undefined)
    if (/duplicate|unique/i.test(r.error.message)) throw new LiveError('این مسابقه از قبل کانالِ پخش دارد', 409)
    must(r, 'insert channel')
  }
  const id = String((r.data as { id: string }).id)
  /* دو «ساخت»ِ هم‌زمان هر دو از سنجشِ سقف رد می‌شوند (دیتابیس قیدی ندارد) —
     پس از درج دوباره شمرده می‌شود و اگر از سقف گذشت، همین ردیف برمی‌گردد */
  if (n.kind !== 'tournament') {
    const after = (await clubChannels(n.clubId)).filter(c => c.kind !== 'tournament')
    const rank = after.findIndex(c => c.id === id)
    if (rank >= channelLimitOf(settings)) {
      await sb().from('live_channels').delete().eq('id', id)
      await p.deleteChannel(made.providerChannelId).catch(() => undefined)
      throw new LiveError(`سقفِ کانال‌های این باشگاه (${channelLimitOf(settings)}) پر است`, 409)
    }
  }
  return (await channelById(id))!
}

export async function updateChannel(ch: Channel, patch: { title?: string; access?: ChannelAccess; record?: boolean; tableLabel?: string | null }) {
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = patch.title
  if (patch.access !== undefined) row.access = patch.access
  if (patch.record !== undefined) row.record = patch.record
  if (patch.tableLabel !== undefined && ch.kind === 'table') row.table_label = patch.tableLabel
  if (Object.keys(row).length) await patchChannel(ch.id, row)
}

export async function rotateKey(ch: Channel): Promise<void> {
  const p = provider()
  const k = await viaProvider('rotate', () => p.rotateKey(ch.providerChannelId))
  await patchChannel(ch.id, { stream_key_enc: seal(k.streamKey), ...(k.ingestUrl ? { ingest_url: k.ingestUrl } : {}) })
}

/** «شروعِ پخش»: کانال روی سایت زنده می‌شود و ورودیِ سرویس باز */
export async function startBroadcast(ch: Channel, actorId: string, title?: string): Promise<void> {
  const [settings, siblings] = await Promise.all([clubSettings(ch.clubId), clubChannels(ch.clubId)])
  const rank = siblings.filter(c => c.kind !== 'tournament').findIndex(c => c.id === ch.id)
  const v = canGoLive({ adminBlocked: ch.adminBlocked, archived: !!ch.archivedAt, isLive: ch.isLive, kind: ch.kind, rank: Math.max(0, rank) }, settings)
  if (!v.ok) throw new LiveError(v.reason, 409)
  const p = provider()
  await viaProvider('enable', () => p.setEnabled(ch.providerChannelId, true))
  const r = await sb().from('live_broadcasts').insert({
    channel_id: ch.id, club_id: ch.clubId, title: (title || ch.title).slice(0, 120), started_by: actorId,
  }).select('id').single()
  /* ایندکسِ یکتا: پخشِ بازِ دیگری هست — دو کلیکِ هم‌زمان، یا پخشی که ردیفش
     باز ماند ولی کانال «خاموش» شد (شکستِ نیمه‌کاره). همان را به کانال وصل
     می‌کنیم؛ وگرنه کانال تا ۱۲ ساعت نه شروع می‌شد نه دکمه‌ی پایان داشت. */
  if (r.error && /duplicate|unique/i.test(r.error.message)) {
    const open = must(await sb().from('live_broadcasts').select('id')
      .eq('channel_id', ch.id).is('ended_at', null).maybeSingle(), 'adopt broadcast') as { id: string } | null
    if (open) await patchChannel(ch.id, { is_live: true, current_broadcast_id: open.id })
    return
  }
  const id = String((must(r, 'insert broadcast') as { id: string }).id)
  await patchChannel(ch.id, { is_live: true, current_broadcast_id: id })
}

export type EndReason = 'owner' | 'admin' | 'timeout' | 'blocked'

/** پایانِ پخش + برداشتنِ ضبط برای آرشیو (اگر سرویس داد) */
export async function stopBroadcast(ch: Channel, reason: EndReason): Promise<void> {
  const open = must(await sb().from('live_broadcasts').select('*')
    .eq('channel_id', ch.id).is('ended_at', null).maybeSingle(), 'open broadcast') as Record<string, unknown> | null
  const now = new Date().toISOString()
  if (open) {
    const b = toBroadcast(open)
    const t = finishTally(b.id)
    let recordingUrl: string | null = null
    const p = getStreamProvider()
    if (ch.record && p) {
      const recs = await p.recordings(ch.providerChannelId, new Date(b.startedAt)).catch(() => [])
      recordingUrl = recs[0]?.url ?? null
    }
    must(await sb().from('live_broadcasts').update({
      ended_at: now, ended_reason: reason,
      peak_viewers: Math.max(b.peakViewers, t?.peak ?? 0),
      viewer_seconds: Math.max(b.viewerSeconds, t?.seconds ?? 0),
      ...(recordingUrl ? { recording_url: recordingUrl } : {}),
    }).eq('id', b.id), 'close broadcast')
  }
  await patchChannel(ch.id, { is_live: false, current_broadcast_id: null })
  reset(ch.id)
  /* بستنِ ورودیِ سرویس؛ شکستش پایانِ پخش روی سایت را برنمی‌گرداند */
  await getStreamProvider()?.setEnabled(ch.providerChannelId, false)
    .catch(e => console.error('[streaming] disable after stop failed', e))
}

export async function archiveChannel(ch: Channel): Promise<void> {
  /* وگرنه حذف + ساختِ دوباره، مسدودیِ مدیریت را دور می‌زد */
  if (ch.adminBlocked) throw new LiveError('کانالِ مسدود را نمی‌توان حذف کرد؛ با پشتیبانی تماس بگیرید', 409)
  if (ch.isLive) await stopBroadcast(ch, 'owner')
  await getStreamProvider()?.deleteChannel(ch.providerChannelId)
    .catch(e => console.error('[streaming] provider delete failed', e))
  await patchChannel(ch.id, { archived_at: new Date().toISOString(), is_live: false })
}

export async function setChannelBlocked(ch: Channel, blocked: boolean, reason: string | null, actorId: string) {
  if (blocked && ch.isLive) await stopBroadcast(ch, 'blocked')
  await patchChannel(ch.id, {
    admin_blocked: blocked, block_reason: blocked ? reason : null,
    blocked_at: blocked ? new Date().toISOString() : null, blocked_by: blocked ? actorId : null,
  })
}

export async function setClubSettings(
  clubId: string,
  patch: { tier?: ClubTier; channelLimit?: number; blocked?: boolean; blockReason?: string | null },
  actorId: string,
) {
  const cur = await clubSettings(clubId)
  const tier = patch.tier ?? cur.tier
  const limit = tier === 'pro' ? (patch.channelLimit ?? (cur.tier === 'pro' ? cur.channelLimit : PRO_DEFAULT_LIMIT)) : 1
  const blocked = patch.blocked ?? cur.blocked
  must(await sb().from('live_club_settings').upsert({
    club_id: clubId, tier, channel_limit: limit, blocked,
    block_reason: blocked ? (patch.blockReason ?? cur.blockReason) : null,
    blocked_at: blocked ? new Date().toISOString() : null, blocked_by: blocked ? actorId : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'club_id' }), 'upsert settings')
  if (blocked && !cur.blocked) {
    for (const ch of await clubChannels(clubId)) if (ch.isLive) await stopBroadcast(ch, 'blocked')
  }
}

/* ── پخش‌های رهاشده ──
   باشگاه‌داری که «پایان» را نزند، کانالش تا ابد «زنده» می‌ماند. با هر
   خواندنِ فهرست (حداکثر هر دقیقه یک‌بار) پخش‌های بیش از ۱۲ ساعت بسته می‌شوند. */
let lastSweep = 0
export async function sweepStale(now = Date.now()): Promise<void> {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  const r = await sb().from('live_broadcasts').select('channel_id,started_at').is('ended_at', null)
  if (r.error) { console.error('[streaming] sweep read', r.error.message); return }
  for (const b of (r.data ?? []) as { channel_id: string; started_at: string }[]) {
    if (!isStale(Date.parse(b.started_at), now)) continue
    const ch = await channelById(b.channel_id)
    if (ch) await stopBroadcast(ch, 'timeout').catch(e => console.error('[streaming] sweep failed', e))
  }
}
