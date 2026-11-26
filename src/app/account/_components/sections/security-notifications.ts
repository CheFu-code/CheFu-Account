import { apiUrl } from "../../../../lib/chefu-account";
import type { AccountResponse } from "../account-types";
import { accountLocationLabel } from "./mfa-security-utils";

export async function sendSecurityNotification(account: AccountResponse, appId: string, action?: "enabled" | "disabled") {
    const response = await fetch(apiUrl(action ? "/email/mfa-changed" : "/email/password-changed"), {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", "x-chefu-app": appId },
        body: JSON.stringify({
            ...(action ? { action } : { deviceInfo: navigator.userAgent }),
            location: accountLocationLabel(account.profile),
            userName: account.profile.fullname || account.user.displayName || undefined,
        }),
    });
    const data = await response.json().catch(() => null) as { reason?: string; message?: string; sent?: boolean } | null;
    if (!response.ok || data?.sent === false) throw new Error(data?.reason || data?.message || "Could not send security email.");
}
