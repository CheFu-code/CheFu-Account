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
import { ActionRow, SectionCard } from "../AccountControls";
import type { AccountSettingsFormProps } from "../account-form-types";
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
        : security.currentUser || !security.firebaseReady
          ? "No second factor is enrolled yet. Add an authenticator app to protect CheFu Account sign-ins."
          : "Sign in again to CheFu Account before enrolling an authenticator app.";

    return (
        <>
            <SectionCard
                icon={ShieldCheck}
                title="Security & sign-in"
                description="Protect your account with verification, password recovery, and MFA recovery codes."
                aside={security.summary?.mfaEnabled ? "MFA enabled" : "MFA ready"}
            >
                <div className="divide-y divide-white/10">
                    <ActionRow
                        icon={KeyRound}
                        title="Password reset"
                        description={`Send a secure reset link to ${account.user.email}.`}
                        action={
                            <button
                                type="button"
                                onClick={onSendResetEmail}
                                disabled={isSendingReset}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                            >
                                {isSendingReset ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Mail className="size-4" />
                                )}
                                Send reset
                            </button>
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
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-200">
                                    <CheckCircle2 className="size-4" />
                                    Verified
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={security.sendVerificationEmail}
                                    disabled={security.isSendingVerification}
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                                >
                                    {security.isSendingVerification ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Mail className="size-4" />
                                    )}
                                    Send email
                                </button>
                            )
                        }
                    />

                    <ActionRow
                        icon={Smartphone}
                        title="MFA status"
                        description={mfaDescription}
                        action={
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => void security.loadSecuritySummary()}
                                    disabled={security.isLoading}
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                                >
                                    <RotateCcw
                                        className={`size-4 ${
                                            security.isLoading ? "animate-spin" : ""
                                        }`}
                                    />
                                    Refresh
                                </button>
                                {security.summary?.mfaEnabled ? (
                                    <button
                                        type="button"
                                        onClick={security.disableTotp}
                                        disabled={
                                            security.isDisablingTotp ||
                                            !security.totpFactorUid
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-red-300/30 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-400/10 disabled:opacity-60"
                                    >
                                        {security.isDisablingTotp ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="size-4" />
                                        )}
                                        Disable 2FA
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={security.startTotpSetup}
                                        disabled={
                                            security.isStartingTotp ||
                                            !security.firebaseReady ||
                                            !security.currentUser
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:opacity-60"
                                    >
                                        {security.isStartingTotp ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Smartphone className="size-4" />
                                        )}
                                        Enable 2FA
                                    </button>
                                )}
                            </div>
                        }
                    />

                    <div className="py-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="font-semibold text-white">Recovery codes</p>
                                <p className="mt-1 text-sm leading-6 text-slate-400">
                                    Generate one-time codes for account recovery. We show
                                    them once and store only hashes.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => void security.generateBackupCodes()}
                                disabled={security.isGeneratingCodes}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-60"
                            >
                                {security.isGeneratingCodes ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <KeyRound className="size-4" />
                                )}
                                Generate codes
                            </button>
                        </div>

                        {security.summary ? (
                            <p className="mt-3 text-xs text-slate-500">
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
                                    <button
                                        type="button"
                                        onClick={security.copyCodes}
                                        className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/10"
                                    >
                                        <Copy className="size-3.5" />
                                        Copy
                                    </button>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {security.codes.map((code) => (
                                        <code
                                            key={code}
                                            className="rounded-md bg-black/25 px-3 py-2 text-sm font-semibold text-white"
                                        >
                                            {code}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </SectionCard>

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
                    email={security.currentUser?.email || account.user.email}
                    isSubmitting={security.isReauthenticating}
                    onCancel={() => {
                        if (!security.isReauthenticating) security.resetReauthentication();
                    }}
                    onCodeChange={security.setReauthCode}
                    onPasswordChange={security.setReauthPassword}
                    onSubmit={security.submitReauthentication}
                    password={security.reauthPassword}
                    requiresMfa={security.reauthenticationRequiresMfa}
                />
            ) : null}
        </>
    );
}
