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

test("LiftWise mobile and local web PKCE flows are accepted", () => {
  assert.equal(validateAuthRedirectParams(params()), null);
  assert.equal(validateAuthRedirectParams(params("liftwise-web", "http://localhost:8081/sso-callback")), null);
});

test("another client, callback, app, or tampered state is rejected", () => {
  for (const value of [params("nook-mobile", "nook://sso-callback"), params("liftwise-mobile", "liftwise://evil"), params("liftwise-web", "https://evil.example/sso-callback")]) {
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
