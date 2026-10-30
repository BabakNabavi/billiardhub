import 'server-only'

/* ─────────────────────────────────────────────────────────────
   اعمالِ وضعیتِ حساب — سمتِ سرور.

   دو کار:
     ۱) خواندنِ وضعیتِ حساب برای هر درخواست (proxy.ts، login، refresh،
        actorOf). کشِ پنج‌ثانیه‌ای در حافظه. ⚠️ proxy.ts باندلِ جدایی
        دارد و کشِ خودش را؛ invalidate() فقط کشِ مسیرهای API را پاک
        می‌کند، پس اقدامِ مالک در proxy تا پنج ثانیه بعد اثر می‌کند.
        نشست‌ها اما همان لحظه باطل می‌شوند.
     ۲) اجرای اقدام‌های مالک با اثرهای جانبی و ثبت در تاریخچه.

   ⚠️ هویتِ مالک فقط از دیتابیس (`users.is_platform_owner`) می‌آید —
   نه از توکن، کوکی، شماره‌ی تلفن یا هر چیزِ سمتِ کلاینت. آن پرچم را
   فقط postgres می‌تواند بگذارد (تریگرِ مهاجرتِ ۱۱۳).

   ⚠️ تا مهاجرتِ ۱۱۳ اجرا نشده، ستون‌ها نیستند: خواندن خطا می‌دهد و
   همه «فعال» حساب می‌شوند — رفتارِ امروز، نه قفل‌شدنِ سایت.
   ───────────────────────────────────────────────────────────── */

import { getSupabaseServer } from '../supabase-server'
import { revokeAllSessions } from '../auth/store'
import { audit } from '../finance/db'
import {
  ACTIONS, BLOCKING, FEATURE_KEYS, TEMPORARY_OK, effectiveStatus,
  type AccountState, type AccountStatus, type ActionKey, type ReasonCode,
} from './policy'

const sb = () => getSupabaseServer()

const TTL_MS = 5_000
let lastError = ''
const cache = new Map<string, { at: number; state: AccountState }>()
const ACTIVE: AccountState = { status: 'active', expiresAt: null, restrictions: [], isOwner: false }

const STATE_COLUMNS = 'id,account_status,status_expires_at,feature_restrictions,is_platform_owner'

interface StateRow {
  id: string
  account_status: string | null
  status_expires_at: string | null
  feature_restrictions: string[] | null
  is_platform_owner: boolean | null
}

const toState = (r: StateRow): AccountState => ({
  status: (r.account_status ?? 'active') as AccountStatus,
  expiresAt: r.status_expires_at,
  restrictions: r.feature_restrictions ?? [],
  isOwner: !!r.is_platform_owner,
})

/** وضعیتِ حساب. کاربرِ ناموجود ⟵ deleted (توکنِ کاربرِ پاک‌شده هیچ دسترسی ندارد). */
export async function accountStateOf(userId: string): Promise<AccountState> {
  const hit = cache.get(userId)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.state
  const { data, error } = await sb().from('users').select(STATE_COLUMNS).eq('id', userId).maybeSingle()
  if (error) {
    /* پیش از مهاجرت یا خطای گذرا: رفتارِ امروز (فعال). حالتِ «مسدود»ِ
       کش‌شده اما حفظ می‌شود — یک خطای شبکه نباید مسدودی را باز کند.
       خطا یک‌بار ثبت می‌شود (کشِ ستونِ کهنه‌ی PostgREST یا غلطِ نام
       وگرنه بی‌صدا اعمال را خاموش می‌کرد) و پاسخِ fallback هم کش
       می‌شود تا هر درخواست یک پرسشِ شکست‌خورده‌ی اضافه نزند. */
    if (error.message !== lastError) { lastError = error.message; console.error('[enforcement] state read failed:', error.message) }
    if (hit && hit.state.status !== 'active') return hit.state
    cache.set(userId, { at: Date.now(), state: ACTIVE })
    return ACTIVE
  }
  const state: AccountState = data
    ? toState(data as unknown as StateRow)
    : { status: 'deleted', expiresAt: null, restrictions: [], isOwner: false }
  cache.set(userId, { at: Date.now(), state })
  if (cache.size > 5000) cache.delete(cache.keys().next().value as string)
  return state
}

export function invalidateAccountState(userId: string) {
  cache.delete(userId)
}

/** مالکِ پلتفرم؟ — فقط از دیتابیس، بی‌کش (تصمیم‌های مالک کم‌اند و حساس). */
export async function isPlatformOwner(userId: string): Promise<boolean> {
  const { data, error } = await sb().from('users').select('is_platform_owner').eq('id', userId).maybeSingle()
  if (error || !data) return false
  return (data as { is_platform_owner?: boolean }).is_platform_owner === true
}

/** آیا کد ملیِ تأییدشده مالِ حسابی مسدود/تعلیق/حذف‌شده است؟ (جلوی حسابِ جایگزین) */
export async function nationalIdBlocked(nid: string): Promise<boolean> {
  if (!/^\d{10}$/.test(nid)) return false
  const { data, error } = await sb().from('users')
    .select('account_status,status_expires_at,is_platform_owner')
    .eq('national_id', nid).in('account_status', [...BLOCKING])
  if (error || !data) return false
  return (data as { account_status: string; status_expires_at: string | null; is_platform_owner: boolean }[])
    .some(r => BLOCKING.has(effectiveStatus({
      status: r.account_status as AccountStatus, expiresAt: r.status_expires_at, isOwner: r.is_platform_owner,
    })))
}

/* ── اقدام ───────────────────────────────────────────────────── */

export interface ActionInput {
  targetId: string
  action: ActionKey
  reason: ReasonCode
  note?: string | null
  evidence?: string | null
  expiresAt?: string | null
  restrictions?: string[]
  /** برای remove_content */
  content?: { type: 'listing' | 'video'; id: string } | null
  /** همراهِ اقدامِ وضعیتی: آگهی‌ها و کسب‌وکارها هم بسته شوند */
  alsoListings?: boolean
  alsoBusiness?: boolean
}

export type ActionResult = { ok: true; id: string; status: AccountStatus; details: Record<string, unknown> } | { ok: false; status: number; message: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** اجرای اقدامِ مالک. فقط پس از تأییدِ isPlatformOwner(actor) صدا زده شود. */
export async function applyAction(actorId: string, input: ActionInput, ip: string | null): Promise<ActionResult> {
  const { targetId, action } = input
  if (!UUID.test(targetId)) return { ok: false, status: 400, message: 'شناسه‌ی کاربر نامعتبر است' }
  if (targetId === actorId) return { ok: false, status: 400, message: 'اقدام روی حسابِ خودِ مالک ممکن نیست' }

  const { data: row, error } = await sb().from('users')
    .select(STATE_COLUMNS + ',"isActive"').eq('id', targetId).maybeSingle()
  if (error) return { ok: false, status: 500, message: 'خواندنِ حساب انجام نشد' }
  if (!row) return { ok: false, status: 404, message: 'کاربر پیدا نشد' }
  const cur = toState(row as unknown as StateRow)
  if (cur.isOwner) return { ok: false, status: 403, message: 'مالکِ پلتفرم هدفِ هیچ اقدامی نیست' }
  /* تعلیقِ منقضی‌شده در عمل «فعال» است؛ تاریخچه هم همین را ثبت کند */
  const fromStatus = effectiveStatus(cur)

  const def = ACTIONS[action]
  const to = def.to
  const details: Record<string, unknown> = {}

  /* ── تغییرِ وضعیت ── */
  if (to) {
    const temporary = TEMPORARY_OK.has(to) && !!input.expiresAt
    const restrictions = to === 'limited'
      ? [...new Set((input.restrictions ?? []).filter(k => (FEATURE_KEYS as string[]).includes(k)))]
      : []
    if (to === 'limited' && !restrictions.length) {
      return { ok: false, status: 400, message: 'دست‌کم یک قابلیت را برای بستن انتخاب کنید' }
    }
    if (to === 'suspended' && !input.expiresAt) {
      return { ok: false, status: 400, message: 'تعلیق باید تاریخِ پایان داشته باشد (برای همیشه: مسدودِ دائم)' }
    }
    if (input.expiresAt && Date.parse(input.expiresAt) <= Date.now()) {
      return { ok: false, status: 400, message: 'تاریخِ پایان باید در آینده باشد' }
    }
    const { error: uErr } = await sb().from('users').update({
      account_status: to,
      status_expires_at: temporary ? input.expiresAt : null,
      feature_restrictions: restrictions,
      status_changed_at: new Date().toISOString(),
      /* سازگاری با کدِ قدیمی که isActive را می‌خواند (پروفایلِ عمومی و
         فهرست‌ها). ⚠️ اقدامِ موقت به آن دست نمی‌زند: پس از انقضا کسی
         isActive را برنمی‌گرداند و پروفایل برای همیشه پنهان می‌ماند. انسداد
         از account_status می‌آید، نه از این ستون. */
      /* false فقط برای انسدادِ دائم؛ هر وضعیتِ دیگر true — وگرنه isActive=falseِ یک
         مسدودی پس از سبک‌ترشدنِ اقدام (محدود، تعلیقِ موقت) جا می‌ماند و پروفایل
         برای همیشه پنهان. */
      isActive: !(BLOCKING.has(to) && !temporary),
    }).eq('id', targetId)
    if (uErr) return { ok: false, status: 500, message: 'ذخیره‌ی وضعیت انجام نشد' }
    invalidateAccountState(targetId)
    details.restrictions = restrictions
    /* ورود و تمدید بسته شد؛ نشست‌های باز همین حالا باطل می‌شوند */
    if (BLOCKING.has(to)) {
      await revokeAllSessions(targetId, 'enforcement:' + action)
      details.sessionsRevoked = true
    }
  }

  /* ── اثرهای جانبی ── */
  const listings = action === 'remove_listings' || (input.alsoListings && to !== null && to !== 'active') || action === 'delete'
  const business = action === 'disable_business' || (input.alsoBusiness && to !== null && to !== 'active') || action === 'delete'
  if (listings) details.listings = await removeListings(targetId)
  if (business) details.business = await disableBusiness(targetId)
  const restoring = to === 'active'
  if (action === 'restore_listings' || (restoring && input.alsoListings)) details.listingsRestored = await restoreFromHistory(targetId, 'listings')
  if (action === 'restore_business' || (restoring && input.alsoBusiness)) details.businessRestored = await restoreFromHistory(targetId, 'business')
  /* هر نوشتنِ جانبیِ ناموفق در خودِ تاریخچه می‌ماند — تاریخچه پاک‌نشدنی است،
     پس باید راست بگوید، نه «انجام شد» برای ردیفی که عوض نشد. */
  const failed = [details.listings, details.business, details.listingsRestored, details.businessRestored]
    .some(x => !!x && typeof x === 'object' && Array.isArray((x as { failed?: unknown[] }).failed))
  if (failed) details.partial = true
  if (action === 'remove_content') {
    const c = input.content
    if (!c || !UUID.test(c.id)) return { ok: false, status: 400, message: 'شناسه‌ی محتوا نامعتبر است' }
    const r = await removeContent(targetId, c.type, c.id)
    if (!r.ok) return { ok: false, status: r.status, message: r.message }
    details.content = { type: c.type, id: c.id, previous: r.previous }
  }

  /* ── تاریخچه (فقط افزودنی) ── */
  const after = to ?? fromStatus
  const { data: ins, error: hErr } = await sb().from('account_enforcement_actions').insert({
    user_id: targetId, action, from_status: fromStatus, to_status: after,
    reason_code: input.reason, internal_note: input.note || null, evidence_ref: input.evidence || null,
    restrictions: (details.restrictions as string[] | undefined) ?? [],
    expires_at: to && TEMPORARY_OK.has(to) ? input.expiresAt ?? null : null,
    actor_id: actorId, actor_role: 'platform_owner', details, ip,
  }).select('id').single()
  if (hErr || !ins) {
    console.error('[enforcement] history insert failed', hErr?.message)
    return { ok: false, status: 500, message: 'اقدام انجام شد ولی ثبتِ تاریخچه شکست خورد — دوباره بررسی کنید' }
  }
  void audit({
    actorId, actorRole: 'platform_owner', action: 'ACCOUNT_ENFORCEMENT_' + action.toUpperCase(),
    entityType: 'user', entityId: targetId,
    oldValue: { status: fromStatus }, newValue: { status: after, reason: input.reason, details }, ip,
  })
  return { ok: true, id: (ins as { id: string }).id, status: after, details }
}

/* آگهی‌های بازارِ کاربر ⟵ deleted. وضعیتِ قبلیِ هرکدام ثبت می‌شود تا برگردد.
   فقط ردیف‌هایی که واقعاً عوض شدند در فهرست می‌آیند؛ شکست در failed. */
type Row = { id: string; status?: string; isActive?: boolean }
const idsOf = (d: unknown) => new Set(((d ?? []) as { id: string }[]).map(x => x.id))

async function removeListings(userId: string) {
  const { data, error } = await sb().from('products').select('id,status').eq('sellerId', userId).neq('status', 'deleted')
  if (error) return { products: [] as Row[], failed: ['read:' + error.message] }
  const rows = (data ?? []) as Row[]
  if (!rows.length) return { products: rows }
  const { data: done, error: uErr } = await sb().from('products').update({ status: 'deleted' }).in('id', rows.map(r => r.id)).select('id')
  if (uErr) return { products: [] as Row[], failed: ['update:' + uErr.message] }
  const ok = idsOf(done)
  return { products: rows.filter(r => ok.has(r.id)) }
}

/* باشگاه‌ها ⟵ isActive=false، پروفایل‌های تخصصی (فروشگاه، مربی، …) ⟵ rejected
   (فهرست‌های عمومی فقط approved را نشان می‌دهند). وضعیتِ قبلی ثبت می‌شود. */
async function disableBusiness(userId: string) {
  const failed: string[] = []
  const { data: clubs, error: cErr } = await sb().from('clubs').select('id,"isActive"').eq('ownerId', userId).eq('isActive', true)
  if (cErr) failed.push('clubs:' + cErr.message)
  let c = (clubs ?? []) as Row[]
  if (c.length) {
    const { data: done, error } = await sb().from('clubs').update({ isActive: false }).in('id', c.map(x => x.id)).select('id')
    if (error) { failed.push('clubs:' + error.message); c = [] } else { const ok = idsOf(done); c = c.filter(x => ok.has(x.id)) }
  }
  const { data: profs, error: pErr } = await sb().from('profiles').select('id,status').eq('owner_id', userId).neq('status', 'rejected')
  if (pErr) failed.push('profiles:' + pErr.message)
  let p = (profs ?? []) as Row[]
  if (p.length) {
    const { data: done, error } = await sb().from('profiles').update({ status: 'rejected' }).in('id', p.map(x => x.id)).select('id')
    if (error) { failed.push('profiles:' + error.message); p = [] } else { const ok = idsOf(done); p = p.filter(x => ok.has(x.id)) }
  }
  return { clubs: c.map(x => ({ id: x.id, isActive: true })), profiles: p, ...(failed.length ? { failed } : {}) }
}

/* بازگرداندن: همه‌ی بستن‌هایی که از آخرین بازگرداندنِ همین نوع ثبت شده‌اند،
   نه فقط آخرینِ آن‌ها. ⚠️ مثال: تعلیق با «آگهی‌ها هم» ۵ آگهی بست، بعد حذف
   (که همیشه آگهی‌ها را می‌بندد) {products: []} نوشت — بازگرداندنِ «فقط آخرین»
   هیچ برنمی‌گرداند و «موفق» می‌گفت. وضعیتِ اصلیِ هر ردیف از قدیمی‌ترین بستن
   می‌آید. فقط ردیف‌هایی که واقعاً برگشتند شمرده می‌شوند. */
async function restoreFromHistory(userId: string, kind: 'listings' | 'business') {
  const { data, error } = await sb().from('account_enforcement_actions')
    .select('details,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(200)
  if (error) return { restored: 0, failed: ['history:' + error.message] }
  const restoredKey = kind === 'listings' ? 'listingsRestored' : 'businessRestored'
  const orig = { products: new Map<string, Row>(), clubs: new Map<string, Row>(), profiles: new Map<string, Row>() }
  for (const r of (data ?? []) as { details: Record<string, unknown> }[]) {
    /* مرز فقط بازگرداندنِ موفق؛ بازگرداندنِ ناموفق (خواندن یا نوشتنِ شکسته)
       نباید بستن‌های پشتش را برای همیشه دست‌نیافتنی کند. دوباره‌کاری بی‌خطر
       است: هر برگرداندن با eq(status/isActive) محافظت شده. */
    const prior = r.details?.[restoredKey] as { failed?: unknown[] } | undefined
    if (prior && !prior.failed?.length) break
    const d = r.details?.[kind] as Partial<Record<'products' | 'clubs' | 'profiles', Row[]>> | undefined
    if (!d) continue
    /* از جدید به قدیم می‌رویم؛ نوشتنِ دوباره یعنی قدیمی‌ترین (وضعیتِ اصلی) برنده */
    for (const k of ['products', 'clubs', 'profiles'] as const) for (const row of d[k] ?? []) orig[k].set(row.id, row)
  }
  const failed: string[] = []
  let n = 0
  for (const row of orig.products.values()) {
    const { data: d, error: e } = await sb().from('products').update({ status: row.status }).eq('id', row.id).eq('status', 'deleted').select('id')
    if (e) failed.push('product:' + row.id); else n += idsOf(d).size
  }
  if (orig.clubs.size) {
    const { data: d, error: e } = await sb().from('clubs').update({ isActive: true }).in('id', [...orig.clubs.keys()]).eq('isActive', false).select('id')
    if (e) failed.push('clubs:' + e.message); else n += idsOf(d).size
  }
  for (const row of orig.profiles.values()) {
    const { data: d, error: e } = await sb().from('profiles').update({ status: row.status }).eq('id', row.id).eq('status', 'rejected').select('id')
    if (e) failed.push('profile:' + row.id); else n += idsOf(d).size
  }
  return { restored: n, ...(failed.length ? { failed } : {}) }
}

async function removeContent(userId: string, type: 'listing' | 'video', id: string):
  Promise<{ ok: true; previous: string } | { ok: false; status: number; message: string }> {
  const t = type === 'listing'
    ? { table: 'products', owner: 'sellerId', to: 'deleted' }
    : { table: 'videos', owner: 'owner_id', to: 'hidden' }
  const { data, error } = await sb().from(t.table).select('id,status,' + `"${t.owner}"`).eq('id', id).maybeSingle()
  if (error) return { ok: false, status: 500, message: 'خواندنِ محتوا انجام نشد' }
  const r = data as Record<string, unknown> | null
  if (!r) return { ok: false, status: 404, message: 'محتوا پیدا نشد' }
  /* فقط محتوای همین کاربر — اقدام روی حسابِ یک نفر محتوای دیگری را پاک نمی‌کند */
  if (String(r[t.owner] ?? '') !== userId) return { ok: false, status: 400, message: 'این محتوا مالِ این کاربر نیست' }
  const { data: done, error: uErr } = await sb().from(t.table).update({ status: t.to }).eq('id', id).neq('status', t.to).select('id')
  if (uErr) return { ok: false, status: 500, message: 'حذفِ محتوا انجام نشد' }
  /* هیچ ردیفی عوض نشد (از پیش حذف/پنهان، یا هم‌زمان تغییر کرد) ⟵ ثبتِ «حذف شد» دروغ بود */
  if (!idsOf(done).size) return { ok: false, status: 409, message: 'این محتوا از قبل حذف یا پنهان شده است' }
  return { ok: true, previous: String(r.status ?? '') }
}

/* ── خواندن برای پنلِ مالک ─────────────────────────────────── */

export async function enforcementHistory(userId: string) {
  const { data } = await sb().from('account_enforcement_actions')
    .select('id,action,from_status,to_status,reason_code,internal_note,evidence_ref,restrictions,expires_at,actor_id,actor_role,details,created_at')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(200)
  return data ?? []
}

/** ادمینِ دیگری می‌خواهد به مالک دست بزند؟ ⟵ پاسخِ ۴۰۳ (وگرنه null).
 *  تریگرِ مهاجرتِ ۱۱۳ آخرین سد است؛ این پیامِ روشن و ثبتِ تلاش است. */
export async function ownerTargetGuard(actorId: string, targetId: string, ip?: string | null): Promise<Response | null> {
  if (!targetId || actorId === targetId) return null
  if (!(await isPlatformOwner(targetId))) return null
  if (await isPlatformOwner(actorId)) return null
  void audit({
    actorId, actorRole: 'admin', action: 'OWNER_MODIFICATION_DENIED',
    entityType: 'user', entityId: targetId, ip: ip ?? null,
  })
  return Response.json({ message: 'حسابِ مالکِ پلتفرم را هیچ ادمینی نمی‌تواند تغییر دهد' }, { status: 403 })
}
