import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
    AccountResponse,
    EmailPreferences,
    PrivacyPreferences,
} from "./account-types";
import type { ChefuAppId } from "../../../lib/chefu-account";
import type { PersonalInfoUpdate } from "../../../lib/account-profile";

export type AccountSettingsFormProps = {
    account: AccountResponse;
    activeSection: string;
    appId: ChefuAppId;
    bio: string;
    emailPreferences: EmailPreferences;
    firstName: string;
    isSaving: boolean;
    isSendingReset: boolean;
    language?: string;
    lastName: string;
    name: string;
    onEmailPreferencesChange: Dispatch<SetStateAction<EmailPreferences>>;
    onPrivacyChange: Dispatch<SetStateAction<PrivacyPreferences>>;
    onProfilePictureSuccess?: (imageUrl: string) => void;
    onSavePersonalInfo: (updates: PersonalInfoUpdate) => Promise<void>;
    onSendResetEmail: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    phone: string;
    privacy: PrivacyPreferences;
    securityEmailsEnabled: boolean;
    setLanguage?: (value: string) => void;
    setFirstName: (value: string) => void;
    setLastName: (value: string) => void;
    setName: (value: string) => void;
    setPhone: (value: string) => void;
    setBio: (value: string) => void;
    setWebsite: (value: string) => void;
    setLocation: (value: string) => void;
    setSecurityEmailsEnabled: Dispatch<SetStateAction<boolean>>;
    website: string;
    location: string;
};
