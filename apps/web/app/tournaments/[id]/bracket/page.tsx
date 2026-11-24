import { BracketClient } from './BracketClient'
import { loadPublicBracket } from '@/lib/tournaments/public-bracket'

/* پوسته‌ی سرور: جدولِ مسابقه همراهِ HTML (lib/tournaments/public-bracket).
   نبود/خطا/مهلت ⟵ null: رفتارِ قبلی (مرورگر خودش می‌خواند).
   ⚠️ `key`: جابه‌جایی بینِ دو مسابقه state را از قبلی نگه می‌داشت. */
export default async function BracketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const initial = await loadPublicBracket(id)
  return <BracketClient key={id} initial={initial} />
}
