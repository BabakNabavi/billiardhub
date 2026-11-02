import 'server-only'
import { unstable_cache } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase-server'
import { isUUID } from '@/lib/slug'
import { stripClubPrivate } from './private-fields'

/* ─────────────────────────────────────────────────────────────
   شکلِ باشگاه برای صفحه‌ی عمومی — یک منبع برای دو مسیر:
     • GET /api/clubs/[id] (مرورگر، با تشخیصِ مالک/ادمین)
     • رندرِ سرورِ صفحه‌ی /clubs/[id] (مقدارِ اولیه، همیشه نگاهِ عمومی)

   چرا رندرِ سرور: صفحه کلاینتی است و تا امروز HTMLِ اولش فقط چرخنده‌ی
   «در حال بارگذاری» بود — گوگل از هیچ باشگاهی نام، نشانی، میزها و
   خدمات را نمی‌دید (اندازه‌گیری: ~۱۴۴ نویسه متن). حالا همان داده‌ای که
   مرورگر می‌گرفت از اول در HTML است.
   ───────────────────────────────────────────────────────────── */

export function shapeClub(
  row: Record<string, unknown>,
  { isMine, privileged }: { isMine: boolean; privileged: boolean },
): Record<string, unknown> {
  let safe: Record<string, unknown> = { ...row }
  if (!privileged) {
    /* شبا، کارت و نامِ صاحب حساب فقط برای مالک و ادمین */
    safe = stripClubPrivate(safe)
    /* دعوتِ پذیرفته‌نشده‌ی مربی عمومی نیست */
    if (Array.isArray(safe.coaches)) {
      safe.coaches = (safe.coaches as { status?: unknown }[])
        .filter(c => (typeof c?.status === 'string' ? c.status : 'accepted') === 'accepted')
    }
  }
  /* باشگاهِ نمایشی را ادمین ساخته — نامِ او «مدیر» نیست (خواستِ مالک) */
  if (row.is_demo === true) safe.managerName = ''
  return {
    ...safe,
    isMine,
    isVerified: row.verificationStatus === 'verified',
    /* `hasActiveStory` ستون نیست — از تاریخِ انقضا ساخته می‌شود */
    hasActiveStory: !!row.storyExpiresAt && new Date(String(row.storyExpiresAt)).getTime() > Date.now(),
  }
}

async function readClubRow(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabaseServer()
  const { data, error } = isUUID(id)
    ? await supabase.from('clubs').select('*').eq('id', id).maybeSingle()
    : await supabase.from('clubs').select('*').eq('slug', id).maybeSingle()
  /* throw، نه null: نتیجه‌ی خطا نباید یک دقیقه کش شود (page.tsx می‌گیردش) */
  if (error) throw new Error(`[public-club] ${error.message}`)
  return (data as Record<string, unknown> | null) ?? null
}

/* سنگین‌ها بیرون از HTMLِ اول: آلبوم‌ها (ممکن است عکسِ base64 داشته باشند) و
   ویدیوهای گالری در تبِ اول دیده نمی‌شوند و درخواستِ پس از بارگذاری
   کاملشان را می‌آورد. روی شبکه‌ی کندِ موبایل هر مگابایتِ HTML ثانیه‌هاست. */
const HEAVY = ['albums', 'galleryVideos'] as const

/** نگاهِ عمومی به یک باشگاه برای رندرِ سرور — کشِ ۶۰ ثانیه (PUT/DELETE باطلش
 *  می‌کنند). null یعنی «پیدا نشد»؛ خطای دیتابیس throw می‌شود و کش نمی‌شود. */
export function loadPublicClub(rawId: string): Promise<Record<string, unknown> | null> {
  const id = rawId.trim().toLowerCase()
  if (!/^[0-9a-z-]{1,64}$/.test(id)) return Promise.resolve(null)
  return unstable_cache(
    async () => {
      const row = await readClubRow(id)
      if (!row) return null
      const shaped = shapeClub(row, { isMine: false, privileged: false })
      for (const k of HEAVY) delete shaped[k]
      return shaped
    },
    ['public-club', id],
    { revalidate: 60, tags: ['clubs', `club:${id}`] },
  )()
}
