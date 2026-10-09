"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AccountAuthScreen } from "../_components/AccountAuthScreen";
import {
    chefuAppLabel,
    preserveAuthParams,
    requestPasswordResetEmail,
    resolveChefuApp,
    safeReturnTo,
} from "../../lib/chefu-account";

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
            const returnTo = safeReturnTo(
                searchParams.get("returnTo") || searchParams.get("next"),
                appId,
                "/account",
            );
            await requestPasswordResetEmail(normalizedEmail, appId, returnTo);
            toast.success(readResetSuccessMessage(normalizedEmail));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to send reset email. Please try again.",
            );
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

function readResetSuccessMessage(email: string) {
    return `If an account exists for ${email}, a reset email is on its way.`;
}
