"use client";

import { KeyRound, Loader2, ShieldCheck, X } from "lucide-react";
import type { FormEvent } from "react";
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
    const validNewPassword =
        !isChangingPassword ||
        (newPassword.length >= 8 && newPassword === confirmNewPassword);
    const canSubmit =
        (requiresMfa ? code.length === 6 : password.length > 0) && validNewPassword;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reauth-title"
        >
            <div className="w-full max-w-md rounded-[2rem] border border-white/12 bg-[#1a1916] p-6 text-[#f4f0e8] shadow-2xl shadow-black/50">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e5ad5b]/22 bg-[#e5ad5b]/10 text-[#ffd18a]">
                            <ShieldCheck className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h3 id="reauth-title" className="text-xl font-semibold">
                                {isChangingPassword
                                    ? "Change your password"
                                    : isRevokingTrustedDevices
                                      ? "Revoke trusted-device access"
                                      : "Confirm your sign-in"}
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-[#8f887d]">
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

                <form onSubmit={onSubmit} className="mt-5 space-y-4">
                    {requiresMfa ? (
                        <label className="block space-y-2" htmlFor="reauth-code">
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">
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
                                        event.target.value.replace(/\D/g, "").slice(0, 6),
                                    )
                                }
                                className="h-12 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-center text-lg font-semibold tracking-[0.35em] text-[#f4f0e8] outline-none focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
                                autoComplete="one-time-code"
                                autoFocus
                            />
                        </label>
                    ) : (
                        <label className="block space-y-2" htmlFor="reauth-password">
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">
                                Password
                            </span>
                            <input
                                id="reauth-password"
                                type="password"
                                value={password}
                                onChange={(event) => onPasswordChange(event.target.value)}
                                className="h-12 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-sm text-[#f4f0e8] outline-none focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
                                autoComplete="current-password"
                                autoFocus
                            />
                        </label>
                    )}
                    {isChangingPassword ? (
                        <>
                            <label className="block space-y-2" htmlFor="new-account-password">
                                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">
                                    New password
                                </span>
                                <input
                                    id="new-account-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(event) => onNewPasswordChange(event.target.value)}
                                    className="h-12 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-sm text-[#f4f0e8] outline-none focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
                                    autoComplete="new-password"
                                    minLength={8}
                                />
                            </label>
                            <label className="block space-y-2" htmlFor="confirm-account-password">
                                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">
                                    Confirm new password
                                </span>
                                <input
                                    id="confirm-account-password"
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(event) =>
                                        onConfirmNewPasswordChange(event.target.value)
                                    }
                                    className="h-12 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-sm text-[#f4f0e8] outline-none focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
                                    autoComplete="new-password"
                                />
                            </label>
                            <p className="text-xs text-[#8f887d]">
                                Use at least 8 characters. The new password is saved only after your sign-in is confirmed.
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
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <KeyRound className="size-4" aria-hidden="true" />
                        )}
                        {isChangingPassword
                            ? "Change password"
                            : isRevokingTrustedDevices
                              ? "Confirm and revoke"
                              : "Continue"}
                    </AccountButton>
                </form>
            </div>
        </div>
    );
}
