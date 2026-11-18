import { NextResponse, type NextRequest } from "next/server";
import { validateAuthRedirectParams } from "./lib/redirect-policy";

function createContentSecurityPolicy(nonce: string) {
    const developmentDirective =
        process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
    return [
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentDirective}`,
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "upgrade-insecure-requests",
    ].join("; ");
}

const FLOW_CONTEXT_PATHS = new Set(["/login", "/register", "/forgot-password"]);
const FLOW_ID_PATTERN = /^[a-f0-9]{32}$/;

const AUTH_REDIRECT_PATHS = new Set([
    "/forgot-password",
    "/login",
    "/logout",
    "/register",
]);

export function middleware(request: NextRequest) {
    if (AUTH_REDIRECT_PATHS.has(request.nextUrl.pathname)) {
        const redirectValidation = validateAuthRedirectParams(request.nextUrl.searchParams);

        if (redirectValidation && !redirectValidation.ok) {
            return NextResponse.json(
                {
                    error: "invalid_return_to",
                    message: redirectValidation.message,
                    reason: redirectValidation.reason,
                },
                { status: 400 },
            );
        }
    }

    // A non-secret navigation identifier only: no authentication state or tokens.
    if (FLOW_CONTEXT_PATHS.has(request.nextUrl.pathname)) {
        const ids = request.nextUrl.searchParams.getAll("flow_id");
        if (ids.length !== 1 || !FLOW_ID_PATTERN.test(ids[0])) {
            const url = request.nextUrl.clone();
            url.searchParams.set("flow_id", crypto.randomUUID().replace(/-/g, ""));
            return NextResponse.redirect(url, { status: 307 });
        }
    }

    const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
    const nonce = btoa(String.fromCharCode(...nonceBytes));
    const contentSecurityPolicy = createContentSecurityPolicy(nonce);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

    const response = NextResponse.next({
        request: { headers: requestHeaders },
    });
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set(
        "x-request-id",
        crypto.randomUUID(),
    );
    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2)).*)",
    ],
};
