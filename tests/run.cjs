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
