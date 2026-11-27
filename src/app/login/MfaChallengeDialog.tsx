"use client";

import { Loader2, ShieldCheck, X } from "lucide-react";
import {
    useEffect,
    useRef,
    type FormEvent,
} from "react";
import { SixDigitCodeInput } from "../_components/SixDigitCodeInput";

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
    const formRef = useRef<HTMLFormElement | null>(null);
    const lastAutoSubmittedCode = useRef("");

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
                    <SixDigitCodeInput
                        code={code}
                        label="Authenticator code"
                        onCodeChange={onCodeChange}
                    />

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
