"use client";

import { IdCard } from "lucide-react";
import { LockedInfo, SaveButton, SectionCard, TextField } from "../AccountControls";
import type { AccountSettingsFormProps } from "../account-form-types";
import type { AccountProfile } from "../account-types";

export function PersonalInfoSection({
    account,
    isSaving,
    name,
    setName,
}: AccountSettingsFormProps) {
    return (
        <SectionCard
            icon={IdCard}
            title="Personal info"
            description="Control the profile details that CHEFU apps use."
            action={<SaveButton isSaving={isSaving} label="Save profile" />}
        >
            <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Display name" value={name} onChange={setName} />
                <LockedInfo
                    label="Email"
                    value={account.user.email}
                    description="Your account email is used as your CHEFU identity and cannot be changed here."
                />
                <LockedInfo
                    label="Detected country"
                    value={detectedCountryLabel(account.profile)}
                />
            </div>
        </SectionCard>
    );
}

function detectedCountryLabel(profile: AccountProfile) {
    return profile.detectedCountryCode?.trim().toUpperCase() || "Not detected yet";
}
