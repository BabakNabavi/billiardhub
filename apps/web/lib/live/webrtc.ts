'use client'
import { getSupabaseBrowser } from '../supabase-browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

/* ─────────────────────────────────────────────────────────────
   پخش زنده روی WebRTC — سیگنالینگ از کانال Realtime سوپابیس
   (همان زیرساختی که دایرکت استفاده می‌کند؛ سرویس اضافه لازم نیست).

   محدودیت صادقانه: این حالت نظیربه‌نظیر است؛ گوشیِ پخش‌کننده برای هر
   بیننده یک اتصال جدا می‌سازد. برای چند بیننده عالی کار می‌کند، ولی برای
   صدها بیننده باید سرویس SFU (مثل LiveKit یا Mux) اضافه شود. برای همین
   لایه‌ی پخش پشت یک قرارداد قرار گرفته تا بعداً بدون تغییرِ رابط عوض شود.
   ───────────────────────────────────────────────────────────── */

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ],
}
const topic = (id: string) => `live-${id}`

/* ── سمت پخش‌کننده ── */
export interface Broadcaster {
  stop: () => void
  viewerCount: () => number
}

export function startBroadcast(
  sessionId: string,
  stream: MediaStream,
  onViewers: (n: number) => void,
): Broadcaster | null {
  const sb = getSupabaseBrowser()
  if (!sb) return null

  const peers = new Map<string, RTCPeerConnection>()
  const ch: RealtimeChannel = sb.channel(topic(sessionId), { config: { broadcast: { self: false } } })

  const notify = () => onViewers(peers.size)

  const makePeer = async (viewerId: string) => {
    peers.get(viewerId)?.close()
    const pc = new RTCPeerConnection(ICE)
    peers.set(viewerId, pc)

    stream.getTracks().forEach(t => pc.addTrack(t, stream))

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
    ch.send({ type: 'broadcast', event: 'offer', payload: { to: viewerId, sdp: offer } })
    notify()
  }

  ch.on('broadcast', { event: 'join' }, p => { const v = p.payload?.viewerId; if (v) makePeer(String(v)) })
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
  }
}

/* ── سمت بیننده ── */
export interface Viewer { leave: () => void }

export function joinBroadcast(
  sessionId: string,
  onStream: (s: MediaStream) => void,
  onState: (s: 'connecting' | 'live' | 'ended' | 'error') => void,
): Viewer | null {
  const sb = getSupabaseBrowser()
  if (!sb) return null

  const viewerId = `v-${Math.random().toString(36).slice(2, 10)}`
  const pc = new RTCPeerConnection(ICE)
  const ch: RealtimeChannel = sb.channel(topic(sessionId), { config: { broadcast: { self: false } } })
  let joined = false

  pc.ontrack = e => { if (e.streams[0]) { onStream(e.streams[0]); onState('live') } }
  pc.onicecandidate = e => {
    if (e.candidate) ch.send({ type: 'broadcast', event: 'ice-viewer', payload: { from: viewerId, candidate: e.candidate } })
  }
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') onState('live')
    if (['failed', 'closed'].includes(pc.connectionState)) onState('ended')
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
  }
}
