export type ChefuAppId = "academy" | "admin" | "flow" | "muzalo" | "quantum" | "synapse" | "drippybanks";

export type RedirectTargetKind = "relative" | "app-origin" | "oauth-authorize";

export type RedirectValidationResult =
    | {
          ok: true;
          target: string;
          kind: RedirectTargetKind;
      }
    | {
          ok: false;
          reason: RedirectValidationReason;
          message: string;
      };

export type RedirectValidationReason =
    | "duplicate_param"
    | "invalid_app"
    | "invalid_oauth_authorize"
    | "invalid_relative_path"
    | "missing_value"
    | "too_long"
    | "untrusted_origin"
    | "unsafe_url";

type AppRedirectPolicy = {
    allowedOrigins: readonly string[];
    oauthClientIds: readonly string[];
};

type OauthClientRedirectPolicy = {
    appId: ChefuAppId;
    redirectUris: readonly string[];
};

const MAX_RETURN_TO_LENGTH = 2048;

const CHEFU_APP_RETURN_TO_POLICY: Record<ChefuAppId, AppRedirectPolicy> = {
    academy: {
        allowedOrigins: [
            "https://academy.chefuinc.com",
            "https://chefuinc.com",
            "https://myaccount.chefuinc.com",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        oauthClientIds: ["chefu-academy-mobile", "chefu-academy-web", "chefu-inc-web"],
    },
    admin: {
        allowedOrigins: [
            "https://internal.chefuinc.com",
            "http://localhost:3004",
            "http://127.0.0.1:3004",
        ],
        oauthClientIds: ["chefu-admin-web"],
    },
    flow: {
        allowedOrigins: [
            "https://flow.chefuinc.com",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
        ],
        oauthClientIds: ["flow-web"],
    },
    muzalo: {
        allowedOrigins: [
            "https://muzalo.chefuinc.com",
            "http://localhost:3002",
            "http://127.0.0.1:3002",
        ],
        oauthClientIds: ["muzalo-web"],
    },
    quantum: {
        allowedOrigins: [
            "https://quantum.chefuinc.com",
            "http://localhost:3003",
            "http://127.0.0.1:3003",
        ],
        oauthClientIds: ["quantum-mobile", "quantum-web"],
    },
    synapse: {
        allowedOrigins: [
            "https://synapse.chefuinc.com",
            "http://localhost:3005",
            "http://127.0.0.1:3005",
        ],
        oauthClientIds: [],
    },
    drippybanks: {
        allowedOrigins: [
            "https://drippybanks.chefuinc.com",
            "https://drippybanks.vercel.app",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        oauthClientIds: [],
    },
};

const OAUTH_AUTHORIZE_ORIGINS = [
    "https://api.chefuinc.com",
    "http://localhost:4000",
    "http://127.0.0.1:4000",
];

const OAUTH_CLIENT_RETURN_TO_POLICY: Record<string, OauthClientRedirectPolicy> = {
    "chefu-academy-web": {
        appId: "academy",
        redirectUris: [
            "https://academy.chefuinc.com/auth/callback",
            "http://localhost:3000/auth/callback",
        ],
    },
    "chefu-academy-mobile": {
        appId: "academy",
        redirectUris: ["chefu-academy://auth/sso"],
    },
    "chefu-admin-web": {
        appId: "admin",
        redirectUris: [
            "https://internal.chefuinc.com/auth/callback",
            "http://localhost:3004/auth/callback",
        ],
    },
    "chefu-inc-web": {
        appId: "academy",
        redirectUris: [
            "https://chefuinc.com/auth/callback",
            "https://myaccount.chefuinc.com/auth/callback",
            "http://localhost:3000/auth/callback",
        ],
    },
    "flow-web": {
        appId: "flow",
        redirectUris: [
            "https://flow.chefuinc.com/auth/callback",
            "http://localhost:3001/auth/callback",
        ],
    },
    "muzalo-web": {
        appId: "muzalo",
        redirectUris: [
            "https://muzalo.chefuinc.com/auth/callback",
            "https://music.chefuinc.com/auth/callback",
            "http://localhost:3002/auth/callback",
        ],
    },
    "quantum-mobile": {
        appId: "quantum",
        redirectUris: ["quantum://auth"],
    },
    "quantum-web": {
        appId: "quantum",
        redirectUris: [
            "https://quantum.chefuinc.com/auth/callback",
            "http://localhost:3003/auth/callback",
        ],
    },
};

const OAUTH_AUTHORIZE_QUERY_KEYS = new Set([
    "client_id",
    "code_challenge",
    "code_challenge_method",
    "nonce",
    "redirect_uri",
    "response_mode",
    "response_type",
    "scope",
    "state",
]);

const OAUTH_OPAQUE_PARAM_PATTERN = /^[A-Za-z0-9._~:-]+$/;
const ENCODED_UNSAFE_CHARACTER_PATTERN = /%(?:00|0a|0d|5c)/i;

export function resolveChefuAppId(value?: string | null): ChefuAppId {
    const normalized = value?.trim().toLowerCase();

    if (normalized === "admin" || normalized === "internal") return "admin";
    if (normalized === "flow") return "flow";
    if (normalized === "muzalo" || normalized === "music") return "muzalo";
    if (normalized === "quantum") return "quantum";
    if (normalized === "synapse") return "synapse";
    if (normalized === "drippybanks") return "drippybanks";
    return "academy";
}

export function isKnownChefuAppParam(value?: string | null) {
    if (!value) return true;

    const normalized = value.trim().toLowerCase();
    return (
        normalized === "admin" ||
        normalized === "internal" ||
        normalized === "flow" ||
        normalized === "muzalo" ||
        normalized === "music" ||
        normalized === "quantum" ||
        normalized === "synapse" ||
        normalized === "drippybanks" ||
        normalized === "academy"
    );
}

export function isChefuAppId(value: string): value is ChefuAppId {
    return Object.prototype.hasOwnProperty.call(CHEFU_APP_RETURN_TO_POLICY, value);
}

export function validateReturnToForApp(
    value: string | null | undefined,
    appId: ChefuAppId,
): RedirectValidationResult {
    if (!value) {
        return rejectRedirect("missing_value", "A return target is required.");
    }

    if (value.length > MAX_RETURN_TO_LENGTH) {
        return rejectRedirect("too_long", "The return target is too long.");
    }

    if (hasUnsafeCharacters(value)) {
        return rejectRedirect("unsafe_url", "The return target contains unsafe characters.");
    }

    if (isSafeRelativePath(value)) {
        return {
            ok: true,
            target: value,
            kind: "relative",
        };
    }

    if (looksLikeRelativePath(value)) {
        return rejectRedirect("invalid_relative_path", "The relative return path is invalid.");
    }

    const url = parseAbsoluteUrl(value);
    if (!url || hasUnsafeAbsoluteUrlParts(url)) {
        return rejectRedirect("unsafe_url", "The return target must be a safe absolute URL.");
    }

    const policy = CHEFU_APP_RETURN_TO_POLICY[appId];

    if (isAllowedAppOriginReturn(url, policy)) {
        return {
            ok: true,
            target: url.toString(),
            kind: "app-origin",
        };
    }

    if (isAllowedOauthAuthorizeReturn(url, appId, policy)) {
        return {
            ok: true,
            target: url.toString(),
            kind: "oauth-authorize",
        };
    }

    return rejectRedirect(
        "untrusted_origin",
        "The return target is not allowed for this app.",
    );
}

export function validateAuthRedirectParams(searchParams: URLSearchParams) {
    if (searchParams.getAll("app").length > 1) {
        return rejectRedirect(
            "duplicate_param",
            "The app parameter must appear only once.",
        );
    }

    const appParam = searchParams.get("app");
    const appId = resolveChefuAppId(appParam);

    if (!isKnownChefuAppParam(appParam)) {
        return rejectRedirect("invalid_app", "The requested app is not valid.");
    }

    for (const key of ["returnTo", "next"] as const) {
        const values = searchParams.getAll(key);

        if (values.length > 1) {
            return rejectRedirect(
                "duplicate_param",
                `The ${key} parameter must appear only once.`,
            );
        }

        if (values.length === 1) {
            const result = validateReturnToForApp(values[0], appId);
            if (!result.ok) return result;
        }
    }

    return null;
}

function isAllowedAppOriginReturn(url: URL, policy: AppRedirectPolicy) {
    return (
        policy.allowedOrigins.includes(url.origin) &&
        isAllowedWebProtocol(url) &&
        isSafeUrlPath(url)
    );
}

function isAllowedOauthAuthorizeReturn(
    url: URL,
    appId: ChefuAppId,
    policy: AppRedirectPolicy,
) {
    if (!OAUTH_AUTHORIZE_ORIGINS.includes(url.origin)) return false;
    if (url.pathname !== "/oauth/authorize") return false;
    if (!isAllowedWebProtocol(url)) return false;

    for (const key of url.searchParams.keys()) {
        if (!OAUTH_AUTHORIZE_QUERY_KEYS.has(key)) return false;
        if (url.searchParams.getAll(key).length > 1) return false;
    }

    const clientId = url.searchParams.get("client_id");
    if (!clientId) return false;

    const clientPolicy = OAUTH_CLIENT_RETURN_TO_POLICY[clientId];

    if (!clientPolicy || clientPolicy.appId !== appId) return false;
    if (!policy.oauthClientIds.includes(clientId)) return false;

    const redirectUri = url.searchParams.get("redirect_uri");
    if (!redirectUri || !clientPolicy.redirectUris.includes(redirectUri)) return false;

    if (url.searchParams.get("response_type") !== "code") return false;
    if (url.searchParams.get("code_challenge_method") !== "S256") return false;
    if (!isPkceCodeChallenge(url.searchParams.get("code_challenge"))) return false;
    if (!isOauthOpaqueParam(url.searchParams.get("state"), 16, 512)) return false;
    if (!isOauthOpaqueParam(url.searchParams.get("nonce"), 16, 512)) return false;

    const responseMode = url.searchParams.get("response_mode");
    return !responseMode || responseMode === "jwt" || responseMode === "query";
}

function parseAbsoluteUrl(value: string) {
    try {
        return new URL(value);
    } catch {
        return null;
    }
}

function isSafeRelativePath(value: string) {
    return (
        value.startsWith("/") &&
        !value.startsWith("//") &&
        !value.startsWith("/\\") &&
        !hasUnsafeCharacters(value)
    );
}

function looksLikeRelativePath(value: string) {
    return value.startsWith("/") || value.startsWith("\\");
}

function hasUnsafeAbsoluteUrlParts(url: URL) {
    return Boolean(url.username || url.password || url.hash) || !isSafeUrlPath(url);
}

function isSafeUrlPath(url: URL) {
    return !hasUnsafeCharacters(`${url.pathname}${url.search}`);
}

function hasUnsafeCharacters(value: string) {
    return (
        ENCODED_UNSAFE_CHARACTER_PATTERN.test(value) ||
        Array.from(value).some(
            character => character === "\\" || character.charCodeAt(0) < 0x20,
        )
    );
}

function isAllowedWebProtocol(url: URL) {
    return url.protocol === "https:" || isLocalDevOrigin(url);
}

function isLocalDevOrigin(url: URL) {
    return (
        url.protocol === "http:" &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
}

function isOauthOpaqueParam(
    value: string | null,
    minLength: number,
    maxLength: number,
) {
    return (
        typeof value === "string" &&
        value.length >= minLength &&
        value.length <= maxLength &&
        OAUTH_OPAQUE_PARAM_PATTERN.test(value)
    );
}

function isPkceCodeChallenge(value: string | null) {
    return (
        typeof value === "string" &&
        value.length === 43 &&
        /^[A-Za-z0-9_-]+$/.test(value)
    );
}

function rejectRedirect(
    reason: RedirectValidationReason,
    message: string,
): RedirectValidationResult {
    return {
        ok: false,
        reason,
        message,
    };
}
