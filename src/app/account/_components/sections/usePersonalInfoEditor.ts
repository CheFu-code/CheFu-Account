"use client";

import { useRef, useState, type FormEvent } from "react";
import type { AccountResponse } from "../account-types";
import type { PersonalInfoUpdate } from "../../../../lib/account-profile";
import { personalInfoChanges, personalValues, type PersonalDraft, type PersonalField } from "./personal-info-fields";

export function usePersonalInfoEditor(account: AccountResponse, onSave: (updates: PersonalInfoUpdate) => Promise<void>) {
    const [active, setActive] = useState<PersonalField | null>(null);
    const [draft, setDraft] = useState(() => personalValues(account));
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const locked = useRef(false);

    function start(field: PersonalField) {
        if (locked.current || active) return;
        setDraft(personalValues(account));
        setError("");
        setActive(field);
    }
    function cancel() {
        if (locked.current) return;
        setDraft(personalValues(account));
        setError("");
        setActive(null);
    }
    function change(key: keyof PersonalDraft, value: string) {
        if (locked.current) return;
        setDraft(current => ({ ...current, [key]: value }));
        setError("");
    }
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!active || locked.current) return;
        locked.current = true;
        setSaving(true);
        setError("");
        try {
            const changes = personalInfoChanges(active, draft, personalValues(account));
            if (Object.keys(changes).length) await onSave(changes);
            setActive(null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to save. Please try again.");
        } finally {
            locked.current = false;
            setSaving(false);
        }
    }
    return { active, draft, error, saving, start, cancel, change, submit };
}
