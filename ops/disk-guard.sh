#!/bin/bash
# نگهبانِ فضای دیسک.
#
# ── چرا جدا از پشتیبان ──
# پشتیبان شبی یک‌بار اجرا می‌شود. اگر ساعتِ ۴ بامداد آپلودی دیسک را پر
# کند، تا شبِ بعد کسی خبردار نمی‌شود — و در آن فاصله Postgres هم
# می‌ایستد، چون نوشتنِ WAL روی همان پارتیشن است. پر شدنِ دیسک فقط
# «رسانه بالا نمی‌رود» نیست؛ کلِ سایت می‌خوابد.
#
# ── چرا پیامک/ایمیل نمی‌فرستد ──
# سرویسِ پیامکِ پروژه برای کاربر است و اعتبارش مصرفی. این‌جا فقط
# می‌نویسد و — اگر از آستانه‌ی بحرانی گذشت — یک فایلِ پرچم می‌سازد که
# دیپلوی هم آن را می‌بیند. اگر روزی هشدارِ بیرونی خواستی، همین‌جا یک
# خط اضافه می‌شود.
#
# ── چرا سه آستانه ──
# ۷۰٪ یعنی «برنامه‌ریزی کن»، ۸۵٪ یعنی «این هفته», ۹۵٪ یعنی «همین حالا».
# یک آستانه‌ی تنها یا زود داد می‌زند و بی‌اثر می‌شود، یا دیر.
set -u

LOG=/var/backups/billiardhub/disk.log
FLAG=/var/backups/billiardhub/.disk-critical
WARN=70
HIGH=85
CRIT=95

USE=$(df --output=pcent / | tail -1 | tr -dc '0-9')
FREE=$(df -h --output=avail / | tail -1 | tr -d ' ')
MEDIA=$(du -sh /opt/supabase/docker/volumes/storage 2>/dev/null | cut -f1)
BK=$(du -sh /var/backups/billiardhub 2>/dev/null | cut -f1)

line="$(date '+%F %T')  دیسک ${USE}٪ · آزاد $FREE · رسانه $MEDIA · پشتیبان $BK"

# ── فقط وقتی چیزی برای گفتن هست ──
# نوشتنِ هر ساعت یعنی لاگی که کسی نمی‌خواندش. حالتِ عادی روزی یک‌بار
# ثبت می‌شود تا روندِ رشد معلوم باشد، و هشدارها همیشه.
if [ "$USE" -ge "$CRIT" ]; then
  echo "$line  ⛔ بحرانی — Postgres با پر شدنِ دیسک می‌ایستد" >> "$LOG"
  date '+%F %T' > "$FLAG"
elif [ "$USE" -ge "$HIGH" ]; then
  echo "$line  ⚠ بالا — این هفته فضا اضافه کن" >> "$LOG"
  rm -f "$FLAG"
elif [ "$USE" -ge "$WARN" ]; then
  echo "$line  ⚠ برنامه‌ریزی کن — بلاک‌استوریجِ جدا" >> "$LOG"
  rm -f "$FLAG"
else
  rm -f "$FLAG"
  LAST=$(tail -1 "$LOG" 2>/dev/null | cut -c1-10)
  [ "$LAST" = "$(date '+%F')" ] || echo "$line" >> "$LOG"
fi

# ── کوتاه نگه‌داشتنِ لاگ ──
if [ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt 2000 ]; then
  tail -1000 "$LOG" > "$LOG.tmp" && mv -f "$LOG.tmp" "$LOG"
fi
