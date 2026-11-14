import { authMutationFetch } from "./auth-reads";
import { apiUrl, type ChefuAppId } from "./chefu-account";
import type { AccountResponse, PrivacyPreferences } from "../app/account/_components/account-types";

export type PersonalInfoUpdate = Partial<Record<
    "firstName" | "lastName" | "fullname" | "bio" | "website" | "location", string
>>;
export type AccountProfileUpdate = PersonalInfoUpdate & {
    academyProfile?: { privacy: Partial<PrivacyPreferences> };
};

export async function patchAccountProfile(
    appId: ChefuAppId, uid: string, updates: AccountProfileUpdate,
): Promise<AccountResponse> {
    const response = await authMutationFetch(apiUrl("/auth/profile"), {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json", "x-chefu-app": appId },
        body: JSON.stringify(updates),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const message = typeof data?.message === "string" ? data.message
            : Array.isArray(data?.message) ? data.message.join(" ") : "Your account could not be updated.";
        throw new Error(message);
    }
    if (data?.user?.uid !== uid || !data.profile || typeof data.profile !== "object" || Array.isArray(data.profile)) {
        throw new Error("We could not confirm your changes. Please refresh your account before trying again.");
    }
    return data as AccountResponse;
}
