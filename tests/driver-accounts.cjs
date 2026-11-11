/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const ts = require('typescript');
const vm = require('node:vm');
const fs = require('node:fs');
const phoneSource = ts.transpile(fs.readFileSync('lib/phone.ts', 'utf8'), { module: ts.ModuleKind.CommonJS });
const phoneExports = {};
vm.runInNewContext(phoneSource, { exports: phoneExports });
const { normalizePhone } = phoneExports;
async function run(role, responses, authFailure = false) {
  const calls = [];
  const db = {
    from(table) {
      const chain = {};
      for (const method of ['select', 'eq', 'insert', 'delete', 'single']) chain[method] = (...args) => { calls.push([table, method, ...args]); return chain; };
      chain.then = (resolve, reject) => Promise.resolve(responses.shift()).then(resolve, reject);
      return chain;
    },
    auth: { admin: {
      createUser: async args => { calls.push(['createUser', args]); return authFailure ? { error: {} } : { data: { user: { id: 'new-user' } } }; },
      updateUserById: async (...args) => { calls.push(['updateUser', ...args]); return {}; },
      deleteUser: async id => { calls.push(['deleteUser', id]); return {}; },
    } },
  };
  const exports = {};
  const source = ts.transpile(fs.readFileSync('app/api/admin/drivers/route.ts', 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 });
  vm.runInNewContext(source, { exports, Response, URL, require: name => {
    if (name.endsWith('staff-auth')) return { staffIdentity: async () => role ? { role } : null };
    if (name.endsWith('supabase-server')) return { createServiceRoleClient: () => db };
    if (name.endsWith('phone')) return { normalizePhone };
    throw Error(name);
  } });
  return { calls, post: body => exports.POST(new Request('https://alnaqaa.org/api/admin/drivers', { method: 'POST', headers: { origin: 'https://alnaqaa.org', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })) };
}
(async () => {
  const input = { name: 'Driver', phone: '0501234567', password: 'test-password-123' };
  for (const role of [null, 'driver']) {
    const t = await run(role, []); assert.equal((await t.post(input)).status, 403); assert.equal(t.calls.length, 0);
  }
  let t = await run('admin', []); assert.equal((await t.post({ ...input, password: 'short' })).status, 400);
  t = await run('admin', [{ data: [{ id: 1, phone: '+972501234567' }] }]); assert.equal((await t.post(input)).status, 409); assert.ok(!t.calls.some(c => c[0] === 'createUser'));
  t = await run('admin', [{ data: [] }, { data: { id: 5 } }, { error: null }]); assert.equal((await t.post(input)).status, 201);
  assert.equal(t.calls.find(c => c[0] === 'createUser')[1].email, 'driver.972501234567@drivers.alnaqaa.org');
  assert.deepEqual(t.calls.find(c => c[0] === 'profiles' && c[1] === 'insert').slice(2).map(x => JSON.parse(JSON.stringify(x))), [{ id: 'new-user', role: 'driver', driver_id: 5 }]);
  t = await run('admin', [{ data: { phone: input.phone } }, { data: [{ id: 'existing', role: 'driver' }] }]); assert.equal((await t.post({ ...input, id: 5 })).status, 200); assert.equal(t.calls.find(c => c[0] === 'updateUser')[1], 'existing');
  t = await run('admin', [{ data: { phone: input.phone } }, { data: [{ id: 'admin', role: 'admin' }] }]); assert.equal((await t.post({ ...input, id: 5 })).status, 409); assert.ok(!t.calls.some(c => c[0] === 'updateUser'));
  t = await run('admin', [{ data: [] }, { data: { id: 5 } }, { error: new Error('profile insert failed') }, {}, {}]); assert.equal((await t.post(input)).status, 500); assert.ok(t.calls.some(c => c[0] === 'deleteUser')); assert.ok(t.calls.some(c => c[0] === 'drivers' && c[1] === 'delete'));
  console.log('Driver accounts: authorization, validation, duplicate phone, creation/linking, existing password, admin protection and rollback passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
