"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    useMemo,
    useState,
    type FormEvent,
} from "react";
import { toast } from "sonner";
import {
    chefuAppLabel,
    completePasswordMfaSession,
    loginWithPassword,
    MfaRequiredLoginError,
    preserveAuthParams,
    resolveChefuApp,
    safeReturnTo,
} from "../../lib/chefu-account";
import { AccountAuthScreen } from "../_components/AccountAuthScreen";
import { MfaChallengeDialog } from "./MfaChallengeDialog";
import { usePasskeySignIn } from "./usePasskeySignIn";

export function LoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [mfaEmail, setMfaEmail] = useState("");
    const [mfaPendingCredential, setMfaPendingCredential] = useState("");
    const [mfaEnrollmentId, setMfaEnrollmentId] = useState("");
    const passkey = usePasskeySignIn();

    const appId = resolveChefuApp(searchParams.get("app"));
    const appName = chefuAppLabel(appId);
    const fromPath = safeReturnTo(
        searchParams.get("returnTo") || searchParams.get("next"),
        appId,
        "/account",
    );
    const registerHref = useMemo(
        () => preserveAuthParams("/register", new URLSearchParams(searchParams.toString())),
        [searchParams],
    );
    const forgotPasswordHref = useMemo(
        () =>
            preserveAuthParams(
                "/forgot-password",
                new URLSearchParams(searchParams.toString()),
            ),
        [searchParams],
    );

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email || !password) {
            toast.error("Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);

        try {
            await loginWithPassword(email, password, appId);
            toast.success(`Signed in to ${appName}.`);
            completeAuthRedirect(fromPath, router.replace);
        } catch (error) {
            if (error instanceof MfaRequiredLoginError) {
                setMfaPendingCredential(error.pendingCredential);
                setMfaEnrollmentId(error.enrollmentId);
                setMfaEmail(email);
                setMfaCode("");
                toast.info("Enter your authenticator code to finish signing in.");
            } else {
                toast.error(readLoginError(error));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const onMfaSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!mfaPendingCredential || !mfaEnrollmentId || mfaCode.length !== 6) {
            toast.error("Enter the 6-digit authenticator code.");
            return;
        }

        setIsSubmitting(true);

        try {
            await completePasswordMfaSession(
                mfaEmail,
                mfaPendingCredential,
                mfaEnrollmentId,
                mfaCode,
                appId,
            );
            toast.success(`Signed in to ${appName}.`);
            completeAuthRedirect(fromPath, router.replace);
            setMfaPendingCredential("");
            setMfaEnrollmentId("");
            setMfaCode("");
        } catch (error) {
            toast.error("Unable to verify your 2FA code.", {
                description: readMfaError(error),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onPasskeySignIn = async () => {
        setIsSubmitting(true);

        try {
            const signedIn = await passkey.signInWithPasskey(appId);
            if (!signedIn) {
                setIsSubmitting(false);
                return;
            }

            toast.success(`Signed in to ${appName}.`);
            completeAuthRedirect(fromPath, router.replace);
        } catch (error) {
            toast.error("Passkey sign-in failed.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <AccountAuthScreen
                alternateHref={registerHref}
                appName={appName}
                email={email}
                forgotPasswordHref={forgotPasswordHref}
                isSubmitting={isSubmitting}
                mode="login"
                onSubmit={onSubmit}
                onPasskeyClick={onPasskeySignIn}
                isPasskeySubmitting={passkey.isAuthenticating}
                password={password}
                setEmail={setEmail}
                setPassword={setPassword}
            />
            <MfaChallengeDialog
                code={mfaCode}
                email={mfaEmail}
                isSubmitting={isSubmitting}
                open={Boolean(mfaPendingCredential)}
                onCancel={() => {
                    setMfaPendingCredential("");
                    setMfaEnrollmentId("");
                    setMfaCode("");
                }}
                onCodeChange={setMfaCode}
                onSubmit={onMfaSubmit}
            />
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

function readLoginError(error: unknown) {
    if (!(error instanceof Error)) {
        return "Unable to login. Please try again.";
    }
    return error.message || "Login failed. Please try again.";
}

function readMfaError(error: unknown) {
    if (!(error instanceof Error)) {
        return "Check the code and try again.";
    }
    return error.message || "Check the code and try again.";
}