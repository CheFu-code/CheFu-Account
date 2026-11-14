"use client";

import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { patchAccountProfile, type AccountProfileUpdate, type PersonalInfoUpdate } from "../../../lib/account-profile";
import type { ChefuAppId } from "../../../lib/chefu-account";
import type { AccountResponse, PrivacyPreferences } from "./account-types";

export function useProfileSave({ account, appId, activeSection, privacy, onSaved, isDevPreview }: {
    account: AccountResponse | null;
    appId: ChefuAppId;
    activeSection: string;
    privacy: PrivacyPreferences;
    onSaved: (account: AccountResponse) => void;
    isDevPreview: boolean;
}) {
    const [isSaving, setIsSaving] = useState(false);
    const locked = useRef(false);

    async function persist(updates: AccountProfileUpdate) {
        if (!account) throw new Error("Sign in again before updating your account.");
        if (isDevPreview) throw new Error("Profile changes are unavailable in preview.");
        if (locked.current) throw new Error("Please wait for your current changes to finish saving.");
        locked.current = true;
        setIsSaving(true);
        try {
            onSaved(await patchAccountProfile(appId, account.user.uid, updates));
        } finally {
            locked.current = false;
            setIsSaving(false);
        }
    }

    async function savePersonalInfo(updates: PersonalInfoUpdate) {
        await persist(updates);
        toast.success("Account updated.");
    }

    async function saveProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!account || activeSection !== "privacy" || locked.current) return;
        const changes = Object.fromEntries(
            (Object.keys(privacy) as Array<keyof PrivacyPreferences>)
                .filter(key => privacy[key] !== account.profile.privacy[key])
                .map(key => [key, privacy[key]]),
        );
        if (!Object.keys(changes).length) {
            toast.info("There are no profile changes to save.");
            return;
        }
        try {
            await persist({ academyProfile: { privacy: changes } });
            toast.success("Privacy updated.");
        } catch (cause) {
            toast.error("Unable to update your account.", {
                description: cause instanceof Error ? cause.message : "Please try again.",
            });
        }
    }

    return { isSaving, saveProfile, savePersonalInfo };
}
