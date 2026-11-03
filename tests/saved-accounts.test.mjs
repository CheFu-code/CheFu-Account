import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

function load(file, dependencies) {
    const module = { exports: {} };
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
        module,
        exports: module.exports,
        require: (name) => {
            assert.ok(name in dependencies, name);
            return dependencies[name];
        },
    });
    return module.exports;
}

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
