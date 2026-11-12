import type { Metadata } from 'next'
import YouClient from './YouClient'

/* صفحه‌ی شخصی است و ارزشِ جست‌وجو ندارد */
export const metadata: Metadata = {
  title: { absolute: 'شما | بیلیارد مدیا' },
  robots: { index: false, follow: false },
}

export default function YouPage() {
  return <YouClient />
}
