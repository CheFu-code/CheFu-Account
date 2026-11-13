import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const loadedModule = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(new URL("../src/lib/redirect-policy.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, { module: loadedModule, exports: loadedModule.exports, URL, URLSearchParams });
const { validateAuthRedirectParams } = loadedModule.exports;

function params(client = "liftwise-mobile", redirect = "liftwise://sso-callback") {
  const url = new URL("https://api.chefu.co.za/oauth/authorize");
  url.search = new URLSearchParams({
    client_id: client, redirect_uri: redirect, response_type: "code",
    code_challenge: "a".repeat(43), code_challenge_method: "S256",
    state: "state-that-is-long-enough", nonce: "nonce-that-is-long-enough", scope: "openid profile email",
  }).toString();
  return new URLSearchParams({ app: "liftwise", returnTo: url.toString() });
}

test("LiftWise mobile and deployed web PKCE flows are accepted", () => {
  assert.equal(validateAuthRedirectParams(params()), null);
  assert.equal(validateAuthRedirectParams(params("liftwise-mobile", "https://myaccount.chefu.co.za/app/liftwise/sso-callback")), null);
  assert.equal(validateAuthRedirectParams(params("liftwise-web", "https://liftwise.chefu.co.za/sso-callback")), null);
});

test("ShopYethu web uses central sessions; only its registered mobile PKCE callback is accepted", () => {
  for (const path of ["/", "/login"]) {
    assert.equal(validateAuthRedirectParams(new URLSearchParams({ app: "shopyethu", returnTo: `https://shopyethu-admin.chefu.co.za${path}` })), null);
  }
  for (const returnTo of ["http://localhost:3000/login", "https://shopyethu.chefu.co.za/", "https://evil.example/"]) {
    assert.equal(validateAuthRedirectParams(new URLSearchParams({ app: "shopyethu", returnTo })).ok, false);
  }
  const oauth = params("shopyethu-web", "https://shopyethu-admin.chefu.co.za/auth/callback");
  oauth.set("app", "shopyethu");
  assert.equal(validateAuthRedirectParams(oauth).ok, false);
  const mobile = params("shopyethu-mobile", "shopyethu://sso-callback");
  mobile.set("app", "shopyethu");
  assert.equal(validateAuthRedirectParams(mobile), null);
  const untrusted = params("shopyethu-mobile", "shopyethuandroid://sso-callback");
  untrusted.set("app", "shopyethu");
  assert.equal(validateAuthRedirectParams(untrusted).ok, false);
});

test("another client, callback, app, or tampered state is rejected", () => {
  for (const value of [params("nook-mobile", "nook://sso-callback"), params("liftwise-mobile", "https://evil.example/app/liftwise/sso-callback"), params("liftwise-web", "https://evil.example/sso-callback")]) {
    assert.equal(validateAuthRedirectParams(value).ok, false);
  }
  const value = params();
  value.set("app", "nook");
  assert.equal(validateAuthRedirectParams(value).ok, false);
  const invalid = params();
  const authorize = new URL(invalid.get("returnTo"));
  authorize.searchParams.set("state", "short");
  invalid.set("returnTo", authorize.toString());
  assert.equal(validateAuthRedirectParams(invalid).ok, false);
});

test("relative redirect normalization and authority bypasses are rejected", () => {
  const { validateReturnToForApp } = loadedModule.exports;
  for (const target of [
    "//evil.example", "/\\\\evil.example", "/%2f%2fevil.example",
    "/%252f%252fevil.example", "/a/../account", "/%2e%2e/account",
    "/a/%2e%2e/account", "/a/%5cadmin", "/a%00b",
  ]) {
    assert.equal(validateReturnToForApp(target, "root").ok, false, target);
  }
  for (const target of ["/account", "/account?tab=security", "/account?next=https%3A%2F%2Fchefu.co.za"]) {
    assert.equal(validateReturnToForApp(target, "root").ok, true, target);
  }
});
