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
        <main className="flex min-h-dvh items-center justify-center bg-[#11110f] px-6 text-[#f4f0e8]">
            <div className="rounded-[2rem] border border-white/10 bg-[#1a1916] p-7 text-center shadow-2xl shadow-black/30">
                <span className="mx-auto mb-4 block size-2 animate-pulse rounded-full bg-[#e5ad5b]" />
                <p className="text-lg font-semibold tracking-[-0.02em]">Signing out of {appName}...</p>
                <p className="mt-2 text-sm text-[#8f887d]">
                    We are closing your shared session.
                </p>
            </div>
        </main>
    );
}
