import { apiUrl, listChefuAccountSessions, type ChefuAppId } from "./chefu-account";
import { readAccountPageData, invalidateAccountPage } from "./account-page-cache";
import { invalidateAuthReads } from "./auth-reads";

export async function readAccountData<T>(path: string, appId = "root", refresh = false): Promise<T> {
    const key = `${appId}:${path}`;
    if (refresh) await invalidateAccountPage(key);
    return readAccountPageData(key, async signal => {
        const response = await fetch(apiUrl(path), { credentials: "include", cache: "no-store", signal, headers: { "x-chefu-app": appId } });
        if (response.status === 401 || response.status === 403) {
            invalidateAuthReads();
            throw new Error("Your session is no longer available. Please sign in again.");
        }
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(typeof data?.message === "string" ? data.message : "Could not load account data. Refresh to try again.");
        return data as T;
    });
}

// Login's account chooser stays fresh; only the authenticated account page
// persists this display list, after /auth/me has validated its UID.
export function readAccountSessions(appId: ChefuAppId) {
    return readAccountPageData(`${appId}:/auth/accounts`, () => listChefuAccountSessions(appId));
}
