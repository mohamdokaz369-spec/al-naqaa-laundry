/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS loader for dependency-free TypeScript regression tests. */
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpile(require('fs').readFileSync(filename, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }), filename);
const assert = require('node:assert/strict');
const {getNextBusinessSlot,businessClock} = require('../lib/business-hours.ts');
const {normalizePhone} = require('../lib/phone.ts');
const {orderCreateSchema} = require('../lib/validation.ts');
assert.deepEqual(getNextBusinessSlot(new Date('2026-10-18T05:00:00Z')), {date:'2026-10-18',time:'09:00'});
assert.deepEqual(getNextBusinessSlot(new Date('2026-10-22T15:00:00Z')), {date:'2026-10-23',time:'09:00'});
assert.equal(businessClock(new Date('2026-10-18T21:30:00Z')).date,'2026-10-19');
assert.equal(normalizePhone('050-123-4567'),'972501234567');
assert.equal(normalizePhone('+972 50 123 4567'),'972501234567');
assert.equal(normalizePhone('123456789'),'');
assert.deepEqual(getNextBusinessSlot(new Date('2026-10-16T06:00:00Z')), {date:'2026-10-16',time:'09:30'});
assert.deepEqual(getNextBusinessSlot(new Date('2026-10-18T14:00:00Z')), {date:'2026-10-18',time:'17:30'});
const valid={customer_name:'Test',phone:'0501234567',service_type:'غسيل',pickup_date:'2099-01-04',pickup_time:'10:00',address:'Arraba'};
assert.equal(orderCreateSchema.safeParse(valid).success,true);
for (const change of [{address:''},{service_type:'arbitrary'},{pickup_date:'2099-02-31'},{pickup_date:'2020-01-01'},{pickup_time:'18:00'},{google_maps_link:'javascript:alert(1)'}]) assert.equal(orderCreateSchema.safeParse({...valid,...change}).success,false);
console.log('15 regression checks passed');

(async () => {
 const { orderRequestKey } = require('../lib/order-request.ts');
 const values = new Map();
 const storage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v) };
 const first = await orderRequestKey({name:'test',service:'wash'}, storage);
 assert.equal(await orderRequestKey({name:'test',service:'wash'},storage), first);
 assert.notEqual(await orderRequestKey({name:'test',service:'dry'},storage), first);
 assert.equal(values.get('naqaa-order-request').includes('wash'), false);
 console.log('Request retry/reload, changed payload and privacy checks passed');
})().catch(error => { console.error(error); process.exitCode=1; });

const {whatsappTemplate,pushMessage,customerStatusLabel}=require('../lib/notifications/messages.ts');
const payload=whatsappTemplate('972501234567','order_update','ar',['NQ-1','جاهز']);
assert.equal(payload.type,'template');assert.equal(payload.template.components[0].parameters.length,2);
assert.equal(pushMessage('NQ-1','event-1').data.eventId,'event-1');
assert.equal(JSON.stringify(pushMessage('NQ-1','event-1')).includes('customer_name'),false);
console.log('WhatsApp template and minimal push payload checks passed');

const {verifyMetaSignature,isWhatsAppOptOut}=require('../lib/notifications/webhook-security.ts');
const {createHmac}=require('node:crypto');
const signedBody='{"object":"whatsapp_business_account"}';
const signature='sha256='+createHmac('sha256','unit-test-secret').update(signedBody).digest('hex');
assert.equal(verifyMetaSignature(signedBody,signature,'unit-test-secret'),true);
assert.equal(verifyMetaSignature(signedBody+' ',signature,'unit-test-secret'),false);
assert.equal(verifyMetaSignature(signedBody,'invalid','unit-test-secret'),false);
assert.equal(isWhatsAppOptOut(' STOP '),true);assert.equal(isWhatsAppOptOut('إلغاء'),true);assert.equal(isWhatsAppOptOut('مرحبا'),false);
console.log('Webhook signature, tamper rejection and opt-out checks passed');

const {nativeCors}=require('../lib/mobile-cors.ts');
const {NextRequest}=require('next/server');
const allowed=nativeCors(new NextRequest('https://naqaa.example/api/orders',{method:'OPTIONS',headers:{origin:'capacitor://localhost'}}));
assert.equal(allowed.status,204);assert.equal(allowed.headers.get('Access-Control-Allow-Origin'),'capacitor://localhost');
assert.equal(nativeCors(new NextRequest('https://naqaa.example/api/orders',{headers:{origin:'https://untrusted.example'}})),null);
console.log('Native origin preflight and untrusted origin rejection checks passed');

assert.match(customerStatusLabel("on_the_way"), /لاستلام أغراضك/);
assert.match(customerStatusLabel("delivering"), /لتسليم أغراضك بعد الغسيل/);

const {adminOrderPayload}=require('../mobile/src/admin-data.ts');
const adminForm={customer_name:'Test customer',phone:'0521234567',address:'Arraba',service_type:'غسيل',status:'assigned',pickup_date:'2026-10-20',pickup_time:'10:00',notes:'',assigned_driver_id:'1',route_order:'2',items_count:'3',total_amount:'0',payment_status:'paid',google_maps_link:'',scheduled_at:'',expected_delivery_time:''};
const adminPayload=adminOrderPayload(adminForm,[1]);
assert.equal(adminPayload.total_amount,0);assert.equal(adminPayload.assigned_driver_id,1);assert.equal(adminPayload.items_count,3);
assert.throws(()=>adminOrderPayload({...adminForm,total_amount:''},[1]));
assert.throws(()=>adminOrderPayload({...adminForm,total_amount:'-1'},[1]));
assert.throws(()=>adminOrderPayload({...adminForm,total_amount:'1.234'},[1]));
assert.throws(()=>adminOrderPayload({...adminForm,route_order:'1.5'},[1]));
assert.throws(()=>adminOrderPayload({...adminForm,assigned_driver_id:'2'},[1]));
assert.equal(adminOrderPayload({...adminForm,assigned_driver_id:'2'},[1],2).assigned_driver_id,2);
assert.throws(()=>adminOrderPayload({...adminForm,google_maps_link:'https://evil.example/maps'},[1]));
assert.throws(()=>adminOrderPayload({...adminForm,phone:'invalid'},[1]));
assert.throws(()=>adminOrderPayload({...adminForm,pickup_date:'2026-02-30'},[1]));
console.log('Mobile admin validation checks passed: cash/zero amount, active assignment, counts, phone, dates and map links.');
const {mapsPoint,googleMapsLocation}=require('../lib/maps-location.ts');
assert.equal(mapsPoint(0,0).google_maps_link,'https://www.google.com/maps?q=0,0');
assert.throws(()=>mapsPoint(91,35));assert.throws(()=>mapsPoint(NaN,35));
assert.equal(googleMapsLocation('https://www.google.com/maps?q=32.85,35.34').location_lat,32.85);
assert.equal(googleMapsLocation('https://maps.app.goo.gl/example').location_lat,null);
assert.equal(googleMapsLocation('https://www.google.com/maps/place/Arraba/@32.8,35.3,12z').location_lat,null);
assert.throws(()=>googleMapsLocation('https://google.com.evil.example/maps'));
assert.throws(()=>googleMapsLocation('javascript:alert(1)'));
assert.throws(()=>googleMapsLocation('https://user:pass@google.com/maps'));
assert.equal(googleMapsLocation('').google_maps_link,'');
console.log('Pickup maps checks passed: coordinate bounds, zero coordinates, safe links, short links and no camera-position confusion.');
assert.equal(orderCreateSchema.safeParse({...valid,address:'',...mapsPoint(32.85,35.34)}).success,true);
assert.equal(orderCreateSchema.safeParse({...valid,address:'',...googleMapsLocation('https://maps.app.goo.gl/example')}).success,true);
assert.equal(orderCreateSchema.safeParse({...valid,address:'',location_lat:32.85}).success,false);
