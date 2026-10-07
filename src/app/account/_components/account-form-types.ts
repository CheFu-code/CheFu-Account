import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
    AccountProfile,
    AccountResponse,
    EmailPreferences,
    PrivacyPreferences,
} from "./account-types";
import type { ChefuAppId } from "../../../lib/chefu-account";

export type AccountSettingsFormProps = {
    account: AccountResponse;
    activeSection: string;
    appId: ChefuAppId;
    bio: string;
    aiTutorSuggestions: boolean;
    defaultCourseDifficulty: AccountProfile["defaultCourseDifficulty"];
    emailPreferences: EmailPreferences;
    firstName: string;
    isSaving: boolean;
    isSendingReset: boolean;
    language?: string;
    learningGoal: string;
    learningInterestsInput: string;
    lessonStyle: AccountProfile["lessonStyle"];
    lastName: string;
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
    onProfilePictureSuccess?: (imageUrl: string) => void;
    onSendResetEmail: () => void;
    onSkillLevelChange: (value: AccountProfile["skillLevel"]) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onToggleAiTutorSuggestions: () => void;
    preferredContentFormat: AccountProfile["preferredContentFormat"];
    phone: string;
    privacy: PrivacyPreferences;
    securityEmailsEnabled: boolean;
    setLanguage?: (value: string) => void;
    setFirstName: (value: string) => void;
    setLastName: (value: string) => void;
    setLearningGoal: (value: string) => void;
    setName: (value: string) => void;
    setPhone: (value: string) => void;
    setBio: (value: string) => void;
    setWebsite: (value: string) => void;
    setLocation: (value: string) => void;
    setSecurityEmailsEnabled: Dispatch<SetStateAction<boolean>>;
    setWeeklyLearningGoal: (value: string) => void;
    skillLevel: AccountProfile["skillLevel"];
    weeklyLearningGoal: string;
    website: string;
    location: string;
};
