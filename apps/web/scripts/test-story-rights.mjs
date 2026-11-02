/* حقِ استوری و نشانِ نقش — بی‌دیتابیس (دیتابیسِ ناموجود ⟵ تنظیمِ پیش‌فرض).
       npx tsx scripts/test-story-rights.mjs
   یا `npm run test:story-rights`.

   چرا تست دارد (آبانِ ۱۴۰۵، گزارشِ مالک): با برداشتنِ سقفِ تعدادِ استوری،
   شرطِ «فقط نقش‌های فعال» هم برداشته شد. کاربرِ عادی استوری گذاشت و چون
   پیش‌فرضِ برچسب «بازیکن» بود، با نشانِ بازیکن منتشر شد. */

process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://127.0.0.1:1'
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test'
const { canPostStory, pickStoryRole } = await import('../lib/story-store.ts')
const { getStoryQuotaState } = await import('../lib/stories/quota.ts')

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)
const quiet = console.error
console.error = () => {}

head('۱) نشانِ نقش')
t('کاربرِ عادی ⟵ «کاربر»، نه «بازیکن»', pickStoryRole(['user']).label === 'کاربر', JSON.stringify(pickStoryRole(['user'])))
t('بی‌نقش ⟵ «کاربر»', pickStoryRole([]).key === 'user')
t('بازیکن ⟵ «بازیکن»', pickStoryRole(['user', 'player']).label === 'بازیکن')
t('باشگاه‌دار + بازیکن ⟵ «باشگاه»', pickStoryRole(['player', 'club_owner']).key === 'club_owner')
t('حسابِ رسمی ⟵ «بیلیارد هاب»', pickStoryRole(['coach', 'admin']).key === 'admin')

head('۲) حقِ استوری از نقش')
t('کاربرِ عادی ندارد', canPostStory(['user']) === false)
t('null/خالی ندارد', canPostStory([null, undefined, '']) === false)
for (const r of ['player', 'coach', 'referee', 'technician', 'seller', 'manufacturer', 'club_owner', 'admin'])
  t(`${r} دارد`, canPostStory(['user', r]) === true)

head('۳) سرور — سهمیه‌ی خاموش (پیش‌فرض)، بی‌بسته')
{
  const q = await getStoryQuotaState('00000000-0000-0000-0000-000000000000', async () => 50, 'user')
  t('کاربرِ عادی: allowed=false', q.allowed === false && q.eligible === false, JSON.stringify(q))
  t('…با پیامِ روشن', /نقش فعالی/.test(q.message ?? ''), q.message)
}
{
  const q = await getStoryQuotaState('00000000-0000-0000-0000-000000000000', async () => 50, 'player')
  t('بازیکن با ۵۰ استوری: بی‌سقف، مجاز', q.allowed === true && q.eligible === true, JSON.stringify(q))
}

{
  const q = await getStoryQuotaState('00000000-0000-0000-0000-000000000000', async () => 500, 'admin')
  t('حسابِ رسمی: مجاز، via=role', q.allowed === true && q.via === 'role', JSON.stringify(q))
}

head('۴) پنهان‌سازیِ استوریِ زنده (GET)')
{
  const { hideLiveStory: h } = await import('../lib/stories/visibility.ts')
  const role = { hasStoryRole: true, hasPlan: false }, none = { hasStoryRole: false, hasPlan: false }
  t('نقش دارد ⟵ دیده می‌شود', h('role', role, false) === false && h(undefined, role, false) === false)
  t('نقش پس گرفته شد (via=role) ⟵ پنهان', h('role', none, false) === true)
  t('با بسته منتشر شد، بسته تمام شد ⟵ تا ۲۴ ساعت دیده می‌شود', h('plan', none, false) === false)
  t('سهمیه‌ی رایگانِ ادمین (via=free) ⟵ دیده می‌شود', h('free', none, false) === false)
  t('استوریِ قدیمیِ کاربرِ عادی (بی‌via) ⟵ پنهان', h(undefined, none, false) === true)
  t('…مگر بسته دارد', h(undefined, { hasStoryRole: false, hasPlan: true }, false) === false)
  t('…یا ادمین به کاربرِ عادی سهمیه داده', h(undefined, none, true) === false)
  t('…یا خواندنِ بسته شکست خورد (پنهان نکن)', h(undefined, { hasStoryRole: false, hasPlan: null }, false) === false)
}

console.error = quiet
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
