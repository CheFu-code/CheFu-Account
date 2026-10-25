"use client";

import { useEffect } from "react";
import { useTrustedBrowser } from "./useTrustedBrowser";

export function TrustedBrowserChoice({ email, checked, onChange, disabled }: {
    email: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled: boolean;
}) {
    const { checking, trusted } = useTrustedBrowser(email);
    useEffect(() => { onChange(false); }, [email, onChange]);
    if (checking || trusted) return null;
    return (
        <label className="account-auth-trust-device flex items-start gap-2.5 text-sm">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                disabled={disabled}
                className="account-auth-checkbox mt-0.5 size-4"
            />
            <span>
                Trust this browser for 90 days
                <span className="account-auth-muted mt-0.5 block text-xs">
                    Only select this on a private device you control.
                </span>
            </span>
        </label>
    );
}
