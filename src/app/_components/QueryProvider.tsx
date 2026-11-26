"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { subscribePageInvalidation } from "../../lib/account-page-cache";

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: Infinity,
                        gcTime: Infinity,
                        refetchOnWindowFocus: false,
                        refetchOnReconnect: false,
                        refetchOnMount: false,
                        retry: false,
                    },
                },
            }),
    );
    useEffect(() => subscribePageInvalidation(() => {
        // Persisted reads are invalidated first. Remove React Query's independent
        // memory layer too so a later visit cannot reuse obsolete account data.
        queryClient.clear();
    }), [queryClient]);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
