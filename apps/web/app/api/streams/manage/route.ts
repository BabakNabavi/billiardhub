export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { actorOf, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership'
import { can } from '@/lib/admin/permissions'
import { audit, clientIp, ownsClub as isClubOwner, sb } from '@/lib/finance/db'
import { getStreamProvider } from '@/lib/streaming'
import { channelLimitOf, summarize } from '@/lib/streaming/policy'
import { LiveError, broadcastsOf, channelById, clubChannels, clubSettings, tablesReady } from '@/lib/streaming/repo'
import { open } from '@/lib/streaming/secret'
import {
  archiveChannel, createChannel, rotateKey, startBroadcast, stopBroadcast, updateChannel,
} from '@/lib/streaming/service'
import { countOf } from '@/lib/streaming/viewers'

/* ─────────────────────────────────────────────────────────────
   مدیریتِ کانال‌های پخشِ یک باشگاه — فقط مالکِ همان باشگاه (یا ادمین).
   GET  ?clubId=          کانال‌ها + نشانیِ ارسال و کلیدِ استریم
   POST { action, ... }   create | update | start | stop | rotate-key | archive
   ───────────────────────────────────────────────────────────── */

const NO_STORE = { 'Cache-Control': 'no-store' }
const uuid = z.string().uuid()
const title = z.string().trim().min(2).max(90)

const Action = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'), clubId: uuid, kind: z.enum(['club', 'table', 'tournament']),
    title, tableLabel: z.string().trim().max(40).optional(), tournamentId: uuid.optional(),
    access: z.enum(['public', 'members']).default('public'), record: z.boolean().default(true),
  }),
  z.object({
    action: z.literal('update'), clubId: uuid, channelId: uuid, title: title.optional(),
    tableLabel: z.string().trim().max(40).nullable().optional(),
    access: z.enum(['public', 'members']).optional(), record: z.boolean().optional(),
  }),
  z.object({ action: z.literal('start'), clubId: uuid, channelId: uuid, title: z.string().trim().max(120).optional() }),
  z.object({ action: z.enum(['stop', 'rotate-key', 'archive']), clubId: uuid, channelId: uuid }),
])

/* فقط **مالکِ واقعیِ** باشگاه (clubs.ownerId) — کلیدِ استریم مالِ اوست.
   ادمین فقط با دسترسیِ «live» وارد می‌شود و کلید را نمی‌بیند (owner: false). */
async function guard(req: NextRequest, clubId: string) {
  const actor = await actorOf(req)
  if (!actor) return { res: NextResponse.json(UNAUTHENTICATED, { status: 401 }) }
  const owner = await isClubOwner(actor.id, clubId)
  if (!owner && !(actor.isAdmin && await can(actor.id, 'live'))) {
    return { res: NextResponse.json(FORBIDDEN, { status: 403 }) }
  }
  return { actor, owner }
}

const fail = (e: unknown) => {
  if (e instanceof LiveError) return NextResponse.json({ message: e.message }, { status: e.status })
  console.error('[streams/manage]', e)
  return NextResponse.json({ message: 'انجام نشد؛ دوباره تلاش کنید' }, { status: 500 })
}

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get('clubId') ?? ''
  if (!uuid.safeParse(clubId).success) return NextResponse.json({ message: 'باشگاه نامعتبر' }, { status: 400 })
  const g = await guard(req, clubId)
  if ('res' in g) return g.res
  const provider = getStreamProvider()
  if (!(await tablesReady())) return NextResponse.json({ ready: false, connected: !!provider }, { headers: NO_STORE })

  try {
    const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const [settings, channels, tourns] = await Promise.all([
      clubSettings(clubId), clubChannels(clubId),
      sb().from('tournaments').select('id,title,status,starts_at').eq('club_id', clubId)
        .not('status', 'in', '(cancelled,completed,draft)').order('starts_at', { ascending: false }).limit(30),
    ])
    const past = await broadcastsOf(channels.map(c => c.id), monthAgo)
    return NextResponse.json({
      ready: true, connected: !!provider, settings, limit: channelLimitOf(settings),
      month: summarize(past),
      tournaments: tourns.data ?? [],
      channels: channels.map(c => {
        const key = open(c.streamKeyEnc)
        return {
          id: c.id, kind: c.kind, title: c.title, tableLabel: c.tableLabel, tournamentId: c.tournamentId,
          access: c.access, record: c.record, isLive: c.isLive, adminBlocked: c.adminBlocked,
          blockReason: c.blockReason, ingestUrl: c.ingestUrl, streamKey: g.owner ? key : null, createdAt: c.createdAt,
          viewers: c.isLive ? countOf(c.id) : 0,
          month: summarize(past.filter(b => b.channelId === c.id)),
        }
      }),
    }, { headers: NO_STORE })
  } catch (e) { return fail(e) }
}

export async function POST(req: NextRequest) {
  const parsed = Action.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ message: 'اطلاعاتِ فرم کامل یا معتبر نیست' }, { status: 400 })
  const b = parsed.data
  const g = await guard(req, b.clubId)
  if ('res' in g) return g.res
  if (!(await tablesReady())) return NextResponse.json({ message: 'پخش زنده هنوز راه‌اندازی نشده است' }, { status: 503 })

  try {
    let entityId: string
    if (b.action === 'create') {
      const ch = await createChannel({ ...b, actorId: g.actor.id })
      entityId = ch.id
    } else {
      const ch = await channelById(b.channelId)
      /* کانالِ باشگاهِ دیگر = «یافت نشد»، نه «ممنوع» — وجودش لو نرود */
      if (!ch || ch.clubId !== b.clubId || ch.archivedAt) return NextResponse.json({ message: 'کانال یافت نشد' }, { status: 404 })
      entityId = ch.id
      if (b.action === 'update') await updateChannel(ch, b)
      else if (b.action === 'start') await startBroadcast(ch, g.actor.id, b.title)
      else if (b.action === 'stop') await stopBroadcast(ch, 'owner')
      else if (b.action === 'rotate-key') {
        /* کلید مالِ مالک است؛ ادمین برای قطعِ دسترسی «مسدود» دارد */
        if (!g.owner) return NextResponse.json(FORBIDDEN, { status: 403 })
        await rotateKey(ch)
      }
      else await archiveChannel(ch)
    }
    audit({
      actorId: g.actor.id, actorRole: g.actor.role, action: `LIVE_${b.action.toUpperCase().replace('-', '_')}`,
      entityType: 'live_channel', entityId, newValue: { clubId: b.clubId }, ip: clientIp(req) ?? undefined,
    })
    return NextResponse.json({ ok: true, id: entityId })
  } catch (e) { return fail(e) }
}
