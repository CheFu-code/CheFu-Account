"use client";

import { useEffect, useRef, useState } from "react";
import {
    listChefuAccountSessions,
    switchChefuAccount,
    type AccountSession,
    type ChefuAppId,
} from "../../lib/chefu-account";
import { removeSavedAccount } from "../../lib/saved-accounts";
import { AccountChooserSkeleton } from "./AccountChooserSkeleton";
import {
    SavedAccountAvatar,
    SavedAccountRemoveButton,
} from "../_components/SavedAccountRemoveButton";

export function AccountChooser({
    appId,
    onAddAccount,
    onSelected,
}: {
    appId: ChefuAppId;
    onAddAccount: () => void;
    onSelected: (account: AccountSession) => void;
}) {
    const [accounts, setAccounts] = useState<AccountSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSwitching, setIsSwitching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const actionLock = useRef(false);

    useEffect(() => {
        let active = true;
        void listChefuAccountSessions(appId)
            .then((result) => {
                if (active) setAccounts(result);
            })
            .catch((cause) => {
                if (active) {
                    setError(
                        cause instanceof Error
                            ? cause.message
                            : "Unable to load your accounts.",
                    );
                }
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });
        return () => {
            active = false;
        };
    }, [appId]);

    async function selectAccount(account: AccountSession) {
        if (actionLock.current) return;
        actionLock.current = true;
        setIsSwitching(true);
        setError(null);
        try {
            if (account.slot !== null) await switchChefuAccount(account.slot);
            onSelected(account);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Unable to switch account.",
            );
            setIsSwitching(false);
            actionLock.current = false;
        }
    }

    async function removeAccount(account: AccountSession) {
        if (actionLock.current || account.active || account.slot === null)
            return;
        actionLock.current = true;
        setIsSwitching(true);
        setError(null);
        setNotice(null);
        try {
            await removeSavedAccount(account.slot);
            setAccounts((current) =>
                current.filter((item) => item.slot !== account.slot),
            );
            setNotice(
                `${account.email} was removed from this browser. You can add it again anytime.`,
            );
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Unable to remove saved account.",
            );
        } finally {
            actionLock.current = false;
            setIsSwitching(false);
        }
    }

    return (
        <main className="account-auth-screen flex min-h-dvh flex-col items-center justify-center px-4 py-12">
            <section className="account-auth-card w-full max-w-105 rounded-xl border p-7 shadow-sm sm:p-9">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Choose an account
                </h1>
                <p className="account-auth-muted mt-1.5 text-sm">
                    Continue to use{" "}
                    {appId === "liftwise" ? "LiftWise" : "your app"}.
                </p>
                {error ? (
                    <p
                        role="alert"
                        className="mt-5 rounded-lg border border-red-300/40 bg-red-500/10 p-3 text-sm text-red-700"
                    >
                        {error}
                    </p>
                ) : null}
                {notice && (
                    <p
                        role="status"
                        className="account-auth-muted mt-4 text-sm"
                    >
                        {notice}
                    </p>
                )}
                <div className="mt-6 space-y-2">
                    {isLoading ? (
                        <AccountChooserSkeleton />
                    ) : accounts.length ? (
                        accounts.map((account) => (
                            <div
                                key={`${account.slot ?? "active"}:${account.email}`}
                                className="flex items-center rounded-lg border border-[var(--border)]"
                            >
                                <button
                                    key={`${account.slot ?? "active"}:${account.email}`}
                                    type="button"
                                    disabled={isSwitching}
                                    onClick={() => void selectAccount(account)}
                                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-3 text-left transition hover:bg-[var(--accent)]/5 disabled:opacity-60"
                                >
                                    <SavedAccountAvatar account={account} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">
                                            {account.fullName || account.email}
                                        </span>
                                        <span className="account-auth-muted block truncate text-xs">
                                            {account.email}
                                        </span>
                                    </span>
                                    {account.active ? (
                                        <span className="text-xs text-[var(--accent)]">
                                            Current
                                        </span>
                                    ) : null}
                                </button>
                                <SavedAccountRemoveButton
                                    account={account}
                                    disabled={isSwitching}
                                    onRemove={(item) =>
                                        void removeAccount(item)
                                    }
                                />
                            </div>
                        ))
                    ) : (
                        <p className="account-auth-muted py-4 text-sm">
                            No saved accounts found.
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onAddAccount}
                    disabled={isSwitching}
                    className="mt-5 h-11 w-full rounded-lg border border-[var(--border-strong)] px-4 text-sm font-semibold text-[var(--fg)] hover:border-[var(--accent)] disabled:opacity-60"
                >
                    {accounts.length ? "Add another account" : "Add account"}
                </button>
            </section>
        </main>
    );
}
