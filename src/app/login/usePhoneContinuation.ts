"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, type ChefuAppId, type SessionTrustResult } from "../../lib/chefu-account";
import { phoneVerificationHref } from "../../lib/phone-gate";
import { completeAuthRedirect } from "./login-helpers";

export function usePhoneContinuation(appId: ChefuAppId, target: string) {
    const router = useRouter();
    const pending = useRef(false);
    return {
        remember: (result: SessionTrustResult) => { pending.current = result.phoneVerificationRequired === true; },
        continue: () => completeAuthRedirect(pending.current ? phoneVerificationHref(appId, target) : target, router.replace),
        selected: async (result?: SessionTrustResult) => {
            if (result && typeof result.phoneVerificationRequired === "boolean") {
                completeAuthRedirect(result.phoneVerificationRequired ? phoneVerificationHref(appId, target) : target, router.replace); return;
            }
            // Selecting the active account does not perform a switch. Reuse the
            // normal session probe, without any OTP/provider/receipt request.
            try {
                const response = await fetch(apiUrl("/auth/session/status"), {
                    credentials: "include", cache: "no-store", headers: { "x-chefu-app": appId }, signal: AbortSignal.timeout(5000),
                });
                const status = await response.json();
                if (!response.ok || status.authenticated !== true) throw new Error("Session unavailable");
                completeAuthRedirect(status.phoneVerificationRequired ? phoneVerificationHref(appId, target) : target, router.replace);
            } catch {
                router.replace(phoneVerificationHref(appId, target));
            }
        },
    };
}
