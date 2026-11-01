import { apiUrl, resolveChefuApp, type ChefuAppId } from "./chefu-account";
import { validateAuthRedirectParams, validateReturnToForApp } from "./redirect-policy";
import { shareAuthRead } from "./auth-reads";

export function sessionReuseTarget(params: URLSearchParams) {
    if (validateAuthRedirectParams(params) || params.has("prompt")) return null;
    const appId = resolveChefuApp(params.get("app"));
    const target = validateReturnToForApp(params.get("returnTo") || params.get("next") || "/account", appId);
    if (!target.ok) return null;
    const destination = new URL(target.target, "https://myaccount.chefu.co.za");
    // Never bounce between auth pages, and honor interactive sign-in requests.
    if (["/login", "/register", "/logout", "/forgot-password"].includes(destination.pathname.replace(/\/+$/, ""))) return null;
    if (destination.searchParams.has("prompt")) return null;
    return { appId, target: target.target };
}

// Share only concurrent checks (including React StrictMode remounts). Never
// persist or cache authentication decisions across navigation or sign-out.
export function hasReusableSession(appId: ChefuAppId): Promise<boolean> {
    return shareAuthRead(`session:${appId}`, async signal => {
        const controller = new AbortController();
        const abort = () => controller.abort();
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) controller.abort();
        const timeout = setTimeout(() => controller.abort(), 3_000);
        try {
            const response = await fetch(apiUrl("/auth/session/status"), {
                credentials: "include", cache: "no-store", redirect: "error",
                signal: controller.signal, headers: { "x-chefu-app": appId },
            });
            if (!response.ok) return false;
            const result: unknown = await response.json();
            return typeof result === "object" && result !== null
                && Reflect.get(result, "authenticated") === true;
        } catch {
            return false;
        } finally {
            clearTimeout(timeout);
            signal.removeEventListener("abort", abort);
        }
    }).catch(() => false);
}
