import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { api, auth } from './api';
import { adminOrderPayload } from './admin-data';
import type { AdminForm } from './admin-data';
import { ORDER_STATUSES, SERVICE_LABELS, STATUS_LABELS } from '../../lib/types';
import type { Order, Driver, OrderStatusHistory } from '../../lib/types';
import { normalizePhone } from '../../lib/phone';
import { orderRequestKey } from '../../lib/order-request';
const PAGE_SIZE = 50;
function db() { if (!auth) throw new Error('إعداد تسجيل الدخول غير مكتمل'); return auth; }
function localDate(value: string | null) { if (!value) return ''; const d = new Date(value); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16); }
function toForm(o?: Order): AdminForm { return {
  customer_name:o?.customer_name ?? '',phone:o?.phone ?? '',address:o?.address ?? '',service_type:o?.service_type ?? 'غسيل',
  status:o?.status ?? 'picked_up',pickup_date:o?.pickup_date ?? '',pickup_time:o?.pickup_time?.slice(0,5) ?? '',notes:o?.notes ?? '',
  assigned_driver_id:String(o?.assigned_driver_id ?? ''),route_order:String(o?.route_order ?? ''),items_count:String(o ? (o.items_count ?? '') : '1'),
  total_amount:String(o?.total_amount ?? ''),payment_status:o?.payment_status ?? 'unpaid',google_maps_link:o?.google_maps_link ?? '',
  scheduled_at:localDate(o?.scheduled_at ?? null),expected_delivery_time:localDate(o?.expected_delivery_time ?? null),
}; }
export default function AdminPanel() {
  const [tab,setTab]=useState<'orders'|'drivers'>('orders');
  const [orders,setOrders]=useState<Order[]>([]),[drivers,setDrivers]=useState<Driver[]>([]);
  const [notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false);
  const saving=useRef(false),requestSeq=useRef(0);
  const [limit,setLimit]=useState(PAGE_SIZE),[hasMore,setHasMore]=useState(false);
  const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[driverFilter,setDriverFilter]=useState(''),[date,setDate]=useState('');
  const [editing,setEditing]=useState<Order | 'new' | null>(null),[form,setForm]=useState<AdminForm>(toForm());
  const editor=useRef<HTMLElement>(null);
  useEffect(()=>{ if(editing) editor.current?.scrollIntoView({behavior:"smooth",block:"start"}); },[editing]);
  const [history,setHistory]=useState<OrderStatusHistory[] | null>(null),[historyOrder,setHistoryOrder]=useState('');
  const [driverEdit,setDriverEdit]=useState<Driver | 'new' | null>(null),[driverName,setDriverName]=useState(''),[driverPhone,setDriverPhone]=useState('');
  const load=useCallback(async () => {
    const seq=++requestSeq.current;
    let query=db().from('orders').select('*').order('created_at',{ascending:false}).order('id',{ascending:false}).limit(limit+1);
    if(status) query=query.eq('status',status);
    if(driverFilter) query=driverFilter==='none'?query.is('assigned_driver_id',null):query.eq('assigned_driver_id',Number(driverFilter));
    if(date) query=query.eq('pickup_date',date);
    const [o,d]=await Promise.all([query,db().from('drivers').select('*').order('name')]);
    if(o.error || d.error) throw new Error('تعذر تحميل الإدارة، تحقق من الاتصال والصلاحيات');
    if(seq!==requestSeq.current) return;
    setOrders((o.data ?? []).slice(0,limit));setHasMore((o.data?.length ?? 0)>limit);setDrivers(d.data ?? []);setLoaded(true);
  },[limit,status,driverFilter,date]);
  const invalidate=useCallback(()=>{requestSeq.current++;},[]);
  useEffect(()=>{ void load().catch(e=>setNotice(e.message)); const timer=setInterval(()=>{if(!saving.current) void load().catch(()=>setNotice('تعذر تحديث القائمة، تحقق من الاتصال'));},15000); return ()=>{clearInterval(timer);invalidate();};},[load,invalidate]);
  async function run(action:()=>Promise<void>) { if(saving.current)return; saving.current=true;setBusy(true);setNotice('');try{await action();}catch(e){setNotice(e instanceof Error?e.message:'تعذر إكمال العملية');}finally{saving.current=false;setBusy(false);} }
  function wake() { void api('/api/notifications/dispatch',{},'POST').catch(()=>setNotice('تم حفظ الطلب. تعذر تشغيل الإرسال الآن؛ راجع الإشعارات من الموقع.')); }
  async function saveOrder(e:FormEvent) { e.preventDefault();await run(async()=>{
    const old=editing && editing!=='new'?editing:null;
    const payload=adminOrderPayload(form,drivers.filter(d=>d.is_active).map(d=>d.id),old?.assigned_driver_id ?? null);
    if(old && old.assigned_driver_id!==payload.assigned_driver_id && ['pending','scheduled','assigned'].includes(payload.status)) payload.status=payload.assigned_driver_id?'assigned':'scheduled';
    if(old){
      let q=db().from('orders').update({...payload,updated_at:new Date().toISOString()}).eq('id',old.id).eq('status',old.status);
      q=old.updated_at?q.eq('updated_at',old.updated_at):q.is('updated_at',null);
      const {data,error}=await q.select('id');
      if(error || !data?.length)throw new Error('تعذر الحفظ أو تغيّر الطلب من جهاز آخر. حدّث القائمة وافتحه مجددًا.');
    }else{
      const storage={getItem:()=>sessionStorage.getItem('naqaa-admin-request'),setItem:(_:string,v:string)=>sessionStorage.setItem('naqaa-admin-request',v)};
      const key=await orderRequestKey(payload,storage);
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload))))).map(x=>x.toString(16).padStart(2,'0')).join('');
      const {error}=await db().from('orders').insert({...payload,fulfillment_type:'walk_in',order_source:'walk_in',request_key:key,request_hash:hash,whatsapp_opt_in:false});
      if(error){const prior=await db().from('orders').select('id,request_hash').eq('request_key',key).maybeSingle();if(!prior.data || prior.data.request_hash!==hash)throw new Error('تعذر حفظ طلب المحل. أعد المحاولة بنفس البيانات.');}
      sessionStorage.removeItem('naqaa-admin-request');
    }
    setEditing(null);setNotice('تم حفظ الطلب');wake();await load();
  }); }
  async function showHistory(order:Order) {await run(async()=>{const {data,error}=await db().from('order_status_history').select('*').eq('order_id',order.id).order('changed_at',{ascending:false});if(error)throw new Error('تعذر تحميل سجل الحالات');setHistory(data ?? []);setHistoryOrder(order.order_number ?? String(order.id));});}
  async function saveDriver(e:FormEvent){e.preventDefault();await run(async()=>{
    const phone=normalizePhone(driverPhone);if(!phone || driverName.trim().length<2 || driverName.trim().length>100)throw new Error('الاسم ورقم هاتف صحيح مطلوبان');
    const payload={name:driverName.trim(),phone,updated_at:new Date().toISOString()};
    const result=driverEdit==='new'?await db().from('drivers').insert({...payload,is_active:true}).select('id'):await db().from('drivers').update(payload).eq('id',driverEdit!.id).select('id');
    if(result.error || !result.data?.length)throw new Error('تعذر حفظ السائق؛ تأكد أن رقم الهاتف غير مكرر');
    setDriverEdit(null);setNotice('تم حفظ بيانات السائق');await load();
  });}
  function field(key:keyof AdminForm,label:string,type='text'){return <label>{label}<input type={type} value={form[key]} maxLength={key==='customer_name'?100:undefined} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/></label>;}
  const visible=orders.filter(o=>`${o.order_number} ${o.customer_name} ${o.phone} ${o.address ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  return <section aria-label="أدوات إدارة المغسلة">
    <div className="actions"><button onClick={()=>setTab('orders')}>الطلبات</button><button onClick={()=>setTab('drivers')}>السائقون</button><button disabled={busy} onClick={()=>run(load)}>تحديث القائمة</button></div>
    {notice && <p role="status" className="notice">{notice}</p>}
    {editing && <section ref={editor} className="order"><h2>{editing==='new'?'طلب محل جديد':`تعديل ${editing.order_number}`}</h2><form onSubmit={saveOrder}>
      {field('customer_name','اسم العميل')}{field('phone','الهاتف','tel')}{field('address','العنوان')}
      <label>الخدمة<select value={form.service_type} onChange={e=>setForm(f=>({...f,service_type:e.target.value}))}>{Object.entries(SERVICE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
      <label>الحالة<select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{[...ORDER_STATUSES,...(form.status==='delivered'?['delivered' as const]:[])].map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></label>
      <label>السائق<select value={form.assigned_driver_id} onChange={e=>setForm(f=>({...f,assigned_driver_id:e.target.value}))}><option value="">بدون سائق</option>{drivers.filter(d=>d.is_active || String(d.id)===form.assigned_driver_id).map(d=><option key={d.id} value={d.id}>{d.name}{!d.is_active?' (معطّل)':''}</option>)}</select></label>
      <div className="two">{field('route_order','ترتيب زيارة السائق','number')}{field('items_count','عدد القطع','number')}</div>
      <div className="two">{field('pickup_date','تاريخ الاستلام','date')}{field('pickup_time','وقت الاستلام','time')}</div>
      {field('scheduled_at','الموعد المجدول','datetime-local')}{field('expected_delivery_time','موعد التسليم المتوقع','datetime-local')}
      <label>المبلغ النهائي (₪)<input type="number" min="0" step="0.01" value={form.total_amount} onChange={e=>setForm(f=>({...f,total_amount:e.target.value}))}/></label>
      <label>التحصيل النقدي<select value={form.payment_status} onChange={e=>setForm(f=>({...f,payment_status:e.target.value}))}><option value="unpaid">لم يُحصّل</option><option value="paid">تم التحصيل</option></select></label>
      {field('google_maps_link','رابط خرائط Google','url')}
      <label>الملاحظات<textarea maxLength={500} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></label>
      {editing==='new' && <p>طلب مستلم داخل المحل. لا يفعّل موافقة واتساب نيابة عن العميل.</p>}
      <button className="primary" disabled={busy}>حفظ الطلب</button><button type="button" disabled={busy} onClick={()=>setEditing(null)}>إغلاق بدون حفظ</button>
    </form></section>}
    {history && <section className="order"><h2>سجل {historyOrder}</h2>{history.length?history.map(h=><p key={h.id}>{STATUS_LABELS[h.status]} · {new Date(h.changed_at).toLocaleString('ar')} {h.notes}</p>):<p>لا يوجد سجل حالات.</p>}<button onClick={()=>setHistory(null)}>إغلاق السجل</button></section>}
    {tab==='orders' && <>
      <button disabled={busy} onClick={()=>{setEditing('new');setForm(toForm());}}>إضافة طلب محل</button>
      <label>بحث ضمن الطلبات المحمّلة<input type="search" placeholder="رقم الطلب، الاسم، الهاتف أو العنوان" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <div className="two"><label>الحالة<select value={status} onChange={e=>{setStatus(e.target.value);setLimit(PAGE_SIZE);}}><option value="">كل الحالات</option>{ORDER_STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}<option value="delivered">تم التسليم (قديم)</option></select></label>
      <label>السائق<select value={driverFilter} onChange={e=>{setDriverFilter(e.target.value);setLimit(PAGE_SIZE);}}><option value="">كل السائقين</option><option value="none">بدون سائق</option>{drivers.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label></div>
      <label>تاريخ الاستلام<input type="date" value={date} onChange={e=>{setDate(e.target.value);setLimit(PAGE_SIZE);}}/></label>
      <p>المعروض {visible.length} من {orders.length} طلب محمّل · المحصّل {visible.reduce((n,o)=>n+(o.payment_status==='paid'?Number(o.total_amount ?? 0):0),0).toFixed(2)} ₪ · غير المحصّل المحدد {visible.reduce((n,o)=>n+(o.payment_status!=='paid'?Number(o.total_amount ?? 0):0),0).toFixed(2)} ₪</p>
      {!loaded?<p>جارٍ تحميل الطلبات…</p>:!visible.length && <p>لا توجد طلبات مطابقة.</p>}
      {visible.map(o=><article className="order" key={o.id}><small>{o.order_number}</small><h2>{o.customer_name}</h2><span className="badge">{STATUS_LABELS[o.status]}</span><p>{SERVICE_LABELS[o.service_type] ?? o.service_type} · {o.fulfillment_type==='walk_in'?'طلب محل':'استلام من المنزل'}<br/>{o.pickup_date} {o.pickup_time}<br/>{o.address}</p>
        <p>السائق: {drivers.find(d=>d.id===o.assigned_driver_id)?.name ?? 'غير معيّن'} · ترتيب الزيارة: {o.route_order ?? 'غير محدد'}<br/>عدد القطع: {o.items_count ?? 'غير محدد'}<br/>{o.total_amount==null?'المبلغ لم يحدد':`${o.total_amount} ₪`} · {o.payment_status==='paid'?'تم التحصيل':'لم يُحصّل'}</p>
        {o.scheduled_at && <p>الموعد المجدول: {new Date(o.scheduled_at).toLocaleString('ar')}</p>}{o.expected_delivery_time && <p>التسليم المتوقع: {new Date(o.expected_delivery_time).toLocaleString('ar')}</p>}
        {o.notes && <p>ملاحظات: {o.notes}</p>}
        <div className="actions"><a href={`tel:${o.phone}`}>اتصال بالعميل</a>{o.location_lat!=null && o.location_lng!=null && <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${o.location_lat},${o.location_lng}`}>موقع العميل</a>}{o.google_maps_link && /^https:\/\/(www\.)?(google\.com|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl)\//.test(o.google_maps_link) && <a target="_blank" rel="noreferrer" href={o.google_maps_link}>رابط الخرائط</a>}</div>
        <div className="actions"><button disabled={busy} onClick={()=>{setEditing(o);setForm(toForm(o));}}>إدارة وتعديل الطلب</button><button disabled={busy} onClick={()=>showHistory(o)}>سجل الحالات</button></div>
      </article>)}
      {hasMore && <button disabled={busy} onClick={()=>setLimit(n=>n+PAGE_SIZE)}>تحميل طلبات أقدم</button>}
    </>}
    {tab==='drivers' && <>
      <button disabled={busy} onClick={()=>{setDriverEdit('new');setDriverName('');setDriverPhone('');}}>إضافة سائق</button>
      {driverEdit && <form onSubmit={saveDriver}><h2>{driverEdit==='new'?'سائق جديد':'تعديل السائق'}</h2><label>الاسم<input required minLength={2} maxLength={100} value={driverName} onChange={e=>setDriverName(e.target.value)}/></label><label>الهاتف<input required type="tel" value={driverPhone} onChange={e=>setDriverPhone(e.target.value)}/></label><p>إضافة بيانات السائق لا تنشئ حساب دخول جديدًا؛ حسابه وصلاحياته تُجهّز بصورة منفصلة.</p><button disabled={busy}>حفظ السائق</button><button type="button" disabled={busy} onClick={()=>setDriverEdit(null)}>إغلاق</button></form>}
      {drivers.map(d=><article key={d.id} className="order"><h2>{d.name}</h2><p>{d.is_active?'مفعّل':'معطّل'} · {d.phone}</p><div className="actions"><a href={`tel:${d.phone}`}>اتصال</a><button disabled={busy} onClick={()=>{setDriverEdit(d);setDriverName(d.name);setDriverPhone(d.phone);}}>تعديل</button><button disabled={busy} onClick={()=>run(async()=>{const result=await db().from('drivers').update({is_active:!d.is_active,updated_at:new Date().toISOString()}).eq('id',d.id).eq('is_active',d.is_active).select('id');if(result.error || !result.data?.length)throw new Error('تعذر التحديث، حدّث القائمة وحاول مجددًا');await load();setNotice(d.is_active?'تم تعطيل وصول السائق':'تم تفعيل السائق');})}>{d.is_active?'تعطيل السائق':'تفعيل السائق'}</button></div></article>)}
    </>}
  </section>;
}
