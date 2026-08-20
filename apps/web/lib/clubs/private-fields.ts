/* ─────────────────────────────────────────────────────────────
   ستون‌های خصوصیِ باشگاه — یک فهرست، دو مسیر.

   ── چرا این فایل ساخته شد ──
   `GET /api/clubs/:id` این فهرست را حذف می‌کرد ولی `GET /api/clubs?all=true`
   کلِ ردیف (`select('*')`) را به هر ادمینی می‌داد. یعنی گاردِ مسیرِ تکی
   با یک درخواستِ فهرستی دور می‌خورد — و بدتر، فهرستی همه‌ی باشگاه‌ها را
   یک‌جا می‌داد.

   حالا هر دو مسیر از همین‌جا می‌خوانند، پس نمی‌توانند از هم جدا بیفتند.
   ───────────────────────────────────────────────────────────── */

/** شماره‌حساب، مدارک و نشانیِ پستی — نه عمومی‌اند، نه کارِ هر ادمینی. */
export const CLUB_PRIVATE_FIELDS = [
  'iban', 'ibanVerified', 'ibanOwnerName',
  'bankCard', 'bankCardOwner', 'bankName', 'bankCardVerified', 'bankCardCheckedAt',
  'bankConfirmedByOwner', 'licenseNumber', 'licenseVerified', 'licenseCheckedAt',
  'licenseDocumentUrl', 'postalCode', 'postalCodeVerified', 'postalCodeVerifiedAt',
  'notifyPhone', 'rejectionReason', 'reviewedAt', 'reviewedBy', 'submissionCount',
] as const

/** ردیف را بدونِ ستون‌های خصوصی برمی‌گرداند.
 *
 *  ⚠️ `hasLicenseDoc` جایگزینِ خودِ نشانیِ مدرک است: صفِ تأیید فقط باید
 *  بداند مدرکی هست یا نه؛ دیدنِ خودِ سند کارِ کسی است که کلیدِ `clubs`
 *  دارد و از مسیرِ امضاشده می‌گیردش. بدونِ این، حذفِ ستون نشانِ
 *  «مدرک دارد» را در پنل خاموش می‌کرد. */
export function stripClubPrivate<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row }
  const hasDoc = typeof row.licenseDocumentUrl === 'string' && row.licenseDocumentUrl.trim() !== ''
  for (const k of CLUB_PRIVATE_FIELDS) delete out[k]
  out.hasLicenseDoc = hasDoc
  return out
}
