"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiUrl, type ChefuAppId } from "../../../../lib/chefu-account";
import { authMutationFetch } from "../../../../lib/auth-reads";

type ApiResult = {
    error?: string;
    message?: string;
    mfaRequired?: boolean;
    mfaPendingCredential?: string;
    mfaInfo?: Array<{ mfaEnrollmentId?: string }>;
    reauthToken?: string;
    cooldownSeconds?: number;
    resendsRemaining?: number;
    retryAfterSeconds?: number;
    retryAfter?: number;
    confirmationEmailSent?: boolean;
};

type Phase = "password" | "mfa" | "mfa-confirm" | "email" | "complete";

export function useAccountDeletion({
    appId,
    email,
}: {
    appId: ChefuAppId;
    email: string;
}) {
    const [phase, setPhase] = useState<Phase>("password");
    const [acknowledged, setAcknowledged] = useState(false);
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [reauthToken, setReauthToken] = useState("");
    const [mfaPendingCredential, setMfaPendingCredential] = useState("");
    const [mfaEnrollmentId, setMfaEnrollmentId] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendsRemaining, setResendsRemaining] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmationEmailSent, setConfirmationEmailSent] = useState<boolean | null>(null);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = window.setTimeout(
            () => setResendCooldown((remaining) => Math.max(0, remaining - 1)),
            1000,
        );
        return () => window.clearTimeout(timer);
    }, [resendCooldown]);

    async function post(path: string, body: Record<string, unknown>) {
        const response = await authMutationFetch(apiUrl(path), {
            method: path === "/auth/account" ? "DELETE" : "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "x-chefu-app": appId,
            },
            body: JSON.stringify(body),
        });
        const result = (await response.json().catch(() => ({}))) as ApiResult;
        if (!response.ok) {
            if (path === "/auth/account-deletion/email-challenge") {
                const retryAfter = result.retryAfterSeconds ?? result.retryAfter;
                if (typeof retryAfter === "number") setResendCooldown(retryAfter);
                if (typeof result.resendsRemaining === "number") {
                    setResendsRemaining(result.resendsRemaining);
                }
            }
            throw new Error(
                result.message || result.error || "The request could not be completed.",
            );
        }
        return result;
    }

    async function requestEmailCode(token?: string) {
        const result = await post("/auth/account-deletion/email-challenge", {
            acknowledged,
            ...(token ? { reauthToken: token } : {}),
        });
        setResendCooldown(result.cooldownSeconds || 0);
        setResendsRemaining(result.resendsRemaining || 0);
        setCode("");
        setPhase("email");
        toast.info(`A confirmation code was sent to ${email}.`);
    }

    async function completeDeletion(token?: string, emailCode?: string) {
        const result = await post("/auth/account", {
            acknowledged,
            ...(token ? { reauthToken: token } : {}),
            ...(emailCode ? { emailCode } : {}),
        });
        setConfirmationEmailSent(result.confirmationEmailSent === true);
        setPhase("complete");
    }

    async function startVerification(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!acknowledged) {
            toast.error("Acknowledge the account deletion consequences to continue.");
            return;
        }
        if (!password) {
            toast.error("Enter your password to continue.");
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await post("/auth/security/reauthenticate", { password });
            if (result.mfaRequired) {
                const factor = result.mfaInfo?.find((item) => item.mfaEnrollmentId);
                if (!result.mfaPendingCredential || !factor?.mfaEnrollmentId) {
                    throw new Error(
                        "No authenticator factor is available for this account.",
                    );
                }
                setMfaPendingCredential(result.mfaPendingCredential);
                setMfaEnrollmentId(factor.mfaEnrollmentId);
                setPassword("");
                setPhase("mfa");
                return;
            }
            if (!result.reauthToken) {
                throw new Error(
                    "The server could not confirm your sign-in. Please try again.",
                );
            }
            setPassword("");
            await requestEmailCode(result.reauthToken);
        } catch (error) {
            toast.error("Unable to continue account deletion.", {
                description:
                    error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function verifyMfa(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!/^\d{6}$/.test(code)) {
            toast.error("Enter the 6-digit authenticator code.");
            return;
        }
        setIsSubmitting(true);
        let token = "";
        try {
            const result = await post("/auth/security/reauthenticate", {
                mfaPendingCredential,
                mfaEnrollmentId,
                verificationCode: code,
            });
            if (!result.reauthToken) {
                throw new Error(
                    "The server could not confirm your sign-in. Please try again.",
                );
            }
            token = result.reauthToken;
        } catch (error) {
            toast.error("Unable to verify the authenticator code.", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Check the code and try again.",
            });
            setIsSubmitting(false);
            return;
        }

        setReauthToken(token);
        setCode("");
        setPhase("mfa-confirm");
        try {
            await completeDeletion(token);
        } catch (error) {
            toast.error("Unable to delete the account.", {
                description:
                    error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function verifyEmailCode(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!/^\d{6}$/.test(code)) {
            toast.error("Enter the 6-digit email code.");
            return;
        }
        setIsSubmitting(true);
        try {
            await completeDeletion(undefined, code);
        } catch (error) {
            toast.error("Unable to verify the email code.", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Check the code and try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function retryMfaDeletion(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!reauthToken) {
            toast.error(
                "Your confirmation expired. Start the account deletion steps again.",
            );
            return;
        }
        setIsSubmitting(true);
        try {
            await completeDeletion(reauthToken);
        } catch (error) {
            toast.error("Unable to delete the account.", {
                description:
                    error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function resendEmailCode() {
        if (isSubmitting || resendCooldown > 0 || resendsRemaining <= 0) return;
        setIsSubmitting(true);
        try {
            await requestEmailCode();
        } catch (error) {
            toast.error("Unable to resend the confirmation code.", {
                description:
                    error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const submitHandler =
        phase === "password"
            ? startVerification
            : phase === "mfa"
                ? verifyMfa
                : phase === "mfa-confirm"
                    ? retryMfaDeletion
                    : verifyEmailCode;

    return {
        acknowledged,
        code,
        confirmationEmailSent,
        isSubmitting,
        phase,
        password,
        reauthToken,
        resendCooldown,
        resendsRemaining,
        setAcknowledged,
        setCode,
        setPassword,
        submitHandler,
        resendEmailCode,
    };
}
