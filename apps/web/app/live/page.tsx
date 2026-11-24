import type { Metadata } from 'next'
import { NextRequest } from 'next/server'
import { unstable_cache } from 'next/cache'
import LivePage from './LiveHome'
import { GET as listLive } from '@/app/api/live/route'
import { GET as listStreams } from '@/app/api/streams/route'
import type { LiveRow } from './LiveHome'
import type { PublicChannel } from '@/lib/streaming/public-types'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'

/* متادیتای «پخش زنده» — فقط برای خودِ فهرست (/live).
   ⚠️ در page است نه layout: layout به /live/[id] و /live/c/[id] هم ارث
   می‌رسید و هر صفحه‌ی تماشا canonicalِ /live می‌گرفت (همان تله‌ی «canonicalِ
   ارثیِ فهرست» در یادداشت‌های سئو). تا آبانِ ۱۴۰۵ این صفحه هیچ متادیتای
   خودش را نداشت و کپیِ صفحه‌ی اصلی بود. */
const title = 'پخش زنده بیلیارد و اسنوکر | بیلیارد هاب'
const description = 'تماشای زنده‌ی مسابقات و بازی‌های بیلیارد و اسنوکر از باشگاه‌های سراسر ایران، رایگان و بدون ثبت‌نام'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/live' },
  openGraph: { title, description, url: '/live', siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
}

/* ── فهرستِ اول روی سرور (آذرِ ۱۴۰۵) ──
   همان دو درخواستی که صفحه پس از سوارشدن می‌زد — GET /api/live (پخشِ گوشی) و
   GET /api/streams (کانال‌های سرویسِ پخش) — خودِ همان هندلرها، نه کپیِ قاعده‌شان
   (الگوی /shop). بی‌دومی، وقتی فقط کانال زنده بود اولین نقاشی «پخشی نیست» می‌گفت
   و بعد کارت جایش را به شبکه‌ی کانال‌ها می‌داد.
   ۱۵ ثانیه = همان دوره‌ی تازه‌سازیِ مرورگر. هر دو هندلر خطا را خودشان به «خالی»
   می‌برند (همان چیزی که مرورگر هم می‌گرفت)؛ فقط مهلت این‌جا دیده می‌شود ⟵ بیلد:
   null (مرورگر خودش می‌پرسد). اجرا: پرتاب ⟵ نسخه‌ی ISRِ قبلی سرو می‌ماند. */
export const revalidate = 15
const atBuild = process.env.NEXT_PHASE === 'phase-production-build'

type Initial = { rows: LiveRow[]; channels: PublicChannel[] }

/* ⚠️ داخلِ unstable_cache، نه مستقیم: GET فایل‌های جلسه را با fetchِ no-store می‌خواند
   و همان صفحه را داینامیک می‌کرد (هر بازدید = خواندنِ Storage). داخلِ این کش Next آن
   fetch را force-no-store حساب می‌کند بی‌آنکه صفحه داینامیک شود — همان کاری که
   lib/media/home-feed می‌کند. یک کلید ⟵ یک مدخل، نه یکی برای هر نشانیِ ?t= */
const cachedLive = unstable_cache(async (): Promise<Initial> => {
  const [l, c] = await Promise.all([
    listLive(new NextRequest('http://localhost/api/live')).then(r => r.json() as Promise<unknown>),
    listStreams(new NextRequest('http://localhost/api/streams')).then(r => r.json() as Promise<{ channels?: unknown }>),
  ])
  /* ⚠️ فقط ستون‌هایی که کارت نشان می‌دهد. جلسه `ownerKey` دارد که شماره‌ی تلفنِ
     باشگاه‌دار است (lib/auth/ownership: dmKey = phone) — در HTMLِ کش‌شده و خزیدنی
     نباید بنشیند (بازبینی، آذرِ ۱۴۰۵). API همچنان کامل است چون GoLive از آن می‌خواند. */
  const rows: LiveRow[] = (Array.isArray(l) ? l : []).map((s: Record<string, unknown>) => ({
    id: String(s.id ?? ''), title: String(s.title ?? ''), clubName: String(s.clubName ?? ''),
    startedAt: Number(s.startedAt) || 0, lastBeat: Number(s.lastBeat) || 0, viewers: Number(s.viewers) || 0,
  })).filter(s => s.id)
  return { rows, channels: Array.isArray(c.channels) ? (c.channels as PublicChannel[]) : [] }
}, ['live:list:v2'], { revalidate: 15 })

export default async function Page() {
  let initial: Initial | null = null
  try {
    const r = await withTimeout(cachedLive(), 2000)
    if (r === TIMED_OUT) throw new Error('[live] initial list timed out')
    initial = r
  } catch (e) {
    console.error('[live] initial list', e instanceof Error ? e.message : e)
    if (!atBuild) throw e
  }
  return <LivePage initialRows={initial?.rows ?? null} initialChannels={initial?.channels ?? null} />
}
