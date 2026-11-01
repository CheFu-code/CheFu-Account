"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AccountFrame } from "./_components/AccountFrame";
import { AccountHomePanel } from "./_components/AccountHomePanel";
import { AccountSettingsForm } from "./_components/AccountSettingsForm";
import { AccountHomeSkeleton } from "./_components/AccountHomeSkeleton";
import { useAccountController } from "./_components/useAccountController";

export function AccountPageClient() {
    const account = useAccountController();

    if (account.isLoading) {
        return <AccountHomeSkeleton />;
    }

    if (!account.account) {
        return (
            <section className="account-public-state flex min-h-dvh items-center justify-center px-5">
                <div className="max-w-md rounded border border-[var(--border)] bg-[var(--surface)] p-7 text-center text-[var(--fg)] shadow-sm">
                    <h1 className="text-2xl font-semibold tracking-[-0.03em]">Account unavailable</h1>
                    <p className="mt-2 text-sm leading-6 text-[var(--fg-muted)]">
                        We could not load your account session.
                    </p>
                    <Link
                        href="/login?returnTo=/account"
                        className="mt-5 inline-flex items-center gap-2 rounded border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)]"
                    >
                        Sign in
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <>
            <AccountFrame
            activeSection={account.activeSection}
            isSigningOut={account.isSigningOut}
            onSelectSection={account.goToSection}
            onSignOut={account.handleSignOut}
            accounts={account.accounts}
            onSwitchAccount={account.switchAccount}
            isSwitchingAccount={account.isSwitchingAccount}
        >
            {account.activeSection === "home" ? (
                <AccountHomePanel
                    account={account.account}
                    initials={account.initials}
                    name={account.name}
                    onSelectSection={account.goToSection}
                />
            ) : (
                <AccountSettingsForm
                    account={account.account}
                    activeSection={account.activeSection}
                    appId={account.appId}
                    bio={account.bio}
                    aiTutorSuggestions={account.aiTutorSuggestions}
                    defaultCourseDifficulty={account.defaultCourseDifficulty}
                    emailPreferences={account.emailPreferences}
                    firstName={account.firstName}
                    isSaving={account.isSaving}
                    isSendingReset={account.isSendingReset}
                    language={account.language}
                    learningGoal={account.learningGoal}
                    learningInterestsInput={account.learningInterestsInput}
                    lessonStyle={account.lessonStyle}
                    lastName={account.lastName}
                    name={account.name}
                    onDefaultCourseDifficultyChange={account.setDefaultCourseDifficulty}
                    onEmailPreferencesChange={account.setEmailPreferences}
                    onLearningInterestsInputChange={account.setLearningInterestsInput}
                    onLessonStyleChange={account.setLessonStyle}
                    onPreferredContentFormatChange={account.setPreferredContentFormat}
                    onPrivacyChange={account.setPrivacy}
                    onProfilePictureSuccess={account.handleProfilePictureSuccess}
                    phone={account.phone}
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
                    setFirstName={account.setFirstName}
                    setLastName={account.setLastName}
                    setLearningGoal={account.setLearningGoal}
                    setName={account.setName}
                    setPhone={account.setPhone}
                    setBio={account.setBio}
                    setSecurityEmailsEnabled={account.setSecurityEmailsEnabled}
                    setWeeklyLearningGoal={account.setWeeklyLearningGoal}
                    skillLevel={account.skillLevel}
                    weeklyLearningGoal={account.weeklyLearningGoal}
                    website={account.website}
                    location={account.location}
                    setWebsite={account.setWebsite}
                    setLocation={account.setLocation}
                />
            )}
            </AccountFrame>
        </>
    );
}
