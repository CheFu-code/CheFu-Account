"use client";

import { useRouter } from "next/navigation";
import type { ChefuAppId } from "../../../lib/chefu-account";
import { PhoneVerificationDialog } from "../../register/PhoneVerificationDialog";

export function AccountPhoneGate({ phone, appId }: { phone: string; appId: ChefuAppId }) {
    const router = useRouter();
    return <main className="account-auth-screen min-h-dvh">
        <PhoneVerificationDialog appId={appId} initialPhone={phone} required
            onComplete={() => window.location.reload()}
            onSkip={() => router.replace(`/logout?${new URLSearchParams({ app: appId, returnTo: "/account" })}`)} />
    </main>;
}
