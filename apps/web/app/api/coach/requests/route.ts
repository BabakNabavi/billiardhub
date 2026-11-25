export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { accountStateOf } from '@/lib/enforcement/server';
import { canSignIn } from '@/lib/enforcement/policy';
import { notifyPattern } from '@/lib/sms-server';
import { sendServicePush } from '@/lib/push-server';
import { DISCIPLINES, disciplineLabel } from '@/lib/coach-store';
import {
  REQUEST_KIND_KEYS, REQUEST_LEVEL_KEYS, REQUEST_TIME_KEYS, REQUEST_MESSAGE_MAX, requestTitle,
} from '@/lib/coach/request-options';

/* ─────────────────────────────────────────────────────────────
   درخواستِ کلاس یا مشاوره از مربی — آذرِ ۱۴۰۵.

   ── سازوکار ──
   شاگرد زمان تعیین نمی‌کند (تصمیمِ مالک): نوعِ درخواست، رشته، سطح،
   زمان‌های مناسبِ کلی و پیامی کوتاه می‌فرستد؛ مربی پیامکی با نام و شماره‌ی
   شاگرد می‌گیرد و خودش برای هماهنگی تماس می‌گیرد — همان الگوی سایت‌های
   معلم‌یابی (درخواست ⟵ تماسِ مربی)، بی گفت‌وگوی درون‌سایتی.

   ── چرخه ──
   new ⟵ contacted («تماس گرفتم»، مربی) ⟵ closed (مربی)؛ و شاگرد از new یا
   contacted لغو می‌کند (شماره‌اش از صندوقِ مربی بیرون می‌رود). تماسِ ثبت‌شده
   برنمی‌گردد و contacted_at پاک نمی‌شود: شرطِ نظر دادن رویش سوار است
   (api/profiles/[kind]/[slug]/reviews) و برداشتنش یعنی پس‌گرفتنِ اجازه‌ی نظر
   وقتی مربی بوی نظرِ بد را می‌شنود — همان سوراخی که در ۰۹۱ بسته شد.

   ── سقف‌ها (هر درخواست یک پیامکِ پولی است) ──
   ورود لازم؛ درخواست به خود، به پروفایلِ نمایشی و به مربیِ مسدود ممنوع؛ روزی
   پنج درخواست و به هر مربی یکی در ۲۴ ساعت — هر دو در تریگرِ مهاجرتِ ۱۱۸ (با
   قفل، ضدِ درخواستِ هم‌زمان)؛ شمارشِ این‌جا فقط پیامِ زودتر است.
   محدودیتِ «تعاملِ اجتماعی» هم این مسیر را می‌بندد (lib/enforcement/policy).
   ───────────────────────────────────────────────────────────── */

const DAILY_LIMIT = 5;
const DISC_KEYS = new Set(DISCIPLINES.map(d => d.key));
const MSG_DAILY = `در هر روز حداکثر ${DAILY_LIMIT.toLocaleString('fa-IR')} درخواست می‌توانید بفرستید`;
const MSG_SAME_COACH = 'در ۲۴ ساعت گذشته برای این مربی درخواست فرستاده‌اید، فردا دوباره امتحان کنید';
const MSG_FAILED = 'ثبت درخواست انجام نشد';

/* مرزِ ورودی — کلیدها همان CHECKهای مهاجرت‌اند */
const Slug = z.string().trim().min(1).max(80);
const PostBody = z.object({
  coachSlug: Slug,
  kind: z.enum(REQUEST_KIND_KEYS),
  discipline: z.string().max(20).nullish(),
  level: z.enum(REQUEST_LEVEL_KEYS),
  availability: z.array(z.enum(REQUEST_TIME_KEYS)).max(REQUEST_TIME_KEYS.length).default([]),
  /* سقفِ واقعی پس از پاک‌سازی سنجیده می‌شود (پایین) */
  message: z.string().max(2000).default(''),
});
const PatchBody = z.object({
  id: z.string().uuid(),
  action: z.enum(['contacted', 'closed', 'cancelled']),
});

/* نویسه‌های کنترلی بیرون، بیش از دو خطِ خالیِ پشتِ‌سرِ‌هم یکی */
const cleanMessage = (s: string) =>
  /* eslint-disable-next-line no-control-regex -- عمدی: همین نویسه‌های کنترلی باید از پیامِ آزادِ شاگرد پاک شوند */
  s.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/\n{3,}/g, '\n\n').trim();

const normMobile = (m: unknown) =>
  String(m ?? '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, '');

const fullName = (u: { firstName?: string | null; lastName?: string | null } | null | undefined) =>
  `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();

const fail = (where: string, e: { message: string }) => {
  console.error(`[coach-requests] ${where}:`, e.message);
  return NextResponse.json({ message: MSG_FAILED }, { status: 500 });
};

interface CoachRow {
  id: string; owner_id: string; status: string; is_demo: boolean | null;
  fn: string | null; ln: string | null; disciplines: unknown;
}

/* مربی‌ای که درخواست می‌پذیرد: تأییدشده، نمایشی نیست، و صاحبش مسدود نیست —
   مسدودکردنِ حساب پروفایل را فقط با تیکِ «کسب‌وکار هم» خاموش می‌کند و بی‌این
   شرط، نام و شماره‌ی شاگرد با پیامک به حسابِ مسدود می‌رسید (بازبینی).
   undefined ⟵ خطای دیتابیس. */
async function acceptingCoach(slug: string): Promise<CoachRow | null | undefined> {
  /* فقط همین چند فیلد — `data`ِ کامل گالری و عکس‌ها را هم می‌آورد */
  const { data, error } = await sb().from('profiles')
    .select('id,owner_id,status,is_demo,fn:data->>firstNameFa,ln:data->>lastNameFa,disciplines:data->disciplines')
    .eq('kind', 'coach').eq('slug', slug).maybeSingle();
  if (error) { console.error('[coach-requests] coach:', error.message); return undefined }
  const c = (data ?? null) as CoachRow | null;
  if (!c || c.status !== 'approved' || c.is_demo) return null;
  if (!canSignIn(await accountStateOf(c.owner_id))) return null;
  return c;
}

const coachDisciplines = (c: CoachRow) =>
  (Array.isArray(c.disciplines) ? c.disciplines : []).filter((k): k is string => typeof k === 'string' && DISC_KEYS.has(k));

type UserRow = { phone: string | null; firstName: string | null; lastName: string | null };
async function userRow(id: string) {
  const { data, error } = await sb().from('users').select('phone,"firstName","lastName"').eq('id', id).maybeSingle();
  return { row: (data ?? null) as UserRow | null, error };
}

/* GET ?coach=slug — وضعیتِ من نزدِ این مربی (فرمِ شاگرد)
   GET ?role=coach — صندوقِ درخواست‌های مربی */
export async function GET(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });
  const noStore = { headers: { 'Cache-Control': 'no-store' } };
  const q = req.nextUrl.searchParams;

  if (q.get('role') === 'coach') {
    /* همه‌ی پروفایل‌های مربیِ این حساب، نه فقط اولی — پروفایلِ نمایشی هم
       ممکن است با همین شناسه ساخته شده باشد */
    const { data: ps, error: pErr } = await sb().from('profiles').select('id').eq('kind', 'coach').eq('owner_id', actor.id);
    if (pErr) return fail('profiles', pErr);
    const ids = ((ps ?? []) as { id: string }[]).map(p => p.id);
    if (!ids.length) return NextResponse.json({ hasProfile: false, requests: [] }, noStore);

    const { data, error } = await sb().from('coach_requests')
      .select('id,user_id,kind,discipline,level,availability,message,status,created_at')
      .in('coach_id', ids).order('created_at', { ascending: false }).limit(100);
    if (error) return fail('list', error);
    type Row = { id: string; user_id: string; kind: string; discipline: string | null; level: string; availability: string[]; message: string | null; status: string; created_at: string };
    const rows = (data ?? []) as Row[];
    const uids = [...new Set(rows.map(r => r.user_id))];
    const people = new Map<string, { name: string; phone: string }>();
    if (uids.length) {
      const { data: us, error: uErr } = await sb().from('users').select('id,phone,"firstName","lastName"').in('id', uids);
      if (uErr) return fail('users', uErr);
      for (const u of (us ?? []) as (UserRow & { id: string })[]) {
        /* شماره را شاگرد پیش از ارسال دیده و پذیرفته که به مربی داده شود */
        people.set(u.id, { name: fullName(u) || 'کاربر بیلیارد هاب', phone: normMobile(u.phone) });
      }
    }
    return NextResponse.json({
      hasProfile: true,
      requests: rows.map(r => ({
        id: r.id,
        name: people.get(r.user_id)?.name ?? 'کاربر بیلیارد هاب',
        /* شماره فقط تا وقتی درخواست باز است — بسته یا لغوشده دیگر دلیلی برای تماس ندارد */
        phone: r.status === 'new' || r.status === 'contacted' ? (people.get(r.user_id)?.phone ?? '') : '',
        title: requestTitle(r.kind, r.discipline ? disciplineLabel(r.discipline) : ''),
        level: r.level,
        availability: r.availability ?? [],
        message: r.message ?? '',
        status: r.status,
        createdAt: r.created_at,
      })),
    }, noStore);
  }

  const slug = Slug.safeParse(q.get('coach') ?? '');
  if (!slug.success) return NextResponse.json({ message: 'مربی مشخص نیست' }, { status: 400 });
  const coach = await acceptingCoach(slug.data);
  if (coach === undefined) return NextResponse.json({ message: 'خواندن اطلاعات انجام نشد' }, { status: 500 });
  if (!coach) return NextResponse.json({ message: 'این مربی فعلا درخواست نمی‌پذیرد' }, { status: 404 });
  if (coach.owner_id === actor.id) return NextResponse.json({ self: true }, noStore);

  /* درخواستِ بازِ من: تازه، یا مربی ثبت کرده که تماس گرفته — در هر دو حالت فرمِ تازه
     نمی‌آید (درخواستِ دوم یعنی پیامکِ دوم به همان مربی) و شاگرد می‌تواند لغو کند */
  const [open, me] = await Promise.all([
    sb().from('coach_requests').select('id,kind,discipline,status,created_at')
      .eq('coach_id', coach.id).eq('user_id', actor.id).in('status', ['new', 'contacted'])
      .order('created_at', { ascending: false }).limit(1),
    userRow(actor.id),
  ]);
  if (open.error) return fail('open', open.error);
  if (me.error) return fail('me', me.error);
  const o = ((open.data ?? []) as { id: string; kind: string; discipline: string | null; status: string; created_at: string }[])[0];
  return NextResponse.json({
    self: false,
    phone: normMobile(me.row?.phone),
    open: o ? {
      id: o.id, status: o.status, createdAt: o.created_at,
      title: requestTitle(o.kind, o.discipline ? disciplineLabel(o.discipline) : ''),
    } : null,
  }, noStore);
}

/* POST — ارسالِ درخواست */
export async function POST(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const parsed = PostBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'اطلاعات درخواست کامل نیست' }, { status: 400 });
  const b = parsed.data;

  const message = cleanMessage(b.message);
  if (message.length > REQUEST_MESSAGE_MAX) {
    return NextResponse.json({ message: `پیام حداکثر ${REQUEST_MESSAGE_MAX.toLocaleString('fa-IR')} نویسه است` }, { status: 400 });
  }

  const coach = await acceptingCoach(b.coachSlug);
  if (coach === undefined) return NextResponse.json({ message: MSG_FAILED }, { status: 500 });
  if (!coach) return NextResponse.json({ message: 'این مربی فعلا درخواست نمی‌پذیرد' }, { status: 404 });
  if (coach.owner_id === actor.id) {
    return NextResponse.json({ message: 'برای خودتان نمی‌توانید درخواست بفرستید' }, { status: 403 });
  }

  /* رشته: فقط از رشته‌های خودِ مربی. مربیِ تک‌رشته‌ای همان را می‌گیرد؛
     مربیِ بی‌رشته (پروفایلِ قدیمی) درخواستِ بی‌رشته. */
  const discs = coachDisciplines(coach);
  let discipline: string | null = null;
  if (discs.length === 1) discipline = discs[0]!;
  else if (discs.length > 1) {
    if (!b.discipline || !discs.includes(b.discipline)) {
      return NextResponse.json({ message: 'رشته را انتخاب کنید' }, { status: 400 });
    }
    discipline = b.discipline;
  }

  const me = await userRow(actor.id);
  if (me.error) return fail('me', me.error);
  const studentPhone = normMobile(me.row?.phone);
  if (!/^09\d{9}$/.test(studentPhone)) {
    return NextResponse.json({ message: 'برای ارسال درخواست باید شماره موبایل حسابتان ثبت شده باشد' }, { status: 400 });
  }

  /* پیامِ زودترِ سقفِ روزانه — اجرای قطعی در تریگرِ ۱۱۸ است */
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const today = await sb().from('coach_requests').select('id', { count: 'exact', head: true })
    .eq('user_id', actor.id).gte('created_at', since);
  if (today.error) return fail('daily', today.error);
  if ((today.count ?? 0) >= DAILY_LIMIT) return NextResponse.json({ message: MSG_DAILY }, { status: 429 });

  const { data, error } = await sb().from('coach_requests').insert({
    coach_id: coach.id, user_id: actor.id, kind: b.kind, discipline, level: b.level,
    availability: [...new Set(b.availability)], message: message || null,
  }).select('id').single();
  if (error) {
    if (error.code === 'BH429') return NextResponse.json({ message: MSG_DAILY }, { status: 429 });
    if (error.code === 'BH430') return NextResponse.json({ message: MSG_SAME_COACH }, { status: 429 });
    if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
      return NextResponse.json({ message: 'یک درخواست بی‌پاسخ برای این مربی دارید' }, { status: 409 });
    }
    return fail('insert', error);
  }
  const id = (data as { id: string }).id;

  /* ── خبر به مربی ── بی‌صدا: خطای پیامک یا پوش نباید ثبت را بشکند */
  const title = requestTitle(b.kind, discipline ? disciplineLabel(discipline) : '');
  const studentName = fullName(me.row) || 'یک کاربر';
  const coachUser = (await userRow(coach.owner_id)).row;
  const coachName = `${coach.fn ?? ''} ${coach.ln ?? ''}`.trim() || fullName(coachUser) || 'مربی';
  notifyPattern(coachUser?.phone, 'coach_request', [coachName, title, studentName, studentPhone]);
  /* کلیدِ اشتراکِ پوش همان کلیدِ دایرکت است (شماره، وگرنه شناسه) — api/social/push */
  const pushKey = (coachUser?.phone || coach.owner_id).trim();
  void sendServicePush(pushKey, {
    title: 'درخواست تازه از شاگرد', body: `${studentName} — ${title}`, url: '/dashboard/coach', tag: `coach-req-${id}`,
  }).catch(e => console.error('[coach-requests] push:', e instanceof Error ? e.message : e));

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'COACH_REQUEST_SENT',
    entityType: 'coach', entityId: coach.id, newValue: { requestId: id, kind: b.kind, discipline },
    ip: clientIp(req) ?? undefined,
  });
  return NextResponse.json({ ok: true, id }, { status: 201 });
}

/* PATCH { id, action } — «تماس گرفتم» و «بستن» از مربی، «لغو» از شاگرد */
export async function PATCH(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const parsed = PatchBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'درخواست نامعتبر است' }, { status: 400 });
  const { id, action } = parsed.data;

  const { data: row, error: rErr } = await sb().from('coach_requests').select('id,coach_id,user_id,status').eq('id', id).maybeSingle();
  if (rErr) return fail('row', rErr);
  const r = row as { id: string; coach_id: string; user_id: string; status: string } | null;
  if (!r) return NextResponse.json({ message: 'درخواست یافت نشد' }, { status: 404 });

  let allowed = false;
  if (action === 'cancelled') {
    allowed = r.user_id === actor.id;
  } else {
    /* مالکِ همین پروفایلِ مربی، نه «اولین پروفایلِ مربیِ این حساب» */
    const { data: own, error: oErr } = await sb().from('profiles').select('id')
      .eq('id', r.coach_id).eq('kind', 'coach').eq('owner_id', actor.id).maybeSingle();
    if (oErr) return fail('owner', oErr);
    allowed = !!own;
  }
  if (!allowed) return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });

  /* از کدام وضعیت به کدام — شرط داخلِ خودِ UPDATE هم هست، چون طرفِ مقابل
     ممکن است بینِ خواندن و نوشتن همان ردیف را عوض کرده باشد */
  const from = action === 'contacted' ? ['new'] : ['new', 'contacted'];
  if (!from.includes(r.status)) {
    return NextResponse.json({ message: 'وضعیت این درخواست قبلا عوض شده، صفحه را تازه کنید' }, { status: 409 });
  }
  const now = new Date().toISOString();
  const patch = action === 'contacted' ? { status: action, contacted_at: now } : { status: action, closed_at: now };
  const { data: done, error } = await sb().from('coach_requests').update(patch).eq('id', id).in('status', from).select('id');
  if (error) return fail('update', error);
  if ((done ?? []).length === 0) {
    return NextResponse.json({ message: 'وضعیت این درخواست هم‌زمان عوض شد، صفحه را تازه کنید' }, { status: 409 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: `COACH_REQUEST_${action.toUpperCase()}`,
    entityType: 'coach', entityId: r.coach_id, newValue: { requestId: id }, ip: clientIp(req) ?? undefined,
  });
  return NextResponse.json({ ok: true, status: action });
}
