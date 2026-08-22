/* ─────────────────────────────────────────────────────────────
   کانالِ کاربر — منبعِ واحدِ تایپ و قواعد.

   ── چرا این فایل ساخته شد ──
   `UserChannel` سه بار جدا اعلام شده بود (مسیرِ API، `lib/media-user`،
   و کامپوننتِ دروازه) و همان‌طور که انتظار می‌رود از هم جدا افتاده
   بودند: یکی‌شان `role` نداشت. اتحادِ نقش‌ها هم دو بار تعریف شده بود.

   ⚠️ این فایل عمداً هیچ وابستگیِ سروری ندارد. مسیرِ API به
   `lib/social-server` وصل است و اگر کلاینت از آن ایمپورت کند، کلیدِ
   سرویس‌رول به بسته‌ی مرورگر کشیده می‌شود.
   ───────────────────────────────────────────────────────────── */

/** نقش‌هایی که گالری و کانال دارند — «کاربر عادی» عمداً نیست. */
export const CHANNEL_ROLES = [
  'club', 'coach', 'referee', 'player', 'technician', 'seller', 'manufacturer',
] as const
export type ChannelRole = (typeof CHANNEL_ROLES)[number]

export const ROLE_FA: Record<ChannelRole, string> = {
  club: 'باشگاه', coach: 'مربی', referee: 'داور', player: 'بازیکن',
  technician: 'متخصص فنی', seller: 'فروشگاه', manufacturer: 'تولیدکننده',
}

export interface UserChannel {
  /** شناسه‌ی تغییرناپذیر.
   *
   *  ⚠️ کلیدِ یکتا پیش‌تر «مالک + هندل» بود، پس عوض‌کردنِ هندل یک
   *  کانالِ *دوم* می‌ساخت و ویدیوهای منتشرشده زیرِ هندلِ قدیمی به
   *  کانالی رها اشاره می‌کردند. کانال‌های پیش از این تغییر `id`
   *  ندارند و با هندل شناخته می‌شوند تا اولین ویرایش. */
  id?: string
  ownerKey: string
  name: string
  handle: string
  bio: string
  avatar: string
  createdAt: number
  /** نقش‌هایی که این کانال خانه‌شان است */
  roles?: ChannelRole[]
  /** میدانِ قدیمی — فقط برای خواندنِ ردیف‌های پیش از چندنقشی‌شدن */
  role?: ChannelRole
}

export const asRole = (v: unknown): ChannelRole | undefined =>
  (CHANNEL_ROLES as readonly string[]).includes(String(v)) ? (String(v) as ChannelRole) : undefined

/** همان قاعده‌ای که سرور اعمال می‌کند — کلاینت باید هم‌شکل باشد. */
export const normHandle = (h: string) =>
  String(h || '').trim().replace(/^@+/, '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 30).toLowerCase()

/** آیا این کانال خانه‌ی این نقش است؟ (`role` میدانِ قدیمی است) */
export const servesRole = (c: UserChannel, role: ChannelRole) =>
  (c.roles ?? []).includes(role) || c.role === role

/** برچسبِ فارسیِ نقش‌های یک کانال */
export const roleLabels = (c: UserChannel) =>
  (c.roles?.length ? c.roles : c.role ? [c.role] : []).map(r => ROLE_FA[r]).join(' · ')

/* ── شناسه‌ی ردیف‌های پیش از این تغییر ──
   کانال‌های قدیمی `id` ندارند. اگر موقعِ خواندن یک شناسه‌ی *تصادفی*
   می‌ساختیم، دو تب دو شناسه‌ی متفاوت می‌گرفتند و ذخیره‌ی یکی، آن
   یکی را ۴۰۴ می‌کرد. پس شناسه از خودِ داده ساخته می‌شود: هر بار،
   هر جا، یکسان — بدونِ نوشتن در فایل. */
const hash = (s: string) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(36)
}
/* ⚠️ نسخه‌ی اول `ownerKey` را در ورودیِ هش داشت — و `ownerKey` برای
   بیشترِ کاربران شماره‌ی موبایل است. شناسه در پاسخِ *عمومیِ* فهرستِ
   کانال‌ها برمی‌گردد و `handle`/`createdAt` هم عمومی‌اند، پس شماره
   تنها مجهولِ معادله می‌شد: یک جست‌وجوی کوچک روی فضای `09XXXXXXXXX`
   آن را برمی‌گرداند و هشِ `publicOwnerKey` بی‌اثر می‌شد. حالا ورودی
   فقط از میدان‌های عمومی می‌آید.
   یکتایی از `handle` می‌آید که خودش در کلِ سایت یکتاست. */
export const legacyId = (c: Pick<UserChannel, 'handle' | 'createdAt'>) =>
  `ch_l${hash(String(c.handle))}${hash(`${c.handle}|${c.createdAt}`)}`

/** شناسه‌ی قطعیِ یک کانال — چه تازه، چه قدیمی. */
export const channelKey = (c: UserChannel) => c.id || legacyId(c)
