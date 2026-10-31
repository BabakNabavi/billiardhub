-- ═════════════════════════════════════════════════════════════════════
-- 115 — پخش از مرورگر مستقیم به سرویسِ پخش (WebRTC / WHIP)
--
-- ⚠️ دستی و با تأییدِ صریحِ مالک اجرا شود (deploy.sh مهاجرت نمی‌برد):
--   docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < 115_live_whip.sql
--
-- دو ستونِ اختیاری روی live_channels: اگر سرویسِ پخش (آروان) ورودیِ WHIP
-- بدهد، مرورگرِ باشگاه‌دار بی‌واسطه به همان وصل می‌شود. خالی = از راهِ
-- رله‌ی سایت (مرورگر ← رله ← RTMP). توکن رمزشده است، مثلِ کلیدِ استریم.
-- فقط افزودنی؛ هیچ داده‌ای عوض نمی‌شود.
-- ═════════════════════════════════════════════════════════════════════

BEGIN;
ALTER TABLE public.live_channels
  ADD COLUMN IF NOT EXISTS whip_url       text,
  ADD COLUMN IF NOT EXISTS whip_token_enc text;
COMMIT;

NOTIFY pgrst, 'reload schema';

-- ROLLBACK (دستی):
-- ALTER TABLE public.live_channels DROP COLUMN IF EXISTS whip_url, DROP COLUMN IF EXISTS whip_token_enc;
-- NOTIFY pgrst, 'reload schema';
