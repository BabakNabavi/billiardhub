#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
#  آزمایشِ مهاجرت پیش از اجرا روی داده‌ی واقعی
#
#      bash db-dryrun.sh supabase/migrations/104_whatever.sql
#
#  ── چرا این، به‌جای یک محیطِ staging کامل ──
#  staging کلاسیک یعنی سرویسِ دومِ Next، دیتابیسِ دوم، رکوردِ DNS،
#  گواهیِ SSL و همگام نگه‌داشتنِ دائمیِ دو محیط — پنج قطعه‌ی متحرکِ
#  همیشه‌روشن روی یک VPS، برای پروژه‌ای که یک نفر نگهش می‌دارد.
#
#  ولی آنچه staging در این پروژه *واقعا* کم داشت یک چیزِ مشخص بود:
#  هر مهاجرت مستقیم روی داده‌ی زنده اجرا می‌شد. هفت مهاجرتِ اخیر
#  (۰۹۷ تا ۱۰۳) همه بدونِ هیچ آزمایشِ قبلی رفتند. اگر یکی‌شان وسط
#  کار می‌شکست، دیتابیسِ زنده نیمه‌کاره می‌ماند.
#
#  این اسکریپت همان یک چیز را می‌دهد و بقیه‌ی پیچیدگی را نمی‌آورد:
#  یک کپیِ **فقط-اسکیما** از دیتابیسِ زنده در یک دیتابیسِ موقت
#  می‌سازد، مهاجرت را رویش اجرا می‌کند، نتیجه را می‌گوید و پاکش
#  می‌کند.
#
#  ── چرا فقط اسکیما ──
#  ⚠️ چون هیچ داده‌ی کاربری کپی نمی‌شود: نه کد ملی، نه شماره، نه
#  دفترِ مالی. یک کپیِ کاملِ داده روی همان سرور، سطحِ نشت را دو
#  برابر می‌کرد. و برای سنجشِ مهاجرت — که ساختار را عوض می‌کند نه
#  داده را — اسکیما کافی است.
#
#  ⚠️ چیزی که **نمی‌سنجد**: مهاجرتی که به داده وابسته است (مثلا
#  بک‌فیل یا قیدی که روی ردیف‌های موجود می‌شکند). برای آن‌ها هنوز
#  باید با دقت رفت.
#
#  ── امنیت ──
#  دیتابیسِ موقت همیشه پاک می‌شود، حتی اگر مهاجرت شکست بخورد یا
#  اسکریپت وسطِ کار قطع شود (trap).
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

SRV=root@130.185.72.87
KEY=~/.ssh/billiardhub_parspack
SSH=(ssh -n -o ConnectTimeout=25 -i "$KEY")
# نامِ یکتا، تا دو اجرای هم‌زمان به هم نخورند
SCRATCH="bh_dryrun_$(date +%s)"

MIG="${1:-}"
if [ -z "$MIG" ] || [ ! -f "$MIG" ]; then
  echo "استفاده:  bash db-dryrun.sh <مسیرِ فایلِ مهاجرت>" >&2
  echo "مثال:     bash db-dryrun.sh supabase/migrations/104_x.sql" >&2
  exit 2
fi

echo "── مهاجرت: $MIG"
echo "── دیتابیسِ موقت: $SCRATCH"

psql_srv() { "${SSH[@]}" "$SRV" "docker exec -i supabase-db psql -U postgres -v ON_ERROR_STOP=1 $*"; }

cleanup() {
  echo "── پاک‌سازی"
  # ⚠️ بدونِ -n این‌جا: stdin آزاد است و می‌خواهیم همیشه اجرا شود
  ssh -o ConnectTimeout=25 -i "$KEY" "$SRV" \
    "docker exec -i supabase-db psql -U postgres -d postgres -c 'DROP DATABASE IF EXISTS $SCRATCH'" \
    >/dev/null 2>&1 || echo "  ⚠️ حذفِ $SCRATCH انجام نشد — دستی پاکش کنید" >&2
}
trap cleanup EXIT

echo "── ساختِ کپیِ فقط-اسکیما"
psql_srv -d postgres -c "\"CREATE DATABASE $SCRATCH\"" >/dev/null

# pg_dump و psql هر دو داخلِ همان کانتینر، پس داده از سرور بیرون نمی‌رود
"${SSH[@]}" "$SRV" "docker exec -i supabase-db bash -c \
  'pg_dump -U postgres --schema-only --no-owner --no-privileges postgres | psql -U postgres -q -d $SCRATCH'" \
  >/dev/null
echo "   اسکیما کپی شد"

echo "── اجرای مهاجرت روی کپی"
# `--single-transaction` همان شرایطی است که روی پروداکشن هم توصیه شده
if "${SSH[@]}" "$SRV" \
     "docker exec -i supabase-db psql -U postgres -d $SCRATCH -v ON_ERROR_STOP=1 --single-transaction" \
     < "$MIG"; then
  echo
  echo "✅ مهاجرت روی کپیِ اسکیما بدونِ خطا اجرا شد."
  echo "   حالا می‌توانید همان را روی پروداکشن بزنید:"
  echo
  echo "   cat $MIG | ssh -i $KEY $SRV \\"
  echo "     \"docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 --single-transaction\""
else
  echo
  echo "✗ مهاجرت روی کپی شکست خورد — روی پروداکشن نزنید." >&2
  exit 1
fi
