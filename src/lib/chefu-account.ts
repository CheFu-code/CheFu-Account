import {
    resolveChefuAppId,
    validateReturnToForApp,
    type ChefuAppId,
} from "./redirect-policy";

export type { ChefuAppId };

const CHEFU_APP_HEADER = "x-chefu-app";

const appLabels: Record<ChefuAppId, string> = {
    academy: "Chefu Technologies",
    admin: "Chefu Admin",
    flow: "Flow Mail",
    muzalo: "Muzalo",
    quantum: "Quantum",
    infinity: "Infinity",
    logix: "Logix",
    "logix-dash": "Logix Dashboard",
    merchant: "Chefu Merchant",
    cloudence: "Cloudence",
};

export function apiUrl(path: string) {
    const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.chefu.co.za";

    return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function accountAppUrl(path = "/account") {
    const baseUrl =
        process.env.NEXT_PUBLIC_ACCOUNT_APP_URL ||
        "https://myaccount.chefu.co.za";

    return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveChefuApp(value?: string | null): ChefuAppId {
    return resolveChefuAppId(value);
}

export function chefuAppLabel(appId: ChefuAppId) {
    return appLabels[appId];
}

export function safeReturnTo(value?: string | null, fallback?: string): string;
export function safeReturnTo(
    value: string | null | undefined,
    appId: ChefuAppId,
    fallback?: string,
): string;
export function safeReturnTo(
    value?: string | null,
    appIdOrFallback: ChefuAppId | string = "academy",
    fallback = "/account",
) {
    const appId = isChefuAppId(appIdOrFallback) ? appIdOrFallback : "academy";
    const fallbackTarget = isChefuAppId(appIdOrFallback)
        ? fallback
        : appIdOrFallback;
    const result = validateReturnToForApp(value, appId);

    return result.ok ? result.target : fallbackTarget;
}

function isChefuAppId(value: string): value is ChefuAppId {
    return (
        value === "academy" ||
        value === "admin" ||
        value === "flow" ||
        value === "muzalo" ||
        value === "quantum" ||
        value === "infinity" ||
        value === "logix" ||
        value === "logix-dash" ||
        value === "merchant" ||
        value === "cloudence"
    );
}

export function preserveAuthParams(
    path: "/login" | "/register" | "/forgot-password",
    params: URLSearchParams,
) {
    const nextParams = new URLSearchParams();

    for (const key of ["app", "returnTo", "next"]) {
        const value = params.get(key);
        if (value) nextParams.set(key, value);
    }

    const query = nextParams.toString();
    return query ? `${path}?${query}` : path;
}

export async function syncChefuAccountSession(idToken: string, appId: ChefuAppId) {
    const response = await fetch(apiUrl("/auth/session"), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${idToken}`,
            [CHEFU_APP_HEADER]: appId,
        },
        credentials: "include",
    });

    if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
            error?: string;
            message?: string;
            requestId?: string;
        };
        const message =
            data.error || data.message || "Unable to start your account session. Please try signing in again.";
        const requestId = data.requestId ? ` Request ID: ${data.requestId}` : "";

        throw new Error(`${message}${requestId}`);
    }
}

export async function sendEmailVerificationCode(idToken: string, appName: string) {
    const response = await fetch(apiUrl("/auth/email-verification/send"), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ appName }),
    });
    if (!response.ok) throw new Error(await readApiError(response));
}

export async function verifyEmailVerificationCode(idToken: string, code: string) {
    const response = await fetch(apiUrl("/auth/email-verification/verify"), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ code }),
    });
    if (!response.ok) throw new Error(await readApiError(response));
}

async function readApiError(response: Response) {
    const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
    };
    return data.message || data.error || "Unable to complete email verification.";
}

export async function clearChefuAccountSession(globalLogout = true) {
    const path = globalLogout ? "/auth/session?global=true" : "/auth/session";

    await fetch(apiUrl(path), {
        method: "DELETE",
        credentials: "include",
    });
}
