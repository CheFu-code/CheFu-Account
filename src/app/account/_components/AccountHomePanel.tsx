"use client";

import {
    BellRing,
    BookOpenCheck,
    Camera,
    Code2,
    KeyRound,
    Search,
    ShieldCheck,
    type LucideIcon,
} from "lucide-react";
import { QuickLink } from "./AccountControls";
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
    const country = account.profile.detectedCountryCode?.toUpperCase() || "Pending";
    const developerEnabled = account.profile.roles.includes("developer");

    return (
        <section className="space-y-5">
            <div className="overflow-hidden rounded-4xl border border-white/10 bg-[#14151b]/95 shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
                <div className="grid gap-6 p-6 lg:grid-cols-[0.95fr_1.05fr] lg:p-7">
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-4xl border border-white/10 bg-[#0f1116] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                            <div
                                className="flex h-24 w-24 items-center justify-center rounded-3xl bg-cover bg-center text-3xl font-semibold text-white"
                                style={
                                    account.profile.profilePicture
                                        ? {
                                              backgroundImage: `url(${account.profile.profilePicture})`,
                                          }
                                        : undefined
                                }
                            >
                                {!account.profile.profilePicture ? initials || "C" : null}
                            </div>
                            <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-[#14151b] bg-emerald-300 text-emerald-950 shadow-lg">
                                <Camera className="size-4" aria-hidden="true" />
                            </span>
                        </div>

                        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200">
                            CHEFU Account
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                            {name || "Your profile"}
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">{account.user.email}</p>
                    </div>

                    <div className="flex flex-col justify-center gap-4">
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                value={accountSearch}
                                onChange={(event) => onSearchChange(event.target.value)}
                                placeholder="Search settings, apps, privacy, security"
                                className="h-14 w-full rounded-2xl border border-white/10 bg-[#111318] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                                aria-label="Search CHEFU Account sections"
                            />
                            {filteredSections.length > 0 ? (
                                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#111318] text-left shadow-2xl shadow-black/20">
                                    {filteredSections.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => onSelectSection(item.id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/10"
                                        >
                                            <span
                                                className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${item.color}`}
                                            >
                                                <item.icon className="size-5" aria-hidden="true" />
                                            </span>
                                            <span>
                                                <span className="block text-sm font-semibold text-white">
                                                    {item.label}
                                                </span>
                                                <span className="block text-xs text-slate-400">
                                                    {item.description}
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <QuickLink icon={KeyRound} label="Security" onClick={() => onSelectSection("security")} />
                            <QuickLink icon={ShieldCheck} label="Privacy" onClick={() => onSelectSection("privacy")} />
                            <QuickLink icon={BookOpenCheck} label="Academy" onClick={() => onSelectSection("academy")} />
                            <QuickLink icon={BellRing} label="Email" onClick={() => onSelectSection("notifications")} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatusCard
                    icon={ShieldCheck}
                    label="Verified country"
                    value={country}
                    description="Detected by the server"
                />
                <StatusCard
                    icon={BookOpenCheck}
                    label="Academy status"
                    value={account.profile.member ? "Member" : "Free"}
                    description={account.profile.subscriptionStatus || "Standard access"}
                />
                <StatusCard
                    icon={Code2}
                    label="Developer access"
                    value={developerEnabled ? "Enabled" : "Off"}
                    description="SDK and API key access"
                />
            </div>

            <div className="rounded-4xl border border-white/10 bg-[#14151b]/90 p-5 shadow-xl shadow-black/20">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Account privacy is managed here</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Update profile data, manage notifications, and prepare recovery options from one place.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onSelectSection("privacy")}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200"
                    >
                        Review privacy
                        <ShieldCheck className="size-4" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </section>
    );
}

function StatusCard({
    description,
    icon: Icon,
    label,
    value,
}: {
    description: string;
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-4xl border border-white/10 bg-[#191b20]/80 p-5 shadow-xl shadow-black/15">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/4 text-emerald-200">
                    <Icon className="size-5" aria-hidden="true" />
                </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p>
        </div>
    );
}
