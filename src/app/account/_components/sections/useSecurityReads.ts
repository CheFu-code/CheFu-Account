import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { readAccountData } from "../../../../lib/account-data-api";
import type { SecuritySummary } from "./mfa-security-utils";

export type TrustedDevice = {
    id: string;
    deviceName: string;
    createdAt: number;
    lastSeenAt: number;
    expiresAt: number;
    isCurrent: boolean;
};

export function useSecurityReads(appId: string, uid: string) {
    const queryClient = useQueryClient();
    const [isRefreshingSummary, setIsRefreshingSummary] = useState(false);
    const [isRefreshingTrustedDevices, setIsRefreshingTrustedDevices] =
        useState(false);
    const summaryKey = useMemo(
        () => ["security-summary", appId, uid] as const,
        [appId, uid],
    );
    const trustedDevicesKey = useMemo(
        () => ["trusted-devices", appId, uid] as const,
        [appId, uid],
    );
    const summaryQuery = useQuery({
        queryKey: summaryKey,
        queryFn: () => readAccountData<SecuritySummary>("/auth/security", appId),
        enabled: Boolean(uid),
    });
    const trustedDevicesQuery = useQuery({
        queryKey: trustedDevicesKey,
        queryFn: async () => {
            const data = await readAccountData<{ devices: TrustedDevice[] }>(
                "/auth/trusted-devices",
                appId,
            );
            if (!Array.isArray(data?.devices)) {
                throw new Error("Could not load trusted devices.");
            }
            return data.devices;
        },
        enabled: Boolean(uid),
    });

    useEffect(() => {
        if (summaryQuery.error) {
            toast.error("Unable to load security status.", {
                description:
                    summaryQuery.error instanceof Error
                        ? summaryQuery.error.message
                        : "Please refresh and try again.",
            });
        }
    }, [summaryQuery.error]);

    useEffect(() => {
        if (trustedDevicesQuery.error) {
            toast.error("Unable to load trusted devices.", {
                description:
                    trustedDevicesQuery.error instanceof Error
                        ? trustedDevicesQuery.error.message
                        : "Please refresh and try again.",
            });
        }
    }, [trustedDevicesQuery.error]);

    const loadSecuritySummary = useCallback(
        async (refresh = false) => {
            setIsRefreshingSummary(true);
            try {
                const summary = await readAccountData<SecuritySummary>(
                    "/auth/security",
                    appId,
                    refresh,
                );
                queryClient.setQueryData(summaryKey, summary);
            } catch (error) {
                toast.error("Unable to load security status.", {
                    description:
                        error instanceof Error
                            ? error.message
                            : "Please refresh and try again.",
                });
            } finally {
                setIsRefreshingSummary(false);
            }
        },
        [appId, queryClient, summaryKey],
    );

    const loadTrustedDevices = useCallback(
        async (refresh = false) => {
            setIsRefreshingTrustedDevices(true);
            try {
                const data = await readAccountData<{ devices: TrustedDevice[] }>(
                    "/auth/trusted-devices",
                    appId,
                    refresh,
                );
                if (!Array.isArray(data?.devices)) {
                    throw new Error("Could not load trusted devices.");
                }
                queryClient.setQueryData(trustedDevicesKey, data.devices);
            } catch (error) {
                toast.error("Unable to load trusted devices.", {
                    description:
                        error instanceof Error
                            ? error.message
                            : "Please refresh and try again.",
                });
            } finally {
                setIsRefreshingTrustedDevices(false);
            }
        },
        [appId, queryClient, trustedDevicesKey],
    );

    const setSummary = useCallback(
        (summary: SecuritySummary) => {
            queryClient.setQueryData(summaryKey, summary);
        },
        [queryClient, summaryKey],
    );

    return {
        summary: summaryQuery.data ?? null,
        setSummary,
        trustedDevices: trustedDevicesQuery.data ?? [],
        isLoadingTrustedDevices:
            trustedDevicesQuery.isPending || isRefreshingTrustedDevices,
        isLoading: summaryQuery.isPending || isRefreshingSummary,
        isReady: !summaryQuery.isPending,
        loadSecuritySummary,
        loadTrustedDevices,
    };
}
