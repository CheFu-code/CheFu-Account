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
        if (!reuse || new URLSearchParams(params).get("prompt") === "select_account") {
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
            <div
                role="status"
                aria-live="polite"
                className="account-auth-card flex w-full max-w-sm flex-col items-center rounded-xl border p-8 text-center shadow-sm"
            >
                <span
                    className="mb-5 grid size-12 place-items-center rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin"
                    aria-hidden="true"
                />
                <p className="text-base font-semibold text-[var(--fg)]">
                    Checking your session
                </p>
                <p className="account-auth-muted mt-2 text-sm">
                    Securely preparing your account…
                </p>
            </div>
        </main>
    );
}
