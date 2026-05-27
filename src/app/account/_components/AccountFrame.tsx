"use client";

import { CheFuUserDropdown, type CheFuUserDropdownUser } from "@chefu/ui";
import { CircleHelp, Grid3X3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { navItems } from "./account-data";

type AccountFrameProps = {
    activeSection: string;
    children: ReactNode;
    isSigningOut: boolean;
    onSelectSection: (id: string) => void;
    onSignOut: () => void;
    user: CheFuUserDropdownUser;
};

export function AccountFrame({
    activeSection,
    children,
    isSigningOut,
    onSelectSection,
    onSignOut,
    user,
}: AccountFrameProps) {
    const activeItem = navItems.find((item) => item.id === activeSection) ?? navItems[0];

    return (
        <section className="min-h-dvh bg-[#101216] text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.14),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]" />
            <header className="sticky top-0 z-30 border-b border-white/10 bg-[#111318]/85 backdrop-blur-xl">
                <div className="flex h-[68px] items-center justify-between gap-4 px-5 lg:px-9">
                    <Link href="/account" className="flex items-center gap-3 text-xl font-semibold tracking-tight text-white">
                        <span className="flex size-10 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                            <ShieldCheck className="size-5" aria-hidden="true" />
                        </span>
                        <span>
                            CheFu <span className="text-emerald-300">Account</span>
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            href="https://chefuinc.com/contact"
                            className="hidden size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/10 sm:flex"
                            aria-label="Help"
                        >
                            <CircleHelp className="size-5" aria-hidden="true" />
                        </Link>
                        <Link
                            href="https://chefuinc.com/portfolio"
                            className="hidden size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/10 sm:flex"
                            aria-label="CheFu Apps"
                        >
                            <Grid3X3 className="size-5" aria-hidden="true" />
                        </Link>
                        <CheFuUserDropdown
                            onSignOut={onSignOut}
                            pendingSignOut={isSigningOut}
                            triggerClassName="rounded-full border-white/12 bg-white/[0.03]"
                            user={user}
                            variant="cyan"
                        />
                    </div>
                </div>
            </header>

            <div className="relative mx-auto grid w-full max-w-[1480px] gap-6 px-4 py-6 lg:grid-cols-[310px_minmax(0,1fr)] lg:px-8">
                <aside className="hidden lg:block">
                    <nav className="sticky top-24 overflow-hidden rounded-3xl border border-white/10 bg-[#191b20]/80 p-3 shadow-2xl shadow-black/20" aria-label="Account sections">
                        <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                                Manage
                            </p>
                            <h2 className="mt-2 text-lg font-semibold text-white">{activeItem.label}</h2>
                            <p className="mt-1 text-sm leading-5 text-slate-400">
                                {activeItem.description}
                            </p>
                        </div>
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
                                        ? "border-emerald-200/30 bg-emerald-300/10"
                                        : "border-white/12 bg-white/[0.03]"
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
            className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/10 ${
                active ? "bg-emerald-300/10 ring-1 ring-emerald-200/20" : ""
            }`}
            aria-current={active ? "page" : undefined}
        >
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${item.color}`}>
                <item.icon className="size-6" aria-hidden="true" />
            </span>
            <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{item.label}</span>
                <span className="block truncate text-xs text-slate-400">{item.description}</span>
            </span>
        </button>
    );
}
