import 'server-only'
import { cache } from 'react'
import type { Metadata } from 'next'
import { sb } from '@/lib/finance/db'
import type { ProfileKind } from '@/lib/profiles/server'
import { SITE_URL } from '@/lib/site-url'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'

/* فقط ستون‌های لازم؛ ردیفِ کاملِ پروفایل (گالری، آلبوم…) برای SEO لازم نیست */
interface ProfileRow { slug: string; status: string; data: Record<string, unknown> }

/* ─────────────────────────────────────────────────────────────
   SEOِ صفحه‌ی هر پروفایل (بازیکن، مربی، داور، فروشگاه، تولیدکننده،
   متخصصِ خدمات فنی) — یک‌جا.

   ── چرا لازم شد (اندازه‌گیریِ سایتِ زنده، آبانِ ۱۴۰۵) ──
   صفحه‌ها `'use client'`اند و متادیتای فهرستِ والد را ارث می‌بردند:
   `/players/<x>` عنوانِ «بازیکنان بیلیارد» و canonicalِ `/players` داشت.
   یعنی به گوگل می‌گفت «من کپیِ فهرستم» — هیچ پروفایلی ایندکس نمی‌شد.

   داده یک‌بار خوانده می‌شود (`cache`) و هم متادیتا هم JSON-LD از آن
   ساخته می‌شوند. خواندن مهلت دارد: متادیتا رندر را بلاک می‌کند و
   دیتابیسِ معلق نباید صفحه را معلق کند.
   ───────────────────────────────────────────────────────────── */

const KIND: Record<ProfileKind, { base: string; label: string; person: boolean }> = {
  player:       { base: '/players',       label: 'بازیکن بیلیارد',             person: true },
  coach:        { base: '/coaches',       label: 'مربی بیلیارد',               person: true },
  referee:      { base: '/referees',      label: 'داور بیلیارد',               person: true },
  seller:       { base: '/sellers',       label: 'فروشگاه تجهیزات بیلیارد',    person: false },
  manufacturer: { base: '/manufacturers', label: 'تولیدکننده تجهیزات بیلیارد', person: false },
  technician:   { base: '/services',      label: 'خدمات فنی بیلیارد',          person: false },
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const first = (...vs: unknown[]) => {
  for (const v of vs) {
    const s = Array.isArray(v) ? str(v.find(x => str(x))) : str(v)
    if (s) return s
  }
  return ''
}
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)
const abs = (u: string) => (u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`)

/* سه حالتِ جدا: پیدا شد / قطعاً نیست / معلوم نشد (خطا یا مهلت).
   ⚠️ «معلوم نشد» هرگز noindex نمی‌دهد — یک کندیِ لحظه‌ای هنگامِ خزیدنِ گوگل
   پروفایلِ واقعی و تأییدشده را از نتایج بیرون می‌انداخت. */
type Lookup = { state: 'found'; row: ProfileRow } | { state: 'none' } | { state: 'unknown' }

/** پروفایل با نامک — یک‌بار در هر درخواست (`cache`)، با مهلت */
export const loadProfile = cache(async (kind: ProfileKind, slug: string): Promise<Lookup> => {
  try {
    const res = await withTimeout(
      sb().from('profiles').select('slug,status,data').eq('kind', kind).eq('slug', slug).maybeSingle(),
    )
    if (res === TIMED_OUT || res.error) return { state: 'unknown' }
    return res.data ? { state: 'found', row: res.data as ProfileRow } : { state: 'none' }
  } catch { return { state: 'unknown' } }
})

function facts(kind: ProfileKind, p: ProfileRow) {
  const d = p.data
  const k = KIND[kind]
  const name =
    kind === 'coach' || kind === 'referee' ? [str(d.firstNameFa), str(d.lastNameFa)].filter(Boolean).join(' ')
    : kind === 'seller' ? first(d.title, d.brand)
    : kind === 'technician' ? first(d.brand, d.name)
    : str(d.name)
  const city = str(d.city)
  const about = first(d.intro, d.desc, d.description, d.about, d.bio)
  const image = first(d.photo, d.logo, d.scene)
  const url = `${k.base}/${p.slug}`
  const role = `${k.label}${city ? ` در ${city}` : ''}`
  const description = clip(about ? `${name} — ${role}. ${about.replace(/\s+/g, ' ')}` : `${name} — ${role}. پروفایل، سوابق و راه ارتباطی در بیلیارد هاب.`, 158)
  return { name, city, province: str(d.province), image, url, role, description, nameEn: first(d.nameEn) }
}

/** `generateMetadata` برای layoutِ صفحه‌ی پروفایل */
export function profileMetadata(kind: ProfileKind) {
  return async ({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> => {
    const { id } = await params
    const look = await loadProfile(kind, id)
    if (look.state === 'none') return { robots: { index: false, follow: true } }
    if (look.state === 'unknown') return {}
    const p = look.row
    const f = facts(kind, p)
    /* بی‌نام: دست‌کم canonicalِ خودش — وگرنه canonicalِ فهرستِ والد را ارث می‌برد */
    if (!f.name) return { alternates: { canonical: f.url } }
    /* `absolute`: لایه‌ی فهرستِ والد عنوانِ رشته‌ای دارد و قالبِ ریشه را مصرف
       کرده؛ بی‌این پسوندِ سایت نمی‌آمد (همان تله‌ی صفحه‌ی خدمات فنی) */
    const title = `${f.name} | ${f.role} | بیلیارد هاب`
    return {
      title: { absolute: title },
      description: f.description,
      alternates: { canonical: f.url },
      /* تأییدنشده هنوز عمومی نیست */
      ...(p.status === 'approved' ? {} : { robots: { index: false, follow: false } }),
      openGraph: {
        title, description: f.description, url: f.url,
        siteName: 'بیلیارد هاب', locale: 'fa_IR', type: KIND[kind].person ? 'profile' : 'website',
        ...(f.image ? { images: [{ url: f.image, alt: f.name }] } : {}),
      },
      twitter: { card: f.image ? 'summary_large_image' : 'summary', title, description: f.description, ...(f.image ? { images: [f.image] } : {}) },
    }
  }
}

/** داده‌ی ساخت‌یافته‌ی پروفایل (schema.org) — فقط برای پروفایلِ تأییدشده */
export async function profileJsonLd(kind: ProfileKind, id: string): Promise<Record<string, unknown>[] | null> {
  const look = await loadProfile(kind, id)
  if (look.state !== 'found' || look.row.status !== 'approved') return null
  const p = look.row
  const f = facts(kind, p)
  if (!f.name) return null
  const url = abs(f.url)
  const address = f.city ? { '@type': 'PostalAddress', addressLocality: f.city, ...(f.province ? { addressRegion: f.province } : {}), addressCountry: 'IR' } : undefined
  const entity: Record<string, unknown> = KIND[kind].person
    ? {
        '@context': 'https://schema.org', '@type': 'Person', name: f.name, url,
        ...(f.nameEn ? { alternateName: f.nameEn } : {}),
        jobTitle: KIND[kind].label, description: f.description,
        ...(f.image ? { image: abs(f.image) } : {}),
        ...(address ? { address } : {}),
      }
    : {
        '@context': 'https://schema.org',
        /* Store و LocalBusiness بی‌نشانی برای گوگل نامعتبرند ⟵ Organization */
        '@type': !address ? 'Organization' : kind === 'seller' ? 'Store' : kind === 'technician' ? 'LocalBusiness' : 'Organization',
        name: f.name, url, description: f.description,
        ...(f.image ? { image: abs(f.image), logo: abs(f.image) } : {}),
        ...(address ? { address } : {}),
      }
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'بیلیارد هاب', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: KIND[kind].label, item: abs(KIND[kind].base) },
      { '@type': 'ListItem', position: 3, name: f.name, item: url },
    ],
  }
  return [entity, crumbs]
}
