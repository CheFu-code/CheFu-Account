"use client";

import { signOut } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { auth } from "../../lib/firebase";
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

    useEffect(() => {
        const returnTo = safeReturnTo(searchParams.get("returnTo"), appId, "/login");

        Promise.allSettled([clearChefuAccountSession(), signOut(auth)]).finally(() => {
            window.location.replace(returnTo);
        });
    }, [appId, searchParams]);

    return (
        <main className="flex min-h-dvh items-center justify-center bg-[#202124] px-6 text-white">
            <div className="rounded-lg border border-white/10 bg-[#2b2c2f] p-6 text-center shadow-xl">
                <p className="text-lg font-semibold">Signing out of {appName} Account...</p>
                <p className="mt-2 text-sm text-slate-400">
                    We are closing your shared CheFu session.
                </p>
            </div>
        </main>
    );
}
