export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { actorFromRequest, audit, clientIp, sb } from '@/lib/finance/db'
import { can } from '@/lib/admin/permissions'
import { getStreamProvider, streamProviderName } from '@/lib/streaming'
import { channelLimitOf, MAX_CHANNEL_LIMIT, summarize } from '@/lib/streaming/policy'
import { LiveError, broadcastsOf, channelById, clubNames, must, tablesReady, toChannel } from '@/lib/streaming/repo'
import { archiveChannel, attachManualChannel, setChannelBlocked, setClubSettings, stopBroadcast } from '@/lib/streaming/service'
import { countOf } from '@/lib/streaming/viewers'
import { seal } from '@/lib/streaming/secret'

/* ─────────────────────────────────────────────────────────────
   پنلِ مدیریتِ پخش زنده — کلیدِ دسترسیِ «live».
   GET   همه‌ی باشگاه‌های دارای کانال/تنظیم + آمارِ ۳۰ روز
   POST  block-channel | unblock-channel | block-club | unblock-club |
         set-tier | force-stop | hide-recording | show-recording |
         archive-channel | attach-manual (کانالِ ساخته‌شده در پنلِ آروان)
   ⚠️ کلیدِ استریم هرگز به پنلِ مدیر نمی‌رود — لازمش ندارد.
   ───────────────────────────────────────────────────────────── */

const NO_STORE = { 'Cache-Control': 'no-store' }
const uuid = z.string().uuid()
const reason = z.string().trim().min(3).max(300)

const Action = z.discriminatedUnion('action', [
  z.object({ action: z.literal('block-channel'), channelId: uuid, reason }),
  z.object({ action: z.literal('unblock-channel'), channelId: uuid }),
  z.object({ action: z.literal('force-stop'), channelId: uuid }),
  z.object({ action: z.literal('block-club'), clubId: uuid, reason }),
  z.object({ action: z.literal('unblock-club'), clubId: uuid }),
  z.object({
    action: z.literal('set-tier'), clubId: uuid, tier: z.enum(['standard', 'pro']),
    channelLimit: z.number().int().min(2).max(MAX_CHANNEL_LIMIT).optional(),
  }),
  z.object({ action: z.enum(['hide-recording', 'show-recording']), broadcastId: uuid }),
  z.object({ action: z.literal('archive-channel'), channelId: uuid }),
  /* ورودیِ WebRTCِ سرویس (اگر آروان بدهد) — خالی = برداشتن */
  z.object({
    action: z.literal('set-whip'), channelId: uuid,
    whipUrl: z.union([z.literal(''), z.string().trim().url().regex(/^https:\/\/[a-z0-9.-]+\.(arvanlive|arvancloud)\.ir\//i,'نشانیِ WHIP باید از دامنه‌ی آروان باشد')]),
    whipToken: z.string().trim().max(500).optional(),
  }),
  /* کانالی که در پنلِ آروان ساخته شده — نشانی‌ها از همان پنل کپی می‌شوند */
  z.object({
    action: z.literal('attach-manual'), clubId: uuid, kind: z.enum(['club', 'table']),
    title: z.string().trim().min(2, 'نامِ کانال دست‌کم ۲ حرف').max(90, 'نامِ کانال حداکثر ۹۰ حرف'), tableLabel: z.string().trim().max(40).optional(),
    access: z.enum(['public', 'members']).default('public'),
    ingestUrl: z.string().trim().regex(/^(rtmps?|srt):\/\/\S{6,300}$/, 'نشانیِ ورودی باید با rtmp:// یا srt:// شروع شود'),
    streamKey: z.string().trim().min(4, 'کلیدِ پخش کوتاه است').max(200, 'کلیدِ پخش بیش از حد بلند است'),
    /* فقط دامنه‌ای که CSP اجازه داده — وگرنه ذخیره می‌شد و مرورگر بی‌صدا می‌بستش */
    playbackUrl: z.string().trim().url()
      .regex(/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.arvanlive\.ir\/\S+\.m3u8(\?\S*)?$/i, 'نشانیِ تماشا باید از arvanlive.ir و با .m3u8 باشد'),
  }),
])

const hostOf = (u: string) => { try { return new URL(u).host } catch { return '?' } }

async function guard(req: NextRequest) {
  const actor = actorFromRequest(req)
  if (!actor) return { res: NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) }
  if (!(await can(actor.id, 'live'))) return { res: NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 }) }
  return { actor }
}

export async function GET(req: NextRequest) {
  const g = await guard(req)
  if ('res' in g) return g.res
  const meta = { connected: !!getStreamProvider(), provider: streamProviderName() || null }
  if (!(await tablesReady())) return NextResponse.json({ ready: false, ...meta, clubs: [] }, { headers: NO_STORE })

  try {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const [chRes, setRes] = await Promise.all([
      sb().from('live_channels').select('*').is('archived_at', null).order('created_at'),
      sb().from('live_club_settings').select('*'),
    ])
    const channels = (must(chRes, 'admin channels') as Record<string, unknown>[]).map(toChannel)
    const settings = must(setRes, 'admin settings') as Record<string, unknown>[]
    const past = await broadcastsOf(channels.map(c => c.id), since, 2000)
    const clubIds = [...new Set([...channels.map(c => c.clubId), ...settings.map(s => String(s.club_id))])]
    const names = await clubNames(clubIds)

    const clubs = clubIds.map(clubId => {
      const st = settings.find(s => String(s.club_id) === clubId)
      const cfg = {
        tier: st?.tier === 'pro' ? 'pro' as const : 'standard' as const,
        channelLimit: Number(st?.channel_limit) || 1,
        blocked: st?.blocked === true, blockReason: (st?.block_reason as string | null) ?? null,
      }
      const mine = channels.filter(c => c.clubId === clubId)
      return {
        clubId, name: names.get(clubId)?.name ?? 'باشگاه', slug: names.get(clubId)?.slug ?? null,
        settings: cfg, limit: channelLimitOf(cfg),
        month: summarize(past.filter(b => b.clubId === clubId)),
        channels: mine.map(c => ({
          id: c.id, kind: c.kind, title: c.title, tableLabel: c.tableLabel, access: c.access,
          isLive: c.isLive, viewers: c.isLive ? countOf(c.id) : 0, manual: c.provider === 'manual', whipUrl: c.whipUrl,
          adminBlocked: c.adminBlocked, blockReason: c.blockReason,
          month: summarize(past.filter(b => b.channelId === c.id)),
          recent: past.filter(b => b.channelId === c.id).slice(0, 5),
        })),
      }
    }).sort((a, b) => Number(b.channels.some(c => c.isLive)) - Number(a.channels.some(c => c.isLive)) || b.month.hours - a.month.hours)

    /* فهرستِ همه‌ی باشگاه‌ها برای «تعیینِ سطح» پیش از ساختِ اولین کانال */
    const all = await sb().from('clubs').select('id,name').order('name').limit(2000)
    const allClubs = ((all.data ?? []) as { id: string; name: string | null }[]).map(c => ({ id: String(c.id), name: String(c.name ?? 'باشگاه') }))
    return NextResponse.json({ ready: true, ...meta, clubs, allClubs, month: summarize(past) }, { headers: NO_STORE })
  } catch (e) {
    console.error('[admin/streams]', e)
    return NextResponse.json({ message: 'خواندنِ اطلاعاتِ پخش ممکن نشد' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const g = await guard(req)
  if ('res' in g) return g.res
  const parsed = Action.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message
    return NextResponse.json({ message: first && /[؀-ۿ]/.test(first) ? first : 'اطلاعات کامل یا معتبر نیست (دلیلِ مسدودسازی دست‌کم ۳ حرف)' }, { status: 400 })
  }
  const b = parsed.data
  if (!(await tablesReady())) return NextResponse.json({ message: 'مهاجرتِ ۱۱۴ هنوز اجرا نشده است' }, { status: 503 })

  try {
    if (b.action === 'block-club' || b.action === 'unblock-club') {
      await setClubSettings(b.clubId, { blocked: b.action === 'block-club', blockReason: 'reason' in b ? b.reason : null }, g.actor.id)
    } else if (b.action === 'set-tier') {
      await setClubSettings(b.clubId, { tier: b.tier, channelLimit: b.channelLimit }, g.actor.id)
    } else if (b.action === 'hide-recording' || b.action === 'show-recording') {
      must(await sb().from('live_broadcasts').update({ recording_hidden: b.action === 'hide-recording' }).eq('id', b.broadcastId), 'recording')
    } else if (b.action === 'attach-manual') {
      await attachManualChannel({ ...b, actorId: g.actor.id })
    } else if ('channelId' in b) {
      const ch = await channelById(b.channelId)
      if (!ch || (b.action === 'archive-channel' && ch.archivedAt)) return NextResponse.json({ message: 'کانال یافت نشد' }, { status: 404 })
      /* بی‌شرط: اگر پخشِ بازی بی‌کانالِ «زنده» مانده باشد هم بسته می‌شود؛ وگرنه بی‌اثر */
      if (b.action === 'force-stop') await stopBroadcast(ch, 'admin')
      else if (b.action === 'archive-channel') await archiveChannel(ch, { byAdmin: true })
      else if (b.action === 'set-whip') {
        /* توکن فقط وقتی عوض می‌شود که تازه وارد شده یا نشانی پاک شده —
           ویرایشِ نشانی بی‌توکن، توکنِ ذخیره‌شده را پاک نکند */
        const row: Record<string, unknown> = { whip_url: b.whipUrl || null }
        if (!b.whipUrl) row.whip_token_enc = null
        else if (b.whipToken) row.whip_token_enc = seal(b.whipToken)
        const r = await sb().from('live_channels').update(row).eq('id', ch.id)
        if (r.error) {
          if (/whip_url|column|schema cache/i.test(r.error.message)) return NextResponse.json({ message: 'مهاجرتِ ۱۱۵ هنوز اجرا نشده است' }, { status: 503 })
          must(r, 'set whip')
        }
      }
      else await setChannelBlocked(ch, b.action === 'block-channel', 'reason' in b ? b.reason : null, g.actor.id)
    }
    audit({
      actorId: g.actor.id, actorRole: 'admin', action: `LIVE_ADMIN_${b.action.toUpperCase().replace(/-/g, '_')}`,
      entityType: 'live', entityId: 'channelId' in b ? b.channelId : 'clubId' in b ? b.clubId : b.broadcastId,
      /* کلیدِ استریم در لاگِ ممیزی ننشیند */
      /* کلید ممکن است در نشانیِ ورودی هم باشد (rtmp://…/key یا srt://…?streamid=) — فقط میزبان */
      newValue: 'streamKey' in b ? { ...b, streamKey: '***', ingestUrl: hostOf(b.ingestUrl) }
        : b.action === 'set-whip' ? { action: b.action, channelId: b.channelId, whipHost: b.whipUrl ? hostOf(b.whipUrl) : null, token: b.whipToken ? 'set' : 'kept' } : b, ip: clientIp(req) ?? undefined,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof LiveError) return NextResponse.json({ message: e.message }, { status: e.status })
    console.error('[admin/streams] action', e)
    return NextResponse.json({ message: 'انجام نشد' }, { status: 500 })
  }
}
