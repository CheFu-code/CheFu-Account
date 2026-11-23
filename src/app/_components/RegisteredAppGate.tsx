"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
    installRuntimePolicy,
    type RuntimeAppPolicy,
} from "../../lib/redirect-policy";

// Unknown app pages wait for the server-validated policy before any child can
// resolve app IDs, names, or return URLs. No browser registry fetch is needed.
export function RegisteredAppGate({
    policy,
    children,
}: {
    policy: RuntimeAppPolicy | null;
    children: ReactNode;
}) {
    const [ready, setReady] = useState<string | null>(null);
    useEffect(() => {
        installRuntimePolicy(policy);
        setReady(policy?.id || null);
    }, [policy]);
    if (policy && ready !== policy.id)
        return (
            <main className="flex min-h-dvh items-center justify-center">
                <p>Loading {policy.name} sign-in…</p>
            </main>
        );
    return children;
}
