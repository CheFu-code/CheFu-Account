import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";

function load(file, dependencies, globals = {}) {
    const testModule = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { module: testModule, exports: testModule.exports, require: name => {
        assert.ok(name in dependencies, name); return dependencies[name];
    }, ...globals });
    return testModule.exports;
}
const phone = "+27821234567";
const verified = { verified: true, phone, verifiedAt: "2026-11-14T12:00:00.000Z" };
const challenge = { verified: false, phone, resendAfterSeconds: 30, expiresInSeconds: 600 };

function apiWith(fetch) {
    return load("lib/phone-verification.ts", {
        "./chefu-account": { apiUrl: path => `https://api.example.test${path}` },
        "./auth-reads": { authMutationFetch: fetch },
    });
}
test("phone requests use the central cookie, app context and normalized challenge number", async () => {
    const calls = [];
    const api = apiWith(async (url, init) => {
        calls.push({ url, init }); return Response.json(calls.length === 1 ? challenge : verified);
    });
    const signal = new AbortController().signal;
    const sent = await api.sendPhoneCode("082 123 4567", "shopyethu", signal);
    const result = await api.checkPhoneCode(sent.phone, "123456", "shopyethu", signal);
    assert.equal(result.verified, true);
    assert.equal(calls[0].url, "https://api.example.test/phone-verification/send");
    for (const { init } of calls) {
        assert.equal(init.credentials, "include"); assert.equal(init.cache, "no-store");
        assert.equal(init.signal, signal); assert.equal(init.headers["x-chefu-app"], "shopyethu");
    }
    assert.deepEqual(JSON.parse(calls[1].init.body), { phone, code: "123456" });
});
test("HTTP success alone, a mismatched phone or malformed approval cannot show verification success", async () => {
    for (const data of [{ verified: false }, { ...verified, phone: "+27831234567" }, { ...verified, verifiedAt: "invalid" }, null]) {
        const api = apiWith(async () => Response.json(data));
        await assert.rejects(api.checkPhoneCode(phone, "123456", "root"), cause => cause.status === 0);
    }
});
test("rate limits retain retry and remaining-attempt metadata without relying on CORS headers", async () => {
    const api = apiWith(async () => Response.json({ message: "Please wait.", retryAfterSeconds: 59, attemptsRemaining: 0 }, { status: 429 }));
    await assert.rejects(api.checkPhoneCode(phone, "123456", "root"), cause => {
        assert.equal(cause.retryAfterSeconds, 59); assert.equal(cause.attemptsRemaining, 0); return true;
    });
});

function hooks() {
    const cells = [], effects = [], timers = new Map();
    let cursor = 0, clock = 1000000, timerId = 0;
    const react = {
        useState(initial) {
            const index = cursor++;
            if (!(index in cells)) cells[index] = typeof initial === "function" ? initial() : initial;
            return [cells[index], value => { cells[index] = typeof value === "function" ? value(cells[index]) : value; }];
        },
        useRef(initial) { const index = cursor++; return cells[index] ??= { current: initial }; },
        useEffect(effect, dependencies) {
            const index = cursor++;
            if (!cells[index] || dependencies.some((value, i) => !Object.is(cells[index].dependencies[i], value))) {
                cells[index]?.cleanup?.();
                cells[index] = { dependencies };
                effects.push(() => { cells[index].cleanup = effect(); });
            }
        },
        useMemo: factory => factory(),
    };
    return { react, globals: {
        Date: class extends Date { static now() { return clock; } },
        AbortController,
        window: { setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; }, clearTimeout: id => timers.delete(id) },
    }, render(callback) { cursor = 0; const result = callback(); while (effects.length) effects.shift()(); return result; },
    unmount() { for (const cell of cells) cell?.cleanup?.(); },
    advance(ms) { clock += ms; for (const [id, item] of [...timers]) if (item.delay <= ms) { timers.delete(id); item.callback(); } },
    };
}
function editor(api) {
    const harness = hooks();
    const { usePhoneVerification } = load("app/register/usePhoneVerification.ts", {
        react: harness.react, "../../lib/phone-verification": api,
    }, harness.globals);
    return { ...harness, render: () => harness.render(() => usePhoneVerification("root")) };
}
const errors = apiWith(() => {});
test("opening or editing sends nothing; double clicks share one send and one verification", async () => {
    let sends = 0, checks = 0, release;
    const waiting = new Promise(resolve => { release = resolve; });
    const harness = editor({ ...errors, sendPhoneCode: async () => { sends++; await waiting; return challenge; }, checkPhoneCode: async (...args) => {
        checks++; assert.equal(args[0], phone); assert.equal(args[1], "123456"); return verified;
    } });
    let view = harness.render();
    view.changePhone("082 123 4567"); view = harness.render();
    assert.equal(sends, 0);
    const first = view.send(), second = view.send();
    assert.equal(sends, 1); release(); await Promise.all([first, second]);
    view = harness.render(); assert.equal(view.phase, "code"); assert.equal(view.resendIn, 30);
    await view.send(); assert.equal(sends, 1);
    view.changeCode("123456"); view = harness.render();
    await Promise.all([view.verify(), view.verify()]);
    view = harness.render(); assert.equal(checks, 1); assert.equal(view.phase, "verified"); assert.equal(view.code, "");
    harness.unmount();
});
test("exhausted checks block another attempt and cannot be reset by changing the number", async () => {
    let checks = 0, sends = 0;
    const harness = editor({ ...errors, sendPhoneCode: async () => { sends++; return challenge; }, checkPhoneCode: async () => {
        checks++; throw new errors.PhoneVerificationError("Wrong code.", 400, 0, 0);
    } });
    let view = harness.render(); view.changePhone(phone); view = harness.render(); await view.send();
    view = harness.render(); view.changeCode("000000"); view = harness.render(); await view.verify();
    view = harness.render(); assert.equal(view.attemptsRemaining, 0); assert.equal(view.resendIn, 600);
    await view.verify(); assert.equal(checks, 1);
    view.editPhone(); view = harness.render(); view.changePhone("083 123 4567"); view = harness.render();
    await view.send(); assert.equal(sends, 1); assert.equal(view.resendIn, 600);
    harness.unmount();
});
test("an uncertain send permits an arriving code without automatically buying another SMS", async () => {
    let sends = 0;
    const harness = editor({ ...errors, sendPhoneCode: async () => { sends++; throw new errors.PhoneVerificationError("Send unknown.", 0, 30); }, checkPhoneCode: async () => verified });
    let view = harness.render(); view.changePhone("082 123 4567"); view = harness.render(); await view.send();
    view = harness.render(); assert.equal(view.phase, "code"); assert.equal(view.target, phone); assert.equal(view.uncertainSend, true);
    await view.send(); assert.equal(sends, 1);
    view.changeCode("123456"); view = harness.render(); await view.verify();
    assert.equal(harness.render().phase, "verified"); harness.unmount();
});
test("expiry uses elapsed time and leaving aborts the outstanding browser request", async () => {
    let lastSignal, sends = 0;
    const harness = editor({ ...errors, sendPhoneCode: async (_phone, _app, signal) => {
        lastSignal = signal;
        if (++sends === 1) return challenge;
        return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("Cancelled")), { once: true }));
    } });
    let view = harness.render(); view.changePhone(phone); view = harness.render(); await view.send();
    view = harness.render(); harness.advance(601000); view = harness.render();
    assert.equal(view.expiresIn, 0); assert.equal(view.resendIn, 0);
    const pending = view.send();
    assert.equal(harness.render().canLeave(), false);
    harness.unmount(); await pending; assert.equal(lastSignal.aborted, true);
});

function elements(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
}
for (const choice of ["onSkip", "onComplete"]) test(`signup ${choice} continues to passkeys and preserves the original return destination`, async () => {
    const harness = hooks(), redirected = [];
    const AccountAuthScreen = () => null, EmailVerificationDialog = () => null, PhoneVerificationDialog = () => null, PasskeyOfferDialog = () => null;
    const { RegisterClient } = load("app/register/RegisterClient.tsx", {
        react: harness.react, "react/jsx-runtime": jsxRuntime,
        "next/navigation": { useRouter: () => ({ replace: target => redirected.push(target) }), useSearchParams: () => new URLSearchParams("app=shopyethu&returnTo=%2Foauth%2Fauthorize%3Fstate%3Doriginal") },
        sonner: { toast: { success: () => {}, error: () => {} } },
        "../_components/AccountAuthScreen": { AccountAuthScreen },
        "./EmailVerificationDialog": { EmailVerificationDialog }, "./PhoneVerificationDialog": { PhoneVerificationDialog }, "./PasskeyOfferDialog": { PasskeyOfferDialog },
        "../../lib/chefu-account": {
            resolveChefuApp: value => value, chefuAppLabel: () => "ShopYethu", safeReturnTo: value => value, preserveAuthParams: path => path,
            sendEmailVerificationCode: async () => ({ cooldownSeconds: 30, resendsRemaining: 3 }), verifyEmailVerificationCode: async () => {},
            EmailVerificationCodeError: class extends Error {},
        },
    }, { URLSearchParams });
    const render = () => elements(harness.render(RegisterClient));
    let nodes = render(), form = nodes.find(node => node.type === AccountAuthScreen);
    assert.equal(nodes.some(node => node.type === PhoneVerificationDialog), false);
    form.props.setFirstName("Test"); form.props.setLastName("User"); form.props.setEmail("user@example.test"); form.props.setPassword("test-password");
    form = render().find(node => node.type === AccountAuthScreen); await form.props.onSubmit({ preventDefault() {} });
    nodes = render(); assert.equal(nodes.some(node => node.type === PhoneVerificationDialog), false);
    await nodes.find(node => node.type === EmailVerificationDialog).props.onSubmit("123456");
    nodes = render(); assert.equal(nodes.some(node => node.type === PasskeyOfferDialog), false);
    nodes.find(node => node.type === PhoneVerificationDialog).props[choice]();
    nodes = render(); assert.equal(nodes.some(node => node.type === PhoneVerificationDialog), false);
    nodes.find(node => node.type === PasskeyOfferDialog).props.onSkip();
    assert.deepEqual(redirected, ["/oauth/authorize?state=original"]);
});
