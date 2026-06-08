'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import useAuthStore from '@/store/auth.store';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  bio: string;
  city: string;
  role: string;
  avatar: string | null;
}

export default function ProfilePage() {
  const { user, login } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileForm>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    bio: user?.bio ?? '',
    city: user?.city ?? '',
    role: user?.role ?? 'player',
    avatar: user?.avatar ?? null,
  });

  const [preview, setPreview] = useState<string | null>(form.avatar);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  // password change
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSaved, setPassSaved] = useState(false);

  const set = (key: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      setError('');
      setSaved(false);
    };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setForm((p) => ({ ...p, avatar: url }));
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('نام و نام خانوادگی الزامی است');
      return;
    }
    setLoading(true);
    try {
      // TODO: connect to real API
      // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      //   body: JSON.stringify(form),
      // });
      await new Promise((r) => setTimeout(r, 700));
      setSaved(true);
    } catch {
      setError('ذخیره با خطا مواجه شد');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePass = async () => {
    if (!passForm.current) { setPassError('رمز فعلی الزامی است'); return; }
    if (passForm.next.length < 8) { setPassError('رمز جدید باید حداقل ۸ کاراکتر باشد'); return; }
    if (passForm.next !== passForm.confirm) { setPassError('رمز جدید و تکرار آن یکسان نیستند'); return; }
    setPassLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setPassSaved(true);
      setPassForm({ current: '', next: '', confirm: '' });
    } catch {
      setPassError('تغییر رمز با خطا مواجه شد');
    } finally {
      setPassLoading(false);
    }
  };

  const roleLabel: Record<string, string> = {
    player: 'بازیکن',
    club_owner: 'مالک باشگاه',
    coach: 'مربی',
    referee: 'داور',
  };

  const initials = `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`;

  return (
    <main className="profile-root" dir="rtl">
      <div className="glow g1" />
      <div className="glow g2" />

      <div className="profile-wrap">
        {/* ── sidebar ── */}
        <aside className="sidebar">
          {/* avatar */}
          <div className="avatar-wrap" onClick={() => fileRef.current?.click()}>
            {preview ? (
              <img src={preview} alt="آواتار" className="avatar-img" />
            ) : (
              <div className="avatar-initials">{initials || '؟'}</div>
            )}
            <div className="avatar-overlay">
              <span>📷</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />

          <h2 className="sidebar-name">{form.firstName || 'نام'} {form.lastName || 'شما'}</h2>
          <span className="role-badge">{roleLabel[form.role] ?? form.role}</span>
          {form.city && <p className="sidebar-city">📍 {form.city}</p>}

          <nav className="sidebar-nav">
            <Link href="/dashboard" className="nav-item">🏠 داشبورد</Link>
            <Link href="/booking" className="nav-item">📅 رزروها</Link>
            <Link href="/messages" className="nav-item">💬 پیام‌ها</Link>
          </nav>
        </aside>

        {/* ── main ── */}
        <section className="main-panel">
          <div className="panel-header">
            <h1 className="panel-title">ویرایش پروفایل</h1>
            <div className="tabs">
              <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
                اطلاعات شخصی
              </button>
              <button className={`tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                امنیت
              </button>
            </div>
          </div>

          {/* ── INFO TAB ── */}
          {activeTab === 'info' && (
            <div className="form-grid">
              <div className="row-2">
                <div className="field">
                  <label>نام</label>
                  <input className="inp" placeholder="علی" value={form.firstName} onChange={set('firstName')} />
                </div>
                <div className="field">
                  <label>نام خانوادگی</label>
                  <input className="inp" placeholder="احمدی" value={form.lastName} onChange={set('lastName')} />
                </div>
              </div>

              <div className="row-2">
                <div className="field">
                  <label>شماره موبایل</label>
                  <input className="inp" placeholder="09121234567" value={form.phone} onChange={set('phone')} inputMode="numeric" />
                </div>
                <div className="field">
                  <label>ایمیل</label>
                  <input className="inp" type="email" placeholder="example@mail.com" value={form.email} onChange={set('email')} />
                </div>
              </div>

              <div className="row-2">
                <div className="field">
                  <label>شهر</label>
                  <input className="inp" placeholder="تهران" value={form.city} onChange={set('city')} />
                </div>
                <div className="field">
                  <label>نقش</label>
                  <select className="inp" value={form.role} onChange={set('role')}>
                    <option value="player">بازیکن</option>
                    <option value="club_owner">مالک باشگاه</option>
                    <option value="coach">مربی</option>
                    <option value="referee">داور</option>
                  </select>
                </div>
              </div>

              <div className="field full">
                <label>بیوگرافی</label>
                <textarea
                  className="inp textarea"
                  placeholder="کمی درباره خودت بنویس..."
                  value={form.bio}
                  onChange={set('bio') as React.ChangeEventHandler<HTMLTextAreaElement>}
                  rows={3}
                />
              </div>

              {error && <p className="err-msg">{error}</p>}
              {saved && <p className="success-msg">✓ تغییرات با موفقیت ذخیره شد</p>}

              <button className="btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? <span className="spinner" /> : 'ذخیره تغییرات'}
              </button>
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === 'security' && (
            <div className="form-grid">
              <div className="security-note">
                🔒 برای امنیت بیشتر، رمز عبور قوی با ترکیب حروف و اعداد انتخاب کنید
              </div>

              <div className="field">
                <label>رمز عبور فعلی</label>
                <input
                  className="inp"
                  type="password"
                  placeholder="رمز فعلی"
                  value={passForm.current}
                  onChange={(e) => { setPassForm(p => ({ ...p, current: e.target.value })); setPassError(''); setPassSaved(false); }}
                />
              </div>
              <div className="row-2">
                <div className="field">
                  <label>رمز عبور جدید</label>
                  <input
                    className="inp"
                    type="password"
                    placeholder="حداقل ۸ کاراکتر"
                    value={passForm.next}
                    onChange={(e) => { setPassForm(p => ({ ...p, next: e.target.value })); setPassError(''); setPassSaved(false); }}
                  />
                </div>
                <div className="field">
                  <label>تکرار رمز جدید</label>
                  <input
                    className="inp"
                    type="password"
                    placeholder="تکرار رمز جدید"
                    value={passForm.confirm}
                    onChange={(e) => { setPassForm(p => ({ ...p, confirm: e.target.value })); setPassError(''); setPassSaved(false); }}
                  />
                </div>
              </div>

              {/* strength indicator */}
              {passForm.next && (
                <div className="strength-wrap">
                  <div className="strength-bar">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={`strength-seg ${passStrength(passForm.next) >= i ? `s${passStrength(passForm.next)}` : ''}`}
                      />
                    ))}
                  </div>
                  <span className="strength-label">{strengthLabel(passForm.next)}</span>
                </div>
              )}

              {passError && <p className="err-msg">{passError}</p>}
              {passSaved && <p className="success-msg">✓ رمز عبور با موفقیت تغییر کرد</p>}

              <button className="btn-primary" onClick={handleChangePass} disabled={passLoading}>
                {passLoading ? <span className="spinner" /> : 'تغییر رمز عبور'}
              </button>
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        .profile-root {
          min-height: 100vh;
          background: #010604;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 2rem 1rem 4rem;
          position: relative;
          overflow: hidden;
          font-family: 'Vazirmatn', sans-serif;
        }
        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
        }
        .g1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%);
          top: -150px; right: -150px;
        }
        .g2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%);
          bottom: -100px; left: -100px;
        }

        /* layout */
        .profile-wrap {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 900px;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        /* sidebar */
        .sidebar {
          background: linear-gradient(145deg, rgba(16,185,129,0.07), rgba(5,12,8,0.95));
          border: 1px solid rgba(16,185,129,0.18);
          border-radius: 16px;
          padding: 1.8rem 1.2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          height: fit-content;
        }

        /* avatar */
        .avatar-wrap {
          width: 90px; height: 90px;
          border-radius: 50%;
          border: 2px solid rgba(16,185,129,0.4);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(16,185,129,0.15);
          flex-shrink: 0;
        }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-initials {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(16,185,129,0.1);
          color: #10b981;
          font-size: 1.6rem;
          font-weight: 700;
        }
        .avatar-overlay {
          position: absolute; inset: 0;
          background: rgba(1,6,4,0.6);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
          font-size: 1.3rem;
        }
        .avatar-wrap:hover .avatar-overlay { opacity: 1; }
        .hidden { display: none; }

        .sidebar-name {
          font-size: 1rem; font-weight: 700;
          color: #f0faf5; margin: 0.3rem 0 0;
          text-align: center;
        }
        .role-badge {
          font-size: 0.75rem; padding: 0.25rem 0.7rem;
          background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.3);
          border-radius: 20px; color: #10b981;
        }
        .sidebar-city {
          font-size: 0.8rem; color: rgba(240,250,245,0.45); margin: 0;
        }

        /* nav */
        .sidebar-nav {
          width: 100%; margin-top: 1rem;
          display: flex; flex-direction: column; gap: 0.35rem;
        }
        .nav-item {
          display: block; padding: 0.55rem 0.8rem;
          border-radius: 8px;
          color: rgba(240,250,245,0.5);
          text-decoration: none; font-size: 0.85rem;
          transition: all 0.2s;
        }
        .nav-item:hover {
          background: rgba(16,185,129,0.08);
          color: #f0faf5;
        }

        /* main panel */
        .main-panel {
          background: linear-gradient(145deg, rgba(16,185,129,0.06), rgba(5,12,8,0.95));
          border: 1px solid rgba(16,185,129,0.18);
          border-radius: 16px;
          padding: 2rem;
        }
        .panel-header {
          margin-bottom: 1.8rem;
        }
        .panel-title {
          font-size: 1.2rem; font-weight: 700;
          color: #f0faf5; margin: 0 0 1rem;
        }
        .tabs {
          display: flex; gap: 0.5rem;
          border-bottom: 1px solid rgba(16,185,129,0.12);
          padding-bottom: 0;
        }
        .tab {
          padding: 0.5rem 1rem;
          background: transparent; border: none;
          color: rgba(240,250,245,0.45);
          font-family: inherit; font-size: 0.88rem;
          cursor: pointer; transition: all 0.2s;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
        }
        .tab:hover { color: #f0faf5; }
        .tab.active {
          color: #10b981;
          border-bottom-color: #10b981;
        }

        /* form */
        .form-grid {
          display: flex; flex-direction: column; gap: 1rem;
        }
        .row-2 {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;
        }
        .field { display: flex; flex-direction: column; gap: 0.4rem; }
        .full { grid-column: 1 / -1; }
        .field label {
          font-size: 0.82rem;
          color: rgba(240,250,245,0.55);
          font-weight: 500;
        }
        .inp {
          background: rgba(16,185,129,0.05);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          color: #f0faf5;
          font-family: inherit; font-size: 0.92rem;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          text-align: right;
        }
        .inp::placeholder { color: rgba(240,250,245,0.2); }
        .inp:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .textarea { resize: vertical; min-height: 80px; }
        select.inp option { background: #050c08; }

        /* strength */
        .strength-wrap { display: flex; align-items: center; gap: 0.7rem; }
        .strength-bar { display: flex; gap: 4px; flex: 1; }
        .strength-seg {
          flex: 1; height: 4px; border-radius: 2px;
          background: rgba(16,185,129,0.1);
          transition: background 0.3s;
        }
        .strength-seg.s1 { background: #ef4444; }
        .strength-seg.s2 { background: #f59e0b; }
        .strength-seg.s3 { background: #06b6d4; }
        .strength-seg.s4 { background: #10b981; }
        .strength-label { font-size: 0.78rem; color: rgba(240,250,245,0.5); white-space: nowrap; }

        /* security note */
        .security-note {
          padding: 0.7rem 0.9rem;
          background: rgba(6,182,212,0.07);
          border: 1px solid rgba(6,182,212,0.2);
          border-radius: 8px;
          font-size: 0.83rem;
          color: rgba(240,250,245,0.6);
        }

        /* messages */
        .err-msg {
          padding: 0.6rem 0.9rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          color: #fca5a5; font-size: 0.83rem;
          margin: 0; text-align: center;
        }
        .success-msg {
          padding: 0.6rem 0.9rem;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 8px;
          color: #6ee7b7; font-size: 0.83rem;
          margin: 0; text-align: center;
        }

        /* button */
        .btn-primary {
          padding: 0.85rem;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none; border-radius: 10px;
          color: #010604; font-family: inherit;
          font-size: 1rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.2s, box-shadow 0.2s;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(16,185,129,0.2);
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
          box-shadow: 0 4px 28px rgba(16,185,129,0.35);
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner {
          display: inline-block; width: 18px; height: 18px;
          border: 2px solid rgba(1,6,4,0.3);
          border-top-color: #010604; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .profile-wrap { grid-template-columns: 1fr; }
          .sidebar { flex-direction: row; flex-wrap: wrap; justify-content: center; }
          .sidebar-nav { flex-direction: row; flex-wrap: wrap; }
          .row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}

// ── helpers ──────────────────────────────────────────────────────────
function passStrength(pass: string): number {
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return score;
}
function strengthLabel(pass: string): string {
  const s = passStrength(pass);
  return ['', 'ضعیف', 'متوسط', 'خوب', 'قوی'][s] ?? '';
}
