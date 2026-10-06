"use client";

import { CheckCircle2, Loader2, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function WhatsappLoginDialog({
    isSubmitting,
    onCancel,
    onSend,
    onVerify,
    phone: initialPhone,
}: {
    isSubmitting: boolean;
    onCancel: () => void;
    onSend: (phone: string) => Promise<void>;
    onVerify: (phone: string, code: string) => Promise<void>;
    phone?: string;
}) {
    const [phone, setPhone] = useState(initialPhone || "");
    const [code, setCode] = useState("");
    const [sent, setSent] = useState(Boolean(initialPhone));

    async function sendCode() {
        const normalizedPhone = phone.trim().replace(/\s+/g, "");
        if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
            toast.error("Enter a valid phone number with country code.", {
                description: "Example: +27821234567",
            });
            return;
        }

        try {
            await onSend(normalizedPhone);
            setPhone(normalizedPhone);
            setSent(true);
        } catch (error) {
            toast.error("Unable to send the WhatsApp code.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        }
    }

    async function verifyCode() {
        if (!/^\d{6}$/.test(code)) {
            toast.error("Enter the 6-digit WhatsApp code.");
            return;
        }

        try {
            await onVerify(phone, code);
        } catch (error) {
            toast.error("Unable to verify the WhatsApp code.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        }
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="whatsapp-login-title">
            <div className="w-full max-w-md rounded-[2rem] border border-white/12 bg-[#1a1916] p-6 text-[#f4f0e8] shadow-2xl shadow-black/50">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#35d0a1]/25 bg-[#35d0a1]/10 text-[#72e6c0]">
                            <MessageCircle className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 id="whatsapp-login-title" className="text-xl font-semibold">
                                Verify with WhatsApp
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-[#8f887d]">
                                {sent
                                    ? "Enter the code sent to your WhatsApp number."
                                    : "Add a WhatsApp number to finish signing in."}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-full border border-white/10 p-2 text-[#bdb5a8] transition hover:bg-white/8 disabled:opacity-60" aria-label="Cancel WhatsApp verification">
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>

                <div className="mt-6 space-y-4">
                    <label className="block space-y-2" htmlFor="login-whatsapp-phone">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">WhatsApp number</span>
                        <input id="login-whatsapp-phone" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={sent || isSubmitting} placeholder="+27821234567" className="h-12 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-sm text-[#f4f0e8] outline-none focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10 disabled:opacity-60" autoComplete="tel" autoFocus={!sent} />
                    </label>

                    {!sent ? (
                        <button type="button" onClick={sendCode} disabled={isSubmitting} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e5ad5b] px-4 text-sm font-bold text-[#26190a] transition hover:bg-[#ffd18a] disabled:opacity-60">
                            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                            Send WhatsApp code
                        </button>
                    ) : (
                        <>
                            <label className="block space-y-2" htmlFor="login-whatsapp-code">
                                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">Verification code</span>
                                <input id="login-whatsapp-code" type="text" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-center text-lg font-semibold tracking-[0.35em] text-[#f4f0e8] outline-none focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10" autoComplete="one-time-code" autoFocus />
                            </label>
                            <button type="button" onClick={verifyCode} disabled={isSubmitting || code.length !== 6} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e5ad5b] px-4 text-sm font-bold text-[#26190a] transition hover:bg-[#ffd18a] disabled:opacity-60">
                                {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                                Verify and sign in
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
