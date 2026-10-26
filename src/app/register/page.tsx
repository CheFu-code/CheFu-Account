import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterClient } from "./RegisterClient";
import { ExistingSessionGate } from "../_components/ExistingSessionGate";

export const metadata: Metadata = {
    title: "Create account",
    description: "Create your account.",
};

export default function RegisterPage() {
    return (
        <Suspense>
            <ExistingSessionGate><RegisterClient /></ExistingSessionGate>
        </Suspense>
    );
}
