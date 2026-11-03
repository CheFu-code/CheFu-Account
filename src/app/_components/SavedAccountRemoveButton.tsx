"use client";

import { useState } from "react";
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
    if (account.active || account.slot === null) return null;
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(account)}
            aria-label={`Remove saved account ${account.email} from this browser`}
            title="Remove this saved sign-in from this browser"
            className="min-h-11 shrink-0 rounded-lg px-3 text-xs text-[var(--fg-muted)] transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
        >
            Remove
        </button>
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
