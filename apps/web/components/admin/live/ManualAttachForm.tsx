'use client'

/* «وصلِ کانالِ آروان به یک باشگاه» — تا وقتی کلیدِ API نداریم.
   سه چیز از صفحه‌ی کانال در پنلِ آروان کپی می‌شود: لینکِ ورودی، کلید،
   و نشانیِ .m3u8 (در «لینک‌های رایج» یا کدِ embed). */

import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { AdminAction } from '@/lib/streaming/admin-types'

const field = 'min-h-11 w-full rounded-field border border-line/10 bg-paper px-3 text-sub text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep'

export function ManualAttachForm({ clubs, busy, run }: {
  clubs: { id: string; name: string }[]; busy: boolean
  run: (a: AdminAction) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [clubId, setClubId] = useState('')
  const [title, setTitle] = useState('')
  const [ingestUrl, setIngest] = useState('')
  const [streamKey, setKey] = useState('')
  const [playbackUrl, setPlay] = useState('')
  const [members, setMembers] = useState(false)

  if (!open) return (
    <Button variant="secondary" size="sm" className="self-start" icon={<Link2 className="h-4 w-4" aria-hidden />} onClick={() => setOpen(true)}>
      وصلِ کانالِ آروان به یک باشگاه
    </Button>
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await run({
      action: 'attach-manual', clubId, kind: 'club', title: title.trim(), access: members ? 'members' : 'public',
      ingestUrl: ingestUrl.trim(), streamKey: streamKey.trim(), playbackUrl: playbackUrl.trim(),
    })
    if (ok) { setOpen(false); setTitle(''); setIngest(''); setKey(''); setPlay('') }
  }

  return (
    <form onSubmit={e => void submit(e)} className="flex flex-col gap-4 rounded-panel border border-gold/30 bg-gold/[.04] p-4">
      <p className="text-sub text-ink-2">این سه مورد را از صفحه‌ی کانال در پنلِ آروان کپی کنید.</p>
      <label className="flex flex-col gap-1 text-sub text-ink">
        باشگاه
        <select className={field} value={clubId} onChange={e => setClubId(e.target.value)} required>
          <option value="">انتخابِ باشگاه…</option>
          {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sub text-ink">
        نامِ کانال در سایت
        <input className={field} value={title} onChange={e => setTitle(e.target.value)} required minLength={2} maxLength={90} placeholder="مثلاً پخشِ زنده‌ی آرتا کلاب" />
      </label>
      <label className="flex flex-col gap-1 text-sub text-ink">
        لینکِ ورودیِ پخش
        <input className={field} dir="ltr" value={ingestUrl} onChange={e => setIngest(e.target.value)} required placeholder="rtmp://push…arvanlive.ir:1935/…" />
      </label>
      <label className="flex flex-col gap-1 text-sub text-ink">
        کلیدِ پخش زنده
        <input className={field} dir="ltr" value={streamKey} onChange={e => setKey(e.target.value)} required autoComplete="off" />
      </label>
      <label className="flex flex-col gap-1 text-sub text-ink">
        نشانیِ تماشا (.m3u8)
        <input className={field} dir="ltr" value={playbackUrl} onChange={e => setPlay(e.target.value)} required placeholder="https://…arvanlive.ir/hls/…/….m3u8" />
      </label>
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sub text-ink">
        <input type="checkbox" className="h-4 w-4 accent-gold" checked={members} onChange={e => setMembers(e.target.checked)} />
        فقط کاربرانِ عضو ببینند
      </label>
      <div className="flex gap-2">
        <Button type="submit" loading={busy}>وصل کن</Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
      </div>
    </form>
  )
}
