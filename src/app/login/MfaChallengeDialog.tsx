"use client";

import { Loader2, ShieldCheck, X } from "lucide-react";
import { useRef, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";

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
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const digits = Array.from({ length: 6 }, (_, index) => code[index] ?? "");

    function updateDigit(index: number, value: string) {
        const nextDigit = value.replace(/\D/g, "").slice(-1);
        const nextCode = digits.map((digit, digitIndex) =>
            digitIndex === index ? nextDigit : digit,
        ).join("");

        onCodeChange(nextCode);
        if (nextDigit && index < 5) inputRefs.current[index + 1]?.focus();
    }

    function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (event.key === "ArrowRight" && index < 5) {
            event.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
        event.preventDefault();
        const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        onCodeChange(pastedCode);
        inputRefs.current[Math.min(pastedCode.length, 5)]?.focus();
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-7 text-stone-900 shadow-2xl shadow-stone-900/20 sm:p-9">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
                            <ShieldCheck className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">Verify 2FA</h2>
                            <p className="mt-1 text-sm leading-6 text-stone-600">
                                Enter the 6-digit code from your authenticator app
                                {email ? ` for ${email}` : ""}.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                        aria-label="Cancel MFA verification"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="mt-7 space-y-5">
                    <fieldset className="space-y-2">
                        <legend className="text-xs font-bold uppercase tracking-[0.12em] text-stone-700">
                            Authenticator code
                        </legend>
                        <div className="flex justify-between gap-2">
                            {digits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(element) => {
                                        inputRefs.current[index] = element;
                                    }}
                                    aria-label={`Authenticator code digit ${index + 1}`}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(event) => updateDigit(index, event.target.value)}
                                    onKeyDown={(event) => handleKeyDown(index, event)}
                                    onPaste={handlePaste}
                                    className="size-12 rounded-lg border border-stone-300 bg-white text-center text-xl font-semibold text-stone-900 outline-none transition hover:border-stone-400 focus:border-amber-700 focus:ring-3 focus:ring-amber-700/15 sm:size-14"
                                    autoComplete={index === 0 ? "one-time-code" : "off"}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>
                    </fieldset>

                    <button
                        type="submit"
                        disabled={isSubmitting || code.length !== 6}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 text-sm font-medium text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
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
