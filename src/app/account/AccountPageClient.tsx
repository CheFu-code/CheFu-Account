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
            <section className="flex min-h-dvh items-center justify-center bg-[#11110f] px-5 text-[#f4f0e8]">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1916] px-5 py-4 text-sm font-semibold shadow-2xl shadow-black/30">
                    <Loader2 className="size-4 animate-spin text-[#e5ad5b]" aria-hidden="true" />
                    Opening your account
                </div>
            </section>
        );
    }

    if (!account.account) {
        return (
            <section className="flex min-h-dvh items-center justify-center bg-[#11110f] px-5 text-[#f4f0e8]">
                <div className="max-w-md rounded-[2rem] border border-white/10 bg-[#1a1916] p-7 text-center shadow-2xl shadow-black/30">
                    <h1 className="text-2xl font-semibold tracking-[-0.03em]">Account unavailable</h1>
                    <p className="mt-2 text-sm leading-6 text-[#9e968a]">
                        We could not load your account session.
                    </p>
                    <Link
                        href="/login?returnTo=/account"
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#e5ad5b] px-4 py-2.5 text-sm font-bold text-[#26190a] transition hover:bg-[#ffd18a]"
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
            user={{
                displayName: account.name,
                email: account.account.user.email,
                photoURL: account.account.profile.profilePicture,
            }}
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
                    appId={account.appId}
                    aiTutorSuggestions={account.aiTutorSuggestions}
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
