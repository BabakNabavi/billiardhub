import 'server-only'
import { z } from 'zod'
import { unstable_cache } from 'next/cache'
import { sb } from '@/lib/finance/db'
import { publicRoot } from '@/lib/supabase-config'
import { mergeIntoEmpty, type RankingsStructure, type RankingStagesMap, type TrendNotesMap } from '@/lib/rankings-store'

/* ─────────────────────────────────────────────────────────────
   خواندنِ رنکینگ — یک منبع برای دو مسیر:
     • GET /api/rankings (مرورگر، کلِ جدول‌ها)
     • رندرِ سرورِ /ranking (فقط جدولِ پیش‌فرض، برای HTMLِ اول)

   چرا رندرِ سرور: صفحه کلاینتی بود و HTMLِ اولش ۱۳۵ نویسه داشت — هیچ
   نامِ بازیکنی در آن نبود، پس جست‌وجوی «علی قره گوزلو» به این صفحه
   نمی‌رسید. کلِ جدول‌ها ۸۰ کیلوبایت است؛ در HTML فقط جدولِ پیش‌فرض
   (اسنوکر، آقایان، دسته برتر) می‌نشیند و بقیه مثلِ قبل با درخواست می‌آید.
   ───────────────────────────────────────────────────────────── */

/* سرستونِ مرحله‌ها (`rankings_stages`) — sport → gender → category → مرحله[].
   شکلِ نادرست ⟵ `{}`: صفحه بی‌ستونِ مرحله نشان داده می‌شود، نه شکسته. */
const StageZ = z.object({ title: z.string(), city: z.string(), date: z.string() })
/* سقفِ شش: خانه‌ها عرضِ ثابت دارند و بیشتر از آن در ۱۰۲۴ نام را می‌برد */
const StagesZ = z.record(z.string(), z.record(z.string(), z.record(z.string(), z.array(StageZ).max(6))))
/* مبنای صعود/نزول (`rankings_trend_note`) — sport → gender → category → متن */
const TrendNotesZ = z.record(z.string(), z.record(z.string(), z.record(z.string(), z.string().max(80))))

export interface RankingsPayload {
  board: RankingsStructure | null
  stages: RankingStagesMap
  trendNotes: TrendNotesMap
  updatedAt: string | null
}

export const EMPTY_RANKINGS: RankingsPayload = { board: null, stages: {}, trendNotes: {}, updatedAt: null }

/* «صادق حسینی» = «صادق  حسيني» = «صادق‌حسینی» — بی‌فاصله، بی‌نیم‌فاصله، ی/ک فارسی */
const nameKey = (s: string) => s.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\s‌‏‎]+/g, '')

/* ── عکسِ پروفایلِ عضو روی آواتارِ رنکینگ (خواستِ مالک، ۱۲ آبانِ ۱۴۰۵) ──
   ردیفِ رنکینگ به حساب وصل نیست، پس تطبیق با نامِ کامل است — و فقط با
   حساب‌هایی که نامشان از ثبت‌احوال تأیید شده (national_id_verified). وگرنه
   هر کسی با ثبت‌نام به نامِ «صادق حسینی» عکسِ خودش را روی ردیفِ او می‌گذاشت.
   دو حسابِ تأییدشده با یک نام ⟵ هیچ‌کدام (نمی‌دانیم کدام است). آواتاری که
   ادمین گذاشته همیشه مقدم است. خطا ⟵ جدول بی‌تغییر. */
/* ⚠️ users.avatar متنِ آزاد است — فقط عکسِ انبارِ خودمان (یا مسیرِ نسبیِ همین
   دامنه) روی صفحه‌ی عمومی می‌نشیند، نه هر نشانیِ بیرونی (پیکسلِ ردیاب) */
const ownImage = (url: string) => url.startsWith(publicRoot()) || /^\/(?!\/)/.test(url)

/* [کلیدِ نام، نشانی] — کش ۵ دقیقه: هر خواندنِ رنکینگ (API، ISR، آمار) جدولِ
   کاربران را نمی‌خواند. نامِ تکراری ⟵ null. */
const memberAvatars = unstable_cache(async (): Promise<[string, string | null][]> => {
  const { data, error } = await sb().from('users')
    .select('firstName,lastName,avatar')
    .eq('national_id_verified', true)
    .not('avatar', 'is', null)
  if (error) throw new Error(`[rankings] member avatars: ${error.message}`)
  const byName = new Map<string, string | null>()
  for (const u of (data ?? []) as { firstName?: string | null; lastName?: string | null; avatar?: string | null }[]) {
    const url = (u.avatar ?? '').trim()
    if (!ownImage(url)) continue
    const k = nameKey(`${u.firstName ?? ''}${u.lastName ?? ''}`)
    if (!k) continue
    byName.set(k, byName.has(k) ? null : url)
  }
  return [...byName]
}, ['ranking-member-avatars'], { revalidate: 300, tags: ['member-avatars'] })

async function withMemberAvatars(board: RankingsStructure): Promise<RankingsStructure> {
  let byName: Map<string, string | null>
  try { byName = new Map(await memberAvatars()) }
  catch (e) { console.error(e); return board }
  if (!byName.size) return board

  const out: RankingsStructure = {}
  for (const [sport, genders] of Object.entries(board ?? {})) {
    out[sport] = {}
    for (const [gender, cats] of Object.entries(genders ?? {})) {
      out[sport][gender] = {}
      for (const [cat, rows] of Object.entries(cats ?? {})) {
        out[sport][gender][cat] = Array.isArray(rows) ? rows.map(p => {
          if (!p || p.avatar || !p.name?.trim()) return p
          const url = byName.get(nameKey(p.name))
          return url ? { ...p, avatar: url } : p
        }) : rows
      }
    }
  }
  return out
}

/** null ⟵ خطای دیتابیس (مسیر همان پاسخِ خالیِ ۲۰۰ِ قبلی را می‌دهد) */
export async function readRankings(): Promise<RankingsPayload | null> {
  const { data, error } = await sb()
    .from('app_settings').select('key,value,updated_at').in('key', ['rankings_board', 'rankings_stages', 'rankings_trend_note'])
  if (error) return null

  const rows = (data ?? []) as { key: string; value?: unknown; updated_at?: string }[]
  const board = rows.find(r => r.key === 'rankings_board')
  const st = rows.find(r => r.key === 'rankings_stages')
  const stages = StagesZ.safeParse(st?.value ?? {})
  const notes = TrendNotesZ.safeParse(rows.find(r => r.key === 'rankings_trend_note')?.value ?? {})
  /* تاریخِ پانوشت: تازه‌ترینِ دو کلید — عوض‌شدنِ فقط سرستون هم به‌روزرسانی است */
  const updatedAt = [board?.updated_at, st?.updated_at].filter((v): v is string => !!v).sort().at(-1) ?? null
  const raw = (board?.value ?? null) as RankingsStructure | null
  return {
    board: raw ? await withMemberAvatars(raw) : null,
    stages: stages.success ? stages.data : {},
    trendNotes: notes.success ? notes.data : {},
    updatedAt,
  }
}

/** همان پیش‌فرضِ صفحه‌ی /ranking — اگر آن‌جا عوض شد این‌جا هم */
export const DEFAULT_BOARD = { sport: 'snooker', gender: 'آقایان', category: 'دسته برتر' } as const

function pick<T>(m: Record<string, Record<string, Record<string, T>>> | null | undefined): Record<string, Record<string, Record<string, T>>> {
  const { sport, gender, category } = DEFAULT_BOARD
  const v = m?.[sport]?.[gender]?.[category]
  return v === undefined ? {} : { [sport]: { [gender]: { [category]: v } } }
}

/** فقط جدولِ پیش‌فرض، برای HTMLِ اولِ /ranking. کشِ جدا ندارد: خودِ صفحه ISRِ
 *  ۶۰ثانیه است و کشِ دوم کهنگی را دو برابر می‌کرد.
 *  خطا ⟵ throw؛ page.tsx در زمانِ اجرا دوباره پرتابش می‌کند تا ISR نسخه‌ی سالمِ
 *  قبلی را نگه دارد (نه صفحه‌ی بی‌نام). */
export async function loadInitialRankings(): Promise<RankingsPayload> {
    const all = await readRankings()
    if (!all) throw new Error('[rankings] read failed')
    /* همان مسیری که مرورگر از آن رد می‌کند (رتبه از ترتیب، جداسازیِ نام و
       نام‌خانوادگی، استان) — وگرنه جدولِ HTML با جدولِ پس از بارگذاری فرق
       می‌کرد. ردیف‌های خالیِ ظرفیت بیرون: فقط بازیکنانِ واقعی. */
    const merged = all.board ? mergeIntoEmpty(all.board) : null
    const { sport, gender, category } = DEFAULT_BOARD
    const rows = merged?.[sport]?.[gender]?.[category]?.filter(p => p.name.trim() !== '')
    return {
      board: rows ? { [sport]: { [gender]: { [category]: rows } } } : null,
      stages: pick(all.stages),
      trendNotes: pick(all.trendNotes),
      /* ⚠️ عمداً null: پانوشتِ «به‌روزرسانی» با faDate (منطقه‌ی زمانیِ فرایند)
         ساخته می‌شود؛ سرورِ UTC و مرورگرِ ایران برای به‌روزرسانیِ دیروقت دو روزِ
         متفاوت می‌نوشتند (عدمِ تطابقِ hydration). مثلِ قبل پس از بارگذاری می‌آید. */
      updatedAt: null,
    }
}
