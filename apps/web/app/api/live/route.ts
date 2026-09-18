export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, BUCKET, safeKey, readJsonFresh, writeJson } from '@/lib/social-server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership'
import {
  MAIN_ANGLE, MAX_ANGLES, activeAngles, newAngleId, defaultAngleLabel,
  type LiveAngle,
} from '@/lib/live/angles'

/* جلسات پخش زنده — هر جلسه یک فایل مستقل (بدون کلوبر هنگام تپش همزمان).
   جلسه‌ای که ۴۵ ثانیه تپش نفرستد، پایان‌یافته حساب می‌شود.

   ── چرا زاویه‌ها فایلِ جدا دارند ──
   یک مسابقه ممکن است با دو یا سه دوربین پخش شود و هر دوربین دستگاهِ
   خودش را دارد. اگر همه در فایلِ جلسه تپش می‌نوشتند، همان کلوبری
   برمی‌گشت که این طراحی از اولش برای فرارش ساخته شده بود: دو نوشتنِ
   هم‌زمان روی یک فایل و گم‌شدنِ یکی.

   پس هر زاویه فقط فایلِ خودش را می‌نویسد و هیچ‌کس روی نوشته‌ی دیگری
   نمی‌نویسد. زنده‌بودنِ خودِ جلسه همچنان به تپشِ دوربینِ اصلی است —
   همان دستگاهی که پخش را شروع کرده و پایانش می‌دهد. */
const DIR = 'social/live/s'
const sPath = (id: string) => `${DIR}/${safeKey(id)}.json`
const aDir  = (id: string) => `social/live/a/${safeKey(id)}`
const aPath = (id: string, angleId: string) => `${aDir(id)}/${safeKey(angleId)}.json`
const STALE = 45_000

export interface LiveSession {
  id: string
  clubId: string
  clubName: string
  title: string
  ownerKey: string
  discipline: string
  startedAt: number
  lastBeat: number
  viewers: number
  ended?: boolean
  /** فقط در پاسخِ «یک جلسه» پر می‌شود، نه در فهرست. */
  angles?: LiveAngle[]
}

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* خواندنِ زاویه‌های زنده‌ی یک جلسه. خطا هرگز نباید پاسخ را بشکند:
   بدونِ زاویه‌ها پخش همچنان با دوربینِ اصلی کار می‌کند. */
async function readAngles(id: string): Promise<LiveAngle[]> {
  try {
    /* ⚠️ سقف باید سخاوتمندانه باشد، نه MAX_ANGLES.
       فایل‌ها با نام مرتب می‌شوند و شناسه‌ی زاویه‌ها با «a-» شروع
       می‌شود، پس همه‌شان **پیش از** main.json می‌آیند. با سقفِ تنگ،
       اولین چیزی که حذف می‌شد خودِ دوربینِ اصلی بود — یعنی بیننده
       انتخابگری می‌دید که دوربینِ اصلی در آن نبود.
       هر بار افزودنِ دوربین شناسه‌ی تازه می‌سازد، پس چند بار
       اتصالِ دوباره‌ی دستگاهِ دوم هم به‌راحتی از شش می‌گذرد. */
    const { data } = await getSupabaseServer().storage.from(BUCKET).list(aDir(id), { limit: 100 })
    const names = (data ?? []).map(f => f.name).filter(n => n.endsWith('.json'))
    if (names.length === 0) return []

    /* ⚠️ به ترتیبِ فهرست اعتماد نکن — همین اعتماد بود که دوربینِ اصلی
       را قربانی می‌کرد. main.json صریح خوانده می‌شود و بقیه، تازه‌ترین
       اول، تا سقف. فایل‌های کهنه‌ی به‌جامانده هم این‌طور هزینه‌ی
       دانلود ندارند: این مسیر برای هر بیننده هر ۲۰ ثانیه اجرا می‌شود. */
    const main = `${MAIN_ANGLE}.json`
    const rest = names.filter(n => n !== main).sort().reverse().slice(0, MAX_ANGLES)
    const wanted = names.includes(main) ? [main, ...rest] : rest

    const all = await Promise.all(
      wanted.map(n => readJsonFresh<LiveAngle | null>(`${aDir(id)}/${n}`, null)),
    )
    return activeAngles(all.filter(Boolean) as LiveAngle[])
  } catch { return [] }
}

/* GET            → جلسات فعال
   GET ?id=...    → یک جلسه، همراه با دوربین‌های زنده‌اش */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const s = await readJsonFresh<LiveSession | null>(sPath(id), null)
    if (!s || s.ended || Date.now() - s.lastBeat > STALE) {
      return NextResponse.json(null, { headers: { ...CORS, 'Cache-Control': 'no-store' } })
    }
    const angles = await readAngles(id)
    return NextResponse.json({ ...s, angles }, { headers: { ...CORS, 'Cache-Control': 'no-store' } })
  }

  try {
    const { data } = await getSupabaseServer().storage.from(BUCKET).list(DIR, { limit: 200 })
    const files = (data ?? []).filter(f => f.name.endsWith('.json'))
    const all = await Promise.all(files.map(f => readJsonFresh<LiveSession | null>(`${DIR}/${f.name}`, null)))
    const now = Date.now()
    const live = (all.filter(Boolean) as LiveSession[])
      .filter(s => !s.ended && now - s.lastBeat <= STALE)
      .sort((a, b) => b.startedAt - a.startedAt)
    /* فهرست عمدا زاویه‌ها را نمی‌خواند: برای هر جلسه یک list به‌علاوه‌ی
       چند download بود، روی صفحه‌ای که هر ۱۵ ثانیه تازه می‌شود. */
    return NextResponse.json(live, { headers: { ...CORS, 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json([], { headers: { ...CORS, 'Cache-Control': 'no-store' } })
  }
}

/* POST { action:'start'|'beat'|'stop'|'add-angle', ... } */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const action = String(b?.action || '')

  /* پخش زنده به باشگاه گره خورده: فقط مالک همان باشگاه (یا ادمین)
     می‌تواند شروع کند، و فقط صاحب جلسه تپش/پایان بفرستد. */
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  if (action === 'start') {
    const clubId = String(b?.clubId || '')
    const ownerKey = actor.dmKey || actor.id
    if (!clubId) return NextResponse.json({ ok: false, message: 'داده ناقص' }, { status: 400, headers: CORS })
    if (!(await ownsClub(actor, clubId))) return NextResponse.json(FORBIDDEN, { status: 403, headers: CORS })
    const id = `lv-${Date.now()}-${Math.floor(Math.random() * 1e4)}`
    const now = Date.now()
    const s: LiveSession = {
      id, clubId, ownerKey,
      clubName: String(b?.clubName || 'باشگاه').slice(0, 60),
      title: String(b?.title || 'پخش زنده').slice(0, 90),
      discipline: String(b?.discipline || 'اسنوکر').slice(0, 30),
      startedAt: now, lastBeat: now, viewers: 0,
    }
    await writeJson(sPath(id), s)
    const main: LiveAngle = {
      id: MAIN_ANGLE,
      label: String(b?.angleLabel || 'دوربین اصلی').slice(0, 40),
      addedAt: now, lastBeat: now,
    }
    await writeJson(aPath(id, MAIN_ANGLE), main)
    return NextResponse.json({ ok: true, session: { ...s, angles: [main] } }, { status: 201, headers: CORS })
  }

  /* ── مالکیتِ مشترکِ بقیه‌ی اکشن‌ها ── */
  const id = String(b?.id || '')
  if (!id) return NextResponse.json({ ok: false }, { status: 400, headers: CORS })
  const s = await readJsonFresh<LiveSession | null>(sPath(id), null)
  if (!s) return NextResponse.json({ ok: false, message: 'جلسه یافت نشد' }, { status: 404, headers: CORS })
  /* فقط صاحب پخش می‌تواند تپش/پایان بفرستد.
     شرط قبلی به `b.ownerKey` نگاه می‌کرد و با **حذف** آن از بدنه
     کاملا دور زده می‌شد؛ حالا مبنا نشست است. */
  const me = actor.dmKey || actor.id
  if (s.ownerKey !== me && !actor.isAdmin) {
    return NextResponse.json(FORBIDDEN, { status: 403, headers: CORS })
  }

  if (action === 'add-angle') {
    const existing = await readAngles(id)
    if (existing.length >= MAX_ANGLES) {
      return NextResponse.json(
        { ok: false, message: `بیشتر از ${MAX_ANGLES} دوربین هم‌زمان ممکن نیست` },
        { status: 409, headers: CORS },
      )
    }
    const now = Date.now()
    const angle: LiveAngle = {
      id: newAngleId(),
      label: String(b?.label || defaultAngleLabel(existing.length)).slice(0, 40),
      addedAt: now, lastBeat: now,
    }
    await writeJson(aPath(id, angle.id), angle)
    return NextResponse.json({ ok: true, angle }, { status: 201, headers: CORS })
  }

  if (action === 'beat' || action === 'stop') {
    const angleId = String(b?.angleId || MAIN_ANGLE)

    /* تپشِ زاویه — فایلِ خودش، پس هیچ نوشتنِ هم‌زمانی روی هم نمی‌افتد. */
    if (action === 'beat') {
      const prev = await readJsonFresh<LiveAngle | null>(aPath(id, angleId), null)
      /* زاویه باید از قبل با add-angle ساخته شده باشد. بدونِ این شرط،
         تپش با یک شناسه‌ی دلخواه فایلِ تازه می‌ساخت و سقفِ MAX_ANGLES
         را — که فقط در add-angle بررسی می‌شود — دور می‌زد. */
      /* فایلِ زاویه نیست. دو حالت دارد: یا کسی با شناسه‌ی دلخواه تپش
         می‌فرستد (باید رد شود، وگرنه سقفِ MAX_ANGLES دور می‌خورد)، یا
         نوشتنِ add-angle در Storage شکست خورده و دوربینِ واقعی بی‌فایل
         مانده. تفکیکشان با شمردنِ زاویه‌های زنده: تا وقتی زیرِ سقف
         باشیم، دوربین خودش را ترمیم می‌کند؛ بالای سقف رد می‌شود. */
      if (angleId !== MAIN_ANGLE && !prev) {
        const liveNow = await readAngles(id)
        if (liveNow.length >= MAX_ANGLES) {
          return NextResponse.json({ ok: false, message: 'دوربین ثبت نشده است' }, { status: 404, headers: CORS })
        }
      }
      const angle: LiveAngle = {
        id: angleId,
        label: String(b?.label || prev?.label || defaultAngleLabel(0)).slice(0, 40),
        addedAt: Number(prev?.addedAt) || Date.now(),
        lastBeat: Date.now(),
      }
      await writeJson(aPath(id, angleId), angle)
    }

    /* فایلِ جلسه را فقط دوربینِ اصلی می‌نویسد. دوربینِ دوم و سوم
       دستگاه‌های جدایی‌اند و اگر آن‌ها هم این‌جا می‌نوشتند، همان
       کلوبری برمی‌گشت که فایلِ جدا برای فرارش ساخته شده. */
    if (angleId !== MAIN_ANGLE && action === 'beat') {
      return NextResponse.json({ ok: true, session: s }, { headers: CORS })
    }

    const next: LiveSession = {
      ...s, lastBeat: Date.now(),
      viewers: typeof b?.viewers === 'number' ? Math.max(0, b.viewers) : s.viewers,
      ...(action === 'stop' ? { ended: true } : {}),
    }
    await writeJson(sPath(id), next)
    return NextResponse.json({ ok: true, session: next }, { headers: CORS })
  }

  return NextResponse.json({ ok: false, message: 'action نامعتبر' }, { status: 400, headers: CORS })
}
