"use client";

import { IdCard } from "lucide-react";
import { LockedInfo, SaveButton, SectionCard, TextField } from "../AccountControls";
import type { AccountSettingsFormProps } from "../account-form-types";
import type { AccountProfile } from "../account-types";

export function PersonalInfoSection({
    account,
    bio,
    isSaving,
    language,
    name,
    setBio,
    setLanguage,
    setName,
}: AccountSettingsFormProps) {
    return (
        <SectionCard
            icon={IdCard}
            title="Personal info"
            description="Control the profile details that CheFu apps use."
            action={<SaveButton isSaving={isSaving} label="Save profile" />}
        >
            <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Display name" value={name} onChange={setName} />
                <LockedInfo
                    label="Email"
                    value={account.user.email}
                    description="Your account email is used as your CheFu identity and cannot be changed here."
                />
                <TextField
                    label="Bio"
                    value={bio}
                    onChange={setBio}
                    placeholder="Short profile description"
                    wide
                />
                <TextField
                    label="Language"
                    value={language}
                    onChange={setLanguage}
                    placeholder="en"
                />
                <LockedInfo
                    label="Detected country"
                    value={detectedCountryLabel(account.profile)}
                    description={detectedCountryDescription(account.profile)}
                />
                {account.profile.country || account.profile.countryCode ? (
                    <LockedInfo
                        label="Existing Academy country"
                        value={legacyCountryLabel(account.profile)}
                        description="Kept only for compatibility. New country checks use the server-detected country."
                    />
                ) : null}
            </div>
        </SectionCard>
    );
}

function detectedCountryLabel(profile: AccountProfile) {
    return profile.detectedCountryCode?.trim().toUpperCase() || "Not detected yet";
}

function detectedCountryDescription(profile: AccountProfile) {
    const source = profile.detectedCountrySource?.trim();

    if (!profile.detectedCountryCode) {
        return "Sign in through the live site so the server can detect this from trusted request headers.";
    }

    return `Detected by the server${source ? ` through ${source}` : ""}. Users cannot edit this value.`;
}

function legacyCountryLabel(profile: AccountProfile) {
    return [profile.country, profile.countryCode].filter(Boolean).join(" / ");
}
