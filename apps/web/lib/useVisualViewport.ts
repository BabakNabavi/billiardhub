'use client'
import { useEffect, useState } from 'react'

export interface VP {
  height: number      // ارتفاع ناحیه‌ی دیدنی (بالای کیبورد)
  offsetTop: number   // مقدار جابجایی iOS هنگام بازشدن کیبورد (برای جبران با transform)
  kb: number          // ارتفاع کیبورد
}

/* ردیابی دقیق VisualViewport — منبع واحد حقیقت برای «کیبورد کجاست».
   روی iOS کیبورد صفحه را جابجا می‌کند؛ با offsetTop + transform جبرانش می‌کنیم. */
export function useVisualViewport(): VP {
  const [vp, setVp] = useState<VP>({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    offsetTop: 0, kb: 0,
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const vv = window.visualViewport
    const apply = () => {
      if (!vv) { setVp({ height: window.innerHeight, offsetTop: 0, kb: 0 }); return }
      const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
      setVp({ height: Math.round(vv.height), offsetTop: Math.round(vv.offsetTop), kb })
    }
    apply()
    if (vv) { vv.addEventListener('resize', apply); vv.addEventListener('scroll', apply) }
    window.addEventListener('resize', apply)
    window.addEventListener('orientationchange', apply)
    return () => {
      if (vv) { vv.removeEventListener('resize', apply); vv.removeEventListener('scroll', apply) }
      window.removeEventListener('resize', apply)
      window.removeEventListener('orientationchange', apply)
    }
  }, [])
  return vp
}
