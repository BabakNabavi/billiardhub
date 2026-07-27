import type { Metadata } from 'next'
import LegalDoc from '../../components/legal/LegalDoc'
import { TERMS } from '../../lib/legal-content'

export const metadata: Metadata = {
  title: 'قوانین و مقررات | بیلیارد هاب',
  description: 'قوانین و مقررات استفاده از پلتفرم بیلیارد هاب — حساب کاربری، رزرو باشگاه، لغو رزرو، بیلیارد بازار و محتوای کاربران.',
}

export default function TermsPage() {
  return <LegalDoc doc={TERMS} icon="terms" />
}
