#!/bin/bash
# یکی‌کردنِ دامنه — همه‌ی بازدیدها به `billiardhub.net` (بدونِ www).
#
#     ssh -i /c/Users/bob/.ssh/billiardhub_parspack root@130.185.72.87 \
#       'cat > /tmp/nginx-canonical.sh' < nginx-canonical.sh
#     ssh -i /c/Users/bob/.ssh/billiardhub_parspack root@130.185.72.87 \
#       'bash /tmp/nginx-canonical.sh'
#
# ── چرا (اندازه‌گیری‌شده) ──
# سایت روی هر دو میزبان سرو می‌شد، ولی تصویرهای Storage همیشه از
# `billiardhub.net` می‌آیند (چون `NEXT_PUBLIC_SUPABASE_URL` همان است).
# پس بازدیدکننده‌ای که روی `www` بود، همه‌ی تصویرها را cross-origin
# می‌گرفت. تستِ کنترل‌شده با کروم، همان صفحه:
#
#     از www.billiardhub.net  →  ۲۰ درخواستِ شبکه برای ۴ تصویر
#     از billiardhub.net      →   ۴ درخواستِ شبکه برای ۴ تصویر
#
# یعنی هر تصویر پنج بار. دو مبدأ یعنی دو استخرِ اتصال، دست‌دادنِ TLSِ
# جدا، و کشی که بینشان مشترک نیست.
#
# ── سودِ دوم: یک باگِ نشست ──
# کوکی‌های نشست `Domain` ندارند (host-only). `NEXT_PUBLIC_SITE_URL`
# هم `billiardhub.net` است، پس کالبکِ درگاه همیشه به همان‌جا
# برمی‌گردد. یعنی کاربری که روی `www` وارد شده بود، **بعد از پرداخت
# خارج‌شده به‌نظر می‌رسید**. با یکی‌شدنِ میزبان این هم بسته می‌شود.
#
# ── اثرِ جانبی که باید بدانی ──
# کسانی که همین حالا روی `www` وارد‌اند، یک‌بار باید دوباره وارد شوند
# (کوکیِ host-only به میزبانِ تازه نمی‌آید). یک‌بار، و برای همیشه.
set -e

F=/etc/nginx/sites-enabled/billiardhub
BAK=/root/billiardhub.nginx.bak.$(date +%Y%m%d-%H%M%S)
cp "$F" "$BAK"
echo "پشتیبان: $BAK"

if grep -q 'BH-CANONICAL' "$F"; then
  echo "هدایت: از قبل بود"
else
  python3 - "$F" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
rule = '''
    # ── BH-CANONICAL ──
    # یک میزبانِ قطعی. تصویرهای Storage روی `billiardhub.net` سرو
    # می‌شوند، پس بازدید از `www` همه‌شان را cross-origin می‌کرد:
    # ۲۰ درخواست به‌جای ۴ برای همان چهار تصویر.
    if ($host != "billiardhub.net") {
        return 301 https://billiardhub.net$request_uri;
    }
'''
anchor = '    client_max_body_size 60M;'
if anchor not in s:
    sys.exit('لنگر پیدا نشد — دستی اضافه کن')
s = s.replace(anchor, anchor + '\n' + rule, 1)
open(p, 'w', encoding='utf-8').write(s)
PY
  echo "هدایت: اضافه شد"
fi

echo "── تستِ پیکربندی ──"
if ! nginx -t; then
  echo "✗ نامعتبر — برگرداندنِ پشتیبان"
  cp "$BAK" "$F"; nginx -t; exit 1
fi

systemctl reload nginx
sleep 2
echo "── بررسی ──"
echo -n "www  → "; curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.billiardhub.net/
echo -n "apex → "; curl -s -o /dev/null -w "%{http_code}\n" https://billiardhub.net/
echo "✅ انجام شد. برگرداندن:  cp $BAK $F && nginx -t && systemctl reload nginx"
