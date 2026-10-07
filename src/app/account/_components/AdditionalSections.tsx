"use client";

import type { AccountResponse, EmailPreferences } from "./account-types";
import {
    FieldRow,
    AccountPanel,
    SectionHeader,
    AccountToggle,
} from "./AccountPrimitives";

type Props = {
    account: AccountResponse;
    emailPreferences: EmailPreferences;
    onEmailPreferencesChange: (
        value: (current: EmailPreferences) => EmailPreferences,
    ) => void;
};

export function ContactSection({ account }: { account: AccountResponse }) {
    return (
        <div className="account-contact-section">
            <SectionHeader
                title="Contact and Address"
                description="Contact details associated with your account."
            />

            <div className="account-contact-toolbar">
                <h2 className="account-subsection-title">Contact</h2>
            </div>
            <dl className="account-contact-fields">
                <FieldRow label="Email address" value={account.user.email} />
                <FieldRow
                    label="Phone number"
                    value={account.profile.phone || "Not set"}
                />
            </dl>
        </div>
    );
}



export function NotificationsSection({
    emailPreferences,
    onEmailPreferencesChange,
}: Props) {
    const preferences = [
        ["Security alerts", "security"],
        ["Account activity", "activity"],
        ["Product updates", "general"],
        ["Marketing communications", "marketing"],
        ["Course reminders", "courseReminders"],
        ["Weekly progress summary", "weeklyProgressSummary"],
    ] as const;
    return (
        <div>
            <SectionHeader
                title="Notifications"
                description="Choose which account and product communications you receive."
            />
            <AccountPanel>
                {preferences.map(([label, key]) => (
                    <div className="account-setting-row" key={key}>
                        <div>
                            <p className="font-medium">{label}</p>
                            <p className="account-helper">
                                Email notifications for {label.toLowerCase()}.
                            </p>
                        </div>
                        <AccountToggle
                            label=""
                            checked={emailPreferences[key]}
                            onChange={(checked) =>
                                onEmailPreferencesChange((current) => ({
                                    ...current,
                                    [key]: checked,
                                }))
                            }
                        />
                    </div>
                ))}
            </AccountPanel>
        </div>
    );
}

export function ActivitySection({ account }: { account: AccountResponse }) {
    const events = [
        account.user.lastLoginAt
            ? { label: "Signed in", value: account.user.lastLoginAt }
            : null,
        account.profile.updatedAt
            ? { label: "Profile updated", value: account.profile.updatedAt }
            : null,
        (account.user.createdAt || account.profile.createdAt)
            ? {
                  label: "Account created",
                  value: account.user.createdAt || account.profile.createdAt || "",
              }
            : null,
    ].filter((event): event is { label: string; value: string } => Boolean(event));

    return (
        <div>
            <SectionHeader
                title="Activity Log"
                description="Recent account activity associated with your account."
            />
            <AccountPanel>
                {events.length ? (
                    <dl className="account-activity-list">
                        {events.map((event) => (
                            <FieldRow
                                key={`${event.label}-${event.value}`}
                                label={event.label}
                                value={formatActivityDate(event.value)}
                            />
                        ))}
                    </dl>
                ) : (
                    <p className="account-empty-state">
                        Activity will appear here after you sign in or update your account.
                    </p>
                )}
            </AccountPanel>
        </div>
    );
}

function formatActivityDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

