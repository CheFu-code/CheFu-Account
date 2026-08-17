"use client";

import { KeyRound, Loader2, ShieldCheck, X } from "lucide-react";
import type { FormEvent } from "react";

export function ReauthenticationDialog({
    code,
    email,
    isSubmitting,
    onCancel,
    onCodeChange,
    onPasswordChange,
    onSubmit,
    password,
    requiresMfa,
}: {
    code: string;
    email: string;
    isSubmitting: boolean;
    onCancel: () => void;
    onCodeChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    password: string;
    requiresMfa: boolean;
}) {
    const canSubmit = requiresMfa ? code.length === 6 : password.length > 0;

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
                                Confirm your sign-in
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-[#8f887d]">
                                {requiresMfa
                                    ? "Enter your authenticator code to finish confirming this change."
                                    : `Enter the password for ${email} to continue.`}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="rounded-full border border-white/10 p-2 text-[#bdb5a8] transition hover:bg-white/8 disabled:opacity-60"
                        aria-label="Cancel sign-in confirmation"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
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

                    <button
                        type="submit"
                        disabled={isSubmitting || !canSubmit}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e5ad5b] px-4 text-sm font-bold text-[#26190a] transition hover:bg-[#ffd18a] disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <KeyRound className="size-4" aria-hidden="true" />
                        )}
                        Continue
                    </button>
                </form>
            </div>
        </div>
    );
}
