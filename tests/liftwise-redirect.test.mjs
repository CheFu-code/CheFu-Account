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

test("newly registered apps use fresh server policies without weakening exact OAuth callback validation", () => {
  const policy = { id: "new-product", name: "New Product", origins: ["https://new.example.test"], clients: [{ id: "new-product-web", redirectUris: ["https://new.example.test/callback"], scopes: ["openid"] }] };
  const web = new URLSearchParams({ app: policy.id, returnTo: "https://new.example.test/settings" });
  assert.equal(validateAuthRedirectParams(web).reason, "invalid_app");
  assert.equal(validateAuthRedirectParams(web, policy), null);
  for (const target of ["https://new.example.test.evil.test/", "https://user@new.example.test/", "http://new.example.test/", "https://new.example.test/\\evil"]) {
    assert.equal(validateAuthRedirectParams(new URLSearchParams({ app: policy.id, returnTo: target }), policy).ok, false);
  }
  const oauth = params("new-product-web", "https://new.example.test/callback");
  oauth.set("app", policy.id);
  assert.equal(validateAuthRedirectParams(oauth, policy), null);
  for (const [key, value] of [["redirect_uri", "https://new.example.test/other"], ["client_id", "liftwise-web"], ["code_challenge_method", "plain"]]) {
    const invalid = new URLSearchParams(oauth);
    const authorize = new URL(invalid.get("returnTo"));
    authorize.searchParams.set(key, value); invalid.set("returnTo", authorize.toString());
    assert.equal(validateAuthRedirectParams(invalid, policy).ok, false);
  }
  loadedModule.exports.installRuntimePolicy(policy);
  assert.equal(loadedModule.exports.resolveChefuAppId(policy.id), policy.id);
  assert.equal(validateAuthRedirectParams(web), null);
  loadedModule.exports.installRuntimePolicy(null);
  assert.equal(validateAuthRedirectParams(web).reason, "invalid_app");
});

test("admin session sign-in and sign-out accept the deployed console host only for the admin app", () => {
  const { validateReturnToForApp } = loadedModule.exports;
  for (const origin of ["https://admin.chefu.co.za", "https://internal.chefu.co.za"]) {
    for (const path of ["/", "/?tab=users"]) {
      assert.equal(validateAuthRedirectParams(new URLSearchParams({ app: "admin", returnTo: `${origin}${path}` })), null);
    }
  }
  for (const target of ["https://admin.chefu.co.za.evil.example/", "https://admin-chefu.co.za/", "http://admin.chefu.co.za/", "https://admin.chefu.co.za@evil.example/"]) {
    assert.equal(validateReturnToForApp(target, "admin").ok, false, target);
  }
  assert.equal(validateReturnToForApp("https://admin.chefu.co.za/", "merchant").ok, false);
});

test("LiftWise mobile and deployed web PKCE flows are accepted", () => {
  assert.equal(validateAuthRedirectParams(params()), null);
  assert.equal(validateAuthRedirectParams(params("liftwise-mobile", "https://myaccount.chefu.co.za/app/liftwise/sso-callback")), null);
  assert.equal(validateAuthRedirectParams(params("liftwise-web", "https://liftwise.chefu.co.za/sso-callback")), null);
});

test("Cloudence mobile accepts only its exact S256 PKCE callback", () => {
  const mobile = params("cloudence-mobile", "cloudence://sso-callback");
  mobile.set("app", "cloudence");
  assert.equal(validateAuthRedirectParams(mobile), null);

  for (const [client, redirect] of [
    ["cloudence-web", "cloudence://sso-callback"],
    ["cloudence-mobile", "cloudenceandroid://sso-callback"],
    ["cloudence-mobile", "https://cloudence.chefu.co.za/auth/callback"],
  ]) {
    const invalid = params(client, redirect);
    invalid.set("app", "cloudence");
    assert.equal(validateAuthRedirectParams(invalid).ok, false);
  }

  const plain = params("cloudence-mobile", "cloudence://sso-callback");
  plain.set("app", "cloudence");
  const authorize = new URL(plain.get("returnTo"));
  authorize.searchParams.set("code_challenge_method", "plain");
  plain.set("returnTo", authorize.toString());
  assert.equal(validateAuthRedirectParams(plain).ok, false);
});

test("retired Flow app, origin and OAuth client cannot be used as sign-in return targets", () => {
  const { isKnownChefuAppParam, isChefuAppId, validateReturnToForApp } = loadedModule.exports;
  assert.equal(isKnownChefuAppParam("flow"), false);
  assert.equal(isChefuAppId("flow"), false);
  assert.equal(validateAuthRedirectParams(new URLSearchParams({ app: "flow", returnTo: "/account" })).reason, "invalid_app");
  for (const app of ["root", "academy", "quantum", "shopyethu"]) {
    assert.equal(validateReturnToForApp("https://flow.chefu.co.za/", app).ok, false);
    const oauth = params("flow-web", "https://flow.chefu.co.za/auth/callback");
    oauth.set("app", app);
    assert.equal(validateAuthRedirectParams(oauth).ok, false);
  }
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
