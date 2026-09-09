'use client'

/* ─────────────────────────────────────────────────────────────
   ویرایش درجا روی صفحه‌ی عمومی پروفایل.

   ── چرا ──
   تا امروز افزودن عکس یا ویدیو یعنی: رفتن به داشبورد آن نقش،
   آپلود، ذخیره، برگشتن به صفحه‌ی عمومی برای دیدن نتیجه. برای یک
   عکس هم همین چرخه. حالا صاحب پروفایل همان‌جا که نگاه می‌کند
   اضافه و حذف می‌کند.

   ── چه کسی می‌بیند ──
   فقط صاحب پروفایل. `ownerId` ستون خود ردیف است و از سرور می‌آید،
   پس با دستکاری مرورگر جعل نمی‌شود؛ و مسیر ذخیره هم روی سرور
   دوباره مالکیت را می‌سنجد (`saveProfile` «یکی به‌ازای هر مالک» است).
   این تشخیص فقط برای *نشان‌دادن* دکمه است، نه برای اجازه‌دادن.

   ── چرا کل پروفایل ذخیره می‌شود ──
   `POST /api/profiles/[kind]` کل `data` را جایگزین می‌کند. پس
   نسخه‌ی تازه‌ی همان چیزی که صفحه دارد فرستاده می‌شود، با یک فیلد
   عوض‌شده. هیچ مسیر «patch جزئی» برای پروفایل وجود ندارد و ساختنش
   برای این کار، سطح حمله‌ی تازه‌ای باز می‌کرد.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { saveProfileRemote, type ProfileKind } from './client'
import { useAuthStore } from '../../store/auth.store'
import { apiFetch, csrfToken } from '../http'

export interface OwnerEdit<T> {
  /** دکمه‌های ویرایش فقط وقتی دیده می‌شوند که این درست باشد */
  isOwner: boolean
  /** در حال ذخیره — دکمه‌ها باید غیرفعال شوند */
  saving: boolean
  /** پیام خطا؛ خالی یعنی مشکلی نبود */
  error: string
  /** یک تغییر روی پروفایل و ذخیره‌ی آن روی سرور */
  apply: (mutate: (draft: T) => T) => Promise<boolean>
}

/* قید `Record<string, unknown>` برداشته شد: تایپ‌های پروفایل
   اینترفیس‌اند و ایندکس‌سیگنچر ندارند. تبدیل در همان یک نقطه‌ی
   ارسال انجام می‌شود. */
type MyRow = { slug?: string; ownerId?: string } | null

/* ── یک پرسش به‌ازای هر نقش در هر تب ──
   پاسخ «ردیف من از این نوع» تا وقتی نشست عوض نشده ثابت است، ولی
   بدون کش هر بار که کاربر واردشده پروفایل *کس دیگری* را باز کند
   یک درخواست تازه می‌رفت. مخاطب این سایت موبایل ایرانی است؛ یک
   درخواست اضافه در هر صفحه بی‌هزینه نیست.

   کلید مقدار کوکی CSRF را هم دارد: با ورود یا خروج آن عوض می‌شود،
   پس کش حساب قبلی خودبه‌خود بی‌اعتبار می‌شود. */
const myRowCache = new Map<string, MyRow>()

export function useOwnerEdit<T>(
  kind: ProfileKind,
  slug: string,
  profile: T | null,
  ownerId: string | null,
  onSaved: (next: T) => void,
  /* پرچم سرور. `undefined` یعنی هنوز نیامده و به مقایسه‌ی مرورگر
     تکیه می‌شود؛ `true`/`false` قطعی است. */
  serverSaysMine?: boolean,
): OwnerEdit<T> {
  const { user } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  /* ── دو نشانه، با «یا» نه «??» ──
     ⚠️ نسخه‌ی قبلی `serverSaysMine ?? clientCheck` بود و این خودش یک
     باگ ساخت: توکن دسترسی ۱۵ دقیقه عمر دارد و این مسیر GET عمومی
     است، پس با توکن منقضی ۴۰۱ نمی‌دهد — فقط بی‌صدا «مهمان» حساب
     می‌شود و `isMine:false` برمی‌گرداند. آن `false` با `??` قطعی
     می‌شد و مقایسه‌ی محلی را هم خفه می‌کرد.

     حالا هر کدام کافی است. اجازه‌ی واقعی همچنان روی سرور سنجیده
     می‌شود، پس نشان‌دادن خوش‌بینانه‌ی دکمه چیزی را باز نمی‌کند. */
  const localSaysMine = !!user?.id && !!ownerId && user.id === ownerId

  /* ── نشانه‌ی سوم: پرسش مستقیم از سرور ──
     دو نشانه‌ی بالا هر دو می‌توانند دروغ *منفی* بگویند و دقیقا همین
     شد: روی موبایل دکمه‌ها می‌آمدند و روی دسکتاپ نه، با یک حساب.

     • پرچم سرور روی این GET عمومی با توکن منقضی `false` می‌شود؛
       این مسیر ۴۰۱ نمی‌دهد، پس بی‌صدا «مهمان» حساب می‌شوی. تب
       دسکتاپ که ساعت‌ها باز مانده دقیقا همین حالت است.
     • مقایسه‌ی مرورگر به شناسه‌ی ذخیره‌شده در localStorage تکیه دارد
       که می‌تواند کهنه یا از حساب دیگری باشد.

     `?mine=1` مسیر محافظت‌شده است: با ۴۰۱ خود `apiFetch` نشست را
     تازه می‌کند و دوباره می‌پرسد. پس این پاسخ قطعی است. */
  const probeKey = `${kind}|${slug}|${ownerId ?? ''}`
  /* مقدار کوکی نشست هم بخشی از کلید است: با ورود، خروج، یا چرخش
     دوازده‌ساعته عوض می‌شود و پاسخ نشست قبلی باید کنار برود. فقط
     در وابستگی‌ها استفاده می‌شود، نه در رندر — پس ناهماهنگی SSR
     نمی‌سازد. */
  const sessKey = typeof document === 'undefined' ? '' : (csrfToken() ?? '')

  /* ⚠️ نتیجه با کلیدش نگه داشته می‌شود، نه لخت. مسیر App Router
     همین یک نمونه‌ی کامپوننت را بین `/coaches/ali` و `/coaches/reza`
     نگه می‌دارد؛ با یک بولین ساده، «مال من است» به صفحه‌ی نفر بعدی
     نشت می‌کرد و «مال من نیست» روی صفحه‌ی خودم قفل می‌شد. */
  const [probe, setProbe] = useState<{ key: string; mine: boolean } | null>(null)
  /* یک تلاش دوباره برای قطعی گذرا. بدون این شمارنده، آزادکردن
     `asked` هیچ رندری نمی‌سازد و افکت دیگر اجرا نمی‌شود — یعنی
     «قابل تلاش دوباره» فقط روی کاغذ بود. */
  const [retry, setRetry] = useState(0)
  const asked = useRef<string | null>(null)

  useEffect(() => {
    if (serverSaysMine === true || localSaysMine) return
    /* گارد «آیا اصلا نشستی هست» از کوکی CSRF خوانده می‌شود، نه از
       استور zustand: همان استور می‌تواند پاک یا کهنه باشد — و در
       دستگاهی که این باگ را نشان می‌داد دقیقا همان مشکوک است. */
    if (!ownerId || !csrfToken()) return
    /* یک پرسش به‌ازای هر کلید. `ref` است نه state، تا دو رندر پشت هم
       (و اجرای دوباره‌ی افکت در حالت سخت‌گیر) دو درخواست نسازند. */
    if (asked.current === `${probeKey}|${sessKey}`) return

    /* کلید کش هنگام *نوشتن* دوباره خوانده می‌شود: `apiFetch` ممکن
       است وسط کار نشست را تازه کند و کوکی عوض شود. */
    const cacheKeyNow = () => `${kind}|${csrfToken() ?? ''}`
    const matches = (row: MyRow) => !!row && row.slug === slug && row.ownerId === ownerId
    const cached = cacheKeyNow()
    if (myRowCache.has(cached)) {
      asked.current = `${probeKey}|${sessKey}`
      setProbe({ key: probeKey, mine: matches(myRowCache.get(cached) ?? null) })
      return
    }
    asked.current = `${probeKey}|${sessKey}`

    const ac = new AbortController()
    let settled = false
    void (async () => {
      const r = await apiFetch(`/api/profiles/${kind}?mine=1`, { cache: 'no-store', signal: ac.signal }).catch(() => null)
      if (ac.signal.aborted) return
      /* شبکه نرسید: این «مال تو نیست» نیست. کلید آزاد می‌شود تا
         تلاش بعدی ممکن باشد، وگرنه یک قطعی گذرا دکمه‌ها را تا
         بارگذاری کامل پنهان می‌کرد. */
      /* شبکه نرسید: این «مال تو نیست» نیست. یک‌بار دوباره تلاش
         می‌شود؛ بیشتر نه، وگرنه مرورگر آفلاین حلقه می‌زند. */
      if (!r) { asked.current = null; if (retry < 1) setRetry(n => n + 1); return }
      /* ۴۰۱ هم کش می‌شود: نشست باطل با هر بازدید دو درخواست
         می‌ساخت (یکی خودش، یکی تلاش تمدید). با ورود دوباره کوکی
         CSRF عوض می‌شود و کلید هم عوض. */
      if (!r.ok) { settled = true; myRowCache.set(cacheKeyNow(), null); setProbe({ key: probeKey, mine: false }); return }
      const j = await r.json().catch(() => null) as { profile?: MyRow } | null
      if (ac.signal.aborted) return
      settled = true
      myRowCache.set(cacheKeyNow(), j?.profile ?? null)
      /* هر دو باید بخوانند. با «یا»، صفحه‌ای که از حافظه‌ی محلی رندر
         شده و نامکش کهنه است می‌توانست ذخیره را روی ردیف زنده
         بنشاند و نامش را عقب برگرداند. */
      setProbe({ key: probeKey, mine: matches(j?.profile ?? null) })
    })()
    return () => {
      ac.abort()
      if (!settled && asked.current === `${probeKey}|${sessKey}`) asked.current = null
    }
  }, [serverSaysMine, localSaysMine, ownerId, probeKey, sessKey, kind, slug, retry])

  const probeSaysMine = probe?.key === probeKey ? probe.mine : null

  const isOwner = serverSaysMine === true || localSaysMine || probeSaysMine === true

  /* ── چرا `ref` و نه خود prop ──
     ⚠️ چند ذخیره‌ی پشت سر هم (مثلا سه ویدیو در یک انتخاب، یا یک
     انتخاب ترکیبی عکس+ویدیو) همگی همین یک `apply` را صدا می‌زنند و
     آن، پروفایل لحظه‌ی *رندر* را می‌بندد. مسیر ذخیره کل `data` را
     جایگزین می‌کند، پس ذخیره‌ی دوم روی نسخه‌ای می‌نشست که ذخیره‌ی اول
     را ندیده بود: عکس‌ها بالا می‌رفتند و ذخیره‌ی بعدی پاکشان می‌کرد و
     فایلشان در Storage یتیم می‌ماند.

     `latest` همیشه آخرین نسخه‌ی تأییدشده را دارد و بلافاصله بعد از هر
     ذخیره‌ی موفق به‌روز می‌شود — نه یک رندر بعد. `busy` هم به همین
     دلیل `ref` است: مقدار state در بسته‌ی قدیمی همیشه `false` بود و
     گارد هم‌زمانی عملا کار نمی‌کرد. */
  const latest = useRef<T | null>(profile)
  const busyRef = useRef(false)
  useEffect(() => { latest.current = profile }, [profile])

  const apply = useCallback(async (mutate: (draft: T) => T) => {
    const base = latest.current ?? profile
    if (!base || !isOwner || busyRef.current) return false
    busyRef.current = true
    setSaving(true); setError('')
    const next = mutate(base)
    try {
      const res = await saveProfileRemote(kind, slug, next as unknown as Record<string, unknown>)
      if (!res.ok) { setError(res.message ?? 'ذخیره روی سرور انجام نشد'); return false }

      /* ── ردیف برگشتی باید همین پروفایل باشد ──
         نشانه‌ی مرورگر خوش‌بینانه است: اگر کوکی نشست و کاربر ذخیره‌شده
         یکی نباشند، دکمه دیده می‌شود ولی سرور ردیف *مالک کوکی* را
         برمی‌دارد (`saveProfile` یکی‌به‌ازای‌هر‌مالک است). آن‌وقت نوشتن
         پاسخ روی این صفحه یعنی نمایش پروفایل یک حساب دیگر. */
      if (res.profile && ownerId && res.profile.ownerId !== ownerId) {
        setError('نشست شما با این حساب یکی نیست؛ یک‌بار خارج و دوباره وارد شوید')
        return false
      }

      /* پاسخ سرور نشانی Storage را جای data:URL گذاشته — همان را
         می‌نشانیم، وگرنه صفحه تا بازخوانی بعدی base64 نگه می‌دارد. */
      const saved = (res.profile?.data as T) ?? next
      latest.current = saved
      onSaved(saved)
      return true
    } catch {
      setError('ارتباط با سرور برقرار نشد')
      return false
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }, [profile, isOwner, kind, slug, onSaved, ownerId])

  return { isOwner, saving, error, apply }
}
