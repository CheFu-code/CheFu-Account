"use client";

import { CheFuUserDropdown, type CheFuUserDropdownUser } from "chefu-ui";
import { CircleHelp, Grid3X3, Sparkles } from "lucide-react";
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
        <section className="min-h-dvh bg-[#11110f] text-[#f4f0e8]">
            <div className="pointer-events-none fixed inset-0 -z-0 opacity-50 [background-image:linear-gradient(rgba(244,240,232,0.027)_1px,transparent_1px),linear-gradient(90deg,rgba(244,240,232,0.027)_1px,transparent_1px)] [background-size:52px_52px]" />
            <div className="pointer-events-none fixed -left-40 top-20 -z-0 size-150 rounded-full bg-[#e5ad5b]/5 blur-3xl" />

            <header className="sticky top-0 z-30 border-b border-white/10 bg-[#11110f]/86 backdrop-blur-xl">
                <div className="relative mx-auto flex min-h-18 max-w-[1540px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
                    <Link href="/account" className="inline-flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-full bg-[#e5ad5b] text-[#26190a] shadow-[0_0_0_5px_rgba(229,173,91,0.08)]">
                            <Sparkles className="size-4" aria-hidden="true" />
                        </span>
                        <span className="hidden text-sm font-semibold tracking-[0.16em] text-[#f4f0e8] sm:block">
                            CHEFU<span className="text-[#e5ad5b]">/</span>ACCOUNT
                        </span>
                    </Link>

                    <p className="hidden absolute left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f887d] md:block">
                        Personal workspace
                    </p>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href="https://chefuinc.com/contact"
                            className="hidden size-9 items-center justify-center rounded-full border border-white/12 text-[#bdb5a8] transition hover:border-[#e5ad5b]/45 hover:bg-white/5 hover:text-[#f4f0e8] sm:flex"
                            aria-label="Contact CheFu support"
                        >
                            <CircleHelp className="size-4" aria-hidden="true" />
                        </Link>
                        <Link
                            href="https://chefuinc.com/portfolio"
                            className="hidden size-9 items-center justify-center rounded-full border border-white/12 text-[#bdb5a8] transition hover:border-[#e5ad5b]/45 hover:bg-white/5 hover:text-[#f4f0e8] sm:flex"
                            aria-label="Explore CheFu apps"
                        >
                            <Grid3X3 className="size-4" aria-hidden="true" />
                        </Link>
                        <CheFuUserDropdown
                            onSignOut={onSignOut}
                            pendingSignOut={isSigningOut}
                            triggerClassName="rounded-full border-white/14 bg-white/4 hover:bg-white/8"
                            user={user}
                            variant="cyan"
                        />
                    </div>
                </div>
            </header>

            <div className="relative z-10 mx-auto w-full max-w-[1540px] px-4 pb-8 pt-5 sm:px-6 lg:px-10 lg:py-8">
                <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Account sections">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelectSection(item.id)}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                                activeSection === item.id
                                    ? "border-[#e5ad5b]/55 bg-[#e5ad5b]/12 text-[#ffd18a]"
                                    : "border-white/10 bg-white/3 text-[#bdb5a8] hover:bg-white/7"
                            }`}
                            aria-current={activeSection === item.id ? "page" : undefined}
                        >
                            <item.icon className="size-3.5" aria-hidden="true" />
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
                    <aside className="hidden lg:block">
                        <nav className="sticky top-26" aria-label="Account sections">
                            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#797267]">
                                Account settings
                            </p>
                            <div className="space-y-1">
                                {navItems.map((item, index) => (
                                    <NavButton
                                        key={item.id}
                                        active={activeSection === item.id}
                                        index={index + 1}
                                        item={item}
                                        onClick={() => onSelectSection(item.id)}
                                    />
                                ))}
                            </div>
                            <div className="mt-8 border-t border-white/10 pt-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#797267]">
                                    Currently viewing
                                </p>
                                <p className="mt-2 text-sm font-semibold text-[#f4f0e8]">{activeItem.label}</p>
                                <p className="mt-1 text-xs leading-5 text-[#8f887d]">{activeItem.description}</p>
                            </div>
                        </nav>
                    </aside>
                    <main className="min-w-0">{children}</main>
                </div>
            </div>
        </section>
    );
}

function NavButton({
    active,
    index,
    item,
    onClick,
}: {
    active: boolean;
    index: number;
    item: (typeof navItems)[number];
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                active
                    ? "bg-[#e5ad5b]/12 text-[#f4f0e8]"
                    : "text-[#9e968a] hover:bg-white/5 hover:text-[#f4f0e8]"
            }`}
            aria-current={active ? "page" : undefined}
        >
            <span className={`text-[10px] font-bold tabular-nums ${active ? "text-[#e5ad5b]" : "text-[#635d54]"}`}>
                {String(index).padStart(2, "0")}
            </span>
            <item.icon className={`size-4 ${active ? "text-[#ffd18a]" : "text-[#8f887d] group-hover:text-[#d7d0c5]"}`} aria-hidden="true" />
            <span className="text-sm font-semibold">{item.label}</span>
            {active ? <span className="ml-auto size-1.5 rounded-full bg-[#e5ad5b]" /> : null}
        </button>
    );
}
