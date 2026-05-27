"use client";

import { AcademySection } from "./sections/AcademySection";
import { DeveloperSection } from "./sections/DeveloperSection";
import { LinkedAppsSection } from "./sections/LinkedAppsSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { PrivacySection } from "./sections/PrivacySection";
import { SecuritySection } from "./sections/SecuritySection";
import type { AccountSettingsFormProps } from "./account-form-types";

export function AccountSettingsForm(props: AccountSettingsFormProps) {
    return (
        <form id="account-settings-form" onSubmit={props.onSubmit} className="space-y-5">
            {props.activeSection === "personal-info" ? (
                <PersonalInfoSection {...props} />
            ) : null}
            {props.activeSection === "security" ? <SecuritySection {...props} /> : null}
            {props.activeSection === "linked-apps" ? (
                <LinkedAppsSection {...props} />
            ) : null}
            {props.activeSection === "privacy" ? <PrivacySection {...props} /> : null}
            {props.activeSection === "academy" ? <AcademySection {...props} /> : null}
            {props.activeSection === "notifications" ? (
                <NotificationsSection {...props} />
            ) : null}
            {props.activeSection === "developer" ? <DeveloperSection {...props} /> : null}
        </form>
    );
}
