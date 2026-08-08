-- ─────────────────────────────────────────────────────────────────
-- ۰۷۶ — قرعه‌کشیِ خودکار هم بای را علامت بزند
--
-- مهاجرتِ ۰۷۵ بای را به یک واقعیتِ ذخیره‌شده تبدیل کرد، ولی فقط
-- مسیرِ دستی آن را می‌نوشت. قرعه‌کشیِ خودکار جایگاهِ بدونِ حریف را
-- همان‌طور `NULL` می‌گذاشت، پس تبِ قرعه‌کشی بعد از یک قرعه‌کشیِ
-- خودکار همان جایگاه‌ها را «هنوز چیده نشده» می‌دید و دوباره تراشه‌ی
-- Bye نشان می‌داد — برای جدولی که از قبل کامل بود.
--
-- علامت‌گذاری همین‌جا انجام می‌شود چون هر دو مسیر — قرعه‌کشیِ خودکار
-- و «تأیید چیدمان» — آخرش از همین تابع رد می‌شوند.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.bh_bracket_advance_byes(p_tournament uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE m record; n integer := 0; v_reg uuid; v_name text;
BEGIN
  /* جایگاهی که حریف دارد ولی خودش خالی است، بای است — چه دستی
     گذاشته شده باشد چه از قرعه‌کشی آمده باشد. */
  UPDATE public.tournament_matches
     SET p1_bye = true
   WHERE tournament_id = p_tournament AND round = 1
     AND p1_registration_id IS NULL AND p2_registration_id IS NOT NULL
     AND NOT p1_bye;
  UPDATE public.tournament_matches
     SET p2_bye = true
   WHERE tournament_id = p_tournament AND round = 1
     AND p2_registration_id IS NULL AND p1_registration_id IS NOT NULL
     AND NOT p2_bye;

  FOR m IN
    SELECT * FROM public.tournament_matches
     WHERE tournament_id = p_tournament AND round = 1 AND winner IS NOT NULL
     ORDER BY match_index
  LOOP
    IF m.winner = 1 THEN v_reg := m.p1_registration_id; v_name := m.p1_name;
                    ELSE v_reg := m.p2_registration_id; v_name := m.p2_name; END IF;
    IF v_reg IS NULL THEN CONTINUE; END IF;

    IF m.match_index % 2 = 0 THEN
      UPDATE public.tournament_matches SET p1_registration_id = v_reg, p1_name = v_name
       WHERE tournament_id = p_tournament AND round = 2 AND match_index = m.match_index / 2;
    ELSE
      UPDATE public.tournament_matches SET p2_registration_id = v_reg, p2_name = v_name
       WHERE tournament_id = p_tournament AND round = 2 AND match_index = m.match_index / 2;
    END IF;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

/* ردیف‌هایی که پیش از ۰۷۵ کشیده شده‌اند هم یک‌بار علامت می‌خورند،
   وگرنه جدولِ همین حالا روی سرور بعد از دیپلوی «ناقص» دیده می‌شود. */
UPDATE public.tournament_matches
   SET p1_bye = true
 WHERE round = 1 AND p1_registration_id IS NULL
   AND p2_registration_id IS NOT NULL AND NOT p1_bye;
UPDATE public.tournament_matches
   SET p2_bye = true
 WHERE round = 1 AND p2_registration_id IS NULL
   AND p1_registration_id IS NOT NULL AND NOT p2_bye;

SELECT count(*) AS marked FROM public.tournament_matches
 WHERE round = 1 AND (p1_bye OR p2_bye);
