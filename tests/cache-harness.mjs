import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

export function load(file, dependencies = {}, globals = {}) {
    const loaded = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, { module: loaded, exports: loaded.exports,
        require: name => { assert.ok(name in dependencies, name); return dependencies[name]; }, AbortController, ...globals });
    return loaded.exports;
}

export function diskStorage() {
    const values = new Map(), versions = new Map();
    let global = 0;
    const version = account => `${global}:${versions.get(account) || 0}`;
    return {
        values,
        async read(account, path) { const key = JSON.stringify([account, path]); return { found: values.has(key), value: values.get(key), version: version(account) }; },
        async write(account, path, value, token) { if (version(account) === token) values.set(JSON.stringify([account, path]), value); },
        async invalidate(account, path) {
            if (!account) { global++; values.clear(); return; }
            versions.set(account, (versions.get(account) || 0) + 1);
            for (const key of values.keys()) {
                const [owner, name] = JSON.parse(key);
                if (owner === account && (!path || name === path)) values.delete(key);
            }
        },
    };
}

export function pageCacheFixture({ disk = diskStorage(), reads = load('lib/auth-reads.ts'), reload = false, events } = {}) {
    const memory = load('lib/read-cache.ts');
    const scoped = load('lib/account-cache.ts', { './read-cache': memory });
    let receive;
    const cache = load('lib/account-page-cache.ts', {
        './account-cache': scoped, './read-cache': memory,
        './persistent-cache': { IndexedDbCache: class { constructor() { return disk; } } },
        './auth-reads': reads,
        './cache-events': { publishCacheEvent: event => events?.(event), subscribeCacheEvents: listener => { receive = listener; } },
    }, { performance: { getEntriesByType: () => [{ type: reload ? 'reload' : 'navigate' }] } });
    return { cache, disk, reads, receive };
}
