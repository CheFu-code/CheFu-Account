import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "./LoginClient";

export const metadata: Metadata = {
    title: "Sign in",
    description: "Sign in to your CheFu Account.",
};

export default function LoginPage() {
    return (
        <Suspense>
            <LoginClient />
        </Suspense>
    );
}
