"use client";

import {
    ArrowUpRight,
    Check,
    Code2,
    KeyRound,
    Search,
    ShieldCheck,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import { connectedApps } from "./account-data";
import type { AccountNavItem, AccountResponse } from "./account-types";

type AccountHomePanelProps = {
    account: AccountResponse;
    accountSearch: string;
    filteredSections: AccountNavItem[];
    initials: string;
    name: string;
    onSearchChange: (value: string) => void;
    onSelectSection: (id: string) => void;
};

export function AccountHomePanel({
    account,
    accountSearch,
    filteredSections,
    initials,
    name,
    onSearchChange,
    onSelectSection,
}: AccountHomePanelProps) {
    const country = account.profile.detectedCountryCode?.toUpperCase() || "Unconfirmed";
    const developerEnabled = account.profile.roles.includes("developer");
    const activeApps = connectedApps.filter((app) => account.profile.apps[app.id]?.enabled);

    return (
        <section className="space-y-6">
            <header className="flex flex-col justify-between gap-6 border-b border-white/10 pb-6 md:flex-row md:items-end">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e5ad5b]">Your account</p>
                    <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] text-[#f4f0e8] sm:text-4xl">
                        Good to have you here{name ? `, ${name.split(" ")[0]}` : ""}.
                    </h1>
                    <p className="mt-2 text-sm text-[#9e968a]">Your identity, access, and preferences at a glance.</p>
                </div>
                <div className="relative w-full max-w-md">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8f887d]" aria-hidden="true" />
                    <input
                        type="search"
                        value={accountSearch}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Find a setting"
                        className="h-12 w-full rounded-2xl border border-white/12 bg-[#1a1916] pl-11 pr-4 text-sm text-[#f4f0e8] outline-none transition placeholder:text-[#736c63] hover:border-white/20 focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
                        aria-label="Search account settings"
                    />
                    {filteredSections.length > 0 ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-white/12 bg-[#24221e] p-1.5 shadow-2xl shadow-black/40">
                            {filteredSections.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onSelectSection(item.id)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/7"
                                >
                                    <item.icon className="size-4 text-[#e5ad5b]" aria-hidden="true" />
                                    <span>
                                        <span className="block text-sm font-semibold text-[#f4f0e8]">{item.label}</span>
                                        <span className="mt-0.5 block text-xs text-[#8f887d]">{item.description}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            </header>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
                <section className="relative overflow-hidden rounded-4xl border border-[#e5ad5b]/20 bg-[#1a1916] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-7">
                    <div className="pointer-events-none absolute -right-12 -top-16 size-60 rounded-full border border-[#e5ad5b]/14" />
                    <div className="pointer-events-none absolute right-8 top-8 size-28 rounded-full border border-[#e5ad5b]/10" />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative grid size-18 shrink-0 place-items-center overflow-hidden rounded-[1.4rem] bg-[#e5ad5b] text-xl font-bold text-[#26190a] shadow-[0_8px_30px_rgba(229,173,91,0.16)]">
                                {account.profile.profilePicture ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={account.profile.profilePicture} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    initials || "C"
                                )}
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e5ad5b]">
                                    <Check className="size-3.5" aria-hidden="true" />
                                    Account active
                                </div>
                                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#f4f0e8]">{name || "Your CHEFU profile"}</h2>
                                <p className="mt-1 text-sm text-[#9e968a]">{account.user.email}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onSelectSection("personal-info")}
                            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-white/14 bg-white/4 px-4 py-2.5 text-xs font-bold text-[#d7d0c5] transition hover:border-[#e5ad5b]/40 hover:bg-white/8 hover:text-[#f4f0e8] sm:self-auto"
                        >
                            Manage profile
                            <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="relative mt-7 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
                        <MiniMetric label="Connected products" value={String(activeApps.length)} />
                        <MiniMetric label="Region" value={country} />
                        <MiniMetric label="Plan" value={account.profile.member ? "Member" : "Essential"} />
                    </div>
                </section>

                <section className="rounded-4xl border border-white/10 bg-[#24221e] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f887d]">Account posture</p>
                            <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-[#f4f0e8]">A few quick checks</h2>
                        </div>
                        <Sparkles className="size-5 text-[#e5ad5b]" aria-hidden="true" />
                    </div>
                    <div className="mt-4 divide-y divide-white/9">
                        <ActionItem icon={ShieldCheck} label="Privacy controls" value="Review" onClick={() => onSelectSection("privacy")} />
                        <ActionItem icon={KeyRound} label="Security & sign-in" value="Manage" onClick={() => onSelectSection("security")} />
                        <ActionItem icon={Code2} label="Developer access" value={developerEnabled ? "Enabled" : "Off"} onClick={() => onSelectSection("developer")} />
                    </div>
                </section>
            </div>

            
        </section>
    );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#797267]">{label}</p>
            <p className="mt-1.5 text-sm font-semibold text-[#f4f0e8]">{value}</p>
        </div>
    );
}

function ActionItem({ icon: Icon, label, onClick, value }: { icon: LucideIcon; label: string; onClick: () => void; value: string }) {
    return (
        <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-3 text-left">
            <Icon className="size-4 text-[#bdb5a8]" aria-hidden="true" />
            <span className="flex-1 text-sm font-medium text-[#d7d0c5]">{label}</span>
            <span className="text-xs font-semibold text-[#e5ad5b]">{value}</span>
            <ArrowUpRight className="size-3.5 text-[#716a60]" aria-hidden="true" />
        </button>
    );
}
