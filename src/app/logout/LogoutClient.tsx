"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
    chefuAppLabel,
    clearCurrentChefuAccountSession,
    clearChefuAccountSession,
    resolveChefuApp,
    safeReturnTo,
} from "../../lib/chefu-account";

export function LogoutClient() {
    const searchParams = useSearchParams();
    const appId = resolveChefuApp(searchParams.get("app"));
    const appName = chefuAppLabel(appId);
    const currentOnly = searchParams.get("current") === "true";
    const [logoutError, setLogoutError] = useState("");
    const [retry, setRetry] = useState(0);

    const signOutEverywhere = useCallback(async () => {
        setLogoutError("");
        const [serverResult] = await Promise.allSettled([
            currentOnly
                ? clearCurrentChefuAccountSession()
                : clearChefuAccountSession(),
        ]);

        if (serverResult.status === "rejected") {
            setLogoutError(
                serverResult.reason instanceof Error
                    ? serverResult.reason.message
                    : "The server could not confirm sign-out.",
            );
            return;
        }
        const returnTo = safeReturnTo(searchParams.get("returnTo"), appId, "/login");
        if (currentOnly) {
            const loginParams = new URLSearchParams({
                app: appId,
                returnTo,
                prompt: "select_account",
            });
            window.location.replace(`/login?${loginParams}`);
        } else {
            window.location.replace(returnTo);
        }
    }, [appId, currentOnly, searchParams]);

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
                    {logoutError || "We are closing your session."}
                </p>
                {logoutError ? (
                    <button
                        type="button"
                        onClick={() => setRetry((value) => value + 1)}
                        className="mt-5 rounded-lg bg-[#e5ad5b] px-4 py-2 text-sm font-semibold text-[#11110f]"
                    >
                        {currentOnly ? "Try sign-out again" : "Try global sign-out again"}
                    </button>
                ) : null}
            </div>
        </main>
    );
}
