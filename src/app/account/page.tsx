import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPageClient } from "./AccountPageClient";

export const metadata: Metadata = {
    title: "Manage account",
    description:
        "Manage your account profile, security preferences, sessions, and more.",
};

export default function AccountPage() {
    return (
        <Suspense>
            <AccountPageClient />
        </Suspense>
    );
}
