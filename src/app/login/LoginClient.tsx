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
    apiUrl,
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
    const [trustDevice, setTrustDevice] = useState(false);
    const [trustedDeviceCode, setTrustedDeviceCode] = useState("");
    const [isVerifyingTrustedDevice, setIsVerifyingTrustedDevice] = useState(false);
    const [isResendingTrustedDeviceCode, setIsResendingTrustedDeviceCode] = useState(false);
    const [trustDeviceVerificationOpen, setTrustDeviceVerificationOpen] = useState(false);
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

    function handleSessionComplete(result: {
        trustDeviceVerificationRequired?: boolean;
        trustDeviceRequiresAuthenticator?: boolean;
    }) {
        if (result.trustDeviceVerificationRequired) {
            setTrustDeviceVerificationOpen(true);
            setTrustedDeviceCode("");
            toast.info("Enter the code sent to your email to trust this device.");
            return;
        }
        if (result.trustDeviceRequiresAuthenticator) {
            toast.warning(
                "This account requires an authenticator code before a device can be trusted. Sign in with your password and complete 2FA.",
            );
            setTrustDevice(false);
        }
        completeAuthRedirect(fromPath, router.replace);
    }

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email || !password) {
            toast.error("Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await loginWithPassword(email, password, appId, trustDevice);
            toast.success(`Signed in to ${appName}.`);
            handleSessionComplete(result);
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
            const result = await completePasswordMfaSession(
                mfaEmail,
                mfaPendingCredential,
                mfaEnrollmentId,
                mfaCode,
                appId,
                trustDevice,
            );
            toast.success(`Signed in to ${appName}.`);
            handleSessionComplete(result);
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
            const result = await passkey.signInWithPasskey(appId, trustDevice);
            if (!result) {
                setIsSubmitting(false);
                return;
            }

            toast.success(`Signed in to ${appName}.`);
            handleSessionComplete(result);
        } catch (error) {
            toast.error("Passkey sign-in failed.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    async function verifyTrustedDevice(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!/^\d{6}$/.test(trustedDeviceCode)) {
            toast.error("Enter the 6-digit code from your email.");
            return;
        }
        setIsVerifyingTrustedDevice(true);
        try {
            const response = await fetch(apiUrl("/auth/trusted-devices/email-verify"), {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "x-chefu-app": appId,
                },
                body: JSON.stringify({ code: trustedDeviceCode }),
            });
            const result = (await response.json().catch(() => ({}))) as {
                message?: string;
                error?: string;
            };
            if (!response.ok) {
                throw new Error(result.message || result.error || "Unable to verify this device.");
            }
            toast.success("This device is trusted for 90 days.");
            setTrustDeviceVerificationOpen(false);
            completeAuthRedirect(fromPath, router.replace);
        } catch (error) {
            toast.error("Unable to verify this device.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsVerifyingTrustedDevice(false);
        }
    }

    async function resendTrustedDeviceCode() {
        setIsResendingTrustedDeviceCode(true);
        try {
            const response = await fetch(apiUrl("/auth/trusted-devices/email-resend"), {
                method: "POST",
                credentials: "include",
                headers: { "x-chefu-app": appId },
            });
            const result = (await response.json().catch(() => ({}))) as {
                message?: string;
                error?: string;
            };
            if (!response.ok) {
                throw new Error(result.message || result.error || "Unable to resend the code.");
            }
            setTrustedDeviceCode("");
            toast.success("A new trusted-device code was sent.");
        } catch (error) {
            toast.error("Unable to resend the trusted-device code.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsResendingTrustedDeviceCode(false);
        }
    }

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
                trustDevice={trustDevice}
                setTrustDevice={setTrustDevice}
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
            {trustDeviceVerificationOpen ? (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="trusted-device-title"
                >
                    <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-xl">
                        <h2 id="trusted-device-title" className="text-xl font-semibold">
                            Verify this device
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-stone-600">
                            Enter the 6-digit code sent to {email}. This device will be trusted for 90 days.
                        </p>
                        <form onSubmit={verifyTrustedDevice} className="mt-5 space-y-4">
                            <label className="block space-y-2" htmlFor="trusted-device-code">
                                <span className="text-sm font-medium text-stone-800">Email code</span>
                                <input
                                    id="trusted-device-code"
                                    autoComplete="one-time-code"
                                    autoFocus
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={trustedDeviceCode}
                                    onChange={(event) =>
                                        setTrustedDeviceCode(
                                            event.target.value.replace(/\D/g, "").slice(0, 6),
                                        )
                                    }
                                    className="h-12 w-full rounded-lg border border-stone-300 px-4 text-center text-lg tracking-[0.35em] outline-none focus:border-amber-700 focus:ring-3 focus:ring-amber-700/15"
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={isVerifyingTrustedDevice || trustedDeviceCode.length !== 6}
                                className="h-11 w-full rounded-lg bg-amber-800 px-4 text-sm font-semibold text-white hover:bg-amber-900 disabled:opacity-60"
                            >
                                {isVerifyingTrustedDevice ? "Verifying…" : "Verify and trust device"}
                            </button>
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <button
                                    type="button"
                                    onClick={() => void resendTrustedDeviceCode()}
                                    disabled={isResendingTrustedDeviceCode || isVerifyingTrustedDevice}
                                    className="text-amber-800 underline underline-offset-4 disabled:opacity-50"
                                >
                                    {isResendingTrustedDeviceCode ? "Sending…" : "Send a new code"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTrustDeviceVerificationOpen(false);
                                        setTrustDevice(false);
                                        completeAuthRedirect(fromPath, router.replace);
                                    }}
                                    disabled={isVerifyingTrustedDevice}
                                    className="text-stone-600 underline underline-offset-4 disabled:opacity-50"
                                >
                                    Continue without trusting
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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