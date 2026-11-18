import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

function load(file, dependencies = {}, globals = {}) {
    const loaded = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { module: loaded, exports: loaded.exports, URL, URLSearchParams,
        AbortController, setTimeout, clearTimeout, require: name => {
            assert.ok(name in dependencies, name); return dependencies[name];
        }, ...globals });
    return loaded.exports;
}
const policy = load('lib/redirect-policy.ts');
function setup(fetch) {
    return load('lib/session-reuse.ts', {
        './chefu-account': { apiUrl: path => `https://api.chefu.co.za${path}`, resolveChefuApp: policy.resolveChefuAppId },
        './redirect-policy': policy,
        './auth-reads': load('lib/auth-reads.ts'),
    }, { fetch });
}
function oauthParams() {
    return new URLSearchParams({ app: 'liftwise', returnTo: `https://api.chefu.co.za/oauth/authorize?${new URLSearchParams({
        client_id: 'liftwise-mobile', redirect_uri: 'liftwise://sso-callback', response_type: 'code',
        code_challenge: 'a'.repeat(43), code_challenge_method: 'S256',
        state: 'state-that-is-long-enough', nonce: 'nonce-that-is-long-enough', scope: 'openid profile email',
    })}` });
}

test('reuse preserves validated OAuth state, PKCE and callback, and supports the account landing page', () => {
    const { sessionReuseTarget } = setup();
    const params = oauthParams();
    assert.equal(sessionReuseTarget(params).target, params.get('returnTo'));
    assert.equal(sessionReuseTarget(new URLSearchParams()).target, '/account');
});

test('untrusted redirects, mismatched clients, auth loops and interactive prompts never auto-redirect', () => {
    const { sessionReuseTarget } = setup();
    for (const destination of ['https://evil.example', '//evil.example', '/login', '/register/', '/logout?returnTo=/login', '/forgot-password']) {
        assert.equal(sessionReuseTarget(new URLSearchParams({ returnTo: destination })), null, destination);
    }
    const duplicate = oauthParams(); duplicate.append('app', 'root');
    assert.equal(sessionReuseTarget(duplicate), null);
    const mismatch = oauthParams(); mismatch.set('app', 'admin');
    assert.equal(sessionReuseTarget(mismatch), null);
    for (const prompt of ['login', 'select_account', 'consent']) {
        const top = oauthParams(); top.set('prompt', prompt);
        assert.equal(sessionReuseTarget(top), null);
        const nested = oauthParams();
        const authorize = new URL(nested.get('returnTo')); authorize.searchParams.set('prompt', prompt);
        nested.set('returnTo', authorize.toString());
        assert.equal(sessionReuseTarget(nested), null);
    }
});

test('concurrent checks share one credentialed request and later checks revalidate after logout', async () => {
    let resolve;
    let requests = 0;
    let valid = true;
    const { hasReusableSession } = setup(async (url, options) => {
        requests++;
        assert.equal(url, 'https://api.chefu.co.za/auth/session/status');
        assert.equal(options.credentials, 'include');
        assert.equal(options.cache, 'no-store');
        assert.equal(options.redirect, 'error');
        assert.equal(options.headers['x-chefu-app'], 'liftwise');
        await new Promise(done => { resolve = done; });
        return { ok: true, json: async () => ({ authenticated: valid }) };
    });
    const first = hasReusableSession('liftwise');
    const second = hasReusableSession('liftwise');
    await Promise.resolve();
    assert.equal(requests, 1);
    resolve();
    assert.equal(await first, true);
    assert.equal(await second, true);
    valid = false;
    const afterLogout = hasReusableSession('liftwise');
    await Promise.resolve();
    assert.equal(requests, 2, 'no cached authenticated result');
    resolve();
    assert.equal(await afterLogout, false);
});

test('backend errors, invalid payloads and timeouts fall back to the form without retries', async () => {
    for (const result of [{ ok: false }, { ok: true, json: async () => ({ authenticated: 'true' }) }, { ok: true, json: async () => null }, { ok: true, json: async () => { throw new Error('invalid JSON'); } }]) {
        const { hasReusableSession } = setup(async () => result);
        assert.equal(await hasReusableSession('root'), false);
    }
    const { hasReusableSession } = setup(async () => { throw new Error('offline'); });
    assert.equal(await hasReusableSession('root'), false);
    const timed = load('lib/session-reuse.ts', {
        './chefu-account': { apiUrl: path => path, resolveChefuApp: policy.resolveChefuAppId }, './redirect-policy': policy,
        './auth-reads': load('lib/auth-reads.ts'),
    }, {
        setTimeout: fn => { queueMicrotask(fn); return 1; }, clearTimeout() {},
        fetch: async (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('timeout')))),
    });
    assert.equal(await timed.hasReusableSession('root'), false);
});

test('the gate hides forms during the check, redirects valid sessions, and ignores results after unmount', async () => {
    for (const outcome of ['valid', 'signed-out', 'unmounted']) {
        let finish;
        const pending = new Promise(resolve => { finish = resolve; });
        let checked = null;
        let effect;
        const redirects = [];
        const { ExistingSessionGate } = load('app/_components/ExistingSessionGate.tsx', {
            'react/jsx-runtime': jsx,
            react: { useState: () => [checked, value => { checked = value; }], useEffect: fn => { effect = fn; } },
            'next/navigation': { useSearchParams: () => new URLSearchParams() },
            '../../lib/session-reuse': { sessionReuseTarget: () => ({ appId: 'root', target: '/account' }), hasReusableSession: () => pending },
        }, { window: { location: { replace: value => redirects.push(value) } } });
        const props = { children: 'sign-in form' };
        assert.notEqual(ExistingSessionGate(props), props.children);
        const cleanup = effect();
        if (outcome === 'unmounted') cleanup();
        finish(outcome !== 'signed-out');
        await Promise.resolve();
        if (outcome === 'valid') assert.deepEqual(redirects, ['/account']);
        else assert.deepEqual(redirects, []);
        if (outcome === 'signed-out') assert.equal(ExistingSessionGate(props), props.children);
        else assert.equal(checked, null);
    }
});
