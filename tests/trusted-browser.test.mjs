import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
function load(file, dependencies, globals = {}) {
  const loaded = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, AbortController, require: (name) => {
    assert.ok(name in dependencies, name); return dependencies[name];
  }, ...globals });
  return loaded.exports;
}

test('the trust checkbox is hidden while checking and for trusted browsers; untrusted browsers can opt in', () => {
  let status = { checking: true, trusted: false };
  const { TrustedBrowserChoice } = load('app/login/TrustedBrowserChoice.tsx', {
    react: { useEffect() {} }, 'react/jsx-runtime': jsx,
    './useTrustedBrowser': { useTrustedBrowser: () => status },
  });
  const props = { email: 'alice@example.test', checked: false, onChange() {}, disabled: false };
  assert.equal(TrustedBrowserChoice(props), null);
  status = { checking: false, trusted: true };
  assert.equal(TrustedBrowserChoice(props), null);
  status = { checking: false, trusted: false };
  const markup = renderToStaticMarkup(TrustedBrowserChoice(props));
  assert.match(markup, /Trust this browser for 90 days/);
  assert.match(markup, /type="checkbox"/);
  assert.match(renderToStaticMarkup(TrustedBrowserChoice({ ...props, disabled: true })), /disabled/);
});

test('stale status responses cannot hide the checkbox for another account; failed checks allow opting in', async () => {
  let state = null;
  let oldDependencies;
  let cleanup;
  const timers = new Map(); let sequence = 0;
  const pending = [];
  const budget = { next: 0, blockedUntil: 0, windowEnds: 0, count: 0, cache: new Map() };
  let now = 10_000;
  class Clock extends Date { static now() { return now; } }
  const { useTrustedBrowser } = load('app/login/useTrustedBrowser.ts', {
    react: {
      useState: () => [state, value => { state = value; }],
      useRef: () => ({ current: budget }),
      useEffect: (effect, dependencies) => {
        if (!oldDependencies || dependencies.some((value, index) => value !== oldDependencies[index])) {
          cleanup?.(); oldDependencies = dependencies; cleanup = effect();
        }
      },
    },
    '@/lib/chefu-account': { apiUrl: path => `https://api.example${path}` },
  }, {
    Date: Clock,
    window: { addEventListener() {}, removeEventListener() {} },
    setTimeout: (fn, ms) => { const id = ++sequence; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
    fetch: (url, options) => new Promise((resolve, reject) => pending.push({ url, options, resolve, reject })),
  });
  const runDebounce = () => {
    for (const [id, timer] of timers) if (timer.ms < 5000) { timers.delete(id); now += timer.ms; timer.fn(); }
  };
  const flush = () => new Promise(setImmediate);
  assert.equal(useTrustedBrowser('alice@example.test').checking, true);
  runDebounce();
  assert.equal(pending[0].options.credentials, 'include');
  assert.equal(useTrustedBrowser('bob@example.test').checking, true);
  assert.equal(pending[0].options.signal.aborted, true);
  runDebounce();
  pending[1].resolve({ ok: true, json: async () => ({ trusted: false }) });
  await flush();
  assert.equal(useTrustedBrowser('bob@example.test').trusted, false);
  pending[0].resolve({ ok: true, json: async () => ({ trusted: true }) });
  await flush();
  assert.equal(useTrustedBrowser('bob@example.test').trusted, false);
  useTrustedBrowser('carol@example.test'); runDebounce();
  pending[2].reject(new Error('offline'));
  await flush();
  const result = useTrustedBrowser('carol@example.test');
  assert.equal(result.checking, false);
  assert.equal(result.trusted, false);
  cleanup?.();
});

function limitedHook() {
  let state = null, dependencies, cleanup, focus;
  let now = 10_000, sequence = 0;
  const timers = new Map(), requests = [];
  const budget = { next: 0, blockedUntil: 0, windowEnds: 0, count: 0, cache: new Map() };
  class Clock extends Date { static now() { return now; } }
  let response = { ok: true, status: 200, json: async () => ({ trusted: true }) };
  const { useTrustedBrowser } = load('app/login/useTrustedBrowser.ts', {
    react: {
      useState: () => [state, value => { state = value; }],
      useRef: () => ({ current: budget }),
      useEffect: (effect, next) => {
        if (!dependencies || next.some((value, index) => value !== dependencies[index])) {
          cleanup?.(); dependencies = next; cleanup = effect();
        }
      },
    },
    '@/lib/chefu-account': { apiUrl: path => `https://api.example${path}` },
  }, {
    Date: Clock,
    window: { addEventListener: (_name, fn) => { focus = fn; }, removeEventListener() {} },
    setTimeout: (fn, ms) => { const id = ++sequence; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
    fetch: async (_url, options) => { requests.push(JSON.parse(options.body)); return response; },
  });
  return {
    render: useTrustedBrowser, requests, budget,
    focus: () => focus?.(),
    advance: ms => { now += ms; },
    response: next => { response = next; },
    stop: () => cleanup?.(),
    tick: async () => {
      const next = [...timers].find(([, timer]) => timer.ms < 5000);
      if (next) { timers.delete(next[0]); now += next[1].ms; next[1].fn(); }
      await new Promise(setImmediate);
    },
  };
}

test('fresh cache survives repeated focus and email changes cannot exceed the client request budget', async () => {
  const hook = limitedHook();
  hook.render('alice@example.test'); await hook.tick();
  assert.equal(hook.render('alice@example.test').trusted, true);
  for (let index = 0; index < 20; index++) hook.focus();
  assert.equal(hook.requests.length, 1, 'focus reuses the fresh result');
  for (let index = 0; index < 9; index++) {
    hook.render(`other-${index}@example.test`); await hook.tick();
  }
  assert.equal(hook.requests.length, 6, 'new emails do not reset the six-request window');
  assert.equal(hook.render('other-8@example.test').checking, false);
  hook.advance(60_001);
  hook.render('new-window@example.test'); await hook.tick();
  assert.equal(hook.requests.length, 7);
  hook.stop();
});

test('HTTP 429 backs off across different emails without blocking the sign-in form', async () => {
  const hook = limitedHook();
  hook.response({ ok: false, status: 429, json: async () => ({ retryAfterSeconds: 60 }) });
  hook.render('alice@example.test'); await hook.tick();
  hook.render('bob@example.test'); await hook.tick();
  assert.equal(hook.requests.length, 1);
  assert.equal(hook.render('bob@example.test').checking, false);
  assert.equal(hook.render('bob@example.test').trusted, false);
  hook.advance(60_001);
  hook.response({ ok: true, status: 200, json: async () => ({ trusted: false }) });
  hook.render('carol@example.test'); await hook.tick();
  assert.equal(hook.requests.length, 2);
  hook.stop();
});
