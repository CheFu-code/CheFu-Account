"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { AccountResponse } from "../account-types";
import { apiUrl, type ChefuAppId } from "../../../../lib/chefu-account";
import {
    accountLocationLabel,
    formatApiError,
    type PendingMfaAction,
    type SecuritySummary,
} from "./mfa-security-utils";

type UseMfaSecurityOptions = {
    account: AccountResponse;
    appId: ChefuAppId;
};

type ApiError = {
    error?: string;
    message?: string;
    requestId?: string;
};

type ReauthenticationResult = ApiError & {
    mfaRequired?: boolean;
    mfaPendingCredential?: string;
    mfaInfo?: Array<{ mfaEnrollmentId?: string; displayName?: string }>;
    reauthToken?: string;
};

export function useMfaSecurity({ account, appId }: UseMfaSecurityOptions) {
    const [summary, setSummary] = useState<SecuritySummary | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [codes, setCodes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [secretText, setSecretText] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [totpSetupId, setTotpSetupId] = useState("");
    const [isStartingTotp, setIsStartingTotp] = useState(false);
    const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
    const [isDisablingTotp, setIsDisablingTotp] = useState(false);
    const [pendingReauthAction, setPendingReauthAction] =
        useState<PendingMfaAction | null>(null);
    const [reauthPassword, setReauthPassword] = useState("");
    const [reauthCode, setReauthCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [reauthPendingCredential, setReauthPendingCredential] = useState("");
    const [reauthEnrollmentId, setReauthEnrollmentId] = useState("");
    const [reauthToken, setReauthToken] = useState("");
    const [isReauthenticating, setIsReauthenticating] = useState(false);

    const currentUser = useMemo(
        () => ({
            email: account.user.email,
            displayName: account.profile.fullname || account.user.displayName || "",
        }),
        [account.profile.fullname, account.user.displayName, account.user.email],
    );
    const totpFactorUid = useMemo(
        () =>
            summary?.enrolledFactors.find((factor) => factor.factorId === "totp")?.uid,
        [summary?.enrolledFactors],
    );

    const loadSecuritySummary = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(apiUrl("/auth/security"), {
                credentials: "include",
                headers: { "x-chefu-app": appId },
            });
            const data = (await response.json().catch(() => null)) as SecuritySummary | ApiError | null;
            if (!response.ok) {
                throw new Error(formatApiError(data as ApiError | null, "Could not load security status."));
            }
            setSummary(data as SecuritySummary);
        } catch (error) {
            toast.error("Unable to load security status.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsLoading(false);
            setIsReady(true);
        }
    }, [appId]);

    useEffect(() => {
        void loadSecuritySummary();
    }, [loadSecuritySummary]);

    async function requestReauthentication(action: PendingMfaAction) {
        setPendingReauthAction(action);
        setReauthPassword("");
        setReauthCode("");
        setReauthPendingCredential("");
        setReauthEnrollmentId("");
        setReauthToken("");
        if (action === "change-password") {
            setNewPassword("");
            setConfirmNewPassword("");
        }
        toast.info("Confirm your sign-in to continue.");
    }

    function resetReauthentication() {
        setPendingReauthAction(null);
        setReauthPassword("");
        setReauthCode("");
        setReauthPendingCredential("");
        setReauthEnrollmentId("");
        setReauthToken("");
        setNewPassword("");
        setConfirmNewPassword("");
    }

    async function notifyPasswordChanged() {
        const response = await fetch(apiUrl("/email/password-changed"), {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "x-chefu-app": appId,
            },
            body: JSON.stringify({
                deviceInfo: navigator.userAgent,
                location: accountLocationLabel(account.profile),
                userName: currentUser.displayName || undefined,
            }),
        });
        const data = (await response.json().catch(() => null)) as {
            reason?: string;
            sent?: boolean;
        } | null;
        if (!response.ok || data?.sent === false) {
            throw new Error(data?.reason || "Password-change email could not be sent.");
        }
    }

    async function generateBackupCodes(
        successMessage = "Recovery codes generated.",
    ) {
        setIsGeneratingCodes(true);
        try {
            const response = await fetch(apiUrl("/auth/mfa/backup-codes"), {
                method: "POST",
                credentials: "include",
                headers: { "x-chefu-app": appId },
            });
            const data = (await response.json().catch(() => null)) as
                | { codes?: string[]; error?: string; message?: string; requestId?: string }
                | null;
            if (!response.ok || !data?.codes) {
                throw new Error(formatApiError(data, "Could not generate recovery codes."));
            }
            setCodes(data.codes);
            toast.success(successMessage);
            await loadSecuritySummary();
        } catch (error) {
            toast.error("Unable to generate recovery codes.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsGeneratingCodes(false);
        }
    }

    async function sendVerificationEmail() {
        setIsSendingVerification(true);
        try {
            const response = await fetch(apiUrl("/auth/security/email-verification"), {
                method: "POST",
                credentials: "include",
                headers: { "x-chefu-app": appId },
            });
            const data = (await response.json().catch(() => null)) as
                | { sent?: boolean; verified?: boolean; error?: string; message?: string }
                | null;
            if (!response.ok) {
                throw new Error(formatApiError(data, "Unable to send verification email."));
            }
            if (data?.verified) {
                await loadSecuritySummary();
                toast.success("Your email is already verified.");
                return;
            }
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
        if (!summary?.emailVerified) {
            toast.error("Verify your email before enabling 2FA.");
            return;
        }
        await requestReauthentication("start-setup");
    }

    async function createTotpSetup(token: string) {
        setIsStartingTotp(true);
        try {
            const response = await fetch(apiUrl("/auth/security/totp/setup"), {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "x-chefu-app": appId,
                },
                body: JSON.stringify({ reauthToken: token }),
            });
            const data = (await response.json().catch(() => null)) as
                | { setupId?: string; secret?: string; otpauthUrl?: string; error?: string; message?: string }
                | null;
            if (!response.ok || !data?.setupId || !data.secret || !data.otpauthUrl) {
                throw new Error(formatApiError(data, "Unable to start authenticator setup."));
            }
            const dataUrl = await QRCode.toDataURL(data.otpauthUrl, { margin: 1, width: 220 });
            setTotpSetupId(data.setupId);
            setSecretText(data.secret);
            setQrDataUrl(dataUrl);
            setTotpCode("");
        } catch (error) {
            toast.error("Unable to start 2FA setup.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
            resetReauthentication();
        } finally {
            setIsStartingTotp(false);
        }
    }

    async function verifyTotpSetup() {
        if (!totpSetupId || !reauthToken || totpCode.length !== 6) {
            toast.error("Enter the 6-digit authenticator code.");
            return;
        }
        setIsVerifyingTotp(true);
        try {
            const response = await fetch(apiUrl("/auth/security/totp/verify"), {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "x-chefu-app": appId,
                },
                body: JSON.stringify({
                    setupId: totpSetupId,
                    reauthToken,
                    verificationCode: totpCode,
                }),
            });
            const data = (await response.json().catch(() => null)) as
                | SecuritySummary
                | ApiError
                | null;
            if (!response.ok) {
                throw new Error(formatApiError(data as ApiError | null, "Unable to enable 2FA."));
            }
            setSummary(data as SecuritySummary);
            cancelTotpSetup();
            resetReauthentication();
            toast.success("2FA enabled.");
            await notifyMfaChanged("enabled");
            await generateBackupCodes("Recovery codes generated.");
        } catch (error) {
            toast.error("Unable to enable 2FA.", {
                description: error instanceof Error ? error.message : "Check the code and try again.",
            });
        } finally {
            setIsVerifyingTotp(false);
        }
    }

    async function disableTotp() {
        if (!totpFactorUid) {
            toast.error("No authenticator factor is enrolled for this session.");
            return;
        }
        await requestReauthentication("disable");
    }

    async function performTotpDisable(token: string) {
        if (!totpFactorUid) throw new Error("No authenticator factor is enrolled.");
        setIsDisablingTotp(true);
        try {
            const response = await fetch(apiUrl("/auth/security/totp/disable"), {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "x-chefu-app": appId,
                },
                body: JSON.stringify({ reauthToken: token, factorUid: totpFactorUid }),
            });
            const data = (await response.json().catch(() => null)) as
                | SecuritySummary
                | ApiError
                | null;
            if (!response.ok) {
                throw new Error(formatApiError(data as ApiError | null, "Unable to disable 2FA."));
            }
            setSummary(data as SecuritySummary);
            setCodes([]);
            toast.success("2FA disabled.");
            await notifyMfaChanged("disabled");
        } finally {
            setIsDisablingTotp(false);
        }
    }

    async function notifyMfaChanged(action: "enabled" | "disabled") {
        try {
            const response = await fetch(apiUrl("/email/mfa-changed"), {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "x-chefu-app": appId,
                },
                body: JSON.stringify({
                    action,
                    location: accountLocationLabel(account.profile),
                    userName: currentUser.displayName || undefined,
                }),
            });
            const data = (await response.json().catch(() => null)) as
                | { reason?: string; sent?: boolean; error?: string; message?: string }
                | null;
            if (!response.ok || data?.sent === false) {
                throw new Error(data?.reason || data?.message || "Could not send security email.");
            }
        } catch (error) {
            toast.warning("2FA changed, but the security email could not send.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        }
    }

    async function startPasswordChange() {
        if (!summary?.hasPasswordProvider) {
            toast.error("This account does not have a password sign-in. Use password reset to set one.");
            return;
        }
        await requestReauthentication("change-password");
    }

    async function submitReauthentication(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!pendingReauthAction) return;
        if (
            pendingReauthAction === "change-password" &&
            (newPassword.length < 8 || newPassword !== confirmNewPassword)
        ) {
            toast.error(
                newPassword.length < 8
                    ? "Your new password must be at least 8 characters."
                    : "The new passwords do not match.",
            );
            return;
        }
        if (reauthPendingCredential && reauthCode.length !== 6) {
            toast.error("Enter the 6-digit authenticator code.");
            return;
        }
        setIsReauthenticating(true);
        try {
            const response = await fetch(apiUrl("/auth/security/reauthenticate"), {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "x-chefu-app": appId,
                },
                body: JSON.stringify(
                    reauthPendingCredential
                        ? {
                              mfaPendingCredential: reauthPendingCredential,
                              mfaEnrollmentId: reauthEnrollmentId,
                              verificationCode: reauthCode,
                          }
                        : { password: reauthPassword },
                ),
            });
            const data = (await response.json().catch(() => null)) as ReauthenticationResult | null;
            if (!response.ok) {
                throw new Error(formatApiError(data as ApiError | null, "Unable to confirm your sign-in."));
            }
            if (data?.mfaRequired) {
                const factor = data.mfaInfo?.find((item) => item.mfaEnrollmentId);
                if (!data.mfaPendingCredential || !factor?.mfaEnrollmentId) {
                    throw new Error("No authenticator factor is available for this account.");
                }
                setReauthPendingCredential(data.mfaPendingCredential);
                setReauthEnrollmentId(factor.mfaEnrollmentId);
                setReauthCode("");
                toast.info("Enter your authenticator code to finish confirming.");
                return;
            }
            if (!data?.reauthToken) throw new Error("The server did not confirm your sign-in.");
            setReauthToken(data.reauthToken);
            const action = pendingReauthAction;
            if (action === "start-setup") {
                await createTotpSetup(data.reauthToken);
                toast.success("Sign-in confirmed. Scan the QR code to finish 2FA setup.");
                return;
            }
            if (action === "disable") {
                await performTotpDisable(data.reauthToken);
                resetReauthentication();
                return;
            }
            const passwordResponse = await fetch(apiUrl("/auth/security/password"), {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "x-chefu-app": appId,
                },
                body: JSON.stringify({
                    reauthToken: data.reauthToken,
                    newPassword,
                }),
            });
            const passwordResult = (await passwordResponse.json().catch(() => null)) as ApiError | null;
            if (!passwordResponse.ok) {
                throw new Error(formatApiError(passwordResult, "Unable to change your password."));
            }
            resetReauthentication();
            toast.success("Your password has been changed.");
            try {
                await notifyPasswordChanged();
            } catch (error) {
                toast.warning("Password changed, but the notification email could not be sent.", {
                    description: error instanceof Error ? error.message : "Please try again later.",
                });
            }
        } catch (error) {
            toast.error("Unable to confirm your sign-in.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsReauthenticating(false);
        }
    }

    async function copyCodes() {
        if (!codes.length) return;
        await navigator.clipboard.writeText(codes.join("\n"));
        toast.success("Recovery codes copied.");
    }

    function cancelTotpSetup() {
        setTotpSetupId("");
        setQrDataUrl(null);
        setSecretText("");
        setTotpCode("");
    }

    return {
        codes,
        copyCodes,
        currentUser,
        sessionReady: isReady,
        generateBackupCodes,
        hasPasswordProvider: summary?.hasPasswordProvider || false,
        isDisablingTotp,
        isGeneratingCodes,
        isLoading,
        isReauthenticating,
        isSendingVerification,
        isStartingTotp,
        isVerifyingTotp,
        loadSecuritySummary,
        reauthCode,
        reauthPassword,
        confirmNewPassword,
        isChangingPassword: pendingReauthAction === "change-password",
        newPassword,
        reauthenticationOpen: Boolean(pendingReauthAction),
        reauthenticationRequiresMfa: Boolean(reauthPendingCredential),
        resetReauthentication,
        secretText,
        sendVerificationEmail,
        setReauthCode,
        setReauthPassword,
        setConfirmNewPassword,
        setNewPassword,
        setTotpCode,
        startTotpSetup,
        summary,
        submitReauthentication,
        totpCode,
        totpFactorUid,
        totpSetup: qrDataUrl && secretText ? { qrDataUrl, secretText } : null,
        verifyTotpSetup,
        cancelTotpSetup,
        disableTotp,
        startPasswordChange,
    };
}
