import { apiUrl } from "./chefu-account";
import { authMutationFetch } from "./auth-reads";

export async function removeSavedAccount(slot: number) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= 8) {
        throw new Error("Invalid saved account.");
    }
    const response = await authMutationFetch(apiUrl(`/auth/accounts/${slot}`), {
        method: "DELETE",
        credentials: "include",
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
            data.message || data.error || "Unable to remove saved account.",
        );
    }
}
