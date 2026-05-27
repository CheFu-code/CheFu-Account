"use client";

import { CircleHelp, Grid3X3, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { navItems } from "./account-data";

type AccountFrameProps = {
    activeSection: string;
    children: ReactNode;
    isSigningOut: boolean;
    onSelectSection: (id: string) => void;
    onSignOut: () => void;
};

export function AccountFrame({
    activeSection,
    children,
    isSigningOut,
    onSelectSection,
    onSignOut,
}: AccountFrameProps) {
    return (
        <section className="min-h-dvh bg-[#202124] text-white">
            <header className="sticky top-0 z-30 border-b border-white/8 bg-[#2b2c2f]/95 backdrop-blur">
                <div className="flex h-16 items-center justify-between gap-4 px-5 lg:px-9">
                    <Link href="/account" className="text-2xl font-medium tracking-normal text-white">
                        CheFu <span className="text-emerald-300">Account</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            href="https://chefuinc.com/contact"
                            className="hidden size-10 items-center justify-center rounded-full text-slate-200 transition hover:bg-white/10 sm:flex"
                            aria-label="Help"
                        >
                            <CircleHelp className="size-5" aria-hidden="true" />
                        </Link>
                        <Link
                            href="https://chefuinc.com#portfolio"
                            className="hidden size-10 items-center justify-center rounded-full text-slate-200 transition hover:bg-white/10 sm:flex"
                            aria-label="CheFu apps"
                        >
                            <Grid3X3 className="size-5" aria-hidden="true" />
                        </Link>
                        <button
                            type="button"
                            onClick={onSignOut}
                            disabled={isSigningOut}
                            className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                        >
                            {isSigningOut ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <LogOut className="size-4" aria-hidden="true" />
                            )}
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto grid w-full max-w-[1480px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
                <aside className="hidden lg:block">
                    <nav className="sticky top-24 space-y-3" aria-label="Account sections">
                        {navItems.map((item) => (
                            <NavButton
                                key={item.id}
                                active={activeSection === item.id}
                                item={item}
                                onClick={() => onSelectSection(item.id)}
                            />
                        ))}
                    </nav>
                </aside>

                <div className="min-w-0">
                    <div className="mb-5 flex gap-3 overflow-x-auto pb-2 lg:hidden">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelectSection(item.id)}
                                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold text-slate-100 ${
                                    activeSection === item.id
                                        ? "border-white/30 bg-white/10"
                                        : "border-white/12"
                                }`}
                                aria-current={activeSection === item.id ? "page" : undefined}
                            >
                                <span className={`flex size-7 items-center justify-center rounded-full ${item.color}`}>
                                    <item.icon className="size-4" aria-hidden="true" />
                                </span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    {children}
                </div>
            </div>
        </section>
    );
}

function NavButton({
    active,
    item,
    onClick,
}: {
    active: boolean;
    item: (typeof navItems)[number];
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-full px-3 py-3 text-left transition hover:bg-white/10 ${
                active ? "bg-white/10" : ""
            }`}
            aria-current={active ? "page" : undefined}
        >
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${item.color}`}>
                <item.icon className="size-6" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold text-white">{item.label}</span>
        </button>
    );
}
