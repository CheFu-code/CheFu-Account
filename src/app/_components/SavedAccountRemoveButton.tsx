"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AccountSession } from "../../lib/chefu-account";

export function SavedAccountRemoveButton({
    account,
    disabled,
    onRemove,
}: {
    account: AccountSession;
    disabled: boolean;
    onRemove: (account: AccountSession) => void;
}) {
    const [confirming, setConfirming] = useState(false);
    if (account.active || account.slot === null) return null;
    return (
        <>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setConfirming(true)}
                aria-label={`Remove saved account ${account.email} from this browser`}
                title="Remove this saved sign-in from this browser"
                className="min-h-11 shrink-0 rounded-lg px-3 text-xs text-[var(--fg-muted)] transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
            >
                Remove
            </button>
            {confirming && (
                <SavedAccountRemovalDialog
                    account={account}
                    disabled={disabled}
                    onCancel={() => setConfirming(false)}
                    onConfirm={() => {
                        if (disabled) return;
                        setConfirming(false);
                        onRemove(account);
                    }}
                />
            )}
        </>
    );
}

export function SavedAccountRemovalDialog({
    account,
    disabled,
    onCancel,
    onConfirm,
}: {
    account: AccountSession;
    disabled: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();
    useEffect(() => {
        const dialog = dialogRef.current;
        dialog?.showModal();
        return () => {
            dialog?.close();
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onCancel={(event) => {
                event.preventDefault();
                onCancel();
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) onCancel();
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-md border-0 bg-transparent p-0 text-[var(--fg)] backdrop:bg-black/60"
        >
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-xl">
                <h2 id={titleId} className="text-lg font-semibold">
                    Remove saved account?
                </h2>
                <p className="mt-2 break-all text-sm font-medium">
                    {account.email}
                </p>
                <p
                    id={descriptionId}
                    className="mt-3 text-sm leading-6 text-[var(--fg-muted)]"
                >
                    This removes the saved sign-in from this browser. Your
                    account and its data will stay intact, and your current
                    account will stay signed in. You can add this account again
                    anytime.
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="min-h-11 rounded-lg border border-[var(--border)] px-4 text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={onConfirm}
                        className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        Remove account
                    </button>
                </div>
            </div>
        </dialog>
    );
}

export function SavedAccountAvatar({ account }: { account: AccountSession }) {
    const [failedUrl, setFailedUrl] = useState<string>();
    const initials = (account.fullName || account.email)
        .split(/\s|@/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
    return (
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--accent)]/15 text-sm font-semibold text-[var(--accent)]">
            {account.profilePicture && failedUrl !== account.profilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={account.profilePicture}
                    alt=""
                    className="size-full object-cover"
                    onError={() => setFailedUrl(account.profilePicture)}
                />
            ) : (
                initials
            )}
        </span>
    );
}
