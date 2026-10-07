"use client";

import { FirebaseError } from "firebase/app";
import {
    getMultiFactorResolver,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    TotpMultiFactorGenerator,
    type MultiFactorError,
    type MultiFactorResolver,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
} from "react";
import { toast } from "sonner";
import {
    chefuAppLabel,
    preserveAuthParams,
    resolveChefuApp,
    safeReturnTo,
    syncChefuAccountSession,
} from "../../lib/chefu-account";
import { auth } from "../../lib/firebase";
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
    const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
    const attemptedExistingSession = useRef(false);
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

    const createBackendSession = useCallback(
        async (user: NonNullable<typeof auth.currentUser>) => {
            const idToken = await user.getIdToken(true);
            await syncChefuAccountSession(idToken, appId);
            toast.success(`Signed in to ${appName}.`);
            completeAuthRedirect(fromPath, router.replace);
        },
        [appId, appName, fromPath, router],
    );

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user || isSubmitting || attemptedExistingSession.current) return;

            attemptedExistingSession.current = true;
            setIsSubmitting(true);
            createBackendSession(user)
                .then(() => setIsSubmitting(false))
                .catch(async (error) => {
                    await signOut(auth).catch(() => undefined);
                    toast.error(`Unable to continue to ${appName}.`, {
                        description:
                            error instanceof Error ? error.message : "Please sign in again.",
                    });
                    setIsSubmitting(false);
                });
        });

        return () => unsubscribe();
    }, [appName, createBackendSession, isSubmitting]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email || !password) {
            toast.error("Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);

        let signedIn = false;

        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            signedIn = true;
            await createBackendSession(credential.user);
        } catch (error) {
            if (signedIn) {
                attemptedExistingSession.current = true;
                await signOut(auth).catch(() => undefined);
                toast.error(`Unable to continue to ${appName}.`, {
                    description:
                        error instanceof Error ? error.message : "Please sign in again.",
                });
            } else if (isMfaRequiredError(error)) {
                const resolver = getMultiFactorResolver(auth, error);
                const totpHint = resolver.hints.find(
                    (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID,
                );

                if (!totpHint) {
                    toast.error("This account requires MFA, but no authenticator factor is available.");
                    return;
                }

                setMfaResolver(resolver);
                setMfaEmail(email);
                setMfaCode("");
                toast.info("Enter your authenticator code to finish signing in.");
            } else {
                toast.error(readFirebaseLoginError(error));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const onMfaSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!mfaResolver || mfaCode.length !== 6) {
            toast.error("Enter the 6-digit authenticator code.");
            return;
        }

        const totpHint = mfaResolver.hints.find(
            (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID,
        );

        if (!totpHint) {
            toast.error("No authenticator factor is available for this sign-in.");
            return;
        }

        setIsSubmitting(true);

        try {
            const assertion = TotpMultiFactorGenerator.assertionForSignIn(
                totpHint.uid,
                mfaCode,
            );
            const credential = await mfaResolver.resolveSignIn(assertion);
            await createBackendSession(credential.user);
            setMfaResolver(null);
            setMfaCode("");
        } catch (error) {
            toast.error("Unable to verify your 2FA code.", {
                description: readFirebaseMfaError(error),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onPasskeySignIn = async () => {
        setIsSubmitting(true);

        try {
            const credential = await passkey.signInWithPasskey();
            if (!credential) {
                setIsSubmitting(false);
                return;
            }

            await createBackendSession(credential.user);
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
                open={Boolean(mfaResolver)}
                onCancel={() => {
                    setMfaResolver(null);
                    setMfaCode("");
                }}
                onCodeChange={setMfaCode}
                onSubmit={onMfaSubmit}
            />
        </>
    );
}

function isMfaRequiredError(error: unknown): error is MultiFactorError {
    return error instanceof FirebaseError && error.code === "auth/multi-factor-auth-required";
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

function readFirebaseMfaError(error: unknown) {
    if (!(error instanceof FirebaseError)) {
        return error instanceof Error ? error.message : "Check the code and try again.";
    }

    switch (error.code) {
        case "auth/invalid-verification-code":
        case "auth/invalid-totp-code":
            return "The authenticator code is incorrect.";
        case "auth/code-expired":
            return "That code expired. Try the next code.";
        case "auth/too-many-requests":
            return "Too many attempts. Please wait and try again.";
        default:
            return error.message || "Check the code and try again.";
    }
}