"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    chefuAppLabel,
    listChefuAccountSessions,
    switchChefuAccount,
    type AccountSession,
    type ChefuAppId,
    type SessionTrustResult,
} from "../../lib/chefu-account";
import { removeSavedAccount } from "../../lib/saved-accounts";
import { AccountChooserSkeleton } from "./AccountChooserSkeleton";
import {
    SavedAccountAvatar,
    SavedAccountRemoveButton,
} from "../_components/SavedAccountRemoveButton";

type PendingAccountAction = {
    kind: "select" | "remove";
    account: AccountSession;
    phase?: "signing-in" | "continuing";
};

export function AccountChooser({
    appId,
    appName,
    registerHref,
    onAvailability,
    onAddAccount,
    onSelected,
}: {
    appId: ChefuAppId;
    appName?: string;
    registerHref?: string;
    onAvailability?: (available: boolean) => void;
    onAddAccount: () => void;
    onSelected: (account: AccountSession, result?: SessionTrustResult) => void | Promise<void>;
}) {
    const [accounts, setAccounts] = useState<AccountSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingAction, setPendingAction] = useState<PendingAccountAction | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const actionLock = useRef(false);
    const isSwitching = pendingAction !== null;
    const destination = appName || chefuAppLabel(appId);

    useEffect(() => {
        let active = true;
        void listChefuAccountSessions(appId)
            .then((result) => {
                if (active) {
                    setAccounts(result);
                    onAvailability?.(result.length > 0);
                }
            })
            .catch((cause) => {
                if (active) {
                    setError(
                        cause instanceof Error
                            ? cause.message
                            : "Unable to load your accounts.",
                    );
                    onAvailability?.(false);
                }
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });
        return () => {
            active = false;
        };
    }, [appId, onAvailability]);

    async function selectAccount(account: AccountSession) {
        if (actionLock.current) return;
        actionLock.current = true;
        setPendingAction({ kind: "select", account, phase: "signing-in" });
        setError(null);
        setNotice(null);
        try {
            const result = account.slot !== null ? await switchChefuAccount(account.slot) : undefined;
            setPendingAction({ kind: "select", account, phase: "continuing" });
            await onSelected(account, result);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Unable to switch account.",
            );
            setPendingAction(null);
            actionLock.current = false;
        }
    }

    async function removeAccount(account: AccountSession) {
        if (actionLock.current || account.active || account.slot === null)
            return;
        actionLock.current = true;
        setPendingAction({ kind: "remove", account });
        setError(null);
        setNotice(null);
        try {
            await removeSavedAccount(account.slot);
            setAccounts((current) =>
                current.filter((item) => item.slot !== account.slot),
            );
            if (accounts.every(item => item.slot === account.slot)) onAvailability?.(false);
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
            setPendingAction(null);
        }
    }

    return (
        <main className="account-auth-screen flex min-h-dvh flex-col items-center justify-center px-4 py-12">
            <section className="account-auth-card w-full max-w-105 rounded-xl border p-7 shadow-sm sm:p-9">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {isLoading ? "Continue to sign in" : accounts.length ? "Choose an account" : "Sign in or create an account"}
                </h1>
                <p className="account-auth-muted mt-1.5 text-sm">
                    Continue to use{" "}
                    {destination}.
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
                        accounts.map((account) => {
                            const pending = pendingAction?.account.slot === account.slot && pendingAction.account.email === account.email;
                            return (
                            <div
                                key={`${account.slot ?? "active"}:${account.email}`}
                                className={`flex items-center rounded-lg border transition-colors ${pending
                                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                                    : "border-[var(--border)]"}`}
                            >
                                <button
                                    key={`${account.slot ?? "active"}:${account.email}`}
                                    type="button"
                                    disabled={isSwitching}
                                    aria-busy={pending}
                                    onClick={() => void selectAccount(account)}
                                    className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg p-3 text-left transition hover:bg-[var(--accent)]/5 disabled:cursor-wait ${isSwitching && !pending ? "opacity-50" : ""}`}
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
                                    {pending ? (
                                        <span aria-hidden="true" className="size-5 shrink-0 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] motion-safe:animate-spin" />
                                    ) : account.active ? (
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
                            );
                        })
                    ) : (
                        <p className="account-auth-muted py-4 text-sm">
                            Sign in with your email or create an account to get started.
                        </p>
                    )}
                </div>
                <div role="status" aria-live="polite" aria-atomic="true">
                    {pendingAction && (
                        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--accent)]/5 px-4 py-3">
                            <p className="text-sm font-medium text-[var(--fg)]">
                                {pendingAction.kind === "remove"
                                    ? "Removing saved account…"
                                    : pendingAction.phase === "continuing" ? `Continuing to ${destination}…` : "Signing you in…"}
                            </p>
                            <p className="account-auth-muted mt-1 break-all text-xs">{pendingAction.account.email}</p>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => { if (!actionLock.current) onAddAccount(); }}
                    disabled={isSwitching}
                    className="mt-5 h-11 w-full rounded-lg border border-[var(--border-strong)] px-4 text-sm font-semibold text-[var(--fg)] hover:border-[var(--accent)] disabled:opacity-60"
                >
                    {accounts.length ? "Sign in with another account" : "Sign in"}
                </button>
                {registerHref && <div className="mt-6 border-t border-[var(--border)] pt-5 text-center">
                    <p className="account-auth-muted text-sm">New here?</p>
                    <Link href={registerHref} aria-disabled={isSwitching} onClick={event => { if (actionLock.current) event.preventDefault(); }}
                        className="account-auth-link mt-2 inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold underline underline-offset-4 aria-disabled:opacity-50">
                        Create account
                    </Link>
                </div>}
            </section>
        </main>
    );
}
