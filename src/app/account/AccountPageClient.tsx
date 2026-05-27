"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { AccountFrame } from "./_components/AccountFrame";
import { AccountHomePanel } from "./_components/AccountHomePanel";
import { AccountSettingsForm } from "./_components/AccountSettingsForm";
import { useAccountController } from "./_components/useAccountController";

export function AccountPageClient() {
    const account = useAccountController();

    if (account.isLoading) {
        return (
            <section className="flex min-h-dvh items-center justify-center bg-[#202124] px-5 text-white">
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#2b2c2f] px-5 py-4 text-sm font-semibold shadow-sm">
                    <Loader2 className="size-4 animate-spin text-emerald-300" aria-hidden="true" />
                    Loading your CheFu Account
                </div>
            </section>
        );
    }

    if (!account.account) {
        return (
            <section className="flex min-h-dvh items-center justify-center bg-[#202124] px-5 text-white">
                <div className="max-w-md rounded-lg border border-white/10 bg-[#2b2c2f] p-6 text-center shadow-sm">
                    <h1 className="text-2xl font-semibold">Account unavailable</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                        We could not load your CheFu Account session.
                    </p>
                    <Link
                        href="/login?returnTo=/account"
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                    >
                        Sign in
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <AccountFrame
            activeSection={account.activeSection}
            isSigningOut={account.isSigningOut}
            onSelectSection={account.goToSection}
            onSignOut={account.handleSignOut}
        >
            {account.activeSection === "home" ? (
                <AccountHomePanel
                    account={account.account}
                    accountSearch={account.accountSearch}
                    filteredSections={account.filteredSections}
                    initials={account.initials}
                    name={account.name}
                    onSearchChange={account.setAccountSearch}
                    onSelectSection={account.goToSection}
                />
            ) : (
                <AccountSettingsForm
                    account={account.account}
                    activeSection={account.activeSection}
                    aiTutorSuggestions={account.aiTutorSuggestions}
                    bio={account.bio}
                    connectedAppCount={account.connectedAppCount}
                    defaultCourseDifficulty={account.defaultCourseDifficulty}
                    emailPreferences={account.emailPreferences}
                    isSaving={account.isSaving}
                    isSendingReset={account.isSendingReset}
                    language={account.language}
                    learningGoal={account.learningGoal}
                    learningInterestsInput={account.learningInterestsInput}
                    lessonStyle={account.lessonStyle}
                    name={account.name}
                    onDefaultCourseDifficultyChange={account.setDefaultCourseDifficulty}
                    onEmailPreferencesChange={account.setEmailPreferences}
                    onLearningInterestsInputChange={account.setLearningInterestsInput}
                    onLessonStyleChange={account.setLessonStyle}
                    onPreferredContentFormatChange={account.setPreferredContentFormat}
                    onPrivacyChange={account.setPrivacy}
                    onSendResetEmail={account.sendResetEmail}
                    onSkillLevelChange={account.setSkillLevel}
                    onSubmit={account.saveProfile}
                    onToggleAiTutorSuggestions={() =>
                        account.setAiTutorSuggestions((enabled) => !enabled)
                    }
                    preferredContentFormat={account.preferredContentFormat}
                    privacy={account.privacy}
                    securityEmailsEnabled={account.securityEmailsEnabled}
                    setBio={account.setBio}
                    setLanguage={account.setLanguage}
                    setLearningGoal={account.setLearningGoal}
                    setName={account.setName}
                    setSecurityEmailsEnabled={account.setSecurityEmailsEnabled}
                    setWeeklyLearningGoal={account.setWeeklyLearningGoal}
                    skillLevel={account.skillLevel}
                    weeklyLearningGoal={account.weeklyLearningGoal}
                />
            )}
        </AccountFrame>
    );
}
