import type { Metadata } from "next";
import { Suspense } from "react";
import { LogoutClient } from "./LogoutClient";

export const metadata: Metadata = {
    title: "Sign out",
    description: "Sign out of your CheFu Account.",
};

export default function LogoutPage() {
    return (
        <Suspense>
            <LogoutClient />
        </Suspense>
    );
}
