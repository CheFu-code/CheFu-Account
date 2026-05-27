"use client";

import { CheckCircle2, ExternalLink, MonitorSmartphone, Sparkles } from "lucide-react";
import Link from "next/link";
import { SectionCard } from "../AccountControls";
import type { AccountSettingsFormProps } from "../account-form-types";
import { connectedApps } from "../account-data";

export function LinkedAppsSection({ account, connectedAppCount }: AccountSettingsFormProps) {
    return (
        <SectionCard
            icon={MonitorSmartphone}
            title="Linked apps"
            description="CheFu products that can use your account session."
            aside={`${connectedAppCount} connected`}
        >
            <div className="divide-y divide-white/10">
                {connectedApps.map((app) => {
                    const appProfile = account.profile.apps?.[app.id];
                    const isConnected = appProfile?.enabled;

                    return (
                        <Link
                            key={app.id}
                            href={app.href}
                            className="group flex flex-col gap-3 py-4 transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-white">{app.name}</h3>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-1 text-xs font-semibold text-slate-300">
                                        {isConnected ? (
                                            <CheckCircle2 className="size-3.5 text-emerald-300" />
                                        ) : (
                                            <Sparkles className="size-3.5 text-slate-400" />
                                        )}
                                        {isConnected ? "Connected" : "Ready"}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm leading-6 text-slate-400">
                                    {app.description}
                                </p>
                            </div>
                            <ExternalLink className="size-4 shrink-0 text-slate-500 transition group-hover:text-white" />
                        </Link>
                    );
                })}
            </div>
        </SectionCard>
    );
}
