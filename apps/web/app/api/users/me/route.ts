export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/* ─────────────────────────────────────────────────────────────
   PATCH /api/users/me — بازنشسته (آذرِ ۱۴۰۵).

   این مسیر هر یک از هشت نقش را بی هیچ درخواست و تأییدی «نقشِ اصلی» می‌کرد:
   هر کاربری با یک درخواستِ دستی خودش را باشگاه‌دار یا مربی می‌کرد، قفلِ
   «نقشِ برداشته‌شده از سوی مدیریت» را دور می‌زد، و حتی «کاربر عادی» گذاشتن
   نقشِ قبلی را بی‌ردپا می‌انداخت. هیچ‌جای اپ صدایش نمی‌زد.

   جایگزین‌ها — هرکدام با محافظ‌های خودش:
     • انتخابِ نقش        POST   /api/roles/request
     • نقشِ اصلی          PUT    /api/roles/my
     • حذفِ نقش           DELETE /api/roles/my?role=…
   ───────────────────────────────────────────────────────────── */

const CORS_HEADERS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function PATCH() {
  return NextResponse.json(
    { message: 'این مسیر دیگر استفاده نمی‌شود؛ نقش‌ها از صفحه‌ی «مدیریت نقش‌ها» تغییر می‌کنند' },
    { status: 410, headers: CORS_HEADERS },
  );
}
