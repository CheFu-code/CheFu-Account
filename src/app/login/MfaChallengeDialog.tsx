"use client";

import { Loader2, ShieldCheck, X } from "lucide-react";
import {
    useEffect,
    useRef,
    type ClipboardEvent,
    type FormEvent,
    type KeyboardEvent,
} from "react";

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
    const formRef = useRef<HTMLFormElement | null>(null);
    const lastAutoSubmittedCode = useRef("");
    const digits = Array.from({ length: 6 }, (_, index) => code[index] ?? "");

    useEffect(() => {
        if (open && !code) inputRefs.current[0]?.focus();
    }, [code, open]);

    useEffect(() => {
        if (!open || code.length !== 6) {
            lastAutoSubmittedCode.current = "";
            return;
        }
        if (isSubmitting || lastAutoSubmittedCode.current === code) return;

        const form = formRef.current;
        if (!form) return;
        lastAutoSubmittedCode.current = code;
        form.requestSubmit();
    }, [code, isSubmitting, open]);

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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mfa-challenge-title"
        >
            <div className="my-auto w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 text-[var(--fg)] shadow-2xl sm:p-7">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--accent)]/25 bg-[var(--surface-alt)] text-[var(--accent)]">
                            <ShieldCheck className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 id="mfa-challenge-title" className="text-xl font-semibold tracking-tight">
                                Verify 2FA
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-[var(--fg-muted)]">
                                Enter the 6-digit code from your authenticator app
                                {email ? ` for ${email}` : ""}.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg p-2 text-[var(--fg-muted)] transition hover:bg-[var(--surface-alt)] hover:text-[var(--fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                        aria-label="Cancel MFA verification"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>

                <form ref={formRef} onSubmit={onSubmit} className="mt-7 space-y-5">
                    <fieldset className="space-y-2">
                        <legend className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--fg-2)]">
                            Authenticator code
                        </legend>
                        <div className="grid grid-cols-6 gap-2">
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
                                    className="aspect-square w-full min-w-0 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-center text-xl font-semibold text-[var(--fg)] outline-none transition hover:border-[var(--accent)] focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent)]/15"
                                    autoComplete={index === 0 ? "one-time-code" : "off"}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>
                    </fieldset>

                    <button
                        type="submit"
                        disabled={isSubmitting || code.length !== 6}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <ShieldCheck className="size-4" aria-hidden="true" />
                        )}
                        {isSubmitting ? "Verifying..." : "Verify and continue"}
                    </button>
                </form>
            </div>
        </div>
    );
}
