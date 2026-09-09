<#
  هرسِ کشِ بیلد روی لپ‌تاپ.

  ── چرا اصلاً لازم شد ──
  پوشه‌ی پروژه ۸۹ گیگابایت شده بود. اندازه‌گیری نشان داد ۸۶ گیگش
  `.turbo/cache` است: ۱۲۶۳ ورودی که از ۲ ژوئیه انباشته شده بودند،
  به‌علاوه‌ی ۳ فایلِ `.tmp` نیمه‌کاره‌ی ۱٫۳ گیگی از بیلدهایی که وسطِ
  نوشتن قطع شده بودند.

  Turborepo کشش را **هرگز خودش پاک نمی‌کند**. نه سقفِ حجم دارد نه
  سقفِ سن. هر بیلد یک آرشیوِ tar.zst تازه (این‌جا حدود ۶۸ مگابایت
  میانگین، بعضی ۴۶۵ مگابایت) اضافه می‌کند و قدیمی می‌ماند تا ابد.

  ── چرا سه قاعده، نه یکی ──
  فقط سن: هفته‌ای که پنجاه بار بیلد بگیری، همان هفته ده گیگ می‌شود.
  فقط حجم: ورودیِ ماه پیش که یک‌بار هم hit نشده الکی جا می‌گیرد.
  فقط `.tmp`: اصلِ رشد را ول می‌کند.
  پس هر سه: نیمه‌کاره‌ها، بعد سن، و در آخر سقفِ سخت.

  ⚠️ قاعده‌ی سوم LRU **نیست** و نمی‌تواند باشد: Turborepo هنگام hit
  به mtime دست نمی‌زند و last-access روی NTFS پیش‌فرض خاموش است. پس
  «قدیمی‌ترین» یعنی قدیمی‌ترین *نوشته‌شده*، نه کم‌مصرف‌ترین. ورودیِ
  تیرماهی که هر بیلد hit می‌شود زودتر از ورودیِ دیروزیِ بی‌مصرف
  می‌رود. با داده‌ای که در دسترس است بهتر از این نمی‌شود.

  ⚠️ قاعده‌ی سوم روی `.next/cache` اعمال **نمی‌شود**. آن‌جا برخلافِ
  `.turbo/cache` هر فایل مستقل نیست: کشِ فایل‌سیستمیِ webpack یک
  `index.pack` دارد که به pack‌های کناری ارجاع می‌دهد، و حذفِ
  نصفه‌نیمه‌اش می‌تواند به‌جای «miss»، خطای بیلد بدهد. آن‌جا فقط سن.

  ── چرا حذفِ کش بی‌خطر است ──
  کشِ Turborepo فقط شتاب است، نه داده. بدترین اثرِ پاک‌شدنش این است
  که بیلدِ بعدی از صفر اجرا شود. هیچ سورسی، هیچ `.env`ی و هیچ چیزِ
  گیت‌خورده‌ای این‌جا نیست.

  ── گاردها ──
  ۱) ریشه باید واقعاً همین پروژه باشد (`turbo.json` + `package.json`).
     ⚠️ این چک با `-LiteralPath` است، نه بدونش: `Test-Path` بدون آن
     الگو حساب می‌کند و مسیری مثل `proj[1]` روی `proj1`ِ همسایه
     تطبیق می‌خورد — یعنی گارد یک پوشه را تایید می‌کرد و حذف روی
     پوشه‌ای دیگر انجام می‌شد.
  ۲) مسیرها یک فهرستِ بسته‌اند، نه الگوی جست‌وجو.
  ۳) پیش از هر حذف، مسیرِ فایل باید واقعاً زیرِ همان پوشه باشد.

  ── چرا شکست باید سروصدا کند ──
  ⚠️ نسخه‌ی اول خطاها را می‌بلعید و وقتی *همه‌ی* حذف‌ها شکست
  می‌خوردند (قفلِ فایل، مجوز، جابه‌جاییِ پوشه) هیچ چیزی در لاگ
  نمی‌نوشت و با کدِ ۰ تمام می‌شد. یعنی Task تا ابد «موفق» گزارش
  می‌داد و کش دوباره ۸۹ گیگ می‌شد — دقیقاً همان چیزی که این
  اسکریپت برایش نوشته شده، در تنها حالتی که هشدار نداشت.

  ── لاگ کجاست ──
  بیرونِ ریپو، در `%LOCALAPPDATA%\billiardhub\prune-cache.log`.
  داخلِ ریپو می‌نوشت، هر اجرا `git status` را کثیف می‌کرد.

  ── نسخه‌ی زنده کجاست ──
  ⚠️ این فایل **کپیِ مرجع** است، مثل بقیه‌ی `ops/`. نسخه‌ای که Task
  اجرا می‌کند در `%LOCALAPPDATA%\billiardhub\` است. اگر Task مستقیم
  به داخلِ ریپو اشاره می‌کرد، یک `git checkout` یا `git clean -xdf`
  بی‌صدا فایلی را عوض یا حذف می‌کرد که ساعت ۲:۳۰ بدونِ نظارت فایل
  پاک می‌کند. برای نصب/به‌روزرسانیِ نسخه‌ی زنده: `-Install`.
#>

[CmdletBinding()]
param(
  # پیش‌فرض از جای خودِ فایل درمی‌آید تا حرفِ درایو در فایلِ کامیت‌شده نباشد.
  # نسخه‌ی زنده بیرونِ ریپوست، پس Task حتماً -Root را صریح می‌دهد.
  [string]$Root = (Split-Path -Parent $PSScriptRoot),
  # ورودی‌های قدیمی‌تر از این، بی‌بحث می‌روند
  [int]$KeepDays = 7,
  # سقفِ **هر پوشه**، نه جمعِ کل
  [int]$CapGBPerDir = 10,
  # فقط گزارش بده، دست نزن
  [switch]$DryRun,
  # کپیِ زنده را در %LOCALAPPDATA% بگذار و Scheduled Task را به آن وصل کن
  [switch]$Install
)

$ErrorActionPreference = 'Stop'

$homeDir = Join-Path $env:LOCALAPPDATA 'billiardhub'
if (-not (Test-Path -LiteralPath $homeDir)) {
  New-Item -ItemType Directory -Path $homeDir -Force | Out-Null
}
$logFile = Join-Path $homeDir 'prune-cache.log'
$livePath = Join-Path $homeDir 'prune-build-cache.ps1'
$taskName = 'BilliardHub-PruneBuildCache'

$lines = @()
function Note($t) { $script:lines += $t; Write-Output $t }

function Fmt([double]$bytes) { '{0:N2} GB' -f ($bytes / 1GB) }

# ⚠️ اسمش «Kill» بود و هیچ‌وقت صدا زده نمی‌شد: `kill` aliasِ توکارِ
# Stop-Process است و در ترتیبِ تفکیکِ نامِ PowerShell، alias **جلوتر
# از** function می‌آید. هر حذف بی‌صدا به Stop-Process می‌رفت و با
# خطای تبدیلِ تایپ می‌مرد. فعلِ استاندارد + پیشوند، این تصادف را
# غیرممکن می‌کند.
function Remove-CacheFile {
  param([System.IO.FileInfo]$File, [string]$Prefix, [switch]$Pretend)
  # گارد ۳: هرگز بیرون از همان پوشه
  if (-not $File.FullName.StartsWith($Prefix, [StringComparison]::OrdinalIgnoreCase)) {
    return $false
  }
  if ($Pretend) { return $true }
  try { Remove-Item -LiteralPath $File.FullName -Force -ErrorAction Stop; return $true }
  catch {
    $script:failed++
    $script:lines += "     ✗ $($File.Name): $($_.Exception.Message)"
    return $false
  }
}

function Write-Log($head) {
  $out = @($head) + $lines
  Add-Content -LiteralPath $logFile -Value $out -Encoding utf8
  Write-Output $head
  # لاگی که سالی یک‌بار خوانده می‌شود نباید خودش مشکل شود
  $all = @(Get-Content -LiteralPath $logFile -Encoding utf8)
  if ($all.Count -gt 500) {
    Set-Content -LiteralPath $logFile -Value ($all[-500..-1]) -Encoding utf8
  }
}

# ── نصب/به‌روزرسانیِ نسخه‌ی زنده ────────────────────────────────
if ($Install) {
  Copy-Item -LiteralPath $PSCommandPath -Destination $livePath -Force
  Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue |
    Unregister-ScheduledTask -Confirm:$false -ErrorAction SilentlyContinue
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument (
    '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}" -Root "{1}"' -f $livePath, $Root)
  $trigger = New-ScheduledTaskTrigger -Daily -At '02:30'
  # اگر لپ‌تاپ ساعت ۲:۳۰ خاموش بود، اجرا نباید بی‌صدا از دست برود
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
    -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
    -Settings $settings -Description 'هرس کش بیلد Turborepo/Next' | Out-Null
  Write-Output "نسخه‌ی زنده: $livePath"
  Write-Output "ریشه‌ی هدف : $Root"
  Write-Output "اجرای بعدی : $((Get-ScheduledTaskInfo -TaskName $taskName).NextRunTime)"
  exit 0
}

# ── گارد ۱: این واقعاً ریشه‌ی پروژه است؟ ───────────────────────
if (-not (Test-Path -LiteralPath (Join-Path $Root 'turbo.json')) -or
    -not (Test-Path -LiteralPath (Join-Path $Root 'package.json'))) {
  Write-Log "[$(Get-Date -f 'yyyy-MM-dd HH:mm')] ⛔ ریشه معتبر نیست: $Root"
  exit 1
}

# گارد ۲: فهرستِ بسته. یک `*` اشتباه این‌جا یعنی حذفِ چیزی که نباید.
# `cap` مشخص می‌کند قاعده‌ی سوم (سقفِ حجم) اجرا شود یا نه.
$targets = @(
  @{ Path = (Join-Path $Root '.turbo\cache');        Cap = $true  }
  @{ Path = (Join-Path $Root 'apps\web\.next\cache'); Cap = $false }
)
foreach ($p in @('apps\web', 'apps\api', 'packages\ui',
                 'packages\eslint-config', 'packages\typescript-config')) {
  $targets += @{ Path = (Join-Path $Root "$p\.turbo"); Cap = $true }
}

$cut = (Get-Date).AddDays(-$KeepDays)
# ⚠️ نیمه‌کاره‌ی تازه ممکن است بیلدِ *در حالِ اجرا* باشد. قفلِ فایل
# خودش جلویش را می‌گیرد، ولی نویسنده‌ای که می‌بندد و بعد rename
# می‌کند یک پنجره دارد. شش ساعت آن پنجره را می‌بندد و رایگان است.
$tmpCut = (Get-Date).AddHours(-6)

$freed = 0.0
$removed = 0
$failed = 0

foreach ($t in $targets) {
  $dir = $t.Path
  if (-not (Test-Path -LiteralPath $dir)) { continue }

  $files = @(Get-ChildItem -LiteralPath $dir -File -Force -Recurse -ErrorAction SilentlyContinue)
  if ($files.Count -eq 0) { continue }

  $before = ($files | Measure-Object -Property Length -Sum).Sum
  $dirFreed = 0.0
  $dirRemoved = 0

  $prefix = $dir.TrimEnd('\') + '\'

  # ۱) نیمه‌کاره‌ها (کهنه‌تر از شش ساعت)  ۲) هر چیزِ کهنه‌تر از آستانه
  $doomed = @($files | Where-Object {
    ($_.Name -like '*.tmp' -and $_.LastWriteTime -lt $tmpCut) -or
    ($_.Name -notlike '*.tmp' -and $_.LastWriteTime -lt $cut)
  })

  $gone = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
  foreach ($f in $doomed) {
    if (Remove-CacheFile -File $f -Prefix $prefix -Pretend:$DryRun) {
      [void]$gone.Add($f.FullName); $dirFreed += $f.Length; $dirRemoved++
    }
  }

  # ۳) سقفِ سخت — فقط جایی که هر فایل مستقل است
  if ($t.Cap) {
    # ⚠️ مبنا «آنچه واقعاً مانده» است نه «آنچه قرار بود برود»: نسخه‌ی
    # اول فایلِ حذف‌نشده (قفل‌شده) را هم کنار می‌گذاشت، پس یک .tmpِ
    # قفلیِ ۱٫۳ گیگی برای همیشه از دیدِ این قاعده پنهان می‌ماند.
    # ⚠️ HashSet نه `-notcontains`: آن یکی O(n²) بود و روی ۸۰۰۰ فایل
    #    اندازه‌گیری‌شده ۲۰ ثانیه طول می‌کشید.
    $left = @($files | Where-Object { -not $gone.Contains($_.FullName) })
    $size = ($left | Measure-Object -Property Length -Sum).Sum
    $cap = $CapGBPerDir * 1GB
    if ($size -gt $cap) {
      foreach ($f in ($left | Sort-Object LastWriteTime)) {
        if ($size -le $cap) { break }
        if (Remove-CacheFile -File $f -Prefix $prefix -Pretend:$DryRun) {
          $size -= $f.Length; $dirFreed += $f.Length; $dirRemoved++
        }
      }
    }
  }

  $freed += $dirFreed
  $removed += $dirRemoved

  if ($dirRemoved -gt 0) {
    Note ("  {0}`n     {1} → {2}  ({3} فایل)" -f `
      $dir, (Fmt $before), (Fmt ([Math]::Max(0, $before - $dirFreed))), $dirRemoved)
  }
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'

if ($DryRun) {
  Write-Output "[$stamp] آزمایشی: $removed فایل · $(Fmt $freed) — چیزی حذف نشد"
  exit 0
}

# مثلِ disk-guard: وقتی چیزی برای گفتن نیست، لاگ را شلوغ نکن.
# ولی شکست همیشه گفته می‌شود — و با کدِ ناصفر، تا Task هم بفهمد.
if ($removed -gt 0 -or $failed -gt 0) {
  $note = if ($failed -gt 0) { " · ⚠️ $failed ناموفق" } else { '' }
  Write-Log "[$stamp] $removed فایل · $(Fmt $freed) آزاد شد$note"
} else {
  Write-Output "[$stamp] چیزی برای هرس نبود"
}

exit ($(if ($failed -gt 0) { 1 } else { 0 }))
