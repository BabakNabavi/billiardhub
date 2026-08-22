'use client'

/* ─────────────────────────────────────────────────────────────
   انتشارِ ویدیوی گالری در بیلیارد مدیا.

   ── قرارداد ──
   هر صفحه‌ی نقش این هوک را صدا می‌زند و دو چیز می‌گیرد:
     `gate`    — پنجره‌ای که باید در JSX رندر شود (یا null)
     `publish` — بعد از هر آپلودِ *موفق* در گالری صدا زده می‌شود

   ── جریان ──
   ۱) کانالی که این نقش را دارد ⇒ بی‌سروصدا منتشر می‌شود
   ۲) کانال دارد ولی این نقش را ندارد ⇒ پنجره: کدام کانال؟ یا تازه بساز
   ۳) هیچ کانالی ندارد ⇒ پنجره: کانال بساز

   ⚠️ انتشار در مدیا **اختیاری** است و هرگز آپلودِ گالری را باطل
   نمی‌کند. اگر کاربر پنجره را ببندد، ویدیو در گالریِ پروفایل می‌ماند.

   ⚠️ ولی «اختیاری» یعنی *کاربر* بگوید نه — نه اینکه شکست ساکت بماند.
   نسخه‌ی اول پاسخِ سرور را نمی‌خواند و چون `apiFetch` روی ۴۰۰ خطا
   پرت نمی‌کند، هر ردی بی‌صدا می‌افتاد. بدترینش: سرور عنوانی که شکلِ
   نامِ فایل دارد را رد می‌کند و `IMG_1234` — نامِ پیش‌فرضِ آیفون —
   دقیقاً همان است. یعنی محتمل‌ترین آپلودِ واقعی، خاموش شکست می‌خورد.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useRef, useState } from 'react'
import ChannelGate, { loadMyChannels } from './ChannelGate'
import { servesRole, type ChannelRole, type UserChannel } from '@/lib/media/channel'
import { apiFetch } from '@/lib/http'
import './channel-gate.css'

export interface PublishVideo {
  title: string
  src: string
  thumb?: string
  durationSec?: number
  /** فقط باشگاه: بدونِ این، `videos.club_id` تهی می‌ماند و ویدیو در
   *  فیلترِ `GET /api/media?club=` دیده نمی‌شود. */
  clubId?: string
}


/* ⚠️ سرور عنوانی که شکلِ نامِ فایل دارد را رد می‌کند (و حق دارد:
   «IMG_1234» برای بیننده و موتورِ جست‌وجو بی‌ارزش است). پس همان‌جا
   که می‌شناسیمش، عنوانِ معنادار می‌سازیم. */
const FILE_LIKE = /^[\w-]+\.(mp4|mov|webm|avi|mkv)$/i
const GENERIC = /^(img|vid|video|movie|mvi|dsc|pxl)[_-]?\d+$/i
const goodTitle = (raw: string, owner: string, i: number) => {
  const t = raw.trim()
  if (t && !FILE_LIKE.test(t) && !GENERIC.test(t)) return t.slice(0, 160)
  const base = owner.trim() || 'بیلیارد هاب'
  return (i > 0 ? `${base} — ویدیو ${i + 1}` : `${base} — ویدیو`).slice(0, 160)
}

export function useChannelPublish(
  role: ChannelRole,
  ownerKey: string | undefined,
  /** فقط صاحبِ پروفایل حق انتشار دارد */
  isOwner: boolean,
  /** پیام‌رسانِ خودِ صفحه — شکست نباید بی‌صدا بماند */
  notify?: (msg: string) => void,
) {
  const [pending, setPending] = useState<PublishVideo[] | null>(null)
  const [suggest, setSuggest] = useState('')
  const [channels, setChannels] = useState<UserChannel[]>([])
  const picked = useRef<UserChannel | null>(null)

  const send = useCallback(async (c: UserChannel, items: PublishVideo[], owner: string) => {
    let done = 0
    const errs: string[] = []
    for (const [i, v] of items.entries()) {
      try {
        const r = await apiFetch('/api/media', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video: {
              title: goodTitle(v.title, owner, i), src: v.src, thumb: v.thumb ?? '',
              category: 'other', description: '',
              creatorName: c.name, creatorHandle: c.handle,
              ...(v.durationSec ? { durationSec: v.durationSec } : {}),
              ...(v.clubId ? { clubId: v.clubId } : {}),
            },
          }),
        })
        if (r.ok) { done++; continue }
        const j = await r.json().catch(() => ({})) as { message?: string }
        errs.push(j.message ?? `خطای ${r.status}`)
      } catch { errs.push('ارتباط با سرور برقرار نشد') }
    }
    if (notify) {
      if (errs.length) notify(`انتشار در بیلیارد مدیا انجام نشد: ${[...new Set(errs)].join('، ')} — ویدیو در گالری هست.`)
      else if (done) notify(`${done === 1 ? 'ویدیو' : `${done} ویدیو`} در کانال «${c.name}» منتشر شد.`)
    }
  }, [notify])

  /* ⚠️ انتخابِ کانال باید *ماندگار* شود. نسخه‌ی اول فقط در حافظه‌ی
     همین کامپوننت نگهش می‌داشت، پس دفعه‌ی بعد پنجره دوباره باز
     می‌شد — تا ابد، برای کاربری که یک‌بار جواب داده بود. */
  const stampRole = useCallback(async (c: UserChannel) => {
    if (servesRole(c, role)) return { c, ok: true }
    /* ⚠️ نسخه‌ی اول `r.ok` را نمی‌خواند: ۴۰۴/۴۰۹/۴۰۰ همه بی‌صدا
       «موفق» شمرده می‌شدند، نقش ذخیره نمی‌شد، و پنجره دفعه‌ی بعد
       دوباره باز می‌شد — تا ابد. دقیقاً همان چیزی که این تابع
       قرار بود درستش کند. */
    const miss = () => { notify?.('کانال به این نقش وصل نشد؛ دفعه‌ی بعد دوباره پرسیده می‌شود.'); return { c, ok: false } }
    try {
      /* نام و هندل عمداً فرستاده نمی‌شوند: نسخه‌ی کشِ این صفحه ممکن
         است کهنه باشد و نامی را که در تبِ دیگر عوض شده برگرداند. */
      const r = await apiFetch('/api/media/channel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, addRole: role }),
      })
      const j = await r.json().catch(() => ({})) as { channel?: UserChannel }
      if (!r.ok || !j?.channel) return miss()
      return { c: j.channel, ok: true }
    } catch { return miss() }
  }, [role, notify])

  const publish = useCallback(async (items: PublishVideo[], suggestName = '') => {
    if (!items.length || !isOwner) return
    /* ⚠️ کلیدِ مالک گاهی از سرور نمی‌آید (ستونِ خالی). سکوت یعنی
       کاربر ویدیو را بالا می‌برد و هرگز نمی‌فهمد در مدیا منتشر نشد. */
    if (!ownerKey) { notify?.('کانالِ شما شناسایی نشد؛ ویدیو فقط در گالری ماند.'); return }
    setSuggest(suggestName)
    if (picked.current) { await send(picked.current, items, suggestName); return }

    const mine = await loadMyChannels(ownerKey)
    /* `null` یعنی نتوانستیم بخوانیم — نه «ندارد». پنجره‌ی «کانال
       بساز» در آن حالت دروغ می‌گفت. */
    if (mine === null) { notify?.('فهرست کانال‌ها خوانده نشد؛ ویدیو در گالری هست.'); return }

    const same = mine.find(c => servesRole(c, role))
    if (same) { picked.current = same; await send(same, items, suggestName); return }

    setChannels(mine)
    setPending(items)
  }, [ownerKey, isOwner, role, send, notify])

  const gate = pending
    ? (
      <ChannelGate
        role={role}
        suggestName={suggest}
        channels={channels}
        onPick={async c => {
          const q = pending
          setPending(null)
          const st = await stampRole(c)
          /* ⚠️ اگر مهرِ نقش نگرفت، انتخاب را *ماندگار* نکن — وگرنه
             پیامِ «دفعه‌ی بعد دوباره پرسیده می‌شود» دروغ می‌شود و
             پنجره تا پایانِ نشست دیگر باز نمی‌شود. */
          if (st.ok) picked.current = st.c
          await send(st.c, q, suggest)
        }}
        onClose={() => setPending(null)}
      />
    )
    : null

  return { gate, publish }
}
