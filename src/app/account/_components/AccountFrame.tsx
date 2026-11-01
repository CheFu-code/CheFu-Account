"use client";

import { Loader2, LogOut, Menu, Plus, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { navItems } from "./account-data";
import { Toggle } from "./Toggle";
import type { AccountSession } from "../../../lib/chefu-account";

const THEME_STORAGE_KEY = "chefu-account-theme";

type AccountFrameProps = {
    activeSection: string;
    children: ReactNode;
    isSigningOut: boolean;
    onSelectSection: (id: string) => void;
    onSignOut: () => void;
    accounts: AccountSession[];
    onSwitchAccount: (slot: number) => void;
    isSwitchingAccount: boolean;
};

export function AccountFrame(props: AccountFrameProps) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [themeLoaded, setThemeLoaded] = useState(false);

    useEffect(() => {
        setDarkMode(window.localStorage.getItem(THEME_STORAGE_KEY) === "dark");
        setThemeLoaded(true);
    }, []);

    useEffect(() => {
        if (!themeLoaded) {
            return;
        }
        const theme = darkMode ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", theme);
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [darkMode, themeLoaded]);
    const navigate = (id: string) => {
        props.onSelectSection(id);
        setMobileNavOpen(false);
    };

    return (
        <div className="account-ui account-shell">
            <header className="account-mobile-header">
                <Brand compact />
                <button
                    type="button"
                    className="account-icon-button"
                    aria-label={
                        mobileNavOpen
                            ? "Close navigation menu"
                            : "Open navigation menu"
                    }
                    onClick={() => setMobileNavOpen((open) => !open)}
                >
                    {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
                </button>
            </header>

            <aside
                className={`account-sidebar ${mobileNavOpen ? "account-sidebar-open" : ""}`}
            >
                <div className="account-sidebar-brand">
                    <Brand />
                    <button
                        type="button"
                        className="account-icon-button md:hidden"
                        aria-label="Close navigation menu"
                        onClick={() => setMobileNavOpen(false)}
                    >
                        <X size={16} />
                    </button>
                </div>

                <nav
                    className="account-sidebar-nav"
                    aria-label="Account settings navigation"
                >
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`account-nav-item ${props.activeSection === item.id ? "account-nav-item-active" : ""}`}
                            aria-current={
                                props.activeSection === item.id
                                    ? "page"
                                    : undefined
                            }
                            onClick={() => navigate(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="account-theme-row">
                    <span>{darkMode ? "Dark mode" : "Light mode"}</span>
                    <Toggle
                        checked={darkMode}
                        onChange={setDarkMode}
                        id="theme-toggle"
                    />
                </div>
                <div className="account-sidebar-accounts">
                    <div className="account-sidebar-accounts-heading">
                        <span className="flex items-center gap-2">
                            <Users size={14} aria-hidden="true" />
                            Accounts
                        </span>
                        <span className="account-sidebar-accounts-count">
                            {props.accounts.length}
                        </span>
                    </div>
                    <div className="account-sidebar-account-list">
                        {props.accounts.map((account) => {
                            const label =
                                account.email.split("@")[0] || account.email;
                            const initial = label.charAt(0).toUpperCase();

                            return account.active ? (
                                <div
                                    key={`${account.slot}-${account.email}`}
                                    className="account-sidebar-account account-sidebar-account-active"
                                    title={account.email}
                                >
                                    <span className="account-sidebar-account-avatar">
                                        {initial}
                                    </span>
                                    <span className="account-sidebar-account-details">
                                        <span className="account-sidebar-account-name">
                                            {label}
                                        </span>
                                        <span className="account-sidebar-account-status">
                                            Current account
                                        </span>
                                    </span>
                                    <span
                                        className="account-sidebar-account-dot"
                                        aria-label="Active account"
                                    />
                                </div>
                            ) : (
                                <button
                                    key={`${account.slot}-${account.email}`}
                                    type="button"
                                    className="account-sidebar-account"
                                    disabled={props.isSwitchingAccount}
                                    onClick={() =>
                                        account.slot !== null &&
                                        props.onSwitchAccount(account.slot)
                                    }
                                    title={`Switch to ${account.email}`}
                                >
                                    <span className="account-sidebar-account-avatar">
                                        {initial}
                                    </span>
                                    <span className="account-sidebar-account-details">
                                        <span className="account-sidebar-account-name">
                                            {label}
                                        </span>
                                        <span className="account-sidebar-account-status">
                                            {account.email}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <Link
                        href="/login?prompt=select_account&returnTo=%2Faccount"
                        className="account-sidebar-add-account"
                    >
                        <Plus size={14} aria-hidden="true" />
                        Add account
                    </Link>
                </div>
                <div className="account-sidebar-signout">
                    <button
                        type="button"
                        className="account-signout-button"
                        onClick={props.onSignOut}
                        disabled={props.isSigningOut}
                    >
                        {props.isSigningOut ? (
                            <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                            />
                        ) : (
                            <LogOut className="size-4" aria-hidden="true" />
                        )}
                        {props.isSigningOut ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            </aside>

            <main className="account-main">{props.children}</main>
        </div>
    );
}

function Brand({ compact = false }: { compact?: boolean }) {
    return (
        <Link href="/account" className="flex items-center gap-3">
            <span
                role="img"
                aria-label="Chefu Technologies"
                className={`block shrink-0 bg-[var(--fg)] ${compact ? "h-5" : "h-6"} aspect-[512/359]`}
                style={{
                    maskImage: "url(/ct-logo.png)",
                    WebkitMaskImage: "url(/ct-logo.png)",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    maskPosition: "center",
                    WebkitMaskPosition: "center",
                    maskSize: "contain",
                    WebkitMaskSize: "contain",
                }}
            />
            {!compact ? (
                <span>
                    <span className="block text-[13px] font-semibold tracking-wide text-[var(--fg)]">
                        My Account
                    </span>
                    <span className="block text-[11px] text-[var(--fg-muted)]">
                        Account settings
                    </span>
                </span>
            ) : (
                <span className="text-sm font-semibold text-[var(--fg)]">
                    My Account
                </span>
            )}
        </Link>
    );
}
