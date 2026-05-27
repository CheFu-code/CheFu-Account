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
                    description="Allow your basic Academy profile to be shown publicly."
                    onToggle={() =>
                        onPrivacyChange((current) => ({
                            ...current,
                            publicProfile: !current.publicProfile,
                        }))
                    }
                />
                <ToggleRow
                    checked={privacy.showCompletedCourses}
                    title="Show completed courses"
                    description="Allow completed-course activity on your profile."
                    onToggle={() =>
                        onPrivacyChange((current) => ({
                            ...current,
                            showCompletedCourses: !current.showCompletedCourses,
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
                <ToggleRow
                    checked={privacy.personalizedAiRecommendations}
                    title="Personalized AI recommendations"
                    description="Use your Academy activity to improve recommendations."
                    onToggle={() =>
                        onPrivacyChange((current) => ({
                            ...current,
                            personalizedAiRecommendations:
                                !current.personalizedAiRecommendations,
                        }))
                    }
                />
            </div>
        </SectionCard>
    );
}
