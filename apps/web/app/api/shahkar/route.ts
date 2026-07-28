export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS } from '@/lib/social-server'
import { verifyIdentity, verifyPerson } from '@/lib/shahkar-server'
import { markIdentityVerified } from '@/lib/otp-server'

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* POST { mobile, nationalCode }                                  → تطبیقِ کد ملی با شماره (شاهکار)
   POST { mobile, nationalCode, birthDate, firstName, lastName }  → + تطبیقِ نام از ثبت‌احوال */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const mobile = String(b?.mobile || ''), nc = String(b?.nationalCode || '')

  const shahkar = await verifyIdentity(mobile, nc)
  if (!shahkar.ok || !shahkar.match) return NextResponse.json(shahkar, { status: shahkar.ok ? 200 : 400, headers: CORS })

  /* اگر تاریخ تولد و نام داده شد، نام را هم با ثبت‌احوال تطبیق بده.
     اگر آن سرویس در دسترس نبود (سطحِ دسترسی/اعتبار)، به نتیجه‌ی شاهکار بسنده کن
     تا ثبت‌نام بسته نشود — هویت با موبایل+کدملی از قبل اثبات شده است. */
  if (b?.birthDate && (b?.firstName || b?.lastName)) {
    const person = await verifyPerson(mobile, nc, String(b.birthDate), String(b.firstName || ''), String(b.lastName || ''))
    if (person.unavailable) {
      /* ثبت‌احوال در دسترس نبود ⇒ به شاهکار بسنده می‌کنیم (کد ملی ↔ موبایل
         اثبات شده) ولی نامش تأییدنشده می‌ماند. */
      await markIdentityVerified(mobile, nc)
      return NextResponse.json({ ...shahkar, nameChecked: false }, { headers: CORS })
    }
    if (person.ok && person.match) await markIdentityVerified(mobile, nc)
    return NextResponse.json(person, { status: person.ok ? 200 : 400, headers: CORS })
  }

  /* فقط شاهکار: کد ملی با همین موبایل می‌خواند */
  await markIdentityVerified(mobile, nc)
  return NextResponse.json(shahkar, { headers: CORS })
}
