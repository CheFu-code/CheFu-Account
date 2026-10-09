"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
    chefuAppLabel,
    clearChefuAccountSession,
    resolveChefuApp,
    safeReturnTo,
} from "../../lib/chefu-account";

export function LogoutClient() {
    const searchParams = useSearchParams();
    const appId = resolveChefuApp(searchParams.get("app"));
    const appName = chefuAppLabel(appId);
    const [logoutError, setLogoutError] = useState("");
    const [retry, setRetry] = useState(0);

    const signOutEverywhere = useCallback(async () => {
        setLogoutError("");
        const [serverResult] = await Promise.allSettled([
            clearChefuAccountSession(),
        ]);

        if (serverResult.status === "rejected") {
            setLogoutError(
                serverResult.reason instanceof Error
                    ? serverResult.reason.message
                    : "The server could not confirm global sign-out.",
            );
            return;
        }
        const returnTo = safeReturnTo(searchParams.get("returnTo"), appId, "/login");
        window.location.replace(returnTo);
    }, [appId, searchParams]);

    useEffect(() => {
        void signOutEverywhere();
    }, [signOutEverywhere, retry]);

    return (
        <main className="flex min-h-dvh items-center justify-center bg-[#11110f] px-6 text-[#f4f0e8]">
            <div className="rounded-[2rem] border border-white/10 bg-[#1a1916] p-7 text-center shadow-2xl shadow-black/30">
                <span className="mx-auto mb-4 block size-2 animate-pulse rounded-full bg-[#e5ad5b]" />
                <p className="text-lg font-semibold tracking-[-0.02em]">
                    {logoutError ? "Sign-out needs attention" : `Signing out of ${appName}...`}
                </p>
                <p className="mt-2 text-sm text-[#8f887d]">
                    {logoutError || "We are closing your shared session."}
                </p>
                {logoutError ? (
                    <button
                        type="button"
                        onClick={() => setRetry((value) => value + 1)}
                        className="mt-5 rounded-lg bg-[#e5ad5b] px-4 py-2 text-sm font-semibold text-[#11110f]"
                    >
                        Try global sign-out again
                    </button>
                ) : null}
            </div>
        </main>
    );
}
