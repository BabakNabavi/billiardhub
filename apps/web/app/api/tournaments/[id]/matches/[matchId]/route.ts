export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { getTournament } from '@/lib/tournaments/server';

/* یک بازی براکت — ثبت نتیجه، شروع/توقف، و شماره‌ی میز.

   ثبت نتیجه از تابع اتمیک `bh_match_report` می‌گذرد چون سه کار با هم
   انجام می‌شود (امتیاز، برنده، صعود به دور بعد) و نصفه‌کاره ماندنشان
   براکت را ناسازگار می‌کند. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  req: NextRequest, ctx: { params: Promise<{ id: string; matchId: string }> },
) {
  const { id, matchId } = await ctx.params;
  if (!UUID.test(id) || !UUID.test(matchId)) {
    return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });
  }

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const t = await getTournament(id);
  if (!t) return NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 });
  if (!(await ownsClub(actor, t.club_id))) return NextResponse.json(FORBIDDEN, { status: 403 });

  /* بازی باید واقعاً مال همین مسابقه باشد — matchId از کلاینت می‌آید */
  const { data: m } = await sb().from('tournament_matches')
    .select('id,tournament_id,status').eq('id', matchId).maybeSingle();
  const match = m as { id: string; tournament_id: string; status: string } | null;
  if (!match || match.tournament_id !== id) {
    return NextResponse.json({ message: 'بازی یافت نشد' }, { status: 404 });
  }

  const b = await req.json().catch(() => ({}));

  /* ── ثبت نتیجه ── */
  if (b?.score1 !== undefined || b?.score2 !== undefined) {
    const s1 = Math.round(Number(b?.score1));
    const s2 = Math.round(Number(b?.score2));
    if (!Number.isFinite(s1) || !Number.isFinite(s2)) {
      return NextResponse.json({ message: 'امتیاز معتبر نیست' }, { status: 400 });
    }

    const { data, error } = await sb().rpc('bh_match_report', {
      p_match_id: matchId, p_score1: s1, p_score2: s2,
    });
    if (error) {
      console.error('[matches/report]', error.message);
      return NextResponse.json({ message: 'ثبت نتیجه انجام نشد' }, { status: 500 });
    }
    const res = data as { ok: boolean; message?: string; code?: string };
    if (!res?.ok) return NextResponse.json(res, { status: 409 });

    void audit({
      actorId: actor.id, actorRole: 'club_owner', action: 'MATCH_RESULT_REPORTED',
      entityType: 'tournament_match', entityId: matchId,
      newValue: { score1: s1, score2: s2, winner: res.ok ? (data as { winner?: number }).winner : null },
      ip: clientIp(req) ?? undefined,
    });

    return NextResponse.json(res);
  }

  /* ── شروع/توقف بازی و شماره‌ی میز ──
     این‌ها برنده تعیین نمی‌کنند، پس تابع اتمیک لازم ندارند. */
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (b?.status === 'in_progress' || b?.status === 'waiting') {
    /* بازی تمام‌شده با این مسیر باز نمی‌شود — برای اصلاح نتیجه باید
       امتیاز جدید فرستاده شود تا صعود دور بعد هم درست شود. */
    if (match.status === 'completed') {
      return NextResponse.json(
        { message: 'برای تغییر بازی تمام‌شده، نتیجه‌ی جدید را ثبت کنید' }, { status: 409 });
    }
    patch.status = b.status;
    if (b.status === 'in_progress') patch.started_at = new Date().toISOString();
  }

  if (b?.tableNumber !== undefined) {
    const n = Math.round(Number(b.tableNumber));
    patch.table_number = Number.isFinite(n) && n > 0 && n < 1000 ? n : null;
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ message: 'تغییری فرستاده نشد' }, { status: 400 });
  }

  const { error } = await sb().from('tournament_matches').update(patch).eq('id', matchId);
  if (error) return NextResponse.json({ message: 'به‌روزرسانی انجام نشد' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
