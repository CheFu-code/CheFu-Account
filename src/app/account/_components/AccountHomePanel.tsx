"use client";

import {
    BellRing,
    BookOpenCheck,
    Camera,
    KeyRound,
    MonitorSmartphone,
    Search,
    ShieldCheck,
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
    return (
        <section className="mx-auto max-w-5xl text-center">
            <div className="mx-auto flex size-28 items-center justify-center rounded-full bg-[#111213] shadow-[0_18px_64px_rgba(0,0,0,0.45)]">
                <div
                    className="relative flex size-28 items-center justify-center rounded-full bg-cover bg-center text-3xl font-semibold text-white"
                    style={
                        account.profile.profilePicture
                            ? {
                                  backgroundImage: `url(${account.profile.profilePicture})`,
                              }
                            : undefined
                    }
                >
                    {!account.profile.profilePicture ? initials || "C" : null}
                    <span className="absolute bottom-0 right-1 flex size-8 items-center justify-center rounded-full border border-[#202124] bg-[#3c4043] text-white">
                        <Camera className="size-4" aria-hidden="true" />
                    </span>
                </div>
            </div>

            <h1 className="mt-6 text-3xl font-normal leading-tight tracking-normal text-white sm:text-5xl">
                {name || "CheFu Account"}
            </h1>
            <p className="mt-3 text-base text-slate-300">{account.user.email}</p>

            <div className="relative mx-auto mt-9 max-w-3xl">
                <Search
                    className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-300"
                    aria-hidden="true"
                />
                <input
                    type="search"
                    value={accountSearch}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search CheFu Account"
                    className="h-14 w-full rounded-full border border-white/10 bg-[#3c4043] pl-14 pr-5 text-base text-white outline-none transition placeholder:text-slate-300 focus:border-sky-300"
                    aria-label="Search CheFu Account sections"
                />
                {filteredSections.length > 0 ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-lg border border-white/10 bg-[#2b2c2f] text-left shadow-2xl">
                        {filteredSections.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelectSection(item.id)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/10"
                            >
                                <span
                                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${item.color}`}
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

            <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-3">
                <QuickLink icon={KeyRound} label="Password" onClick={() => onSelectSection("security")} />
                <QuickLink icon={MonitorSmartphone} label="Apps" onClick={() => onSelectSection("linked-apps")} />
                <QuickLink icon={ShieldCheck} label="Privacy" onClick={() => onSelectSection("privacy")} />
                <QuickLink icon={BookOpenCheck} label="Academy" onClick={() => onSelectSection("academy")} />
                <QuickLink icon={BellRing} label="Email" onClick={() => onSelectSection("notifications")} />
            </div>

            <div className="mx-auto mt-14 flex max-w-4xl items-center justify-between gap-6 text-left">
                <p className="max-w-3xl text-base leading-7 text-slate-200">
                    Only you can see your settings. Review personal info, security,
                    privacy, connected apps, and Academy preferences from one CheFu Account.
                </p>
                <ShieldCheck className="hidden size-9 shrink-0 text-sky-300 sm:block" aria-hidden="true" />
            </div>
        </section>
    );
}
