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
                    <p className="text-base font-semibold text-[#f4f0e8]">
                        {developerEnabled
                            ? "API keys and SDK tools are enabled."
                            : "Create an SDK account to unlock API keys."}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#8f887d]">
                        Developer keys are managed from the Academy SDK and CheFu Inc API.
                    </p>
                </div>
                <Link
                    href="https://academy.chefuinc.com/docs"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/4 px-4 py-2.5 text-sm font-bold text-[#d7d0c5] transition hover:border-[#e5ad5b]/35 hover:bg-white/8 hover:text-[#f4f0e8]"
                >
                    View SDK docs
                    <ExternalLink className="size-4" />
                </Link>
            </div>
        </SectionCard>
    );
}
