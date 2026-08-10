export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { listPublicTournaments, listClubTournaments, seatsLeft } from '@/lib/tournaments/server';
import { notifyTournamentCreated } from '@/lib/notify';
import { SUPABASE_URL_RAW } from '@/lib/supabase-url';

/* فهرست مسابقات + ساخت مسابقه توسط باشگاه.

   ساخت فقط با اثبات مالکیت باشگاه از دیتابیس انجام می‌شود؛ `clubId`
   که کلاینت می‌فرستد تنها یک ادعاست و با `ownsClub` سنجیده می‌شود. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUSES = new Set([
  'draft', 'published', 'registration_open', 'registration_closed',
  'ongoing', 'completed', 'cancelled',
]);

/* فرمت مسابقه از فهرست بسته می‌آید، نه متن آزاد — پیش‌تر هرچه کاربر
   تایپ می‌کرد ذخیره می‌شد و «bo5» و «Best of 5» و «حذفی» کنار هم
   می‌نشستند و قابل گروه‌بندی نبودند.

   فهرست از `lib/tournaments/formats` می‌آید تا با آنچه فرم نشان
   می‌دهد یکی بماند. پیش‌تر همین‌جا هاردکد بود و فقط پنج مقدارِ `bo`
   را می‌پذیرفت — یعنی هر فرمتِ تازه‌ای که به فرم اضافه می‌شد، بی‌صدا
   NULL ذخیره می‌شد. */
import { ALL_FORMATS, normalizeDiscipline, optionsFor } from '@/lib/tournaments/formats';

/* تاریخ باید واقعاً تاریخ باشد. رشته‌ی بی‌معنی به‌جای خطای Postgres،
   همین‌جا NULL می‌شود. */
/* نشانیِ پوستر. فقط چیزی که خودِ آپلودِ ما ساخته یا فایلِ داخلیِ
   سایت است — وگرنه باشگاه‌دار می‌توانست هر نشانی‌ای بگذارد و صفحه‌ی
   عمومیِ ما تصویری از دامنه‌ی دلخواهِ او را سرو کند (هم ردیابیِ
   بازدیدکننده، هم محتوایی که هر لحظه می‌تواند عوض شود). */
export const safeCover = (v: unknown): string | null => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  if (s.startsWith('/images/')) return s.slice(0, 500);
  try {
    const u = new URL(s);
    const supa = SUPABASE_URL_RAW;
    if (supa && u.origin === new URL(supa).origin) return s.slice(0, 500);
  } catch { /* نشانیِ نامعتبر */ }
  return null;
};

const isoOrNull = (v: unknown): string | null => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get('clubId') ?? undefined;
  const mine = req.nextUrl.searchParams.get('mine') === '1';

  /* پنل باشگاه — شامل پیش‌نویس‌ها، فقط برای مالک */
  if (mine && clubId && UUID.test(clubId)) {
    const actor = await actorOf(req);
    if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });
    if (!(await ownsClub(actor, clubId))) return NextResponse.json(FORBIDDEN, { status: 403 });

    const rows = await listClubTournaments(clubId);
    const withSeats = await Promise.all(rows.map(async t => ({
      ...t, seatsLeft: await seatsLeft(t.id),
    })));
    return NextResponse.json({ tournaments: withSeats }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const rows = await listPublicTournaments(clubId && UUID.test(clubId) ? clubId : undefined);
  const withSeats = await Promise.all(rows.map(async t => ({
    ...t, seatsLeft: await seatsLeft(t.id),
  })));
  return NextResponse.json({ tournaments: withSeats }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const clubId = String(b?.clubId ?? '');
  if (!UUID.test(clubId)) return NextResponse.json({ message: 'باشگاه معتبر نیست' }, { status: 400 });

  /* مالکیت از دیتابیس، نه از ادعای کلاینت */
  if (!(await ownsClub(actor, clubId))) return NextResponse.json(FORBIDDEN, { status: 403 });

  const title = String(b?.title ?? '').trim();
  if (!title) return NextResponse.json({ message: 'عنوان مسابقه الزامی است' }, { status: 400 });

  const status = STATUSES.has(String(b?.status)) ? String(b.status) : 'draft';
  const maxPlayers = Math.max(2, Math.min(512, Math.round(Number(b?.maxPlayers) || 16)));
  const entryFee = Math.max(0, Math.min(500_000_000, Math.round(Number(b?.entryFee) || 0)));

  /* نوعِ بازی نرمال می‌شود تا نامِ قدیمی (`pocket`) و نامِ تازه
     (`8ball`) هر دو به یک مقدار برسند و صفحه‌های عمومی بتوانند
     برچسبش را پیدا کنند. */
  const discipline = normalizeDiscipline(b?.discipline);

  /* فرمت باید هم معتبر باشد هم به همین نوعِ بازی بخورد: «Best of 5»
     برای ناین‌بال بی‌معنی است و «۹۰ دقیقه» برای اسنوکر. */
  const rawFormat = String(b?.matchFormat ?? '');
  const okForGame = optionsFor(discipline).some(o => o.value === rawFormat);
  const matchFormat = ALL_FORMATS.has(rawFormat) && okForGame ? rawFormat : null;

  const row = {
    club_id: clubId,
    created_by: actor.id,
    title: title.slice(0, 200),
    description: String(b?.description ?? '').slice(0, 5000) || null,
    discipline,
    max_players: maxPlayers,
    entry_fee: entryFee,
    prize: String(b?.prize ?? '').slice(0, 200) || null,
    /* قوانین پیش‌تر اصلاً خوانده نمی‌شد: فرم آن را می‌گرفت، هیچ‌کس
       نمی‌فرستاد، و ستونش هم وجود نداشت (مهاجرت ۰۶۸). */
    rules: String(b?.rules ?? '').slice(0, 5000) || null,
    venue: String(b?.venue ?? '').slice(0, 200) || null,
    province: String(b?.province ?? '').slice(0, 80) || null,
    city: String(b?.city ?? '').slice(0, 80) || null,
    starts_at: isoOrNull(b?.startsAt),
    /* ── شروعِ زمان‌بندی‌شده‌ی ثبت‌نام ──
       تهی یعنی «همین حالا» و وضعیت را خودِ فرم تعیین می‌کند. مقداردار
       یعنی مسابقه در «بزودی» می‌ماند و `bh_tournaments_autoopen`
       (مهاجرت ۰۷۵) سرِ وقت بازش می‌کند. */
    registration_starts_at: isoOrNull(b?.registrationStartsAt),
    registration_ends_at: isoOrNull(b?.registrationEndsAt),
    match_format: matchFormat,
    /* پوسترِ اختیاری. تهی یعنی «پوسترِ پیش‌فرضِ همان بازی» — که در
       نگاشتِ سمتِ نمایش انتخاب می‌شود، نه این‌جا؛ وگرنه اگر بعداً
       نوعِ بازی عوض شود، پوستر روی بازیِ قبلی جا می‌ماند. */
    cover_url: safeCover(b?.coverUrl),
    status,
  };

  /* مهلت ثبت‌نام نباید بعد از خود مسابقه باشد */
  if (row.starts_at && row.registration_ends_at && row.registration_ends_at > row.starts_at) {
    return NextResponse.json({ message: 'مهلت ثبت‌نام نمی‌تواند بعد از تاریخ برگزاری باشد' }, { status: 400 });
  }
  if (row.registration_starts_at && row.registration_ends_at
      && row.registration_starts_at >= row.registration_ends_at) {
    return NextResponse.json({ message: 'زمان باز شدن ثبت‌نام باید پیش از مهلت پایان آن باشد' }, { status: 400 });
  }
  /* مسابقه‌ای که ثبت‌نامش زمان‌بندی شده باید در «بزودی» بماند، وگرنه
     همان لحظه باز است و زمان‌بندی بی‌اثر می‌شود. */
  if (row.registration_starts_at && row.status === 'registration_open') {
    row.status = 'published';
  }

  const { data, error } = await sb().from('tournaments').insert(row).select().single();
  if (error) {
    console.error('[tournaments] insert:', error.message);
    return NextResponse.json({ message: 'ثبت مسابقه انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'TOURNAMENT_CREATED',
    entityType: 'tournament', entityId: String((data as { id?: string })?.id ?? ''),
    newValue: { clubId, title, entryFee }, ip: clientIp(req) ?? undefined,
  });

  void notifyTournamentCreated(clubId, title).catch(() => { /* بی‌صدا */ });

  return NextResponse.json({ tournament: data }, { status: 201 });
}
