'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  primaryRole: string;
  secondaryRoles: string[];
  verificationStatus: string;
  bio: string;
  city: string;
  country: string;
  avatar: string;
  instagram: string;
  telegram: string;
  playerProfile: any;
  coachProfile: any;
  refereeProfile: any;
  manufacturerProfile: any;
  installerProfile: any;
  sellerProfile: any;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  user: 'کاربر',
  player: 'بازیکن',
  coach: 'مربی',
  referee: 'داور',
  club_owner: 'باشگاه‌دار',
  seller: 'فروشنده',
  manufacturer: 'تولیدکننده',
  installer: 'متخصص نصب و مونتاژ',
};

const specialtyLabels: Record<string, string> = {
  snooker: 'اسنوکر',
  pocket: 'پاکت بیلیارد',
  highball: 'هی‌بال',
};

const levelLabels: Record<string, string> = {
  league1: 'لیگ یک',
  premier: 'دسته برتر',
  world_pro: 'World Professional',
};

const degreeLabels: Record<string, string> = {
  club: 'باشگاهی',
  provincial: 'استانی',
  national: 'ملی',
  international: 'بین‌المللی',
};

export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/user/public/${id}`).then((res) => {
      setProfile(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20">در حال بارگذاری...</div>;
  if (!profile) return <div className="text-center py-20">کاربر پیدا نشد</div>;

  const allRoles = [profile.primaryRole, ...(profile.secondaryRoles || [])];

  return (
    <div className="max-w-3xl mx-auto pb-10">

      {/* هدر پروفایل */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-green-700 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {profile.avatar ? (
              <img loading="lazy" decoding="async" src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : profile.firstName?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.verificationStatus === 'verified' && (
                <span className="text-green-600 text-xl" title="تأیید شده">✓</span>
              )}
            </div>
            {profile.city && (
              <p className="text-gray-500 text-sm mb-2">📍 {profile.city}، {profile.country}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {allRoles.map(role => (
                <span key={role} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  {roleLabels[role] || role}
                </span>
              ))}
            </div>
            {profile.bio && (
              <p className="text-gray-600 text-sm mt-3">{profile.bio}</p>
            )}
            <div className="flex gap-3 mt-3">
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-pink-600 text-sm hover:underline">
                  📸 {profile.instagram}
                </a>
              )}
              {profile.telegram && (
                <a href={`https://t.me/${profile.telegram.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-blue-500 text-sm hover:underline">
                  ✈️ {profile.telegram}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* پروفایل بازیکن */}
      {profile.playerProfile && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-lg font-bold text-green-700 mb-4">🎱 اطلاعات بازیکن</h2>
          {profile.playerProfile.specialties?.length > 0 ? (
            <div className="space-y-3">
              {profile.playerProfile.specialties.map((specialty: string) => (
                <div key={specialty} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-gray-800">
                      {specialtyLabels[specialty] || specialty}
                    </div>
                    <div className="flex gap-2">
                      {profile.playerProfile[`level_${specialty}`] && specialty !== 'highball' && (
                        <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">
                          {levelLabels[profile.playerProfile[`level_${specialty}`]] || profile.playerProfile[`level_${specialty}`]}
                        </span>
                      )}
                      {profile.playerProfile.rankings?.[specialty] && (
                        <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded-full font-bold">
                          رنک {profile.playerProfile.rankings[specialty]}
                        </span>
                      )}
                    </div>
                  </div>
                  {profile.playerProfile[`experience_${specialty}`] && (
                    <div className="text-xs text-gray-500 mt-2">
                      {profile.playerProfile[`experience_${specialty}`]} سال سابقه
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            profile.playerProfile.specialty && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-green-700">
                  {specialtyLabels[profile.playerProfile.specialty] || profile.playerProfile.specialty}
                </div>
              </div>
            )
          )}
          {profile.playerProfile.achievements && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">🏆 افتخارات</div>
              <p className="text-sm">{profile.playerProfile.achievements}</p>
            </div>
          )}
        </div>
      )}

      {/* پروفایل مربی */}
      {profile.coachProfile && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-lg font-bold text-green-700 mb-4">👨‍🏫 اطلاعات مربی</h2>
          <div className="space-y-3">
            {profile.coachProfile.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.coachProfile.specialties.map((s: string) => (
                  <span key={s} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">
                    {specialtyLabels[s] || s}
                  </span>
                ))}
              </div>
            )}
            {profile.coachProfile.experience && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">سال‌های تجربه:</span>
                <span className="font-medium">{profile.coachProfile.experience} سال</span>
              </div>
            )}
            {profile.coachProfile.priceType === 'contact' ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">هزینه تمرین:</span>
                <span className="font-medium text-blue-600">تماس با مربی</span>
              </div>
            ) : profile.coachProfile.pricePerHour && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">هزینه تمرین:</span>
                <span className="font-medium text-green-700">
                  {parseInt(profile.coachProfile.pricePerHour).toLocaleString('fa-IR')} تومان/ساعت
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* پروفایل داور */}
      {profile.refereeProfile && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-lg font-bold text-green-700 mb-4">🏁 اطلاعات داور</h2>
          <div className="space-y-3">
            {profile.refereeProfile.degree && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">درجه داوری:</span>
                <span className="font-medium">{degreeLabels[profile.refereeProfile.degree] || profile.refereeProfile.degree}</span>
              </div>
            )}
            {profile.refereeProfile.experience && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">سابقه داوری:</span>
                <span className="font-medium">{profile.refereeProfile.experience} سال</span>
              </div>
            )}
            {profile.refereeProfile.documentUrl && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">مدرک داوری:</span>
                <a href={profile.refereeProfile.documentUrl} target="_blank"
                  rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  مشاهده مدرک
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* پروفایل تولیدکننده */}
      {profile.manufacturerProfile && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-lg font-bold text-green-700 mb-4">🏭 اطلاعات تولیدکننده</h2>
          <div className="space-y-3">
            {profile.manufacturerProfile.companyName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">نام شرکت:</span>
                <span className="font-medium">{profile.manufacturerProfile.companyName}</span>
              </div>
            )}
            {profile.manufacturerProfile.brandName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">نام برند:</span>
                <span className="font-medium">{profile.manufacturerProfile.brandName}</span>
              </div>
            )}
            {profile.manufacturerProfile.products && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">محصولات:</span>
                <span className="font-medium">{profile.manufacturerProfile.products}</span>
              </div>
            )}
            {profile.manufacturerProfile.website && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">وبسایت:</span>
                <a href={profile.manufacturerProfile.website} target="_blank"
                  rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {profile.manufacturerProfile.website}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* پروفایل متخصص نصب و مونتاژ */}
      {profile.installerProfile && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-lg font-bold text-green-700 mb-4">🔧 اطلاعات متخصص نصب و مونتاژ</h2>
          <div className="space-y-3">
            {profile.installerProfile.specialties?.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">تخصص‌ها:</div>
                <div className="flex flex-wrap gap-2">
                  {profile.installerProfile.specialties.map((s: string) => (
                    <span key={s} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.installerProfile.cities?.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">شهرهای فعالیت:</span>
                <span className="font-medium">{profile.installerProfile.cities.join('، ')}</span>
              </div>
            )}
            {profile.installerProfile.experience && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">سال‌های تجربه:</span>
                <span className="font-medium">{profile.installerProfile.experience} سال</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* پروفایل فروشنده */}
      {profile.sellerProfile && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-lg font-bold text-green-700 mb-4">🛍️ اطلاعات فروشنده</h2>
          <div className="space-y-3">
            {profile.sellerProfile.shopName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">نام فروشگاه:</span>
                <span className="font-medium">{profile.sellerProfile.shopName}</span>
              </div>
            )}
            {profile.sellerProfile.address && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">آدرس:</span>
                <span className="font-medium">{profile.sellerProfile.address}</span>
              </div>
            )}
            {profile.sellerProfile.productTypes && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">محصولات:</span>
                <span className="font-medium">{profile.sellerProfile.productTypes}</span>
              </div>
            )}
            {profile.sellerProfile.website && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">وبسایت:</span>
                <a href={profile.sellerProfile.website} target="_blank"
                  rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {profile.sellerProfile.website}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}