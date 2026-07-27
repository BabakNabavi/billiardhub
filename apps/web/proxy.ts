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
  ACCESS_COOKIE, REFRESH_COOKIE,
  PROTECTED_PREFIXES, ADMIN_PREFIXES,
} from './lib/auth/constants'

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
    if (!SAFE_METHODS.has(req.method) && !sameSite(req)) {
      return NextResponse.json(
        { message: 'درخواست از دامنه‌ی نامعتبر رد شد' },
        { status: 403 },
      )
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
