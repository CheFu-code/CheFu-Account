"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { readCurrentAccount } from "../../lib/account-read";
import { preserveAuthParams, resolveChefuApp, safeReturnTo } from "../../lib/chefu-account";
import { completeAuthRedirect } from "../login/login-helpers";
import { PhoneVerificationDialog } from "../register/PhoneVerificationDialog";

export function VerifyPhoneClient() {
    const router = useRouter(), params = useSearchParams();
    const appId = resolveChefuApp(params.get("app"));
    const destination = safeReturnTo(params.get("returnTo"), appId, "/account");
    const target = destination.split("?")[0] === "/verify-phone" ? "/account" : destination;
    const [phone, setPhone] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        void readCurrentAccount(appId).then(result => {
            if (!active) return;
            if (result.status === 401) {
                router.replace(`/login?${new URLSearchParams({ app: appId, returnTo: target, prompt: "login" })}`); return;
            }
            if (!result.data) throw new Error("Could not load your phone details.");
            if (!result.data.profile.phoneVerificationRequired) { completeAuthRedirect(target, router.replace); return; }
            setPhone(result.data.profile.phone || "");
        }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Could not load your account."); });
        return () => { active = false; };
    }, [appId, target, router, attempt]);
    return <main className="account-auth-screen flex min-h-dvh items-center justify-center px-4">
        <section className="account-auth-card w-full max-w-sm rounded-xl border p-8 text-center">
            <h1 className="text-lg font-semibold">{error ? "Unable to load verification" : "Preparing your account"}</h1>
            <p className="account-auth-muted mt-3 text-sm" role={error ? "alert" : "status"}>{error || "Checking your account details…"}</p>
            {error && <button type="button" className="account-auth-dialog-skip mt-5" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Try again</button>}
        </section>
        {phone !== null && <PhoneVerificationDialog appId={appId} initialPhone={phone} required
            onComplete={() => completeAuthRedirect(target, router.replace)}
            onSkip={() => router.replace(preserveAuthParams("/logout", new URLSearchParams({ app: appId, returnTo: target })))} />}
    </main>;
}
