/* بخشِ «کسب‌وکارها» پنلِ ادمین: باشگاه، فروشگاه، محصول، تولیدکننده، متخصص.
       node scripts/test-business-admin.mjs
   محصولِ آزمایشی ساخته و در پایان پاک می‌شود؛ محصولاتِ واقعی دست نمی‌خورند. */
import fs from 'node:fs'; import jwt from 'jsonwebtoken'
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}))
const U=env.NEXT_PUBLIC_SUPABASE_URL,K=env.SUPABASE_SERVICE_ROLE_KEY,S=env.JWT_SECRET
const B=process.env.BH_BASE ?? 'http://localhost:3000'
const rest=async(p,i)=>{const r=await fetch(U+'/rest/v1/'+p,{...(i??{}),headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Prefer:'return=representation',...(i?.headers??{})}});const t=await r.text();return{s:r.status,b:t?JSON.parse(t):null}}
const me=(await rest('users?select=id,phone,"primaryRole","secondaryRoles"&phone=eq.09001327283')).b[0]
if(!me||me.primaryRole==='admin'){console.log('✗ حسابِ آزمایشی نامناسب');process.exit(1)}
const ORIG={primaryRole:me.primaryRole,secondaryRoles:me.secondaryRoles}
let prodId=null
const cleanup=async()=>{if(prodId){try{await rest('products?id=eq.'+prodId,{method:'DELETE'})}catch{}}
  await rest('users?id=eq.'+me.id,{method:'PATCH',body:JSON.stringify(ORIG)})}
for(const sg of ['SIGINT','SIGTERM','SIGPIPE'])process.on(sg,()=>{cleanup().finally(()=>process.exit(130))})
let pass=0,fail=0
const t=(n,ok,x='')=>{ok?pass++:fail++;console.log('  '+(ok?'✓':'✗')+' '+n+(ok?'':'  ← '+x))}
const head=x=>console.log('\n■ '+x)
const tk=r=>jwt.sign({sub:me.id,role:r,phone:me.phone},S,{expiresIn:'20m'})
const call=async(p,i,k)=>{const r=await fetch(B+p,{...(i??{}),headers:{...(k?{Authorization:'Bearer '+k}:{}),'Content-Type':'application/json',...(i?.headers??{})}});let b=null;try{b=await r.json()}catch{};return{s:r.status,b}}

try{
 const uTok=tk('user')
 head('محصولات — شکلِ پاسخ')
 const list=await call('/api/products?limit=200',null,null)
 t('/api/products برای مهمان باز است', list.s===200,'HTTP '+list.s)
 t('پاسخ شیء است با کلیدِ products', !Array.isArray(list.b) && Array.isArray(list.b?.products), JSON.stringify(Object.keys(list.b??{})))
 const dbCount=((await rest('products?select=id')).b??[]).length
 t('تعداد با دیتابیس یکی است', (list.b?.products??[]).length===dbCount, (list.b?.products??[]).length+' در برابر '+dbCount)

 head('محصولات — عملیاتِ ادمین (که تا امروز ۴۰۵ می‌گرفت)')
 const seller=(await rest('users?select=id&limit=1')).b[0]
 const mk=await rest('products',{method:'POST',body:JSON.stringify({title:'zz-محصولِ-ممیزی',description:'توضیحِ آزمایشی',price:100000,category:'چوب','sellerId':seller.id,'isVerified':false,'requestedVerification':true,status:'active'})})
 prodId=mk.b?.[0]?.id
 t('محصولِ آزمایشی ساخته شد', !!prodId, 'HTTP '+mk.s+' '+JSON.stringify(mk.b).slice(0,110))

 t('مهمان نمی‌تواند تأیید کند', (await call('/api/products/'+prodId,{method:'PUT',body:JSON.stringify({isVerified:true})},null)).s===401,'')
 t('کاربرِ عادی نمی‌تواند تأیید کند', (await call('/api/products/'+prodId,{method:'PUT',body:JSON.stringify({isVerified:true})},uTok)).s===403,'')
 t('مهمان نمی‌تواند حذف کند', (await call('/api/products/'+prodId,{method:'DELETE'},null)).s===401,'')
 t('کاربرِ عادی نمی‌تواند حذف کند', (await call('/api/products/'+prodId,{method:'DELETE'},uTok)).s===403,'')
 t('محصول هنوز هست', ((await rest('products?select=id&id=eq.'+prodId)).b??[]).length===1,'')
 t('کاربرِ عادی فهرستِ کاملِ باشگاه‌ها نمی‌گیرد', (await call('/api/clubs?all=true',null,uTok)).s===403,'')
 t('مهمان فهرستِ کاملِ باشگاه‌ها نمی‌گیرد', (await call('/api/clubs?all=true',null,null)).s===403,'')

 await rest('users?id=eq.'+me.id,{method:'PATCH',body:JSON.stringify({primaryRole:'admin',secondaryRoles:[...new Set([...(ORIG.secondaryRoles??[]),'admin'])]})})
 const adm=tk('admin')
 const v=await call('/api/products/'+prodId,{method:'PUT',body:JSON.stringify({isVerified:true})},adm)
 t('ادمین محصول را تأیید می‌کند', v.s===200,'HTTP '+v.s+' '+JSON.stringify(v.b).slice(0,110))
 const after=(await rest('products?select="isVerified","requestedVerification"&id=eq.'+prodId)).b[0]
 t('در دیتابیس نشست', after.isVerified===true, String(after.isVerified))
 t('درخواستِ تأیید بسته شد', after.requestedVerification===false, String(after.requestedVerification))
 t('PATCH هم کار می‌کند', (await call('/api/products/'+prodId,{method:'PATCH',body:JSON.stringify({isVerified:false})},adm)).s===200,'')
 t('فیلدِ غیرمجاز پذیرفته نمی‌شود', (await call('/api/products/'+prodId,{method:'PATCH',body:JSON.stringify({price:1})},adm)).s===400,'')
 t('قیمت دست‌نخورده ماند', Number((await rest('products?select=price&id=eq.'+prodId)).b[0].price)===100000,'')
 t('شناسه‌ی نامعتبر ۴۰۴ می‌گیرد', (await call('/api/products/not-uuid',{method:'PATCH',body:JSON.stringify({isVerified:true})},adm)).s===404,'')

 const d=await call('/api/products/'+prodId,{method:'DELETE'},adm)
 t('ادمین محصول را حذف می‌کند', d.s===200,'HTTP '+d.s)
 t('واقعاً از دیتابیس رفت', ((await rest('products?select=id&id=eq.'+prodId)).b??[]).length===0,'')
 if(((await rest('products?select=id&id=eq.'+prodId)).b??[]).length===0) prodId=null
 t('حذف در ممیزی ثبت شد', ((await rest('audit_logs?select=id&action=eq.PRODUCT_DELETED_BY_ADMIN&order=created_at.desc&limit=1')).b??[]).length===1,'')

 head('باشگاه‌ها و فروشگاه‌ها')
 const cl=await call('/api/clubs?all=true',null,adm)
 t('فهرستِ کاملِ باشگاه‌ها برای ادمین', cl.s===200 && Array.isArray(cl.b), 'HTTP '+cl.s)
 t('تعداد با دیتابیس یکی است', (cl.b??[]).length===((await rest('clubs?select=id')).b??[]).length,'')
 for(const kind of ['seller','manufacturer','technician']){
  const r=await call('/api/admin/profiles?kind='+kind,null,adm)
  t(kind.padEnd(13)+' در پنلِ ادمین باز می‌شود', r.s===200,'HTTP '+r.s)
 }
}finally{
 head('پاک‌سازی')
 await cleanup()
 t('محصولِ آزمایشی نماند', ((await rest('products?select=id&title=like.zz-*')).b??[]).length===0,'')
 t('نقشِ حسابِ آزمایشی برگشت', (await rest('users?select="primaryRole"&phone=eq.09001327283')).b[0].primaryRole===ORIG.primaryRole,'')
}
console.log('\n  موفق: '+pass+'   ناموفق: '+fail+'\n');process.exit(fail?1:0)
