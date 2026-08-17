"use client";

import { Loader2, ShieldCheck, X } from "lucide-react";
import type { FormEvent } from "react";

export function MfaChallengeDialog({
    code,
    email,
    isSubmitting,
    onCancel,
    onCodeChange,
    onSubmit,
    open,
}: {
    code: string;
    email: string;
    isSubmitting: boolean;
    onCancel: () => void;
    onCodeChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    open: boolean;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md">
            <div className="w-full max-w-md rounded-[2rem] border border-white/12 bg-[#1a1916] p-6 text-[#f4f0e8] shadow-2xl shadow-black/50">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e5ad5b]/22 bg-[#e5ad5b]/10 text-[#ffd18a]">
                            <ShieldCheck className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold tracking-[-0.03em]">Verify 2FA</h2>
                            <p className="mt-1 text-sm leading-6 text-[#8f887d]">
                                Enter the 6-digit code from your authenticator app
                                {email ? ` for ${email}` : ""}.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl p-2 text-[#8f887d] transition hover:bg-white/7 hover:text-[#f4f0e8]"
                        aria-label="Cancel MFA verification"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="mt-5 space-y-4">
                    <label className="block space-y-2" htmlFor="mfa-code">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">
                            Authenticator code
                        </span>
                        <input
                            id="mfa-code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={code}
                            onChange={(event) =>
                                onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))
                            }
                            className="h-13 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-center text-xl font-semibold tracking-[0.35em] text-[#f4f0e8] outline-none transition focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
                            autoComplete="one-time-code"
                            autoFocus
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={isSubmitting || code.length !== 6}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e5ad5b] px-4 text-sm font-bold text-[#26190a] transition hover:bg-[#ffd18a] disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <ShieldCheck className="size-4" aria-hidden="true" />
                        )}
                        Verify and continue
                    </button>
                </form>
            </div>
        </div>
    );
}
