/* چرخه‌ی کاملِ نقش: کاربر درخواست می‌دهد → ادمین بررسی می‌کند → نقش اعمال می‌شود.
       node scripts/test-role-flow.mjs
   هیچ کاربرِ واقعی‌ای دست نمی‌خورد جز حسابِ آزمایشی، که در پایان دقیقاً برمی‌گردد. */
import fs from 'node:fs'; import jwt from 'jsonwebtoken'
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}))
const U=env.NEXT_PUBLIC_SUPABASE_URL,K=env.SUPABASE_SERVICE_ROLE_KEY,S=env.JWT_SECRET
const B=process.env.BH_BASE ?? 'http://localhost:3000'
const rest=async(p,i)=>{const r=await fetch(U+'/rest/v1/'+p,{...(i??{}),headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Prefer:'return=representation',...(i?.headers??{})}});const t=await r.text();return{s:r.status,b:t?JSON.parse(t):null}}
const me=(await rest('users?select=id,phone,"primaryRole","secondaryRoles"&phone=eq.09001327283')).b[0]
if(!me){console.log('✗ حسابِ آزمایشی نیست');process.exit(1)}
if(me.primaryRole==='admin'){console.log('✗ حساب از قبل ادمین است');process.exit(1)}
const ORIG={primaryRole:me.primaryRole,secondaryRoles:me.secondaryRoles}
const made=[]
const cleanup=async()=>{for(const id of made){try{await rest('role_requests?id=eq.'+id,{method:'DELETE'})}catch{}}
  await rest('users?id=eq.'+me.id,{method:'PATCH',body:JSON.stringify(ORIG)})}
for(const sg of ['SIGINT','SIGTERM','SIGPIPE'])process.on(sg,()=>{cleanup().finally(()=>process.exit(130))})
let pass=0,fail=0
const t=(n,ok,x='')=>{ok?pass++:fail++;console.log('  '+(ok?'✓':'✗')+' '+n+(ok?'':'  ← '+x))}
const head=x=>console.log('\n■ '+x)
const tok=r=>jwt.sign({sub:me.id,role:r,phone:me.phone},S,{expiresIn:'20m'})
const call=async(p,i,k)=>{const r=await fetch(B+p,{...(i??{}),headers:{...(k?{Authorization:'Bearer '+k}:{}),'Content-Type':'application/json',...(i?.headers??{})}});let b=null;try{b=await r.json()}catch{};return{s:r.status,b}}

try{
 const userTok=tok('user')
 head('کاربر — درخواستِ نقش')
 t('بدونِ ورود نمی‌شود درخواست داد', (await call('/api/roles/request',{method:'POST',body:JSON.stringify({role:'coach'})},null)).s===401,'')
 const r1=await call('/api/roles/request',{method:'POST',body:JSON.stringify({role:'coach'})},userTok)
 if(r1.b?.request?.id) made.push(r1.b.request.id)
 t('درخواستِ «مربی» ثبت می‌شود', r1.s===201, 'HTTP '+r1.s+' '+JSON.stringify(r1.b).slice(0,110))
 t('در دیتابیس نشست', ((await rest('role_requests?select=id&user_id=eq.'+me.id+'&role=eq.coach')).b??[]).length===1,'')
 const dup=await call('/api/roles/request',{method:'POST',body:JSON.stringify({role:'coach'})},userTok)
 t('درخواستِ تکراری ردیفِ دوم نمی‌سازد', dup.b?.duplicate===true, JSON.stringify(dup.b).slice(0,90))
 t('نقشِ ناشناخته رد می‌شود', (await call('/api/roles/request',{method:'POST',body:JSON.stringify({role:'چرت'})},userTok)).s===400,'')
 t('نمی‌شود از این مسیر ادمین شد', (await call('/api/roles/request',{method:'POST',body:JSON.stringify({role:'admin'})},userTok)).s===400,'')
 t('مدرکِ با نشانیِ بیرونی رد می‌شود', (await call('/api/roles/request',{method:'POST',body:JSON.stringify({role:'referee',docUrl:'http://evil.example/x.pdf'})},userTok)).s===400,'')

 head('کاربر — دیدنِ درخواست‌های خودش')
 const mine=await call('/api/roles/my',null,userTok)
 t('/api/roles/my پاسخ می‌دهد', mine.s===200,'HTTP '+mine.s)
 t('درخواستِ مربی را می‌بیند', (mine.b?.requests??[]).some(x=>x.role==='coach'),'')
 t('نقشِ فعلی هم برمی‌گردد', !!mine.b?.current?.primaryRole, JSON.stringify(mine.b?.current))
 t('برای مهمان بسته است', (await call('/api/roles/my',null,null)).s===401,'')

 head('ادمین — بررسی')
 t('کاربرِ عادی به صفِ ادمین نمی‌رسد', (await call('/api/admin/roles',null,userTok)).s===403,'')
 await rest('users?id=eq.'+me.id,{method:'PATCH',body:JSON.stringify({primaryRole:'admin',secondaryRoles:[...new Set([...(ORIG.secondaryRoles??[]),'admin'])]})})
 const adm=tok('admin')
 const q=await call('/api/admin/roles?status=pending',null,adm)
 t('صفِ درخواست‌ها باز می‌شود', q.s===200,'HTTP '+q.s)
 t('درخواستِ مربی در صف دیده می‌شود', (q.b?.requests??[]).some(x=>x.role==='coach'), (q.b?.requests??[]).length+' ردیف')
 t('نامِ کاربر همراهش می‌آید', !!(q.b?.requests??[]).find(x=>x.role==='coach')?.users?.mobile,'')
 t('شمارشِ تب‌ها می‌آید', typeof q.b?.counts?.pending==='number', JSON.stringify(q.b?.counts))
 t('ردکردن بدونِ علت نمی‌شود', (await call('/api/admin/roles',{method:'PATCH',body:JSON.stringify({id:made[0],action:'reject'})},adm)).s===400,'')

 head('ادمین — تأیید و اعمالِ واقعیِ نقش')
 const ap=await call('/api/admin/roles',{method:'PATCH',body:JSON.stringify({id:made[0],action:'approve'})},adm)
 t('تأیید انجام می‌شود', ap.s===200,'HTTP '+ap.s+' '+JSON.stringify(ap.b).slice(0,110))
 const after=(await rest('users?select="primaryRole","secondaryRoles"&id=eq.'+me.id)).b[0]
 t('نقشِ مربی واقعاً به کاربر داده شد', (after.secondaryRoles??[]).includes('coach'), JSON.stringify(after.secondaryRoles))
 t('نقشِ اصلیِ موجود پاک نشد', after.primaryRole==='admin', after.primaryRole)
 t('درخواستِ بررسی‌شده دوباره بررسی نمی‌شود', (await call('/api/admin/roles',{method:'PATCH',body:JSON.stringify({id:made[0],action:'reject',note:'x'})},adm)).s===409,'')
 const st=(await rest('role_requests?select=status,reviewed_by,reviewed_at&id=eq.'+made[0])).b[0]
 t('وضعیت approved و بررسی‌کننده ثبت شد', st.status==='approved'&&!!st.reviewed_by&&!!st.reviewed_at, JSON.stringify(st))
 t('در ممیزی ثبت شد', ((await rest('audit_logs?select=id&action=eq.ROLE_APPROVED&order=created_at.desc&limit=1')).b??[]).length===1,'')
}finally{
 head('پاک‌سازی')
 await cleanup()
 const now=(await rest('users?select="primaryRole","secondaryRoles"&phone=eq.09001327283')).b[0]
 t('نقشِ حسابِ آزمایشی دقیقاً برگشت', now.primaryRole===ORIG.primaryRole && JSON.stringify(now.secondaryRoles)===JSON.stringify(ORIG.secondaryRoles), now.primaryRole+' '+JSON.stringify(now.secondaryRoles))
 t('هیچ درخواستِ آزمایشی نماند', ((await rest('role_requests?select=id&user_id=eq.'+me.id)).b??[]).length===0,'')
 t('یک ادمین در سامانه', ((await rest('users?select=id&primaryRole=eq.admin')).b??[]).length===1,'')
}
console.log('\n  موفق: '+pass+'   ناموفق: '+fail+'\n');process.exit(fail?1:0)
