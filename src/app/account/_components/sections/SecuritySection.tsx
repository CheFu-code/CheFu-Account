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
import QRCode from "qrcode";
import { FirebaseError } from "firebase/app";
import {
    multiFactor,
    sendEmailVerification,
    TotpMultiFactorGenerator,
    type TotpSecret,
    type User,
} from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useFirebaseAuthState } from "@/hooks/useFirebaseAuthState";
import { ActionRow, SectionCard } from "../AccountControls";
import type { AccountSettingsFormProps } from "../account-form-types";
import { apiUrl, syncChefuAccountSession } from "../../../../lib/chefu-account";
import { auth } from "../../../../lib/firebase";
import { TotpSetupPanel } from "./TotpSetupPanel";

type SecuritySummary = {
    emailVerified: boolean;
    mfaEnabled: boolean;
    enrolledFactors: Array<{
        uid: string;
        displayName: string | null;
        factorId: string;
        enrollmentTime: string | null;
    }>;
    backupCodesRemaining: number;
    backupCodesGeneratedAt: string | null;
    backupCodesLastUsedAt: string | null;
};

export function SecuritySection({
    account,
    appId,
    isSendingReset,
    onSendResetEmail,
}: AccountSettingsFormProps) {
    const {
        isReady: firebaseReady,
        refresh: refreshFirebaseUser,
        user: firebaseUser,
    } = useFirebaseAuthState();
    const [summary, setSummary] = useState<SecuritySummary | null>(null);
    const [codes, setCodes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [secretText, setSecretText] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [isStartingTotp, setIsStartingTotp] = useState(false);
    const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
    const [isDisablingTotp, setIsDisablingTotp] = useState(false);

    const currentUser = firebaseUser ?? auth.currentUser;
    const totpFactorUid = useMemo(
        () =>
            summary?.enrolledFactors.find(
                (factor) => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID,
            )?.uid,
        [summary?.enrolledFactors],
    );

    const loadSecuritySummary = useCallback(async (idToken?: string) => {
        const headers: Record<string, string> = { "x-chefu-app": appId };
        if (idToken) headers.Authorization = `Bearer ${idToken}`;

        setIsLoading(true);
        try {
            const response = await fetch(apiUrl("/auth/security"), {
                credentials: "include",
                headers,
            });

            if (!response.ok) throw new Error("Could not load security status.");
            setSummary((await response.json()) as SecuritySummary);
        } catch (error) {
            toast.error("Unable to load security status.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [appId]);

    useEffect(() => {
        void loadSecuritySummary();
    }, [loadSecuritySummary]);

    async function generateBackupCodes(
        successMessage = "Recovery codes generated.",
        idToken?: string,
    ) {
        const bearerToken = idToken || (await getFreshIdToken());
        const headers: Record<string, string> = { "x-chefu-app": appId };
        if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

        setIsGeneratingCodes(true);
        try {
            const response = await fetch(apiUrl("/auth/mfa/backup-codes"), {
                method: "POST",
                credentials: "include",
                headers,
            });
            const data = (await response.json().catch(() => null)) as {
                codes?: string[];
                error?: string;
                message?: string;
                remaining?: number;
                requestId?: string;
            } | null;

            if (!response.ok || !data || !("codes" in data) || !data.codes) {
                throw new Error(
                    formatApiError(data, "Could not generate recovery codes."),
                );
            }

            setCodes(data.codes);
            toast.success(successMessage);
            await loadSecuritySummary(bearerToken);
        } catch (error) {
            toast.error("Unable to generate recovery codes.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsGeneratingCodes(false);
        }
    }

    async function sendVerificationEmail() {
        const user = currentUser;
        if (!user) {
            toast.error("Please sign in again before sending verification email.");
            return;
        }

        setIsSendingVerification(true);
        try {
            await sendEmailVerification(user);
            toast.success("Verification email sent.", {
                description: `Check ${account.user.email}.`,
            });
        } catch (error) {
            toast.error("Unable to send verification email.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSendingVerification(false);
        }
    }

    async function startTotpSetup() {
        const user = currentUser;
        if (!user?.email) {
            toast.error(
                firebaseReady
                    ? "Please sign in again before enabling 2FA."
                    : "Still checking your sign-in session. Try again in a moment.",
            );
            return;
        }

        setIsStartingTotp(true);

        try {
            const session = await multiFactor(user).getSession();
            const secret = await TotpMultiFactorGenerator.generateSecret(session);
            const qrUrl = secret.generateQrCodeUrl(user.email, "CheFu Account");
            const dataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 220 });

            setTotpSecret(secret);
            setQrDataUrl(dataUrl);
            setSecretText(secret.secretKey);
            setTotpCode("");
        } catch (error) {
            toast.error("Unable to start 2FA setup.", {
                description: readFirebaseMfaError(error),
            });
        } finally {
            setIsStartingTotp(false);
        }
    }

    async function verifyTotpSetup() {
        const user = currentUser;

        if (!user || !totpSecret) {
            toast.error("Please restart 2FA setup.");
            return;
        }

        if (totpCode.length !== 6) {
            toast.error("Enter the 6-digit authenticator code.");
            return;
        }

        setIsVerifyingTotp(true);

        try {
            const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
                totpSecret,
                totpCode,
            );

            await multiFactor(user).enroll(assertion, "CheFu Account TOTP");
            const refreshedUser = await refreshFirebaseUser();
            const enrolledUser = refreshedUser ?? auth.currentUser ?? user;
            const idToken = await enrolledUser.getIdToken(true);
            await syncChefuSession(idToken);
            applyFirebaseMfaSummary(enrolledUser);
            cancelTotpSetup();
            toast.success("2FA enabled.");
            await notifyMfaChanged("enabled", idToken);
            await generateBackupCodes("Recovery codes generated.", idToken);
        } catch (error) {
            toast.error("Unable to enable 2FA.", {
                description: readFirebaseMfaError(error),
            });
        } finally {
            setIsVerifyingTotp(false);
        }
    }

    async function disableTotp() {
        const user = currentUser;

        if (!user || !totpFactorUid) {
            toast.error("No authenticator factor is enrolled for this session.");
            return;
        }

        setIsDisablingTotp(true);

        try {
            await multiFactor(user).unenroll(totpFactorUid);
            const refreshedUser = await refreshFirebaseUser();
            const idToken = await (refreshedUser ?? auth.currentUser ?? user).getIdToken(
                true,
            );
            await syncChefuSession(idToken);
            setCodes([]);
            await loadSecuritySummary(idToken);
            await notifyMfaChanged("disabled", idToken);
            toast.success("2FA disabled.");
        } catch (error) {
            toast.error("Unable to disable 2FA.", {
                description: readFirebaseMfaError(error),
            });
        } finally {
            setIsDisablingTotp(false);
        }
    }

    function cancelTotpSetup() {
        setTotpSecret(null);
        setQrDataUrl(null);
        setSecretText("");
        setTotpCode("");
    }

    async function notifyMfaChanged(action: "enabled" | "disabled", idToken: string) {
        try {
            const response = await fetch(apiUrl("/email/mfa-changed"), {
                method: "POST",
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                    "x-chefu-app": appId,
                },
                body: JSON.stringify({
                    action,
                    location: accountLocationLabel(account.profile),
                    userName: account.profile.name || account.user.displayName || undefined,
                }),
            });
            const data = (await response.json().catch(() => null)) as {
                error?: string;
                message?: string;
                reason?: string;
                requestId?: string;
                sent?: boolean;
            } | null;

            if (!response.ok) {
                throw new Error(formatApiError(data, "Could not send security email."));
            }
        } catch (error) {
            toast.warning("2FA changed, but the security email could not send.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        }
    }

    async function getFreshIdToken() {
        const user = currentUser;
        if (!user) return "";

        try {
            return await user.getIdToken(true);
        } catch {
            return "";
        }
    }

    async function syncChefuSession(idToken: string) {
        try {
            await syncChefuAccountSession(idToken, appId);
        } catch (error) {
            toast.warning("2FA changed, but your CheFu session could not refresh.", {
                description:
                    error instanceof Error ? error.message : "Sign in again if the page feels stale.",
            });
        }
    }

    function applyFirebaseMfaSummary(user: User) {
        const enrolledFactors = multiFactor(user).enrolledFactors.map((factor) => ({
            uid: factor.uid,
            displayName: factor.displayName || null,
            factorId: factor.factorId,
            enrollmentTime: factor.enrollmentTime || null,
        }));

        setSummary((currentSummary) => ({
            emailVerified: user.emailVerified,
            mfaEnabled: enrolledFactors.length > 0,
            enrolledFactors,
            backupCodesRemaining: currentSummary?.backupCodesRemaining || 0,
            backupCodesGeneratedAt: currentSummary?.backupCodesGeneratedAt || null,
            backupCodesLastUsedAt: currentSummary?.backupCodesLastUsedAt || null,
        }));
    }

    async function copyCodes() {
        if (!codes.length) return;
        await navigator.clipboard.writeText(codes.join("\n"));
        toast.success("Recovery codes copied.");
    }

    return (
        <SectionCard
            icon={ShieldCheck}
            title="Security & sign-in"
            description="Protect your account with verification, password recovery, and MFA recovery codes."
            aside={summary?.mfaEnabled ? "MFA enabled" : "MFA ready"}
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
                            {isSendingReset ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                            Send reset
                        </button>
                    }
                />
                <ActionRow
                    icon={Mail}
                    title="Email verification"
                    description={
                        summary?.emailVerified
                            ? "Your email is verified."
                            : "Verify your email before enabling stronger recovery options."
                    }
                    action={
                        summary?.emailVerified ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-200">
                                <CheckCircle2 className="size-4" />
                                Verified
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={sendVerificationEmail}
                                disabled={isSendingVerification}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                            >
                                {isSendingVerification ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                                Send email
                            </button>
                        )
                    }
                />
                <ActionRow
                    icon={Smartphone}
                    title="MFA status"
                    description={
                        summary?.mfaEnabled
                            ? `${summary.enrolledFactors.length} second factor${summary.enrolledFactors.length === 1 ? "" : "s"} enrolled.`
                            : currentUser || !firebaseReady
                                ? "No second factor is enrolled yet. Add an authenticator app to protect CheFu Account sign-ins."
                                : "Sign in again to CheFu Account before enrolling an authenticator app."
                    }
                    action={
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <button
                                type="button"
                                onClick={() => void loadSecuritySummary()}
                                disabled={isLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                            >
                                <RotateCcw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                                Refresh
                            </button>
                            {summary?.mfaEnabled ? (
                                <button
                                    type="button"
                                    onClick={disableTotp}
                                    disabled={isDisablingTotp || !totpFactorUid}
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-red-300/30 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-400/10 disabled:opacity-60"
                                >
                                    {isDisablingTotp ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <ShieldCheck className="size-4" />
                                    )}
                                    Disable 2FA
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={startTotpSetup}
                                    disabled={isStartingTotp || !firebaseReady || !currentUser}
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:opacity-60"
                                >
                                    {isStartingTotp ? (
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
                {totpSecret && qrDataUrl && secretText ? (
                    <div className="pb-4">
                        <TotpSetupPanel
                            code={totpCode}
                            isVerifying={isVerifyingTotp}
                            onCancel={cancelTotpSetup}
                            onCodeChange={setTotpCode}
                            onVerify={verifyTotpSetup}
                            qrDataUrl={qrDataUrl}
                            secretText={secretText}
                        />
                    </div>
                ) : null}
                <div className="py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="font-semibold text-white">Recovery codes</p>
                            <p className="mt-1 text-sm leading-6 text-slate-400">
                                Generate one-time codes for account recovery. We show them once and store only hashes.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => void generateBackupCodes()}
                            disabled={isGeneratingCodes}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-60"
                        >
                            {isGeneratingCodes ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                            Generate codes
                        </button>
                    </div>
                    {summary ? (
                        <p className="mt-3 text-xs text-slate-500">
                            {summary.backupCodesRemaining} unused codes
                            {summary.backupCodesGeneratedAt
                                ? `, generated ${new Date(summary.backupCodesGeneratedAt).toLocaleDateString()}`
                                : ""}
                        </p>
                    ) : null}
                    {codes.length ? (
                        <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/8 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-amber-100">
                                    Store these now. They will not be shown again.
                                </p>
                                <button
                                    type="button"
                                    onClick={copyCodes}
                                    className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/10"
                                >
                                    <Copy className="size-3.5" />
                                    Copy
                                </button>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {codes.map((code) => (
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
    );
}

function readFirebaseMfaError(error: unknown) {
    if (!(error instanceof FirebaseError)) {
        return error instanceof Error ? error.message : "Please try again.";
    }

    switch (error.code) {
        case "auth/requires-recent-login":
            return "Sign in again before changing 2FA.";
        case "auth/unverified-email":
            return "Verify your email before enabling 2FA.";
        case "auth/invalid-verification-code":
        case "auth/invalid-totp-code":
            return "The authenticator code is incorrect.";
        case "auth/code-expired":
            return "That code expired. Try the next code.";
        case "auth/second-factor-already-in-use":
            return "This authenticator is already enrolled.";
        case "auth/maximum-second-factor-count-exceeded":
            return "This account already has the maximum number of second factors.";
        case "auth/too-many-requests":
            return "Too many attempts. Please wait and try again.";
        default:
            return error.message || "Please try again.";
    }
}

function formatApiError(
    data:
        | { error?: string; message?: string; requestId?: string }
        | null,
    fallback: string,
) {
    const message = data?.message || data?.error || fallback;
    return data?.requestId ? `${message} Request ID: ${data.requestId}` : message;
}

function accountLocationLabel(profile: {
    country?: string;
    countryCode?: string;
    detectedCountryCode?: string;
}) {
    return (
        profile.country?.trim() ||
        profile.countryCode?.trim().toUpperCase() ||
        profile.detectedCountryCode?.trim().toUpperCase() ||
        undefined
    );
}
