"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";
import Image from "next/image";
import type { KeyboardEvent } from "react";

export function TotpSetupPanel({
    code,
    isVerifying,
    onCancel,
    onCodeChange,
    onVerify,
    qrDataUrl,
    secretText,
}: {
    code: string;
    isVerifying: boolean;
    onCancel: () => void;
    onCodeChange: (value: string) => void;
    onVerify: () => void;
    qrDataUrl: string;
    secretText: string;
}) {
    const canVerify = code.length === 6 && !isVerifying;

    function handleCodeKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        if (canVerify) onVerify();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="totp-setup-title"
            onKeyDown={(event) => {
                if (event.key === "Escape" && !isVerifying) onCancel();
            }}
        >
            <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#191b20] p-5 text-white shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 id="totp-setup-title" className="text-xl font-semibold">
                            Set up authenticator 2FA
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-300">
                            Scan the QR code, then enter the current 6-digit code from
                            your authenticator app.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isVerifying}
                        className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
                        aria-label="Cancel 2FA setup"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
                    <div className="rounded-xl bg-white p-3">
                        <Image
                            src={qrDataUrl}
                            alt="Authenticator setup QR code"
                            width={196}
                            height={196}
                            className="h-auto w-full"
                        />
                    </div>
                    <div className="space-y-4">
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
                                    onCodeChange(
                                        event.target.value.replace(/\D/g, "").slice(0, 6),
                                    )
                                }
                                onKeyDown={handleCodeKeyDown}
                                className="h-12 w-full rounded-xl border border-white/10 bg-[#111318] px-4 text-center text-lg font-semibold tracking-[0.35em] text-white outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                                autoComplete="one-time-code"
                                autoFocus
                            />
                        </label>
                        <button
                            type="button"
                            onClick={onVerify}
                            disabled={!canVerify}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:opacity-60"
                        >
                            {isVerifying ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                            )}
                            Enable 2FA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
