export type ChefuAppId = "academy" | "flow" | "muzalo" | "quantum";

const CHEFU_APP_HEADER = "x-chefu-app";

const appLabels: Record<ChefuAppId, string> = {
    academy: "CheFu Academy",
    flow: "Flow Mail",
    muzalo: "Muzalo",
    quantum: "Quantum",
};

export function apiUrl(path: string) {
    const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.chefuinc.com";

    return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function accountAppUrl(path = "/account") {
    const baseUrl =
        process.env.NEXT_PUBLIC_ACCOUNT_APP_URL ||
        "https://myaccount.chefuinc.com";

    return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveChefuApp(value?: string | null): ChefuAppId {
    const normalized = value?.trim().toLowerCase();

    if (normalized === "flow") return "flow";
    if (normalized === "muzalo" || normalized === "music") return "muzalo";
    if (normalized === "quantum") return "quantum";
    return "academy";
}

export function chefuAppLabel(appId: ChefuAppId) {
    return appLabels[appId];
}

export function safeReturnTo(value?: string | null, fallback = "/account") {
    if (!value) return fallback;

    if (value.startsWith("/") && !value.startsWith("//")) return value;

    try {
        const url = new URL(value);
        const isChefuDomain =
            url.hostname === "chefuinc.com" || url.hostname.endsWith(".chefuinc.com");
        const isLocalhost =
            url.hostname === "localhost" || url.hostname === "127.0.0.1";
        const isSupportedProtocol = url.protocol === "https:" || url.protocol === "http:";

        if (isSupportedProtocol && (isChefuDomain || isLocalhost)) {
            return url.toString();
        }
    } catch {
        return fallback;
    }

    return fallback;
}

export function preserveAuthParams(
    path: "/login" | "/register",
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
            data.error || data.message || "Unable to start your CheFu account session.";
        const requestId = data.requestId ? ` Request ID: ${data.requestId}` : "";

        throw new Error(`${message}${requestId}`);
    }
}

export async function clearChefuAccountSession() {
    await fetch(apiUrl("/auth/session"), {
        method: "DELETE",
        credentials: "include",
    });
}
