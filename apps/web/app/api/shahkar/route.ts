export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS } from '@/lib/social-server'
import { verifyIdentity } from '@/lib/shahkar-server'

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* POST { mobile, nationalCode } → تطبیقِ کد ملی با شماره (شاهکار) */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const r = await verifyIdentity(String(b?.mobile || ''), String(b?.nationalCode || ''))
  return NextResponse.json(r, { status: r.ok ? 200 : 400, headers: CORS })
}
