import 'server-only'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ANDROID_APK, ANDROID_PACKAGE } from './app-stores'

/* ─────────────────────────────────────────────────────────────
   مشخصاتِ APK برای صفحه‌ی /app — فقط سمتِ سرور (node:fs).

   صفحه استاتیک است، پس این‌ها یک بار موقعِ بیلد خوانده می‌شوند؛ cwd
   در بیلد پوشه‌ی apps/web است (turbo و deploy.sh هر دو همان‌جا
   `next build` می‌زنند).

   ⚠️ عمداً throw می‌کند: اگر نامِ فایل در lib/app-stores با فایلِ
   public/downloads نخواند، بیلد بشکند بهتر از لینکِ دانلودی است که
   بی‌صدا ۴۰۴ بدهد.
   ───────────────────────────────────────────────────────────── */

export interface ApkMeta {
  sizeMb: number
  /** اثر انگشتِ SHA-256 گواهیِ امضا، همانی که assetlinks اعلام می‌کند */
  certSha256: string
}

interface AssetLink {
  target?: { namespace?: string; package_name?: string; sha256_cert_fingerprints?: string[] }
}

export function getApkMeta(): ApkMeta {
  const pub = join(process.cwd(), 'public')
  const { size } = statSync(join(pub, ANDROID_APK.href))

  const links = JSON.parse(readFileSync(join(pub, '.well-known', 'assetlinks.json'), 'utf8')) as AssetLink[]
  const cert = links
    .find(l => l.target?.namespace === 'android_app' && l.target.package_name === ANDROID_PACKAGE)
    ?.target?.sha256_cert_fingerprints?.[0]
  if (!cert) throw new Error('assetlinks.json: android_app fingerprint not found')

  return { sizeMb: size / (1024 * 1024), certSha256: cert }
}
