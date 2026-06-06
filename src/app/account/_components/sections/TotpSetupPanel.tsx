"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";
import Image from "next/image";
import type { FormEvent } from "react";

export function TotpSetupPanel({
    code,
    isVerifying,
    onCancel,
    onCodeChange,
    onSubmit,
    qrDataUrl,
    secretText,
}: {
    code: string;
    isVerifying: boolean;
    onCancel: () => void;
    onCodeChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    qrDataUrl: string;
    secretText: string;
}) {
    return (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/8 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-semibold text-white">Set up authenticator 2FA</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                        Scan the QR code, then enter the current 6-digit code from your
                        authenticator app.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10"
                    aria-label="Cancel 2FA setup"
                >
                    <X className="size-4" aria-hidden="true" />
                </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
                <div className="rounded-xl bg-white p-3">
                    <Image
                        src={qrDataUrl}
                        alt="Authenticator setup QR code"
                        width={196}
                        height={196}
                        className="h-auto w-full"
                    />
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-200">
                            Manual setup key
                        </p>
                        <code className="mt-2 block break-all rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-semibold text-white">
                            {secretText}
                        </code>
                    </div>
                    <label className="block space-y-2" htmlFor="totp-setup-code">
                        <span className="text-sm font-semibold text-slate-200">
                            6-digit code
                        </span>
                        <input
                            id="totp-setup-code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={code}
                            onChange={(event) =>
                                onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))
                            }
                            className="h-12 w-full rounded-xl border border-white/10 bg-[#111318] px-4 text-center text-lg font-semibold tracking-[0.35em] text-white outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                            autoComplete="one-time-code"
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={isVerifying || code.length !== 6}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:opacity-60"
                    >
                        {isVerifying ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                        )}
                        Enable 2FA
                    </button>
                </form>
            </div>
        </div>
    );
}
