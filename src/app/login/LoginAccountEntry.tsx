"use client";

import { useCallback, useState } from "react";
import type { AccountAuthScreenProps } from "@/app/types";
import type { ChefuAppId } from "../../lib/chefu-account";
import { AccountAuthScreen } from "../_components/AccountAuthScreen";
import { AccountChooser } from "./AccountChooser";

type Props = Extract<AccountAuthScreenProps, { mode: "login" }> & {
    appId: ChefuAppId;
    selectAccount: boolean;
    onSelected: () => void;
};

export function LoginAccountEntry({ appId, selectAccount, onSelected, ...form }: Props) {
    const [showChooser, setShowChooser] = useState(selectAccount);
    const [hasSavedAccounts, setHasSavedAccounts] = useState(false);
    const onAvailability = useCallback((available: boolean) => {
        setHasSavedAccounts(available);
        if (!available) setShowChooser(false);
    }, []);

    if (selectAccount && showChooser) return <AccountChooser
        appId={appId} appName={form.appName} registerHref={form.alternateHref}
        onAvailability={onAvailability} onSelected={onSelected}
        onAddAccount={() => setShowChooser(false)}
    />;

    return <AccountAuthScreen {...form} onReturnToPicker={selectAccount && hasSavedAccounts ? () => {
        form.setPassword(""); form.setEmail(""); form.setTrustDevice?.(false);
        setShowChooser(true);
    } : undefined} />;
}
