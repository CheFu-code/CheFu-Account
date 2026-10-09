"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Loader2, X } from "lucide-react";
import { useState } from "react";
import { apiUrl } from "../../lib/chefu-account";
import { getPasskeyDeviceName } from "../../lib/passkey-device";

export function PasskeyOfferDialog({
    appName,
    isSubmitting,
    onSkip,
    onComplete,
}: {
    appName: string;
    isSubmitting: boolean;
    onSkip: () => void;
    onComplete: () => void;
}) {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");

    async function createPasskey() {
        if (isCreating || isSubmitting) return;
        setIsCreating(true);
        setError("");

        try {
            if (!window.isSecureContext || !window.PublicKeyCredential) {
                throw new Error(
                    "This browser or device does not support passkeys here. You can skip and add one later from a supported device.",
                );
            }

            const optionsResponse = await fetch(
                apiUrl("/auth/passkey/register/options"),
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                },
            );
            if (!optionsResponse.ok) {
                throw new Error(await readApiError(optionsResponse));
            }

            const { challengeId, options } = await optionsResponse.json();
            const credential = await startRegistration(options);
            const verifyResponse = await fetch(
                apiUrl("/auth/passkey/register/verify"),
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        challengeId,
                        response: credential,
                        deviceName: getPasskeyDeviceName(),
                    }),
                },
            );
            if (!verifyResponse.ok) {
                throw new Error(await readApiError(verifyResponse));
            }

            onComplete();
        } catch (caught) {
            const message =
                caught instanceof Error ? caught.message : "Unable to create a passkey.";
            setError(
                caught instanceof DOMException && caught.name === "NotAllowedError"
                    ? "Passkey setup was cancelled or unavailable. You can try again or skip for now."
                    : message,
            );
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <div className="account-auth-dialog-overlay">
            <section
                aria-labelledby="passkey-offer-title"
                aria-modal="true"
                className="account-auth-dialog"
                role="dialog"
            >
                <div className="flex items-start justify-between gap-4">
                    <span className="account-auth-dialog-icon" aria-hidden="true">
                        <Fingerprint className="size-5" />
                    </span>
                    <button
                        type="button"
                        className="account-auth-password-toggle rounded-md p-2"
                        onClick={onSkip}
                        disabled={isCreating || isSubmitting}
                        aria-label="Skip passkey setup"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <h2 id="passkey-offer-title" className="mt-4 text-xl font-semibold">
                    Add a passkey?
                </h2>
                <p className="account-auth-muted mt-2 text-sm leading-6">
                    Sign in to {appName} faster and more securely with Face ID,
                    Touch ID, Windows Hello, or another supported screen lock.
                    Your device will ask you before creating it.
                </p>
                <p className="account-auth-muted mt-2 text-sm leading-6">
                    This is optional. You can skip it now and add a passkey later
                    in Security &amp; sign-in.
                </p>
                {error ? (
                    <p className="account-auth-dialog-error mt-4 text-sm" role="alert">
                        {error}
                    </p>
                ) : null}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className="account-auth-dialog-skip"
                        onClick={onSkip}
                        disabled={isCreating || isSubmitting}
                    >
                        Skip for now
                    </button>
                    <button
                        type="button"
                        className="account-auth-submit inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => void createPasskey()}
                        disabled={isCreating || isSubmitting}
                    >
                        {isCreating ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Fingerprint className="size-4" aria-hidden="true" />
                        )}
                        {isCreating ? "Creating passkey…" : "Create passkey"}
                    </button>
                </div>
            </section>
        </div>
    );
}

async function readApiError(response: Response) {
    const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
    };
    return data.message || data.error || "Unable to create a passkey.";
}
