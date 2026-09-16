-- ═══════════════════════════════════════════════════════════════════════════
--  Billiard Hub — جبرانِ مسابقاتی که پیش از اصلاحِ ۰۹۴ «پایان‌یافته» شدند
--
--  ── چه چیزی جا مانده بود ──
--  تا پیش از این اصلاح، `PATCH /api/tournaments/:id/status` وقتی مسابقه را
--  `completed` می‌کرد فقط یک UPDATE ساده می‌زد و `bh_tournament_complete`
--  را صدا نمی‌زد. یعنی مسابقه‌ای که تمام شده، در دفتر **هیچ ردیفی** ندارد:
--  نه کمیسیونِ پلتفرم، نه سهمِ برگزارکننده.
--
--  ۰۹۴ رزروها را جبران کرد (`bh_backfill_completed_ledger`) و بازپرداختِ
--  انصراف‌ها را هم، ولی این یکی جا ماند. اثرش همان لحظه در پنل دیده شد:
--  ناوردایِ تازه دقیقا به اندازه‌ی `TOURNAMENT_PAYMENT`ِ بی‌تکلیف ناصفر بود.
--
--  ── چرا `HELD` نجاتش نمی‌دهد ──
--  `bh_finance_totals` پولِ ثبت‌نامِ مسابقه را فقط تا وقتی «نگه‌داشته»
--  می‌شمارد که مسابقه `completed` نشده باشد. این مسابقه‌ها `completed`
--  هستند، پس از آن‌جا هم می‌افتند — پول نه درآمد است، نه بدهی، نه
--  نگه‌داشته. دقیقا همان «گم‌شدنِ بی‌صدا».
--
--  اجرای مجدد بی‌خطر است: `bh_tournament_complete` با کلیدِ یکتای
--  `source_key` ضدِتکرار است. پیش‌نیاز: ۰۴۱، ۰۹۴.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE r record; n int := 0; m int;
BEGIN
  FOR r IN
    SELECT t.id, t.title
      FROM public.tournaments t
     WHERE t.status = 'completed'
       /* دستِ‌کم یک ثبت‌نامِ پرداخت‌شده دارد که ردیفِ دفترش نیست */
       AND EXISTS (
         SELECT 1 FROM public.tournament_registrations g
          WHERE g.tournament_id = t.id
            AND g.payment_status = 'PAID' AND g.status <> 'CANCELLED'
            AND NOT EXISTS (
              SELECT 1 FROM public.ledger_entries l
               WHERE l.source_key = 'treg:' || g.id || ':CLUB_EARNING'))
  LOOP
    BEGIN
      /* همان تابعِ عادی — نه یک مسیرِ موازی. هر منطقی که فردا به آن
         اضافه شود، این جبران هم می‌گیردش. */
      SELECT public.bh_tournament_complete(r.id) INTO m;
      n := n + 1;
      RAISE NOTICE 'مسابقه «%» جبران شد — % ثبت‌نام', r.title, m;
    EXCEPTION WHEN OTHERS THEN
      /* یک مسابقه‌ی خراب نباید کلِ مهاجرت را برگرداند */
      RAISE WARNING 'جبرانِ مسابقه % ناموفق: %', r.id, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'مجموعِ مسابقاتِ جبران‌شده: %', n;
END $$;

SELECT public.bh_reconcile_all_clubs();
