import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { readAccountData } from "../../../../lib/account-data-api";
import type { SecuritySummary } from "./mfa-security-utils";

export type TrustedDevice = {
    id: string; deviceName: string; createdAt: number; lastSeenAt: number;
    expiresAt: number; isCurrent: boolean;
};

export function useSecurityReads(appId: string) {
    const [summary, setSummary] = useState<SecuritySummary | null>(null);
    const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
    const [isLoadingTrustedDevices, setIsLoadingTrustedDevices] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const loadSecuritySummary = useCallback(async (refresh = false) => {
        setIsLoading(true);
        try {
            setSummary(await readAccountData<SecuritySummary>("/auth/security", appId, refresh));
        } catch (error) {
            toast.error("Unable to load security status.", { description: error instanceof Error ? error.message : "Please refresh and try again." });
        } finally { setIsLoading(false); setIsReady(true); }
    }, [appId]);
    const loadTrustedDevices = useCallback(async (refresh = false) => {
        setIsLoadingTrustedDevices(true);
        try {
            const data = await readAccountData<{ devices: TrustedDevice[] }>("/auth/trusted-devices", appId, refresh);
            if (!Array.isArray(data?.devices)) throw new Error("Could not load trusted devices.");
            setTrustedDevices(data.devices);
        } catch (error) {
            toast.error("Unable to load trusted devices.", { description: error instanceof Error ? error.message : "Please refresh and try again." });
        } finally { setIsLoadingTrustedDevices(false); }
    }, [appId]);
    useEffect(() => {
        void loadSecuritySummary();
        void loadTrustedDevices();
    }, [loadSecuritySummary, loadTrustedDevices]);
    return { summary, setSummary, trustedDevices, isLoadingTrustedDevices, isLoading, isReady, loadSecuritySummary, loadTrustedDevices };
}
