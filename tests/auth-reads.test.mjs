import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}, globals = {}) {
    const loaded = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, { module: loaded, exports: loaded.exports,
        require: name => { assert.ok(name in dependencies, name); return dependencies[name]; }, AbortController, ...globals });
    return loaded.exports;
}
function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

test('concurrent profile reads parse one response; settled reads, other apps and errors are never cached', async () => {
    const reads = load('lib/auth-reads.ts');
    let requests = 0;
    let parsed = 0;
    let ok = true;
    const release = deferred();
    const { readCurrentAccount } = load('lib/account-read.ts', {
        './chefu-account': { apiUrl: path => path }, './auth-reads': reads,
    }, { fetch: async (_url, options) => {
        requests++;
        assert.equal(options.credentials, 'include');
        assert.equal(options.cache, 'no-store');
        await release.promise;
        return { ok, status: ok ? 200 : 503, json: async () => { parsed++; return { user: { uid: 'alice' } }; } };
    } });
    const first = readCurrentAccount('root');
    const second = readCurrentAccount('root');
    assert.equal(first, second);
    const anotherApp = readCurrentAccount('admin');
    await Promise.resolve();
    assert.equal(requests, 2);
    release.resolve();
    assert.equal((await first).data.user.uid, 'alice');
    await Promise.all([second, anotherApp]);
    assert.equal(parsed, 2, 'one parsed response per shared request, no consumed Response bodies');
    await readCurrentAccount('root');
    assert.equal(requests, 3, 'settled profiles are not cached');
    ok = false;
    await assert.rejects(readCurrentAccount('root'));
    ok = true;
    await readCurrentAccount('root');
    assert.equal(requests, 5, 'failed reads do not poison retries');
});

test('sign-out/profile mutations invalidate old reads and reads started before updated cookies arrive', async () => {
    for (const fails of [false, true]) {
        const write = deferred();
        const reads = load('lib/auth-reads.ts', {}, { fetch: async () => {
            await write.promise;
            if (fails) throw new Error('offline');
            return { ok: true };
        } });
        const firstRead = deferred();
        const before = reads.shareAuthRead('account:root', () => firstRead.promise);
        const staleBefore = assert.rejects(before, reads.SupersededAuthReadError);
        const mutation = reads.authMutationFetch('/auth/session', { method: 'DELETE' });
        const duringRead = deferred();
        const during = reads.shareAuthRead('account:root', () => duringRead.promise);
        const staleDuring = assert.rejects(during, reads.SupersededAuthReadError);
        const mutationResult = fails ? assert.rejects(mutation, /offline/) : mutation;
        write.resolve();
        await mutationResult;
        const after = await reads.shareAuthRead('account:root', async () => ({ uid: 'bob' }));
        assert.equal(after.uid, 'bob');
        firstRead.resolve({ uid: 'alice' });
        duringRead.resolve({ uid: 'alice' });
        await Promise.all([staleBefore, staleDuring]);
        assert.equal(await reads.shareAuthRead('account:root', async () => 'fresh'), 'fresh');
    }
});

test('account hook remounts share one read; an unmounted effect cannot hydrate or redirect', async () => {
    const reads = load('lib/auth-reads.ts');
    let requests = 0;
    const release = deferred();
    const accountRead = load('lib/account-read.ts', {
        './chefu-account': { apiUrl: path => path }, './auth-reads': reads,
    }, { fetch: async () => {
        requests++; await release.promise;
        return { ok: true, status: 200, json: async () => ({ user: { uid: 'alice' } }) };
    } });
    let effect;
    const hydrated = [];
    const hook = load('app/account/_components/useAccountLoad.ts', {
        react: { useEffect: fn => { effect = fn; }, useRef: value => ({ current: value }), useState: () => [true, () => {}] },
        'next/navigation': { useRouter: () => ({ replace: () => assert.fail('unexpected redirect') }) },
        sonner: { toast: { error: () => assert.fail('unexpected toast') } },
        '../../../lib/account-read': accountRead, '../../../lib/auth-reads': reads,
    });
    hook.useAccountLoad('root', data => hydrated.push(data), () => '/account');
    const cleanup = effect();
    cleanup();
    hook.useAccountLoad('root', data => hydrated.push(data), () => '/account');
    effect();
    await Promise.resolve();
    assert.equal(requests, 1);
    release.resolve();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(hydrated.length, 1);
    assert.equal(hydrated[0].user.uid, 'alice');
});

test('auth invalidation aborts obsolete shared requests', async () => {
    const reads = load('lib/auth-reads.ts');
    let signal;
    const pending = reads.shareAuthRead('account:root', async received => {
        signal = received;
        return new Promise((_resolve, reject) => received.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
    });
    const rejected = assert.rejects(pending, reads.SupersededAuthReadError);
    await Promise.resolve();
    reads.invalidateAuthReads();
    assert.equal(signal.aborted, true);
    await rejected;
});
