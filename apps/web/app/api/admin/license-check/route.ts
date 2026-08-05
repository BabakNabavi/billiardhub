export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, audit } from '@/lib/finance/db';
import { lookupLicense } from '@/lib/license-server';

/* استعلام جواز کسب — توسط ادمین.

   ── چرا از دستِ صاحبِ کسب‌وکار گرفته شد ──
   پیش‌تر خودِ باشگاه‌دار شماره‌ی جوازش را وارد می‌کرد و استعلام می‌گرفت،
   و نتیجه‌اش مستقیماً تیکِ تأیید می‌داد. یعنی تأییدِ یک کسب‌وکار به
   ورودیِ خودش وابسته بود. حالا ادمین تصویرِ جواز را می‌بیند، شماره را
   از رویش می‌خواند، و خودش استعلام می‌گیرد.

   ── ایرادی که با همین جابه‌جایی آشکار شد ──
   مسیرِ قبلی کد ملیِ داخلِ جواز را با کد ملیِ **فراخواننده** می‌سنجید.
   تا وقتی فراخواننده خودِ مالک بود، درست کار می‌کرد. ولی همان کد به
   ادمین هم اجازه‌ی فراخوانی می‌داد — و آن‌وقت جواز را با کد ملیِ
   *ادمین* مقایسه می‌کرد و هر جوازی رد می‌شد.

   این‌جا همیشه با کد ملیِ **صاحبِ همان کسب‌وکار** سنجیده می‌شود، فارغ
   از اینکه چه کسی دکمه را زده. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const b = await req.json().catch(() => ({})) as { type?: string; id?: string; trackingCode?: string };
  const type = String(b.type ?? '');
  const id = String(b.id ?? '').trim();
  const trackingCode = String(b.trackingCode ?? '').trim();

  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه نامعتبر است' }, { status: 400 });
  if (!trackingCode) return NextResponse.json({ message: 'شماره‌ی جواز را وارد کنید' }, { status: 400 });
  if (type !== 'club' && type !== 'profile') {
    return NextResponse.json({ message: 'نوع نامعتبر است' }, { status: 400 });
  }

  /* صاحبِ کسب‌وکار — نه فراخواننده */
  let ownerId: string | null = null;
  if (type === 'club') {
    const { data } = await sb().from('clubs').select('"ownerId"').eq('id', id).maybeSingle();
    if (!data) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });
    ownerId = (data as { ownerId?: string }).ownerId ?? null;
  } else {
    const { data } = await sb().from('profiles').select('owner_id').eq('id', id).maybeSingle();
    if (!data) return NextResponse.json({ message: 'پروفایل یافت نشد' }, { status: 404 });
    ownerId = (data as { owner_id?: string }).owner_id ?? null;
  }
  if (!ownerId) return NextResponse.json({ message: 'صاحب این مورد پیدا نشد' }, { status: 404 });

  const { data: ownerRow } = await sb().from('users')
    .select('national_id,national_id_verified,"firstName","lastName"').eq('id', ownerId).maybeSingle();
  const owner = (ownerRow ?? {}) as {
    national_id?: string; national_id_verified?: boolean; firstName?: string; lastName?: string
  };

  const r = await lookupLicense(trackingCode);
  if (!r.ok) return NextResponse.json(r, { status: r.unavailable ? 503 : 400 });
  if (!r.found) return NextResponse.json(r, { status: 404 });

  /* تطبیقِ کد ملی — نه مقایسه‌ی رشته‌ایِ نام. نام‌ها با فاصله و «ی» و
     «ك» جور درنمی‌آیند و کد ملی یکتاست. */
  const holder = String(r.data?.nationalCode ?? '').replace(/[^0-9]/g, '');
  const ownerNid = String(owner.national_id ?? '').replace(/[^0-9]/g, '');
  const ownerName = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim() || 'صاحب این مورد';

  /* بدونِ کد ملیِ احرازشده نمی‌شود گفت جواز به نامِ همین شخص است.
     نتیجه ثبت می‌شود ولی تیک تأیید داده نمی‌شود — تصمیم با ادمین. */
  if (!ownerNid || !owner.national_id_verified) {
    return NextResponse.json({
      ok: true, match: null, data: r.data,
      message: `کد ملیِ ${ownerName} تأیید نشده، پس تطبیق ممکن نیست. اطلاعات جواز را با مدرک بسنجید.`,
    });
  }

  if (holder && holder !== ownerNid) {
    return NextResponse.json({
      ok: true, match: false, data: r.data,
      message: `این جواز به نام ${ownerName} نیست؛ به نام شخص دیگری ثبت شده است.`,
    });
  }

  const expired = r.expired === true;

  if (type === 'club') {
    await sb().from('clubs').update({
      licenseNumber: trackingCode,
      licenseVerified: !expired,
      licenseCheckedAt: new Date().toISOString(),
    }).eq('id', id);
  } else {
    await sb().from('profiles').update({
      license_number: trackingCode,
      license_verified: !expired,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'LICENSE_CHECKED',
    entityType: type, entityId: id, newValue: { match: true, expired },
  });

  return NextResponse.json({
    ok: true, match: true, expired, data: r.data,
    message: expired
      ? `جواز به نام ${ownerName} است ولی اعتبارش در ${r.data?.expireDate} تمام شده.`
      : `تأیید شد — جواز معتبر و به نام ${ownerName} است.`,
  });
}
