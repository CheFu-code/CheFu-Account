import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
    AccountProfile,
    AccountResponse,
    EmailPreferences,
    PrivacyPreferences,
} from "./account-types";

export type AccountSettingsFormProps = {
    account: AccountResponse;
    activeSection: string;
    aiTutorSuggestions: boolean;
    bio: string;
    connectedAppCount: number;
    defaultCourseDifficulty: AccountProfile["defaultCourseDifficulty"];
    emailPreferences: EmailPreferences;
    isSaving: boolean;
    isSendingReset: boolean;
    language: string;
    learningGoal: string;
    learningInterestsInput: string;
    lessonStyle: AccountProfile["lessonStyle"];
    name: string;
    onDefaultCourseDifficultyChange: (
        value: AccountProfile["defaultCourseDifficulty"],
    ) => void;
    onEmailPreferencesChange: Dispatch<SetStateAction<EmailPreferences>>;
    onLearningInterestsInputChange: (value: string) => void;
    onLessonStyleChange: (value: AccountProfile["lessonStyle"]) => void;
    onPreferredContentFormatChange: (
        value: AccountProfile["preferredContentFormat"],
    ) => void;
    onPrivacyChange: Dispatch<SetStateAction<PrivacyPreferences>>;
    onSendResetEmail: () => void;
    onSkillLevelChange: (value: AccountProfile["skillLevel"]) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onToggleAiTutorSuggestions: () => void;
    preferredContentFormat: AccountProfile["preferredContentFormat"];
    privacy: PrivacyPreferences;
    securityEmailsEnabled: boolean;
    setBio: (value: string) => void;
    setLanguage: (value: string) => void;
    setLearningGoal: (value: string) => void;
    setName: (value: string) => void;
    setSecurityEmailsEnabled: Dispatch<SetStateAction<boolean>>;
    setWeeklyLearningGoal: (value: string) => void;
    skillLevel: AccountProfile["skillLevel"];
    weeklyLearningGoal: string;
};
