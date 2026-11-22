import 'server-only'
import { sb, audit } from '@/lib/finance/db'
import { revalidateHomeFeatured } from '@/lib/home-featured'
import {
  ADMIN_REVOKE_PREFIX, SELF_REVOKE_PREFIX, ADMIN_RESTORED_NOTE, PROFILE_ROLES,
  adminRevokeNote, selfRevokeNote, noteHidProfile, markProfileRequeued,
  isRevocable, ownedRoles, removeRoleFrom, addRoleTo, revokeReasonOf,
  type RoleColumns,
} from './revoke-logic'

export { LOCKED_MESSAGE } from './revoke-logic'

/* ─────────────────────────────────────────────────────────────
   برداشتن و بازگرداندنِ نقش — تنها مسیر.
   هر دو ورودی (کاربر از /api/roles/my و ادمین از
   /api/admin/users/[id]/roles) همین را صدا می‌زنند تا پیامدها یکی بمانند.

   ── ترتیب، عمدی ──
   ۱) ردیفِ تاریخچه — در ردِ مدیریت همان قفل است، پس *اول* نوشته می‌شود و
      شکستش یعنی هیچ تغییری؛ وگرنه ادمین «انجام شد» می‌دید و کاربر بی‌درنگ
      نقش را پس می‌گرفت
   ۲) پنهان‌کردنِ پروفایلِ عمومی (`status='rejected'`، نه حذف: نقدها و جلسه‌های
      مربی با CASCADE به آن بسته‌اند) — شکستش هم یعنی نقش هنوز سرِ جاست و
      تلاشِ دوباره ممکن است
   ۳) ستون‌های نقش — از این‌جا به بعد برداشتن انجام شده
   ۴) پیامدهای کناری: باشگاهِ در انتظار رد، نشانِ فروشگاهِ رسمیِ آگهی‌ها (فقط مدیریت)

   ── باشگاه‌دار ──
   هر باشگاهِ تأییدشده (verified/approved) مانع است، فعال یا غیرفعال: باشگاهِ
   تأییدشده‌ی غیرفعال هم در verifiedRolesOfPerson نقشِ باشگاه‌دار می‌دهد و رزرو
   و تسویه‌ی جاری‌اش صاحب می‌خواهد. باشگاهِ نمایشی هم مستثنا نیست: `is_demo`
   از بدنه‌ی ساختِ باشگاه هم می‌توانست برسد.
   ───────────────────────────────────────────────────────────── */

export type RevokeMode = 'self' | 'admin'

export type RoleChangeResult =
  | { ok: true; roles: RoleColumns; effects: string[] }
  | { ok: false; status: number; message: string }

const now = () => new Date().toISOString()
const fail = (status: number, message: string): RoleChangeResult => ({ ok: false, status, message })

/** ستون‌های نقش. نبودِ کاربر ⟵ null؛ خطای دیتابیس ⟵ throw (نه «پیدا نشد») */
export async function roleColumnsOf(userId: string): Promise<RoleColumns | null> {
  const { data, error } = await sb().from('users')
    .select('"primaryRole","secondaryRoles"').eq('id', userId).maybeSingle()
  if (error) throw new Error(`users: ${error.message}`)
  if (!data) return null
  const u = data as { primaryRole?: string | null; secondaryRoles?: string[] | null }
  return { primaryRole: u.primaryRole || 'user', secondaryRoles: u.secondaryRoles ?? [] }
}

/** نقش‌هایی که مدیریت برداشته و هنوز بازنگردانده — با دلیل */
export async function lockedRolesOf(userId: string): Promise<{ role: string; reason: string; at: string | null }[]> {
  const { data, error } = await sb().from('role_requests')
    .select('role,rejection_note,reviewed_at')
    .eq('user_id', userId).eq('status', 'rejected')
    .like('rejection_note', `${ADMIN_REVOKE_PREFIX}%`)
    .order('reviewed_at', { ascending: false })
  if (error) throw new Error(`role_requests: ${error.message}`)
  const seen = new Set<string>()
  const out: { role: string; reason: string; at: string | null }[] = []
  for (const r of (data ?? []) as { role: string; rejection_note: string | null; reviewed_at: string | null }[]) {
    if (seen.has(r.role)) continue
    seen.add(r.role)
    out.push({ role: r.role, reason: revokeReasonOf(r.rejection_note), at: r.reviewed_at })
  }
  return out
}

export type LockState = 'locked' | 'free' | 'unknown'

/** آیا مدیریت این نقش را از این کاربر گرفته؟ سه‌حالته: مسیری که نقش *می‌دهد*
 *  با «نامعلوم» نباید بی‌قید نقش بدهد (fail closed)، و مسیری که فقط محتوا ذخیره
 *  می‌کند نباید با یک اختلالِ لحظه‌ای ذخیره‌ی همه را ببندد. */
export async function lockState(userId: string, role: string): Promise<LockState> {
  const { data, error } = await sb().from('role_requests')
    .select('id').eq('user_id', userId).eq('role', role).eq('status', 'rejected')
    .like('rejection_note', `${ADMIN_REVOKE_PREFIX}%`).limit(1)
  if (error) { console.error('[roles/revoke] lock check', error.message); return 'unknown' }
  return (data ?? []).length > 0 ? 'locked' : 'free'
}

export const LOCK_UNKNOWN_MESSAGE = 'بررسی وضعیت نقش انجام نشد؛ چند لحظه بعد دوباره تلاش کنید'

/* پروفایلِ پنهان ⟵ صفِ بررسی. فقط `rejected` و غیرنمایشی. */
async function requeueProfile(userId: string, role: string): Promise<boolean> {
  if (!PROFILE_ROLES.includes(role)) return false
  const { data, error } = await sb().from('profiles')
    .update({ status: 'pending', updated_at: now() })
    .eq('owner_id', userId).eq('kind', role).eq('is_demo', false).eq('status', 'rejected')
    .select('id')
  if (error) { console.error('[roles/revoke] requeue', error.message); return false }
  return (data ?? []).length > 0
}

/** کاربری که نقش را *خودش* برداشته بود و حالا برگشته (ثبتِ نهایی یا ذخیره‌ی پروفایل):
 *  پروفایل فقط اگر همان برداشتن پنهانش کرده بود به صفِ بررسی برمی‌گردد — نه پروفایلی که
 *  ادمین برای محتوایش رد کرده بود. برچسب یک‌بار مصرف می‌شود. */
export async function requeueAfterRegrant(userId: string, role: string): Promise<boolean> {
  if (!PROFILE_ROLES.includes(role)) return false
  const { data, error } = await sb().from('role_requests')
    .select('id,rejection_note').eq('user_id', userId).eq('role', role).eq('status', 'rejected')
    .like('rejection_note', `${SELF_REVOKE_PREFIX}%`)
    .order('reviewed_at', { ascending: false }).limit(1)
  if (error) { console.error('[roles/revoke] regrant', error.message); return false }
  const row = (data ?? [])[0] as { id: string; rejection_note: string } | undefined
  if (!row || !noteHidProfile(row.rejection_note)) return false
  const done = await requeueProfile(userId, role)
  if (done) {
    await sb().from('role_requests').update({ rejection_note: markProfileRequeued(row.rejection_note) }).eq('id', row.id)
  }
  return done
}

/* باشگاه‌های تأییدشده — فعال یا غیرفعال، نمایشی یا نه (شرحِ بالا) */
async function approvedClubsOf(userId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await sb().from('clubs')
    .select('id,name,"verificationStatus"').eq('ownerId', userId)
    .in('verificationStatus', ['verified', 'approved'])
  if (error) throw new Error(`clubs: ${error.message}`)
  return ((data ?? []) as { id: string; name?: string }[]).map(c => ({ id: c.id, name: String(c.name ?? '') }))
}

export async function revokeRole(opts: {
  userId: string
  role: string
  mode: RevokeMode
  actorId: string
  reason?: string
  ip?: string | null
}): Promise<RoleChangeResult> {
  const { userId, role, mode, actorId } = opts
  const reason = (opts.reason ?? '').trim()
  if (role === 'admin') return fail(403, 'دسترسی ادمین فقط از صفحه‌ی «دسترسی ادمین» برداشته می‌شود')
  if (!isRevocable(role)) return fail(400, 'این نقش برداشتنی نیست')
  if (mode === 'admin' && reason.length < 5) return fail(400, 'دلیل برداشتن نقش را بنویسید — به کاربر نشان داده می‌شود')

  let cur: RoleColumns | null
  try { cur = await roleColumnsOf(userId) } catch (e) {
    console.error('[roles/revoke]', e)
    return fail(500, 'خواندن نقش‌های کاربر انجام نشد')
  }
  if (!cur) return fail(404, 'کاربر پیدا نشد')

  /* پروفایلی که برداشتن پنهانش می‌کند — پیش از هر نوشتن، تا برچسبِ تاریخچه درست باشد */
  let visibleProfiles = 0
  if (PROFILE_ROLES.includes(role)) {
    const { data, error } = await sb().from('profiles').select('id')
      .eq('owner_id', userId).eq('kind', role).eq('is_demo', false).neq('status', 'rejected')
    if (error) { console.error('[roles/revoke] profile read', error.message); return fail(500, 'خواندن پروفایل انجام نشد') }
    visibleProfiles = (data ?? []).length
  }

  const held = ownedRoles(cur).includes(role)
  /* ادمین ردپای نقشی را هم می‌تواند ببندد که از ستون افتاده ولی پروفایل یا
     درخواستِ بازش مانده — همان چیزی که می‌خواهد پاکش کند */
  if (!held) {
    if (mode === 'self') return fail(409, 'این نقش را ندارید')
    const { data: reqs } = await sb().from('role_requests').select('id')
      .eq('user_id', userId).eq('role', role).in('status', ['draft', 'pending', 'approved']).limit(1)
    if (!visibleProfiles && !(reqs ?? []).length) return fail(409, 'این کاربر این نقش را ندارد')
  }

  if (role === 'club_owner') {
    let clubs: { id: string; name: string }[]
    try { clubs = await approvedClubsOf(userId) } catch (e) {
      console.error('[roles/revoke]', e)
      return fail(500, 'خواندن باشگاه‌ها انجام نشد')
    }
    if (clubs.length) {
      const names = clubs.slice(0, 3).map(c => `«${c.name}»`).join('، ')
      return fail(409, mode === 'self'
        ? `باشگاه ${names} به نام شما تأیید شده است؛ تا وقتی باشگاه تأییدشده‌ای دارید نقش باشگاه‌دار برداشته نمی‌شود و برای غیرفعال‌کردن یا انتقال باشگاه باید از بخش پشتیبانی پیگیری کنید`
        : `باشگاه ${names} به نام این کاربر تأیید شده است؛ اول از بخش «تأیید باشگاه‌ها» باشگاه را رد کنید و بعد نقش را بردارید`)
    }
  }

  const hides = visibleProfiles > 0
  const note = mode === 'admin' ? adminRevokeNote(reason, hides) : selfRevokeNote(hides)
  const effects: string[] = []

  /* ── ۱) تاریخچه / قفل ──
     درخواستِ باز (پیش‌نویس، در انتظار) بسته می‌شود؛ ردیفِ تأییدشده‌ی قدیمی دست
     نمی‌خورد — تاریخچه است، نه وضعیت. وضعیتِ تازه همیشه یک ردیفِ جدا است. */
  const { error: closeErr } = await sb().from('role_requests').update({
    status: 'rejected', rejection_note: note, reviewed_at: now(), reviewed_by: actorId,
  }).eq('user_id', userId).eq('role', role).in('status', ['draft', 'pending'])
  if (closeErr) console.error('[roles/revoke] close open', closeErr.message)

  const { error: rowErr } = await sb().from('role_requests').insert({
    user_id: userId, role, status: 'rejected', rejection_note: note,
    requested_at: now(), reviewed_at: now(), reviewed_by: actorId,
  })
  if (rowErr) {
    console.error('[roles/revoke] history row', rowErr.message)
    /* بی ردیف، قفلی نیست — برداشتنِ مدیریت بی‌قفل همان خنثی‌شدنِ فوری است */
    if (mode === 'admin') return fail(500, 'ثبت برداشتن نقش انجام نشد؛ هیچ تغییری اعمال نشد')
  }

  /* ── ۲) پروفایلِ عمومی ── */
  if (hides) {
    const patch: Record<string, unknown> = { status: 'rejected', updated_at: now() }
    /* «این شخص مربی نیست» ⟵ تیک و تأییدِ جواز هم می‌رود؛ با بازگرداندن خودکار برنمی‌گردد */
    if (mode === 'admin') { patch.verified = false; patch.license_verified = false }
    const { error } = await sb().from('profiles').update(patch)
      .eq('owner_id', userId).eq('kind', role).eq('is_demo', false).neq('status', 'rejected')
    if (error) {
      console.error('[roles/revoke] profile', error.message)
      return fail(500, 'پنهان‌کردن پروفایل انجام نشد؛ نقش هنوز برداشته نشده و می‌توانید دوباره تلاش کنید')
    }
    effects.push('پروفایل عمومی از سایت برداشته شد')
  }

  /* ── ۳) ستون‌ها ── */
  const next = removeRoleFrom(cur, role)
  if (held) {
    const { error } = await sb().from('users').update({
      primaryRole: next.primaryRole, secondaryRoles: next.secondaryRoles, updatedAt: now(),
    }).eq('id', userId)
    if (error) {
      console.error('[roles/revoke] users', error.message)
      return fail(500, 'برداشتن نقش انجام نشد')
    }
  }

  /* ── ۴) پیامدهای کناری — شکستشان برداشتن را برنمی‌گرداند، ولی لاگ و ممیزی می‌شود ── */
  if (role === 'club_owner') {
    const { data, error } = await sb().from('clubs')
      .update({ verificationStatus: 'rejected', isActive: false, rejectionReason: note })
      .eq('ownerId', userId).eq('verificationStatus', 'pending')
      .select('id')
    if (error) console.error('[roles/revoke] clubs', error.message)
    else if ((data ?? []).length) effects.push(`${(data ?? []).length.toLocaleString('fa-IR')} باشگاه در انتظار تأیید رد شد`)
  }

  /* فقط نشانِ «فروشگاهِ رسمی». `storeSlug` می‌ماند: ویترین با پروفایلِ ردشده خودش پنهان
     است، و پاک‌کردنِ نامک برگشت‌ناپذیر بود — بازگرداندن ویترینِ خالی تحویل می‌داد */
  if (role === 'seller' && mode === 'admin') {
    const { data, error } = await sb().from('products')
      .update({ isOfficialStore: false })
      .eq('sellerId', userId).eq('isOfficialStore', true)
      .select('id')
    if (error) console.error('[roles/revoke] products', error.message)
    else if ((data ?? []).length) effects.push(`نشان فروشگاه رسمی از ${(data ?? []).length.toLocaleString('fa-IR')} آگهی برداشته شد`)
  }

  if (role === 'club_owner' || role === 'seller') revalidateHomeFeatured()

  void audit({
    actorId, actorRole: mode === 'admin' ? 'admin' : 'user',
    action: mode === 'admin' ? 'ROLE_REVOKED_BY_ADMIN' : 'ROLE_REMOVED_BY_SELF',
    entityType: 'user', entityId: userId,
    oldValue: { primaryRole: cur.primaryRole, secondaryRoles: cur.secondaryRoles },
    newValue: { ...next, removed: role, reason: mode === 'admin' ? reason : undefined, effects },
    ip: opts.ip ?? undefined,
  })

  return { ok: true, roles: held ? next : cur, effects }
}

/** بازگرداندنِ نقشی که مدیریت برداشته بود — قفل باز می‌شود، و پروفایل اگر همان
 *  برداشتن پنهانش کرده بود به صفِ بررسی برمی‌گردد. تیک آبی، باشگاهِ ردشده و نشانِ
 *  فروشگاهِ رسمی خودکار برنمی‌گردند — هرکدام تصمیمِ جدای بخشِ خودش است. */
export async function restoreRole(opts: { userId: string; role: string; actorId: string; ip?: string | null }): Promise<RoleChangeResult> {
  const { userId, role, actorId } = opts
  if (!isRevocable(role)) return fail(400, 'این نقش بازگرداندنی نیست')

  const { data: locks, error: lErr } = await sb().from('role_requests')
    .select('id,rejection_note').eq('user_id', userId).eq('role', role).eq('status', 'rejected')
    .like('rejection_note', `${ADMIN_REVOKE_PREFIX}%`)
  if (lErr) { console.error('[roles/restore] locks', lErr.message); return fail(500, 'خواندن تاریخچه‌ی نقش انجام نشد') }
  const lockRows = (locks ?? []) as { id: string; rejection_note: string }[]
  if (!lockRows.length) return fail(409, 'این نقش برداشته نشده است')

  let cur: RoleColumns | null
  try { cur = await roleColumnsOf(userId) } catch (e) {
    console.error('[roles/restore]', e)
    return fail(500, 'خواندن نقش‌های کاربر انجام نشد')
  }
  if (!cur) return fail(404, 'کاربر پیدا نشد')

  /* قفل اول باز می‌شود تا اگر ادامه شکست، کاربر دستِ‌کم بتواند خودش دوباره درخواست دهد */
  const { error: uLock } = await sb().from('role_requests')
    .update({ rejection_note: ADMIN_RESTORED_NOTE, reviewed_at: now(), reviewed_by: actorId })
    .in('id', lockRows.map(r => r.id))
  if (uLock) { console.error('[roles/restore] unlock', uLock.message); return fail(500, 'بازگرداندن نقش انجام نشد') }

  const { error: aErr } = await sb().from('role_requests').insert({
    user_id: userId, role, status: 'approved',
    requested_at: now(), reviewed_at: now(), reviewed_by: actorId,
  })
  if (aErr) console.error('[roles/restore] approved row', aErr.message)

  const next = addRoleTo(cur, role)
  const { error: uErr } = await sb().from('users').update({
    primaryRole: next.primaryRole, secondaryRoles: next.secondaryRoles, updatedAt: now(),
  }).eq('id', userId)
  if (uErr) {
    console.error('[roles/restore] users', uErr.message)
    return fail(500, 'قفل نقش باز شد ولی دادن نقش انجام نشد؛ کاربر می‌تواند خودش دوباره این نقش را انتخاب کند')
  }

  const effects: string[] = []
  if (lockRows.some(r => noteHidProfile(r.rejection_note)) && await requeueProfile(userId, role)) {
    effects.push('پروفایل برای انتشار به صف بررسی برگشت')
  }

  void audit({
    actorId, actorRole: 'admin', action: 'ROLE_RESTORED_BY_ADMIN',
    entityType: 'user', entityId: userId,
    oldValue: { primaryRole: cur.primaryRole, secondaryRoles: cur.secondaryRoles },
    newValue: { ...next, restored: role, effects },
    ip: opts.ip ?? undefined,
  })

  return { ok: true, roles: next, effects }
}
