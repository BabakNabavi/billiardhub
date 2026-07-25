'use client'
import { getSupabaseBrowser } from './supabase-browser'
import type { DMsg } from './social'

/* باید دقیقاً با safeKey/dmTopic سمت‌سرور یکی باشد. */
const topicOf = (key: string) => `dm-user-${(key || 'x').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80)}`

export interface MsgEvent { convId: string; message: DMsg; from: { key: string; name: string; role?: string } }
export interface ReadEvent { convId: string; reader: string; at: number }

export interface DMHandlers {
  onMsg?: (p: MsgEvent) => void
  onRead?: (p: ReadEvent) => void
  onStatus?: (s: string) => void
}

/* اشتراک به کانالِ دایرکتِ خودم؛ تابعِ لغو برمی‌گرداند. */
export function subscribeDM(meKey: string, h: DMHandlers): () => void {
  const sb = getSupabaseBrowser()
  if (!sb || !meKey) return () => {}
  const ch = sb.channel(topicOf(meKey), { config: { broadcast: { self: false } } })
  if (h.onMsg) ch.on('broadcast', { event: 'msg' }, (p: { payload: MsgEvent }) => h.onMsg!(p.payload))
  if (h.onRead) ch.on('broadcast', { event: 'read' }, (p: { payload: ReadEvent }) => h.onRead!(p.payload))
  ch.subscribe((status) => { h.onStatus?.(status) })
  return () => { try { sb.removeChannel(ch) } catch { /* noop */ } }
}
