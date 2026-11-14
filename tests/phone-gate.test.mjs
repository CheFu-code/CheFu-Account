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
