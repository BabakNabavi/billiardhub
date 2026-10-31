import { Suspense } from 'react'
import { JsonLd } from './JsonLd'

type Ld = Record<string, unknown> | Record<string, unknown>[] | null

/* JSON-LD بی‌آنکه رندرِ صفحه منتظرش بماند.

   ⚠️ layoutی که پیش از `children` منتظرِ دیتابیس می‌ماند، TTFBِ *همه‌ی*
   کاربران را به همان خواندن گره می‌زد (تا ۲٫۵ ثانیه روی شبکه‌ی کند). این‌جا
   خواندن داخلِ Suspense است: صفحه همان لحظه جریان می‌یابد و JSON-LD در همان
   پاسخ، کمی بعد، می‌نشیند — خزنده‌ها هم آن را در همان HTML می‌بینند. */
async function Resolved({ data }: { data: Promise<Ld> }) {
  return <JsonLd data={await data.catch(() => null)} />
}

export function AsyncJsonLd({ data }: { data: Promise<Ld> }) {
  return <Suspense fallback={null}><Resolved data={data} /></Suspense>
}
