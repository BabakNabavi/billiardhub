'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';

const roles = [
  { value: 'user', label: 'کاربر عادی', icon: '👤', description: 'فقط رزرو و خرید' },
  { value: 'player', label: 'بازیکن', icon: '🎱', description: 'شرکت در مسابقات و رنکینگ' },
  { value: 'coach', label: 'مربی', icon: '👨‍🏫', description: 'آموزش و مربیگری' },
  { value: 'referee', label: 'داور', icon: '🏁', description: 'داوری مسابقات' },
  { value: 'club_owner', label: 'باشگاه‌دار', icon: '🏢', description: 'مدیریت باشگاه' },
  { value: 'seller', label: 'فروشنده', icon: '🛍️', description: 'فروش تجهیزات' },
  { value: 'manufacturer', label: 'تولیدکننده', icon: '🏭', description: 'تولید تجهیزات' },
  { value: 'installer', label: 'متخصص نصب', icon: '🔧', description: 'نصب و سرویس میز' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, setAuth, token } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [primaryRole, setPrimaryRole] = useState('user');
  const [secondaryRoles, setSecondaryRoles] = useState<string[]>([]);

  const [basicForm, setBasicForm] = useState({
    bio: '',
    city: '',
    country: 'Iran',
    birthDate: '',
    instagram: '',
    telegram: '',
  });

  const [playerForm, setPlayerForm] = useState({
    level: 'league1',
    specialty: 'snooker',
    experience: '',
    achievements: '',
    currentClub: '',
  });

  const [coachForm, setCoachForm] = useState({
    specialty: 'snooker',
    experience: '',
    pricePerHour: '',
    contactMethod: 'phone',
    activeClubs: '',
  });

  const [refereeForm, setRefereeForm] = useState({
    degree: 'club',
    experience: '',
    tournaments: '',
  });

  const [manufacturerForm, setManufacturerForm] = useState({
    companyName: '',
    brandName: '',
    address: '',
    products: '',
    foundedYear: '',
    website: '',
  });

  const [installerForm, setInstallerForm] = useState({
    specialties: [] as string[],
    experience: '',
    cities: '',
    priceInfo: '',
    contactMethod: 'phone',
  });

  const [sellerForm, setSellerForm] = useState({
    shopName: '',
    address: '',
    productTypes: '',
    foundedYear: '',
    website: '',
  });

  const toggleSecondaryRole = (role: string) => {
    if (primaryRole === 'user') return;
    if (role === primaryRole) return;
    setSecondaryRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const installerSpecialties = [
    'نصب میز', 'تعمیر و سرویس میز', 'تنظیم و کالیبراسیون',
    'تعویض کوشن', 'تعویض سطح بازی', 'نصب سیستم روشنایی',
    'جابجایی و حمل میز', 'سایر'
  ];

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const profileData: any = {
        primaryRole,
        secondaryRoles,
        isProfileComplete: true,
        ...basicForm,
      };

      if (primaryRole === 'player' || secondaryRoles.includes('player')) {
        profileData.playerProfile = playerForm;
      }
      if (primaryRole === 'coach' || secondaryRoles.includes('coach')) {
        profileData.coachProfile = coachForm;
      }
      if (primaryRole === 'referee' || secondaryRoles.includes('referee')) {
        profileData.refereeProfile = refereeForm;
      }
      if (primaryRole === 'manufacturer' || secondaryRoles.includes('manufacturer')) {
        profileData.manufacturerProfile = manufacturerForm;
      }
      if (primaryRole === 'installer' || secondaryRoles.includes('installer')) {
        profileData.installerProfile = installerForm;
      }
      if (primaryRole === 'seller' || secondaryRoles.includes('seller')) {
        profileData.sellerProfile = sellerForm;
      }

      const res = await api.put('/user/profile', profileData);
      setAuth(res.data, token!);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ذخیره پروفایل');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-800">تکمیل پروفایل</h1>
        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? 'bg-green-600' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          مرحله {step} از ۳
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

      {/* مرحله ۱: انتخاب role */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-bold mb-2">سطح کاربری اصلی شما چیست؟</h2>
          <p className="text-sm text-gray-500 mb-4">یک role اصلی انتخاب کنید</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {roles.map(role => (
              <div
                key={role.value}
                onClick={() => { setPrimaryRole(role.value); setSecondaryRoles([]); }}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  primaryRole === role.value ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="text-2xl mb-1">{role.icon}</div>
                <div className="font-bold text-sm">{role.label}</div>
                <div className="text-xs text-gray-500 mt-1">{role.description}</div>
              </div>
            ))}
          </div>

          {primaryRole !== 'user' && (
            <div>
              <h3 className="font-bold mb-2 text-sm">role‌های فرعی (اختیاری):</h3>
              <div className="flex flex-wrap gap-2">
                {roles.filter(r => r.value !== 'user' && r.value !== primaryRole).map(role => (
                  <button
                    key={role.value}
                    onClick={() => toggleSecondaryRole(role.value)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      secondaryRoles.includes(role.value)
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 text-gray-600 hover:border-green-400'
                    }`}
                  >
                    {role.icon} {role.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            className="w-full mt-6 bg-green-700 text-white py-3 rounded-xl hover:bg-green-800"
          >
            بعدی
          </button>
        </div>
      )}

      {/* مرحله ۲: اطلاعات پایه */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-bold mb-4">اطلاعات پایه</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">شهر</label>
                <input type="text" value={basicForm.city}
                  onChange={e => setBasicForm({...basicForm, city: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="تهران" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">کشور</label>
                <input type="text" value={basicForm.country}
                  onChange={e => setBasicForm({...basicForm, country: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">بیوگرافی</label>
              <textarea value={basicForm.bio}
                onChange={e => setBasicForm({...basicForm, bio: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3} placeholder="درباره خودت بنویس..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">اینستاگرام</label>
                <input type="text" value={basicForm.instagram}
                  onChange={e => setBasicForm({...basicForm, instagram: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="@username" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تلگرام</label>
                <input type="text" value={basicForm.telegram}
                  onChange={e => setBasicForm({...basicForm, telegram: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="@username" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="flex-1 border py-3 rounded-xl">
              قبلی
            </button>
            <button onClick={() => setStep(3)} className="flex-1 bg-green-700 text-white py-3 rounded-xl hover:bg-green-800">
              بعدی
            </button>
          </div>
        </div>
      )}

      {/* مرحله ۳: اطلاعات اختصاصی */}
      {step === 3 && (
        <div className="space-y-6">

          {/* بازیکن */}
          {(primaryRole === 'player' || secondaryRoles.includes('player')) && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-bold mb-4">🎱 پروفایل بازیکن</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">سطح بازی</label>
                  <select value={playerForm.level}
                    onChange={e => setPlayerForm({...playerForm, level: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2">
                    <option value="league1">لیگ یک</option>
                    <option value="premier">دسته برتر</option>
                    <option value="national">تیم ملی</option>
                    <option value="world_pro">World Professional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رشته تخصصی</label>
                  <select value={playerForm.specialty}
                    onChange={e => setPlayerForm({...playerForm, specialty: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2">
                    <option value="snooker">اسنوکر</option>
                    <option value="pocket">پاکت بیلیارد</option>
                    <option value="highball">هی‌بال</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">سابقه بازی (سال)</label>
                  <input type="number" value={playerForm.experience}
                    onChange={e => setPlayerForm({...playerForm, experience: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" placeholder="۵" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">افتخارات</label>
                  <textarea value={playerForm.achievements}
                    onChange={e => setPlayerForm({...playerForm, achievements: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" rows={2}
                    placeholder="قهرمان لیگ تهران ۱۴۰۲..." />
                </div>
              </div>
            </div>
          )}

          {/* مربی */}
          {(primaryRole === 'coach' || secondaryRoles.includes('coach')) && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-bold mb-4">👨‍🏫 پروفایل مربی</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">رشته تخصصی</label>
                  <select value={coachForm.specialty}
                    onChange={e => setCoachForm({...coachForm, specialty: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2">
                    <option value="snooker">اسنوکر</option>
                    <option value="pocket">پاکت بیلیارد</option>
                    <option value="highball">هی‌بال</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">سال‌های تجربه</label>
                  <input type="number" value={coachForm.experience}
                    onChange={e => setCoachForm({...coachForm, experience: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" placeholder="۱۰" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">هزینه تمرین (تومان/ساعت)</label>
                  <input type="number" value={coachForm.pricePerHour}
                    onChange={e => setCoachForm({...coachForm, pricePerHour: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" placeholder="۵۰۰۰۰۰" />
                </div>
              </div>
            </div>
          )}

          {/* داور */}
          {(primaryRole === 'referee' || secondaryRoles.includes('referee')) && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-bold mb-4">🏁 پروفایل داور</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">درجه داوری</label>
                  <select value={refereeForm.degree}
                    onChange={e => setRefereeForm({...refereeForm, degree: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2">
                    <option value="club">باشگاهی</option>
                    <option value="provincial">استانی</option>
                    <option value="national">ملی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">سابقه داوری (سال)</label>
                  <input type="number" value={refereeForm.experience}
                    onChange={e => setRefereeForm({...refereeForm, experience: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" placeholder="۵" />
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700">
                  ⚠️ برای تأیید رسمی، مدرک داوری خود را در پروفایل آپلود کنید
                </div>
              </div>
            </div>
          )}

          {/* تولیدکننده */}
          {(primaryRole === 'manufacturer' || secondaryRoles.includes('manufacturer')) && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-bold mb-4">🏭 پروفایل تولیدکننده</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">نام شرکت</label>
                    <input type="text" value={manufacturerForm.companyName}
                      onChange={e => setManufacturerForm({...manufacturerForm, companyName: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">نام برند</label>
                    <input type="text" value={manufacturerForm.brandName}
                      onChange={e => setManufacturerForm({...manufacturerForm, brandName: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">آدرس کارخانه/دفتر</label>
                  <input type="text" value={manufacturerForm.address}
                    onChange={e => setManufacturerForm({...manufacturerForm, address: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">محصولات تولیدی</label>
                  <input type="text" value={manufacturerForm.products}
                    onChange={e => setManufacturerForm({...manufacturerForm, products: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="میز اسنوکر، چوب بیلیارد، ..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">وبسایت</label>
                  <input type="url" value={manufacturerForm.website}
                    onChange={e => setManufacturerForm({...manufacturerForm, website: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" placeholder="https://..." />
                </div>
              </div>
            </div>
          )}

          {/* متخصص نصب */}
          {(primaryRole === 'installer' || secondaryRoles.includes('installer')) && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-bold mb-4">🔧 پروفایل متخصص نصب</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">تخصص‌ها</label>
                  <div className="flex flex-wrap gap-2">
                    {installerSpecialties.map(s => (
                      <button key={s} type="button"
                        onClick={() => setInstallerForm(prev => ({
                          ...prev,
                          specialties: prev.specialties.includes(s)
                            ? prev.specialties.filter(x => x !== s)
                            : [...prev.specialties, s]
                        }))}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          installerForm.specialties.includes(s)
                            ? 'bg-green-600 text-white border-green-600'
                            : 'border-gray-300'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">سال‌های تجربه</label>
                  <input type="number" value={installerForm.experience}
                    onChange={e => setInstallerForm({...installerForm, experience: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" placeholder="۵" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">شهرهای فعالیت</label>
                  <input type="text" value={installerForm.cities}
                    onChange={e => setInstallerForm({...installerForm, cities: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="تهران، کرج، ..." />
                </div>
              </div>
            </div>
          )}

          {/* فروشنده */}
          {(primaryRole === 'seller' || secondaryRoles.includes('seller')) && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-bold mb-4">🛍️ پروفایل فروشنده</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">نام فروشگاه</label>
                  <input type="text" value={sellerForm.shopName}
                    onChange={e => setSellerForm({...sellerForm, shopName: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">آدرس</label>
                  <input type="text" value={sellerForm.address}
                    onChange={e => setSellerForm({...sellerForm, address: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نوع محصولات</label>
                  <input type="text" value={sellerForm.productTypes}
                    onChange={e => setSellerForm({...sellerForm, productTypes: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="میز، چوب، لوازم جانبی، ..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">وبسایت</label>
                  <input type="url" value={sellerForm.website}
                    onChange={e => setSellerForm({...sellerForm, website: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" placeholder="https://..." />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 border py-3 rounded-xl">
              قبلی
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-green-700 text-white py-3 rounded-xl hover:bg-green-800 disabled:opacity-50">
              {loading ? 'در حال ذخیره...' : '✅ ذخیره پروفایل'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}