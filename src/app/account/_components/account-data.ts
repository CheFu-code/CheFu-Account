import {
    Activity,
    Bell,
    Code2,
    Contact,
    Home,
    IdCard,
    LockKeyhole,
    ShieldCheck
} from "lucide-react";
import type {
    AccountNavItem,
    AppId,
    EmailPreferences,
    PrivacyPreferences,
} from "./account-types";

export const defaultEmailPreferences: EmailPreferences = {
    activity: false,
    general: false,
    marketing: false,
    security: true,
    courseReminders: true,
    aiCourseCompletion: true,
    weeklyProgressSummary: false,
};

export const defaultPrivacyPreferences: PrivacyPreferences = {
    publicProfile: false,
    showCompletedCourses: false,
    showCountry: true,
    personalizedAiRecommendations: true,
};

export const skillLevels = ["beginner", "intermediate", "advanced"] as const;
export const lessonStyles = ["short", "detailed", "example-heavy"] as const;
export const contentFormats = ["text", "examples", "quizzes"] as const;

export const connectedApps: Array<{
    id: AppId;
    name: string;
    description: string;
    href: string;
}> = [
        {
            id: "academy",
            name: "Chefu Academy",
            description: "Courses, videos, SDK keys, and guided learning.",
            href: "https://academy.chefu.co.za",
        },
        {
            id: "flow",
            name: "Flow",
            description: "Private email and campaign workspace.",
            href: "https://flow.chefu.co.za",
        },

        {
            id: "quantum",
            name: "Quantum",
            description: "AI assistant with saved conversations.",
            href: "https://quantum.chefu.co.za",
        },
    ];

export const navItems: AccountNavItem[] = [
    {
        id: "home",
        label: "Profile overview",
        description: "Overview and quick actions",
        icon: Home,
        color: "bg-sky-300 text-sky-950",
    },
    {
        id: "personal-info",
        label: "Personal information",
        description: "Profile photo, name, and verified country",
        icon: IdCard,
        color: "bg-emerald-300 text-emerald-950",
    },
    {
        id: "contact",
        label: "Contact and address",
        description: "Contact details and emergency information",
        icon: Contact,
        color: "bg-blue-300 text-blue-950",
    },
    {
        id: "security",
        label: "Security & sign-in",
        description: "Password reset, passkeys, and two-factor auth",
        icon: LockKeyhole,
        color: "bg-cyan-300 text-cyan-950",
    },
    {
        id: "notifications",
        label: "Notifications",
        description: "Choose which account emails you receive",
        icon: Bell,
        color: "bg-yellow-300 text-yellow-950",
    },
    {
        id: "privacy",
        label: "Data & privacy",
        description: "Public profile and personalization controls",
        icon: ShieldCheck,
        color: "bg-violet-300 text-violet-950",
    },
    {
        id: "activity",
        label: "Activity log",
        description: "Recent account and sign-in activity",
        icon: Activity,
        color: "bg-slate-300 text-slate-950",
    },
    {
        id: "developer",
        label: "Developer access",
        description: "SDK and API key access",
        icon: Code2,
        color: "bg-orange-300 text-orange-950",
    },
];

export function toTitle(value: string) {
    return value
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
