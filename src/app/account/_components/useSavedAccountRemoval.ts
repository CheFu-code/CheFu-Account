"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { removeSavedAccount } from "../../../lib/saved-accounts";
import type { AccountSession } from "../../../lib/chefu-account";

export function useSavedAccountRemoval() {
    const client = useQueryClient();
    const lock = useRef(false);
    const [isRemoving, setIsRemoving] = useState(false);
    async function removeAccount(account: AccountSession) {
        if (lock.current || account.active || account.slot === null) return;
        lock.current = true;
        setIsRemoving(true);
        try {
            await client.cancelQueries({ queryKey: ["account-sessions"] });
            await removeSavedAccount(account.slot);
            client.setQueriesData<AccountSession[]>(
                { queryKey: ["account-sessions"] },
                (current) =>
                    current?.filter((item) => item.slot !== account.slot),
            );
            await client.invalidateQueries({ queryKey: ["account-sessions"] });
            toast.success(`${account.email} was removed from this browser.`, {
                description: "You can add this account again anytime.",
            });
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to remove saved account.",
            );
        } finally {
            lock.current = false;
            setIsRemoving(false);
        }
    }
    return { isRemoving, removeAccount };
}
