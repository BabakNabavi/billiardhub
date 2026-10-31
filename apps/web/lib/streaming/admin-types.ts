/* شکلِ پاسخِ /api/admin/streams — مشترکِ سرور و پنلِ مدیر. */

import type { ChannelAccess, ChannelKind, ClubLiveSettings } from './policy'
import type { MonthSummary } from './manage-types'

export interface AdminBroadcast {
  id: string; title: string; startedAt: string; endedAt: string | null; endedReason: string | null
  peakViewers: number; viewerSeconds: number; recordingUrl: string | null; recordingHidden: boolean
}

export interface AdminChannel {
  id: string; kind: ChannelKind; title: string; tableLabel: string | null; access: ChannelAccess
  isLive: boolean; viewers: number; manual: boolean; adminBlocked: boolean; blockReason: string | null
  month: MonthSummary; recent: AdminBroadcast[]
}

export interface AdminClub {
  clubId: string; name: string; slug: string | null
  settings: ClubLiveSettings; limit: number; month: MonthSummary
  channels: AdminChannel[]
}

export interface AdminState {
  ready: boolean; connected: boolean; provider: string | null
  month?: MonthSummary
  clubs: AdminClub[]
  allClubs?: { id: string; name: string }[]
}

export type AdminAction =
  | { action: 'block-channel'; channelId: string; reason: string }
  | { action: 'unblock-channel' | 'force-stop'; channelId: string }
  | { action: 'block-club'; clubId: string; reason: string }
  | { action: 'unblock-club'; clubId: string }
  | { action: 'set-tier'; clubId: string; tier: 'standard' | 'pro'; channelLimit?: number }
  | { action: 'hide-recording' | 'show-recording'; broadcastId: string }
  | { action: 'archive-channel'; channelId: string }
  | { action: 'attach-manual'; clubId: string; kind: 'club' | 'table'; title: string; tableLabel?: string
      access: 'public' | 'members'; ingestUrl: string; streamKey: string; playbackUrl: string }
