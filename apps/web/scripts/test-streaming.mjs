/* تستِ قواعدِ پخش زنده (lib/streaming) — بی دیتابیس و بی سرور.
       node scripts/test-streaming.mjs

   نگهبانِ چهار چیز:
   ۱) سقفِ کانال: باشگاهِ عادی یک کانال، حرفه‌ای همان سقفِ مدیریت؛
      کانالِ مسابقه از سقف کم نمی‌کند ولی هر مسابقه فقط یکی.
   ۲) مسدودی: باشگاهِ مسدود نه کانال می‌سازد نه پخش را شروع می‌کند.
   ۳) کلیدِ استریم رمز می‌شود و با رازِ دیگر باز نمی‌شود (null، نه خطا).
   ۴) شمارِ بیننده: تپشِ کهنه حذف می‌شود و حافظه بی‌حد رشد نمی‌کند. */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const here = dirname(fileURLToPath(import.meta.url))
const read = p => readFileSync(join(here, '..', p), 'utf8')
const load = async rel => import('data:text/javascript;base64,' + Buffer.from(
  ts.transpileModule(read(rel), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  }).outputText).toString('base64'))

let pass = 0, fail = 0
const t = (name, got, want = true) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n      انتظار: ${JSON.stringify(want)}   دریافت: ${JSON.stringify(got)}`}`)
}

const P = await load('lib/streaming/policy.ts')
const std = { ...P.DEFAULT_CLUB_SETTINGS }
const pro = { tier: 'pro', channelLimit: 3, blocked: false, blockReason: null }
const blocked = { ...std, blocked: true, blockReason: 'تخلف' }

console.log('\n── سقفِ کانال ──')
t('عادی: سقف ۱', P.channelLimitOf(std), 1)
t('عادی با channelLimit=9 هم ۱', P.channelLimitOf({ ...std, channelLimit: 9 }), 1)
t('حرفه‌ای: همان سقفِ مدیریت', P.channelLimitOf(pro), 3)
t('حرفه‌ای: کمتر از ۲ ⟵ ۲', P.channelLimitOf({ ...pro, channelLimit: 1 }), 2)
t('حرفه‌ای: بیش از ۱۶ ⟵ ۱۶', P.channelLimitOf({ ...pro, channelLimit: 99 }), 16)
t('عادی: اولین کانال مجاز', P.canCreateChannel(std, [], 'club').ok, true)
t('عادی: دومی رد', P.canCreateChannel(std, [{ kind: 'club' }], 'club').ok, false)
t('عادی: کانالِ میز رد', P.canCreateChannel(std, [], 'table').ok, false)
t('عادی: کانالِ مسابقه با سقفِ پر مجاز', P.canCreateChannel(std, [{ kind: 'club' }], 'tournament').ok, true)
t('مسابقه‌ی دارای کانال: رد', P.canCreateChannel(std, [], 'tournament', { tournamentHasChannel: true }).ok, false)
t('کانالِ مسابقه سقف را پر نمی‌کند', P.canCreateChannel(std, [{ kind: 'tournament' }, { kind: 'tournament' }], 'club').ok, true)
t('حرفه‌ای: سومین مجاز', P.canCreateChannel(pro, [{ kind: 'club' }, { kind: 'table' }], 'table').ok, true)
t('حرفه‌ای: چهارمی رد', P.canCreateChannel(pro, [{ kind: 'club' }, { kind: 'table' }, { kind: 'table' }], 'table').ok, false)

console.log('\n── مسدودی ──')
t('باشگاهِ مسدود: ساختِ کانال رد', P.canCreateChannel(blocked, [], 'club').ok, false)
t('باشگاهِ مسدود: کانالِ مسابقه هم رد', P.canCreateChannel(blocked, [], 'tournament').ok, false)
const chan = { adminBlocked: false, archived: false, isLive: false, kind: 'club', rank: 0 }
t('کانالِ سالم: شروع مجاز', P.canGoLive(chan, std).ok, true)
t('باشگاهِ مسدود: شروع رد', P.canGoLive(chan, blocked).ok, false)
t('کانالِ مسدود: شروع رد', P.canGoLive({ ...chan, adminBlocked: true }, std).ok, false)
t('کانالِ حذف‌شده: شروع رد', P.canGoLive({ ...chan, archived: true }, std).ok, false)
t('کانالِ در حالِ پخش: شروعِ دوباره رد', P.canGoLive({ ...chan, isLive: true }, std).ok, false)
t('تنزل به عادی: کانالِ میز دیگر پخش نمی‌کند', P.canGoLive({ ...chan, kind: 'table' }, std).ok, false)
t('تنزل به عادی: کانالِ دوم بیرون از سقف', P.canGoLive({ ...chan, rank: 1 }, std).ok, false)
t('کانالِ مسابقه رتبه نمی‌خواهد', P.canGoLive({ ...chan, kind: 'tournament', rank: 9 }, std).ok, true)
t('کانالِ دستیِ مدیر: بیرون از سقف هم شروع می‌شود', P.canGoLive({ ...chan, rank: 3, adminAttached: true }, std).ok, true)
t('کانالِ دستیِ مدیر: مسدودی را دور نمی‌زند', P.canGoLive({ ...chan, adminAttached: true }, blocked).ok, false)
t('حرفه‌ای: کانالِ سوم داخلِ سقف', P.canGoLive({ ...chan, kind: 'table', rank: 2 }, pro).ok, true)

console.log('\n── دسترسیِ تماشا ──')
t('عمومی بی‌ورود', P.canWatch('public', false), true)
t('اعضا بی‌ورود رد', P.canWatch('members', false), false)
t('اعضا با ورود', P.canWatch('members', true), true)

console.log('\n── پخشِ رهاشده و آمار ──')
const now = Date.parse('2026-11-01T20:00:00Z')
t('۱۱ ساعت: هنوز زنده', P.isStale(now - 11 * 3600e3, now), false)
t('۱۳ ساعت: رهاشده', P.isStale(now - 13 * 3600e3, now), true)
const sum = P.summarize([
  { startedAt: '2026-11-01T10:00:00Z', endedAt: '2026-11-01T12:30:00Z', peakViewers: 40, viewerSeconds: 3600 * 50 },
  { startedAt: '2026-11-01T18:00:00Z', endedAt: null, peakViewers: 12, viewerSeconds: 0 },
], now)
t('ساعتِ پخش (۲٫۵ + ۲ باز)', sum.hours, 4.5)
t('اوجِ بیننده', sum.peakViewers, 40)
t('ساعت‌-بیننده', sum.viewerHours, 50)
t('پخشِ بی‌پایانِ قدیمی بیش از ۱۲ ساعت شمرده نمی‌شود',
  P.summarize([{ startedAt: '2026-10-01T00:00:00Z', endedAt: null, peakViewers: 0, viewerSeconds: 0 }], now).hours, 12)

console.log('\n── رمزِ کلیدِ استریم ──')
process.env.JWT_SECRET = 'test-secret-A'
const S = await load('lib/streaming/secret.ts')
const sealed = S.seal('bh_live_key_123')
t('متنِ خام در خروجی نیست', sealed.includes('bh_live_key_123'), false)
t('باز شدن با همان راز', S.open(sealed), 'bh_live_key_123')
t('دو بار رمز ⟵ دو خروجیِ متفاوت (IV تازه)', S.seal('x') !== S.seal('x'), true)
t('ورودیِ خراب ⟵ null', S.open('v1.abc.def.ghi'), null)
t('تهی ⟵ null', S.open(null), null)
const tampered = sealed.slice(0, -2) + (sealed.endsWith('A') ? 'BB' : 'AA')
t('دست‌کاری ⟵ null', S.open(tampered), null)
process.env.JWT_SECRET = 'test-secret-B'
t('رازِ دیگر ⟵ null (نه خطا)', S.open(sealed), null)
t('ماسک فقط چهار نویسه‌ی آخر', S.maskKey('abcdefgh1234'), '••••••••1234')

console.log('\n── شمارِ بیننده ──')
const V = await load('lib/streaming/viewers.ts')
const t0 = 1_000_000
V.beat('ch1', 'viewer-aaaa', t0)
V.beat('ch1', 'viewer-bbbb', t0 + 1000)
t('دو بیننده', V.countOf('ch1', t0 + 2000), 2)
t('تپشِ تکراری یک نفر است', V.beat('ch1', 'viewer-aaaa', t0 + 3000), 2)
t('پس از ۴۵ ثانیه بی‌تپش، رفته', V.countOf('ch1', t0 + 1000 + 46_000), 1)
V.leave('ch1', 'viewer-aaaa')
t('خروج', V.countOf('ch1', t0 + 4000), 0)
t('شناسه‌ی معتبر', V.VIEWER_ID.test('v1a2b3c4d5'), true)
t('شناسه‌ی کوتاه رد', V.VIEWER_ID.test('abc'), false)
t('شناسه‌ی نامجاز رد', V.VIEWER_ID.test('../../etc/passwd'), false)

for (let i = 0; i < 8; i++) V.admit('1.2.3.4', 'chX', `viewer-ip-${i}`, t0)
t('IP: هشت بیننده پذیرفته', V.admit('1.2.3.4', 'chX', 'viewer-ip-0', t0), true)
t('IP: نهمی رد', V.admit('1.2.3.4', 'chX', 'viewer-ip-99', t0), false)
t('IP دیگر مستقل', V.admit('5.6.7.8', 'chX', 'viewer-ip-99', t0), true)
t('IP: پس از ۴۵ ثانیه جا باز می‌شود', V.admit('1.2.3.4', 'chX', 'viewer-ip-99', t0 + 46_000), true)

const tb = 5_000_000
t('آمار: بارِ اول نوشتن نیست', V.tally('b1', 10, tb), null)
V.tally('b1', 10, tb + 10_000)
const fl = V.tally('b1', 30, tb + 61_000)
t('آمار: پس از یک دقیقه نوشتنی', fl !== null, true)
t('آمار: اوج ۳۰', fl?.peak, 30)
t('آمار: ثانیه‌-بیننده بیش از صفر', (fl?.seconds ?? 0) > 0, true)
t('پایانِ پخش: آخرین آمار و پاک‌شدن', V.finishTally('b1')?.peak, 30)
t('پس از پایان چیزی نمی‌ماند', V.finishTally('b1'), null)

console.log(`\n${fail === 0 ? '✓' : '✗'} نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail === 0 ? 0 : 1)
