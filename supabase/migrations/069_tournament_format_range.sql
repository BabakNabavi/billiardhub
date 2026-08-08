-- ─────────────────────────────────────────────────────────────────
-- ۰۶۹ — تنگ‌کردنِ محدوده‌ی فرمت مسابقه
--
-- بعد از آزمایشِ واقعی، سه تغییر در فهرستِ فرمت‌ها:
--
--   • `race3` برداشته شد. مسابقه‌ای که با دو رکِ بُرد تمام می‌شود
--     عملاً قرعه‌کشی است نه مسابقه.
--   • `race12` اضافه شد — فینال‌ها معمولاً بلندترند.
--   • زمان‌دارها از ۶۰ دقیقه شروع می‌شوند؛ ۳۰ و ۴۵ اندازه‌ی یک
--     بازیِ دوستانه است نه یک دورِ مسابقه.
--
-- `bo3` عمداً می‌ماند: در اسنوکر سه فریم یک مسابقه‌ی واقعی است.
--
-- ⚠️ قید تنگ‌تر می‌شود، پس ردیف‌های موجود اول بررسی می‌شوند. اگر
-- ردیفی با فرمتِ حذف‌شده باشد، مهاجرت با پیام می‌ایستد به‌جای اینکه
-- با خطای مبهمِ CHECK شکست بخورد.
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.tournaments
   WHERE match_format IN ('race3', 'time30', 'time45');
  IF n > 0 THEN
    RAISE EXCEPTION
      'ابتدا % مسابقه با فرمتِ race3/time30/time45 را ویرایش کنید', n;
  END IF;
END $$;

ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_match_format_chk;

ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_match_format_chk
  CHECK (
    match_format IS NULL
    OR match_format ~ '^(bo(3|5|7|9|11)|race([4-9]|1[012])|time(60|75|90|105|120|150|180))$'
  );

-- ── بررسی ──
-- انتظار: هر سه ✓
SELECT
  (SELECT pg_get_constraintdef(oid) ~ 'race\(\[4-9\]'
     FROM pg_constraint WHERE conname = 'tournaments_match_format_chk')  AS race_from_4,
  (SELECT pg_get_constraintdef(oid) ~ '1\[012\]'
     FROM pg_constraint WHERE conname = 'tournaments_match_format_chk')  AS race_to_12,
  (SELECT pg_get_constraintdef(oid) ~ 'time\(60'
     FROM pg_constraint WHERE conname = 'tournaments_match_format_chk')  AS time_from_60;
