"use client";

import { Loader2, Mail, X } from "lucide-react";
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

export function EmailVerificationDialog({
    email,
    isSubmitting,
    onCancel,
    onSubmit,
    onResend,
}: {
    email: string;
    isSubmitting: boolean;
    onCancel: () => void;
    onSubmit: (code: string) => void;
    onResend: () => void;
}) {
    const [code, setCode] = useState("");
    const refs = useRef<Array<HTMLInputElement | null>>([]);
    const digits = Array.from({ length: 6 }, (_, index) => code[index] || "");

    function changeDigit(index: number, value: string) {
        const digit = value.replace(/\D/g, "").slice(-1);
        setCode(digits.map((item, itemIndex) => itemIndex === index ? digit : item).join(""));
        if (digit && index < 5) refs.current[index + 1]?.focus();
    }

    function keyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
        if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            refs.current[index - 1]?.focus();
        }
        if (event.key === "ArrowRight" && index < 5) {
            event.preventDefault();
            refs.current[index + 1]?.focus();
        }
    }

    function paste(event: ClipboardEvent<HTMLInputElement>) {
        event.preventDefault();
        const value = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        setCode(value);
        refs.current[Math.min(value.length, 5)]?.focus();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-7 text-stone-900 shadow-2xl shadow-stone-900/20 sm:p-9">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
                            <Mail className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">Verify your email</h2>
                            <p className="mt-1 text-sm leading-6 text-stone-600">
                                Enter the code sent to {email} to activate your account.
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" aria-label="Cancel email verification">
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>

                <form className="mt-7 space-y-5" onSubmit={(event) => { event.preventDefault(); onSubmit(code); }}>
                    <fieldset className="space-y-2">
                        <legend className="text-xs font-bold uppercase tracking-[0.12em] text-stone-700">Verification code</legend>
                        <div className="flex justify-between gap-2">
                            {digits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(element) => { refs.current[index] = element; }}
                                    aria-label={`Verification code digit ${index + 1}`}
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(event) => changeDigit(index, event.target.value)}
                                    onKeyDown={(event) => keyDown(index, event)}
                                    onPaste={paste}
                                    autoFocus={index === 0}
                                    className="size-12 rounded-lg border border-stone-300 text-center text-xl font-semibold outline-none focus:border-amber-700 focus:ring-3 focus:ring-amber-700/15 sm:size-14"
                                />
                            ))}
                        </div>
                    </fieldset>
                    <button type="submit" disabled={isSubmitting || code.length !== 6} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60">
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                        Verify email
                    </button>
                    <button type="button" onClick={onResend} disabled={isSubmitting} className="w-full text-sm font-medium text-amber-800 hover:underline">
                        Resend code
                    </button>
                </form>
            </div>
        </div>
    );
}
