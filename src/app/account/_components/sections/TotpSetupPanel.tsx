"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";
import Image from "next/image";
import type { KeyboardEvent } from "react";
import { AccountButton } from "../AccountPrimitives";

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
            <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/12 bg-[#1a1916] p-6 text-[#f4f0e8] shadow-2xl shadow-black/50">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 id="totp-setup-title" className="text-xl font-semibold tracking-[-0.03em]">
                            Set up authenticator 2FA
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[#8f887d]">
                            Scan the QR code, then enter the current 6-digit code from
                            your authenticator app.
                        </p>
                    </div>
                    <AccountButton
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isVerifying}
                        className="account-button-icon"
                        aria-label="Cancel 2FA setup"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </AccountButton>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
                    <div className="rounded-2xl bg-[#f4f0e8] p-3">
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
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">
                                Manual setup key
                            </p>
                            <code className="mt-2 block break-all rounded-xl border border-white/10 bg-[#11110f] p-3 text-sm font-semibold text-[#f4f0e8]">
                                {secretText}
                            </code>
                        </div>
                        <label className="block space-y-2" htmlFor="totp-setup-code">
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">
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
                                className="h-12 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-center text-lg font-semibold tracking-[0.35em] text-[#f4f0e8] outline-none focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
                                autoComplete="one-time-code"
                                autoFocus
                            />
                        </label>
                        <AccountButton
                            variant="primary"
                            onClick={onVerify}
                            disabled={!canVerify}
                            className="account-button-full"
                        >
                            {isVerifying ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                            )}
                            Enable 2FA
                        </AccountButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
