import Image from 'next/image'
import { ChevronDown, Download } from 'lucide-react'
import { buttonClasses } from '@/components/ui/button-classes'
import { ANDROID_APK, BAZAAR } from '@/lib/app-stores'
import type { ApkMeta } from '@/lib/app-download-meta'
import { faDate, faDec, toFaDigits } from '@/lib/jalali'
import { CARD_CLASS, CardHead, StepList } from './parts'

/* کارتِ اندروید در /app: کافه‌بازار راهِ اصلی، دانلودِ مستقیم راهِ دوم
   (هشدارِ «منبع ناشناس» اندروید بعضی‌ها را می‌ترساند). نسخه، حجم و
   تاریخ کنارِ لینکِ مستقیم نشانه‌ی اعتماد است. */

const APK_STEPS = [
  { text: 'فایل را دانلود کنید و از نوار اعلان یا پوشه دانلودها بازش کنید' },
  { text: 'اگر اندروید اجازه نصب از منابع ناشناس خواست، آن را برای همین مرورگر روشن کنید' },
  { text: 'روی «نصب» بزنید تا بیلیارد هاب به فهرست برنامه‌ها اضافه شود' },
] as const

export function AndroidCard({ meta }: { meta: ApkMeta }) {
  return (
    <article className={CARD_CLASS.android} aria-labelledby="app-android">
      <CardHead os="android" title="اندروید"
        desc="نسخه رسمی را از کافه‌بازار نصب کنید یا فایل نصبی را مستقیم از همین سایت بگیرید" />

      <div className="flex flex-col gap-3">
        <a href={BAZAAR.url} target="_blank" rel="noopener noreferrer"
          className={buttonClasses({ size: 'lg', block: true })}>
          <Image src={BAZAAR.icon} alt="" width={24} height={24} className="h-6 w-6 rounded-chip" />
          دریافت از {BAZAAR.name}
        </a>
        <a href={ANDROID_APK.href} download={ANDROID_APK.fileName}
          type="application/vnd.android.package-archive"
          className={buttonClasses({ variant: 'secondary', size: 'lg', block: true })}>
          <Download size={20} aria-hidden />
          دانلود مستقیم فایل APK
        </a>
        <p className="text-center text-body text-ink-2">
          نسخه {toFaDigits(ANDROID_APK.version)}، حجم {faDec(meta.sizeMb, 1)} مگابایت، {faDate(ANDROID_APK.released)}
        </p>
      </div>

      <details className="group/apk rounded-card bg-paper">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-card px-4 text-body font-bold transition-colors duration-base hover:bg-line/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep [&::-webkit-details-marker]:hidden">
          راهنمای نصب فایل APK
          <ChevronDown size={20} aria-hidden className="shrink-0 text-ink-2 transition-transform duration-base group-open/apk:rotate-180 motion-reduce:transition-none" />
        </summary>
        <div className="flex flex-col gap-4 px-4 pb-4 pt-2">
          <StepList steps={APK_STEPS} />
          <p className="text-body text-ink-2">
            بعد از نصب، محتوای اپ با هر به‌روزرسانی سایت خودکار تازه می‌شود و نصب دوباره لازم نیست
          </p>
          <div className="flex flex-col gap-1 border-t border-line/10 pt-4">
            <p className="text-body text-ink-2">اثر انگشت امضای رسمی بیلیارد هاب برای سنجش اصالت فایل</p>
            <code dir="ltr" className="break-all text-start text-body text-ink">{meta.certSha256}</code>
          </div>
        </div>
      </details>
    </article>
  )
}
