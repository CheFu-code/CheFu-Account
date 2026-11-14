"use client";

import { Loader2, Pencil } from "lucide-react";
import { useEffect, useRef, type ChangeEvent } from "react";
import { AccountButton } from "../AccountPrimitives";
import type { PersonalDraft, personalFields } from "./personal-info-fields";
import type { usePersonalInfoEditor } from "./usePersonalInfoEditor";
import styles from "./personal-info.module.css";

type Editor = ReturnType<typeof usePersonalInfoEditor>;

export function PersonalDetailRow({ field, values, editor, disabled }: {
    field: typeof personalFields[number];
    values: PersonalDraft;
    editor: Editor;
    disabled: boolean;
}) {
    const editing = editor.active === field.id;
    const form = useRef<HTMLFormElement>(null);
    const editButton = useRef<HTMLButtonElement>(null);
    const wasEditing = useRef(false);
    const labelId = `personal-${field.id}-label`;
    const helpId = `personal-${field.id}-help`;
    const errorId = `personal-${field.id}-error`;

    useEffect(() => {
        if (editing) form.current?.querySelector<HTMLElement>("input, textarea")?.focus();
        else if (wasEditing.current) editButton.current?.focus();
        wasEditing.current = editing;
    }, [editing]);

    const value = field.id === "name" ? `${values.firstName} ${values.lastName}`.trim() : values[field.id];
    function input(key: keyof PersonalDraft, label: string, autoComplete?: string) {
        const attributes = {
            className: styles.input, value: editor.draft[key],
            onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => editor.change(key, event.target.value),
            "aria-describedby": `${helpId}${editor.error ? ` ${errorId}` : ""}`,
            "aria-invalid": Boolean(editor.error),
        };
        return <label className={styles.field}>
            {label}
            {key === "bio" ? <textarea {...attributes} maxLength={280} /> : <input {...attributes}
                type={key === "website" ? "url" : "text"} autoComplete={autoComplete}
                required={key === "firstName" || key === "lastName" || key === "fullname"}
                maxLength={key === "website" || key === "location" ? 200 : undefined} />}
        </label>;
    }

    return <div className={styles.row}>
        <dt id={labelId}>{field.label}</dt>
        <dd>
            {editing ? <form ref={form} className={styles.form} aria-labelledby={labelId} aria-busy={editor.saving}
                onSubmit={event => void editor.submit(event)}
                onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); editor.cancel(); } }}>
                <fieldset disabled={editor.saving || disabled}>
                    {field.id === "name" ? <div className={styles.names}>
                        {input("firstName", "First name", "given-name")}
                        {input("lastName", "Last name", "family-name")}
                    </div> : input(field.id, field.label, field.id === "fullname" ? "name" : undefined)}
                    <p id={helpId} className={styles.muted}>{field.help}</p>
                    {editor.error && <p id={errorId} role="alert" className={styles.error}>{editor.error}</p>}
                    <div className={styles.actions}>
                        <AccountButton type="submit" variant="primary">
                            {editor.saving && <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" />}
                            {editor.saving ? "Saving…" : "Save"}
                        </AccountButton>
                        <AccountButton onClick={editor.cancel}>Cancel</AccountButton>
                    </div>
                </fieldset>
            </form> : <div className={styles.value}>
                <span className={styles.text}>{value || "Not set"}</span>
                <button ref={editButton} type="button" className="account-button account-button-tertiary"
                    aria-label={`Edit ${field.label.toLowerCase()}`} disabled={disabled || editor.active !== null}
                    onClick={() => editor.start(field.id)}>
                    <Pencil className="mr-1.5 size-3.5" aria-hidden="true" /> Edit
                </button>
            </div>}
        </dd>
    </div>;
}
