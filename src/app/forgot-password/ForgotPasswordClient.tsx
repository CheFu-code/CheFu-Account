"use client";

import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AccountAuthScreen } from "../_components/AccountAuthScreen";
import { accountAppUrl, chefuAppLabel, preserveAuthParams, resolveChefuApp } from "../../lib/chefu-account";
import { auth } from "../../lib/firebase";

export function ForgotPasswordClient() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const appId = resolveChefuApp(searchParams.get("app"));
    const appName = chefuAppLabel(appId);
    const loginHref = useMemo(
        () => preserveAuthParams("/login", new URLSearchParams(searchParams.toString())),
        [searchParams],
    );

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
            toast.error("Please enter your email.");
            return;
        }

        setIsSubmitting(true);

        try {
            await sendPasswordResetEmail(auth, normalizedEmail, {
                handleCodeInApp: false,
                url: buildContinueUrl(loginHref),
            });
            toast.success(readResetSuccessMessage(normalizedEmail));
        } catch (error) {
            if (isUserNotFoundError(error)) {
                toast.success(readResetSuccessMessage(normalizedEmail));
                return;
            }

            toast.error(readPasswordResetError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AccountAuthScreen
            alternateHref={loginHref}
            appName={appName}
            email={email}
            isSubmitting={isSubmitting}
            mode="forgot-password"
            onSubmit={onSubmit}
            setEmail={setEmail}
        />
    );
}

function buildContinueUrl(loginHref: string) {
    if (typeof window !== "undefined") {
        return new URL(loginHref, window.location.origin).toString();
    }

    return accountAppUrl(loginHref);
}

function readResetSuccessMessage(email: string) {
    return `If a CHEFU Account exists for ${email}, a reset email is on its way.`;
}

function isUserNotFoundError(error: unknown) {
    return error instanceof FirebaseError && error.code === "auth/user-not-found";
}

function readPasswordResetError(error: unknown) {
    if (!(error instanceof FirebaseError)) {
        return "Unable to send reset email. Please try again.";
    }

    switch (error.code) {
        case "auth/invalid-email":
        case "auth/missing-email":
            return "Invalid email format. Please check your email.";
        case "auth/too-many-requests":
            return "Too many reset attempts. Please wait and try again later.";
        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";
        case "auth/operation-not-allowed":
            return "Email/password login is not enabled for this project.";
        case "auth/invalid-api-key":
            return "Invalid Firebase API key. Contact support.";
        default:
            return "Unable to send reset email. Please try again.";
    }
}
