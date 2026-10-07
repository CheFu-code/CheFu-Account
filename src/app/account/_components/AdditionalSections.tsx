"use client";

import { useEffect, useState } from "react";
import type { AccountResponse, EmailPreferences } from "./account-types";
import { apiUrl, type ChefuAppId } from "../../../lib/chefu-account";
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

type SecurityActivity = {
    eventId: string;
    eventType: string;
    label: string;
    deviceName: string | null;
    createdAt: string | null;
};

export function ActivitySection({
    account,
    appId,
}: {
    account: AccountResponse;
    appId: ChefuAppId;
}) {
    const [securityEvents, setSecurityEvents] = useState<SecurityActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        async function loadActivity() {
            try {
                const response = await fetch(apiUrl("/auth/activity"), {
                    credentials: "include",
                    headers: { "x-chefu-app": appId },
                });
                if (!response.ok) {
                    throw new Error("Could not load security activity.");
                }
                const data = (await response.json()) as SecurityActivity[];
                if (active) setSecurityEvents(data);
            } catch (loadError) {
                if (active) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Could not load security activity.",
                    );
                }
            } finally {
                if (active) setIsLoading(false);
            }
        }
        void loadActivity();
        return () => {
            active = false;
        };
    }, [appId]);

    const events = [
        ...securityEvents.flatMap((event) =>
            event.createdAt
                ? [{
                      label: event.deviceName
                          ? `${event.label} · ${event.deviceName}`
                          : event.label,
                      value: event.createdAt,
                      id: event.eventId,
                  }]
                : [],
        ),
        account.user.lastLoginAt
            ? { label: "Signed in", value: account.user.lastLoginAt, id: "last-sign-in" }
            : null,
        account.profile.updatedAt
            ? { label: "Profile updated", value: account.profile.updatedAt, id: "profile-updated" }
            : null,
        (account.user.createdAt || account.profile.createdAt)
            ? {
                  label: "Account created",
                  value: account.user.createdAt || account.profile.createdAt || "",
                  id: "account-created",
              }
            : null,
    ]
        .filter((event): event is { label: string; value: string; id: string } => Boolean(event))
        .filter((event) =>
            event.id !== "last-sign-in" ||
            !securityEvents.some((securityEvent) => securityEvent.eventType === "signed_in"),
        )
        .sort((left, right) => Date.parse(right.value) - Date.parse(left.value))
        .slice(0, 20);

    return (
        <div>
            <SectionHeader
                title="Activity Log"
                description="Recent sign-in, password, passkey, verification, and multi-factor security activity."
            />
            <AccountPanel>
                {error ? <p className="account-inline-error">{error}</p> : null}
                {events.length ? (
                    <dl className="account-activity-list">
                        {events.map((event) => (
                            <FieldRow
                                key={event.id}
                                label={event.label}
                                value={formatActivityDate(event.value)}
                            />
                        ))}
                    </dl>
                ) : isLoading ? (
                    <p className="account-empty-state">Loading recent activity…</p>
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
