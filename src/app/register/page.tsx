import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterClient } from "./RegisterClient";

export const metadata: Metadata = {
    title: "Create account",
    description: "Create your CHEFU Account.",
};

export default function RegisterPage() {
    return (
        <Suspense>
            <RegisterClient />
        </Suspense>
    );
}
