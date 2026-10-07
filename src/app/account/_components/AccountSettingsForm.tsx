"use client";

import {
    ActivitySection,
    ContactSection,
    NotificationsSection,
} from "./AdditionalSections";
import type { AccountSettingsFormProps } from "./account-form-types";
import { DeveloperSection } from "./sections/DeveloperSection";
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { PrivacySection } from "./sections/PrivacySection";
import { SecuritySection } from "./sections/SecuritySection";

export function AccountSettingsForm(props: AccountSettingsFormProps) {
    return (
        <form id="account-settings-form" onSubmit={props.onSubmit} className="space-y-5">
            {props.activeSection === "personal-info" ? (
                <PersonalInfoSection {...props} />
            ) : null}
            {props.activeSection === "security" ? <SecuritySection {...props} /> : null}
            {props.activeSection === "privacy" ? <PrivacySection {...props} /> : null}

            {props.activeSection === "developer" ? <DeveloperSection {...props} /> : null}
            {props.activeSection === "contact" ? <ContactSection account={props.account} /> : null}
            {props.activeSection === "notifications" ? (
                <NotificationsSection
                    account={props.account}
                    emailPreferences={props.emailPreferences}
                    onEmailPreferencesChange={props.onEmailPreferencesChange}
                />
            ) : null}
            {props.activeSection === "activity" ? (
                <ActivitySection account={props.account} appId={props.appId} />
            ) : null}
        </form>
    );
}
