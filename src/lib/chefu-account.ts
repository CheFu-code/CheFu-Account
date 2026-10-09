import {
    resolveChefuAppId,
    validateReturnToForApp,
    type ChefuAppId,
} from "./redirect-policy";

export type { ChefuAppId };

const CHEFU_APP_HEADER = "x-chefu-app";

const appLabels: Record<ChefuAppId, string> = {
    root: "Chefu Technologies",
    academy: "Chefu Technologies",
    admin: "Chefu Admin",
    flow: "Flow Mail",
    quantum: "Quantum",
    infinity: "Infinity",
    logix: "Logix",
    "logix-dash": "Logix Dashboard",
    merchant: "Chefu Merchant",
    cloudence: "Cloudence",
    nook: "Nook",
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
    appIdOrFallback: ChefuAppId | string = "root",
    fallback = "/account",
) {
    const appId = isChefuAppId(appIdOrFallback) ? appIdOrFallback : "root";
    const fallbackTarget = isChefuAppId(appIdOrFallback)
        ? fallback
        : appIdOrFallback;
    const result = validateReturnToForApp(value, appId);

    return result.ok ? result.target : fallbackTarget;
}

function isChefuAppId(value: string): value is ChefuAppId {
    return (
        value === "root" ||
        value === "academy" ||
        value === "admin" ||
        value === "flow" ||
        value === "quantum" ||
        value === "infinity" ||
        value === "logix" ||
        value === "logix-dash" ||
        value === "merchant" ||
        value === "cloudence" ||
        value === "nook"
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

export class MfaRequiredLoginError extends Error {
    constructor(
        public readonly pendingCredential: string,
        public readonly enrollmentId: string,
    ) {
        super("Multi-factor authentication is required.");
        this.name = "MfaRequiredLoginError";
    }
}

export type SessionTrustResult = {
    trustDeviceVerificationRequired?: boolean;
    trustDeviceRequiresAuthenticator?: boolean;
};

export async function loginWithPassword(
    email: string,
    password: string,
    appId: ChefuAppId,
    trustDevice = false,
): Promise<SessionTrustResult> {
    const response = await fetch(apiUrl("/auth/session/password"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            [CHEFU_APP_HEADER]: appId,
        },
        credentials: "include",
        body: JSON.stringify({ email, password, trustDevice }),
    });
    const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        mfaRequired?: boolean;
        mfaPendingCredential?: string;
        mfaInfo?: Array<{
            mfaEnrollmentId?: string;
            factorId?: string;
        }>;
        retryAfter?: number;
        requestId?: string;
    };

    if (!response.ok) {
        if (result.mfaRequired) {
            const totpFactor = result.mfaInfo?.find((factor) => factor.factorId === "totp");
            if (!result.mfaPendingCredential || !totpFactor?.mfaEnrollmentId) {
                throw new Error("The server could not start multi-factor sign-in. Please try again.");
            }
            throw new MfaRequiredLoginError(
                result.mfaPendingCredential,
                totpFactor.mfaEnrollmentId,
            );
        }
        if (response.status === 401) {
            throw new Error("Invalid email or password.");
        }
        if (response.status === 429 && typeof result.retryAfter === "number") {
            throw new Error(
                `Too many login attempts. Please try again in ${result.retryAfter} seconds.`,
            );
        }

        const message =
            result.error ||
            result.message ||
            "Unable to sign in. Please try again.";
        const requestId = result.requestId ? ` Request ID: ${result.requestId}` : "";
        throw new Error(`${message}${requestId}`);
    }
    return (await response.json().catch(() => ({}))) as SessionTrustResult;
}

export async function completePasswordMfaSession(
    email: string,
    pendingCredential: string,
    enrollmentId: string,
    verificationCode: string,
    appId: ChefuAppId,
    trustDevice = false,
): Promise<SessionTrustResult> {
    const response = await fetch(apiUrl("/auth/session/mfa"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            [CHEFU_APP_HEADER]: appId,
        },
        credentials: "include",
        body: JSON.stringify({
            email,
            mfaPendingCredential: pendingCredential,
            mfaEnrollmentId: enrollmentId,
            verificationCode,
            trustDevice,
        }),
    });

    if (!response.ok) throw new Error(await readApiError(response));
    return (await response.json().catch(() => ({}))) as SessionTrustResult;
}

export async function sendEmailVerificationCode(
    email: string,
    userName: string,
    appId: ChefuAppId,
): Promise<{ cooldownSeconds: number; resendsRemaining: number }> {
    const response = await fetch(apiUrl("/auth/email-verification/send"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, userName, appId }),
    });
    if (!response.ok) throw new Error(await readApiError(response));
    const result = (await response.json()) as {
        cooldownSeconds?: number;
        resendsRemaining?: number;
    };
    return {
        cooldownSeconds: Number(result.cooldownSeconds || 0),
        resendsRemaining: Number(result.resendsRemaining || 0),
    };
}

export async function requestPasswordResetEmail(
    email: string,
    appId: ChefuAppId,
    returnTo: string,
) {
    const response = await fetch(apiUrl("/auth/password-reset/request"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            [CHEFU_APP_HEADER]: appId,
        },
        body: JSON.stringify({ email, appId, returnTo }),
    });
    if (response.ok) return;

    if (response.status === 429) {
        throw new Error("Too many reset attempts. Please wait and try again later.");
    }
    throw new Error(await readApiError(response));
}

export async function verifyEmailVerificationCode(
    email: string,
    code: string,
    password: string,
    displayName: string,
    appId: ChefuAppId,
) {
    const response = await fetch(apiUrl("/auth/email-verification/verify"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            [CHEFU_APP_HEADER]: appId,
        },
        credentials: "include",
        body: JSON.stringify({ email, code, password, displayName }),
    });
    if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
            message?: string;
            error?: string;
            attemptsRemaining?: number;
        };
        if (typeof data.attemptsRemaining === "number") {
            throw new EmailVerificationCodeError(
                data.message || "Incorrect verification code.",
                data.attemptsRemaining,
            );
        }
        throw new Error(
            data.message || data.error || "Unable to complete email verification.",
        );
    }
}

export class EmailVerificationCodeError extends Error {
    constructor(
        message: string,
        public readonly attemptsRemaining: number,
    ) {
        super(message);
        this.name = "EmailVerificationCodeError";
    }
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

    const response = await fetch(apiUrl(path), {
        method: "DELETE",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(await readApiError(response));
    }

    const result = (await response.json()) as {
        ok?: boolean;
        revoked?: boolean;
    };
    if (!result.ok || (globalLogout && !result.revoked)) {
        throw new Error("The server could not confirm that all sessions were signed out.");
    }
}
