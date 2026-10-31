/* شکلِ پاسخِ /api/streams/manage — مشترکِ سرور و پنلِ باشگاه (بی وابستگیِ سروری). */

import type { ChannelAccess, ChannelKind, ClubLiveSettings } from './policy'

export interface MonthSummary { count: number; hours: number; peakViewers: number; viewerHours: number }

export interface OwnerChannel {
  id: string
  kind: ChannelKind
  title: string
  tableLabel: string | null
  tournamentId: string | null
  access: ChannelAccess
  record: boolean
  isLive: boolean
  adminBlocked: boolean
  blockReason: string | null
  ingestUrl: string
  /** null = رمزگشایی نشد (رازِ سرور عوض شده) ⟵ «کلید را دوباره بسازید» */
  streamKey: string | null
  createdAt: string
  viewers: number
  /** کانالِ وصل‌شده‌ی دستی (پنلِ آروان) — شروع/پایان بی‌سرویس هم کار می‌کند؛ کلید از پنلِ آروان */
  manual: boolean
  month: MonthSummary
}

export interface ManageState {
  ready: boolean
  connected: boolean
  settings?: ClubLiveSettings
  limit?: number
  month?: MonthSummary
  tournaments?: { id: string; title: string; status: string; starts_at: string | null }[]
  channels?: OwnerChannel[]
}

export type ManageAction =
  | { action: 'create'; kind: ChannelKind; title: string; tableLabel?: string; tournamentId?: string; access: ChannelAccess; record: boolean }
  | { action: 'update'; channelId: string; title?: string; access?: ChannelAccess; record?: boolean; tableLabel?: string | null }
  | { action: 'start'; channelId: string; title?: string }
  | { action: 'stop' | 'rotate-key' | 'archive'; channelId: string }
