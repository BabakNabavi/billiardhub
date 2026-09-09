import { getSupabaseServer } from '@/lib/supabase-server'

/* فهرست استوری روی فضای ذخیره‌سازی — یک پیاده‌سازی برای باشگاه و
 * فروشگاه. پیش‌تر هر مسیر نسخه‌ی خودش را داشت و اختلافشان دو باگ ساکت
 * ساخته بود:
 *
 *  ۱) خطای نوشتن دور ریخته می‌شد. آپلود که شکست می‌خورد، مسیر همچنان
 *     ۲۰۱ برمی‌گرداند و پنل «منتشر شد» نشان می‌داد در حالی که هیچ‌چیز
 *     ذخیره نشده بود.
 *  ۲) خطای *خواندن* با «فهرست خالی» یکی گرفته می‌شد. یعنی یک خطای
 *     گذرای شبکه وسط انتشار، فهرست را با تک استوری جدید بازنویسی
 *     می‌کرد و تا ده استوری زنده را می‌سوزاند.
 *
 * حالا «نبود فایل» از «خطا» جدا است: اولی فهرست خالی درست است، دومی
 * باید مسیر را متوقف کند.
 */

export interface StoredStory {
  id?: string
  mediaUrl?: string
  expiresAt?: string
  [k: string]: unknown
}

export class StoryIndexError extends Error {}

const indexPath = (prefix: string, id: string) => `${prefix}/${id}/stories/index.json`

/** نبود شیء در Supabase Storage با پیام/وضعیت خودش شناخته می‌شود. */
const isMissing = (err: unknown): boolean => {
  const e = err as { status?: number; statusCode?: number | string; message?: string } | null
  const status = Number(e?.status ?? e?.statusCode ?? 0)
  if (status === 404) return true
  return /not.?found|does not exist|no such/i.test(String(e?.message ?? ''))
}

export interface StoryIndex {
  read(): Promise<StoredStory[]>
  write(stories: StoredStory[]): Promise<void>
  /** فایل استوری‌هایی که از فهرست بیرون رفته‌اند را پاک می‌کند */
  purge(gone: StoredStory[]): Promise<void>
}

export function storyIndex(bucket: string, prefix: string, id: string): StoryIndex {
  const path = indexPath(prefix, id)
  const tag = `[${prefix}/:id/stories]`

  return {
    async read() {
      const { data, error } = await getSupabaseServer().storage.from(bucket).download(path)
      if (error) {
        if (isMissing(error)) return []
        console.error(`${tag} خواندن فهرست شکست خورد:`, error)
        throw new StoryIndexError('خواندن فهرست استوری انجام نشد')
      }
      if (!data) return []
      try {
        const parsed: unknown = JSON.parse(await data.text())
        return Array.isArray(parsed) ? (parsed as StoredStory[]) : []
      } catch {
        /* فایل خراب: خالی حساب می‌شود تا انتشار تازه قفل نشود */
        console.error(`${tag} فهرست خراب — خالی در نظر گرفته شد`)
        return []
      }
    },

    async write(stories) {
      const { error } = await getSupabaseServer().storage.from(bucket).upload(
        path,
        Buffer.from(JSON.stringify(stories), 'utf8'),
        { upsert: true, contentType: 'application/json' },
      )
      if (error) {
        console.error(`${tag} نوشتن فهرست شکست خورد:`, error)
        throw new StoryIndexError('ذخیره‌ی استوری انجام نشد')
      }
    },

    async purge(gone) {
      /* نشانی عمومی Supabase قالب ثابتی دارد و مسیر داخل باکت بعد
         از نام باکت می‌آید. نشانی ناشناس رد می‌شود — پاک‌کردن
         کورکورانه بدتر از نگه‌داشتن است. */
      const paths = gone
        .map(s => {
          const m = String(s?.mediaUrl ?? '').match(new RegExp(`/${bucket}/(.+)$`))
          if (!m?.[1]) return null
          const p = decodeURIComponent(m[1].split('?')[0] ?? '')
          return !p || p.endsWith('/index.json') ? null : p
        })
        .filter((p): p is string => !!p)
      if (!paths.length) return
      try {
        await getSupabaseServer().storage.from(bucket).remove(paths)
      } catch (e) {
        /* نشت فضا بد است ولی نباید مسیر را بشکند */
        console.error(`${tag} پاک‌کردن فایل انجام نشد:`, e)
      }
    },
  }
}
