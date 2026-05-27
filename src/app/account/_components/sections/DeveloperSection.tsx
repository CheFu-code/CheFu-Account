"use client";

import { Code2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { SectionCard } from "../AccountControls";
import type { AccountSettingsFormProps } from "../account-form-types";

export function DeveloperSection({ account }: AccountSettingsFormProps) {
    const developerEnabled = account.profile.roles.includes("developer");

    return (
        <SectionCard
            icon={Code2}
            title="Developer access"
            description="SDK and API key access for CheFu integrations."
            aside={developerEnabled ? "Enabled" : "Not enabled"}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-base font-semibold text-white">
                        {developerEnabled
                            ? "API keys and SDK tools are enabled."
                            : "Create an SDK account to unlock API keys."}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                        Developer keys are managed from the Academy SDK and CheFu Inc API.
                    </p>
                </div>
                <Link
                    href="https://academy.chefuinc.com/docs"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                    View SDK docs
                    <ExternalLink className="size-4" />
                </Link>
            </div>
        </SectionCard>
    );
}
