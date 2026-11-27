"use client";

import { Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AccountButton } from "../AccountPrimitives";

export function ReauthenticationDialog({
    code,
    confirmNewPassword,
    email,
    isChangingPassword,
    isRevokingTrustedDevices,
    isSubmitting,
    onCancel,
    onCodeChange,
    onConfirmNewPasswordChange,
    onNewPasswordChange,
    onPasswordChange,
    onSubmit,
    newPassword,
    password,
    requiresMfa,
}: {
    code: string;
    confirmNewPassword: string;
    email: string;
    isChangingPassword: boolean;
    isRevokingTrustedDevices: boolean;
    isSubmitting: boolean;
    onCancel: () => void;
    onCodeChange: (value: string) => void;
    onConfirmNewPasswordChange: (value: string) => void;
    onNewPasswordChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    password: string;
    newPassword: string;
    requiresMfa: boolean;
}) {
    const [isMounted, setIsMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const validNewPassword =
        !isChangingPassword ||
        (newPassword.length >= 8 && newPassword === confirmNewPassword);
    const canSubmit =
        (requiresMfa ? code.length === 6 : password.length > 0) &&
        validNewPassword;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reauth-title"
        >
            <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 text-[var(--fg)] shadow-2xl sm:p-7">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div>
                            <h3
                                id="reauth-title"
                                className="text-xl font-semibold"
                            >
                                {isChangingPassword
                                    ? "Change your password"
                                    : isRevokingTrustedDevices
                                      ? "Revoke trusted-device access"
                                      : "Confirm your sign-in"}
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-[var(--fg-muted)]">
                                {isChangingPassword
                                    ? `Confirm your sign-in for ${email}, then choose a new password.`
                                    : isRevokingTrustedDevices
                                      ? requiresMfa
                                          ? "Enter your authenticator code to confirm revoking trusted-device access."
                                          : `Enter the password for ${email} to revoke trusted-device access.`
                                      : requiresMfa
                                        ? "Enter your authenticator code to finish confirming this change."
                                        : `Enter the password for ${email} to continue.`}
                            </p>
                        </div>
                    </div>
                    <AccountButton
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="account-button-icon"
                        aria-label="Cancel security confirmation"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </AccountButton>
                </div>

                <form
                    onSubmit={(event) => {
                        event.stopPropagation();
                        onSubmit(event);
                    }}
                    className="mt-5 space-y-4"
                >
                    {requiresMfa ? (
                        <label
                            className="block space-y-2"
                            htmlFor="reauth-code"
                        >
                            <span className="text-sm font-medium text-[var(--fg-2)]">
                                Authenticator code
                            </span>
                            <input
                                id="reauth-code"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={code}
                                onChange={(event) =>
                                    onCodeChange(
                                        event.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6),
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-center text-lg font-semibold tracking-[0.35em] text-[var(--fg)] outline-none focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent)]/15"
                                autoComplete="one-time-code"
                                autoFocus
                            />
                        </label>
                    ) : (
                        <label
                            className="block space-y-2"
                            htmlFor="reauth-password"
                        >
                            <span className="text-sm font-medium text-[var(--fg-2)]">
                                Password
                            </span>
                            <div className="relative">
                                <input
                                    id="reauth-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(event) =>
                                        onPasswordChange(event.target.value)
                                    }
                                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 pr-12 text-sm text-[var(--fg)] outline-none focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent)]/15"
                                    autoComplete="current-password"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((visible) => !visible)
                                    }
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--fg-muted)] transition hover:text-[var(--fg)] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--accent)]"
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? (
                                        <EyeOff
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Eye
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>
                            </div>
                        </label>
                    )}
                    {isChangingPassword ? (
                        <>
                            <label
                                className="block space-y-2"
                                htmlFor="new-account-password"
                            >
                                <span className="text-sm font-medium text-[var(--fg-2)]">
                                    New password
                                </span>
                                <div className="relative">
                                    <input
                                        id="new-account-password"
                                        type={
                                            showNewPassword ? "text" : "password"
                                        }
                                        value={newPassword}
                                        onChange={(event) =>
                                            onNewPasswordChange(
                                                event.target.value,
                                            )
                                        }
                                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 pr-12 text-sm text-[var(--fg)] outline-none focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent)]/15"
                                        autoComplete="new-password"
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNewPassword(
                                                (visible) => !visible,
                                            )
                                        }
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--fg-muted)] transition hover:text-[var(--fg)] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--accent)]"
                                        aria-label={
                                            showNewPassword
                                                ? "Hide new password"
                                                : "Show new password"
                                        }
                                        aria-pressed={showNewPassword}
                                    >
                                        {showNewPassword ? (
                                            <EyeOff
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Eye
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </button>
                                </div>
                            </label>
                            <label
                                className="block space-y-2"
                                htmlFor="confirm-account-password"
                            >
                                <span className="text-sm font-medium text-[var(--fg-2)]">
                                    Confirm new password
                                </span>
                                <div className="relative">
                                    <input
                                        id="confirm-account-password"
                                        type={
                                            showConfirmNewPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={confirmNewPassword}
                                        onChange={(event) =>
                                            onConfirmNewPasswordChange(
                                                event.target.value,
                                            )
                                        }
                                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 pr-12 text-sm text-[var(--fg)] outline-none focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent)]/15"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmNewPassword(
                                                (visible) => !visible,
                                            )
                                        }
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--fg-muted)] transition hover:text-[var(--fg)] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--accent)]"
                                        aria-label={
                                            showConfirmNewPassword
                                                ? "Hide confirm password"
                                                : "Show confirm password"
                                        }
                                        aria-pressed={showConfirmNewPassword}
                                    >
                                        {showConfirmNewPassword ? (
                                            <EyeOff
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Eye
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </button>
                                </div>
                            </label>
                            <p className="text-xs leading-5 text-[var(--fg-muted)]">
                                Use at least 8 characters. The new password is
                                saved only after your sign-in is confirmed.
                            </p>
                        </>
                    ) : null}

                    <AccountButton
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting || !canSubmit}
                        className="account-button-full"
                    >
                        {isSubmitting ? (
                            <Loader2
                                className="size-4 mr-1.5 animate-spin"
                                aria-hidden="true"
                            />
                        ) : (
                            <KeyRound
                                className="size-4 mr-1.5"
                                aria-hidden="true"
                            />
                        )}
                        {isChangingPassword
                            ? "Change password"
                            : isRevokingTrustedDevices
                              ? "Confirm and revoke"
                              : "Continue"}
                    </AccountButton>
                </form>
            </div>
        </div>,
        document.body,
    );
}
