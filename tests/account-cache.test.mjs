import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pageCacheFixture, load } from './cache-harness.mjs';

const account = uid => ({ status: 200, data: { user: { uid, email: `${uid}@example.test` }, profile: { fullname: uid } } });
const activate = (cache, uid) => cache.readAccountPage('root', async () => account(uid));

test('expired sessions return the original status without restoring or serving cached pages', async () => {
    const { cache } = pageCacheFixture();
    const result = await cache.readAccountPage('root', async () => ({ status: 401, data: null }));
    assert.equal(result.status, 401);
    assert.equal(cache.accountPageIdentity(), null);
    await assert.rejects(cache.readAccountPageData('/activity', async () => 'unsafe'), /Validate/);
});

test('reopened tabs validate identity before reading persisted pages; browser refresh discards persisted reads', async () => {
    const first = pageCacheFixture(); let calls = 0;
    await assert.rejects(first.cache.readAccountPageData('/activity', async () => []), /Validate/);
    await activate(first.cache, 'alice');
    await first.cache.readAccountPageData('/activity', async () => { calls++; return ['event']; });
    const reopened = pageCacheFixture({ disk: first.disk });
    await assert.rejects(reopened.cache.readAccountPageData('/activity', async () => []), /Validate/);
    await activate(reopened.cache, 'alice');
    assert.equal((await reopened.cache.readAccountPageData('/activity', async () => { calls++; return []; }))[0], 'event');
    assert.equal(calls, 1);
    const refreshed = pageCacheFixture({ disk: first.disk, reload: true });
    await activate(refreshed.cache, 'alice');
    await refreshed.cache.readAccountPageData('/activity', async () => { calls++; return ['fresh']; });
    assert.equal(calls, 2);
});

test('account switching and cross-tab session invalidation cannot expose another account data', async () => {
    const { cache, reads, receive } = pageCacheFixture();
    await activate(cache, 'alice');
    await cache.readAccountPageData('/security', async () => 'alice-data');
    reads.invalidateAuthReads();
    assert.equal(cache.accountPageIdentity(), null);
    await activate(cache, 'bob');
    assert.equal(await cache.readAccountPageData('/security', async () => 'bob-data'), 'bob-data');
    receive({ kind: 'session', account: 'bob' });
    assert.equal(cache.accountPageIdentity(), null);
    await assert.rejects(cache.readAccountPageData('/security', async () => 'unsafe'), /Validate/);
});

test('mutations invalidate settled reads and fence late responses, even when the server fails', async () => {
    let finishWrite;
    const reads = load('lib/auth-reads.ts', {}, { fetch: () => new Promise(resolve => { finishWrite = resolve; }) });
    const { cache, disk } = pageCacheFixture({ reads });
    await activate(cache, 'alice');
    let finishRead;
    const old = cache.readAccountPageData('/activity', () => new Promise(resolve => { finishRead = resolve; }));
    const rejected = assert.rejects(old);
    await new Promise(setImmediate);
    const mutation = reads.authMutationFetch('/auth/security/totp/disable', { method: 'POST' });
    const fresh = cache.readAccountPageData('/activity', async () => ['fresh']);
    finishRead(['stale']); await rejected;
    finishWrite({ ok: false }); await mutation;
    assert.equal((await fresh)[0], 'fresh');
    assert.equal(JSON.stringify([...disk.values.values()]).includes('stale'), false);
});

test('profile update responses seed memory without a follow-up read; session decisions are never persisted', async () => {
    const { cache, reads, disk } = pageCacheFixture();
    await activate(cache, 'alice');
    reads.invalidateAuthReads(false);
    const updated = account('alice').data;
    updated.profile.fullname = 'Updated';
    await cache.rememberAccountPage('root', updated);
    const result = await cache.readAccountPage('root', () => assert.fail('Unexpected profile refetch'));
    assert.equal(result.data.profile.fullname, 'Updated');
    assert.equal(disk.values.size, 0);
});

test('unavailable IndexedDB falls back to memory; targeted refresh reloads only the requested page', async () => {
    const storage = load('lib/persistent-cache.ts');
    const { cache } = pageCacheFixture({ disk: new storage.IndexedDbCache() });
    await activate(cache, 'alice');
    let calls = 0;
    await cache.readAccountPageData('/security', async () => ++calls);
    await cache.readAccountPageData('/activity', async () => ++calls);
    await cache.invalidateAccountPage('/security');
    assert.equal(await cache.readAccountPageData('/activity', async () => ++calls), 2);
    assert.equal(await cache.readAccountPageData('/security', async () => ++calls), 3);
});
