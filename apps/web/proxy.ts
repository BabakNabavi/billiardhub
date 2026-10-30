/* ─────────────────────────────────────────────────────────────
   محافظت سمت سرور — پیش از آنکه صفحه‌ای رندر شود.

   تا امروز محافظت فقط سمت کلاینت بود: HTML پنل ادمین برای همه سرو
   می‌شد و بعد جاوااسکریپت ریدایرکت می‌کرد. داده امن بود (APIها چک
   می‌کنند) ولی خود صفحه نه.

   دو کار می‌کند:
     ۱) مسیرهای محافظت‌شده بدون نشست معتبر باز نمی‌شوند
     ۲) درخواست‌های تغییردهنده‌ی /api از دامنه‌ی بیگانه رد می‌شوند (CSRF)

   در Next 16 روی Node اجرا می‌شود (نه Edge). از آبانِ ۱۴۰۵ وضعیتِ حساب را
   هم از دیتابیس می‌خواند (lib/enforcement) — کار سوم، پایین‌تر.
   ───────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { verifyEdge, type EdgeClaims } from './lib/auth/edge'
import { decide, canSignIn, userMessage } from './lib/enforcement/policy'
import { accountStateOf } from './lib/enforcement/server'
import {
  ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE, CSRF_HEADER,
  PROTECTED_PREFIXES, ADMIN_PREFIXES,
} from './lib/auth/constants'

/* مسیرهایی که پیش از وجود نشست صدا زده می‌شوند و نمی‌توانند
   توکن CSRF داشته باشند */
/* ── بازگشت از درگاه پرداخت ──
   این‌ها تنها مسیرهایی‌اند که بررسی **Origin** هم رویشان اجرا نمی‌شود.

   چرا لازم شد: پی‌پینگ با یک POST مرورگری به `returnUrl` برمی‌گردد و
   مرورگر روی آن `Origin` دامنه‌ی درگاه را می‌گذارد. `sameSite` آن را
   بیگانه می‌دید و با «درخواست از دامنه‌ی نامعتبر رد شد» جواب می‌داد —
   یعنی پول از حساب کم می‌شد و رزرو هرگز قطعی نمی‌شد.

   فهرست `CSRF_EXEMPT` این مسیرها را داشت، ولی آن فهرست فقط از لایه‌ی
   *دوم* (تطبیق توکن) معاف می‌کرد؛ بررسی Origin پیش از آن اجرا می‌شد
   و هیچ‌وقت نوبت به معافیت نمی‌رسید.

   ⚠️ این معافیت امن است و بی‌دقتی نیست: هیچ‌چیز آمده از این درخواست‌ها
   باور نمی‌شود. هر کدام پرداخت را سمت سرور از خود درگاه verify
   می‌کنند، مبلغ واقعی را با مبلغ سفارش می‌سنجند، و اثرشان idempotent
   است. یک درخواست جعلی هیچ کاری نمی‌تواند بکند. */
const GATEWAY_CALLBACKS = [
  '/api/payments/callback',
  '/api/ads/campaigns/callback',
  '/api/ads/plans/callback',
  '/api/stories/plans/callback',
  '/api/tournaments/callback',
  '/api/clubs/sms/callback',
  /* ارتقای آگهی (مهاجرت ۰۷۹). این‌جا نبود و دقیقا همان اتفاقی افتاد
     که این فهرست برای جلوگیری از آن ساخته شده بود: فروشنده پول
     ارتقا را داد، درگاه با POST برگشت، و به‌جای آگهی ارتقایافته یک
     صفحه‌ی خالی با «درخواست از دامنه‌ی نامعتبر رد شد» دید.

     هر کالبک تازه‌ای باید این‌جا ثبت شود؛ آزمون
     `test-tournaments.mjs` حالا خودش پوشه‌ی مسیرها را می‌گردد تا
     نفر بعدی این را از قلم نیندازد. */
  '/api/market/boost/callback',
]

const CSRF_EXEMPT = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/adopt',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/otp',
  '/api/payments/callback',
  /* کالبک درگاه از دامنه‌ی خود درگاه برمی‌گردد و کوکی CSRF ما را
     ندارد. زرین‌پال با GET برمی‌گردد و مشکلی نداشت، ولی هر درگاهی که
     با POST مرورگری برگردد بدون این معافیت ۴۰۳ می‌گرفت. امنیت از
     راه verify سرورساید تأمین می‌شود، نه CSRF. */
  '/api/ads/campaigns/callback',
  '/api/ads/plans/callback',
  '/api/stories/plans/callback',
  /* بازگشت درگاه برای ثبت‌نام مسابقه — همان دلیل: درگاه کوکی CSRF
     ما را ندارد. امنیت از راه verify سرورساید و تطبیق authority
     می‌آید، نه از توکن. */
  '/api/tournaments/callback',
  '/api/market/boost/callback',
  /* بیکن شمارش تبلیغات: sendBeacon نمی‌تواند هدر x-csrf-token بگذارد و
     برای کاربر واردشده ۴۰۳ می‌شد؛ فقط شمارنده را زیاد می‌کند و بررسی
     Origin همچنان اعمال می‌شود. */
  '/api/ads/placements',
  '/api/ads/slots',
]

const isUnder = (path: string, prefixes: string[]) =>
  prefixes.some(p => path === p || path.startsWith(p + '/'))

/* ── CSRF ──────────────────────────────────────────────────────
   کوکی خودکار ارسال می‌شود، پس یک فرم مخفی در سایت مهاجم می‌تواند
   درخواست تغییردهنده بفرستد. SameSite=Lax بیشتر حالات را می‌گیرد و
   این بررسی، حالت باقی‌مانده را می‌بندد: هر متد غیر امن باید از
   دامنه‌ی خودمان آمده باشد.

   درخواست‌های سرور‌به‌سرور (مثل callback درگاه) اصلا Origin ندارند و
   کوکی هم همراهشان نیست، پس نبود Origin رد نمی‌شود؛ فقط Origin
   بیگانه رد می‌شود. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function sameSite(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true                     // بدون Origin ⇒ CSRF نیست
  try {
    const o = new URL(origin)
    const host = req.headers.get('host') ?? ''
    if (o.host === host) return true
    if (/(^|\.)billiardhub\.net$/.test(o.hostname)) return true
    /* ⚠️ تا مهرِ ۱۴۰۵ هر `*.vercel.app`ی که «billiardhub» در نامش بود
       هم خودی حساب می‌شد — یادگارِ پیش‌نمایش‌های ورسل. سایت دیگر روی
       ورسل نیست و هر کسی می‌تواند پروژه‌ای به نامِ billiardhub-x بسازد،
       یعنی صفحه‌ی مهاجم از این بررسی رد می‌شد. برای مسیرهای معاف از
       توکن (ورود، OTP، …) همین بررسی تنها لایه است.

       localhost هم فقط در توسعه: در پروداکشن مبدأیی به این نام مالِ
       دستگاهِ خودِ بازدیدکننده است، نه ما. */
    return process.env.NODE_ENV !== 'production' && o.hostname === 'localhost'
  } catch { return false }
}

/* ── وضعیتِ حساب (مهاجرتِ ۱۱۳) ──────────────────────────────────
   گلوگاهِ همه‌ی مسیرهای API و صفحه‌های محافظت‌شده: حسابِ مسدود، تعلیق،
   غیرفعال یا حذف‌شده هیچ APIای جز خروج و خواندنِ وضعیتِ خودش را صدا
   نمی‌زند؛ restricted فقط می‌خواند؛ limited قابلیت‌های بسته را تغییر
   نمی‌دهد. وضعیت هر بار از دیتابیس می‌آید (کشِ ده‌ثانیه‌ای)، نه از توکن
   یا کوکی — پس دستکاریِ کلاینت، نشستِ تازه، شناسه‌ی دیگر در بدنه یا توکنِ
   قدیمیِ بی‌typ در هدرِ Authorization دورش نمی‌زند. منطق در
   lib/enforcement/policy است. */
async function claimsOf(req: NextRequest): Promise<EdgeClaims | null> {
  const fromCookie = req.cookies.get(ACCESS_COOKIE)?.value
  const h = req.headers.get('authorization')
  const fromHeader = h?.startsWith('Bearer ') ? h.slice(7) : undefined
  /* هر دو: کوکیِ خراب + هدرِ معتبر هم شناخته شود */
  return (await verifyEdge(fromCookie)) ?? (await verifyEdge(fromHeader))
}

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  /* ── ۱) CSRF روی APIها ── */
  if (pathname.startsWith('/api/')) {
    const fromGateway = GATEWAY_CALLBACKS.some(p => pathname.startsWith(p))

    if (!SAFE_METHODS.has(req.method) && !fromGateway) {
      if (!sameSite(req)) {
        return NextResponse.json(
          { message: 'درخواست از دامنه‌ی نامعتبر رد شد' },
          { status: 403 },
        )
      }
      /* لایه‌ی دوم: توکن داخل هدر باید با کوکی خواندنی یکی باشد.
         مهاجم می‌تواند درخواست بفرستد ولی نمی‌تواند کوکی ما را بخواند،
         پس هدر درست را نمی‌سازد.

         مسیرهایی که خودشان نشست را می‌سازند مستثنا هستند: در اولین
         ورود هنوز کوکی CSRF وجود ندارد. آن‌ها با همان بررسی Origin
         محافظت می‌شوند. */
      if (!CSRF_EXEMPT.some(p => pathname.startsWith(p))) {
        const cookie = req.cookies.get(CSRF_COOKIE)?.value
        const header = req.headers.get(CSRF_HEADER)
        /* اگر کاربر اصلا نشست ندارد، این بررسی موضوعیت ندارد */
        const hasSession = !!req.cookies.get(ACCESS_COOKIE)?.value
        if (hasSession && (!cookie || !header || cookie !== header)) {
          return NextResponse.json(
            { message: 'توکن امنیتی درخواست معتبر نیست؛ صفحه را تازه کنید' },
            { status: 403 },
          )
        }
      }
    }

    /* ── وضعیتِ حساب ──
       ⚠️ بازگشتِ درگاه معاف است: کاربری که بینِ پرداخت و بازگشت مسدود شد
       پولش رفته؛ بی‌این معافیت verify هرگز اجرا نمی‌شد و رزرو/ثبت‌نامی که
       پولش داده شده ثبت نمی‌شد. آن مسیرها پرداخت را خودشان از درگاه
       verify می‌کنند و هیچ دسترسیِ دیگری نمی‌دهند. */
    const who = fromGateway ? null : await claimsOf(req)
    if (who) {
      const state = await accountStateOf(who.id)
      const d = decide(state, req.method, pathname)
      if (!d.allow) {
        return NextResponse.json({
          code: d.code, status: d.status, feature: d.feature ?? null,
          until: state.expiresAt, message: userMessage(d.status, state.expiresAt),
        }, { status: 403 })
      }
    }
    return NextResponse.next()
  }

  /* ── ۲) محافظت صفحه‌ها ── */
  if (!isUnder(pathname, PROTECTED_PREFIXES)) return NextResponse.next()

  const access = await verifyEdge(req.cookies.get(ACCESS_COOKIE)?.value)

  /* توکن دسترسی منقضی شده ولی رفرش هست ⇒ اجازه بده رد شود؛ کلاینت
     همان لحظه تمدید می‌کند. اگر ریدایرکت می‌کردیم، هر کاربری که ۱۵
     دقیقه تبش را باز گذاشته بود به صفحه‌ی ورود پرت می‌شد. */
  const session = access ?? await verifyEdge(req.cookies.get(REFRESH_COOKIE)?.value)

  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  /* حسابِ مسدود صفحه‌ی محافظت‌شده نمی‌بیند — پیامِ وضعیتش را می‌بیند */
  if (!canSignIn(await accountStateOf(session.id))) {
    const url = req.nextUrl.clone()
    url.pathname = '/account-status'
    url.search = ''
    return NextResponse.redirect(url)
  }

  /* نقش داخل توکن ممکن است کهنه باشد؛ این فقط لایه‌ی اول است و
     مجوز نهایی همچنان در خود API بررسی می‌شود. */
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
    '/direct/:path*',
    '/referees/dashboard/:path*',
  ],
}
