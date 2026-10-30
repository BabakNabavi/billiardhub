import type { Metadata } from 'next'
import { AccountStatusView } from '@/components/account/AccountStatusView'

/* صفحه‌ای که حسابِ مسدود/تعلیق/حذف‌شده به آن هدایت می‌شود (proxy.ts و
   apiFetch). خودش هیچ داده‌ای نمی‌دهد؛ وضعیت را از /api/account/status
   می‌خواند که فقط پیامِ عمومی برمی‌گرداند. */

export const metadata: Metadata = {
  title: 'وضعیتِ حساب',
  robots: { index: false, follow: false },
}

export default function AccountStatusPage() {
  return (
    <main className="lq-stage min-h-screen pb-16">
      <div className="mx-auto max-w-xl px-4 pt-12 sm:pt-16">
        <h1 className="m-0 text-title text-ink">وضعیتِ حساب</h1>
        <AccountStatusView />
      </div>
    </main>
  )
}
