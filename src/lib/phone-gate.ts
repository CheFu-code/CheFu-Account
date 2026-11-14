import type { ChefuAppId } from "./chefu-account";

export function phoneVerificationHref(appId: ChefuAppId, returnTo: string) {
    return `/verify-phone?${new URLSearchParams({ app: appId, returnTo })}`;
}
