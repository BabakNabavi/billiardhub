/* اعتبارسنجی کد ملی ایران (چک‌سام استاندارد) — منبعِ واحد */
export function isValidNationalId(v: string): boolean {
  if (!/^\d{10}$/.test(v)) return false
  if (/^(\d)\1{9}$/.test(v)) return false
  const check = +v[9]!
  const sum = v.slice(0, 9).split('').reduce((acc, d, i) => acc + +d * (10 - i), 0) % 11
  return sum < 2 ? check === sum : check === 11 - sum
}
