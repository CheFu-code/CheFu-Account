"use client";

import { AlertTriangle, Eye, EyeOff, Loader2, ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AccountButton } from "../AccountPrimitives";
import type { ChefuAppId } from "../../../../lib/chefu-account";
import { useAccountDeletion } from "./useAccountDeletion";

export function AccountDeletionDialog({
    appId,
    email,
    onCancel,
}: {
    appId: ChefuAppId;
    email: string;
    onCancel: () => void;
}) {
    const deletion = useAccountDeletion({ appId, email });
    const [showPassword, setShowPassword] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const {
        acknowledged,
        code,
        confirmationEmailSent,
        isSubmitting,
        phase,
        password,
        reauthToken,
        resendCooldown,
        resendsRemaining,
        setAcknowledged,
        setCode,
        setPassword,
        submitHandler,
        resendEmailCode,
    } = deletion;

    if (!isMounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-deletion-title"
        >
            <div className="my-auto w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 text-[var(--fg)] shadow-2xl sm:p-7">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]">
                            {phase === "complete" ? (
                                <ShieldAlert className="size-5" aria-hidden="true" />
                            ) : (
                                <AlertTriangle className="size-5" aria-hidden="true" />
                            )}
                        </span>
                        <div>
                            <h2 id="account-deletion-title" className="text-xl font-semibold">
                                {phase === "complete"
                                    ? "Shared sign-in deleted"
                                    : "Delete your account?"}
                            </h2>
                            {phase !== "complete" ? (
                                <p className="mt-1 text-sm leading-6 text-[var(--fg-muted)]">
                                    This permanently deletes your shared sign-in account and ends
                                    all active sessions. You will lose access to all our apps and
                                    tools, along with the data associated with them. Certain
                                    records may be retained where required for legal or
                                    operational purposes.
                                </p>
                            ) : (
                                <div className="mt-1 space-y-2 text-sm leading-6 text-[var(--fg-muted)]">
                                    <p>
                                        We’re sorry to see you go. Your shared sign-in account
                                        has been deleted, and you have been signed out of all
                                        sessions.
                                    </p>
                                    {confirmationEmailSent ? (
                                        <p>
                                            A confirmation email has been sent to {email}.
                                        </p>
                                    ) : (
                                        <p>
                                            We couldn’t send the confirmation email. Your account
                                            deletion is complete; please contact support if you
                                            need confirmation.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {phase !== "complete" ? (
                        <AccountButton
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="account-button-icon"
                            aria-label="Cancel account deletion"
                        >
                            <X className="size-4" aria-hidden="true" />
                        </AccountButton>
                    ) : null}
                </div>

                {phase === "complete" ? (
                    <AccountButton
                        type="button"
                        variant="danger"
                        className="mt-6 w-full"
                        onClick={() => window.location.assign("/login")}
                    >
                        Return to sign in
                    </AccountButton>
                ) : (
                    <>
                        {phase === "password" ? (
                            <p className="mt-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-sm leading-6 text-[var(--danger)]">
                                Deleting your sign-in removes your access to our services.
                                Access to some associated content may not be recoverable.
                            </p>
                        ) : null}
                        <label className="mt-5 flex items-start gap-3 text-sm leading-6">
                            <input
                                type="checkbox"
                                checked={acknowledged}
                                onChange={(event) => setAcknowledged(event.target.checked)}
                                className="account-auth-checkbox mt-1 size-4 shrink-0"
                            />
                            <span>
                                I acknowledge that I will lose access to my shared sign-in
                                sessions, apps, tools, and associated data.
                            </span>
                        </label>

                        <form
                            onSubmit={(event) => {
                                event.stopPropagation();
                                void submitHandler(event);
                            }}
                            className="mt-5 space-y-4"
                        >
                            {phase === "password" ? (
                                <label
                                    className="block space-y-2"
                                    htmlFor="delete-account-password"
                                >
                                    <span className="text-sm font-medium">
                                        Confirm your password
                                    </span>
                                    <div className="relative">
                                        <input
                                            id="delete-account-password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 pr-12 text-sm text-[var(--fg)] outline-none focus:border-[var(--danger)] focus:ring-3 focus:ring-[var(--danger)]/15"
                                            autoComplete="current-password"
                                            autoFocus
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((visible) => !visible)}
                                            className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--fg-muted)] transition hover:text-[var(--fg)] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--accent)]"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            aria-pressed={showPassword}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-4" aria-hidden="true" />
                                            ) : (
                                                <Eye className="size-4" aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
                                </label>
                            ) : phase === "mfa-confirm" ? (
                                <p className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-sm leading-6 text-[var(--fg-muted)]">
                                    Your authenticator code was verified. Confirm below to
                                    permanently delete the shared sign-in.
                                </p>
                            ) : (
                                <label
                                    className="block space-y-2"
                                    htmlFor="delete-account-code"
                                >
                                    <span className="text-sm font-medium">
                                        {phase === "mfa"
                                            ? "Authenticator code"
                                            : "Email confirmation code"}
                                    </span>
                                    <input
                                        id="delete-account-code"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        value={code}
                                        onChange={(event) =>
                                            setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                                        }
                                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-center text-lg font-semibold tracking-[0.35em] text-[var(--fg)] outline-none focus:border-[var(--danger)] focus:ring-3 focus:ring-[var(--danger)]/15"
                                        autoComplete="one-time-code"
                                        autoFocus
                                        required
                                    />
                                    {phase === "email" ? (
                                        <p className="text-xs leading-5 text-[var(--fg-muted)]">
                                            This code expires in 10 minutes. Incorrect codes are
                                            limited.
                                        </p>
                                    ) : null}
                                </label>
                            )}
                            <AccountButton
                                type="submit"
                                variant="danger"
                                className="w-full"
                                disabled={
                                    isSubmitting ||
                                    !acknowledged ||
                                    (phase === "password"
                                        ? !password
                                        : phase === "mfa-confirm"
                                            ? !reauthToken
                                            : !/^\d{6}$/.test(code))
                                }
                            >
                                {isSubmitting ? (
                                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                ) : null}
                                {phase === "password"
                                    ? "Continue securely"
                                    : phase === "mfa"
                                        ? "Verify and delete account"
                                        : phase === "mfa-confirm"
                                            ? "Delete account"
                                            : "Verify email and delete account"}
                            </AccountButton>
                        </form>
                        {phase === "email" ? (
                            <button
                                type="button"
                                onClick={() => void resendEmailCode()}
                                disabled={
                                    isSubmitting ||
                                    !acknowledged ||
                                    resendCooldown > 0 ||
                                    resendsRemaining <= 0
                                }
                                className="mt-4 w-full text-sm font-medium text-[var(--danger)] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-55"
                            >
                                {resendsRemaining <= 0
                                    ? "Daily resend limit reached"
                                    : resendCooldown > 0
                                        ? `Resend code in ${resendCooldown}s`
                                        : `Resend code (${resendsRemaining} left)`}
                            </button>
                        ) : null}
                    </>
                )}
            </div>
        </div>,
        document.body,
    );
}
