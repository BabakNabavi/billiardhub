export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS } from '@/lib/social-server'
import { sendOtp, verifyOtp } from '@/lib/otp-server'

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* POST { action:'send', mobile }            → ارسالِ کدِ پیامکی
   POST { action:'verify', mobile, code }    → تأییدِ کد */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const mobile = String(b?.mobile || '')
  if (b?.action === 'verify') {
    const r = await verifyOtp(mobile, String(b?.code || ''))
    return NextResponse.json(r, { status: r.ok ? 200 : 400, headers: CORS })
  }
  const r = await sendOtp(mobile)
  return NextResponse.json(r, { status: r.ok ? 200 : 400, headers: CORS })
}
