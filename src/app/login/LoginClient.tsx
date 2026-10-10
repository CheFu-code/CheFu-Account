"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    useMemo,
    useRef,
    useState,
    type ClipboardEvent,
    type FormEvent,
    type KeyboardEvent,
    useEffect,
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
    const [trustedDeviceResendCooldown, setTrustedDeviceResendCooldown] = useState(0);
    const [trustedDeviceResendsRemaining, setTrustedDeviceResendsRemaining] = useState(0);
    const [isVerifyingTrustedDevice, setIsVerifyingTrustedDevice] = useState(false);
    const [isResendingTrustedDeviceCode, setIsResendingTrustedDeviceCode] = useState(false);
    const [trustDeviceVerificationOpen, setTrustDeviceVerificationOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [mfaEmail, setMfaEmail] = useState("");
    const [mfaPendingCredential, setMfaPendingCredential] = useState("");
    const [mfaEnrollmentId, setMfaEnrollmentId] = useState("");
    const passkey = usePasskeySignIn();
    const trustedDeviceCodeRefs = useRef<Array<HTMLInputElement | null>>([]);
    const trustedDeviceFormRef = useRef<HTMLFormElement | null>(null);
    const lastAutoSubmittedTrustedDeviceCode = useRef("");

    useEffect(() => {
        if (trustedDeviceResendCooldown <= 0) return;
        const timer = window.setTimeout(
            () => setTrustedDeviceResendCooldown((remaining) => Math.max(0, remaining - 1)),
            1000,
        );
        return () => window.clearTimeout(timer);
    }, [trustedDeviceResendCooldown]);

    useEffect(() => {
        const code = trustedDeviceCode.replace(/\s/g, "");
        if (!trustDeviceVerificationOpen || !/^\d{6}$/.test(code)) {
            lastAutoSubmittedTrustedDeviceCode.current = "";
            return;
        }
        if (
            isVerifyingTrustedDevice ||
            lastAutoSubmittedTrustedDeviceCode.current === code
        ) {
            return;
        }

        const form = trustedDeviceFormRef.current;
        if (!form) return;
        lastAutoSubmittedTrustedDeviceCode.current = code;
        form.requestSubmit();
    }, [isVerifyingTrustedDevice, trustDeviceVerificationOpen, trustedDeviceCode]);

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
        trustDeviceResendCooldownSeconds?: number;
        trustDeviceResendsRemaining?: number;
    }) {
        if (result.trustDeviceVerificationRequired) {
            setTrustDeviceVerificationOpen(true);
            setTrustedDeviceCode("");
            setTrustedDeviceResendCooldown(result.trustDeviceResendCooldownSeconds || 0);
            setTrustedDeviceResendsRemaining(result.trustDeviceResendsRemaining || 0);
            if ((result.trustDeviceResendsRemaining || 0) > 0) {
                toast.info("Enter the code sent to your email to trust this device.");
            } else {
                toast.warning("You have reached the daily trusted-device code limit.");
            }
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
            setMfaCode("");
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
        const normalizedCode = trustedDeviceCode.replace(/\s/g, "");
        if (!/^\d{6}$/.test(normalizedCode)) {
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
                body: JSON.stringify({ code: normalizedCode }),
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
            setTrustedDeviceCode("");
            trustedDeviceCodeRefs.current[0]?.focus();
            toast.error("Unable to verify this device.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsVerifyingTrustedDevice(false);
        }
    }

    function updateTrustedDeviceCode(index: number, value: string) {
        const enteredDigits = value.replace(/\D/g, "");
        const currentDigits = trustedDeviceCode.split(" ");
        const nextDigits = Array.from({ length: 6 }, (_, digitIndex) =>
            currentDigits[digitIndex] && /\d/.test(currentDigits[digitIndex])
                ? currentDigits[digitIndex]
                : "",
        );
        if (!enteredDigits) {
            nextDigits[index] = "";
            setTrustedDeviceCode(nextDigits.join(" "));
            return;
        }

        const pastedDigits = enteredDigits.slice(0, 6 - index);
        for (let offset = 0; offset < pastedDigits.length; offset += 1) {
            nextDigits[index + offset] = pastedDigits[offset];
        }
        setTrustedDeviceCode(nextDigits.join(" "));
        trustedDeviceCodeRefs.current[Math.min(index + pastedDigits.length, 5)]?.focus();
    }

    function handleTrustedDeviceCodeKeyDown(
        index: number,
        event: KeyboardEvent<HTMLInputElement>,
    ) {
        if (
            event.key === "Backspace" &&
            !/\d/.test(trustedDeviceCode.split(" ")[index] || "") &&
            index > 0
        ) {
            trustedDeviceCodeRefs.current[index - 1]?.focus();
        } else if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            trustedDeviceCodeRefs.current[index - 1]?.focus();
        } else if (event.key === "ArrowRight" && index < 5) {
            event.preventDefault();
            trustedDeviceCodeRefs.current[index + 1]?.focus();
        }
    }

    function handleTrustedDeviceCodePaste(event: ClipboardEvent<HTMLInputElement>) {
        event.preventDefault();
        const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        setTrustedDeviceCode(pastedCode.split("").join(" "));
        trustedDeviceCodeRefs.current[Math.min(pastedCode.length, 5)]?.focus();
    }

    async function resendTrustedDeviceCode() {
        if (
            isResendingTrustedDeviceCode ||
            trustedDeviceResendCooldown > 0 ||
            trustedDeviceResendsRemaining <= 0
        ) return;
        setIsResendingTrustedDeviceCode(true);
        try {
            const response = await fetch(apiUrl("/auth/trusted-devices/email-challenge"), {
                method: "POST",
                credentials: "include",
                headers: { "x-chefu-app": appId },
            });
            const result = (await response.json().catch(() => ({}))) as {
                message?: string;
                error?: string;
                cooldownSeconds?: number;
                resendsRemaining?: number;
                retryAfterSeconds?: number;
                retryAfter?: number;
            };
            if (!response.ok) {
                const retryAfterSeconds =
                    result.retryAfterSeconds ?? result.retryAfter;
                if (typeof retryAfterSeconds === "number") {
                    setTrustedDeviceResendCooldown(retryAfterSeconds);
                }
                if (typeof result.resendsRemaining === "number") {
                    setTrustedDeviceResendsRemaining(result.resendsRemaining);
                }
                throw new Error(result.message || result.error || "Unable to resend the code.");
            }
            setTrustedDeviceResendCooldown(result.cooldownSeconds || 0);
            setTrustedDeviceResendsRemaining(result.resendsRemaining || 0);
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
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="trusted-device-title"
                >
                    <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 text-[var(--fg)] shadow-xl sm:p-6">
                        <h2 id="trusted-device-title" className="text-xl font-semibold text-[var(--fg)]">
                            Verify this device
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--fg-muted)]">
                            Enter the 6-digit code sent to {email}. This device will be trusted for 90 days.
                        </p>
                        <form
                            ref={trustedDeviceFormRef}
                            onSubmit={verifyTrustedDevice}
                            className="mt-5 space-y-4"
                        >
                            <fieldset className="space-y-2">
                                <legend className="text-sm font-medium text-[var(--fg-2)]">
                                    Email code
                                </legend>
                                <div className="grid grid-cols-6 gap-2">
                                    {Array.from({ length: 6 }, (_, index) => (
                                        <input
                                            key={index}
                                            ref={(element) => {
                                                trustedDeviceCodeRefs.current[index] = element;
                                            }}
                                            aria-label={`Email verification code digit ${index + 1}`}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={6}
                                            value={trustedDeviceCode.split(" ")[index] ?? ""}
                                            onChange={(event) =>
                                                updateTrustedDeviceCode(index, event.target.value)
                                            }
                                            onKeyDown={(event) =>
                                                handleTrustedDeviceCodeKeyDown(index, event)
                                            }
                                            onPaste={handleTrustedDeviceCodePaste}
                                            className="aspect-square w-full min-w-0 max-w-12 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-center text-xl font-semibold text-[var(--fg)] outline-none transition hover:border-[var(--accent)] focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent)]/15 sm:max-w-14"
                                            autoComplete={index === 0 ? "one-time-code" : "off"}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </fieldset>
                            <button
                                type="submit"
                                disabled={
                                    isVerifyingTrustedDevice ||
                                    !/^\d{6}$/.test(
                                        trustedDeviceCode.replace(/\s/g, ""),
                                    )
                                }
                                className="h-11 w-full rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] disabled:opacity-60"
                            >
                                {isVerifyingTrustedDevice ? "Verifying…" : "Verify and trust device"}
                            </button>
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <button
                                    type="button"
                                    onClick={() => void resendTrustedDeviceCode()}
                                    disabled={
                                        isResendingTrustedDeviceCode ||
                                        isVerifyingTrustedDevice ||
                                        trustedDeviceResendCooldown > 0 ||
                                        trustedDeviceResendsRemaining <= 0
                                    }
                                    className="text-[var(--accent)] underline underline-offset-4 hover:text-[var(--accent-hover)] disabled:opacity-50"
                                >
                                    {isResendingTrustedDeviceCode
                                        ? "Sending…"
                                        : trustedDeviceResendsRemaining <= 0
                                          ? "Daily resend limit reached"
                                          : trustedDeviceResendCooldown > 0
                                            ? `Send a new code in ${trustedDeviceResendCooldown}s`
                                            : `Send a new code (${trustedDeviceResendsRemaining} left)`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTrustDeviceVerificationOpen(false);
                                        setTrustDevice(false);
                                        completeAuthRedirect(fromPath, router.replace);
                                    }}
                                    disabled={isVerifyingTrustedDevice}
                                    className="text-[var(--fg-muted)] underline underline-offset-4 hover:text-[var(--fg)] disabled:opacity-50"
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