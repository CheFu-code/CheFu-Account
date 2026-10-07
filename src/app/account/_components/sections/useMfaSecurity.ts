"use client";

import QRCode from "qrcode";
import {
    EmailAuthProvider,
    getMultiFactorResolver,
    multiFactor,
    reauthenticateWithCredential,
    sendEmailVerification,
    TotpMultiFactorGenerator,
    updatePassword,
    type MultiFactorResolver,
    type TotpSecret,
} from "firebase/auth";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useFirebaseAuthState } from "@/hooks/useFirebaseAuthState";
import type { AccountResponse } from "../account-types";
import { apiUrl, syncChefuAccountSession, type ChefuAppId } from "../../../../lib/chefu-account";
import { auth } from "../../../../lib/firebase";
import {
    accountLocationLabel,
    formatApiError,
    isMfaRequiredError,
    isRecentLoginRequiredError,
    readFirebaseMfaError,
    readReauthenticationError,
    securitySummaryFromFirebaseUser,
    type PendingMfaAction,
    type SecuritySummary,
} from "./mfa-security-utils";

type UseMfaSecurityOptions = {
    account: AccountResponse;
    appId: ChefuAppId;
};

export function useMfaSecurity({ account, appId }: UseMfaSecurityOptions) {
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
    const [pendingReauthAction, setPendingReauthAction] =
        useState<PendingMfaAction | null>(null);
    const [reauthPassword, setReauthPassword] = useState("");
    const [reauthCode, setReauthCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [reauthResolver, setReauthResolver] = useState<MultiFactorResolver | null>(null);
    const [isReauthenticating, setIsReauthenticating] = useState(false);

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

            if (!response.ok || !data?.codes) {
                throw new Error(formatApiError(data, "Could not generate recovery codes."));
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
            const qrUrl = secret.generateQrCodeUrl(user.email, "My Account");
            const dataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 220 });

            setTotpSecret(secret);
            setQrDataUrl(dataUrl);
            setSecretText(secret.secretKey);
            setTotpCode("");
        } catch (error) {
            if (isRecentLoginRequiredError(error)) {
                requestReauthentication("start-setup");
                return;
            }

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

            await multiFactor(user).enroll(assertion, "My Account TOTP");
            const refreshedUser = await refreshFirebaseUser();
            const enrolledUser = refreshedUser ?? auth.currentUser ?? user;
            const idToken = await enrolledUser.getIdToken(true);
            await syncChefuSession(idToken);
            setSummary((currentSummary) =>
                securitySummaryFromFirebaseUser(enrolledUser, currentSummary),
            );
            cancelTotpSetup();
            toast.success("2FA enabled.");
            await notifyMfaChanged("enabled", idToken);
            await generateBackupCodes("Recovery codes generated.", idToken);
        } catch (error) {
            if (isRecentLoginRequiredError(error)) {
                requestReauthentication("verify-setup");
                return;
            }

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
            const idToken = await (refreshedUser ?? auth.currentUser ?? user).getIdToken(true);
            await syncChefuSession(idToken);
            setCodes([]);
            await loadSecuritySummary(idToken);
            await notifyMfaChanged("disabled", idToken);
            toast.success("2FA disabled.");
        } catch (error) {
            if (isRecentLoginRequiredError(error)) {
                requestReauthentication("disable");
                return;
            }

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

    function requestReauthentication(action: PendingMfaAction) {
        setPendingReauthAction(action);
        setReauthPassword("");
        setReauthCode("");
        setReauthResolver(null);
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
        setReauthResolver(null);
        setNewPassword("");
        setConfirmNewPassword("");
    }

    function startPasswordChange() {
        if (!currentUser?.email) {
            toast.error("Sign in again before changing your password.");
            return;
        }
        if (!currentUser.providerData.some((provider) => provider.providerId === "password")) {
            toast.error("This account does not have a password sign-in. Use password reset to set one.");
            return;
        }
        requestReauthentication("change-password");
    }

    async function submitReauthentication(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const user = currentUser;
        if (!user?.email || !pendingReauthAction) {
            toast.error("Your session could not be confirmed. Refresh and try again.");
            return;
        }

        if (reauthResolver && reauthCode.length !== 6) {
            toast.error("Enter the 6-digit authenticator code.");
            return;
        }
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

        setIsReauthenticating(true);
        try {
            if (reauthResolver) {
                const totpHint = reauthResolver.hints.find(
                    (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID,
                );

                if (!totpHint) throw new Error("No authenticator factor is available.");

                const assertion = TotpMultiFactorGenerator.assertionForSignIn(
                    totpHint.uid,
                    reauthCode,
                );
                await reauthResolver.resolveSignIn(assertion);
            } else {
                const credential = EmailAuthProvider.credential(user.email, reauthPassword);
                await reauthenticateWithCredential(user, credential);
            }

            await refreshFirebaseUser();
            const action = pendingReauthAction;
            const passwordToSet = newPassword;
            resetReauthentication();
            if (action !== "change-password") toast.success("Sign-in confirmed.");
            try {
                await resumeMfaAction(action, passwordToSet);
            } catch (error) {
                toast.error(
                    action === "change-password"
                        ? "Unable to change your password."
                        : "Unable to complete the security change.",
                    {
                        description: readReauthenticationError(error),
                    },
                );
            }
        } catch (error) {
            if (!reauthResolver && isMfaRequiredError(error)) {
                const resolver = getMultiFactorResolver(auth, error);
                const totpHint = resolver.hints.find(
                    (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID,
                );

                if (!totpHint) {
                    toast.error("No authenticator factor is available for this account.");
                    return;
                }

                setReauthResolver(resolver);
                setReauthCode("");
                toast.info("Enter your authenticator code to finish confirming.");
                return;
            }

            toast.error("Unable to confirm your sign-in.", {
                description: readReauthenticationError(error),
            });
        } finally {
            setIsReauthenticating(false);
        }
    }

    async function resumeMfaAction(action: PendingMfaAction, passwordToSet?: string) {
        if (action === "change-password") {
            const user = currentUser;
            if (!user) throw new Error("Sign in again before changing your password.");
            await updatePassword(user, passwordToSet || "");
            await refreshFirebaseUser();
            setNewPassword("");
            setConfirmNewPassword("");
            toast.success("Your password has been changed.");
            return;
        }
        if (action === "start-setup") {
            await startTotpSetup();
            return;
        }

        if (action === "verify-setup") {
            await verifyTotpSetup();
            return;
        }

        await disableTotp();
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
                    userName: account.profile.fullname || account.user.displayName || undefined,
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

            if (
                data?.sent === false &&
                data.reason !== "Security emails are disabled for this account."
            ) {
                toast.warning("2FA changed, but the security email could not send.", {
                    description: data.reason || "Please check your email settings.",
                });
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
            toast.warning("Two-factor authentication was updated, but your session could not be refreshed. Please sign in again.", {
                description:
                    error instanceof Error ? error.message : "Sign in again if the page feels stale.",
            });
        }
    }

    async function copyCodes() {
        if (!codes.length) return;
        await navigator.clipboard.writeText(codes.join("\n"));
        toast.success("Recovery codes copied.");
    }

    return {
        codes,
        copyCodes,
        currentUser,
        firebaseReady,
        generateBackupCodes,
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
        reauthenticationRequiresMfa: Boolean(reauthResolver),
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
        totpSetup: totpSecret && qrDataUrl && secretText ? { qrDataUrl, secretText } : null,
        verifyTotpSetup,
        cancelTotpSetup,
        disableTotp,
        startPasswordChange,
    };
}
