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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                            <ShieldCheck className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold">Verify 2FA</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                Enter the 6-digit code from your authenticator app
                                {email ? ` for ${email}` : ""}.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                        aria-label="Cancel MFA verification"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="mt-5 space-y-4">
                    <label className="block space-y-2" htmlFor="mfa-code">
                        <span className="text-sm font-semibold text-slate-800">
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
                            className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-center text-xl font-semibold tracking-[0.35em] text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                            autoComplete="one-time-code"
                            autoFocus
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={isSubmitting || code.length !== 6}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
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
