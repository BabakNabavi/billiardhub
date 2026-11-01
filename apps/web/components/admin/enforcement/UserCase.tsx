'use client'

/* پرونده‌ی یک کاربر برای مالک: وضعیتِ فعلی، دارایی‌های عمومی، فرمِ اقدام و
   تاریخچه. */

import { useCallback, useEffect, useState } from 'react'
import { Crown, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/http'
import { faDateTime, toFaDigits } from '@/lib/jalali'
import { FEATURES, type FeatureKey } from '@/lib/enforcement/policy'
import { StatusBadge } from './StatusBadge'
import { ActionForm, type Asset } from './ActionForm'
import { HistoryList, type ActorRow, type HistoryRow } from './HistoryList'

const ROLE_FA: Record<string, string> = {
  admin: 'ادمین', club_owner: 'مالک باشگاه', player: 'بازیکن', coach: 'مربی', referee: 'داور',
  seller: 'فروشنده', manufacturer: 'تولیدکننده', technician: 'متخصص فنی', user: 'کاربر عادی',
}

interface CaseData {
  user: {
    id: string; phone: string; firstName?: string | null; lastName?: string | null; primaryRole?: string
    createdAt?: string; national_id_verified?: boolean; account_status: string
    status_expires_at: string | null; feature_restrictions: string[]; is_platform_owner: boolean
  }
  assets: { products: Asset[]; clubs: { id: string; name?: string; isActive?: boolean }[]; profiles: { id: string; kind?: string; status?: string }[]; videos: Asset[] }
  history: HistoryRow[]; actors: ActorRow[]
}

export function UserCase({ userId, onChanged }: { userId: string; onChanged: () => void }) {
  const [data, setData] = useState<CaseData | null>(null)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setErr('')
    try {
      const r = await apiFetch(`/api/owner/enforcement/${userId}`, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr((j as { message?: string }).message ?? 'پرونده خوانده نشد'); return }
      setData(j as CaseData)
    } catch { setErr('خطا در ارتباط با سرور') }
  }, [userId])

  useEffect(() => { setData(null); setNotice(''); void load() }, [load])

  if (err) return <p role="alert" className="m-0 text-sm text-danger-ink">{err}</p>
  if (!data) return (
    <p role="status" className="m-0 flex items-center gap-2 text-sm text-ink-2">
      <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden /> در حال خواندن پرونده…
    </p>
  )

  const u = data.user
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'بی‌نام'
  const a = data.assets
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="m-0 text-xl font-semibold text-ink">{name}</h2>
          <StatusBadge status={u.account_status} />
          {u.is_platform_owner && <span className="inline-flex items-center gap-1 text-xs font-bold text-gold-text"><Crown size={14} aria-hidden /> مالک پلتفرم</span>}
        </div>
        <p className="m-0 text-xs text-ink-2">
          <span dir="ltr">{toFaDigits(u.phone)}</span> · نقش: {ROLE_FA[u.primaryRole ?? ''] ?? u.primaryRole ?? '—'} · عضویت: {u.createdAt ? faDateTime(u.createdAt) : '—'}
          {u.national_id_verified ? ' · هویت تأییدشده' : ''}
        </p>
        {u.status_expires_at && <p className="m-0 text-xs text-ink-2">پایان اقدام موقت: {faDateTime(u.status_expires_at)}</p>}
        {!!u.feature_restrictions?.length && (
          <p className="m-0 text-xs text-ink-2">قابلیت‌های بسته: {u.feature_restrictions.map(k => FEATURES[k as FeatureKey]?.label ?? k).join('، ')}</p>
        )}
        <p className="m-0 text-xs text-ink-2">
          {toFaDigits(a.products.filter(p => p.status !== 'deleted').length)} آگهی فعال ·
          {' '}{toFaDigits(a.clubs.length)} باشگاه · {toFaDigits(a.profiles.length)} پروفایل · {toFaDigits(a.videos.length)} ویدیو
        </p>
      </header>

      {notice && <p role="status" className="m-0 rounded-field bg-success/10 p-3 text-sm text-success">{notice}</p>}

      {u.is_platform_owner ? (
        <p className="m-0 text-sm text-ink-2">مالک پلتفرم هدف هیچ اقدامی نیست — این را دیتابیس هم تضمین می‌کند</p>
      ) : (
        <section aria-labelledby="enf-act" className="lq-pcard flex flex-col gap-4 p-4">
          <h3 id="enf-act" className="m-0 text-sm font-bold text-ink">اقدام تازه</h3>
          <ActionForm userId={u.id} products={a.products} videos={a.videos}
            onDone={msg => { setNotice(msg); void load(); onChanged() }} />
        </section>
      )}

      <section aria-labelledby="enf-hist" className="flex flex-col gap-3">
        <h3 id="enf-hist" className="m-0 text-sm font-bold text-ink">تاریخچه‌ی اقدام‌ها</h3>
        <HistoryList rows={data.history} actors={data.actors} />
      </section>
    </div>
  )
}
