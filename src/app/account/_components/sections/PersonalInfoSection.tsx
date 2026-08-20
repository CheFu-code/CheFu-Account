"use client";

import { IdCard } from "lucide-react";
import { LockedInfo, SaveButton, SectionCard, TextField } from "../AccountControls";
import { ProfilePictureUpload } from "./ProfilePictureUpload";
import type { AccountSettingsFormProps } from "../account-form-types";
import type { AccountProfile } from "../account-types";

export function PersonalInfoSection({
    account,
    isSaving,
    name,
    onProfilePictureSuccess,
    setName,
}: AccountSettingsFormProps) {
    return (
        <SectionCard
            icon={IdCard}
            title="Personal info"
            description="Manage the profile data and permissions shared across all your apps."
            action={<SaveButton isSaving={isSaving} label="Save profile" />}
        >
            <div className="space-y-6">
                <ProfilePictureUpload
                    currentImageUrl={account.profile.profilePicture}
                    userName={name || account.user.displayName || account.user.email}
                    onUploadSuccess={onProfilePictureSuccess}
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <TextField label="Display name" value={name} onChange={setName} />
                    <LockedInfo
                        label="Email"
                        value={account.user.email}
                        description="Your email is used as your account identity and cannot be changed."
                    />
                    <LockedInfo
                        label="Detected country"
                        value={detectedCountryLabel(account.profile)}
                    />
                </div>
            </div>
        </SectionCard>
    );
}

function detectedCountryLabel(profile: AccountProfile) {
    return profile.detectedCountryCode?.trim().toUpperCase() || "Not detected yet";
}

