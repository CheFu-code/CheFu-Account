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

async function chooserActions({ slot = 1, switching = async () => ({}), selected = async () => {}, removing = async () => {} } = {}) {
    const harness = hooks(), Link = () => null, RemoveButton = () => null;
    const accounts = [
        { slot, email: "selected@example.test", fullName: "Selected account", active: slot === null },
        { slot: 2, email: "other@example.test", fullName: "Other account", active: false },
    ];
    const calls = { switches: 0, selections: 0, removals: 0, adds: 0 };
    const { AccountChooser } = load("app/login/AccountChooser.tsx", {
        react: harness.react, "react/jsx-runtime": jsxRuntime, "next/link": { default: Link },
        "../../lib/chefu-account": {
            chefuAppLabel: () => "ShopYethu", listChefuAccountSessions: async () => accounts,
            switchChefuAccount: async value => { calls.switches++; return switching(value); },
        },
        "../../lib/saved-accounts": { removeSavedAccount: async value => { calls.removals++; return removing(value); } },
        "./AccountChooserSkeleton": { AccountChooserSkeleton: () => null },
        "../_components/SavedAccountRemoveButton": { SavedAccountAvatar: () => null, SavedAccountRemoveButton: RemoveButton },
    }, { Error });
    const props = { ...formProps, registerHref, onAddAccount: () => { calls.adds++; },
        onSelected: async (...args) => { calls.selections++; return selected(...args); } };
    const render = () => harness.render(() => AccountChooser(props));
    render(); await new Promise(setImmediate);
    const accountButton = (email = accounts[0].email) => elements(render()).find(node => node.type === "button" &&
        elements(node).some(child => child.type === "span" && child.props.children === email));
    const text = () => elements(render()).filter(node => node.type === "p").map(node => node.props.children).filter(value => typeof value === "string").join(" ");
    return { accounts, calls, render, accountButton, text, Link, RemoveButton };
}

test("selecting a saved account shows a spinner and continuing state until navigation, with duplicate taps locked", async () => {
    let finishSwitch, finishContinuation;
    const state = await chooserActions({ switching: () => new Promise(resolve => { finishSwitch = resolve; }),
        selected: () => new Promise(resolve => { finishContinuation = resolve; }) });
    const button = state.accountButton(); const selection = button.props.onClick(); button.props.onClick();
    assert.equal(state.calls.switches, 1); assert.equal(state.calls.selections, 0);
    assert.match(state.text(), /Signing you in/);
    assert.equal(state.accountButton().props["aria-busy"], true);
    assert.ok(elements(state.accountButton()).some(node => node.props.className?.includes("motion-safe:animate-spin")));
    assert.equal(state.accountButton(state.accounts[1].email).props["aria-busy"], false);
    assert.ok(elements(state.render()).filter(node => node.type === "button").every(node => node.props.disabled));
    assert.ok(elements(state.render()).filter(node => node.type === state.RemoveButton).every(node => node.props.disabled));
    const status = elements(state.render()).find(node => node.props.role === "status");
    assert.equal(status.props["aria-live"], "polite");
    const create = elements(state.render()).find(node => node.type === state.Link);
    let prevented = false; create.props.onClick({ preventDefault() { prevented = true; } }); assert.equal(prevented, true);
    finishSwitch({ phoneVerificationRequired: false }); await new Promise(setImmediate);
    assert.equal(state.calls.selections, 1); assert.match(state.text(), /Continuing to ShopYethu/);
    assert.equal(state.accountButton().props.disabled, true, 'loading must cover the asynchronous continuation');
    finishContinuation(); await selection;
    assert.equal(state.accountButton().props.disabled, true, 'keep feedback visible while the browser redirects');
});

test("active-account session checks show progress without issuing a switch request", async () => {
    let finish;
    const state = await chooserActions({ slot: null, selected: () => new Promise(resolve => { finish = resolve; }) });
    const selected = state.accountButton().props.onClick();
    assert.equal(state.calls.switches, 0); assert.equal(state.calls.selections, 1);
    assert.match(state.text(), /Continuing to ShopYethu/); assert.equal(state.accountButton().props["aria-busy"], true);
    finish(); await selected;
});

test("switch and continuation failures clear progress, show the error and allow another attempt", async () => {
    for (const stage of ["switching", "selected"]) {
        let fail = true;
        const state = await chooserActions({ [stage]: async () => { if (fail) throw new Error('Please retry your sign-in.'); } });
        state.accountButton().props.onClick(); await new Promise(setImmediate);
        assert.equal(state.accountButton().props.disabled, false);
        assert.equal(state.accountButton().props["aria-busy"], false);
        assert.equal(elements(state.render()).find(node => node.props.role === "alert").props.children, 'Please retry your sign-in.');
        assert.doesNotMatch(state.text(), /Signing you in|Continuing to/);
        fail = false; state.accountButton().props.onClick(); await new Promise(setImmediate); assert.equal(state.calls.switches, 2);
    }
});

test("removing an account uses its own loading message, never announces sign-in and unlocks after completion", async () => {
    let finish;
    const state = await chooserActions({ removing: () => new Promise(resolve => { finish = resolve; }) });
    const remove = elements(state.render()).find(node => node.type === state.RemoveButton);
    remove.props.onRemove(state.accounts[0]);
    assert.match(state.text(), /Removing saved account/); assert.doesNotMatch(state.text(), /Signing you in|Continuing to/);
    assert.equal(state.accountButton().props.disabled, true);
    finish(); await new Promise(setImmediate);
    assert.equal(state.accountButton(state.accounts[1].email).props.disabled, false);
    assert.equal(state.calls.switches, 0); assert.equal(state.calls.removals, 1);
});
