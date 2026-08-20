"use client";

import { DeveloperSection } from "./sections/DeveloperSection";
import { PasskeySection } from "./sections/PasskeySection";
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { PrivacySection } from "./sections/PrivacySection";
import { ProfileSection } from "./sections/ProfileSection";
import { SecuritySection } from "./sections/SecuritySection";
import type { AccountSettingsFormProps } from "./account-form-types";

export function AccountSettingsForm(props: AccountSettingsFormProps) {
    return (
        <form id="account-settings-form" onSubmit={props.onSubmit} className="space-y-5">
            {props.activeSection === "profile" ? <ProfileSection
                displayName={props.name || props.account.user.displayName || ""}
                email={props.account.user.email}
                profilePicture={props.account.profile.profilePicture}
                setName={props.setName}
            /> : null}
            {props.activeSection === "personal-info" ? (
                <PersonalInfoSection {...props} />
            ) : null}
            {props.activeSection === "security" ? <SecuritySection {...props} /> : null}
            {props.activeSection === "passkeys" ? <PasskeySection /> : null}
            {props.activeSection === "privacy" ? <PrivacySection {...props} /> : null}

            {props.activeSection === "developer" ? <DeveloperSection {...props} /> : null}
        </form>
    );
}
