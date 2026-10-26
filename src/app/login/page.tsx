import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "./LoginClient";
import { ExistingSessionGate } from "../_components/ExistingSessionGate";

export const metadata: Metadata = {
    title: "Sign in",
    description: "Sign in to your account.",
    robots: {
        index: false,
        follow: false,
        nocache: true,
    },
    referrer: "strict-origin",
    alternates: {
        canonical: "/login",
    },
};

export default function LoginPage() {
    return (
        <Suspense>
            <ExistingSessionGate><LoginClient /></ExistingSessionGate>
        </Suspense>
    );
}
