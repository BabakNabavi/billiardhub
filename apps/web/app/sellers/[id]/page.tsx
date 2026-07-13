'use client'
import { useParams } from 'next/navigation'
import FlatShop from './FlatShop'
import GlassShop from './GlassShop'

/*
  sellers/1 → نسخه‌ی فلت (UX فروشگاه واقعی، دسته‌بندی‌های بیلیارد بازار)
  sellers/2 → نسخه‌ی Liquid Glass (کپی دقیق مرجع procue-shop-reference)
*/
export default function SellerPage() {
  const { id } = useParams<{ id: string }>()
  return id === '2' ? <GlassShop/> : <FlatShop/>
}
