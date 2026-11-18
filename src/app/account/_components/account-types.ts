import type { LucideIcon } from "lucide-react";

export type AppId = "quantum";

export type AccountUser = {
    uid: string;
    email: string;
    roles?: string[];
    displayName?: string | null;
    lastLoginAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};

export type EmailPreferences = {
    activity: boolean;
    general: boolean;
    marketing: boolean;
    security: boolean;
};

export type PrivacyPreferences = {
    publicProfile: boolean;
    showCountry: boolean;
};

export type AccountProfile = {
    fullname: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    whatsappAvailable?: boolean;
    profilePicture?: string;
    bio: string;
    website?: string;
    location?: string;
    country: string;
    countryCode: string;
    detectedCountryCode?: string;
    detectedCountrySource?: string;
    detectedCountryUpdatedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    language: string;
    privacy: PrivacyPreferences;
    onboardingComplete: boolean;
    appGuideComplete: boolean;
    subscriptionStatus: string;
    member: boolean;
    emailPreferences: EmailPreferences;
    roles: string[];
    securityEmailsEnabled: boolean;
    apps: Partial<
        Record<
            AppId,
            {
                enabled: boolean;
                firstSeenAt?: string | null;
                lastSeenAt?: string | null;
            }
        >
    >;
};

export type AccountResponse = {
    user: AccountUser;
    profile: AccountProfile;
};

export type AccountNavItem = {
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
    color: string;
};
