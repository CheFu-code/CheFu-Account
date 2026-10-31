import { apiUrl, type ChefuAppId } from "./chefu-account";
import { shareAuthRead } from "./auth-reads";
import type { AccountResponse } from "../app/account/_components/account-types";

export function readCurrentAccount(appId: ChefuAppId) {
    return shareAuthRead(`account:${appId}`, async signal => {
        const response = await fetch(apiUrl("/auth/me"), {
            credentials: "include", cache: "no-store", signal,
            headers: { "x-chefu-app": appId },
        });
        if (response.status === 401) return { status: 401, data: null };
        if (!response.ok) throw new Error("Could not load your account.");
        return { status: response.status, data: await response.json() as AccountResponse };
    });
}
