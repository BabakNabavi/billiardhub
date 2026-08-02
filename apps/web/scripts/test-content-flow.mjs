/* بخشِ «محتوا و رویدادها»: ادمین خبر منتشر می‌کند → در سایت دیده می‌شود.
       node scripts/test-content-flow.mjs
   هر خبرِ آزمایشی در پایان پاک می‌شود. */
import fs from 'node:fs'; import jwt from 'jsonwebtoken'
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}))
const U=env.NEXT_PUBLIC_SUPABASE_URL,K=env.SUPABASE_SERVICE_ROLE_KEY,S=env.JWT_SECRET
const B=process.env.BH_BASE ?? 'http://localhost:3000'
const rest=async(p,i)=>{const r=await fetch(U+'/rest/v1/'+p,{...(i??{}),headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Prefer:'return=representation',...(i?.headers??{})}});const t=await r.text();return{s:r.status,b:t?JSON.parse(t):null}}
const me=(await rest('users?select=id,phone,"primaryRole","secondaryRoles"&phone=eq.09001327283')).b[0]
if(!me||me.primaryRole==='admin'){console.log('✗ حسابِ آزمایشی نامناسب');process.exit(1)}
const ORIG={primaryRole:me.primaryRole,secondaryRoles:me.secondaryRoles}
const cleanup=async()=>{try{await rest('news?slug=like.zz-*',{method:'DELETE'})}catch{}
  await rest('users?id=eq.'+me.id,{method:'PATCH',body:JSON.stringify(ORIG)})}
for(const sg of ['SIGINT','SIGTERM','SIGPIPE'])process.on(sg,()=>{cleanup().finally(()=>process.exit(130))})
let pass=0,fail=0
const t=(n,ok,x='')=>{ok?pass++:fail++;console.log('  '+(ok?'✓':'✗')+' '+n+(ok?'':'  ← '+x))}
const head=x=>console.log('\n■ '+x)
const note=x=>console.log('  ⓘ '+x)
const tk=r=>jwt.sign({sub:me.id,role:r,phone:me.phone},S,{expiresIn:'20m'})
const call=async(p,i,k)=>{const r=await fetch(B+p,{...(i??{}),headers:{...(k?{Authorization:'Bearer '+k}:{}),'Content-Type':'application/json',...(i?.headers??{})}});let b=null;try{b=await r.json()}catch{};return{s:r.status,b}}

try{
 const uTok=tk('user')
 head('دسترسی')
 t('مهمان نمی‌تواند خبر بسازد', (await call('/api/admin/content/news',{method:'POST',body:JSON.stringify({title:'x'})},null)).s===401,'')
 t('کاربرِ عادی نمی‌تواند خبر بسازد', (await call('/api/admin/content/news',{method:'POST',body:JSON.stringify({title:'x'})},uTok)).s===403,'')

 await rest('users?id=eq.'+me.id,{method:'PATCH',body:JSON.stringify({primaryRole:'admin',secondaryRoles:[...new Set([...(ORIG.secondaryRoles??[]),'admin'])]})})
 const adm=tk('admin')

 head('ادمین خبر منتشر می‌کند')
 const draft=await call('/api/admin/content/news',{method:'POST',body:JSON.stringify({
   slug:'zz-پیش‌نویس',title:'zz خبرِ پیش‌نویس',excerpt:'چکیده',body:'پاراگرافِ اول.\n\nپاراگرافِ دوم.',category:'news',status:'draft'})},adm)
 t('خبرِ پیش‌نویس ساخته می‌شود', draft.s===200||draft.s===201, 'HTTP '+draft.s+' '+JSON.stringify(draft.b).slice(0,110))
 const pubd=await call('/api/admin/content/news',{method:'POST',body:JSON.stringify({
   slug:'zz-منتشر',title:'zz خبرِ منتشرشده',excerpt:'چکیده‌ی منتشرشده',body:'یک.\n\nدو.\n\nسه.',category:'news',status:'published',published_at:new Date().toISOString()})},adm)
 t('خبرِ منتشرشده ساخته می‌شود', pubd.s===200||pubd.s===201,'HTTP '+pubd.s)
 t('هر دو در دیتابیس', ((await rest('news?select=id&slug=like.zz-*')).b??[]).length===2,'')

 head('سایتِ عمومی — همان زنجیره‌ای که در رنکینگ شکسته بود')
 const pub=await call('/api/news',null,null)
 t('/api/news برای مهمان باز است', pub.s===200,'HTTP '+pub.s)
 const arts=pub.b?.articles??[]
 t('خبرِ منتشرشده دیده می‌شود', arts.some(a=>a.slug==='zz-منتشر'), arts.length+' خبر')
 t('خبرِ پیش‌نویس دیده نمی‌شود', !arts.some(a=>a.slug==='zz-پیش‌نویس'),'نشت کرد')
 const one=arts.find(a=>a.slug==='zz-منتشر')
 t('عنوان و چکیده درست برمی‌گردد', one?.title==='zz خبرِ منتشرشده' && one?.excerpt==='چکیده‌ی منتشرشده','')

 head('اخبارِ ساختگی حذف شده‌اند')
 const nd=fs.readFileSync('lib/news-data.ts','utf8')
 t('آرایه‌ی هاردکد خالی است', /NEWS_ARTICLES: NewsArticle\[\] = \[\]/.test(nd),'هنوز پر است')
 /* عنوانِ ساختگی در کامنتِ توضیحی طبیعی است. باید *داده* سنجیده شود،
    نه هر جای فایل — وگرنه تست به خاطر یک توضیح قرمز می‌ماند. */
 const code = nd.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
 t('هیچ رکوردِ خبرِ هاردکدی در کد نمانده', !/excerpt:\s*['"`]/.test(code), 'رکوردِ خبر پیدا شد')
 /* `author: 'بیلیارد هاب'` در آداپتور می‌ماند و ساختگی نیست: جدولِ
    `news` ستونِ نویسنده ندارد و خبر را خودِ پلتفرم منتشر می‌کند.
    آنچه نباید بماند، عددِ بازدیدِ جعلی است. */
 t('هیچ عددِ بازدیدِ ساختگی نمانده', !/views:\s*[1-9]/.test(code), 'بازدیدِ جعلی مانده')
 t('صفحه‌ی /news از سرور می‌خواند', fs.readFileSync('app/news/page.tsx','utf8').includes('fetchNewsArticles'),'')
 t('صفحه‌ی /news/[id] هم از سرور می‌خواند', fs.readFileSync('app/news/[id]/page.tsx','utf8').includes('fetchNewsArticles'),'')

 head('ویرایش و حذف')
 const id=(await rest('news?select=id&slug=eq.zz-منتشر')).b[0].id
 const ed=await call('/api/admin/content/news',{method:'PATCH',body:JSON.stringify({id,title:'zz عنوانِ ویرایش‌شده'})},adm)
 t('ویرایش انجام می‌شود', ed.s===200,'HTTP '+ed.s)
 t('در دیتابیس نشست', (await rest('news?select=title&id=eq.'+id)).b[0].title==='zz عنوانِ ویرایش‌شده','')
 const del=await call('/api/admin/content/news?id='+id,{method:'DELETE'},adm)
 t('حذف انجام می‌شود', del.s===200,'HTTP '+del.s)
 t('واقعاً رفت', ((await rest('news?select=id&id=eq.'+id)).b??[]).length===0,'')

 head('رویدادهای رسمی')
 const ev=await call('/api/admin/content/events',null,adm)
 t('/api/admin/content/events باز می‌شود', ev.s===200,'HTTP '+ev.s)
 note('صفحه‌ی عمومیِ /events به /tournaments هدایت می‌شود، پس جدولِ')
 note('`events` هیچ مصرف‌کننده‌ی عمومی ندارد — این بخشِ ادمین فعلاً')
 note('«فقط نوشتن» است. تصمیمِ محصولی لازم دارد، نه رفعِ کد.')
}finally{
 head('پاک‌سازی')
 await cleanup()
 t('هیچ خبرِ آزمایشی نماند', ((await rest('news?select=id&slug=like.zz-*')).b??[]).length===0,'')
 t('نقشِ حسابِ آزمایشی برگشت', (await rest('users?select="primaryRole"&phone=eq.09001327283')).b[0].primaryRole===ORIG.primaryRole,'')
}
console.log('\n  موفق: '+pass+'   ناموفق: '+fail+'\n');process.exit(fail?1:0)
