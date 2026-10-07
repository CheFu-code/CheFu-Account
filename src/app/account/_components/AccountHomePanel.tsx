"use client";

import { Check } from "lucide-react";
import type { AccountResponse } from "./account-types";
import { AccountButton, FieldRow, AccountPanel, SectionHeader } from "./AccountPrimitives";

type AccountHomePanelProps = {
    account: AccountResponse;
    initials: string;
    name: string;
    onSelectSection: (id: string) => void;
};

export function AccountHomePanel({
    account,
    initials,
    name,
    onSelectSection,
}: AccountHomePanelProps) {
    const fullName = name || account.user.displayName || "Account user";
    const country = account.profile.country || account.profile.detectedCountryCode || "Not set";

    return (
        <div className="account-profile-overview">
            <SectionHeader
                title="Profile Overview"
                description="Your account summary and key identity information."
            />

            <div className="account-profile-identity">
                <div className="account-profile-avatar">
                    {account.profile.profilePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={account.profile.profilePicture} alt="" />
                    ) : (
                        initials || "CU"
                    )}
                </div>
                <div>
                    <h2>{fullName}</h2>
                    <p>{account.user.email}</p>
                    <span className="account-profile-status">
                        <Check size={13} aria-hidden="true" />
                        Active
                    </span>
                </div>
                <div className="account-profile-action">
                    <AccountButton variant="secondary" onClick={() => onSelectSection("personal-info")}>
                        Change photo
                    </AccountButton>
                </div>
            </div>

            <div className="account-divider" />
            <h2 className="account-subsection-title">Identity</h2>

            <AccountPanel className="account-profile-fields">
                <dl>
                    <FieldRow label="Full name" value={fullName} managed />
                    <FieldRow label="Your email" value={account.user.email} managed />
                    <FieldRow label="Country" value={country} managed />
                    <FieldRow label="Account status" value={<span className="account-status account-status-success">Active</span>} managed />
                    <FieldRow
                        label="Last sign-in"
                        value={formatAccountDate(account.user.lastLoginAt)}
                    />
                    <FieldRow
                        label="Account created"
                        value={formatAccountDate(account.user.createdAt)}
                        managed
                    />
                </dl>
            </AccountPanel>

            
        </div>
    );
}

function formatAccountDate(value?: string | null) {
    return value || "Not recorded";
}
