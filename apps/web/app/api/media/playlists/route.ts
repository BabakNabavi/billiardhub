export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
/* ⚠️ `actorOf` نه `actorFromRequest`: دومی فقط `{id, role}`
   می‌دهد، ولی `myChannelHandles` با `dmKey` (که برای این پلتفرم
   شماره‌محور تقریبا همیشه شماره‌ی موبایل است) کلید می‌خورد. با
   `actorFromRequest` این تابع برای *هر* مالک واقعی فهرست خالی
   برمی‌گرداند — یعنی فرم ساخت هرگز نمی‌آمد و هر نوشتنی ۴۰۳
   می‌شد. مسیر انتشار ویدیو هم همین `actorOf` را می‌دهد. */
import { actorOf } from '@/lib/auth/ownership'
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit'
import { myChannelHandles } from '@/lib/media/server'
import {
  channelPlaylists, playlistBySlug, createPlaylist, playlistHandle,
  addToPlaylist, removeFromPlaylist, deletePlaylist,
} from '@/lib/media/playlists'
import { videoIdBySlug } from '@/lib/media/social'

/* ─────────────────────────────────────────────────────────────
   لیست‌های پخش.

   ⚠️ اجازه‌ی نوشتن از مالکیت *کانال* می‌آید، نه از `owner_id` ردیف:
   کاربر می‌تواند چند کانال داشته باشد و `myChannelHandles` همان
   بررسی‌ای است که مسیر انتشار ویدیو هم انجام می‌دهد. بدون آن، هر
   کاربر واردشده می‌توانست در لیست کانال دیگری دست ببرد.

   ⚠️ اعتبارسنجی دستی است (Zod وابستگی این اپ نیست): هر ورودی سقف
   طول دارد و `action` از فهرست بسته می‌آید.
   ───────────────────────────────────────────────────────────── */

const ACTIONS = ['create', 'add', 'remove', 'delete'] as const
type Action = typeof ACTIONS[number]

const s = (v: unknown, max: number) =>
  (typeof v === 'string' ? v : '').trim().slice(0, max)

export async function GET(req: NextRequest) {
  const u = new URL(req.url)

  const slug = s(u.searchParams.get('slug'), 120)
  if (slug) {
    const p = await playlistBySlug(slug)
    if (!p) return NextResponse.json({ message: 'لیست پیدا نشد' }, { status: 404 })
    return NextResponse.json({ playlist: p })
  }

  const handle = s(u.searchParams.get('channel'), 30)
  if (!handle) return NextResponse.json({ message: 'پارامتر لازم است' }, { status: 400 })

  /* ⚠️ مالکیت را سرور تصمیم می‌گیرد و به رابط *می‌گوید*. کلاینت راهی
     برای دانستنش ندارد و حدس‌زدنش یعنی فرم ساخت روی کانال دیگران. */
  const actor = await actorOf(req).catch(() => null)
  const canEdit = actor
    ? (await myChannelHandles(actor)).includes(handle.toLowerCase())
    : false

  const r = await channelPlaylists(handle)
  return NextResponse.json({ ...r, canEdit })
}

export async function POST(req: NextRequest) {
  const actor = await actorOf(req).catch(() => null)
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 })

  const b = await req.json().catch(() => ({})) as Record<string, unknown>
  const action = s(b.action, 20) as Action
  if (!(ACTIONS as readonly string[]).includes(action)) {
    return NextResponse.json({ message: 'کنش نامعتبر' }, { status: 400 })
  }

  /* ⚠️ ساخت و افزودن یک بودجه نداشته باشند: پرکردن یک لیست
     چهل‌ویدیویی کل سهمیه را می‌سوزاند. */
  const rl = action === 'create'
    ? await hitRateLimit(req, { action: 'media_playlist_new', max: 10, windowSec: 600 }, actor.id)
    : await hitRateLimit(req, { action: 'media_playlist', max: 120, windowSec: 600 }, actor.id)
  if (!rl.ok) return tooMany(rl.retryAfterSec)

  const mine = await myChannelHandles(actor)

  if (action === 'create') {
    const handle = s(b.channel, 30).toLowerCase()
    if (!mine.includes(handle)) {
      return NextResponse.json({ message: 'این کانال متعلق به شما نیست' }, { status: 403 })
    }
    const r = await createPlaylist({
      handle, ownerId: actor.id,
      title: s(b.title, 120), description: s(b.description, 1000),
    })
    if (r.kind === 'unavailable') return NextResponse.json({ message: 'این قابلیت هنوز فعال نیست' }, { status: 503 })
    if (r.kind === 'error') return NextResponse.json({ message: r.message }, { status: 400 })
    return NextResponse.json({ slug: r.slug }, { status: 201 })
  }

  /* بقیه‌ی کنش‌ها روی یک لیست موجودند */
  const plSlug = s(b.playlist, 120)
  const pl = plSlug ? await playlistHandle(plSlug) : null
  if (!pl) return NextResponse.json({ message: 'لیست پیدا نشد' }, { status: 404 })
  if (!mine.includes(pl.handle)) {
    return NextResponse.json({ message: 'این لیست متعلق به شما نیست' }, { status: 403 })
  }

  if (action === 'delete') {
    const ok = await deletePlaylist(pl.id)
    return NextResponse.json({ ok }, { status: ok ? 200 : 500 })
  }

  const videoSlug = s(b.video, 120)
  const videoId = videoSlug ? await videoIdBySlug(videoSlug) : null
  if (!videoId) return NextResponse.json({ message: 'ویدیو پیدا نشد' }, { status: 404 })

  if (action === 'add') {
    const r = await addToPlaylist(pl.id, videoId)
    if (r.kind === 'unavailable') return NextResponse.json({ message: 'این قابلیت هنوز فعال نیست' }, { status: 503 })
    if (r.kind === 'error') return NextResponse.json({ message: r.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  /* action === 'remove' */
  const ok = await removeFromPlaylist(pl.id, videoId)
  return NextResponse.json({ ok }, { status: ok ? 200 : 500 })
}
