import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";

function load(file, dependencies = {}) {
    const loaded = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { module: loaded, exports: loaded.exports, URL, Error, require: name => {
        assert.ok(name in dependencies, name); return dependencies[name];
    } });
    return loaded.exports;
}
function hooks() {
    const cells = [];
    let cursor = 0;
    return {
        react: {
            useRef: value => cells[cursor++] ??= { current: value },
            useState(value) {
                const index = cursor++;
                if (!(index in cells)) cells[index] = typeof value === "function" ? value() : value;
                return [cells[index], next => { cells[index] = typeof next === "function" ? next(cells[index]) : next; }];
            },
        },
        render(callback) { cursor = 0; return callback(); },
    };
}
function elements(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
}
const account = { user: { uid: "buyer", email: "buyer@example.test" }, profile: {
    firstName: "Alice", lastName: "Example", fullname: "Alice Example", bio: "Original bio",
    website: "https://example.test", location: "Cape Town", phone: "+27821234567", privacy: { showCountry: true },
} };
const fields = load("app/account/_components/sections/personal-info-fields.ts");
function editor(onSave) {
    const harness = hooks();
    const { usePersonalInfoEditor } = load("app/account/_components/sections/usePersonalInfoEditor.ts", {
        react: harness.react, "./personal-info-fields": fields,
    });
    return () => harness.render(() => usePersonalInfoEditor(account, onSave));
}
const event = { preventDefault() {} };

test("Cancel discards a private draft and cannot leak it into a later field save", async () => {
    const updates = [];
    const render = editor(async value => updates.push(JSON.parse(JSON.stringify(value))));
    render().start("bio"); render().change("bio", "Cancelled bio");
    assert.equal(account.profile.bio, "Original bio");
    render().cancel();
    assert.equal(render().active, null);
    assert.equal(render().draft.bio, "Original bio");
    render().start("location"); render().change("location", "Johannesburg");
    await render().submit(event);
    assert.deepEqual(updates, [{ location: "Johannesburg" }]);
    assert.equal(render().active, null);
});

test("unchanged values and invalid input never start a profile mutation", async () => {
    let writes = 0;
    const render = editor(async () => { writes++; });
    render().start("bio"); await render().submit(event);
    assert.equal(writes, 0);
    render().start("website"); render().change("website", "javascript:alert(1)");
    await render().submit(event);
    assert.match(render().error, /https/);
    assert.equal(render().active, "website");
    render().cancel(); render().start("name"); render().change("lastName", "");
    await render().submit(event);
    assert.match(render().error, /first and last/);
    assert.equal(writes, 0);
});

test("save errors retain the draft for retry, and duplicate submits or Cancel cannot interrupt a save", async () => {
    let writes = 0, release;
    const pending = new Promise(resolve => { release = resolve; });
    const render = editor(async () => { if (++writes === 1) throw new Error("Connection lost"); await pending; });
    render().start("bio"); render().change("bio", "New bio");
    await render().submit(event);
    assert.equal(render().draft.bio, "New bio");
    assert.equal(render().active, "bio");
    assert.equal(render().error, "Connection lost");
    const save = render().submit(event);
    await render().submit(event);
    render().cancel(); render().start("location"); render().change("bio", "Another value");
    assert.equal(writes, 2);
    assert.equal(render().active, "bio");
    assert.equal(render().draft.bio, "New bio");
    release(); await save;
    assert.equal(render().active, null);
});

test("names save as a pair while other edits contain only their own changed field", () => {
    const original = fields.personalValues(account);
    assert.equal(JSON.stringify(fields.personalInfoChanges("name", { ...original, firstName: "  Alice   Anne " }, original)),
        JSON.stringify({ firstName: "Alice Anne", lastName: "Example" }));
    assert.equal(JSON.stringify(fields.personalInfoChanges("website", { ...original, bio: "Unrelated", website: "" }, original)),
        JSON.stringify({ website: "" }));
});

test("profile saves use one scoped PATCH and its returned account without a follow-up read", async () => {
    const requests = [];
    const api = load("lib/account-profile.ts", {
        "./chefu-account": { apiUrl: path => `https://api.example.test${path}` },
        "./auth-reads": { authMutationFetch: async (url, options) => {
            requests.push({ url, options });
            return { ok: true, json: async () => ({ ...account, profile: { ...account.profile, bio: "Saved bio" } }) };
        } },
    });
    const result = await api.patchAccountProfile("shopyethu", "buyer", { bio: "Saved bio" });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].options.method, "PATCH");
    assert.equal(requests[0].options.credentials, "include");
    assert.equal(requests[0].options.headers["x-chefu-app"], "shopyethu");
    assert.deepEqual(JSON.parse(requests[0].options.body), { bio: "Saved bio" });
    assert.equal(result.profile.bio, "Saved bio");
    await assert.rejects(api.patchAccountProfile("shopyethu", "another-user", { bio: "Saved bio" }), /could not confirm/);
});

test("Overview's Change photo opens the uploader directly and preserves the saved-photo callback", () => {
    const harness = hooks();
    const Dialog = () => null;
    const Button = () => null;
    const { AccountHomePanel } = load("app/account/_components/AccountHomePanel.tsx", {
        react: harness.react, "react/jsx-runtime": jsx, "lucide-react": icons,
        "./AccountPrimitives": { AccountButton: Button, FieldRow: () => null, AccountPanel: () => null, SectionHeader: () => null },
        "./sections/ProfilePhotoDialog": { ProfilePhotoDialog: Dialog },
    });
    let saved;
    const props = { account, name: "Alice", initials: "AE", onProfilePictureSuccess: value => { saved = value; } };
    const render = () => harness.render(() => AccountHomePanel(props));
    elements(render()).find(node => node.type === Button && node.props.children === "Change photo").props.onClick();
    const dialog = elements(render()).find(node => node.type === Dialog);
    assert.ok(dialog);
    dialog.props.onSaved("https://images.example.test/photo.png");
    assert.equal(saved, "https://images.example.test/photo.png");
    dialog.props.onClose();
    assert.equal(elements(render()).some(node => node.type === Dialog), false);
});

test("personal information has independent forms rather than nesting field forms in the settings form", () => {
    const PersonalInfoSection = () => null;
    const { AccountSettingsForm } = load("app/account/_components/AccountSettingsForm.tsx", {
        "react/jsx-runtime": jsx, "./AdditionalSections": {}, "./sections/DeveloperSection": {},
        "./sections/PersonalInfoSection": { PersonalInfoSection }, "./sections/PrivacySection": {}, "./sections/SecuritySection": {},
    });
    assert.equal(AccountSettingsForm({ activeSection: "personal-info", account }).type, PersonalInfoSection);
    assert.equal(AccountSettingsForm({ activeSection: "privacy" }).type, "form");
});

test("phone number is an editable contact field with no verification dialog", () => {
    const original = fields.personalValues(account);
    const draft = { ...original, phone: "083 123 4567" };
    assert.ok(fields.personalFields.some(field => field.id === "phone"));
    assert.equal(fields.personalInfoChanges("phone", draft, original).phone, "083 123 4567");
});
