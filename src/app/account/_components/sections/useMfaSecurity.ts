"use client";

import QRCode from "qrcode";
import { useSecurityReads } from "./useSecurityReads";
import { sendSecurityNotification } from "./security-notifications";
import { authMutationFetch } from "../../../../lib/auth-reads";
export type { TrustedDevice } from "./useSecurityReads";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { AccountResponse } from "../account-types";
import { apiUrl, type ChefuAppId } from "../../../../lib/chefu-account";
import {
    formatApiError,
    type PendingMfaAction,
    type SecuritySummary,
    type ApiError,
    type ReauthenticationResult,
} from "./mfa-security-utils";

type UseMfaSecurityOptions = {
    account: AccountResponse;
    appId: ChefuAppId;
};

export function useMfaSecurity({ account, appId }: UseMfaSecurityOptions) {
    const { summary, setSummary, trustedDevices, isLoadingTrustedDevices, isLoading, isReady, loadSecuritySummary, loadTrustedDevices } = useSecurityReads(appId);
    const [revokingTrustedDevice, setRevokingTrustedDevice] = useState(false);
    const [codes, setCodes] = useState<string[]>([]);
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
    const [pendingTrustedDeviceId, setPendingTrustedDeviceId] = useState<string | undefined>();
    const [reauthPassword, setReauthPassword] = useState("");
    const [reauthCode, setReauthCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [reauthPendingCredential, setReauthPendingCredential] = useState("");
    const [reauthEnrollmentId, setReauthEnrollmentId] = useState("");
    const [reauthToken, setReauthToken] = useState("");
    const [isReauthenticating, setIsReauthenticating] = useState(false);
    const currentUser = { email: account.user.email,
        displayName: account.profile.fullname || account.user.displayName || "" };

    const totpFactorUid = useMemo(
        () =>
            summary?.enrolledFactors.find((factor) => factor.factorId === "totp")?.uid,
        [summary?.enrolledFactors],
    );

    async function revokeTrustedDevice(deviceId?: string) {
        const prompt = deviceId
            ? "Remove trust from this device? It will need verification before being trusted again."
            : "Revoke trust from all listed devices?";
        if (!window.confirm(prompt)) return;
        await requestReauthentication("revoke-trusted-devices", deviceId);
    }

    async function performTrustedDeviceRevocation(token: string) {
        setRevokingTrustedDevice(true);
        try {
            const response = await authMutationFetch(apiUrl("/auth/trusted-devices"), {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "x-chefu-app": appId,
                },
                body: JSON.stringify({
                    reauthToken: token,
                    ...(pendingTrustedDeviceId
                        ? { deviceId: pendingTrustedDeviceId }
                        : { all: true }),
                }),
            });
            const data = (await response.json().catch(() => null)) as ApiError | null;
            if (!response.ok) {
                throw new Error(formatApiError(data, "Could not revoke device trust."));
            }
            toast.success(
                pendingTrustedDeviceId ? "Device trust revoked." : "All device trust revoked.",
            );
            await loadTrustedDevices();
        } catch (error) {
            toast.error("Unable to revoke device trust.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setRevokingTrustedDevice(false);
        }
    }


    async function requestReauthentication(
        action: PendingMfaAction,
        trustedDeviceId?: string,
    ) {
        setPendingReauthAction(action);
        setPendingTrustedDeviceId(trustedDeviceId);
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
        setPendingTrustedDeviceId(undefined);
        setReauthPassword("");
        setReauthCode("");
        setReauthPendingCredential("");
        setReauthEnrollmentId("");
        setReauthToken("");
        setNewPassword("");
        setConfirmNewPassword("");
    }

    async function notifyPasswordChanged() { await sendSecurityNotification(account, appId); }

    async function generateBackupCodes(
        successMessage = "Recovery codes generated.",
    ) {
        setIsGeneratingCodes(true);
        try {
            const response = await authMutationFetch(apiUrl("/auth/mfa/backup-codes"), {
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
            const response = await authMutationFetch(apiUrl("/auth/security/email-verification"), {
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
            const response = await authMutationFetch(apiUrl("/auth/security/totp/setup"), {
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
            const response = await authMutationFetch(apiUrl("/auth/security/totp/verify"), {
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
            const response = await authMutationFetch(apiUrl("/auth/security/totp/disable"), {
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
            await sendSecurityNotification(account, appId, action);
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
            const response = await authMutationFetch(apiUrl("/auth/security/reauthenticate"), {
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
            if (action === "revoke-trusted-devices") {
                await performTrustedDeviceRevocation(data.reauthToken);
                resetReauthentication();
                return;
            }
            const passwordResponse = await authMutationFetch(apiUrl("/auth/security/password"), {
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
            toast.error(
                pendingReauthAction === "revoke-trusted-devices"
                    ? "Unable to revoke device trust."
                    : "Unable to confirm your sign-in.",
                {
                    description: error instanceof Error ? error.message : "Please try again.",
                },
            );
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
        isLoadingTrustedDevices,
        isReauthenticating,
        isRevokingTrustedDevices: pendingReauthAction === "revoke-trusted-devices",
        isSendingVerification,
        isStartingTotp,
        isVerifyingTotp,
        loadSecuritySummary: () => loadSecuritySummary(true),
        reauthCode,
        reauthPassword,
        confirmNewPassword,
        isChangingPassword: pendingReauthAction === "change-password",
        newPassword,
        reauthenticationOpen: Boolean(pendingReauthAction),
        reauthenticationRequiresMfa: Boolean(reauthPendingCredential),
        revokeTrustedDevice,
        revokingTrustedDevice,
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
        trustedDevices,
        loadTrustedDevices: () => loadTrustedDevices(true),
        verifyTotpSetup,
        cancelTotpSetup,
        disableTotp,
        startPasswordChange,
    };
}
