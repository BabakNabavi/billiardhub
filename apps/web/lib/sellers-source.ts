import 'server-only'
import { getSupabaseServer } from './supabase-server'

/* ─────────────────────────────────────────────────────────────
   منبعِ واحدِ «فروشگاه‌های عمومی».

   ── چرا این فایل ساخته شد ──
   دو سیستمِ فروشگاه هم‌زمان زنده بودند:

     الف) جدولِ `profiles` با `kind='seller'` — چیزی که پنلِ فروشگاه
          (`app/dashboard/seller/page.tsx`) می‌نویسد، صفحه‌ی
          `/sellers` فهرست می‌کند و `/sellers/<slug>` نشان می‌دهد.

     ب) ستونِ `users.sellerProfile` با `primaryRole='seller'` — چیزی
          که `/api/sellers` می‌خواند، و صفحه‌ی اصلی و نوارِ استوری از
          همان تغذیه می‌شدند.

   هیچ کدی در پروژه (ب) را **نمی‌نویسد** — فقط می‌خوانَد. اندازه‌گیریِ
   Production این را تأیید کرد:

       GET /api/sellers          →  []
       GET /api/profiles/seller  →  «آرتا تجهیزات بیلیارد» (نامک `7`)

   یعنی فروشگاهِ واقعی در `/sellers` دیده می‌شد ولی صفحه‌ی اصلی خالی
   بود و نوارِ استوری هرگز نمی‌توانست پیدایش کند.

   ── نکته‌ی دوم که همین‌جا درست می‌شود ──
   کارتِ فروشگاه در صفحه‌ی اصلی به `/sellers/<id>` می‌رود و تا امروز
   `id` **شناسه‌ی کاربر** بود، در حالی که آن صفحه با **نامک** کار
   می‌کند. پس حتی اگر کارتی نشان داده می‌شد، کلیکش به فروشگاهِ
   پیدانشده می‌رسید. حالا `id` همان نامک است.

   `ownerId` جداگانه برمی‌گردد چون استوریِ فروشگاه با شناسه‌ی کاربر
   کلید می‌خورد (`/api/sellers/<ownerId>/stories` — همان چیزی که پنل
   می‌نویسد).
   ───────────────────────────────────────────────────────────── */

export interface PublicStore {
  /** نامکِ فروشگاه — مقصدِ `/sellers/<id>` */
  id: string
  /** شناسه‌ی کاربرِ مالک — کلیدِ استوری و مالکیت */
  ownerId: string
  firstName: string
  lastName: string
  avatar: string
  sellerProfile: { storeName: string; city: string; logo: string; specialty: string }
  /** استوریِ تک‌عکسیِ پنلِ فروشگاه (جدا از فهرستِ چنداستوریِ Storage) */
  storyImage: string
  storyText: string
}

const s = (v: unknown) => String(v ?? '').trim()

export async function listPublicStores(limit = 24): Promise<PublicStore[]> {
  const sb = getSupabaseServer()

  const { data, error } = await sb
    .from('profiles')
    .select('slug,owner_id,data')
    .eq('kind', 'seller')
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error || !Array.isArray(data)) return []

  type Row = { slug: string; owner_id: string; data: Record<string, unknown> | null }
  const rows = data as Row[]

  /* نام و عکسِ مالک در یک درخواست، نه یکی به‌ازای هر فروشگاه */
  const owners = [...new Set(rows.map(r => r.owner_id).filter(Boolean))]
  type U = { id: string; firstName?: string; lastName?: string; avatar?: string }
  const byOwner = new Map<string, U>()
  if (owners.length) {
    const { data: us } = await sb.from('users').select('id, firstName, lastName, avatar').in('id', owners)
    for (const u of (us ?? []) as U[]) byOwner.set(u.id, u)
  }

  return rows.map(r => {
    const d = r.data ?? {}
    const u = byOwner.get(r.owner_id) ?? ({} as U)
    const brands = Array.isArray(d.brands) ? (d.brands as unknown[]).map(s).filter(Boolean) : []
    return {
      id: s(r.slug),
      ownerId: s(r.owner_id),
      firstName: s(u.firstName),
      lastName: s(u.lastName),
      avatar: s(u.avatar),
      sellerProfile: {
        storeName: s(d.title) || s(d.brand),
        city: s(d.city),
        logo: s(d.logo),
        specialty: brands[0] || 'تجهیزات بیلیارد',
      },
      storyImage: s(d.storyImage),
      storyText: s(d.storyText),
    }
  })
}
