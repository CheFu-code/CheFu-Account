"use client";

import { ShieldCheck } from "lucide-react";
import { SaveButton, SectionCard, ToggleRow } from "../AccountControls";
import type { AccountSettingsFormProps } from "../account-form-types";

export function PrivacySection({ isSaving, onPrivacyChange, privacy }: AccountSettingsFormProps) {
    return (
        <SectionCard
            icon={ShieldCheck}
            title="Data & privacy"
            description="Choose what appears publicly and how personalization works."
            action={<SaveButton isSaving={isSaving} label="Save privacy" />}
        >
            <div className="divide-y divide-white/10">
                <ToggleRow
                    checked={privacy.publicProfile}
                    title="Public profile"
                    description="Allow your basic profile to be shown publicly."
                    onToggle={() =>
                        onPrivacyChange((current) => ({
                            ...current,
                            publicProfile: !current.publicProfile,
                        }))
                    }
                />
                <ToggleRow
                    checked={privacy.showCountry}
                    title="Show country"
                    description="Allow your verified country to appear where profiles are shown."
                    onToggle={() =>
                        onPrivacyChange((current) => ({
                            ...current,
                            showCountry: !current.showCountry,
                        }))
                    }
                />
               
            </div>
        </SectionCard>
    );
}
