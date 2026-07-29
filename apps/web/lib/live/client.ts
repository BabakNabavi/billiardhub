'use client'

import { apiFetch } from '../http'

export interface LiveSession {
  id: string; clubId: string; clubName: string; title: string
  ownerKey: string; discipline: string
  startedAt: number; lastBeat: number; viewers: number; ended?: boolean
}

const j = async <T>(p: Promise<Response>, fb: T): Promise<T> => {
  try { const r = await p; if (!r.ok) return fb; return (await r.json()) as T } catch { return fb }
}

export const fetchLiveSessions = () => j<LiveSession[]>(apiFetch('/api/live', { cache: 'no-store' }), [])
export const fetchLiveSession = (id: string) =>
  j<LiveSession | null>(apiFetch(`/api/live?id=${encodeURIComponent(id)}`, { cache: 'no-store' }), null)

export const startLive = (body: { clubId: string; clubName: string; ownerKey: string; title: string; discipline: string }) =>
  j<{ ok?: boolean; session?: LiveSession; message?: string }>(
    apiFetch('/api/live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start', ...body }) }), {})

export const beatLive = (id: string, ownerKey: string, viewers: number) =>
  j(apiFetch('/api/live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'beat', id, ownerKey, viewers }) }), {})

export const stopLive = (id: string, ownerKey: string) =>
  j(apiFetch('/api/live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop', id, ownerKey }) }), {})
