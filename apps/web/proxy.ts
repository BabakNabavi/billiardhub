/* ─────────────────────────────────────────────────────────────
   محافظتِ سمتِ سرور — پیش از آنکه صفحه‌ای رندر شود.

   تا امروز محافظت فقط سمتِ کلاینت بود: HTMLِ پنلِ ادمین برای همه سرو
   می‌شد و بعد جاوااسکریپت ریدایرکت می‌کرد. داده امن بود (APIها چک
   می‌کنند) ولی خودِ صفحه نه.

   دو کار می‌کند:
     ۱) مسیرهای محافظت‌شده بدونِ نشستِ معتبر باز نمی‌شوند
     ۲) درخواست‌های تغییردهنده‌ی /api از دامنه‌ی بیگانه رد می‌شوند (CSRF)

   روی Edge اجرا می‌شود ⇒ فقط jose، هیچ ماژولِ نودی.
   ───────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { verifyEdge } from './lib/auth/edge'
import {
  ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE, CSRF_HEADER,
  PROTECTED_PREFIXES, ADMIN_PREFIXES,
} from './lib/auth/constants'

/* مسیرهایی که پیش از وجودِ نشست صدا زده می‌شوند و نمی‌توانند
   توکنِ CSRF داشته باشند */
const CSRF_EXEMPT = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/adopt',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/otp',
  '/api/payments/callback',
  /* کالبکِ درگاه از دامنه‌ی خودِ درگاه برمی‌گردد و کوکیِ CSRF ما را
     ندارد. زرین‌پال با GET برمی‌گردد و مشکلی نداشت، ولی هر درگاهی که
     با POSTِ مرورگری برگردد بدونِ این معافیت ۴۰۳ می‌گرفت. امنیت از
     راهِ verifyِ سرورساید تأمین می‌شود، نه CSRF. */
  '/api/ads/campaigns/callback',
  '/api/ads/plans/callback',
  '/api/stories/plans/callback',
  /* بازگشتِ درگاه برای ثبت‌نامِ مسابقه — همان دلیل: درگاه کوکیِ CSRFِ
     ما را ندارد. امنیت از راهِ verifyِ سرورساید و تطبیقِ authority
     می‌آید، نه از توکن. */
  '/api/tournaments/callback',
  /* بیکنِ شمارشِ تبلیغات: sendBeacon نمی‌تواند هدرِ x-csrf-token بگذارد و
     برای کاربرِ واردشده ۴۰۳ می‌شد؛ فقط شمارنده را زیاد می‌کند و بررسیِ
     Origin همچنان اعمال می‌شود. */
  '/api/ads/placements',
  '/api/ads/slots',
]

const isUnder = (path: string, prefixes: string[]) =>
  prefixes.some(p => path === p || path.startsWith(p + '/'))

/* ── CSRF ──────────────────────────────────────────────────────
   کوکی خودکار ارسال می‌شود، پس یک فرمِ مخفی در سایتِ مهاجم می‌تواند
   درخواستِ تغییردهنده بفرستد. SameSite=Lax بیشترِ حالات را می‌گیرد و
   این بررسی، حالتِ باقی‌مانده را می‌بندد: هر متدِ غیرِ امن باید از
   دامنه‌ی خودمان آمده باشد.

   درخواست‌های سرور‌به‌سرور (مثل callbackِ درگاه) اصلاً Origin ندارند و
   کوکی هم همراهشان نیست، پس نبودِ Origin رد نمی‌شود؛ فقط Originِ
   بیگانه رد می‌شود. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function sameSite(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true                     // بدونِ Origin ⇒ CSRF نیست
  try {
    const o = new URL(origin)
    const host = req.headers.get('host') ?? ''
    if (o.host === host) return true
    /* دامنه‌های خودمان (شاملِ پیش‌نمایش‌های ورسل) */
    return /(^|\.)billiardhub\.net$/.test(o.hostname)
      || (o.hostname.endsWith('.vercel.app') && o.hostname.includes('billiardhub'))
      || o.hostname === 'localhost'
  } catch { return false }
}

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  /* ── ۱) CSRF روی APIها ── */
  if (pathname.startsWith('/api/')) {
    if (!SAFE_METHODS.has(req.method)) {
      if (!sameSite(req)) {
        return NextResponse.json(
          { message: 'درخواست از دامنه‌ی نامعتبر رد شد' },
          { status: 403 },
        )
      }
      /* لایه‌ی دوم: توکنِ داخلِ هدر باید با کوکیِ خواندنی یکی باشد.
         مهاجم می‌تواند درخواست بفرستد ولی نمی‌تواند کوکیِ ما را بخواند،
         پس هدرِ درست را نمی‌سازد.

         مسیرهایی که خودشان نشست را می‌سازند مستثنا هستند: در اولین
         ورود هنوز کوکیِ CSRF وجود ندارد. آن‌ها با همان بررسیِ Origin
         محافظت می‌شوند. */
      if (!CSRF_EXEMPT.some(p => pathname.startsWith(p))) {
        const cookie = req.cookies.get(CSRF_COOKIE)?.value
        const header = req.headers.get(CSRF_HEADER)
        /* اگر کاربر اصلاً نشست ندارد، این بررسی موضوعیت ندارد */
        const hasSession = !!req.cookies.get(ACCESS_COOKIE)?.value
        if (hasSession && (!cookie || !header || cookie !== header)) {
          return NextResponse.json(
            { message: 'توکن امنیتی درخواست معتبر نیست؛ صفحه را تازه کنید' },
            { status: 403 },
          )
        }
      }
    }
    return NextResponse.next()
  }

  /* ── ۲) محافظتِ صفحه‌ها ── */
  if (!isUnder(pathname, PROTECTED_PREFIXES)) return NextResponse.next()

  const access = await verifyEdge(req.cookies.get(ACCESS_COOKIE)?.value)

  /* توکنِ دسترسی منقضی شده ولی رفرش هست ⇒ اجازه بده رد شود؛ کلاینت
     همان لحظه تمدید می‌کند. اگر ریدایرکت می‌کردیم، هر کاربری که ۱۵
     دقیقه تبش را باز گذاشته بود به صفحه‌ی ورود پرت می‌شد. */
  const session = access ?? await verifyEdge(req.cookies.get(REFRESH_COOKIE)?.value)

  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  /* نقشِ داخلِ توکن ممکن است کهنه باشد؛ این فقط لایه‌ی اول است و
     مجوزِ نهایی همچنان در خودِ API بررسی می‌شود. */
  if (isUnder(pathname, ADMIN_PREFIXES) && session.role !== 'admin') {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/messages/:path*',
    '/direct/:path*',
    '/referees/dashboard/:path*',
  ],
}
