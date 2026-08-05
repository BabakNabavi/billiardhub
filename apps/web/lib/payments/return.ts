import type { NextRequest } from 'next/server'

/* ─────────────────────────────────────────────────────────────
   خواندنِ بازگشت از درگاه — یک جا برای همه‌ی درگاه‌ها.

   ── چرا لازم شد ──
   درگاه‌ها یک‌شکل برنمی‌گردند:

     زرین‌پال / mock → GET با `?Authority=…&Status=OK`
     پی‌پینگ         → POST با `application/x-www-form-urlencoded`،
                       بدنه‌ای شاملِ `status`, `errorCode` و `data`
                       که خودش یک JSON است.

   سه مسیرِ بازگشت در سایت هست (رزرو، تبلیغ، پیامکِ باشگاه). اگر هر
   کدام این تفاوت را خودش مدیریت کند، روزی یکی از قلم می‌افتد و آن
   جریان بی‌صدا می‌شکند — یعنی پول گرفته شده و سفارش فعال نشده.

   ── نکته‌ی امنیتی ──
   این تابع فقط **می‌خواند**. هیچ‌چیزِ آمده از درگاه سندِ پرداخت نیست؛
   تأیید همیشه با یک درخواستِ سمت‌سرور به خودِ درگاه انجام می‌شود و
   مبلغِ واقعی با مبلغِ سفارش سنجیده می‌شود.
   ───────────────────────────────────────────────────────────── */

export interface GatewayReturn {
  /** شناسه‌ی درگاه — زرین‌پال: Authority · پی‌پینگ: paymentCode */
  authority: string
  /** کدِ رهگیری — پی‌پینگ آن را در بازگشت می‌دهد و برای تأیید لازم است */
  refId: string
  /** شناسه‌ی سفارشِ خودمان، اگر درگاه برش گردانده باشد */
  clientRefId: string
  /** کاربر پرداخت را لغو کرده یا درگاه ناموفق گزارش داده */
  canceled: boolean
}

const str = (v: unknown) => (v === undefined || v === null ? '' : String(v)).trim()

export async function readGatewayReturn(req: NextRequest): Promise<GatewayReturn> {
  const sp = req.nextUrl.searchParams
  const bag: Record<string, string> = {}
  for (const [k, v] of sp.entries()) bag[k.toLowerCase()] = v

  /* بدنه فقط وقتی خوانده می‌شود که POST باشد — و شکستش نباید مسیر را
     بشکند، چون بعضی درگاه‌ها بدنه‌ی خالی می‌فرستند. */
  if (req.method === 'POST') {
    try {
      const ct = req.headers.get('content-type') ?? ''
      if (ct.includes('application/json')) {
        const j = await req.json() as Record<string, unknown>
        for (const [k, v] of Object.entries(j ?? {})) bag[k.toLowerCase()] = str(v)
        merge(bag, j?.data)
      } else {
        const form = await req.formData()
        for (const [k, v] of form.entries()) bag[k.toLowerCase()] = str(v)
        /* `data` خودش یک JSON است، نه یک رشته‌ی ساده */
        if (bag.data) { try { merge(bag, JSON.parse(bag.data)) } catch { /* رشته‌ی ساده بود */ } }
      }
    } catch { /* بدنه‌ای نبود یا خوانا نبود — پارامترهای کوئری می‌مانند */ }
  }

  /* لغو، به هر شکلی که درگاه بگوید:
       زرین‌پال → Status=NOK
       پی‌پینگ  → status=0  (و `errorCode` پر می‌شود) */
  const status = bag.status ?? ''
  const canceled =
    /nok|cancel|fail/i.test(status) ||
    status === '0' ||
    (!!bag.errorcode && bag.errorcode !== '0' && status !== '1')

  return {
    authority: bag.authority || bag.paymentcode || '',
    refId: bag.paymentrefid || bag.refid || '',
    clientRefId: bag.clientrefid || '',
    canceled,
  }
}

/* کلیدهای `data` را کنارِ بقیه می‌نشاند — با همان حروفِ کوچک */
function merge(bag: Record<string, string>, data: unknown) {
  if (!data || typeof data !== 'object') return
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (v !== null && typeof v === 'object') continue
    bag[k.toLowerCase()] = str(v)
  }
}
