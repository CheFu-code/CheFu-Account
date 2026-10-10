"use client";

import {
    AlertTriangle,
    CheckCircle2,
    Copy,
    KeyRound,
    Loader2,
    Mail,
    MonitorSmartphone,
    RotateCcw,
    ShieldCheck,
    Smartphone,
    Trash2,
} from "lucide-react";
import { useState } from "react";
import { ActionRow } from "../AccountControls";
import {
    AccountButton,
    AccountPanel,
    SectionHeader,
} from "../AccountPrimitives";
import type { AccountSettingsFormProps } from "../account-form-types";
import { AccountDeletionDialog } from "./AccountDeletionDialog";
import { PasskeySection } from "./PasskeySection";
import { ReauthenticationDialog } from "./ReauthenticationDialog";
import { TotpSetupPanel } from "./TotpSetupPanel";
import { useMfaSecurity } from "./useMfaSecurity";

export function SecuritySection({
    account,
    appId,
    isSendingReset,
    onSendResetEmail,
}: AccountSettingsFormProps) {
    const security = useMfaSecurity({ account, appId });
    const [accountDeletionOpen, setAccountDeletionOpen] = useState(false);
    const mfaDescription = security.summary?.mfaEnabled
        ? `${security.summary.enrolledFactors.length} second factor${security.summary.enrolledFactors.length === 1 ? "" : "s"
        } enrolled.`
        : "No second factor is enrolled yet. Add an authenticator app to protect your account sign-ins.";
    const hasPasswordProvider = security.hasPasswordProvider;

    return (
        <div className="account-security-section">
            <SectionHeader
                title="Security"
                description="Manage your password, two-factor authentication, and active sessions."
            />
            <AccountPanel className="account-security-panel">
                <div className="account-security-rows account-security-settings-groups">
                    <div className="account-security-group">
                        <div className="account-security-subsection-heading">
                            <h2 className="account-subsection-title">Password and sign-in</h2>
                        </div>
                        <div className="account-security-action-rows">
                            <ActionRow
                                icon={KeyRound}
                                title={
                                    hasPasswordProvider ? "Change password" : "Set a password"
                                }
                                description={
                                    hasPasswordProvider
                                        ? "Choose a new password after confirming your sign-in."
                                        : "Send a secure reset link to set a password for this account."
                                }
                                action={
                                    <AccountButton
                                        variant="secondary"
                                        onClick={
                                            hasPasswordProvider
                                                ? security.startPasswordChange
                                                : onSendResetEmail
                                        }
                                        disabled={!security.sessionReady || security.isLoading}
                                    >
                                        {hasPasswordProvider ? (
                                            <>
                                                <KeyRound className="size-4 mr-1" />
                                                Change password
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="size-4 mr-1" />
                                                Set password
                                            </>
                                        )}
                                    </AccountButton>
                                }
                            />
                            <ActionRow
                                icon={KeyRound}
                                title="Password reset"
                                description={`Send a secure reset link to ${account.user.email}.`}
                                action={
                                    <AccountButton
                                        variant="secondary"
                                        onClick={onSendResetEmail}
                                        disabled={isSendingReset}
                                    >
                                        {isSendingReset ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Mail className="size-4 mr-1.5" />
                                        )}
                                        Send reset
                                    </AccountButton>
                                }
                            />

                            <ActionRow
                                icon={Mail}
                                title="Email verification"
                                description={
                                    security.summary?.emailVerified
                                        ? "Your email is verified."
                                        : "Verify your email before enabling stronger recovery options."
                                }
                                action={
                                    security.summary?.emailVerified ? (
                                        <span className="inline-flex items-center gap-2 rounded-full border border-[#e5ad5b]/20 bg-[#e5ad5b]/10 px-4 py-2.5 text-sm font-bold text-[#ffd18a]">
                                            <CheckCircle2 className="size-4" />
                                            Verified
                                        </span>
                                    ) : (
                                        <AccountButton
                                            variant="secondary"
                                            onClick={security.sendVerificationEmail}
                                            disabled={security.isSendingVerification}
                                        >
                                            {security.isSendingVerification ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <Mail className="size-4 mr-1.5" />
                                            )}
                                            Send email
                                        </AccountButton>
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="account-security-group">
                        <div className="account-security-subsection-heading">
                            <h2 className="account-subsection-title">
                                Two-factor authentication
                            </h2>
                        </div>
                        <ActionRow
                            icon={Smartphone}
                            title="MFA status"
                            description={mfaDescription}
                            action={
                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                    <AccountButton
                                        variant="secondary"
                                        onClick={() => void security.loadSecuritySummary()}
                                        disabled={security.isLoading}
                                    >
                                        <RotateCcw
                                            className={`size-4 mr-1.5 ${security.isLoading ? "animate-spin" : ""
                                                }`}
                                        />
                                        Refresh
                                    </AccountButton>
                                    {security.summary?.mfaEnabled ? (
                                        <AccountButton
                                            variant="danger"
                                            onClick={security.disableTotp}
                                            disabled={
                                                security.isDisablingTotp || !security.totpFactorUid
                                            }
                                        >
                                            {security.isDisablingTotp ? (
                                                <Loader2 className="size-4 animate-spin mr-1.5" />
                                            ) : (
                                                <ShieldCheck className="size-4 mr-1.5" />
                                            )}
                                            Disable 2FA
                                        </AccountButton>
                                    ) : (
                                        <AccountButton
                                            variant="primary"
                                            onClick={security.startTotpSetup}
                                            disabled={
                                                security.isStartingTotp ||
                                                !security.sessionReady ||
                                                security.isLoading
                                            }
                                        >
                                            {security.isStartingTotp ? (
                                                <Loader2 className="size-4 animate-spin mr-1.5" />
                                            ) : (
                                                <Smartphone className="size-4 mr-1.5" />
                                            )}
                                            Enable 2FA
                                        </AccountButton>
                                    )}
                                </div>
                            }
                        />

                        <div className="account-recovery-section py-4">
                            <h2 className="account-subsection-title">Recovery methods</h2>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="font-semibold text-[#f4f0e8]">Recovery codes</p>
                                    <p className="mt-1 text-sm leading-6 text-[#8f887d]">
                                        Generate one-time codes for account recovery. We show them
                                        once and store only hashes.
                                    </p>
                                </div>
                                <AccountButton
                                    variant="primary"
                                    onClick={() => void security.generateBackupCodes()}
                                    disabled={security.isGeneratingCodes}
                                >
                                    {security.isGeneratingCodes ? (
                                        <Loader2 className="size-4 animate-spin mr-1.5" />
                                    ) : (
                                        <KeyRound className="size-4 mr-1.5" />
                                    )}
                                    Generate codes
                                </AccountButton>
                            </div>

                            {security.summary ? (
                                <p className="mt-3 text-xs text-[#797267]">
                                    {security.summary.backupCodesRemaining} unused codes
                                    {security.summary.backupCodesGeneratedAt
                                        ? `, generated ${new Date(
                                            security.summary.backupCodesGeneratedAt,
                                        ).toLocaleDateString()}`
                                        : ""}
                                </p>
                            ) : null}

                            {security.codes.length ? (
                                <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/8 p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-amber-100">
                                            Store these now. They will not be shown again.
                                        </p>
                                        <AccountButton
                                            variant="secondary"
                                            onClick={security.copyCodes}
                                            className="text-xs"
                                        >
                                            <Copy className="size-3.5" />
                                            Copy
                                        </AccountButton>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {security.codes.map((code) => (
                                            <code
                                                key={code}
                                                className="rounded-lg bg-black/25 px-3 py-2 text-sm font-semibold text-[#f4f0e8]"
                                            >
                                                {code}
                                            </code>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </AccountPanel>

            <AccountPanel className="account-security-panel">
                <div className="account-security-rows">
                    <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#bdb5a8]">
                                <MonitorSmartphone className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <h2 className="font-semibold text-[#f4f0e8]">
                                    Trusted devices
                                </h2>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-[#8f887d]">
                                    Devices stay trusted for 90 days. New devices require an email
                                    code, or an authenticator code when 2FA is enabled.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <AccountButton
                                variant="secondary"
                                onClick={() => void security.loadTrustedDevices()}
                                disabled={security.isLoadingTrustedDevices}
                            >
                                <RotateCcw
                                    className={`size-4 mr-1.5 ${security.isLoadingTrustedDevices ? "animate-spin" : ""}`}
                                />
                                Refresh
                            </AccountButton>
                            {security.trustedDevices.length > 0 ? (
                                <AccountButton
                                    variant="danger"
                                    onClick={() => void security.revokeTrustedDevice()}
                                    disabled={
                                        security.revokingTrustedDevice ||
                                        (security.reauthenticationOpen &&
                                            security.isRevokingTrustedDevices)
                                    }
                                >
                                    {security.revokingTrustedDevice ? (
                                        <Loader2 className="size-4 animate-spin mr-1.5" />
                                    ) : (
                                        <Trash2 className="size-4 mr-1.5" />
                                    )}
                                    Revoke all
                                </AccountButton>
                            ) : null}
                        </div>
                    </div>

                    {security.isLoadingTrustedDevices &&
                        !security.trustedDevices.length ? (
                        <p className="py-4 text-sm text-[#8f887d]">
                            Loading trusted devices…
                        </p>
                    ) : security.trustedDevices.length ? (
                        <ul className="divide-y divide-white/8">
                            {security.trustedDevices.map((device) => (
                                <li
                                    key={device.id}
                                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-start gap-3">
                                        <MonitorSmartphone
                                            className="mt-1 size-4 shrink-0 text-[#bdb5a8]"
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <p className="font-medium text-[#f4f0e8]">
                                                {device.deviceName}
                                                {device.isCurrent ? (
                                                    <span className="ml-2 rounded-full border border-[#e5ad5b]/20 bg-[#e5ad5b]/10 px-2 py-0.5 text-xs text-[#ffd18a]">
                                                        This device
                                                    </span>
                                                ) : null}
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-[#8f887d]">
                                                Last used {new Date(device.lastSeenAt).toLocaleString()}{" "}
                                                · Expires{" "}
                                                {new Date(device.expiresAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <AccountButton
                                        variant="danger"
                                        onClick={() => void security.revokeTrustedDevice(device.id)}
                                        disabled={
                                            security.revokingTrustedDevice ||
                                            (security.reauthenticationOpen &&
                                                security.isRevokingTrustedDevices)
                                        }
                                    >
                                        <Trash2 className="size-4 mr-1.5" />
                                        Revoke
                                    </AccountButton>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="py-4 text-sm text-[#8f887d]">
                            No trusted devices. You can trust a device when you sign in.
                        </p>
                    )}
                </div>
            </AccountPanel>

            <PasskeySection />

            <AccountPanel className="account-security-panel">
                <section
                    className="rounded-xl border border-[var(--danger)]/35 bg-[var(--danger-soft)] p-4 sm:p-5"
                    aria-labelledby="security-danger-zone-title"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--danger)]/25 bg-[var(--bg)] text-[var(--danger)]">
                                <AlertTriangle className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <h2
                                    id="security-danger-zone-title"
                                    className="font-semibold text-[var(--danger)]"
                                >
                                    Danger Zone
                                </h2>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--fg-2)]">
                                    Deleting your shared sign-in account will end all active
                                    sessions and permanently remove your access to our apps,
                                    tools, and associated data. Certain records may be retained
                                    where required for legal or operational purposes. This action
                                    cannot be undone.
                                </p>
                                {security.summary && !security.summary.hasPasswordProvider ? (
                                    <p className="mt-2 text-sm leading-6 text-[var(--fg-muted)]">
                                        This account has no password sign-in. Set a password above
                                        before starting deletion verification.
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <AccountButton
                            variant="danger"
                            onClick={() => setAccountDeletionOpen(true)}
                            disabled={
                                !security.sessionReady ||
                                security.isLoading ||
                                !security.summary?.hasPasswordProvider
                            }
                            className="shrink-0"
                        >
                            <Trash2 className="size-4 mr-1.5" aria-hidden="true" />
                            Delete account
                        </AccountButton>
                    </div>
                </section>
            </AccountPanel>

            {security.totpSetup ? (
                <TotpSetupPanel
                    code={security.totpCode}
                    isVerifying={security.isVerifyingTotp}
                    onCancel={security.cancelTotpSetup}
                    onCodeChange={security.setTotpCode}
                    onVerify={security.verifyTotpSetup}
                    qrDataUrl={security.totpSetup.qrDataUrl}
                    secretText={security.totpSetup.secretText}
                />
            ) : null}

            {security.reauthenticationOpen ? (
                <ReauthenticationDialog
                    code={security.reauthCode}
                    confirmNewPassword={security.confirmNewPassword}
                    email={security.currentUser.email}
                    isChangingPassword={security.isChangingPassword}
                    isRevokingTrustedDevices={security.isRevokingTrustedDevices}
                    isSubmitting={security.isReauthenticating}
                    onCancel={() => {
                        if (!security.isReauthenticating) security.resetReauthentication();
                    }}
                    onCodeChange={security.setReauthCode}
                    onConfirmNewPasswordChange={security.setConfirmNewPassword}
                    onNewPasswordChange={security.setNewPassword}
                    onPasswordChange={security.setReauthPassword}
                    onSubmit={security.submitReauthentication}
                    password={security.reauthPassword}
                    newPassword={security.newPassword}
                    requiresMfa={security.reauthenticationRequiresMfa}
                />
            ) : null}
            {accountDeletionOpen ? (
                <AccountDeletionDialog
                    appId={appId}
                    email={account.user.email}
                    onCancel={() => setAccountDeletionOpen(false)}
                />
            ) : null}
        </div>
    );
}
