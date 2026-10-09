"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AccountAuthScreen } from "../_components/AccountAuthScreen";
import { auth } from "../../lib/firebase";
import {
    chefuAppLabel,
    preserveAuthParams,
    resolveChefuApp,
    safeReturnTo,
    sendEmailVerificationCode,
    syncChefuAccountSession,
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
            await sendEmailVerificationCode(normalizedEmail, displayName);
            setVerificationEmail(normalizedEmail);
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
                onCancel={() => {
                    setVerificationOpen(false);
                    setPassword("");
                }}
                onResend={async () => {
                    setIsSubmitting(true);
                    try {
                        await sendEmailVerificationCode(
                            verificationEmail,
                            `${firstName.trim()} ${lastName.trim()}`,
                        );
                        toast.success("A new verification code was sent.");
                    } catch (error) {
                        toast.error("Unable to resend the verification code.", {
                            description: error instanceof Error ? error.message : "Please try again.",
                        });
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
                        );
                        const credential = await signInWithEmailAndPassword(
                            auth,
                            verificationEmail,
                            password,
                        );
                        await syncChefuAccountSession(await credential.user.getIdToken(true), appId);
                        toast.success(`Account created for ${appName}.`);
                        completeAuthRedirect(fromPath, router.replace);
                    } catch (error) {
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
