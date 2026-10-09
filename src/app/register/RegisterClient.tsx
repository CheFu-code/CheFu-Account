"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AccountAuthScreen } from "../_components/AccountAuthScreen";
import {
    chefuAppLabel,
    EmailVerificationCodeError,
    preserveAuthParams,
    resolveChefuApp,
    safeReturnTo,
    sendEmailVerificationCode,
    verifyEmailVerificationCode,
} from "../../lib/chefu-account";
import { EmailVerificationDialog } from "./EmailVerificationDialog";

export function RegisterClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verificationOpen, setVerificationOpen] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState("");
    const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
    const [resendsRemaining, setResendsRemaining] = useState(0);
    const [verificationAttemptsRemaining, setVerificationAttemptsRemaining] = useState(3);
    const [verificationMessage, setVerificationMessage] = useState("");
    const [verificationCodeResetKey, setVerificationCodeResetKey] = useState(0);

    const appId = resolveChefuApp(searchParams.get("app"));
    const appName = chefuAppLabel(appId);
    const fromPath = safeReturnTo(
        searchParams.get("returnTo") || searchParams.get("next"),
        appId,
        "/account",
    );
    const loginHref = useMemo(
        () => preserveAuthParams("/login", new URLSearchParams(searchParams.toString())),
        [searchParams],
    );

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();

        if (!trimmedFirstName || !trimmedLastName || !email || !password) {
            toast.error("Please enter your first name, last name, email, and password.");
            return;
        }

        setIsSubmitting(true);

        try {
            const normalizedEmail = email.trim().toLowerCase();
            const displayName = `${trimmedFirstName} ${trimmedLastName}`;
            const sendResult = await sendEmailVerificationCode(
                normalizedEmail,
                displayName,
                appId,
            );
            setVerificationEmail(normalizedEmail);
            setResendCooldownSeconds(sendResult.cooldownSeconds);
            setResendsRemaining(sendResult.resendsRemaining);
            setVerificationAttemptsRemaining(3);
            setVerificationMessage("");
            setVerificationOpen(true);
        } catch (error) {
            toast.error(`Unable to send a verification code to ${appName}.`, {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
        <AccountAuthScreen
            alternateHref={loginHref}
            appName={appName}
            email={email}
            firstName={firstName}
            isSubmitting={isSubmitting}
            lastName={lastName}
            mode="register"
            onSubmit={onSubmit}
            password={password}
            setEmail={setEmail}
            setFirstName={setFirstName}
            setLastName={setLastName}
            setPassword={setPassword}
        />
        {verificationOpen ? (
            <EmailVerificationDialog
                email={verificationEmail}
                isSubmitting={isSubmitting}
                initialCooldownSeconds={resendCooldownSeconds}
                initialResendsRemaining={resendsRemaining}
                attemptsRemaining={verificationAttemptsRemaining}
                verificationMessage={verificationMessage}
                resetCodeKey={verificationCodeResetKey}
                onCancel={() => {
                    setVerificationOpen(false);
                    setPassword("");
                }}
                onResend={async () => {
                    setIsSubmitting(true);
                    try {
                        const sendResult = await sendEmailVerificationCode(
                            verificationEmail,
                            `${firstName.trim()} ${lastName.trim()}`,
                            appId,
                        );
                        setResendCooldownSeconds(sendResult.cooldownSeconds);
                        setResendsRemaining(sendResult.resendsRemaining);
                        setVerificationAttemptsRemaining(3);
                        setVerificationMessage("");
                        toast.success("A new verification code was sent.");
                        return sendResult;
                    } catch (error) {
                        toast.error("Unable to resend the verification code.", {
                            description: error instanceof Error ? error.message : "Please try again.",
                        });
                        throw error;
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
                onSubmit={async (code) => {
                    if (!/^\d{6}$/.test(code)) {
                        toast.error("Enter the 6-digit verification code.");
                        return;
                    }
                    setIsSubmitting(true);
                    try {
                        await verifyEmailVerificationCode(
                            verificationEmail,
                            code,
                            password,
                            `${firstName.trim()} ${lastName.trim()}`,
                            appId,
                        );
                        toast.success(`Account created for ${appName}.`);
                        completeAuthRedirect(fromPath, router.replace);
                    } catch (error) {
                        if (error instanceof EmailVerificationCodeError) {
                            setVerificationCodeResetKey((key) => key + 1);
                            setVerificationAttemptsRemaining(error.attemptsRemaining);
                            setVerificationMessage(
                                error.attemptsRemaining > 0
                                    ? `${error.message} ${error.attemptsRemaining} ${
                                          error.attemptsRemaining === 1 ? "attempt" : "attempts"
                                      } remaining.`
                                    : "No attempts remaining. Request a new code to continue.",
                            );
                        }
                        toast.error("Unable to verify your email.", {
                            description: error instanceof Error ? error.message : "Please try again.",
                        });
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            />
        ) : null}
        </>
    );
}

function completeAuthRedirect(target: string, replace: (href: string) => void) {
    if (target.startsWith("/")) {
        replace(target);
        return;
    }

    window.location.assign(target);
}
