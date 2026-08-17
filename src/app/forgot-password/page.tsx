import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordClient } from "./ForgotPasswordClient";

export const metadata: Metadata = {
    title: "Reset password",
    description: "Reset your CHEFU Account password.",
};

export default function ForgotPasswordPage() {
    return (
        <Suspense>
            <ForgotPasswordClient />
        </Suspense>
    );
}
