export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { tablesReady } from '@/lib/streaming/repo'
import { publicChannel } from '@/lib/streaming/public'
import { sessionFromRequest } from '@/lib/auth/session'

/* GET /api/streams/:id — اطلاعاتِ عمومیِ یک کانال و آرشیوِ ضبط‌هایش.
   نشانیِ پخش این‌جا نیست: آن را /play پس از سنجشِ دسترسی می‌دهد. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ message: 'کانال یافت نشد' }, { status: 404 })
  if (!(await tablesReady())) return NextResponse.json({ message: 'پخش زنده هنوز راه‌اندازی نشده است' }, { status: 503 })
  try {
    const data = await publicChannel(id, { loggedIn: !!sessionFromRequest(req) })
    if (!data) return NextResponse.json({ message: 'کانال یافت نشد' }, { status: 404 })
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[streams] channel', e)
    return NextResponse.json({ message: 'خواندنِ کانال ممکن نشد' }, { status: 500 })
  }
}
