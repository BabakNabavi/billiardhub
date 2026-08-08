export const dynamic = 'force-dynamic'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextResponse } from 'next/server'

/* نسخه‌ی جاریِ دیپلوی — کلاینت آن را با نسخه‌ای که با آن build شده
   مقایسه می‌کند و اگر فرق داشت خودش را reload می‌کند.

   ── چرا از فایل ──
   پیش‌تر `VERCEL_GIT_COMMIT_SHA` خوانده می‌شد. بعد از مهاجرت از
   Vercel به سرورِ خودمان آن متغیر وجود ندارد، پس این مسیر همیشه
   `'dev'` برمی‌گرداند — و چون کلاینت هم `'dev'` داشت، مقایسه
   هیچ‌وقت نامساوی نمی‌شد و مرورگرِ کهنه هرگز تازه نمی‌شد.

   `deploy.sh` این فایل را در هر دیپلوی می‌نویسد. */
let cached: string | null = null

function sha(): string {
  if (cached) return cached
  try {
    cached = readFileSync(join(process.cwd(), '.build-sha'), 'utf8').trim() || 'dev'
  } catch { cached = 'dev' }
  return cached
}

export function GET() {
  return NextResponse.json({ sha: sha() }, { headers: { 'Cache-Control': 'no-store' } })
}
