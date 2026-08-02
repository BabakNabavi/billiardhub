/* بخشِ «رزرو و مالی» پنلِ ادمین — اتصال، اعداد و دسترسی.
       node scripts/test-finance-admin.mjs
   عمداً هیچ تراکنشِ مالی ساخته نمی‌شود: دفتر append-only است و
   ردیفش پاک‌شدنی نیست. فقط خواندن و بررسیِ صحتِ اعداد. */
import fs from 'node:fs'; import jwt from 'jsonwebtoken'
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}))
const U=env.NEXT_PUBLIC_SUPABASE_URL,K=env.SUPABASE_SERVICE_ROLE_KEY,S=env.JWT_SECRET
const B=process.env.BH_BASE ?? 'http://localhost:3000'
const rest=async(p,i)=>{const r=await fetch(U+'/rest/v1/'+p,{...(i??{}),headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Prefer:'return=representation',...(i?.headers??{})}});const t=await r.text();return{s:r.status,b:t?JSON.parse(t):null}}
const me=(await rest('users?select=id,phone,"primaryRole","secondaryRoles"&phone=eq.09001327283')).b[0]
if(!me||me.primaryRole==='admin'){console.log('✗ حسابِ آزمایشی نامناسب');process.exit(1)}
const ORIG={primaryRole:me.primaryRole,secondaryRoles:me.secondaryRoles}
const restore=()=>rest('users?id=eq.'+me.id,{method:'PATCH',body:JSON.stringify(ORIG)})
for(const sg of ['SIGINT','SIGTERM','SIGPIPE'])process.on(sg,()=>{restore().finally(()=>process.exit(130))})
let pass=0,fail=0
const t=(n,ok,x='')=>{ok?pass++:fail++;console.log('  '+(ok?'✓':'✗')+' '+n+(ok?'':'  ← '+x))}
const head=x=>console.log('\n■ '+x)
const note=x=>console.log('  ⓘ '+x)
const tk=r=>jwt.sign({sub:me.id,role:r,phone:me.phone},S,{expiresIn:'20m'})
let led=[]
const call=async(p,i,k)=>{const r=await fetch(B+p,{...(i??{}),headers:{...(k?{Authorization:'Bearer '+k}:{}),'Content-Type':'application/json',...(i?.headers??{})}});let b=null;try{b=await r.json()}catch{};return{s:r.status,b}}

try{
 const uTok=tk('user')
 head('دسترسی — داده‌ی مالی نباید بیرون برود')
 for(const [p,m] of [['/api/admin/finance','GET'],['/api/admin/finance/transactions','GET'],
   ['/api/admin/bookings','GET'],['/api/admin/settlements','POST'],['/api/admin/commission','GET']]){
  const g=(await call(p,{method:m,...(m!=='GET'?{body:'{}'}:{})},null)).s
  t(m+' '+p+' — مهمان', g===401||g===403, 'HTTP '+g)
  t(m+' '+p+' — کاربرِ عادی', (await call(p,{method:m,...(m!=='GET'?{body:'{}'}:{})},uTok)).s===403,'')
 }

 await rest('users?id=eq.'+me.id,{method:'PATCH',body:JSON.stringify({primaryRole:'admin',secondaryRoles:[...new Set([...(ORIG.secondaryRoles??[]),'admin'])]})})
 const adm=tk('admin')

 head('داشبوردِ مالی — اعداد از دفترِ واقعی')
 const f=await call('/api/admin/finance',null,adm)
 t('/api/admin/finance باز می‌شود', f.s===200,'HTTP '+f.s)
 led=(await rest('ledger_entries?select=type,amount,status,club_id')).b??[]
 const posted=led.filter(e=>e.status==='POSTED')
 const commission=posted.filter(e=>e.type==='PLATFORM_COMMISSION').reduce((s,e)=>s+Number(e.amount||0),0)
 note('دفتر: '+led.length+' ردیف · کمیسیونِ ثبت‌شده: '+commission.toLocaleString('fa-IR'))
 const shown=JSON.stringify(f.b)
 t('پاسخ ساختار دارد (خالی نیست)', shown.length>20, shown.slice(0,80))

 head('ردیف‌های یتیم — باشگاهِ حذف‌شده نباید در گزارش بیاید')
 const clubIds=new Set(((await rest('clubs?select=id')).b??[]).map(c=>c.id))
 const orphans=posted.filter(e=>e.club_id && !clubIds.has(e.club_id))
 note(orphans.length+' ردیفِ دفتر به باشگاهِ حذف‌شده اشاره می‌کند')
 const tx=await call('/api/admin/finance/transactions',null,adm)
 t('/api/admin/finance/transactions باز می‌شود', tx.s===200,'HTTP '+tx.s)
 const rows=tx.b?.transactions??tx.b?.rows??(Array.isArray(tx.b)?tx.b:[])
 const orphanRows=rows.filter(r=>r.club_id && !clubIds.has(r.club_id))
 if(orphanRows.length){
   note('⚠️  گزارشِ مالیِ ادمین '+orphanRows.length+' ردیف از باشگاه‌های حذف‌شده نشان می‌دهد.')
   note('    این‌ها بازمانده‌ی اجرای test:finance:scenarios روی دیتابیسِ واقعی‌اند.')
   note('    پاک‌سازی (در SQL Editor؛ دفتر append-only است):')
   note('      ALTER TABLE ledger_entries DISABLE TRIGGER ledger_append_only;')
   note('      DELETE FROM ledger_entries le WHERE NOT EXISTS')
   note('        (SELECT 1 FROM clubs c WHERE c.id = le.club_id);')
   note('      ALTER TABLE ledger_entries ENABLE TRIGGER ledger_append_only;')
 }
 t('گزارشِ مالی ردیفِ یتیم ندارد', orphanRows.length===0, orphanRows.length+' ردیف — دستورِ پاک‌سازی بالا')

 head('موجودیِ باشگاه‌ها با دفتر می‌خواند')
 const accs=(await rest('club_accounts?select=club_id,available_balance,pending_balance,total_earnings,total_commission,total_settled')).b??[]
 t('برای هر باشگاهِ موجود حساب هست', accs.length>0, accs.length+' حساب')
 let mismatch=[]
 for(const a of accs){
  const mine=posted.filter(e=>e.club_id===a.club_id)
  const earned=mine.filter(e=>e.type==='CLUB_EARNING').reduce((s,e)=>s+Number(e.amount||0),0)
  const settled=-mine.filter(e=>e.type==='SETTLEMENT').reduce((s,e)=>s+Number(e.amount||0),0)
  const rev=mine.filter(e=>e.type==='SETTLEMENT_REVERSAL').reduce((s,e)=>s+Number(e.amount||0),0)
  const expect=earned-(settled-rev)
  if(Number(a.available_balance)!==expect) mismatch.push(a.club_id.slice(0,8)+': '+a.available_balance+'≠'+expect)
 }
 t('موجودیِ قابلِ تسویه با دفتر یکی است', mismatch.length===0, mismatch.join(' | '))

 head('مدیریتِ رزروها')
 const bk=await call('/api/admin/bookings?status=&q=',null,adm)
 t('/api/admin/bookings باز می‌شود', bk.s===200,'HTTP '+bk.s)
 const dbBk=((await rest('bookings?select=id')).b??[]).length
 t('تعدادِ رزروها با دیتابیس یکی است', (bk.b?.rows??[]).length===dbBk, (bk.b?.rows??[]).length+' در برابر '+dbBk)
 if(dbBk===0) note('هیچ رزروی در دیتابیس نیست — لغو و چرخه‌ی وضعیت آزموده نشد')

 head('نرخِ کمیسیون')
 const cm=await call('/api/admin/commission',null,adm)
 t('/api/admin/commission باز می‌شود', cm.s===200,'HTTP '+cm.s)
 const dbRules=((await rest('commission_rules?select=id&is_active=eq.true')).b??[]).length
 const apiRules=(cm.b?.active??[]).length
 t('قواعدِ کمیسیون از دیتابیس می‌آید', apiRules===dbRules, apiRules+' در برابر '+dbRules)

 head('تسویه — محافظ‌ها')
 const club=((await rest('clubs?select=id&limit=1')).b??[])[0]
 const big=await call('/api/admin/settlements',{method:'POST',body:JSON.stringify({clubId:club.id,amount:999999999999})},adm)
 t('تسویه‌ی بیش از طلب رد می‌شود', big.s>=400, 'HTTP '+big.s+' '+JSON.stringify(big.b).slice(0,90))
 const neg=await call('/api/admin/settlements',{method:'POST',body:JSON.stringify({clubId:club.id,amount:-5000})},adm)
 t('مبلغِ منفی رد می‌شود', neg.s>=400,'HTTP '+neg.s)
 const after=((await rest('settlements?select=id')).b??[]).length
 t('هیچ تسویه‌ای ساخته نشد', after===0, after+' ردیف')
}finally{
 head('بازگردانی')
 await restore()
 t('نقشِ حسابِ آزمایشی برگشت', (await rest('users?select="primaryRole"&phone=eq.09001327283')).b[0].primaryRole===ORIG.primaryRole,'')
 const ledNow=((await rest('ledger_entries?select=id')).b??[]).length
 t('این تست ردیفی به دفتر اضافه نکرد', ledNow===led.length, led.length+' → '+ledNow)
}
console.log('\n  موفق: '+pass+'   ناموفق: '+fail+'\n');process.exit(fail?1:0)
