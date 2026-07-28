/* شمارشِ استوری‌های منتشرشده در بازه — منبع همان فایلِ ایندکسی است که
   خودِ /api/social/stories رویش می‌نویسد، تا سهمیه با واقعیت یکی بماند. */

import { DAY, P, readJson } from '../social-server'
import type { Period } from '../ads/quota'

const PERIOD_MS: Record<Period, number> = {
  day: DAY, week: 7 * DAY, month: 30 * DAY,
}

interface StoredStory { ownerKey: string; createdAt: number }

/** چند استوری در بازه‌ی جاری منتشر کرده؟ */
export async function countStories(ownerKey: string, period: Period): Promise<number> {
  if (!ownerKey) return 0
  const all = await readJson<StoredStory[]>(P.stories, [])
  const since = Date.now() - PERIOD_MS[period]
  return all.filter(s => s.ownerKey === ownerKey && s.createdAt >= since).length
}
