import type { Metadata } from 'next'
import LegalDoc from '../../components/legal/LegalDoc'
import { PRIVACY } from '../../lib/legal-content'

export const metadata: Metadata = {
  title: 'حریم خصوصی | بیلیارد هاب',
  description: 'سیاست حریم خصوصی بیلیارد هاب — اطلاعات دریافتی از کاربران، نحوه استفاده، امنیت، کوکی‌ها و نگهداری اطلاعات.',
}

export default function PrivacyPage() {
  return <LegalDoc doc={PRIVACY} icon="privacy" />
}
