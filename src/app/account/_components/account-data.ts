import {
    BellRing,
    BookOpenCheck,
    Code2,
    Home,
    IdCard,
    LockKeyhole,
    MonitorSmartphone,
    ShieldCheck,
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
        name: "CheFu Academy",
        description: "Courses, videos, SDK keys, and guided learning.",
        href: "https://academy.chefuinc.com",
    },
    {
        id: "flow",
        name: "Flow",
        description: "Private email and campaign workspace.",
        href: "https://flow.chefuinc.com",
    },
    {
        id: "muzalo",
        name: "Muzalo",
        description: "Music discovery and listening experience.",
        href: "https://muzalo.chefuinc.com",
    },
    {
        id: "quantum",
        name: "Quantum",
        description: "AI assistant with saved conversations.",
        href: "https://quantum.chefuinc.com",
    },
];

export const navItems: AccountNavItem[] = [
    {
        id: "home",
        label: "Home",
        description: "Overview and quick actions",
        icon: Home,
        color: "bg-sky-300 text-sky-950",
    },
    {
        id: "personal-info",
        label: "Personal info",
        description: "Name, bio, verified country, and language",
        icon: IdCard,
        color: "bg-emerald-300 text-emerald-950",
    },
    {
        id: "security",
        label: "Security & sign-in",
        description: "Password reset and security alerts",
        icon: LockKeyhole,
        color: "bg-cyan-300 text-cyan-950",
    },
    {
        id: "linked-apps",
        label: "Linked apps",
        description: "CheFu products connected to this account",
        icon: MonitorSmartphone,
        color: "bg-blue-300 text-blue-950",
    },
    {
        id: "privacy",
        label: "Data & privacy",
        description: "Public profile and personalization controls",
        icon: ShieldCheck,
        color: "bg-violet-300 text-violet-950",
    },
    {
        id: "academy",
        label: "Academy learning",
        description: "Learning goals and recommendation settings",
        icon: BookOpenCheck,
        color: "bg-amber-300 text-amber-950",
    },
    {
        id: "notifications",
        label: "Notifications",
        description: "Course and product email settings",
        icon: BellRing,
        color: "bg-pink-300 text-pink-950",
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
