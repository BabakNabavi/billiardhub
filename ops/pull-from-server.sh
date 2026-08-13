#!/usr/bin/env bash
# کشیدنِ بکاپ‌های سرور به لپ‌تاپ.
#
# ── چرا این لازم است ──
# سرور هر شب ساعت ۳ از خودش بکاپ می‌گیرد، ولی آن بکاپ روی *همان دیسکی*
# می‌نشیند که داده رویش است. اگر سرور پاک شود یا دیسک بسوزد، بکاپ هم با
# آن می‌رود. بکاپی که کنارِ اصلِ داده بماند فقط نصفِ کار است.
#
# ── چرا فقط ssh و نه scp ──
# ترافیکِ این لپ‌تاپ از VPN رد می‌شود و سرورِ ایرانی از آن مسیر در دسترس
# نیست. در تنظیماتِ Happ فقط `ssh.exe` مستقیم شده — `scp.exe` فایلِ
# اجراییِ جداگانه‌ای است و همچنان داخلِ تونل می‌ماند. پس همه‌چیز با یک
# لوله‌ی tar روی ssh می‌آید.
#
# ── چرا bash و نه PowerShell ──
# PowerShell خروجیِ باینری را متن فرض می‌کند و موقعِ ریدایرکت خرابش
# می‌کند؛ آرشیوِ tar سالم نمی‌رسد.
#
# لپ‌تاپ خاموش باشد چیزی از دست نمی‌رود: دفعه‌ی بعد که روشن شد، هرچه جا
# مانده را می‌آورد.

set -uo pipefail

KEY="/c/Users/bob/Desktop/SERVER/private-key-file.pem"
HOST="root@130.185.72.87"
REMOTE="/var/backups/billiardhub"
LOCAL="/i/BilliardhubBackup/server"
KEEP=60                      # روی لپ‌تاپ بیشتر نگه می‌داریم — جا هست
LOG="/i/BilliardhubBackup/pull.log"

say() { echo "$(date '+%Y-%m-%d %H:%M:%S')  $*" | tee -a "$LOG"; }

mkdir -p "$LOCAL"
# `-n` یعنی ssh ورودیِ استاندارد را از /dev/null بگیرد.
#
# بدونِ آن، `ssh` داخلِ حلقه‌ی `while read` بقیه‌ی فهرست را می‌بلعد و
# حلقه بعد از **اولین** پوشه تمام می‌شود — بی هیچ خطایی. اولین اجرا
# دقیقاً همین شد: از سه بکاپ فقط یکی آمد و لاگ هم موفق به‌نظر می‌رسید.
# ساکت‌ترین نوعِ خرابی برای یک اسکریپتِ پشتیبان.
SSH=(ssh -n -i "$KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=25 -o BatchMode=yes "$HOST")

if ! "${SSH[@]}" true 2>/dev/null; then
  say "✗ سرور در دسترس نیست — دفعه‌ی بعد"
  exit 0                     # خطا نیست؛ لپ‌تاپ ممکن است آفلاین باشد
fi

REMOTE_DIRS=$("${SSH[@]}" "ls -1 $REMOTE 2>/dev/null | grep -E '^20[0-9]{2}-'" || true)
[ -z "$REMOTE_DIRS" ] && { say "✗ روی سرور بکاپی پیدا نشد"; exit 0; }

NEW=0
while read -r D; do
  [ -z "$D" ] && continue
  [ -d "$LOCAL/$D" ] && continue

  # اول در پوشه‌ی موقت باز می‌شود. اگر وسطِ کار قطع شد، پوشه‌ی ناقص با
  # نامِ اصلی جا نمی‌ماند — وگرنه دفعه‌ی بعد «هست» فرض می‌شود و آن بکاپ
  # برای همیشه ناقص می‌ماند.
  TMP="$LOCAL/.tmp-$D"
  rm -rf "$TMP"; mkdir -p "$TMP"

  if "${SSH[@]}" "tar cf - -C $REMOTE '$D'" | tar xf - -C "$TMP" 2>/dev/null \
     && [ -d "$TMP/$D" ]; then
    mv "$TMP/$D" "$LOCAL/$D"; rm -rf "$TMP"
    say "✓ $D  ($(du -sh "$LOCAL/$D" | cut -f1))"
    NEW=$((NEW+1))
  else
    rm -rf "$TMP"
    say "✗ $D — انتقال ناقص ماند"
  fi
done <<< "$REMOTE_DIRS"

[ "$NEW" -eq 0 ] && say "— چیزِ تازه‌ای نبود"

# قدیمی‌ها
find "$LOCAL" -maxdepth 1 -type d -name '20*' | sort | head -n -"$KEEP" | while read -r O; do
  rm -rf "$O"; say "🗑 $(basename "$O") حذف شد (بیش از $KEEP نسخه)"
done

# ══ آینه‌ی رسانه ══
#
# ── چرا جدا از پوشه‌های تاریخ‌دار ──
# تا امروز فایل‌ها داخلِ هر بکاپِ شبانه به‌صورتِ یک tar کامل می‌آمدند.
# با ۲۴ مگابایت درست کار می‌کرد؛ با ویدیو یعنی هر شب چند گیگ از یک
# اینترنتِ خانگی. حالا سرور یک آینه‌ی افزایشی نگه می‌دارد و این‌جا فقط
# **تفاوت** کشیده می‌شود.
#
# ── چرا با فهرست و نه rsync ──
# rsync روی این لپ‌تاپ نیست (Git Bash نداردش) و ترافیک هم باید از همان
# تونلی برود که فقط `ssh.exe` را مستقیم کرده. پس تفاوت از روی فهرستِ
# checksum حساب می‌شود و فقط همان فایل‌ها با یک tar می‌آیند.
MEDIA_REMOTE="$REMOTE/media"
MEDIA_LOCAL="/i/BilliardhubBackup/media"
mkdir -p "$MEDIA_LOCAL/current"

if "${SSH[@]}" "test -f $MEDIA_REMOTE/index" 2>/dev/null; then
  # ── چرا شمارشِ خطوط سنجیده می‌شود ──
  # اتصالی که وسطِ کار قطع شود، فهرستِ نصفه می‌گذارد که هنوز ناخالی
  # است. آن فهرست یعنی «بقیه‌ی فایل‌ها روی سرور نیستند» و پاک‌سازیِ
  # پایین‌تر تنها نسخه‌ی بیرونی را نابود می‌کند.
  REMOTE_N=$("${SSH[@]}" "wc -l < $MEDIA_REMOTE/index" 2>/dev/null | tr -dc '0-9')
  "${SSH[@]}" "cat $MEDIA_REMOTE/index" > "$MEDIA_LOCAL/index.tmp" 2>/dev/null
  GOT=$?
  LOCAL_N=$(wc -l < "$MEDIA_LOCAL/index.tmp" 2>/dev/null | tr -dc '0-9')
  if [ "$GOT" -eq 0 ] && [ -n "$REMOTE_N" ] && [ "${LOCAL_N:-0}" -eq "$REMOTE_N" ]; then
    mv -f "$MEDIA_LOCAL/index.tmp" "$MEDIA_LOCAL/index.remote"
  else
    rm -f "$MEDIA_LOCAL/index.tmp"
    say "✗ رسانه: فهرست ناقص رسید ($LOCAL_N از $REMOTE_N) — این دور رد شد"
  fi

  if [ -s "$MEDIA_LOCAL/index.remote" ]; then
    # فایلی که نیست یا اندازه‌اش فرق دارد ⟵ باید بیاید
    : > "$MEDIA_LOCAL/.want"
    while IFS='|' read -r rp rsz rmt rh; do
      [ -z "$rp" ] && continue
      rel="${rp#./}"
      f="$MEDIA_LOCAL/current/$rel"
      if [ ! -f "$f" ] || [ "$(stat -c%s "$f" 2>/dev/null)" != "$rsz" ]; then
        printf '%s\n' "$rel" >> "$MEDIA_LOCAL/.want"
      fi
    done < "$MEDIA_LOCAL/index.remote"

    WANT=$(wc -l < "$MEDIA_LOCAL/.want" | tr -d ' ')
    if [ "${WANT:-0}" -gt 0 ]; then
      # فهرست اول می‌رود، بعد فقط همان فایل‌ها برمی‌گردند
      # ── چرا این یکی -n ندارد ──
      # SSH با -n تعریف شده و -n یعنی stdin از /dev/null. پس
      # `cat > file < list` هیچ‌چیز نمی‌فرستد، فهرست خالی می‌ماند،
      # tar آرشیوِ خالی می‌سازد و لاگ «۴۴۴ فایلِ تازه» می‌نویسد.
      # همان تله‌ای که بالای همین فایل دربارهٔ حلقه هشدار داده شده.
      ssh -i "$KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=25 \
        -o BatchMode=yes "$HOST" "cat > /tmp/bh-pull.list" < "$MEDIA_LOCAL/.want"
      if "${SSH[@]}" "tar cf - -C $MEDIA_REMOTE/current -T /tmp/bh-pull.list" \
         | tar xf - -C "$MEDIA_LOCAL/current" 2>/dev/null; then
        say "✓ رسانه: $WANT فایلِ تازه"
      else
        say "✗ رسانه: انتقال ناقص ماند"
      fi
    else
      say "— رسانه: تغییری نبود"
    fi

    # ── حذفِ آنچه روی سرور نیست ──
    # آینه باید آینه بماند، وگرنه فایلِ پاک‌شده تا ابد این‌جا می‌ماند و
    # حجم فقط بالا می‌رود. عکسِ لحظه‌ایِ سرور تاریخچه را نگه می‌دارد.
    (cd "$MEDIA_LOCAL/current" && find . -type f 2>/dev/null | sed 's|^\./||' | sort) > "$MEDIA_LOCAL/.have"
    cut -d'|' -f1 "$MEDIA_LOCAL/index.remote" | sed 's|^\./||' | sort > "$MEDIA_LOCAL/.theirs"
    GONE=$(comm -23 "$MEDIA_LOCAL/.have" "$MEDIA_LOCAL/.theirs" | wc -l | tr -d ' ')
    HAVE_N=$(wc -l < "$MEDIA_LOCAL/.have" | tr -d ' ')
    # ── سقفِ حذف ──
    # حذفِ چند فایل عادی است؛ حذفِ نیمی از آرشیو یعنی چیزی غلط است —
    # فهرستِ ناقص، مسیرِ عوض‌شده، یا پاک‌شدنِ سرور. در آن حالت نسخه‌ی
    # بیرونی باید دست‌نخورده بماند و آدم تصمیم بگیرد.
    if [ "${GONE:-0}" -gt 0 ] && [ "${HAVE_N:-0}" -gt 20 ] \
       && [ "$GONE" -gt $((HAVE_N / 5)) ]; then
      say "⛔ رسانه: $GONE از $HAVE_N فایل قرار بود حذف شود — دست نزدم"
    elif [ "${GONE:-0}" -gt 0 ]; then
      comm -23 "$MEDIA_LOCAL/.have" "$MEDIA_LOCAL/.theirs" | while read -r g; do
        rm -f "$MEDIA_LOCAL/current/$g"
      done
      say "🗑 رسانه: $GONE فایل که روی سرور نیست حذف شد"
    fi

    # ── تأییدِ checksum ──
    # کپیِ سالم‌به‌نظر ولی خرابْ بدترین نوعِ پشتیبان است. یک نمونه هر شب.
    # بودجه‌ی بایتی، نه تعدادِ ثابت — دلیلش در backup.sh روی سرور
    BADC=0; SEENB=0; VB=$((1024 * 1024 * 1024))
    while IFS='|' read -r rp rsz rmt rh; do
      [ "$SEENB" -ge "$VB" ] && break
      f="$MEDIA_LOCAL/current/${rp#./}"
      [ -f "$f" ] || continue
      case $rsz in "" | *[!0-9]*) continue ;; esac
      SEENB=$((SEENB + rsz))
      # هشِ نامعتبر یعنی فهرست مشکوک است، نه فایل
      case $rh in *[!0-9a-f]* | "") continue ;; esac
      [ "${#rh}" -eq 64 ] || continue
      GOT_H=$(sha256sum "$f" 2>/dev/null | cut -d' ' -f1)
      # خواندنی که شکست بخورد، دلیلِ خرابی نیست
      [ -n "$GOT_H" ] || continue
      if [ "$GOT_H" != "$rh" ]; then
        # ── قرنطینه، نه حذف ──
        # ناهم‌خوانی سه علت دارد و از این‌جا قابلِ تفکیک نیست: خرابیِ
        # محلی، خرابیِ خودِ سرور که دوباره ایندکس شده، یا فهرستِ خراب.
        # در حالتِ دوم `rm` آخرین نسخه‌ی سالم را نابود می‌کند.
        mkdir -p "$(dirname "$MEDIA_LOCAL/.corrupt/${rp#./}")"
        mv -f "$f" "$MEDIA_LOCAL/.corrupt/${rp#./}" 2>/dev/null
        BADC=$((BADC+1))
      fi
    done < <(shuf "$MEDIA_LOCAL/index.remote" 2>/dev/null)
    # فایلِ خراب همان‌جا پاک می‌شود تا اجرای بعدی دوباره بیاوردش —
# وگرنه نسخه‌ی خرابِ بیرونی تا ابد خراب می‌ماند.
    [ "$BADC" -eq 0 ] || say "✗ رسانه: $BADC فایلِ ناهم‌خوان به .corrupt رفت — دفعه‌ی بعد دوباره می‌آید"

    mv -f "$MEDIA_LOCAL/index.remote" "$MEDIA_LOCAL/index"
    rm -f "$MEDIA_LOCAL/.want" "$MEDIA_LOCAL/.have" "$MEDIA_LOCAL/.theirs"
    say "■ رسانه: $(du -sh "$MEDIA_LOCAL/current" 2>/dev/null | cut -f1)"
  fi
fi

say "■ مجموع: $(ls -1d "$LOCAL"/20* 2>/dev/null | wc -l) نسخه · $(du -sh "$LOCAL" 2>/dev/null | cut -f1)"
