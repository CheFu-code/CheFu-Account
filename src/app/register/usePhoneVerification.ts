"use client";

import { useEffect, useRef, useState } from "react";
import type { ChefuAppId } from "../../lib/chefu-account";
import { checkPhoneCode, PhoneVerificationError, sendPhoneCode, type VerifiedPhone } from "../../lib/phone-verification";

export function usePhoneVerification(appId: ChefuAppId, initialPhone = "") {
    const [phase, setPhase] = useState<"number" | "code" | "verified">("number");
    const [verifiedPhone, setVerifiedPhone] = useState<VerifiedPhone | null>(null);
    const [phone, setPhone] = useState(initialPhone);
    const [target, setTarget] = useState("");
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState<"sending" | "checking" | null>(null);
    const [error, setError] = useState("");
    const [resendAt, setResendAt] = useState(0), [expiresAt, setExpiresAt] = useState(0);
    const [checkAt, setCheckAt] = useState(0), [now, setNow] = useState(Date.now);
    const [attemptsRemaining, setAttemptsRemaining] = useState<number>();
    const [uncertainSend, setUncertainSend] = useState(false);
    const sendingTarget = useRef("");
    const locked = useRef(false), mounted = useRef(false);
    const controller = useRef<AbortController | null>(null);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; controller.current?.abort(); };
    }, []);
    useEffect(() => {
        if (phase === "verified" || Math.max(resendAt, checkAt, phase === "code" ? expiresAt : 0) <= now) return;
        const timer = window.setTimeout(() => setNow(Date.now()), 1000);
        return () => window.clearTimeout(timer);
    }, [resendAt, checkAt, expiresAt, now, phase]);

    async function perform(kind: "sending" | "checking", work: (signal: AbortSignal) => Promise<void>) {
        if (locked.current) return;
        locked.current = true; setBusy(kind); setError("");
        const abort = new AbortController(); controller.current = abort;
        const timer = window.setTimeout(() => abort.abort(), 20000);
        try { await work(abort.signal); }
        catch (cause) {
            if (!mounted.current) return;
            const failure = cause instanceof PhoneVerificationError ? cause : new PhoneVerificationError("Something went wrong. Please try again or skip for now.", 0);
            setError(failure.message);
            if (kind === "sending" && failure.status === 0 && phase === "number") {
                setTarget(sendingTarget.current); setPhase("code"); setUncertainSend(true);
                setExpiresAt(Date.now() + 10 * 60 * 1000);
            }
            if (failure.retryAfterSeconds) {
                const until = Date.now() + failure.retryAfterSeconds * 1000;
                setResendAt(previous => Math.max(previous, until));
                if (kind === "checking") setCheckAt(until);
            }
            if (failure.attemptsRemaining !== undefined) {
                setAttemptsRemaining(failure.attemptsRemaining);
                if (!failure.attemptsRemaining) setResendAt(previous => Math.max(previous, expiresAt));
            }
            if (kind === "checking" && failure.status === 400) setCode("");
        } finally {
            window.clearTimeout(timer); locked.current = false;
            if (mounted.current) { setBusy(null); setNow(Date.now()); }
        }
    }
    async function send() {
        if (locked.current || Date.now() < resendAt) return;
        const input = phase === "code" ? target : phone.trim();
        const digits = input.replace(/[\s()-]/g, "");
        if (input.length > 32 || !/^\+?[\d\s()-]+$/.test(input) || !(digits.startsWith("0") ? /^0[1-9]\d{8}$/.test(digits) : /^\+[1-9]\d{7,14}$/.test(digits))) {
            setError("Enter a complete phone number, for example 082 123 4567 or +27 82 123 4567."); return;
        }
        // Even an uncertain send may have reached the provider. Do not auto-retry it.
        sendingTarget.current = digits.startsWith("0") ? `+27${digits.slice(1)}` : digits;
        setResendAt(Date.now() + 30000);
        await perform("sending", async signal => {
            const result = await sendPhoneCode(input, appId, signal);
            if (!mounted.current) return;
            setTarget(result.phone); setCode(""); setUncertainSend(false);
            if (result.verified) { setVerifiedPhone(result); setPhase("verified"); return; }
            setPhase("code"); setAttemptsRemaining(undefined); setCheckAt(0);
            setResendAt(Date.now() + Math.max(30, result.resendAfterSeconds) * 1000);
            setExpiresAt(Date.now() + result.expiresInSeconds * 1000);
        });
    }
    async function verify() {
        if (locked.current || phase !== "code" || Date.now() >= expiresAt || Date.now() < checkAt || attemptsRemaining === 0) return;
        if (!/^\d{4,10}$/.test(code)) { setError("Enter the numeric code from your text message."); return; }
        await perform("checking", async signal => {
            const receipt = await checkPhoneCode(target, code, appId, signal);
            if (mounted.current) { setVerifiedPhone(receipt); setCode(""); setPhase("verified"); }
        });
    }
    return {
        phase, phone, target, code, busy, error, attemptsRemaining, uncertainSend, verifiedPhone,
        resendIn: Math.max(0, Math.ceil((resendAt - now) / 1000)),
        expiresIn: Math.max(0, Math.ceil((expiresAt - now) / 1000)),
        checkIn: Math.max(0, Math.ceil((checkAt - now) / 1000)),
        send, verify,
        canLeave: () => !locked.current,
        changePhone: (value: string) => { if (!locked.current) { setPhone(value); setError(""); } },
        changeCode: (value: string) => { if (!locked.current) { setCode(value.replace(/\D/g, "").slice(0, 10)); setError(""); } },
        editPhone: () => {
            if (locked.current) return;
            setPhone(target); setPhase("number"); setCode(""); setError(""); setAttemptsRemaining(undefined);
        },
    };
}
