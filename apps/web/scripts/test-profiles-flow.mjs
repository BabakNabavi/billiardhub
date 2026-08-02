/* زنجیره‌ی «جامعه‌ی حرفه‌ای»: کاربر پروفایل می‌سازد → ادمین می‌بیند →
   تأیید می‌کند → در سایتِ عمومی دیده می‌شود.
       node scripts/test-profiles-flow.mjs
   هر شش نقش آزموده می‌شود. همه‌ی fixtureها در پایان پاک می‌شوند. */
import fs from 'node:fs'; import jwt from 'jsonwebtoken'
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}))
const U=env.NEXT_PUBLIC_SUPABASE_URL,K=env.SUPABASE_SERVICE_ROLE_KEY,S=env.JWT_SECRET
const B=process.env.BH_BASE ?? 'http://localhost:3000'
const rest=async(p,i)=>{const r=await fetch(U+'/rest/v1/'+p,{...(i??{}),headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Prefer:'return=representation',...(i?.headers??{})}});const t=await r.text();return{s:r.status,b:t?JSON.parse(t):null}}
const me=(await rest('users?select=id,phone,"primaryRole","secondaryRoles"&phone=eq.09001327283')).b[0]
if(!me||me.primaryRole==='admin'){console.log('✗ حسابِ آزمایشی نامناسب');process.exit(1)}
const ORIG={primaryRole:me.primaryRole,secondaryRoles:me.secondaryRoles}
const slugs=[]
const cleanup=async()=>{for(const s of slugs){try{await rest('profiles?slug=eq.'+s,{method:'DELETE'})}catch{}}
  await rest('users?id=eq.'+me.id,{method:'PATCH',body:JSON.stringify(ORIG)})}
for(const sg of ['SIGINT','SIGTERM','SIGPIPE'])process.on(sg,()=>{cleanup().finally(()=>process.exit(130))})
let pass=0,fail=0
const t=(n,ok,x='')=>{ok?pass++:fail++;console.log('  '+(ok?'✓':'✗')+' '+n+(ok?'':'  ← '+x))}
const head=x=>console.log('\n■ '+x)
const tk=r=>jwt.sign({sub:me.id,role:r,phone:me.phone},S,{expiresIn:'20m'})
const call=async(p,i,k)=>{const r=await fetch(B+p,{...(i??{}),headers:{...(k?{Authorization:'Bearer '+k}:{}),'Content-Type':'application/json',...(i?.headers??{})}});let b=null;try{b=await r.json()}catch{};return{s:r.status,b}}
const KINDS=['coach','referee','seller','manufacturer','technician','player']

try{
 const uTok=tk('user')
 head('کاربر — ساختِ پروفایل برای هر شش نقش')
 for(const kind of KINDS){
  const slug='zz-'+kind+'-audit'
  slugs.push(slug)
  const r=await call('/api/profiles/'+kind,{method:'POST',body:JSON.stringify({slug,data:{title:'zz آزمایشِ '+kind,city:'تهران',name:'zz آزمایش'}})},uTok)
  t(kind.padEnd(13)+' ساخته می‌شود', r.s===201, 'HTTP '+r.s+' '+JSON.stringify(r.b).slice(0,90))
 }
 const inDb=(await rest('profiles?select=kind,slug,status&slug=like.zz-*')).b??[]
 t('هر شش در دیتابیس نشستند', inDb.length===6, inDb.length+' ردیف')
 t('همه با وضعیتِ اولیه‌ی «در انتظار»', inDb.every(p=>p.status!=='approved'), JSON.stringify(inDb.map(p=>p.status)))
 t('مهمان نمی‌تواند پروفایل بسازد', (await call('/api/profiles/coach',{method:'POST',body:JSON.stringify({slug:'zz-x',data:{a:1}})},null)).s===401,'')

 head('عمومی — پروفایلِ تأییدنشده نباید دیده شود')
 for(const kind of ['coach','seller']){
  const pub=await call('/api/profiles/'+kind,null,null)
  t(kind+': در فهرستِ عمومی نیست', !(pub.b?.profiles??[]).some(p=>String(p.slug).startsWith('zz-')),'')
  const one=await call('/api/profiles/'+kind+'?slug=zz-'+kind+'-audit',null,null)
  t(kind+': مستقیم هم باز نمی‌شود', one.s===404,'HTTP '+one.s)
 }

 head('ادمین — دیدن و تأیید')
 t('کاربرِ عادی به فهرستِ ادمین نمی‌رسد', (await call('/api/admin/profiles?kind=coach',null,uTok)).s===403,'')
 await rest('users?id=eq.'+me.id,{method:'PATCH',body:JSON.stringify({primaryRole:'admin',secondaryRoles:[...new Set([...(ORIG.secondaryRoles??[]),'admin'])]})})
 const adm=tk('admin')
 for(const kind of KINDS){
  const r=await call('/api/admin/profiles?kind='+kind,null,adm)
  const list=r.b?.profiles?.[kind]??[]
  t(kind.padEnd(13)+' در پنلِ ادمین دیده می‌شود', list.some(p=>String(p.slug).startsWith('zz-')), 'HTTP '+r.s+' — '+list.length+' ردیف')
 }
 const row=(await rest('profiles?select=id,slug&slug=eq.zz-coach-audit')).b[0]
 const ap=await call('/api/admin/profiles',{method:'PATCH',body:JSON.stringify({id:row.id,status:'approved'})},adm)
 t('ادمین پروفایل را تأیید می‌کند', ap.s===200,'HTTP '+ap.s+' '+JSON.stringify(ap.b).slice(0,90))
 t('در دیتابیس approved شد', (await rest('profiles?select=status&id=eq.'+row.id)).b[0].status==='approved','')

 head('عمومی — پس از تأیید دیده می‌شود')
 const pub=await call('/api/profiles/coach',null,null)
 t('در فهرستِ عمومیِ مربیان آمد', (pub.b?.profiles??[]).some(p=>p.slug==='zz-coach-audit'), (pub.b?.profiles??[]).length+' مربی')
 const one=await call('/api/profiles/coach?slug=zz-coach-audit',null,null)
 t('صفحه‌ی پروفایل برای مهمان باز می‌شود', one.s===200,'HTTP '+one.s)

 head('تعلیق — برگشت‌پذیر است')
 await call('/api/admin/profiles',{method:'PATCH',body:JSON.stringify({id:row.id,status:'rejected'})},adm)
 const pub2=await call('/api/profiles/coach',null,null)
 t('پس از تعلیق از فهرستِ عمومی می‌رود', !(pub2.b?.profiles??[]).some(p=>p.slug==='zz-coach-audit'),'')
}finally{
 head('پاک‌سازی')
 await cleanup()
 t('هیچ پروفایلِ آزمایشی نماند', ((await rest('profiles?select=id&slug=like.zz-*')).b??[]).length===0,'')
 const now=(await rest('users?select="primaryRole"&phone=eq.09001327283')).b[0]
 t('نقشِ حسابِ آزمایشی برگشت', now.primaryRole===ORIG.primaryRole, now.primaryRole)
}
console.log('\n  موفق: '+pass+'   ناموفق: '+fail+'\n');process.exit(fail?1:0)
