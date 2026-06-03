export type ChefuAppId = "academy" | "admin" | "flow" | "muzalo" | "quantum";

const CHEFU_APP_HEADER = "x-chefu-app";

const DEFAULT_ALLOWED_RETURN_ORIGINS = [
    "https://api.chefuinc.com",
    "https://chefuinc.com",
    "https://myaccount.chefuinc.com",
    "https://academy.chefuinc.com",
    "https://flow.chefuinc.com",
    "https://internal.chefuinc.com",
    "https://music.chefuinc.com",
    "https://muzalo.chefuinc.com",
    "https://quantum.chefuinc.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:4000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
    "http://127.0.0.1:3004",
    "http://127.0.0.1:4000",
];

const appLabels: Record<ChefuAppId, string> = {
    academy: "CheFu Academy",
    admin: "CheFu Admin",
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

    if (normalized === "admin" || normalized === "internal") return "admin";
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

    if (isSafeRelativePath(value)) return value;

    try {
        const url = new URL(value);

        if (isAllowedReturnUrl(url)) {
            return url.toString();
        }
    } catch {
        return fallback;
    }

    return fallback;
}

function isSafeRelativePath(value: string) {
    return (
        value.startsWith("/") &&
        !value.startsWith("//") &&
        !value.startsWith("/\\") &&
        !hasUnsafePathCharacters(value)
    );
}

function hasUnsafePathCharacters(value: string) {
    return Array.from(value).some(
        character => character === "\\" || character.charCodeAt(0) < 0x20,
    );
}

function isAllowedReturnUrl(url: URL) {
    if (url.username || url.password || url.hash) return false;
    if (url.protocol !== "https:" && !isLocalDevOrigin(url)) return false;

    return allowedReturnOrigins().has(url.origin);
}

function isLocalDevOrigin(url: URL) {
    return (
        url.protocol === "http:" &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
}

function allowedReturnOrigins() {
    const configuredOrigins =
        process.env.NEXT_PUBLIC_ALLOWED_RETURN_ORIGINS?.split(",") || [];
    const runtimeOrigins = [
        process.env.NEXT_PUBLIC_API_BASE_URL,
        process.env.NEXT_PUBLIC_ACCOUNT_APP_URL,
    ];

    return new Set(
        [...DEFAULT_ALLOWED_RETURN_ORIGINS, ...runtimeOrigins, ...configuredOrigins]
            .map(origin => normalizeOrigin(origin))
            .filter((origin): origin is string => Boolean(origin)),
    );
}

function normalizeOrigin(value?: string) {
    if (!value) return null;

    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
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
            data.error || data.message || "Unable to start your CheFu account session.";
        const requestId = data.requestId ? ` Request ID: ${data.requestId}` : "";

        throw new Error(`${message}${requestId}`);
    }
}

export async function clearChefuAccountSession(globalLogout = true) {
    const path = globalLogout ? "/auth/session?global=true" : "/auth/session";

    await fetch(apiUrl(path), {
        method: "DELETE",
        credentials: "include",
    });
}
