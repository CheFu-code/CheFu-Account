import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { readCurrentAccount } from "../../../lib/account-read";
import { SupersededAuthReadError } from "../../../lib/auth-reads";
import type { ChefuAppId } from "../../../lib/chefu-account";
import type { AccountResponse } from "./account-types";

export function useAccountLoad(
    appId: ChefuAppId,
    hydrate: (data: AccountResponse) => void,
    currentPath: () => string,
    preview?: AccountResponse,
) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const callbacks = useRef({ hydrate, currentPath });
    callbacks.current = { hydrate, currentPath };
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        async function load() {
            try {
                if (preview) {
                    if (!cancelled) callbacks.current.hydrate(preview);
                    return;
                }
                const result = await readCurrentAccount(appId);
                if (cancelled) return;
                if (result.status === 401) {
                    router.replace(`/login?returnTo=${encodeURIComponent(callbacks.current.currentPath())}`);
                    return;
                }
                if (result.data) callbacks.current.hydrate(result.data);
            } catch (error) {
                if (cancelled || error instanceof SupersededAuthReadError) return;
                toast.error("Unable to load your account.", {
                    description: error instanceof Error ? error.message : "Please refresh and try again.",
                });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        void load();
        return () => { cancelled = true; };
    }, [appId, router, preview]);
    return isLoading;
}
