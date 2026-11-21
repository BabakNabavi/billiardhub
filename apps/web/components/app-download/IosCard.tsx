import { Check, Share, SquarePlus } from 'lucide-react'
import { A2HS_STEPS } from '@/lib/pwa/a2hs'
import { CARD_CLASS, CardHead, StepList } from './parts'

/* کارتِ آیفون در /app. اپِ بومیِ iOS عمداً نیست (تحریمِ حسابِ اپل)؛ همان
   وب‌اپِ نصب‌شدنی است. مراحل با شیتِ راهنمای خودکار یکی است (A2HS_STEPS)
   و این‌جا بی کلیک و بی جاوااسکریپت دیده می‌شود. */

const STEPS = [
  { text: A2HS_STEPS[0], icon: <Share size={18} /> },
  { text: A2HS_STEPS[1], icon: <SquarePlus size={18} /> },
  { text: A2HS_STEPS[2], icon: <Check size={18} /> },
]

export function IosCard() {
  return (
    <article className={CARD_CLASS.ios} aria-labelledby="app-ios">
      <CardHead os="ios" title="آیفون"
        desc="نسخه آیفون وب‌اپ است و بعد از افزودن، مثل یک اپ کامل از صفحه اصلی گوشی باز می‌شود" />
      <StepList steps={STEPS} />
      <p className="rounded-card bg-paper p-4 text-body text-ink-2">
        این کار فقط در مرورگر Safari ممکن است؛ اگر سایت را در مرورگر دیگری باز کرده‌اید، همین صفحه را در Safari باز کنید
      </p>
    </article>
  )
}
