export const toFarsi = (v: string | number) => 
  String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

export const toEnglish = (v: string) => 
  v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

export const formatNumber = (v: string) => {
  if (!v) return '';
  const num = parseInt(toEnglish(v));
  if (isNaN(num)) return v;
  return toFarsi(num.toLocaleString('en-US'));
};