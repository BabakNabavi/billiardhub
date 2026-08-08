export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { getTournament } from '@/lib/tournaments/server';
import { notifyTournamentCancelled } from '@/lib/notify';

/* یک مسابقه — خواندن، ویرایش، لغو.

   تا امروز این مسیر اصلاً وجود نداشت: مسابقه ساخته می‌شد و دیگر هیچ
   راهی برای اصلاحش نبود. غلط تایپی در عنوان، تاریخ اشتباه یا مبلغ
   نادرست ⇒ فقط لغو و ساخت دوباره.

   حذف فیزیکی عمداً نیست: مسابقه‌ای که ثبت‌نام یا پرداخت داشته سابقه‌ی
   مالی دارد و پاک‌کردنش یعنی گم‌شدن رد پول. «لغو» جای حذف را می‌گیرد
   و فقط مسابقه‌ی پیش‌نویس بدون ثبت‌نام واقعاً حذف می‌شود. */

import { ALL_FORMATS, normalizeDiscipline, optionsFor } from '@/lib/tournaments/formats';
import { safeCover } from '../route';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* وضعیت‌هایی که بعدشان دیگر ویرایش محتوایی مجاز نیست — مسابقه‌ی در
   حال اجرا یا تمام‌شده نباید تاریخ و مبلغش عوض شود. */
const FROZEN = new Set(['ongoing', 'completed', 'cancelled']);

/* ── گذرهای مجازِ وضعیت ──────────────────────────────────────────
   تا امروز هیچ راهی برای عوض‌کردنِ وضعیت نبود: مسابقه با `draft`
   ساخته می‌شد، فهرست‌های عمومی پیش‌نویس را نشان نمی‌دهند، و دکمه‌ی
   انتشاری هم وجود نداشت — یعنی یک بن‌بست.

   هر گذری هم مجاز نیست. نقشه‌ی زیر فقط چیزهایی را می‌پذیرد که
   معنا دارند؛ «شروع مسابقه» و «پایان» کارِ این مسیر نیست و جای
   خودش را دارد. */
const TRANSITIONS: Record<string, string[]> = {
  draft: ['registration_open'],
  registration_open: ['registration_closed', 'draft'],
  registration_closed: ['registration_open'],
  /* published بازمانده‌ی داده‌ی قدیمی است؛ راهِ خروج داشته باشد */
  published: ['registration_open', 'draft'],
};

const isoOrNull = (v: unknown): string | null => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

async function guard(req: NextRequest, id: string) {
  if (!UUID.test(id)) return { err: NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 }) };
  const actor = await actorOf(req);
  if (!actor) return { err: NextResponse.json(UNAUTHENTICATED, { status: 401 }) };
  const t = await getTournament(id);
  if (!t) return { err: NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 }) };
  if (!(await ownsClub(actor, t.club_id))) return { err: NextResponse.json(FORBIDDEN, { status: 403 }) };
  return { actor, t };
}

/* وضعیت‌هایی که هر کسی حق دیدنشان را دارد. `draft` عمداً بیرون است:
   پیش‌نویس یعنی باشگاه هنوز منتشرش نکرده. */
const PUBLIC_STATUSES = new Set([
  'published', 'registration_open', 'registration_closed',
  'ongoing', 'completed', 'cancelled',
]);

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });
  const t = await getTournament(id);
  if (!t) return NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 });

  /* فهرستِ عمومی پیش‌نویس‌ها را فیلتر می‌کرد، ولی این مسیر نمی‌کرد:
     با داشتنِ شناسه، عنوان و مبلغ و تاریخِ مسابقه‌ی منتشرنشده برای هر
     کسی خوانده می‌شد. مالکِ باشگاه و ادمین همچنان می‌بینند؛ بقیه نه.

     پاسخ عمداً ۴۰۴ است نه ۴۰۳: ۴۰۳ خودش تأیید می‌کند که چنین مسابقه‌ای
     وجود دارد. */
  if (!PUBLIC_STATUSES.has(t.status)) {
    const actor = await actorOf(req);
    const allowed = !!actor && (actor.role === 'admin' || await ownsClub(actor, t.club_id));
    if (!allowed) return NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 });
  }

  return NextResponse.json({ tournament: t }, { headers: { 'Cache-Control': 'no-store' } });
}

/* PATCH — ویرایش مسابقه توسط مالک باشگاه */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.err) return g.err;
  const t = g.t!;

  if (FROZEN.has(t.status)) {
    return NextResponse.json(
      { message: 'مسابقه‌ی در حال اجرا، تمام‌شده یا لغوشده ویرایش نمی‌شود' }, { status: 409 });
  }

  const b = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  /* ── تغییر وضعیت (انتشار / بستن ثبت‌نام / بازگشت به پیش‌نویس) ── */
  if (b.status !== undefined) {
    const next = String(b.status);
    const allowed = TRANSITIONS[t.status] ?? [];
    if (!allowed.includes(next)) {
      return NextResponse.json({
        message: `تغییر وضعیت از «${t.status}» به «${next}» مجاز نیست`,
      }, { status: 409 });
    }

    /* برگرداندن به پیش‌نویس یعنی مسابقه از دیدِ عموم ناپدید می‌شود.
       اگر کسی ثبت‌نام کرده باشد، این یعنی رویدادی که رویش حساب کرده
       بی‌خبر غیب شود — پس بسته است. راهِ درستش «لغو» است که به
       ثبت‌نام‌کننده‌ها خبر می‌دهد. */
    if (next === 'draft') {
      const { count } = await sb().from('tournament_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', id).neq('status', 'CANCELLED');
      if ((count ?? 0) > 0) {
        return NextResponse.json({
          message: `این مسابقه ${count} ثبت‌نام دارد و به پیش‌نویس برنمی‌گردد. برای توقف، آن را لغو کنید.`,
        }, { status: 409 });
      }
    }

    patch.status = next;
  }

  if (typeof b.title === 'string') {
    const title = b.title.trim();
    if (!title) return NextResponse.json({ message: 'عنوان نمی‌تواند خالی باشد' }, { status: 400 });
    patch.title = title.slice(0, 200);
  }
  if (b.description !== undefined) patch.description = String(b.description ?? '').slice(0, 5000) || null;
  if (b.prize !== undefined) patch.prize = String(b.prize ?? '').slice(0, 200) || null;
  if (b.rules !== undefined) patch.rules = String(b.rules ?? '').slice(0, 5000) || null;
  /* تهی یعنی «برگرد به پوسترِ پیش‌فرض» — پس پاک‌کردن هم ممکن است */
  if (b.coverUrl !== undefined) patch.cover_url = safeCover(b.coverUrl);
  if (typeof b.discipline === 'string') patch.discipline = normalizeDiscipline(b.discipline);
  if (b.matchFormat !== undefined) {
    /* فرمت باید با نوعِ بازی بخواند — و نوعِ بازی ممکن است در همین
       درخواست عوض شده باشد، پس مقدارِ تازه ملاک است نه ردیفِ فعلی. */
    const disc = normalizeDiscipline(
      typeof b.discipline === 'string' ? b.discipline : t.discipline);
    const raw = String(b.matchFormat ?? '');
    const fits = optionsFor(disc).some(o => o.value === raw);
    patch.match_format = ALL_FORMATS.has(raw) && fits ? raw : null;
  }
  if (b.startsAt !== undefined) patch.starts_at = isoOrNull(b.startsAt);
  if (b.registrationEndsAt !== undefined) patch.registration_ends_at = isoOrNull(b.registrationEndsAt);
  /* زمانِ باز شدنِ ثبت‌نام. تهی‌کردنش یعنی «دیگر زمان‌بندی نیست» —
     مسابقه همان‌جا که هست می‌ماند تا باشگاه‌دار دستی بازش کند. */
  if (b.registrationStartsAt !== undefined) {
    patch.registration_starts_at = isoOrNull(b.registrationStartsAt);
  }

  /* ظرفیت را نمی‌شود زیر تعداد ثبت‌نام فعلی آورد — وگرنه مسابقه‌ای
     می‌ماند که بیش از ظرفیتش بازیکن دارد و قرعه‌کشی‌اش بی‌معنی است. */
  if (b.maxPlayers !== undefined) {
    const n = Math.max(2, Math.min(512, Math.round(Number(b.maxPlayers) || 16)));
    const { count } = await sb().from('tournament_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', id).eq('status', 'CONFIRMED');
    if ((count ?? 0) > n) {
      return NextResponse.json(
        { message: `ظرفیت نمی‌تواند کمتر از ${count} ثبت‌نام فعلی باشد` }, { status: 409 });
    }
    patch.max_players = n;
  }

  /* مبلغ فقط وقتی می‌تواند عوض شود که هنوز کسی پرداخت نکرده باشد.
     Snapshot مبلغ در هر ثبت‌نام ذخیره شده، ولی تغییر مبلغ پس از
     پرداخت یعنی دو نفر با دو قیمت متفاوت در یک مسابقه — و بازپرداخت
     هم مبهم می‌شود. */
  if (b.entryFee !== undefined) {
    const next = Math.max(0, Math.min(500_000_000, Math.round(Number(b.entryFee) || 0)));

    /* ── چرا مقایسه لازم است ──
       شرط پیش‌تر فقط «آیا مبلغ در بدنه هست؟» را می‌پرسید. ولی فرمِ
       ویرایش همه‌ی فیلدها را با هم می‌فرستد، پس مبلغ همیشه در بدنه
       است — حتی وقتی کاربر دستش هم به آن نزده. نتیجه‌اش این بود که
       اصلاحِ یک غلطِ تایپی در عنوان با پیامِ «پس از اولین پرداخت،
       مبلغ ورودی تغییر نمی‌کند» رد می‌شد.

       مقدارِ یکسان اصلاً تغییر نیست؛ فقط مقدارِ متفاوت باید بسته
       باشد. */
    if (next !== t.entry_fee) {
      const { count } = await sb().from('tournament_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', id).eq('payment_status', 'PAID');
      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { message: 'پس از اولین پرداخت، مبلغ ورودی تغییر نمی‌کند' }, { status: 409 });
      }
      patch.entry_fee = next;
    }
  }

  const startsAt = (patch.starts_at ?? t.starts_at) as string | null;
  const regEnds = (patch.registration_ends_at ?? t.registration_ends_at) as string | null;
  if (startsAt && regEnds && regEnds > startsAt) {
    return NextResponse.json(
      { message: 'مهلت ثبت‌نام نمی‌تواند بعد از تاریخ برگزاری باشد' }, { status: 400 });
  }

  /* ── زمان‌بندیِ باز شدنِ ثبت‌نام: همان قاعده‌ی مسیرِ ساخت ──
     مسیرِ POST این را داشت و این‌جا نداشت. نتیجه‌اش دقیقاً همان چیزی
     بود که زمان‌بندی باید جلویش را می‌گرفت: باشگاه‌دار تاریخِ باز
     شدن را روی فردا می‌گذاشت و «انتشار و باز کردن ثبت‌نام» را می‌زد،
     ثبت‌نام **همان لحظه** باز می‌شد و مسابقه هرگز به تبِ «بزودی»
     نمی‌رفت. هیچ خطایی هم نمی‌داد — قاعده‌ای که در یکی از دو مسیرِ
     نوشتن باشد و در دیگری نه، همین شکلی بی‌صدا از کار می‌افتد.

     `patch` با `in` خوانده می‌شود نه با `??`: تهی‌کردنِ زمان‌بندی
     («دیگر زمان‌بندی نیست») مقدارِ `null` می‌فرستد و `??` آن را با
     مقدارِ قبلیِ ردیف جایگزین می‌کرد — یعنی لغوِ زمان‌بندی کار
     نمی‌کرد. */
  const regStarts = ('registration_starts_at' in patch
    ? patch.registration_starts_at
    : t.registration_starts_at) as string | null;

  /* رشته‌های تاریخ با عدد سنجیده می‌شوند نه با `>`: مقدارِ `patch`
     همیشه ISOیِ نرمال است ولی مقدارِ ردیف از PostgREST با
     `+00:00` می‌آید، و مقایسه‌ی حرفیِ دو قالبِ متفاوت غلط جواب
     می‌دهد. */
  const ms = (v: string | null) => (v ? Date.parse(v) : NaN);
  if (regStarts && regEnds && ms(regStarts) >= ms(regEnds)) {
    return NextResponse.json(
      { message: 'زمان باز شدن ثبت‌نام باید پیش از مهلت پایان آن باشد' }, { status: 400 });
  }

  /* «در آینده» شرطِ لازم است: مسابقه‌ای که هفته‌ی پیش سرِ وقت باز
     شده نباید با ویرایشِ جایزه‌اش به «بزودی» برگردد. */
  const nextStatus = String(patch.status ?? t.status);
  if (regStarts && nextStatus === 'registration_open' && ms(regStarts) > Date.now()) {
    patch.status = 'published';
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ message: 'تغییری فرستاده نشد' }, { status: 400 });
  }

  const { data, error } = await sb().from('tournaments')
    .update(patch).eq('id', id).select().single();
  if (error) {
    console.error('[tournaments/:id] update:', error.message);
    return NextResponse.json({ message: 'ویرایش انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: g.actor!.id, actorRole: 'club_owner', action: 'TOURNAMENT_UPDATED',
    entityType: 'tournament', entityId: id, newValue: patch, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, tournament: data });
}

/* DELETE — لغو (یا حذف واقعی پیش‌نویس خالی) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.err) return g.err;
  const t = g.t!;

  const { count: regs } = await sb().from('tournament_registrations')
    .select('id', { count: 'exact', head: true }).eq('tournament_id', id);

  /* پیش‌نویس بدون ثبت‌نام: چیزی برای نگه‌داشتن نیست ⇒ واقعاً حذف */
  if ((regs ?? 0) === 0 && (t.status === 'draft' || t.status === 'published')) {
    const { error } = await sb().from('tournaments').delete().eq('id', id);
    if (error) return NextResponse.json({ message: 'حذف انجام نشد' }, { status: 500 });
    void audit({
      actorId: g.actor!.id, actorRole: 'club_owner', action: 'TOURNAMENT_DELETED',
      entityType: 'tournament', entityId: id, ip: clientIp(req) ?? undefined,
    });
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (t.status === 'cancelled') {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
  }

  /* ثبت‌نام دارد ⇒ فقط لغو، تا رد مالی و سابقه بماند.
     اعلان لغو پیش از هر چیز به ثبت‌نام‌کننده‌ها می‌رود. */
  const { error } = await sb().from('tournaments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ message: 'لغو انجام نشد' }, { status: 500 });

  void notifyTournamentCancelled(id).catch(() => { /* بی‌صدا */ });
  void audit({
    actorId: g.actor!.id, actorRole: 'club_owner', action: 'TOURNAMENT_CANCELLED',
    entityType: 'tournament', entityId: id,
    newValue: { registrations: regs ?? 0 }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, cancelled: true, registrations: regs ?? 0 });
}
