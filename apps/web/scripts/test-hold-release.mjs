/* تستِ ایستایِ مسیرِ آزادسازیِ هولد.
   منطقِ اصلی داخلِ پستگرس و مرورگر است، پس این‌جا چیزی را که واقعا
   می‌تواند بی‌صدا خراب شود بررسی می‌کنیم: قیدهایی که اگر روزی برداشته
   شوند پول یا ساعت از دست می‌رود. */
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
/* کامنت‌ها دلیلِ هر تصمیم را توضیح می‌دهند و طبیعتاً نامِ همان چیزهایی
   را می‌برند که نباید در کد باشند. پس ادعاهای «X در کد نیست» باید روی
   متنِ بدونِ کامنت بررسی شوند، وگرنه تست همیشه قرمز است. */
const stripSql = t => t.replace(/--[^\n]*/g, '');
const stripTs  = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`) } else { fail++; console.log(`  ✗ ${name}`) } };

const sql   = readFileSync(new URL('../../../supabase/migrations/096_release_hold.sql', import.meta.url), 'utf8');
const lib   = read('lib/bookings/release-hold.ts');
const hold  = read('lib/bookings/pending-hold.ts');
const slots = read('app/api/bookings/slots/route.ts');
const aband = read('app/api/bookings/[id]/abandon/route.ts');
const page  = read('app/booking/[clubId]/page.tsx');
const res   = read('app/booking/result/page.tsx');

console.log('\n■ ۱) تابعِ پستگرس — قیدهایی که نبودشان یعنی ضررِ مالی');
ok('قفلِ ردیف می‌گیرد', /SELECT \* INTO b FROM bookings WHERE id = p_booking_id FOR UPDATE/.test(sql));
ok('مالکیت را زیرِ قفل بررسی می‌کند', /b\."userId"\s+IS DISTINCT FROM p_user_id THEN RETURN false/.test(sql));
ok('فقط PENDING_PAYMENT', /b\.booking_status\s+<> 'PENDING_PAYMENT'\s+THEN RETURN false/.test(sql));
ok('فقط UNPAID', /b\.payment_status\s+<> 'UNPAID'\s+THEN RETURN false/.test(sql));
ok('اسلات را در همان تراکنش پاک می‌کند', /DELETE FROM booking_slots WHERE booking_id = b\.id/.test(sql));
ok('پرداختِ PAID را دست نمی‌زند', /status IN \('INITIATED', 'PENDING'\)/.test(sql));
ok('lock_timeout دارد', /SET LOCAL lock_timeout/.test(sql));
ok('هیچ ردیفِ دفترِ مالی نمی‌نویسد', !/ledger_entries/.test(stripSql(sql)));
ok('هیچ کارمزدِ لغوی نمی‌نویسد', !/CANCELLATION_FEE/.test(stripSql(sql)));

console.log('\n■ ۲) لایه‌ی TypeScript');
ok('bh_cancel_booking دیگر از این مسیر صدا زده نمی‌شود', [lib, aband, slots].every(f => !/bh_cancel_booking/.test(stripTs(f))));
ok('اول RPCِ اتمیک', /rpc<unknown>\('bh_release_hold'/.test(lib));
ok('پشتیبان فقط برای «تابع نیست»', /error\.code === 'PGRST202'/.test(lib));
ok('پشتیبان چهار شرط را در WHERE دارد',
  /\.eq\('id', bookingId\)\.eq\('userId', userId\)/.test(lib)
  && /\.eq\('booking_status', 'PENDING_PAYMENT'\)\.eq\('payment_status', 'UNPAID'\)/.test(lib));
ok('روی UPDATEِ پشتیبان limit/single نیست', !/\.eq\('payment_status', 'UNPAID'\)\s*\n?\s*\.(limit|single|maybeSingle)/.test(lib));
ok('اسلاتِ یتیم ممیزی می‌شود', /BOOKING_SLOT_ORPHANED/.test(lib));
ok('آزادسازی ممیزی می‌شود', /BOOKING_HOLD_RELEASED/.test(lib));
ok('دلیلِ هر دو مسیر جدا و گویاست', /abandon: 'انصراف از پرداخت/.test(lib) && /sweep:\s+'هولد پرداخت‌نشده/.test(lib));

console.log('\n■ ۳) جاروی ساعت‌ها نباید پرداختِ در جریان را بکشد');
ok('نشستِ بازِ درگاه را رد می‌کند', /\.in\('status', \['INITIATED', 'PENDING'\]\)/.test(slots));
ok('اگر نتواند نشست‌ها را بخواند هیچ‌کدام را دست نمی‌زند', /if \(liveErr\) \{/.test(slots));
ok('busy رد می‌شود', /ids\.filter\(id => !busy\.has\(id\)\)/.test(slots));
ok('پاک‌سازی نمی‌تواند پاسخِ ساعت‌ها را ۵۰۰ کند', /try \{[\s\S]*bh_expire_bookings[\s\S]*\} catch \(e\) \{/.test(slots));
ok('گاردِ سن هنوز هست', /STALE_AFTER_MS/.test(slots));

console.log('\n■ ۴) خطای گذرا نباید نشانه‌ی تلاشِ دوباره را نابود کند');
ok('سه حالتِ جدا، نه دو تا', /ReleaseResult = 'released' \| 'noop' \| 'failed'/.test(lib));
ok('شکستِ RPC ممیزی می‌شود', /BOOKING_HOLD_RELEASE_FAILED/.test(lib));
ok('مسیرِ abandon روی شکست ۵۰۳ می‌دهد', /r === 'failed'\) return NextResponse\.json\(\{ ok: false \}, \{ status: 503 \}\)/.test(aband));
ok('دسترسی عمومی پس گرفته شده', /REVOKE ALL ON FUNCTION public\.bh_release_hold/.test(sql));
{ /* ترتیبِ قفل باید با bh_confirm_payment یکی باشد (اول payments بعد
     bookings)، وگرنه «انصراف» و کالبک یک چرخه‌ی بن‌بست می‌سازند و
     ممکن است قربانی، تأییدِ یک پرداختِ انجام‌شده باشد. */
  const lock = sql.indexOf('FROM payments WHERE booking_id = p_booking_id ORDER BY id FOR UPDATE');
  const bk   = sql.indexOf('FROM bookings WHERE id = p_booking_id FOR UPDATE');
  ok('قفلِ payments پیش از قفلِ bookings', lock > 0 && bk > 0 && lock < bk); }

console.log('\n■ ۵) سمتِ مرورگر');
ok('خواندنِ یادداشت ویرانگر نیست', /export function peekPendingHold/.test(hold) && !/export function takePendingHold/.test(hold));
ok('یادداشت فقط پس از موفقیت پاک می‌شود', /\.then\(\(\)=>clearPendingHold\(\)\)/.test(page));
ok('pageshow هم گرفته می‌شود', /addEventListener\('pageshow'/.test(page) && /e\.persisted/.test(page));
ok('لیسنر پاک می‌شود', /removeEventListener\('pageshow'/.test(page));
{ /* setRedirecting(false) باید پیش از early-return باشد، وگرنه برگشت با
     back پس از پرداختِ موفق کاربر را پشتِ اسپینر حبس می‌کند */
  const r = page.indexOf('setRedirecting(false)');
  const p2 = page.indexOf('peekPendingHold()');
  ok('اسپینرِ انتقال پیش از هر بازگشتِ زودهنگام خاموش می‌شود', r > 0 && p2 > 0 && r < p2);
}
ok('گاردِ in-flight دارد', /abandoning\.current/.test(page));
ok('درخواستِ رها کردن مهلتِ کوتاه دارد', /abandon`, undefined, \{ timeout: 8000 \}/.test(page));
ok('finally بدونِ گاردِ mount است (ضدِ قفل‌شدن)', /finally\(\(\)=>\{[\s\S]*setReleased\(true\); setSlotsKey/.test(page));
ok('افکتِ ساعت‌ها به released گره خورده', /if\(!selectedTable\|\|!isoDate\|\|!released\) return;/.test(page));
ok('صفحه‌ی نتیجه یادداشت را پاک می‌کند', /clearPendingHold\(\)/.test(res));

console.log('\n' + '─'.repeat(52));
console.log(`  ${fail === 0 ? '✓' : '✗'} ${pass} پاس، ${fail} ناموفق\n`);
process.exit(fail === 0 ? 0 : 1);
