"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { hasReusableSession, sessionReuseTarget } from "../../lib/session-reuse";

export function ExistingSessionGate({ children }: { children: ReactNode }) {
    const params = useSearchParams().toString();
    const [checkedParams, setCheckedParams] = useState<string | null>(null);
    useEffect(() => {
        let active = true;
        const reuse = sessionReuseTarget(new URLSearchParams(params));
        if (!reuse) {
            setCheckedParams(params);
            return;
        }
        void hasReusableSession(reuse.appId).then(authenticated => {
            if (!active) return;
            if (authenticated) window.location.replace(reuse.target);
            else setCheckedParams(params);
        });
        return () => { active = false; };
    }, [params]);

    if (checkedParams === params) return children;
    return (
        <main className="account-auth-screen flex min-h-dvh items-center justify-center px-4">
            <p role="status" className="account-auth-muted text-sm">Checking your session…</p>
        </main>
    );
}
