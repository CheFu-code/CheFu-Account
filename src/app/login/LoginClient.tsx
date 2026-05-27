"use client";

import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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

export function LoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const attemptedExistingSession = useRef(false);

    const appId = resolveChefuApp(searchParams.get("app"));
    const appName = chefuAppLabel(appId);
    const fromPath = safeReturnTo(
        searchParams.get("returnTo") || searchParams.get("next"),
        "/account",
    );
    const registerHref = useMemo(
        () => preserveAuthParams("/register", new URLSearchParams(searchParams.toString())),
        [searchParams],
    );

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user || isSubmitting || attemptedExistingSession.current) return;

            attemptedExistingSession.current = true;
            setIsSubmitting(true);
            user.getIdToken(true)
                .then((idToken) => syncChefuAccountSession(idToken, appId))
                .then(() => completeAuthRedirect(fromPath, router.replace))
                .catch((error) => {
                    toast.error("Unable to continue your CheFu Account session.", {
                        description:
                            error instanceof Error ? error.message : "Please sign in again.",
                    });
                    setIsSubmitting(false);
                });
        });

        return () => unsubscribe();
    }, [appId, fromPath, isSubmitting, router]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email || !password) {
            toast.error("Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);

        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await credential.user.getIdToken(true);
            await syncChefuAccountSession(idToken, appId);
            toast.success(`Signed in to ${appName}.`);
            completeAuthRedirect(fromPath, router.replace);
        } catch (error) {
            toast.error(readFirebaseLoginError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AccountAuthScreen
            alternateHref={registerHref}
            appName={appName}
            email={email}
            isSubmitting={isSubmitting}
            mode="login"
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

function readFirebaseLoginError(error: unknown) {
    if (!(error instanceof FirebaseError)) {
        return "Unable to login. Please try again.";
    }

    switch (error.code) {
        case "auth/invalid-email":
            return "Invalid email format. Please check your email.";
        case "auth/user-disabled":
            return "This account has been disabled. Contact support.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Invalid email or password.";
        case "auth/too-many-requests":
            return "Too many login attempts. Please wait and try again later.";
        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";
        case "auth/operation-not-allowed":
            return "Email/password login is not enabled for this project.";
        case "auth/invalid-api-key":
            return "Invalid Firebase API key. Contact support.";
        default:
            return "Login failed. Please try again.";
    }
}
