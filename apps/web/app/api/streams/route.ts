export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { tablesReady } from '@/lib/streaming/repo'
import { liveChannels } from '@/lib/streaming/public'

/* GET /api/streams — کانال‌های زنده‌ی سایت (عمومی، بدونِ ثبت‌نام).
   ?tournamentId= یا ?clubId= ⟵ فقط کانال‌های همان. */
const Q = z.object({
  tournamentId: z.string().uuid().optional(),
  clubId: z.string().uuid().optional(),
})

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  const q = Q.safeParse(Object.fromEntries(req.nextUrl.searchParams))
  if (!q.success) return NextResponse.json({ message: 'پارامتر نامعتبر' }, { status: 400 })
  if (!(await tablesReady())) return NextResponse.json({ ready: false, channels: [] }, { headers: NO_STORE })
  try {
    return NextResponse.json({ ready: true, channels: await liveChannels(q.data) }, { headers: NO_STORE })
  } catch (e) {
    console.error('[streams] list', e)
    /* نوار و صفحه‌ی پخش نباید بشکنند — «چیزی زنده نیست» امن‌ترین پاسخ */
    return NextResponse.json({ ready: true, channels: [] }, { headers: NO_STORE })
  }
}
