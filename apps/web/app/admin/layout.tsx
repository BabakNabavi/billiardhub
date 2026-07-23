/* ─────────────────────────────────────────────────────────────
   لایه‌ی مشترک پنل ادمین — استایلِ یکدستِ کنترل‌ها.
   همه‌ی <select>های ساده‌ی بخش ادمین این‌جا یک‌جا پریمیوم
   می‌شوند: بدون ظاهرِ بومی، شورونِ طلایی، رینگِ فوکِس برند.
   ───────────────────────────────────────────────────────────── */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-scope">
      <style>{`
        .admin-scope select {
          appearance: none; -webkit-appearance: none; -moz-appearance: none;
          background-color: #fff;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239A6E38' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: left 12px center;
          background-size: 14px;
          border: 1px solid #E7E2D6 !important;
          border-radius: 11px !important;
          padding: 9px 14px !important;
          padding-left: 36px !important;
          font-family: inherit; font-size: 13px; font-weight: 600; color: #1C1B17;
          cursor: pointer;
          transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
        }
        .admin-scope select:hover { border-color: rgba(199,166,106,0.5) !important; }
        .admin-scope select:focus {
          outline: none;
          border-color: rgba(199,166,106,0.65) !important;
          box-shadow: 0 0 0 3px rgba(199,166,106,0.14);
        }
        .admin-scope select:disabled { opacity: .55; cursor: not-allowed; }
      `}</style>
      {children}
    </div>
  );
}
