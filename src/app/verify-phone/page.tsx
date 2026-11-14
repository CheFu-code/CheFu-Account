import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyPhoneClient } from "./VerifyPhoneClient";

export const metadata: Metadata = { title: "Verify phone number", robots: { index: false, follow: false } };
export default function VerifyPhonePage() {
    return <Suspense><VerifyPhoneClient /></Suspense>;
}
