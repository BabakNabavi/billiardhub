'use client'

/* ─────────────────────────────────────────────────────────────
   دیدگاه‌های یک ویدیو.

   ⚠️ اگر جدولِ دیدگاه روی سرور نباشد (مهاجرتِ ۰۹۲ دستی اجرا
   می‌شود) کلِ بخش رندر نمی‌شود. ولی «جدول نیست» با «درخواست شکست
   خورد» یکی نیست: دومی حالتِ خطای خودش را با دکمه‌ی تلاشِ دوباره
   دارد، وگرنه یک قطعیِ گذرا شبیهِ «این قابلیت وجود ندارد» می‌شد.

   ⚠️ متنِ دیدگاه به‌صورت متن رندر می‌شود، نه HTML. هیچ
   `dangerouslySetInnerHTML`ی این‌جا نیست؛ خطِ جدید با CSS
   (`white-space: pre-wrap`) حفظ می‌شود نه با تبدیل به `<br>`.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { faDate, toFaDigits } from '../../lib/jalali'
import { useAuthStore } from '../../store/auth.store'
import { socialPost } from './social'

export interface Comment {
  id: string; body: string; authorId: string; authorName: string
  parentId: string | null; pinned: boolean; createdAt: string
  replies?: Comment[]
}

/* ⚠️ بیرونِ بدنه‌ی رندر تعریف شده: نسخه‌ی اول داخلِ `Comments` بود،
   پس با هر کلیدِ تایپ‌شده در جعبه‌ی متن هویتش عوض می‌شد و کلِ فهرستِ
   دیدگاه‌ها دوباره mount می‌شد. */
function Row({
  c, nested = false, replyTo, busy, canRemove, onReply, onRemove,
}: {
  c: Comment; nested?: boolean; replyTo: string | null; busy: boolean
  canRemove: (c: Comment) => boolean
  onReply: (id: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <li className={nested ? 'mx-cm mx-cm--r' : 'mx-cm'}>
      <div className="mx-cm-h">
        <strong>{c.authorName}</strong>
        {c.pinned && <span className="mx-tag mx-tag--gold">سنجاق‌شده</span>}
        {c.createdAt && <time dateTime={c.createdAt}>{faDate(new Date(c.createdAt))}</time>}
      </div>
      <p>{c.body}</p>
      <div className="mx-cm-a">
        {!nested && (
          <button type="button" onClick={() => onReply(c.id)}>
            {replyTo === c.id ? 'انصراف' : 'پاسخ'}
          </button>
        )}
        {canRemove(c) && (
          <button type="button" onClick={() => onRemove(c.id)} disabled={busy}>
            <Trash2 size={13} aria-hidden /> حذف
          </button>
        )}
      </div>
      {c.replies && c.replies.length > 0 && (
        <ul className="mx-cm-kids">
          {c.replies.map(k => (
            <Row key={k.id} c={k} nested replyTo={replyTo} busy={busy}
              canRemove={canRemove} onReply={onReply} onRemove={onRemove} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function Comments({ slug, ownerId }: { slug: string; ownerId?: string | null }) {
  const { user } = useAuthStore()
  const [state, setState] = useState<'loading' | 'off' | 'error' | 'ready'>('loading')
  const [items, setItems] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(
        `/api/media/social?video=${encodeURIComponent(slug)}&comments=1`, { cache: 'no-store' })
      if (!r.ok) { setState('error'); return }
      const j = await r.json() as { comments?: { available: boolean; items: Comment[]; total: number } }
      if (!j.comments) { setState('error'); return }
      if (!j.comments.available) { setState('off'); return }
      setItems(j.comments.items)
      setTotal(j.comments.total)
      setState('ready')
    } catch { setState('error') }
  }, [slug])

  useEffect(() => { void load() }, [load])

  /* جدول نیست ⇒ بخش اصلاً وجود ندارد. بارگذاری هم چیزی نشان نمی‌دهد
     تا فضای صفحه بی‌دلیل نپرد. */
  if (state === 'loading' || state === 'off') return null

  const send = async () => {
    const body = text.trim()
    if (!body || busy) return
    if (!user) { setErr('برای گذاشتن دیدگاه وارد شوید'); return }
    setBusy(true); setErr('')
    const { ok, j } = await socialPost({ action: 'comment', video: slug, body, parentId: replyTo ?? undefined })
    if (ok) { setText(''); setReplyTo(null); await load() }
    else setErr(String(j.message ?? 'ثبت نشد'))
    setBusy(false)
  }

  const remove = async (id: string) => {
    setBusy(true); setErr('')
    const { ok, j } = await socialPost({ action: 'deleteComment', video: slug, commentId: id })
    if (ok) await load()
    else setErr(String(j.message ?? 'حذف نشد'))
    setBusy(false)
  }

  /* نویسنده‌ی دیدگاه یا صاحبِ ویدیو — همان قاعده‌ای که سرور اعمال می‌کند */
  const canRemove = (c: Comment) =>
    Boolean(user) && (c.authorId === user?.id || (Boolean(ownerId) && ownerId === user?.id))

  return (
    <section className="mx-comments" aria-labelledby="mx-cm-h">
      <div className="mx-sec-hd">
        <h2 id="mx-cm-h">دیدگاه‌ها{total > 0 ? ` (${toFaDigits(total)})` : ''}</h2>
      </div>

      {state === 'error' ? (
        <div className="mx-empty">
          <h2>دیدگاه‌ها بارگذاری نشد</h2>
          <p>این یک خطای موقت است.</p>
          <div className="mx-empty-act">
            <button className="mx-iconbtn" type="button" onClick={() => void load()}>
              <span>تلاش دوباره</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {user ? (
            <div className="mx-cm-new">
              {replyTo && (
                <p className="mx-cm-reply">
                  در پاسخ به یک دیدگاه — <button type="button" onClick={() => setReplyTo(null)}>انصراف</button>
                </p>
              )}
              <label className="mx-sr-only" htmlFor="mx-cm-in">دیدگاه شما</label>
              <textarea
                id="mx-cm-in" value={text} onChange={e => setText(e.target.value)}
                rows={3} maxLength={2000} placeholder="دیدگاهتان را بنویسید…"
              />
              <div className="mx-cm-send">
                <button className="mx-act" type="button" onClick={send} disabled={busy || !text.trim()}>
                  {busy && <Loader2 size={15} className="mx-spin" aria-hidden />}
                  ثبت دیدگاه
                </button>
              </div>
            </div>
          ) : (
            <p className="mx-by">برای گذاشتن دیدگاه وارد شوید.</p>
          )}

          {err && <p className="mx-err" role="alert">{err}</p>}

          {items.length === 0
            ? <p className="mx-by">هنوز دیدگاهی ثبت نشده است.</p>
            : (
              <ul className="mx-cm-list">
                {items.map(c => (
                  <Row key={c.id} c={c} replyTo={replyTo} busy={busy} canRemove={canRemove}
                    onReply={id => setReplyTo(replyTo === id ? null : id)}
                    onRemove={id => void remove(id)} />
                ))}
              </ul>
            )}
        </>
      )}
    </section>
  )
}
