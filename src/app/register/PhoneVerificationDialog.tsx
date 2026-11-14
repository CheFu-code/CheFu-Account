"use client";

import { Check, Loader2, MessageSquare, Phone, ShieldCheck, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ChefuAppId } from "../../lib/chefu-account";
import { usePhoneVerification } from "./usePhoneVerification";

const primary = "account-auth-submit inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60";
const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function PhoneVerificationDialog({ appId, onSkip, onComplete, required = false, initialPhone = "" }: {
    appId: ChefuAppId;
    onSkip: () => void;
    onComplete: () => void;
    required?: boolean;
    initialPhone?: string;
}) {
    const verification = usePhoneVerification(appId, initialPhone);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const titleId = useId(), descriptionId = useId(), errorId = useId(), fieldId = useId();
    const { phase, phone, target, code, busy, error, resendIn, expiresIn, checkIn, attemptsRemaining } = verification;
    useEffect(() => {
        const dialog = dialogRef.current;
        dialog?.showModal();
        return () => { dialog?.close(); };
    }, []);
    useEffect(() => { inputRef.current?.focus(); }, [phase]);

    function leave() {
        if (verification.canLeave()) {
            if (phase === "verified") onComplete();
            else if (!required) onSkip();
        }
    }
    return (
        <dialog
            ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId}
            className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[440px] overflow-y-auto border-0 bg-transparent p-0 text-[var(--fg)] backdrop:bg-black/50 backdrop:backdrop-blur-sm"
            onCancel={event => { event.preventDefault(); leave(); }}
        >
            <div className="account-auth-dialog">
                <div className="flex items-start justify-between gap-4">
                    <span className="account-auth-dialog-icon" aria-hidden="true">
                        {phase === "verified" ? <ShieldCheck className="size-5" /> : phase === "code" ? <MessageSquare className="size-5" /> : <Phone className="size-5" />}
                    </span>
                    {(!required || phase === "verified") && <button type="button" className="account-auth-password-toggle rounded-md p-2" aria-label={phase === "verified" ? "Continue" : "Skip phone setup"} disabled={!!busy} onClick={leave}>
                        <X className="size-4" aria-hidden="true" />
                    </button>}
                </div>
                <h2 id={titleId} className="mt-4 text-xl font-semibold">
                    {phase === "verified" ? "Phone number verified" : phase === "code" ? "Check your messages" : required ? "Verify your phone number" : "Add a phone number?"}
                </h2>
                <p id={descriptionId} className="account-auth-muted mt-2 text-sm leading-6">
                    {phase === "verified" ? `${target} is verified for your account.` : phase === "code"
                        ? verification.uncertainSend ? `If a code arrives at ${target}, enter it here. Otherwise, use Resend code when available.`
                            : `Enter the code we sent to ${target}.` : required ? "Your account has a phone number that needs verification. Confirm it or use another number before continuing."
                                : "Add a contact number and confirm it with a text message. This step is optional."}
                </p>
                {phase === "verified" ? (
                    <div className="mt-6">
                        <p className="account-auth-muted mb-5 text-sm leading-6" role="status">Your phone number has been confirmed.</p>
                        <button autoFocus type="button" className={`${primary} w-full`} onClick={onComplete}>
                            <Check className="size-4" aria-hidden="true" /> Continue
                        </button>
                    </div>
                ) : (
                    <form className="mt-6 space-y-4" aria-busy={!!busy} onSubmit={event => { event.preventDefault(); void (phase === "number" ? verification.send() : verification.verify()); }}>
                        <div className="space-y-2">
                            <label htmlFor={fieldId} className="account-auth-label block text-sm font-medium">{phase === "number" ? "Phone number" : "Verification code"}</label>
                            {phase === "number" ? (
                                <input key="phone" ref={inputRef} id={fieldId} name="phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={32}
                                    value={phone} onChange={event => verification.changePhone(event.target.value)} disabled={!!busy}
                                    placeholder="082 123 4567" className="account-auth-input" aria-invalid={!!error} aria-describedby={error ? errorId : undefined} />
                            ) : (
                                <input key="code" ref={inputRef} id={fieldId} name="code" type="text" autoComplete="one-time-code" inputMode="numeric" required minLength={4} maxLength={10} pattern="[0-9]{4,10}"
                                    value={code} onChange={event => verification.changeCode(event.target.value)} disabled={!!busy || !expiresIn || attemptsRemaining === 0}
                                    placeholder="Enter SMS code" className="account-auth-input text-center tracking-[0.3em]" aria-invalid={!!error} aria-describedby={error ? errorId : undefined} />
                            )}
                            {phase === "number" ? <p className="account-auth-muted text-xs leading-5">Use a South African number or include your country code. We’ll send an SMS to verify it.</p>
                                : <p className="account-auth-muted text-xs leading-5">{expiresIn ? verification.uncertainSend ? "Codes are valid for up to ten minutes." : `Code expires in ${time(expiresIn)}.` : "Your code has expired. Request a new one."}{attemptsRemaining !== undefined && ` ${attemptsRemaining} ${attemptsRemaining === 1 ? "attempt" : "attempts"} remaining.`}</p>}
                        </div>
                        {error && <p id={errorId} className="account-auth-dialog-error text-sm" role="alert">{error}</p>}
                        <button type="submit" className={`${primary} w-full`} disabled={!!busy || (phase === "number" ? !phone.trim() || resendIn > 0 : code.length < 4 || !expiresIn || checkIn > 0 || attemptsRemaining === 0)}>
                            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                            {busy === "sending" ? "Sending code…" : busy === "checking" ? "Verifying…" : phase === "number"
                                ? resendIn > 0 ? `Send code in ${time(resendIn)}` : "Send verification code"
                                : checkIn > 0 ? `Try again in ${time(checkIn)}` : "Verify phone number"}
                        </button>
                        {phase === "code" && <div className="flex flex-wrap justify-between gap-3 text-sm">
                            <button type="button" disabled={!!busy} className="account-auth-link min-h-11 disabled:opacity-60" onClick={verification.editPhone}>Change number</button>
                            <button type="button" disabled={!!busy || resendIn > 0} className="account-auth-link min-h-11 disabled:opacity-60" onClick={() => void verification.send()}>
                                {resendIn > 0 ? `Resend in ${time(resendIn)}` : "Resend code"}
                            </button>
                        </div>}
                        <button type="button" className="account-auth-dialog-skip w-full" disabled={!!busy} onClick={() => { if (verification.canLeave()) (required ? onSkip : leave)(); }}>{required ? "Sign out" : "Skip for now"}</button>
                    </form>
                )}
            </div>
        </dialog>
    );
}
