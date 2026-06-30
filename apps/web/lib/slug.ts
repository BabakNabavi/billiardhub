const P2L: Record<string, string> = {
  'ا':'a','آ':'a','أ':'a','إ':'a','ب':'b','پ':'p','ت':'t','ث':'s',
  'ج':'j','چ':'ch','ح':'h','خ':'kh','د':'d','ذ':'z','ر':'r','ز':'z',
  'ژ':'zh','س':'s','ش':'sh','ص':'s','ض':'z','ط':'t','ظ':'z','ع':'a',
  'غ':'gh','ف':'f','ق':'gh','ک':'k','ك':'k','گ':'g','ل':'l','م':'m',
  'ن':'n','و':'v','ه':'h','ی':'y','ي':'y','ئ':'y','ء':'','ة':'t',
  'ق':'gh','ّ':'','َ':'','ِ':'','ُ':'','ً':'','ٍ':'','ٌ':'',
};

export function persianToSlug(text: string): string {
  return text
    .trim()
    .replace(/^باشگاه\s+/i, '')
    .replace(/^کلوپ\s+/i, '')
    .split('')
    .map(ch => P2L[ch] ?? (ch.match(/[a-z0-9]/i) ? ch.toLowerCase() : ' '))
    .join('')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'club';
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length >= 2 && slug.length <= 60;
}

export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}
