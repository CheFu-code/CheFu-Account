"use client";

import { ChevronDown, Loader2, LogOut, Menu, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
    const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
    const accountSwitcherRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (!accountSwitcherOpen) {
            return;
        }

        const closeOnOutsideClick = (event: PointerEvent) => {
            if (
                accountSwitcherRef.current &&
                !accountSwitcherRef.current.contains(event.target as Node)
            ) {
                setAccountSwitcherOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setAccountSwitcherOpen(false);
            }
        };

        document.addEventListener("pointerdown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [accountSwitcherOpen]);
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
                <div className="account-sidebar-account-switcher" ref={accountSwitcherRef}>
                    <button
                        type="button"
                        className="account-sidebar-account-trigger"
                        aria-expanded={accountSwitcherOpen}
                        aria-haspopup="dialog"
                        onClick={() => setAccountSwitcherOpen((open) => !open)}
                    >
                        <AccountAvatar account={getActiveAccount(props.accounts)} />
                        <span className="account-sidebar-account-details">
                            <span className="account-sidebar-account-name">Account</span>
                            <span className="account-sidebar-account-status account-sidebar-account-trigger-email">
                                {getActiveAccountEmail(props.accounts)}
                            </span>
                        </span>
                        <ChevronDown
                            size={15}
                            className={accountSwitcherOpen ? "rotate-180" : ""}
                            aria-hidden="true"
                        />
                    </button>
                    {accountSwitcherOpen ? (
                        <div
                            className="account-sidebar-account-popover"
                            role="dialog"
                            aria-label="Account switcher"
                        >
                            <div className="account-sidebar-account-popover-heading">
                                <span>Choose an account</span>
                                <button
                                    type="button"
                                    className="account-sidebar-account-popover-close"
                                    aria-label="Close account switcher"
                                    onClick={() => setAccountSwitcherOpen(false)}
                                >
                                    <X size={15} aria-hidden="true" />
                                </button>
                            </div>
                            <div className="account-sidebar-account-list">
                                {props.accounts.map((account) => {
                                    const label =
                                        account.fullName?.trim() ||
                                        account.email.split("@")[0] ||
                                        account.email;
                                    return account.active ? (
                                        <div
                                            key={`${account.slot}-${account.email}`}
                                            className="account-sidebar-account account-sidebar-account-active"
                                        >
                                            <AccountAvatar account={account} />
                                            <span className="account-sidebar-account-details">
                                                <span className="account-sidebar-account-name">{label}</span>
                                                <span className="account-sidebar-account-status">{account.email}</span>
                                            </span>
                                            <span className="account-sidebar-account-dot" aria-label="Current account" />
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
                                        >
                                            <AccountAvatar account={account} />
                                            <span className="account-sidebar-account-details">
                                                <span className="account-sidebar-account-name">{label}</span>
                                                <span className="account-sidebar-account-status">{account.email}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <Link
                                href="/login?prompt=select_account&returnTo=%2Faccount"
                                className="account-sidebar-add-account"
                                onClick={() => setAccountSwitcherOpen(false)}
                            >
                                <Plus size={15} aria-hidden="true" />
                                Add another account
                            </Link>
                            <button
                                type="button"
                                className="account-sidebar-signout-all"
                                onClick={props.onSignOut}
                                disabled={props.isSigningOut}
                            >
                                <LogOut size={15} aria-hidden="true" />
                                Sign out of all accounts
                            </button>
                        </div>
                    ) : null}
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

function getActiveAccountEmail(accounts: AccountSession[]) {
    return accounts.find((account) => account.active)?.email || "Signed-in account";
}

function getActiveAccount(accounts: AccountSession[]) {
    return accounts.find((account) => account.active);
}

function AccountAvatar({ account }: { account?: AccountSession }) {
    const [imageFailed, setImageFailed] = useState(false);
    const label =
        account?.fullName?.trim() ||
        account?.email.split("@")[0] ||
        account?.email ||
        "Account";
    const initial = label.charAt(0).toUpperCase() || "A";

    if (!account?.profilePicture || imageFailed) {
        return <span className="account-sidebar-account-avatar">{initial}</span>;
    }

    return (
        <span className="account-sidebar-account-avatar account-sidebar-account-avatar-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={account.profilePicture}
                alt=""
                onError={() => setImageFailed(true)}
            />
        </span>
    );
}
