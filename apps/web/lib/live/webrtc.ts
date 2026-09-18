'use client'
import { getSupabaseBrowser } from '../supabase-browser'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { angleTopic, MAIN_ANGLE } from './angles'
import {
  applyQuality, preferVideoCodec, presetOf, readStats, newCursor, emptyStats,
  type QualityId, type LiveStats, type StatsCursor,
} from './quality'

/* ─────────────────────────────────────────────────────────────
   پخش زنده روی WebRTC — سیگنالینگ از کانال Realtime سوپابیس
   (همان زیرساختی که دایرکت استفاده می‌کند؛ سرویس اضافه لازم نیست).

   محدودیت صادقانه: این حالت نظیربه‌نظیر است؛ گوشی پخش‌کننده برای هر
   بیننده یک اتصال جدا می‌سازد. برای چند بیننده عالی کار می‌کند، ولی برای
   صدها بیننده باید سرویس SFU (مثل LiveKit یا Mux) اضافه شود. برای همین
   لایه‌ی پخش پشت یک قرارداد قرار گرفته تا بعدا بدون تغییر رابط عوض شود.

   هر «زاویه» (دوربین) کانالِ سیگنالینگِ مستقلِ خودش را دارد، پس
   عوض‌کردنِ دوربین از سمتِ بیننده هیچ اثری روی بقیه‌ی بیننده‌ها و
   بقیه‌ی دوربین‌ها ندارد.
   ───────────────────────────────────────────────────────────── */

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ],
}

/* ── سمت پخش‌کننده ── */
export interface Broadcaster {
  stop: () => void
  viewerCount: () => number
  /** تعویضِ تصویر بدونِ بستنِ اتصال‌ها — برای عوض‌کردنِ دوربین وسطِ پخش. */
  replaceStream: (s: MediaStream) => Promise<void>
  /** تغییرِ کیفیت وسطِ پخش، بدونِ قطعِ بیننده‌ها. */
  setQuality: (q: QualityId) => Promise<void>
  stats: () => Promise<LiveStats>
}

export function startBroadcast(
  sessionId: string,
  stream: MediaStream,
  onViewers: (n: number) => void,
  opts: { angleId?: string; quality?: QualityId } = {},
): Broadcaster | null {
  const sb = getSupabaseBrowser()
  if (!sb) return null

  const angleId = opts.angleId ?? MAIN_ANGLE
  let quality: QualityId = opts.quality ?? '1080p30'
  let current = stream

  const peers = new Map<string, RTCPeerConnection>()
  const ch: RealtimeChannel = sb.channel(angleTopic(sessionId, angleId), { config: { broadcast: { self: false } } })
  const cursor: StatsCursor = newCursor()

  const notify = () => onViewers(peers.size)

  const makePeer = async (viewerId: string) => {
    peers.get(viewerId)?.close()
    const pc = new RTCPeerConnection(ICE)
    peers.set(viewerId, pc)

    current.getTracks().forEach(t => pc.addTrack(t, current))
    /* ترتیبِ کدک باید پیش از ساختنِ offer ست شود، وگرنه در SDP نمی‌آید. */
    preferVideoCodec(pc)

    pc.onicecandidate = e => {
      if (e.candidate) ch.send({ type: 'broadcast', event: 'ice-host', payload: { to: viewerId, candidate: e.candidate } })
    }
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        pc.close(); peers.delete(viewerId); notify()
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    /* سقفِ نرخ بیت بعد از setLocalDescription معنا پیدا می‌کند —
       پیش از آن هنوز encoding‌ای وجود ندارد که رویش بنویسیم. */
    await applyQuality(pc, presetOf(quality))
    ch.send({ type: 'broadcast', event: 'offer', payload: { to: viewerId, sdp: offer } })
    notify()
  }

  ch.on('broadcast', { event: 'join' }, p => {
    const v = p.payload?.viewerId
    if (!v) return
    /* اگر وسطِ ساختنِ offer پخش متوقف شود، createOffer رد می‌شود؛
       بدونِ catch یک unhandled rejection می‌ماند و ردیفِ مرده در map. */
    void makePeer(String(v)).catch(() => { peers.delete(String(v)); notify() })
  })
  ch.on('broadcast', { event: 'answer' }, async p => {
    const { from, sdp } = p.payload ?? {}
    const pc = peers.get(String(from))
    if (pc && sdp) { try { await pc.setRemoteDescription(new RTCSessionDescription(sdp)) } catch { /* */ } }
  })
  ch.on('broadcast', { event: 'ice-viewer' }, async p => {
    const { from, candidate } = p.payload ?? {}
    const pc = peers.get(String(from))
    if (pc && candidate) { try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch { /* */ } }
  })
  ch.on('broadcast', { event: 'leave' }, p => {
    const v = String(p.payload?.viewerId ?? '')
    peers.get(v)?.close(); peers.delete(v); notify()
  })

  ch.subscribe(status => {
    /* اعلام حضور تا بیننده‌هایی که زودتر آمده‌اند دوباره تلاش کنند */
    if (status === 'SUBSCRIBED') ch.send({ type: 'broadcast', event: 'host-ready', payload: {} })
  })

  return {
    stop: () => {
      ch.send({ type: 'broadcast', event: 'host-ended', payload: {} })
      peers.forEach(p => p.close()); peers.clear()
      try { sb.removeChannel(ch) } catch { /* */ }
      notify()
    },
    viewerCount: () => peers.size,

    /* ── تعویضِ دوربین بدونِ قطعِ پخش ──
       نسخه‌ی قبلی برای عوض‌کردنِ دوربین کلِ پخش را متوقف و از نو شروع
       می‌کرد؛ یعنی همه‌ی بیننده‌ها قطع می‌شدند و باید دوباره وصل
       می‌شدند. `replaceTrack` تصویر را سرِ جای خودش عوض می‌کند و
       بیننده حتی متوجه نمی‌شود. */
    replaceStream: async (s: MediaStream) => {
      current = s
      const v = s.getVideoTracks()[0] ?? null
      const a = s.getAudioTracks()[0] ?? null
      await Promise.all([...peers.values()].map(async pc => {
        for (const sender of pc.getSenders()) {
          const want = sender.track?.kind === 'video' ? v : sender.track?.kind === 'audio' ? a : null
          if (want) { try { await sender.replaceTrack(want) } catch { /* */ } }
        }
      }))
    },

    setQuality: async (q: QualityId) => {
      quality = q
      const p = presetOf(q)
      await Promise.all([...peers.values()].map(pc => applyQuality(pc, p)))
    },

    stats: async () => {
      const first = peers.values().next().value
      return first ? readStats(first, cursor, 'outbound-rtp') : emptyStats()
    },
  }
}

/* ── سمت بیننده ── */
export type ViewerState = 'connecting' | 'live' | 'ended' | 'error'

export interface Viewer {
  leave: () => void
  stats: () => Promise<LiveStats>
}

export function joinBroadcast(
  sessionId: string,
  onStream: (s: MediaStream) => void,
  onState: (s: ViewerState) => void,
  opts: { angleId?: string } = {},
): Viewer | null {
  const sb = getSupabaseBrowser()
  if (!sb) return null

  const angleId = opts.angleId ?? MAIN_ANGLE
  const viewerId = `v-${Math.random().toString(36).slice(2, 10)}`
  const pc = new RTCPeerConnection(ICE)
  const ch: RealtimeChannel = sb.channel(angleTopic(sessionId, angleId), { config: { broadcast: { self: false } } })
  const cursor: StatsCursor = newCursor()
  let joined = false

  pc.ontrack = e => { if (e.streams[0]) { onStream(e.streams[0]); onState('live') } }
  pc.onicecandidate = e => {
    if (e.candidate) ch.send({ type: 'broadcast', event: 'ice-viewer', payload: { from: viewerId, candidate: e.candidate } })
  }
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') onState('live')
    /* ⚠️ شکستِ ICE یعنی «نتوانستم وصل شوم»، نه «پخش تمام شد».
       پیش‌تر هر دو به 'ended' می‌رفت و نتیجه‌اش بن‌بست بود: پرده‌ی
       «پخش پایان یافته است» می‌آمد، کنترل‌ها pointer-events: none
       می‌شدند و حتی دکمه‌ی دوربینِ دیگر هم کلیک نمی‌شد — در حالی که
       دوربین سالم بود و داشت تپش می‌فرستاد.
       پایانِ واقعی از رویدادِ host-ended و از propِ ended می‌آید.
       'closed' هم خودِ ما هستیم که موقعِ تمیزکاری بستیم. */
    if (pc.connectionState === 'failed') onState('error')
  }

  const join = () => { if (!joined) { joined = true } ch.send({ type: 'broadcast', event: 'join', payload: { viewerId } }) }

  ch.on('broadcast', { event: 'offer' }, async p => {
    const { to, sdp } = p.payload ?? {}
    if (to !== viewerId || !sdp) return
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      ch.send({ type: 'broadcast', event: 'answer', payload: { from: viewerId, sdp: answer } })
    } catch { onState('error') }
  })
  ch.on('broadcast', { event: 'ice-host' }, async p => {
    const { to, candidate } = p.payload ?? {}
    if (to !== viewerId || !candidate) return
    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch { /* */ }
  })
  ch.on('broadcast', { event: 'host-ready' }, () => join())
  ch.on('broadcast', { event: 'host-ended' }, () => onState('ended'))

  onState('connecting')
  ch.subscribe(status => { if (status === 'SUBSCRIBED') join() })

  return {
    leave: () => {
      ch.send({ type: 'broadcast', event: 'leave', payload: { viewerId } })
      pc.close()
      try { sb.removeChannel(ch) } catch { /* */ }
    },
    stats: () => readStats(pc, cursor, 'inbound-rtp'),
  }
}
