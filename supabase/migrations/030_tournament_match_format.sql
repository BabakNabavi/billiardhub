-- ─────────────────────────────────────────────────────────────
-- فرمتِ مسابقه (Best Of ۳/۵/۷/۹/۱۱)
--
-- فرمِ ساختِ مسابقه این را از کاربر می‌گرفت ولی جایی برای ذخیره‌اش
-- نبود، پس هر بار بی‌صدا دور ریخته می‌شد. حالا ستون دارد و مقدارش با
-- CHECK به همان فهرستِ بسته محدود است تا «bo5» و «Best of 5» و
-- «حذفی» کنارِ هم ننشینند.
--
-- NULL مجاز است: مسابقاتی که پیش از این ساخته شده‌اند فرمتی ثبت نکرده‌اند
-- و نباید با یک پیش‌فرضِ ساختگی پر شوند.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS match_format text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_match_format_chk'
  ) THEN
    ALTER TABLE public.tournaments
      ADD CONSTRAINT tournaments_match_format_chk
      CHECK (match_format IS NULL OR match_format IN ('bo3','bo5','bo7','bo9','bo11'));
  END IF;
END $$;
