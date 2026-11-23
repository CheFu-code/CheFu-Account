import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { webcrypto } from 'node:crypto';

function load(path, dependencies = {}, globals = {}) {
  const loaded = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: name => { assert.ok(name in dependencies, name); return dependencies[name]; }, URL, URLSearchParams, Headers, process: { env: {} }, ...globals });
  return loaded.exports;
}
const policy = { id: 'new-product', name: 'New Product', origins: ['https://new.example.test'], clients: [{ id: 'new-product-web', redirectUris: ['https://new.example.test/callback'], scopes: ['openid'] }] };

test('Account policy reads are fresh, omit credentials, and reject registry failures or mismatched identities', async () => {
  let status = 200, payload = policy, calls = 0;
  const { loadAppPolicy } = load('lib/load-app-policy.ts', {}, { AbortSignal, fetch: async (url, init) => {
    calls++; assert.equal(url, 'https://api.chefu.co.za/apps/policy/new-product');
    assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'error');
    assert.equal(init.credentials, undefined);
    return { status, ok: status === 200, json: async () => payload };
  } });
  assert.equal((await loadAppPolicy('new-product')).id, policy.id);
  await loadAppPolicy('new-product'); assert.equal(calls, 2);
  status = 404; assert.equal(await loadAppPolicy('new-product'), null);
  status = 503; await assert.rejects(loadAppPolicy('new-product'), /unavailable/);
  status = 200; payload = { ...policy, id: 'admin' };
  await assert.rejects(loadAppPolicy('new-product'), /Invalid application policy/);
  assert.equal(await loadAppPolicy('../admin'), null);
});

test('middleware discards caller policy headers, uses verified registry data, and fails closed on errors/revocation', async () => {
  const redirectPolicy = load('lib/redirect-policy.ts');
  let activePolicy = policy, unavailable = false;
  const NextResponse = {
    json: (body, init) => ({ body, status: init.status }),
    next: init => ({ request: init.request, headers: new Headers(), status: 200 }),
    redirect: () => assert.fail('A valid flow ID should not redirect'),
  };
  const { middleware } = load('middleware.ts', {
    'next/server': { NextResponse }, './lib/redirect-policy': redirectPolicy,
    './lib/load-app-policy': { loadAppPolicy: async id => { assert.equal(id, policy.id); if (unavailable) throw new Error('Offline'); return activePolicy; } },
  }, { crypto: webcrypto, btoa: value => Buffer.from(value, 'binary').toString('base64') });
  const request = app => ({ nextUrl: new URL(`https://myaccount.chefu.co.za/login?app=${app}&flow_id=${'a'.repeat(32)}&returnTo=${encodeURIComponent(app === 'admin' ? 'https://admin.chefu.co.za/' : 'https://new.example.test/')}`), headers: new Headers({ 'x-chefu-app-policy': JSON.stringify({ ...policy, origins: ['https://attacker.test'] }) }) });
  const registered = await middleware(request(policy.id));
  assert.equal(registered.status, 200);
  assert.deepEqual(JSON.parse(registered.request.headers.get('x-chefu-app-policy')), policy);
  const builtin = await middleware(request('admin'));
  assert.equal(builtin.request.headers.get('x-chefu-app-policy'), null);
  activePolicy = null;
  assert.equal((await middleware(request(policy.id))).status, 400);
  unavailable = true;
  assert.equal((await middleware(request(policy.id))).status, 503);
});
