"use client";

import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
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
    syncChefuAccountSession,
} from "../../lib/chefu-account";

export function RegisterClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        if (!email || !password) {
            toast.error("Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);

        let registered = false;

        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            registered = true;
            const idToken = await credential.user.getIdToken(true);
            await syncChefuAccountSession(idToken, appId);
            toast.success(`CheFu Account created for ${appName}.`);
            completeAuthRedirect(fromPath, router.replace);
        } catch (error) {
            if (registered) {
                await signOut(auth).catch(() => undefined);
                toast.error(`Unable to continue to ${appName}.`, {
                    description:
                        error instanceof Error ? error.message : "Please sign in again.",
                });
            } else {
                toast.error(readFirebaseRegisterError(error));
            }
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
            mode="register"
            onSubmit={onSubmit}
            password={password}
            setEmail={setEmail}
            setPassword={setPassword}
        />
    );
}

function completeAuthRedirect(target: string, replace: (href: string) => void) {
    if (target.startsWith("/")) {
        replace(target);
        return;
    }

    window.location.assign(target);
}

function readFirebaseRegisterError(error: unknown) {
    if (!(error instanceof FirebaseError)) {
        return "Unable to register. Please try again.";
    }

    switch (error.code) {
        case "auth/email-already-in-use":
            return "This email is already registered. Try logging in.";
        case "auth/invalid-email":
            return "Invalid email format. Please check your email.";
        case "auth/operation-not-allowed":
            return "Email/password registration is not enabled for this project.";
        case "auth/weak-password":
            return "Password is too weak. Use at least 6 characters.";
        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";
        case "auth/invalid-api-key":
            return "Invalid Firebase API key. Contact support.";
        default:
            return "Registration failed. Please try again.";
    }
}
