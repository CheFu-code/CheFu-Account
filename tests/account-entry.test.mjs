import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import * as icons from "lucide-react";

function load(file, dependencies, globals = {}) {
    const loaded = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: name => {
        assert.ok(name in dependencies, name); return dependencies[name];
    }, ...globals });
    return loaded.exports;
}
function hooks() {
    const cells = [], effects = [];
    let cursor = 0;
    const react = {
        useState(initial) {
            const index = cursor++;
            if (!(index in cells)) cells[index] = typeof initial === "function" ? initial() : initial;
            return [cells[index], value => { cells[index] = typeof value === "function" ? value(cells[index]) : value; }];
        },
        useRef(initial) { const index = cursor++; return cells[index] ??= { current: initial }; },
        useCallback: fn => fn,
        useEffect(effect, dependencies) {
            const index = cursor++;
            if (!cells[index] || dependencies.some((value, i) => !Object.is(cells[index].dependencies[i], value))) {
                cells[index]?.cleanup?.(); cells[index] = { dependencies };
                effects.push(() => { cells[index].cleanup = effect(); });
            }
        },
    };
    return { react, render(callback) { cursor = 0; const result = callback(); while (effects.length) effects.shift()(); return result; } };
}
function elements(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
}
const registerHref = "/register?app=shopyethu&returnTo=original-oauth-request&prompt=select_account";
const formProps = { mode: "login", appId: "shopyethu", appName: "ShopYethu", alternateHref: registerHref, selectAccount: true };
function entry() {
    const harness = hooks(), AccountAuthScreen = () => null, AccountChooser = () => null;
    const { LoginAccountEntry } = load("app/login/LoginAccountEntry.tsx", {
        react: harness.react, "react/jsx-runtime": jsxRuntime,
        "../_components/AccountAuthScreen": { AccountAuthScreen }, "./AccountChooser": { AccountChooser },
    });
    return { AccountAuthScreen, AccountChooser, render: props => harness.render(() => LoginAccountEntry({ ...formProps, ...props })) };
}
test("a browser without saved accounts opens the sign-in form and never offers an empty return-to-picker loop", () => {
    const harness = entry(); let redirects = 0;
    let view = harness.render({ onSelected: () => { redirects++; } });
    assert.equal(view.type, harness.AccountChooser);
    view.props.onAvailability(false); view = harness.render();
    assert.equal(view.type, harness.AccountAuthScreen);
    assert.equal(view.props.onReturnToPicker, undefined);
    assert.equal(view.props.alternateHref, registerHref); assert.equal(redirects, 0);
});
test("saved accounts retain explicit selection and allow signing into another account and returning", () => {
    const harness = entry(), cleared = [];
    const props = { setEmail: value => cleared.push(value), setPassword: value => cleared.push(value), setTrustDevice: value => cleared.push(value) };
    let view = harness.render(props);
    view.props.onAvailability(true); view.props.onAddAccount(); view = harness.render(props);
    assert.equal(view.type, harness.AccountAuthScreen); view.props.onReturnToPicker();
    assert.deepEqual(cleared, ["", "", false]);
    assert.equal(harness.render(props).type, harness.AccountChooser);
    assert.equal(harness.render(props).props.registerHref, registerHref);
});
test("ordinary sign-in opens the form without mounting a saved-account check", () => {
    const harness = entry(); const view = harness.render({ selectAccount: false });
    assert.equal(view.type, harness.AccountAuthScreen); assert.equal(view.props.onReturnToPicker, undefined);
});
for (const failure of [false, true]) test(`an ${failure ? "unavailable" : "empty"} account list falls back without selecting or redirecting`, async () => {
    const harness = hooks(), results = [];
    const { AccountChooser } = load("app/login/AccountChooser.tsx", {
        react: harness.react, "react/jsx-runtime": jsxRuntime, "next/link": { default: () => null },
        "../../lib/chefu-account": { listChefuAccountSessions: async () => { if (failure) throw new Error("Offline"); return []; } },
        "../../lib/saved-accounts": {}, "./AccountChooserSkeleton": { AccountChooserSkeleton: () => null },
        "../_components/SavedAccountRemoveButton": { SavedAccountAvatar: () => null, SavedAccountRemoveButton: () => null },
    }, { Error });
    const onAvailability = value => results.push(value);
    harness.render(() => AccountChooser({ ...formProps, onAvailability, onSelected: () => assert.fail("Must not redirect") }));
    await new Promise(setImmediate); assert.deepEqual(results, [false]);
});
test("the chooser and sign-in form both expose Create account with the complete registration link", () => {
    const harness = hooks(), Link = () => null;
    const { AccountChooser } = load("app/login/AccountChooser.tsx", {
        react: harness.react, "react/jsx-runtime": jsxRuntime, "next/link": { default: Link },
        "../../lib/chefu-account": { listChefuAccountSessions: async () => [] }, "../../lib/saved-accounts": {},
        "./AccountChooserSkeleton": { AccountChooserSkeleton: () => null },
        "../_components/SavedAccountRemoveButton": { SavedAccountAvatar: () => null, SavedAccountRemoveButton: () => null },
    });
    const chooser = harness.render(() => AccountChooser({ ...formProps, registerHref }));
    const { AccountAuthScreen } = load("app/_components/AccountAuthScreen.tsx", {
        react: { useState: initial => [initial, () => {}] }, "react/jsx-runtime": jsxRuntime, "lucide-react": icons,
        "next/link": { default: Link }, "../constants/auth": load("app/constants/auth.ts", {}), "../login/TrustedBrowserChoice": { TrustedBrowserChoice: () => null },
    });
    for (const tree of [chooser, AccountAuthScreen(formProps)]) {
        const create = elements(tree).find(node => node.type === Link && node.props.children === "Create account");
        assert.ok(create); assert.equal(create.props.href, registerHref);
    }
});
test("account checks share only concurrent reads and time out rather than trapping a new user", async () => {
    const reads = load("lib/auth-reads.ts", {}, { AbortController });
    let release, calls = 0, timeout;
    const api = load("lib/chefu-account.ts", { "./redirect-policy": {}, "./auth-reads": reads }, {
        process: { env: {} }, AbortController,
        setTimeout: callback => { timeout = callback; return 1; }, clearTimeout() {},
        fetch: (_url, init) => {
            calls++; assert.equal(init.credentials, "include"); assert.equal(init.cache, "no-store");
            return new Promise((resolve, reject) => { release = resolve; init.signal.addEventListener("abort", () => reject(new Error("Timed out")), { once: true }); });
        },
    });
    const first = api.listChefuAccountSessions("shopyethu"), second = api.listChefuAccountSessions("shopyethu");
    await new Promise(setImmediate); assert.equal(calls, 1);
    release({ ok: true, json: async () => ({ accounts: [] }) });
    assert.equal((await first).length, 0); await second;
    const next = api.listChefuAccountSessions("shopyethu");
    await new Promise(setImmediate); assert.equal(calls, 2); timeout();
    await assert.rejects(next, /Timed out/);
});
