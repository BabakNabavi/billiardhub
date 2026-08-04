export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { actorFromRequest, audit, clientIp } from '@/lib/finance/db'
import { can } from '@/lib/admin/permissions'
import {
  createDemoProfile, listDemoProfiles, deleteDemoProfile,
  PROFILE_KINDS, type ProfileKind,
} from '@/lib/profiles/server'
/* باشگاه جدولِ خودش را دارد؛ از نگاهِ ادمین ولی همان «محتوای نمایشی»
   است، پس از همین مسیر می‌گذرد و گاردِ یکسانی دارد. */
import { createDemoClub, listDemoClubs, deleteDemoClub } from '@/lib/clubs/demo'

/* ─────────────────────────────────────────────────────────────
   محتوای نمایشیِ صفحه‌های عمومی.

   سایتِ تازه‌رونمایی‌شده‌ای که همه‌ی فهرست‌هایش خالی است، به بازدیدکننده
   می‌گوید این‌جا چیزی نیست. این مسیر به ادمین اجازه می‌دهد فهرست‌ها را
   پر کند تا وقتی کسب‌وکارهای واقعی بیایند.

   ── مرزها ──
   · فقط ادمین با دسترسیِ `content`.
   · هر ردیف `is_demo = true` می‌گیرد، پس همیشه از داده‌ی واقعی جدا
     می‌ماند و یک‌جا قابلِ پاک‌شدن است.
   · تیکِ «تأییدشده» روی این‌ها گذاشته نمی‌شود — نه از این‌جا و نه از
     هیچ‌جای دیگر. آن تیک یعنی هویت استعلام شده.
   · ساخت و حذف هر دو در گزارشِ ممیزی ثبت می‌شوند.
   ───────────────────────────────────────────────────────────── */

const isKind = (v: unknown): v is ProfileKind =>
  PROFILE_KINDS.includes(String(v) as ProfileKind)

/* نامک از نام ساخته می‌شود؛ حروف فارسی در URL مشکلی ندارند ولی
   خوانا نیستند، پس اگر لاتین نبود از شمارنده استفاده می‌شود. */
function makeSlug(raw: string, kind: string): string {
  const s = String(raw ?? '').trim().toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
  const rand = Math.random().toString(36).slice(2, 7)
  return s ? `${s}-${rand}` : `${kind}-${rand}`
}

/* ── پرکردنِ فیلدهای اجباریِ هر نوع ──

   هر صفحه‌ی عمومی رکورد را با تابعِ نگاشتِ خودش به کارت تبدیل می‌کند و
   آن توابع روی فیلدهایشان مستقیم متد صدا می‌زنند: `p.ranking.replace`,
   `p.products.length`, `p.phones.filter`… اگر فیلدی نباشد، همان‌جا
   خطا می‌دهد و کلِ فهرست خالی می‌ماند — بی‌سروصدا، چون در `.catch`
   بلعیده می‌شود.

   این‌جا شکلِ کامل ساخته می‌شود تا هر ردیفِ نمایشی، از هر مسیری که
   ساخته شود، حتماً روی صفحه بنشیند. نامِ نمایشی هم برای هر نوع در
   فیلدِ درستش تکرار می‌شود (فروشگاه `title` می‌خواهد، بقیه `name`). */
function withDefaults(kind: ProfileKind, d: Record<string, unknown>): Record<string, unknown> {
  const s = (v: unknown, fb = '') => (typeof v === 'string' && v.trim() ? v : fb)
  const arr = (v: unknown) => (Array.isArray(v) ? v : [])
  const name = s(d.name) || `${s(d.firstNameFa)} ${s(d.lastNameFa)}`.trim() || 'بدون نام'
  const city = s(d.city, '—')
  const intro = s(d.shortBio) || s(d.intro) || s(d.description)
  const photo = s(d.photo) || s(d.logo) || s(d.image)

  const common = {
    ...d, name, city,
    province: s(d.province), photo,
    shortBio: intro, fullBio: s(d.fullBio, intro), description: intro, intro,
    phone: s(d.phone), whatsapp: s(d.whatsapp),
    instagram: s(d.instagram), telegram: s(d.telegram),
    gallery: arr(d.gallery), videos: arr(d.videos),
    status: 'approved', verified: false,
    submittedAt: s(d.submittedAt, new Date().toISOString()),
  }

  switch (kind) {
    case 'coach':
    case 'referee':
      return {
        ...common,
        firstNameFa: s(d.firstNameFa, name), lastNameFa: s(d.lastNameFa),
        firstNameEn: s(d.firstNameEn), lastNameEn: s(d.lastNameEn),
        disciplines: arr(d.disciplines).length ? arr(d.disciplines) : ['snooker'],
        grades: arr(d.grades), certificate: null, coverImage: s(d.coverImage),
        freeCoach: kind === 'coach',
      }

    case 'seller':
      /* کارتِ فروشگاه نام را از `title` می‌خواند، نه `name` */
      return {
        ...common, title: s(d.title, name),
        desc: intro, contactPhone: s(d.contactPhone) || s(d.phone),
        phones: arr(d.phones), brands: arr(d.brands),
        storyImage: s(d.storyImage) || photo,
      }

    case 'manufacturer':
      return {
        ...common,
        sinceYear: s(d.sinceYear, '۱۴۰۴'),
        products: arr(d.products), specialties: arr(d.specialties),
        bannerImage: s(d.bannerImage) || photo,
        tagline: s(d.tagline, intro),
      }

    case 'technician':
      return {
        ...common,
        title: s(d.title, 'خدمات فنی بیلیارد'),
        coverage: arr(d.coverage).length ? arr(d.coverage) : [city].filter(x => x !== '—'),
        about: arr(d.about).length ? arr(d.about) : [intro].filter(Boolean),
        services: arr(d.services), projects: arr(d.projects), albums: arr(d.albums),
        club: s(d.club),
      }

    case 'player':
      return {
        ...common,
        nameEn: s(d.nameEn, 'PLAYER'),
        discipline: s(d.discipline, 'snooker'),
        disciplines: arr(d.disciplines),
        country: s(d.country, 'ایران'),
        /* رشته است، نه عدد — نگاشت روی آن `replace` صدا می‌زند */
        ranking: s(d.ranking),
        national: d.national === true, youth: d.youth === true,
        gender: d.gender === 'f' ? 'f' : 'm',
        clubName: s(d.clubName), tone: s(d.tone, 'felt'),
        scene: s(d.scene) || photo,
        bio: arr(d.bio).length ? arr(d.bio) : [intro].filter(Boolean),
        careerStart: s(d.careerStart, '—'),
        highlights: arr(d.highlights), tournaments: arr(d.tournaments),
        albums: arr(d.albums), tags: arr(d.tags),
      }

    default:
      return common
  }
}

async function guard(req: NextRequest) {
  const actor = actorFromRequest(req)
  if (!actor) return { err: NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) }
  if (!(await can(actor.id, 'content'))) {
    return { err: NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 }) }
  }
  return { actor }
}

export async function GET(req: NextRequest) {
  const g = await guard(req)
  if (g.err) return g.err
  const kindParam = new URL(req.url).searchParams.get('kind')

  /* باشگاه جدولِ خودش را دارد، پس فهرستش هم از جای دیگری می‌آید — ولی
     از همین مسیر، چون از نگاهِ ادمین همان «محتوای نمایشی» است. */
  if (kindParam === 'club') {
    return NextResponse.json({ profiles: [], clubs: await listDemoClubs() })
  }

  const kind = isKind(kindParam) ? kindParam : undefined
  return NextResponse.json({
    profiles: await listDemoProfiles(kind),
    /* بدونِ فیلترِ نوع، باشگاه‌ها هم می‌آیند تا پنل یک‌بار بخواند */
    clubs: kind ? [] : await listDemoClubs(),
  })
}

export async function POST(req: NextRequest) {
  const g = await guard(req)
  if (g.err) return g.err

  const b = await req.json().catch(() => ({})) as Record<string, unknown>

  /* ── باشگاهِ نمایشی ──
     مهم‌ترین فهرستِ سایت، و تنها فهرستی که ادمین نمی‌توانست پرش کند. */
  if (b.kind === 'club') {
    const d = (b.data && typeof b.data === 'object' ? b.data : {}) as Record<string, unknown>
    const num = (v: unknown) => {
      const raw = String(v ?? '').replace(/[۰-۹]/g, x => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x)))
      return Number(raw.replace(/[^0-9]/g, '')) || 0
    }
    try {
      const club = await createDemoClub({
        ownerId: g.actor!.id,
        name: String(d.name ?? ''),
        province: String(d.province ?? ''),
        city: String(d.city ?? ''),
        address: String(d.address ?? ''),
        phone: String(d.phone ?? ''),
        description: String(d.description ?? ''),
        images: Array.isArray(d.images) ? d.images.map(String) : [],
        logo: String(d.logo ?? '') || undefined,
        snookerTables: num(d.snookerTables),
        pocketTables: num(d.pocketTables),
        highballTables: num(d.highballTables),
        vipSnookerTables: num(d.vipSnookerTables),
        hasCafe: !!d.hasCafe,
        hasParking: !!d.hasParking,
        hasWifi: !!d.hasWifi,
        hasProfessionalCoach: !!d.hasProfessionalCoach,
      })
      void audit({
        actorId: g.actor!.id, actorRole: 'admin', action: 'DEMO_CLUB_CREATED',
        entityType: 'club', entityId: club.id,
        newValue: { name: club.name, city: club.city },
        ip: clientIp(req) ?? undefined,
      })
      return NextResponse.json({ ok: true, club }, { status: 201 })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ساخت انجام نشد'
      console.error('[admin/demo-profiles] club', msg)
      /* پیامِ اعتبارسنجی به کاربر می‌رسد، خطای دیتابیس نه */
      const known = /لازم است/.test(msg)
      return NextResponse.json({ message: known ? msg : 'ساخت باشگاه انجام نشد' }, { status: known ? 400 : 500 })
    }
  }

  if (!isKind(b.kind)) {
    return NextResponse.json({ message: 'نوعِ نامعتبر' }, { status: 400 })
  }
  const data = (b.data && typeof b.data === 'object' ? b.data : {}) as Record<string, unknown>

  /* نام لازم است — بدونِ آن کارت روی صفحه بی‌معنی می‌شود */
  const name = String(
    data.firstNameFa || data.name || data.shopName || data.brandName || '',
  ).trim()
  if (!name) return NextResponse.json({ message: 'نام الزامی است' }, { status: 400 })

  try {
    const slug = makeSlug(String(b.slug || data.slug || name), b.kind)
    const profile = await createDemoProfile({
      kind: b.kind,
      ownerId: g.actor!.id,
      slug,
      /* `verified` اگر از کلاینت آمده باشد در `withDefaults` دور ریخته
         می‌شود؛ مقدارِ ستون را هم `createDemoProfile` خودش false
         می‌گذارد. یعنی دو لایه، چون این یکی جای اشتباه ندارد. */
      data: { ...withDefaults(b.kind, data), slug },
    })

    void audit({
      actorId: g.actor!.id, actorRole: 'admin', action: 'DEMO_PROFILE_CREATED',
      entityType: 'profile', entityId: profile.id,
      newValue: { kind: b.kind, slug, name },
      ip: clientIp(req) ?? undefined,
    })

    return NextResponse.json({ ok: true, profile }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'ساخت انجام نشد'
    console.error('[admin/demo-profiles] create', msg)
    return NextResponse.json({ message: 'ساخت انجام نشد' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const g = await guard(req)
  if (g.err) return g.err

  const sp = new URL(req.url).searchParams
  const id = sp.get('id') ?? ''
  if (!id) return NextResponse.json({ message: 'شناسه مشخص نیست' }, { status: 400 })

  if (sp.get('kind') === 'club') {
    /* شرطِ is_demo داخلِ خودِ تابع است، پس حتی شناسه‌ی اشتباه هم
       باشگاهِ یک کاربرِ واقعی را پاک نمی‌کند. */
    const gone = await deleteDemoClub(id)
    if (!gone) return NextResponse.json({ message: 'باشگاهِ نمایشی با این شناسه پیدا نشد' }, { status: 404 })
    void audit({
      actorId: g.actor!.id, actorRole: 'admin', action: 'DEMO_CLUB_DELETED',
      entityType: 'club', entityId: id, ip: clientIp(req) ?? undefined,
    })
    return NextResponse.json({ ok: true })
  }

  const ok = await deleteDemoProfile(id)
  if (!ok) return NextResponse.json({ message: 'ردیفِ نمایشی با این شناسه پیدا نشد' }, { status: 404 })

  void audit({
    actorId: g.actor!.id, actorRole: 'admin', action: 'DEMO_PROFILE_DELETED',
    entityType: 'profile', entityId: id,
    ip: clientIp(req) ?? undefined,
  })
  return NextResponse.json({ ok: true })
}
