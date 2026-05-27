"use client";

import { BellRing } from "lucide-react";
import { SaveButton, SectionCard, ToggleRow } from "../AccountControls";
import type { AccountSettingsFormProps } from "../account-form-types";

export function NotificationsSection({
    emailPreferences,
    isSaving,
    onEmailPreferencesChange,
}: AccountSettingsFormProps) {
    return (
        <SectionCard
            icon={BellRing}
            title="Notifications"
            description="Choose which Academy and product emails you receive."
            action={<SaveButton isSaving={isSaving} label="Save notifications" />}
        >
            <div className="divide-y divide-white/10">
                <ToggleRow
                    checked={emailPreferences.courseReminders}
                    title="Course reminders"
                    description="Receive nudges for active lessons and study goals."
                    onToggle={() =>
                        onEmailPreferencesChange((current) => ({
                            ...current,
                            courseReminders: !current.courseReminders,
                        }))
                    }
                />
                <ToggleRow
                    checked={emailPreferences.aiCourseCompletion}
                    title="AI course completion"
                    description="Receive updates when AI-generated course work finishes."
                    onToggle={() =>
                        onEmailPreferencesChange((current) => ({
                            ...current,
                            aiCourseCompletion: !current.aiCourseCompletion,
                        }))
                    }
                />
                <ToggleRow
                    checked={emailPreferences.weeklyProgressSummary}
                    title="Weekly progress summary"
                    description="Get a weekly digest of learning progress and suggested next steps."
                    onToggle={() =>
                        onEmailPreferencesChange((current) => ({
                            ...current,
                            weeklyProgressSummary: !current.weeklyProgressSummary,
                        }))
                    }
                />
                <ToggleRow
                    checked={emailPreferences.marketing}
                    title="Product updates"
                    description="Receive occasional announcements about new CheFu products and releases."
                    onToggle={() =>
                        onEmailPreferencesChange((current) => ({
                            ...current,
                            marketing: !current.marketing,
                        }))
                    }
                />
            </div>
        </SectionCard>
    );
}
