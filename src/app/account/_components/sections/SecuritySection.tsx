"use client";

import {
    CheckCircle2,
    Copy,
    KeyRound,
    Loader2,
    Mail,
    RotateCcw,
    ShieldCheck,
    Smartphone,
} from "lucide-react";
import { ActionRow } from "../AccountControls";
import { AccountButton, AccountPanel, SectionHeader } from "../AccountPrimitives";
import type { AccountSettingsFormProps } from "../account-form-types";
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
    const mfaDescription = security.summary?.mfaEnabled
        ? `${security.summary.enrolledFactors.length} second factor${
              security.summary.enrolledFactors.length === 1 ? "" : "s"
          } enrolled.`
        : "No second factor is enrolled yet. Add an authenticator app to protect your account sign-ins.";
    const hasPasswordProvider = security.hasPasswordProvider;

    return (
        <div className="account-security-section">
            <SectionHeader
                title="Security"
                description="Manage your password, two-factor authentication, and active sessions."
            />
            <h2 className="account-subsection-title">Password</h2>
            <AccountPanel className="account-security-panel">
                <div className="account-security-rows">
                    <div className="account-security-subsection-heading">
                        <h2 className="account-subsection-title">Password and sign-in</h2>
                    </div>
                    <ActionRow
                        icon={KeyRound}
                        title={hasPasswordProvider ? "Change password" : "Set a password"}
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
                                    <Mail className="size-4 mr-1" />
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
                                        <Mail className="size-4 mr-1" />
                                    )}
                                    Send email
                                </AccountButton>
                            )
                        }
                    />

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
                                        className={`size-4 ${
                                            security.isLoading ? "animate-spin" : ""
                                        }`}
                                    />
                                    Refresh
                                </AccountButton>
                                {security.summary?.mfaEnabled ? (
                                    <AccountButton
                                        variant="danger"
                                        onClick={security.disableTotp}
                                        disabled={
                                            security.isDisablingTotp ||
                                            !security.totpFactorUid
                                        }
                                    >
                                        {security.isDisablingTotp ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="size-4" />
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
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Smartphone className="size-4" />
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
                                    Generate one-time codes for account recovery. We show
                                    them once and store only hashes.
                                </p>
                            </div>
                            <AccountButton
                                variant="primary"
                                onClick={() => void security.generateBackupCodes()}
                                disabled={security.isGeneratingCodes}
                            >
                                {security.isGeneratingCodes ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <KeyRound className="size-4" />
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
            </AccountPanel>

            <PasskeySection />

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
        </div>
    );
}
