'use client'

/* رپرهای کلاینتِ OTP */
export interface OtpResult { ok: boolean; message?: string; wait?: number }

export async function sendOtp(mobile: string): Promise<OtpResult> {
  try {
    const r = await fetch('/api/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', mobile }) })
    return await r.json()
  } catch { return { ok: false, message: 'خطا در اتصال' } }
}

export async function verifyOtp(mobile: string, code: string): Promise<OtpResult> {
  try {
    const r = await fetch('/api/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', mobile, code }) })
    return await r.json()
  } catch { return { ok: false, message: 'خطا در اتصال' } }
}
