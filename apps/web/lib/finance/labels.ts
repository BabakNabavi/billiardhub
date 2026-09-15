/* ─────────────────────────────────────────────────────────────
   نامِ فارسیِ هر نوعِ ردیفِ دفتر — منبعِ واحد.

   پیش‌تر دو فهرستِ جدا بود (یکی در `api/admin/finance/timeline`) و
   هیچ‌کدام با نوع‌های تازه‌ی تبلیغات و ارتقای آگهی به‌روز نشده بود،
   پس آن ردیف‌ها در یک صفحه‌ی فارسیِ راست‌به‌چپ با نامِ انگلیسیِ خام
   نشان داده می‌شدند.

   هر نوعی که به `ledger_type_chk` اضافه می‌شود باید این‌جا هم بیاید.
   ───────────────────────────────────────────────────────────── */

export const LEDGER_LABEL: Record<string, string> = {
  BOOKING_PAYMENT: 'پول رزرو وارد حساب مرکزی شد',
  TOURNAMENT_PAYMENT: 'پول ثبت‌نام مسابقه وارد حساب مرکزی شد',
  PLATFORM_COMMISSION: 'کمیسیون پلتفرم قطعی شد',
  PLATFORM_COMMISSION_REVERSAL: 'کمیسیون برگشت خورد',
  CLUB_EARNING: 'سهم باشگاه ایجاد شد (بدهی ما)',
  CLUB_EARNING_REVERSAL: 'سهم باشگاه برگشت خورد',
  CANCELLATION_FEE: 'جریمه لغو — درآمد پلتفرم',
  REFUND: 'بازپرداخت به کاربر',
  SETTLEMENT: 'تسویه با باشگاه',
  SETTLEMENT_REVERSAL: 'تسویه ناموفق — بدهی برگشت',
  AD_REVENUE: 'فروش تبلیغات',
  AD_REFUND: 'بازپرداخت تبلیغات',
  AD_BOOST_REVENUE: 'ارتقای آگهی',
  AD_BOOST_REFUND: 'بازپرداخت ارتقای آگهی',
  ADJUSTMENT: 'اصلاح دستی',
}

/** نامِ کوتاه برای ستونِ «نوع» در جدولِ گزارش */
export const LEDGER_SHORT: Record<string, string> = {
  BOOKING_PAYMENT: 'پرداخت رزرو',
  TOURNAMENT_PAYMENT: 'پرداخت ثبت‌نام',
  PLATFORM_COMMISSION: 'کمیسیون پلتفرم',
  PLATFORM_COMMISSION_REVERSAL: 'برگشت کمیسیون',
  CLUB_EARNING: 'سهم باشگاه',
  CLUB_EARNING_REVERSAL: 'برگشت سهم باشگاه',
  CANCELLATION_FEE: 'جریمه لغو',
  REFUND: 'بازپرداخت',
  SETTLEMENT: 'تسویه با باشگاه',
  SETTLEMENT_REVERSAL: 'برگشت تسویه',
  AD_REVENUE: 'فروش تبلیغات',
  AD_REFUND: 'بازپرداخت تبلیغات',
  AD_BOOST_REVENUE: 'ارتقای آگهی',
  AD_BOOST_REFUND: 'بازپرداخت ارتقای آگهی',
  ADJUSTMENT: 'اصلاح دستی',
}

export const LEDGER_TYPES = Object.keys(LEDGER_SHORT)
