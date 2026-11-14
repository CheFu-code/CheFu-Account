import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as icons from "lucide-react";

function load(file, dependencies, globals = {}) {
    const testModule = { exports: {} };
    const code = ts.transpileModule(
        fs.readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"),
        {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2022,
                jsx: ts.JsxEmit.ReactJSX,
            },
        },
    ).outputText;
    vm.runInNewContext(code, {
        module: testModule,
        exports: testModule.exports,
        require: (name) => {
            assert.ok(name in dependencies, name);
            return dependencies[name];
        },
        ...globals,
    });
    return testModule.exports;
}

function elements(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
}

test("add-account form offers a non-submit return action and disables it during authentication", () => {
    const { AccountAuthScreen } = load("app/_components/AccountAuthScreen.tsx", {
        react: { useState: value => [value, () => {}] },
        "react/jsx-runtime": jsxRuntime,
        "lucide-react": icons,
        "next/link": { default: () => null },
        "../constants/auth": load("app/constants/auth.ts", {}),
        "../login/TrustedBrowserChoice": { TrustedBrowserChoice: () => null },
    });
    let returned = 0;
    const props = { mode: "login", appName: "LiftWise", email: "", password: "", isSubmitting: false, onReturnToPicker: () => { returned++; } };
    const back = extra => elements(AccountAuthScreen({ ...props, ...extra })).find(node => node.type === "button" && node.props.children === "Back to saved accounts");
    assert.equal(back().props.type, "button");
    back().props.onClick();
    assert.equal(returned, 1);
    assert.equal(back({ isSubmitting: true }).props.disabled, true);
    assert.equal(back({ isPasskeySubmitting: true }).props.disabled, true);
    assert.equal(back({ onReturnToPicker: undefined }), undefined);
});

test("expired saved account switching keeps the picker usable and permits retry", async () => {
    const account = { slot: 0, email: "alice@example.test", active: false };
    const cells = [];
    let cursor = 0;
    const effects = [];
    const fakeReact = {
        useState(initial) {
            const index = cursor++;
            if (!(index in cells)) cells[index] = initial;
            return [cells[index], value => { cells[index] = typeof value === "function" ? value(cells[index]) : value; }];
        },
        useRef(initial) {
            const index = cursor++;
            return cells[index] ??= { current: initial };
        },
        useEffect(effect) {
            const index = cursor++;
            if (!cells[index]) { cells[index] = true; effects.push(effect); }
        },
    };
    let fail = true;
    let switched = 0;
    let selected = 0;
    const { AccountChooser } = load("app/login/AccountChooser.tsx", {
        react: fakeReact, "react/jsx-runtime": jsxRuntime,
        "next/link": { default: () => null },
        "../../lib/chefu-account": {
            chefuAppLabel: () => "LiftWise",
            listChefuAccountSessions: async () => [account],
            switchChefuAccount: async () => { switched++; if (fail) throw new Error("Saved sign-in expired. Add this account again."); },
        },
        "../../lib/saved-accounts": {},
        "./AccountChooserSkeleton": { AccountChooserSkeleton: () => null },
        "../_components/SavedAccountRemoveButton": { SavedAccountAvatar: () => null, SavedAccountRemoveButton: () => null },
    }, { Error });
    const render = () => { cursor = 0; return AccountChooser({ appId: "liftwise", onAddAccount() {}, onSelected: () => { selected++; } }); };
    const button = tree => elements(tree).find(node => node.type === "button");
    render();
    effects.forEach(effect => effect());
    await new Promise(resolve => setImmediate(resolve));
    button(render()).props.onClick();
    button(render()).props.onClick();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(switched, 1, "duplicate clicks cannot start a second switch");
    assert.equal(selected, 0, "failed switches must not start the OAuth redirect");
    assert.equal(button(render()).props.disabled, false);
    assert.ok(elements(render()).some(node => node.props?.role === "alert" && /expired/.test(node.props.children)));
    fail = false;
    button(render()).props.onClick();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(selected, 1);
});

test("sign-out controls use one label and explain browser removal and current-account session revocation", () => {
    const { AccountFrame } = load("app/account/_components/AccountFrame.tsx", {
        react: { useState: value => [value === false ? true : value, () => {}], useEffect() {}, useRef: () => ({ current: null }) },
        "react/jsx-runtime": jsxRuntime,
        "lucide-react": icons,
        "next/link": { default: () => null },
        "./account-data": { navItems: [] },
        "./Toggle": { Toggle: () => null },
        "../../_components/SavedAccountRemoveButton": { SavedAccountRemoveButton: () => null },
        "./useSavedAccountRemoval": { useSavedAccountRemoval: () => ({ isRemoving: false, removeAccount() {} }) },
    });
    let signedOut = 0;
    const nodes = elements(AccountFrame({ accounts: [], onSignOut: () => { signedOut++; }, isSigningOut: false, isSwitchingAccount: false }));
    const buttons = nodes.filter(node => node.type === "button");
    assert.equal(buttons.some(node => elements(node.props.children).length === 0 && node.props.children === "Sign out"), false);
    const confirm = buttons.find(node => node.props.className === "account-confirmation-confirm");
    assert.equal(confirm.props.children, "Sign out of all accounts");
    const description = nodes.find(node => node.props?.id === "sign-out-confirmation-description").props.children;
    assert.match(description, /current account.*other sessions/);
    assert.match(description, /Other saved accounts stay signed in/);
    confirm.props.onClick();
    assert.equal(signedOut, 1);
});

test("saved account removal uses a credentialed mutation for only the requested slot and reports failures", async () => {
    const requests = [];
    let ok = true;
    const api = load("lib/saved-accounts.ts", {
        "./chefu-account": {
            apiUrl: (path) => `https://api.example.test${path}`,
        },
        "./auth-reads": {
            authMutationFetch: async (...args) => {
                requests.push(args);
                return {
                    ok,
                    json: async () => ({ message: "Please sign in again." }),
                };
            },
        },
    });
    await api.removeSavedAccount(2);
    assert.equal(requests[0][0], "https://api.example.test/auth/accounts/2");
    assert.equal(requests[0][1].method, "DELETE");
    assert.equal(requests[0][1].credentials, "include");
    for (const slot of [-1, 8, null, 1.5])
        await assert.rejects(
            api.removeSavedAccount(slot),
            /Invalid saved account/,
        );
    assert.equal(requests.length, 1);
    ok = false;
    await assert.rejects(api.removeSavedAccount(3), /Please sign in again/);
});

test("current account sign-out uses the non-global session endpoint", async () => {
    const requests = [];
    const api = load("lib/chefu-account.ts", {
        "./redirect-policy": {},
        "./auth-reads": {
            authMutationFetch: async (...args) => {
                requests.push(args);
                return { ok: true, json: async () => ({ ok: true, revoked: false }) };
            },
        },
    }, { process: { env: {} } });

    await api.clearCurrentChefuAccountSession();
    assert.equal(requests.length, 1);
    assert.equal(requests[0][0], "https://api.chefu.co.za/auth/session?current=true");
    assert.equal(requests[0][1].method, "DELETE");
    assert.equal(requests[0][1].credentials, "include");
});

test("saved-account removal waits for confirmation and cancellation leaves the account untouched", () => {
    let confirming = false;
    let removed = 0;
    const { SavedAccountRemoveButton, SavedAccountRemovalDialog } = load("app/_components/SavedAccountRemoveButton.tsx", {
        react: { useState: () => [confirming, value => { confirming = value; }] },
        "react/jsx-runtime": jsxRuntime,
    });
    const account = { slot: 0, email: "alice@example.test", active: false };
    const render = disabled => SavedAccountRemoveButton({ account, disabled, onRemove: selected => {
        assert.equal(selected, account);
        removed++;
    } });
    const dialog = tree => elements(tree).find(node => node.type === SavedAccountRemovalDialog);
    assert.equal(dialog(render(false)), undefined);
    elements(render(false)).find(node => node.type === "button").props.onClick();
    assert.equal(removed, 0);
    dialog(render(false)).props.onCancel();
    assert.equal(confirming, false);
    assert.equal(removed, 0);
    elements(render(false)).find(node => node.type === "button").props.onClick();
    dialog(render(true)).props.onConfirm();
    assert.equal(removed, 0, "a newly disabled action cannot remove an account");
    dialog(render(false)).props.onConfirm();
    assert.equal(removed, 1);
    assert.equal(confirming, false);
});

test("removal modal opens as a native modal and supports Escape and backdrop cancellation", () => {
    let effect;
    let opened = 0;
    let closed = 0;
    let cancelled = 0;
    const { SavedAccountRemovalDialog } = load("app/_components/SavedAccountRemoveButton.tsx", {
        react: {
            useRef: () => ({ current: { showModal: () => { opened++; }, close: () => { closed++; } } }),
            useId: (() => { let id = 0; return () => `dialog-${id++}`; })(),
            useEffect: callback => { effect = callback; },
        },
        "react/jsx-runtime": jsxRuntime,
    });
    const tree = SavedAccountRemovalDialog({ account: { email: "alice@example.test" }, disabled: false,
        onCancel: () => { cancelled++; }, onConfirm() {} });
    const cleanup = effect();
    assert.equal(opened, 1);
    assert.equal(tree.type, "dialog");
    let prevented = false;
    tree.props.onCancel({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(cancelled, 1);
    const backdrop = {};
    tree.props.onClick({ target: backdrop, currentTarget: backdrop });
    assert.equal(cancelled, 2);
    tree.props.onClick({ target: {}, currentTarget: backdrop });
    assert.equal(cancelled, 2, "clicking modal content must not dismiss it");
    const buttons = elements(tree).filter(node => node.type === "button");
    assert.equal(buttons[0].props.children, "Cancel", "native modal focuses the safe action first");
    cleanup();
    assert.equal(closed, 1);
});

test("remove action is available only for saved accounts and includes an accessible browser-specific label", () => {
    const { SavedAccountRemoveButton, SavedAccountAvatar } = load(
        "app/_components/SavedAccountRemoveButton.tsx",
        {
            react: React,
            "react/jsx-runtime": jsxRuntime,
        },
    );
    const account = {
        slot: 0,
        email: "alice@example.test",
        fullName: "Alice Smith",
        active: false,
    };
    const render = (props) =>
        renderToStaticMarkup(
            React.createElement(SavedAccountRemoveButton, {
                account,
                disabled: false,
                onRemove() {},
                ...props,
            }),
        );
    assert.match(
        render(),
        /Remove saved account alice@example.test from this browser/,
    );
    assert.match(render({ disabled: true }), /disabled/);
    assert.equal(render({ account: { ...account, active: true } }), "");
    assert.equal(render({ account: { ...account, slot: null } }), "");
    assert.match(
        renderToStaticMarkup(
            React.createElement(SavedAccountAvatar, { account }),
        ),
        /AS/,
    );
});
