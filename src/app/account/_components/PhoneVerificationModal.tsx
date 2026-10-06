"use client";

import { CheckCircle2, Loader2, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiUrl } from "../../../lib/chefu-account";

type PhoneVerificationModalProps = {
    onClose: () => void;
    onVerified: (phone: string) => void;
};

export function PhoneVerificationModal({
    onClose,
    onVerified,
}: PhoneVerificationModalProps) {
    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [sent, setSent] = useState(false);

    async function sendCode() {
        const normalizedPhone = phone.trim().replace(/\s+/g, "");
        if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
            toast.error("Enter a valid phone number with country code.", {
                description: "Example: +27821234567",
            });
            return;
        }

        setIsSending(true);
        try {
            const response = await fetch(apiUrl("/auth/whatsapp/send-code"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ phone: normalizedPhone }),
            });
            if (!response.ok) throw new Error(await readError(response));
            setPhone(normalizedPhone);
            setSent(true);
            toast.success("Verification code sent on WhatsApp.");
        } catch (error) {
            toast.error("Unable to send the WhatsApp code.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSending(false);
        }
    }

    async function verifyCode() {
        if (!/^\d{6}$/.test(code)) {
            toast.error("Enter the 6-digit verification code.");
            return;
        }

        setIsVerifying(true);
        try {
            const response = await fetch(apiUrl("/auth/whatsapp/verify-code"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-chefu-app": "academy",
                },
                credentials: "include",
                body: JSON.stringify({ phone, code }),
            });
            if (!response.ok) throw new Error(await readError(response));
            onVerified(phone);
            toast.success("WhatsApp number verified.");
        } catch (error) {
            toast.error("Unable to verify the WhatsApp number.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsVerifying(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-verification-title"
        >
            <div className="w-full max-w-md rounded-[2rem] border border-white/12 bg-[#1a1916] p-6 text-[#f4f0e8] shadow-2xl shadow-black/50">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#35d0a1]/25 bg-[#35d0a1]/10 text-[#72e6c0]">
                            <MessageCircle className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 id="phone-verification-title" className="text-xl font-semibold">
                                Add your WhatsApp number
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-[#8f887d]">
                                Add a number where we can reach you on WhatsApp. We’ll send a code to verify it.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSending || isVerifying}
                        className="rounded-full border border-white/10 p-2 text-[#bdb5a8] transition hover:bg-white/8 disabled:opacity-60"
                        aria-label="Close phone verification"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>

                <div className="mt-6 space-y-4">
                    <label className="block space-y-2" htmlFor="whatsapp-phone">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">
                            Phone number
                        </span>
                        <input
                            id="whatsapp-phone"
                            type="tel"
                            inputMode="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="+27821234567"
                            disabled={sent}
                            className="h-12 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-sm text-[#f4f0e8] outline-none focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10 disabled:opacity-60"
                            autoComplete="tel"
                            autoFocus
                        />
                    </label>

                    {!sent ? (
                        <button
                            type="button"
                            onClick={sendCode}
                            disabled={isSending}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e5ad5b] px-4 text-sm font-bold text-[#26190a] transition hover:bg-[#ffd18a] disabled:opacity-60"
                        >
                            {isSending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                            Send WhatsApp code
                        </button>
                    ) : (
                        <>
                            <label className="block space-y-2" htmlFor="whatsapp-code">
                                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">
                                    Verification code
                                </span>
                                <input
                                    id="whatsapp-code"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={code}
                                    onChange={(event) =>
                                        setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                                    }
                                    className="h-12 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-center text-lg font-semibold tracking-[0.35em] text-[#f4f0e8] outline-none focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
                                    autoComplete="one-time-code"
                                    autoFocus
                                />
                            </label>
                            <button
                                type="button"
                                onClick={verifyCode}
                                disabled={isVerifying || code.length !== 6}
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e5ad5b] px-4 text-sm font-bold text-[#26190a] transition hover:bg-[#ffd18a] disabled:opacity-60"
                            >
                                {isVerifying ? (
                                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <CheckCircle2 className="size-4" aria-hidden="true" />
                                )}
                                Verify WhatsApp number
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSent(false);
                                    setCode("");
                                }}
                                disabled={isVerifying}
                                className="w-full text-center text-sm text-[#bdb5a8] underline-offset-4 hover:text-[#f4f0e8] hover:underline disabled:opacity-60"
                            >
                                Use a different number
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

async function readError(response: Response) {
    const data = (await response.json().catch(() => null)) as
        | { message?: string | string[]; error?: string }
        | null;
    const message = data?.message;
    return Array.isArray(message)
        ? message.join(", ")
        : message || data?.error || "Please try again.";
}
