/* مسیرهایی که کلاینتِ قدیمیِ `lib/api.ts` صدا می‌زند باید واقعاً وجود داشته باشند.
       node scripts/test-legacy-api.mjs
   این تست جلوی برگشتِ همان کلاسِ باگ را می‌گیرد: صفحه‌ای که به مسیرِ
   ناموجود حرف می‌زند، خطا را می‌بلعد و «چیزی پیدا نشد» نشان می‌دهد. */
import fs from 'node:fs'; import jwt from 'jsonwebtoken'
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}))
const U=env.NEXT_PUBLIC_SUPABASE_URL,K=env.SUPABASE_SERVICE_ROLE_KEY,S=env.JWT_SECRET
const B=process.env.BH_BASE ?? 'http://localhost:3000'
const rest=async p=>(await fetch(U+'/rest/v1/'+p,{headers:{apikey:K,Authorization:'Bearer '+K}})).json()
let pass=0,fail=0
const t=(n,ok,x='')=>{ok?pass++:fail++;console.log('  '+(ok?'✓':'✗')+' '+n+(ok?'':'  ← '+x))}
const head=x=>console.log('\n■ '+x)

head('پیش‌فرضِ baseURL دیگر به بک‌اندِ حذف‌شده اشاره نمی‌کند')
const apiSrc=fs.readFileSync('lib/api.ts','utf8')
const baseLine=(apiSrc.match(/baseURL:.*/)||[''])[0]
t('خطِ baseURL دیگر به localhost:4000 اشاره نمی‌کند', !baseLine.includes('localhost:4000'), baseLine.trim())
t('پیش‌فرض /api است', apiSrc.includes("|| '/api'"), '')

head('هر مسیری که کلاینت صدا می‌زند route دارد')
const files=['app/admin/products/page.tsx','app/booking/[clubId]/page.tsx','app/clubs/[id]/page.tsx',
 'app/clubs/new/page.tsx','app/clubs/page.tsx','app/dashboard/club/page.tsx','app/dashboard/page.tsx',
 'app/login/page.tsx','app/register/page.tsx','app/users/[id]/page.tsx','components/Stories.tsx',
 'components/dashboard/club/GalleryTab.tsx']
const routes=[]
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=d+'/'+e.name
  if(e.isDirectory())walk(p); else if(e.name==='route.ts')routes.push(p.replace('app/api/','').replace('/route.ts',''))}}
walk('app/api')
const norm=r=>r.replace(/\[[^\]]+\]/g,'X')
const known=new Set(routes.map(norm))
const seen=new Set()
for(const f of files){
  if(!fs.existsSync(f))continue
  const src=fs.readFileSync(f,'utf8')
  for(const m of src.matchAll(/api\.(get|post|put|patch|delete)\(\s*[`'"]([^`'"]+)/g)){
    let p=m[2].replace(/\$\{[^}]*\}/g,'X').split('?')[0].replace(/^\//,'')
    if(!p||seen.has(p))continue; seen.add(p)
    if(p.includes('${')||p.includes('.toString'))continue   // کوئریِ پویا
    t(('/'+p).padEnd(30)+' ('+f.split('/').slice(-2).join('/')+')', known.has(p), 'route نیست')
  }
}

head('مسیرهای تازه واقعاً پاسخ می‌دهند')
const users=await rest('users?select=id&limit=1')
const uid=users[0]?.id
const pub=await fetch(B+'/api/users/'+uid)
t('GET /api/users/:id برای مهمان باز است', pub.status===200, 'HTTP '+pub.status)
const body=await pub.json().catch(()=>({}))
for(const k of ['phone','email','password','national_id','bank_card','otp_code','address','birthDate','isActive'])
  t('«'+k+'» در پاسخِ عمومی نیست', !(k in body), 'لو رفت')
t('نام و نقش هست', 'firstName' in body && 'primaryRole' in body, JSON.stringify(Object.keys(body)).slice(0,90))
t('شناسه‌ی نامعتبر ۴۰۰ می‌گیرد', (await fetch(B+'/api/users/not-a-uuid')).status===400,'')
t('کاربرِ ناموجود ۴۰۴ می‌گیرد', (await fetch(B+'/api/users/00000000-0000-0000-0000-000000000000')).status===404,'')

head('ذخیره‌ی ساعتِ کاری به مسیرِ درست می‌رود')
const dash=fs.readFileSync('app/dashboard/club/page.tsx','utf8')
const calls=[...dash.matchAll(/api\.(get|post|put|patch|delete)\(\s*`([^`]+)/g)].map(m=>m[2])
t('دیگر /clubs/:id/hours صدا زده نمی‌شود', !calls.some(c=>c.includes('/hours')), calls.filter(c=>c.includes('/hours')).join(','))
t('خطا دیگر بی‌صدا بلعیده نمی‌شود', !dash.includes('hoursForm); } catch {}'), 'catch خالی مانده')

console.log('\n  موفق: '+pass+'   ناموفق: '+fail+'\n');process.exit(fail?1:0)
