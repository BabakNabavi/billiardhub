/* ─────────────────────────────────────────────────────────────
   هویت (Person / Identity) — فاز ۳.

   هر شخصِ حقیقی یک ردیفِ persons دارد که با HMACِ کد ملی یکتا
   می‌شود؛ چند حسابِ کاربری می‌توانند به یک شخص وصل باشند
   (users.person_id). سهمیه‌ی رایگانِ آگهی به شخص تعلق دارد، نه به
   حساب — پس چند حسابِ یک نفر سهمیه‌ی جدا نمی‌گیرند.

   «نقشِ تأییدشده» از سیستم‌های موجود خوانده می‌شود، نه از
   primaryRole/secondaryRoles (که خوداظهاری‌اند):
     • player/coach/referee/technician/seller/manufacturer ⇐ پروفایلِ
       approved در جدولِ profiles (تأییدِ ادمین)
     • club_owner ⇐ مالکیتِ باشگاهی با verificationStatus='verified'
       (تأییدِ جواز — خودِ جواز با کد ملیِ کاربر تطبیق داده می‌شود)
     • user ⇐ همه دارند
   ───────────────────────────────────────────────────────────── */

import { createHmac, randomBytes } from 'crypto'
import { getSupabaseServer } from './supabase-server'

const sb = () => getSupabaseServer()

/* کلیدِ هشِ کد ملی عمداً از env نمی‌آید، بلکه از خودِ دیتابیسِ مشترک
   خوانده می‌شود (app_settings.person_hash_salt — جدولی که RLS دارد و
   بدونِ policy است، پس فقط service-role می‌خواندش).

   چرا: اگر کلید از env می‌آمد، هر محیطی که JWT_SECRET متفاوتی دارد
   (توسعه، پیش‌نمایش، پروداکشن) برای یک کد ملی هشِ متفاوتی می‌ساخت و
   همان شخص دو ردیفِ persons می‌گرفت ⇒ سهمیه‌ی رایگانش دو برابر
   می‌شد. نمکِ داخلِ دیتابیس این را ریشه‌کن می‌کند: همه‌ی محیط‌ها به یک
   دیتابیس وصل‌اند، پس همیشه یک کلید می‌بینند.

   NID_HMAC_SECRET اگر تنظیم شده باشد مقدم است (برای چرخاندنِ دستی). */
let saltCache: string | null = null

async function hmacKey(): Promise<string> {
  if (process.env.NID_HMAC_SECRET) return process.env.NID_HMAC_SECRET
  if (saltCache) return saltCache

  const { data } = await sb().from('app_settings').select('value').eq('key', 'person_hash_salt').maybeSingle()
  const existing = (data as { value?: unknown } | null)?.value
  if (typeof existing === 'string' && existing.length >= 32) {
    saltCache = existing
    return saltCache
  }

  /* اولین بار: نمک ساخته و ذخیره می‌شود. درجِ هم‌زمان از دو نمونه‌ی
     سرور با ON CONFLICT رد می‌شود و بعدش همان مقدارِ برنده خوانده. */
  const fresh = randomBytes(32).toString('hex')
  await sb().from('app_settings').insert({ key: 'person_hash_salt', value: fresh })
  const { data: after } = await sb().from('app_settings').select('value').eq('key', 'person_hash_salt').maybeSingle()
  const val = (after as { value?: unknown } | null)?.value
  if (typeof val === 'string' && val.length >= 32) {
    saltCache = val
    return saltCache
  }
  /* دیتابیس در دسترس نیست: به JWT_SECRET برمی‌گردیم تا مسیر نشکند؛
     ردیفِ شخص در این حالت ساخته نمی‌شود چون نوشتنش هم شکست می‌خورد. */
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('person hash key unavailable')
  return s
}

/** ارقامِ فارسی/عربی → لاتین؛ فقط رقم‌ها می‌مانند */
export function normalizeNationalId(raw: string): string {
  return String(raw ?? '')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^0-9]/g, '')
}

/** هَشِ یکتاسازِ کد ملی — خودِ کد ملی هرگز در persons ذخیره نمی‌شود */
export async function nationalIdHash(nationalId: string): Promise<string> {
  const key = await hmacKey()
  return createHmac('sha256', key).update(normalizeNationalId(nationalId)).digest('hex')
}

/* ── شخصِ یک حساب ─────────────────────────────────────────────── */

/** ردیفِ person برای این هش — اگر نبود می‌سازد (ایدمپوتنت و ضدِ race) */
async function getOrCreatePerson(hash: string): Promise<string | null> {
  const { data: found } = await sb().from('persons').select('id').eq('national_id_hash', hash).maybeSingle()
  if (found) return (found as { id: string }).id

  const { data: created, error } = await sb()
    .from('persons').insert({ national_id_hash: hash }).select('id').single()
  if (!error && created) return (created as { id: string }).id

  /* درجِ هم‌زمان از حسابِ دیگرِ همین شخص ⇒ یکتایی شکست؛ دوباره بخوان */
  const { data: again } = await sb().from('persons').select('id').eq('national_id_hash', hash).maybeSingle()
  return again ? (again as { id: string }).id : null
}

/** چرا شخص در دسترس نیست — «هویت تأیید نشده» با «دیتابیس خطا داد» یکی نیست */
export type PersonLookup =
  | { personId: string; reason: 'ok' }
  | { personId: null; reason: 'no_identity' | 'error' }

/**
 * شخصِ متصل به حساب — و اگر هنوز وصل نشده ولی کد ملیِ تأییدشده دارد،
 * همین‌جا وصل می‌شود (لینک، نه Merge؛ با NULL کردنِ person_id برگشت‌پذیر
 * است).
 *
 * تفکیکِ علت مهم است: کاربرِ تأییدشده‌ای که فقط دیتابیس لحظه‌ای جواب
 * نداده، نباید پیامِ «کد ملی‌ات را تأیید کن» ببیند و نباید سهمیه‌اش
 * دور زده شود؛ مسیرِ مصرف در این حالت fail-closed می‌شود.
 */
export async function lookupPersonForUser(userId: string): Promise<PersonLookup> {
  try {
    const { data, error } = await sb()
      .from('users')
      .select('person_id, national_id, national_id_verified')
      .eq('id', userId)
      .maybeSingle()
    if (error) return { personId: null, reason: 'error' }
    if (!data) return { personId: null, reason: 'no_identity' }
    const u = data as { person_id: string | null; national_id: string | null; national_id_verified: boolean | null }

    if (u.person_id) return { personId: u.person_id, reason: 'ok' }
    const nid = normalizeNationalId(u.national_id ?? '')
    if (!u.national_id_verified || nid.length !== 10) return { personId: null, reason: 'no_identity' }

    /* از این‌جا به بعد کاربر هویتِ تأییدشده دارد؛ هر شکستی خطای زیرساخت است */
    const personId = await getOrCreatePerson(await nationalIdHash(nid))
    if (!personId) return { personId: null, reason: 'error' }

    await sb().from('users').update({ person_id: personId }).eq('id', userId)
    return { personId, reason: 'ok' }
  } catch {
    return { personId: null, reason: 'error' }
  }
}

/** نسخه‌ی ساده برای فراخوان‌های best-effort (هوک‌های ثبت‌نام/احراز و بک‌فیل) */
export async function ensurePersonForUser(userId: string): Promise<string | null> {
  return (await lookupPersonForUser(userId)).personId
}

/** همه‌ی حساب‌های متصل به یک شخص */
export async function linkedUserIds(personId: string): Promise<string[]> {
  try {
    const { data } = await sb().from('users').select('id').eq('person_id', personId)
    return ((data as { id: string }[] | null) ?? []).map(r => r.id)
  } catch {
    return []
  }
}

/**
 * بک‌فیلِ تنبل: هر کاربرِ کدملی‌تأییدشده که هنوز شخص ندارد، وصل می‌شود.
 * عمداً در سرورِ پروداکشن اجرا می‌شود (از کران)، نه از ماشینِ توسعه —
 * چون هشِ HMAC باید با secretِ همان محیطی ساخته شود که بعداً در
 * register/quota همان هش را می‌سازد؛ وگرنه یک کد ملی دو شخص می‌گرفت.
 * ایدمپوتنت و ارزان (فقط ردیف‌های person_id IS NULL).
 */
export async function backfillPersons(): Promise<{ linked: number; skipped: number }> {
  let linked = 0
  let skipped = 0
  try {
    const { data } = await sb()
      .from('users')
      .select('id')
      .is('person_id', null)
      .eq('national_id_verified', true)
      .not('national_id', 'is', null)
      .limit(200)
    for (const row of (data as { id: string }[] | null) ?? []) {
      const pid = await ensurePersonForUser(row.id)
      if (pid) linked++
      else skipped++
    }
  } catch { /* دفعه‌ی بعدِ کران دوباره تلاش می‌شود */ }
  return { linked, skipped }
}

/* ── نقش‌های تأییدشده‌ی شخص ───────────────────────────────────── */

/** کلیدهای نقش که سهمیه می‌شناسد — profiles.kind همین‌ها را دارد (به‌جز club_owner و user) */
const PROFILE_ROLE_KINDS = ['player', 'coach', 'referee', 'technician', 'seller', 'manufacturer'] as const

/**
 * نقش‌های تأییدشده‌ی شخص، از روی همه‌ی حساب‌هایش.
 * فقط تأییدِ سرورساید شمرده می‌شود؛ primaryRole/secondaryRoles
 * (خوداظهاری) هیچ نقشی در سهمیه ندارند.
 */
export async function verifiedRolesOfPerson(personId: string): Promise<string[]> {
  const roles = new Set<string>(['user'])
  const userIds = await linkedUserIds(personId)
  if (userIds.length === 0) return [...roles]

  try {
    /* شرطِ سهمیه «تیکِ تأییدِ ادمین» (verified) است، نه فقط status —
       چون DDLِ جدولِ profiles برای status پیش‌فرضِ 'approved' دارد و
       پروفایلِ خودساخته بدونِ دخالتِ ادمین approved می‌شود؛ ولی verified
       پیش‌فرض false است و فقط از مسیرِ ادمین (reviewProfile) true می‌شود.
       بدونِ این شرط، هر کاربری با ساختنِ پروفایلِ فروشنده خودش را به
       سهمیه‌ی ۴تایی می‌رساند. */
    const { data } = await sb()
      .from('profiles')
      .select('kind')
      .in('owner_id', userIds)
      .eq('status', 'approved')
      .eq('verified', true)
    for (const r of (data as { kind: string }[] | null) ?? []) {
      if ((PROFILE_ROLE_KINDS as readonly string[]).includes(r.kind)) roles.add(r.kind)
    }
  } catch { /* نبودِ جدولِ profiles ⇒ فقط نقشِ پایه */ }

  try {
    const { data } = await sb()
      .from('clubs')
      .select('id')
      .in('ownerId', userIds)
      .eq('verificationStatus', 'verified')
      .limit(1)
    if (data && (data as unknown[]).length > 0) roles.add('club_owner')
  } catch { /* مثل بالا */ }

  return [...roles]
}
