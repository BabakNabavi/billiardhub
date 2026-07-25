export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

/* نسخه‌ی جاریِ دیپلوی — کلاینت با نسخه‌ای که باهاش build شده مقایسه می‌کند؛
   اگر فرق داشت خودش را reload می‌کند (رفعِ کدِ کهنه‌ی PWA روی iOS). */
export function GET() {
  return NextResponse.json(
    { sha: process.env.VERCEL_GIT_COMMIT_SHA || 'dev' },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
