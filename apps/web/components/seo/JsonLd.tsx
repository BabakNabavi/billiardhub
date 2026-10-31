/* ─────────────────────────────────────────────────────────────
   داده‌ی ساخت‌یافته (schema.org) برای گوگل و بینگ — Server Component.

   ⚠️ `<` به `<` تبدیل می‌شود: متنِ کاربر (نامِ باشگاه، توضیحِ آگهی)
   داخلِ این تگ می‌نشیند و یک «</script>» در آن، تگ را زودتر می‌بست و
   بقیه را HTML می‌کرد. JSON با این escape همان می‌ماند.
   CSP به این تگ کاری ندارد: `application/ld+json` اجرا نمی‌شود.
   ───────────────────────────────────────────────────────────── */

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] | null }) {
  if (!data) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
