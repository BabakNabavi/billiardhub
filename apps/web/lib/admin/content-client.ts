'use client'

/* کلاینت CRUD محتوای ادمین — روبه‌روی `/api/admin/content/[kind]`.

   چهار صفحه‌ی اخبار/رویداد/رنکینگ/رسانه تا امروز داده را در `useState`
   نگه می‌داشتند؛ یعنی هرچه ادمین می‌ساخت با یک رفرش می‌پرید. حالا همه
   از دیتابیس می‌آیند. */

import { apiFetch } from '../http'
import type { ContentKind } from './content'

export type { ContentKind }

export interface ContentItem extends Record<string, unknown> {
  id: string
}

export async function listContent<T extends ContentItem>(kind: ContentKind): Promise<T[]> {
  try {
    const r = await apiFetch(`/api/admin/content/${kind}`, { cache: 'no-store' })
    if (!r.ok) return []
    const j = await r.json().catch(() => null) as { items?: T[] } | null
    return j?.items ?? []
  } catch { return [] }
}

export interface SaveOutcome<T> { ok: boolean; item: T | null; message?: string }

export async function createContent<T extends ContentItem>(
  kind: ContentKind, data: Record<string, unknown>,
): Promise<SaveOutcome<T>> {
  try {
    const r = await apiFetch(`/api/admin/content/${kind}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const j = await r.json().catch(() => ({})) as { item?: T; message?: string }
    return r.ok ? { ok: true, item: j.item ?? null } : { ok: false, item: null, message: j.message }
  } catch { return { ok: false, item: null, message: 'خطا در ارتباط با سرور' } }
}

export async function updateContent<T extends ContentItem>(
  kind: ContentKind, id: string, data: Record<string, unknown>,
): Promise<SaveOutcome<T>> {
  try {
    const r = await apiFetch(`/api/admin/content/${kind}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id }),
    })
    const j = await r.json().catch(() => ({})) as { item?: T; message?: string }
    return r.ok ? { ok: true, item: j.item ?? null } : { ok: false, item: null, message: j.message }
  } catch { return { ok: false, item: null, message: 'خطا در ارتباط با سرور' } }
}

export async function deleteContent(kind: ContentKind, id: string): Promise<boolean> {
  try {
    const r = await apiFetch(`/api/admin/content/${kind}?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    return r.ok
  } catch { return false }
}
