import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import * as icons from "lucide-react";

function load(file, dependencies = {}, globals = {}) {
    const loaded = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { module: loaded, exports: loaded.exports, AbortController, URL, URLSearchParams, setTimeout, clearTimeout,
        require: name => { assert.ok(name in dependencies, name); return dependencies[name]; }, ...globals });
    return loaded.exports;
}
function elements(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
}
const gate = load("lib/phone-gate.ts");
test("required phone modal offers sign-out rather than skip, and Escape cannot dismiss it", () => {
    let skipped = 0, completed = 0, initial;
    const { PhoneVerificationDialog } = load("app/register/PhoneVerificationDialog.tsx", {
        react: { useRef: () => ({ current: null }), useEffect() {}, useId: () => "field" },
        "react/jsx-runtime": jsxRuntime, "lucide-react": icons,
        "./usePhoneVerification": { usePhoneVerification: (_app, phone) => {
            initial = phone; return { phase: "number", phone, code: "", canLeave: () => true, changePhone() {} };
        } },
    });
    const tree = PhoneVerificationDialog({ appId: "shopyethu", initialPhone: "+27821234567", required: true,
        onSkip: () => { skipped++; }, onComplete: () => { completed++; } });
    assert.equal(initial, "+27821234567");
    let cancelled = false;
    tree.props.onCancel({ preventDefault: () => { cancelled = true; } });
    assert.equal(cancelled, true); assert.equal(skipped, 0); assert.equal(completed, 0);
    assert.equal(elements(tree).some(node => node.props?.children === "Skip for now"), false);
    elements(tree).find(node => node.type === "button" && node.props.children === "Sign out").props.onClick();
    assert.equal(skipped, 1);
});
test("phone-gate sign-out requests current-account logout and preserves the account chooser", () => {
    const destinations = [];
    function PhoneVerificationDialog() {}
    const { AccountPhoneGate } = load("app/account/_components/AccountPhoneGate.tsx", {
        "next/navigation": { useRouter: () => ({ replace: value => destinations.push(value) }) },
        "react/jsx-runtime": jsxRuntime,
        "../../../lib/chefu-account": {},
        "../../register/PhoneVerificationDialog": { PhoneVerificationDialog },
    });
    const tree = AccountPhoneGate({ phone: "+27821234567", appId: "shopyethu" });
    elements(tree).find(node => node.type === PhoneVerificationDialog).props.onSkip();
    const logout = new URL(destinations[0], "https://myaccount.chefu.co.za");
    assert.equal(logout.pathname, "/logout");
    assert.equal(logout.searchParams.get("current"), "true");
    assert.equal(logout.searchParams.get("returnTo"), "/account");
});
test("direct verification sign-out also requests current-account logout", async () => {
    const destinations = [], effects = [], state = [];
    let cursor = 0;
    function PhoneVerificationDialog() {}
    const { VerifyPhoneClient } = load("app/verify-phone/VerifyPhoneClient.tsx", {
        react: {
            useState(initial) {
                const index = cursor++;
                if (!(index in state)) state[index] = initial;
                return [state[index], value => { state[index] = value; }];
            },
            useEffect: effect => effects.push(effect),
        },
        "react/jsx-runtime": jsxRuntime,
        "next/navigation": {
            useRouter: () => ({ replace: value => destinations.push(value) }),
            useSearchParams: () => new URLSearchParams("app=shopyethu&returnTo=%2Faccount"),
        },
        "../../lib/account-read": {
            readCurrentAccount: async () => ({
                status: 200,
                data: { profile: { phone: "+27821234567", phoneVerificationRequired: true } },
            }),
        },
        "../../lib/chefu-account": { resolveChefuApp: value => value, safeReturnTo: value => value },
        "../login/login-helpers": { completeAuthRedirect() {} },
        "../register/PhoneVerificationDialog": { PhoneVerificationDialog },
    });

    VerifyPhoneClient();
    effects[0]();
    await new Promise(setImmediate);
    cursor = 0;
    const tree = VerifyPhoneClient();
    elements(tree).find(node => node.type === PhoneVerificationDialog).props.onSkip();
    const logout = new URL(destinations[0], "https://myaccount.chefu.co.za");
    assert.equal(logout.pathname, "/logout");
    assert.equal(logout.searchParams.get("current"), "true");
    assert.equal(logout.searchParams.get("returnTo"), "/account");
});
test("current-account logout redirects to the chooser without invoking global sign-out", async () => {
    const effects = [], calls = [], destinations = [];
    const { LogoutClient } = load("app/logout/LogoutClient.tsx", {
        react: {
            useCallback: callback => callback,
            useEffect: effect => effects.push(effect),
            useState: initial => [initial, () => {}],
        },
        "react/jsx-runtime": jsxRuntime,
        "next/navigation": {
            useSearchParams: () => new URLSearchParams("app=shopyethu&returnTo=%2Faccount&current=true"),
        },
        "../../lib/chefu-account": {
            chefuAppLabel: () => "ShopYethu",
            clearCurrentChefuAccountSession: async () => { calls.push("current"); },
            clearChefuAccountSession: async () => { calls.push("global"); },
            resolveChefuApp: value => value,
            safeReturnTo: value => value,
        },
    }, { window: { location: { replace: value => destinations.push(value) } } });

    LogoutClient();
    effects[0]();
    await new Promise(setImmediate);
    assert.deepEqual(calls, ["current"]);
    const login = new URL(destinations[0], "https://myaccount.chefu.co.za");
    assert.equal(login.pathname, "/login");
    assert.equal(login.searchParams.get("prompt"), "select_account");
    assert.equal(login.searchParams.get("returnTo"), "/account");
});
test("sign-in continuation uses returned profile state without any extra request", async () => {
    const redirects = [];
    const { usePhoneContinuation } = load("app/login/usePhoneContinuation.ts", {
        react: { useRef: () => ({ current: false }) },
        "next/navigation": { useRouter: () => ({ replace: value => redirects.push(value) }) },
        "../../lib/chefu-account": { apiUrl: value => value }, "../../lib/phone-gate": gate,
        "./login-helpers": { completeAuthRedirect: (target, replace) => replace(target) },
    }, { fetch: () => assert.fail("Fresh login/switch must not issue a second status request") });
    const flow = usePhoneContinuation("shopyethu", "https://api.chefu.co.za/oauth/authorize?state=original");
    flow.remember({ phoneVerificationRequired: true }); flow.continue();
    const url = new URL(redirects.pop(), "https://myaccount.chefu.co.za");
    assert.equal(url.pathname, "/verify-phone");
    assert.equal(url.searchParams.get("returnTo"), "https://api.chefu.co.za/oauth/authorize?state=original");
    flow.remember({ phoneVerificationRequired: false }); flow.continue();
    assert.equal(redirects.pop(), "https://api.chefu.co.za/oauth/authorize?state=original");
    await flow.selected({ phoneVerificationRequired: true }); assert.match(redirects.pop(), /^\/verify-phone\?/);
});
test("session reuse exposes a pending phone through its existing session response", async () => {
    let requests = 0, prompted = 0;
    const reads = load("lib/auth-reads.ts");
    const api = load("lib/session-reuse.ts", {
        "./chefu-account": { apiUrl: value => value }, "./redirect-policy": {}, "./auth-reads": reads,
    }, { fetch: async () => { requests++; return Response.json({ authenticated: true, phoneVerificationRequired: true }); } });
    assert.equal(await api.hasReusableSession("shopyethu", () => { prompted++; }), false);
    assert.equal(requests, 1); assert.equal(prompted, 1);
});
test("a direct verification screen reuses account loading and cannot auto-send an SMS", async () => {
    const effects = [], redirects = [];
    let loaded = 0;
    const { VerifyPhoneClient } = load("app/verify-phone/VerifyPhoneClient.tsx", {
        react: { useState: value => [value, () => {}], useEffect: effect => effects.push(effect) },
        "react/jsx-runtime": jsxRuntime,
        "next/navigation": { useRouter: () => ({ replace: target => redirects.push(target) }), useSearchParams: () => new URLSearchParams("app=shopyethu&returnTo=%2Faccount") },
        "../../lib/account-read": { readCurrentAccount: async () => { loaded++; return { status: 200, data: { profile: { phone: "+27821234567", phoneVerificationRequired: false } } }; } },
        "../../lib/chefu-account": { resolveChefuApp: value => value, safeReturnTo: value => value },
        "../login/login-helpers": { completeAuthRedirect: (target, replace) => replace(target) },
        "../register/PhoneVerificationDialog": { PhoneVerificationDialog: () => null },
    });
    VerifyPhoneClient(); effects[0](); await new Promise(setImmediate);
    assert.equal(loaded, 1); assert.deepEqual(redirects, ["/account"]);
});
