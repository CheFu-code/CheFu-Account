import { NextResponse, type NextRequest } from "next/server";
import { validateAuthRedirectParams } from "./lib/redirect-policy";

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

    const response = NextResponse.next();
    response.headers.set(
        "x-request-id",
        request.headers.get("x-request-id") || crypto.randomUUID(),
    );
    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2)).*)",
    ],
};
