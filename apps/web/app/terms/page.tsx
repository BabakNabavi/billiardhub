import type { Metadata } from 'next'
import LegalDoc from '../../components/legal/LegalDoc'
import { termsWithRates } from '../../lib/legal-content'
import { feeRules } from '../../lib/finance/policy'
import { globalCommissionRates } from '../../lib/finance/rates'

export const metadata: Metadata = {
  title: 'قوانین و مقررات | بیلیارد هاب',
  description: 'قوانین و مقررات استفاده از پلتفرم بیلیارد هاب — حساب کاربری، رزرو باشگاه، لغو رزرو، بیلیارد بازار و محتوای کاربران.',
}

/* ── چرا این صفحه داینامیک است ──
   بندِ کمیسیون باید نرخِ واقعیِ امروز را بگوید، نه عددی که موقعِ
   بیلد ثابت شده. نرخ از پنلِ ادمین عوض می‌شود و همین متن است که در
   اختلافِ مالی به آن استناد می‌شود.

   `revalidate` به‌جای `force-dynamic`: صفحه‌ی قوانین پربازدید و
   کم‌تغییر است؛ یک ساعت کَش هم تازگی را تضمین می‌کند هم بار را
   روی دیتابیس نمی‌اندازد. */
export const revalidate = 3600

export default async function TermsPage() {
  const rates = await globalCommissionRates()
  return <LegalDoc doc={termsWithRates(feeRules(rates.reservation, rates.tournament))} icon="terms" />
}
