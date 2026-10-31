/* شکلِ داده‌ی عمومیِ پخش زنده — جدا از public.ts تا کامپوننتِ کلاینت فقط
   همین را وارد کند، نه ماژولی که به دیتابیس وصل است. */

import type { ChannelAccess, ChannelKind } from './policy'

export interface PublicChannel {
  id: string
  title: string
  kind: ChannelKind
  tableLabel: string | null
  tournamentId: string | null
  access: ChannelAccess
  isLive: boolean
  startedAt: string | null
  viewers: number
  club: { id: string; name: string; slug: string | null; logo: string | null }
}

export interface ArchiveItem { id: string; title: string; startedAt: string; endedAt: string | null; recordingUrl: string }
