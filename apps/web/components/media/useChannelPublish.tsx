'use client'

/* ─────────────────────────────────────────────────────────────
   انتشارِ ویدیوی گالری در بیلیارد مدیا.

   ── قرارداد ──
   هر صفحه‌ی نقش این هوک را صدا می‌زند و سه چیز می‌گیرد:
     `gate`    — پنجره‌ای که باید در JSX رندر شود (یا null)
     `ask`     — **پیش از** بازکردنِ انتخابگرِ فایل صدا زده می‌شود
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

   ── ⚠️ چرا `ask` هرگز پیش از تصمیم `await` نمی‌کند ──
   بازکردنِ انتخابگرِ فایل «حرکتِ کاربر» می‌خواهد. سافاری این اجازه را
   فقط در همان تیکِ رویداد (و میکروتسک‌های همان تیک) می‌دهد؛ کروم
   پنجره‌ی چندثانیه‌ای دارد. اگر بینِ کلیک و `input.click()` یک
   درخواستِ شبکه بنشیند، سافاری بی‌هیچ خطایی هیچ کاری نمی‌کند —
   یعنی دکمه‌ی «+» روی آیفون *مرده* می‌شود و بارِ دوم کار می‌کند.

   پس فهرستِ کانال‌ها از پیش خوانده و در `cache` نگه داشته می‌شود، و
   `ask` یا همان لحظه `true` می‌دهد (یعنی «همین حالا باز کن») یا
   پنجره را *بدونِ await* باز می‌کند و قولی می‌دهد که با کلیکِ خودِ
   کاربر داخلِ پنجره حل می‌شود — و آن کلیک، حرکتِ تازه‌ای است.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import ChannelGate, { loadMyChannels } from './ChannelGate'
import { channelKey, servesRole, type ChannelRole, type UserChannel } from '@/lib/media/channel'
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
  /** دسته‌بندیِ انتخابیِ کاربر — محورِ اصلیِ پیداشدن در `/media` */
  category?: string
  /** توضیحِ کاربر — در `VideoObject` و نتیجه‌ی گوگل دیده می‌شود */
  description?: string
}

/** `true` یعنی تصمیم گرفته شد، همین حالا ادامه بده (بدونِ await). */
export type AskResult = true | Promise<void>

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
  /* ⚠️ نسخه‌ی اول فقط *بعد از* آپلود می‌پرسید. یعنی کاربر ۲۵ مگابایت
     ویدیو را روی شبکه‌ی موبایل بالا می‌فرستاد و تازه آن‌وقت پنجره
     می‌آمد — و اگر همان‌جا رها می‌کرد، هزینه‌اش رفته بود. */
  const [asking, setAsking] = useState(false)
  const [suggest, setSuggest] = useState('')
  const [channels, setChannels] = useState<UserChannel[]>([])

  /** انتخابِ *ماندگار* — نقش روی کانال نشست، دفعه‌ی بعد هم نپرس */
  const picked = useRef<UserChannel | null>(null)
  /** انتخابِ همین نشست. ⚠️ اگر مهرِ نقش شکست بخورد `picked` خالی
   *  می‌ماند تا دفعه‌ی *بعد* دوباره بپرسیم — ولی همان ویدیویی که
   *  کاربر همین حالا جوابش را داده نباید دوباره پرسیده شود. */
  const session = useRef<UserChannel | null>(null)
  /* کاربر صریحاً «فعلاً نه» زد — دیگر در همین نشست نپرس.
     ⚠️ فقط همان دکمه این را می‌گذارد؛ بستن با X/Escape/بیرون یعنی
     «الان نه»، نه «هیچ‌وقت» — یک لمسِ اشتباهی نباید انتشار را تا
     پایانِ نشست خاموش کند. */
  const skipped = useRef(false)
  /* فهرستِ کانال‌ها، از پیش خوانده‌شده.
     `undefined` = هنوز نخوانده‌ایم · `null` = خواندن شکست خورد */
  const cache = useRef<UserChannel[] | null | undefined>(undefined)
  const askDone = useRef<(() => void) | null>(null)
  const inFlight = useRef<Promise<void> | null>(null)

  /* ── پیش‌واکشی ──
     بدونِ این، `ask` مجبور بود پیش از تصمیم `await` کند و همان
     چیزی می‌شد که بالا توضیح داده شد. */
  useEffect(() => {
    if (!isOwner || !ownerKey) return
    let alive = true
    /* ⚠️ کلیدِ مالک عوض می‌شود (مثلاً `user.id` تا وقتی `club.ownerId`
       از سرور برسد). بدونِ پاک‌کردن، `ask` با فهرستِ کلیدِ قبلی
       جواب می‌داد. */
    cache.current = undefined
    picked.current = null
    void (async () => {
      const list = await loadMyChannels(ownerKey)
      /* ⚠️ و اگر این خواندنِ کند دیرتر از یک خواندنِ *تازه‌تر* برسد
         (مثلاً بعد از ساختِ کانال)، نباید داده‌ی تازه را خراب کند. */
      if (alive && cache.current === undefined) cache.current = list
    })()
    return () => { alive = false }
  }, [isOwner, ownerKey])

  /* قولِ باز نباید با unmount معلق بماند — وگرنه «+» برای همیشه مرده است */
  useEffect(() => () => { askDone.current?.(); askDone.current = null; inFlight.current = null }, [])

  const settle = useCallback(() => {
    const done = askDone.current
    askDone.current = null
    inFlight.current = null
    done?.()
  }, [])

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
              /* ⚠️ پیش‌تر ثابت `other` و توضیحِ خالی می‌رفت — یعنی هیچ
                 ویدیویی در دسته‌ی درستش پیدا نمی‌شد و `VideoObject`
                 توضیح نداشت. حالا از فرمِ مشخصات می‌آید. */
              category: v.category || 'other', description: v.description ?? '',
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
       دوباره باز می‌شد — تا ابد. */
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

  /* ── پرسشِ پیش از آپلود ──
     ⚠️ **همگام** تصمیم می‌گیرد. `true` یعنی «هیچ پنجره‌ای لازم نیست،
     همین حالا انتخابگرِ فایل را باز کن» — و صدازننده باید در همان
     تیک بازش کند. قولِ برگشتی فقط وقتی است که پنجره باز شده باشد. */
  const ask = useCallback((suggestName = ''): AskResult => {
    if (!isOwner || !ownerKey) return true
    if (picked.current || session.current || skipped.current) return true

    const mine = cache.current
    /* هنوز نخوانده‌ایم یا خواندن شکست خورد ⇒ جلوی کاربر را نگیر.
       مسیرِ بعد از آپلود (`publish`) خودش دوباره می‌پرسد. */
    if (!mine) return true

    const same = mine.find(c => servesRole(c, role))
    if (same) { picked.current = same; return true }

    /* لمسِ دومِ روی «+» نباید قولِ اول را یتیم کند */
    if (inFlight.current) return inFlight.current

    setSuggest(suggestName)
    setChannels(mine)
    const p = new Promise<void>(resolve => { askDone.current = resolve })
    inFlight.current = p
    setAsking(true)
    return p
  }, [ownerKey, isOwner, role])

  const publish = useCallback(async (items: PublishVideo[], suggestName = '') => {
    if (!items.length || !isOwner) return
    /* ⚠️ کلیدِ مالک گاهی از سرور نمی‌آید (ستونِ خالی). سکوت یعنی
       کاربر ویدیو را بالا می‌برد و هرگز نمی‌فهمد در مدیا منتشر نشد. */
    if (!ownerKey) { notify?.('کانالِ شما شناسایی نشد؛ ویدیو فقط در گالری ماند.'); return }
    setSuggest(suggestName)
    /* پیش از آپلود پرسیده شد ⇒ همان انتخاب، حتی اگر مهرِ نقش نگرفت */
    const chosen = picked.current ?? session.current
    if (chosen) { await send(chosen, items, suggestName); return }
    /* پیش از آپلود پرسیده شد و کاربر رد کرد — دوباره نپرس، ولی
       ساکت هم نمان. */
    if (skipped.current) { notify?.('ویدیو فقط در گالری ماند.'); return }

    const mine = await loadMyChannels(ownerKey)
    /* `null` یعنی نتوانستیم بخوانیم — نه «ندارد». پنجره‌ی «کانال
       بساز» در آن حالت دروغ می‌گفت. */
    if (mine === null) { notify?.('فهرست کانال‌ها خوانده نشد؛ ویدیو در گالری هست.'); return }
    cache.current = mine

    const same = mine.find(c => servesRole(c, role))
    if (same) { picked.current = same; await send(same, items, suggestName); return }

    setChannels(mine)
    setPending(items)
  }, [ownerKey, isOwner, role, send, notify])

  /* «فعلاً نه» — تصمیمِ صریحِ کاربر */
  const onSkip = useCallback(() => {
    skipped.current = true
    setPending(null); setAsking(false)
    settle()
  }, [settle])

  /* X / Escape / کلیکِ بیرون — «الان نه»، نه «هیچ‌وقت» */
  const onClose = useCallback(() => {
    setPending(null); setAsking(false)
    settle()
  }, [settle])

  const gate = (pending || asking)
    ? (
      <ChannelGate
        role={role}
        suggestName={suggest}
        when={pending ? 'after' : 'before'}
        channels={channels}
        onPick={c => {
          /* ⚠️ **همگام**. اول قول را حل کن تا انتخابگرِ فایل در همان
             میکروتسکِ کلیکِ کاربر باز شود؛ کارِ شبکه‌ای بعد از آن.
             نسخه‌ی قبل اول `await stampRole` می‌کرد — یعنی هم
             انتخابگر دیر باز می‌شد، هم یک throw قول را برای همیشه
             معلق می‌گذاشت و «+» می‌مرد. */
          const q = pending
          setPending(null); setAsking(false)
          session.current = c
          picked.current = c
          if (cache.current && !cache.current.some(x => channelKey(x) === channelKey(c))) {
            cache.current = [...cache.current, c]
          }
          settle()
          /* ⚠️ گیرنده‌ی پایانی لازم است: `send` پیامش را بیرونِ try
             می‌دهد و هر throwِ آینده اینجا یک rejectionِ بی‌صاحب
             می‌شد — کاربری که ویدیویش را بالا برده، هیچ نمی‌دید. */
          void (async () => {
            const st = await stampRole(c)
            /* اگر مهرِ نقش نگرفت، انتخاب را *ماندگار* نکن تا دفعه‌ی
               بعد دوباره بپرسیم — ولی `session` می‌ماند، وگرنه همین
               ویدیو دوبار پرسیده می‌شد. */
            session.current = st.c
            picked.current = st.ok ? st.c : null
            if (q) await send(st.c, q, suggest)
          })().catch(() => notify?.('انتشار در بیلیارد مدیا انجام نشد؛ ویدیو در گالری هست.'))
        }}
        onSkip={onSkip}
        onClose={onClose}
      />
    )
    : null

  return { gate, ask, publish }
}
