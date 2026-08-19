'use client'

/* پوسته‌ی نازکِ باشگاه روی کامپوننتِ مشترکِ نظرها.
   خودِ منطق در `components/reviews/Reviews.tsx` است — با امتیازِ
   مربی مشترک شد تا دو نسخه‌ی جدا از یک چیز نداشته باشیم. */

import Reviews from '../reviews/Reviews'

export default function ClubReviews({ clubId }: { clubId: string }) {
  return <Reviews endpoint={`/api/clubs/${clubId}/reviews`} subject="این باشگاه"
    cannotReviewNote="برای ثبت نظر باید حداقل یک رزرو قطعی در این باشگاه داشته باشید." />
}
