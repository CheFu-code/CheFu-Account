"use client";

import { sendPasswordResetEmail, signOut, updateProfile } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
    defaultEmailPreferences,
    defaultPrivacyPreferences,
    navItems,
} from "./account-data";
import type {
    AccountProfile,
    AccountResponse,
    EmailPreferences,
    PrivacyPreferences,
} from "./account-types";
import {
    apiUrl,
    clearChefuAccountSession,
    resolveChefuApp,
} from "../../../lib/chefu-account";
import { auth } from "../../../lib/firebase";

export function useAccountController() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const appId = resolveChefuApp(searchParams.get("app"));
    const sectionParam = searchParams.get("section");
    const [account, setAccount] = useState<AccountResponse | null>(null);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [language, setLanguage] = useState("en");
    const [learningGoal, setLearningGoal] = useState("");
    const [skillLevel, setSkillLevel] =
        useState<AccountProfile["skillLevel"]>("beginner");
    const [weeklyLearningGoal, setWeeklyLearningGoal] = useState("3");
    const [lessonStyle, setLessonStyle] =
        useState<AccountProfile["lessonStyle"]>("example-heavy");
    const [defaultCourseDifficulty, setDefaultCourseDifficulty] =
        useState<AccountProfile["defaultCourseDifficulty"]>("beginner");
    const [preferredContentFormat, setPreferredContentFormat] =
        useState<AccountProfile["preferredContentFormat"]>("examples");
    const [aiTutorSuggestions, setAiTutorSuggestions] = useState(true);
    const [privacy, setPrivacy] = useState<PrivacyPreferences>(
        defaultPrivacyPreferences,
    );
    const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>(
        defaultEmailPreferences,
    );
    const [learningInterestsInput, setLearningInterestsInput] = useState("");
    const [securityEmailsEnabled, setSecurityEmailsEnabled] = useState(true);
    const [accountSearch, setAccountSearch] = useState("");
    const [activeSection, setActiveSection] = useState(() =>
        resolveAccountSection(sectionParam),
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadAccount() {
            try {
                const response = await fetch(apiUrl("/auth/me"), {
                    credentials: "include",
                    headers: { "x-chefu-app": "academy" },
                });

                if (response.status === 401) {
                    router.replace(
                        `/login?returnTo=${encodeURIComponent(getCurrentAccountPath())}`,
                    );
                    return;
                }

                if (!response.ok) throw new Error("Could not load your account.");

                const data = (await response.json()) as AccountResponse;
                if (!cancelled) hydrateAccount(data);
            } catch (error) {
                if (cancelled) return;
                toast.error("Unable to load your account.", {
                    description:
                        error instanceof Error ? error.message : "Please refresh and try again.",
                });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        loadAccount();

        return () => {
            cancelled = true;
        };
    }, [router]);

    useEffect(() => {
        if (!sectionParam) return;
        setActiveSection(resolveAccountSection(sectionParam));
    }, [sectionParam]);

    const initials = useMemo(() => {
        const label = name || account?.user.email || "My Account";
        return label
            .split(/\s|@/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("");
    }, [account?.user.email, name]);

    const filteredSections = useMemo(() => {
        const query = accountSearch.trim().toLowerCase();
        if (!query) return [];

        return navItems.filter((item) =>
            `${item.label} ${item.description}`.toLowerCase().includes(query),
        );
    }, [accountSearch]);

    async function saveProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!account) return;

        const trimmedName = name.trim().replace(/\s+/g, " ");
        if (trimmedName.length < 2) {
            toast.error("Display name must be at least 2 characters.");
            return;
        }

        setIsSaving(true);

        try {
            const weeklyGoal = Number(weeklyLearningGoal);
            const nextEmailPreferences = {
                ...emailPreferences,
                security: securityEmailsEnabled,
            };
            const learningInterests = learningInterestsInput
                .split(",")
                .map((interest) => interest.trim())
                .filter(Boolean)
                .slice(0, 12);

            const response = await fetch(apiUrl("/auth/profile"), {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "x-chefu-app": "academy",
                },
                body: JSON.stringify({
                    name: trimmedName,
                    emailPreferences: { security: securityEmailsEnabled },
                    academyProfile: {
                        bio,
                        language,
                        learningGoal,
                        skillLevel,
                        learningInterests,
                        weeklyLearningGoal: Number.isFinite(weeklyGoal) ? weeklyGoal : 3,
                        lessonStyle,
                        defaultCourseDifficulty,
                        preferredContentFormat,
                        aiTutorSuggestions,
                        privacy,
                        emailPreferences: nextEmailPreferences,
                    },
                }),
            });

            const data = (await response.json().catch(() => null)) as
                | AccountResponse
                | { message?: string; error?: string }
                | null;

            if (!response.ok) {
                const message =
                    data && "message" in data
                        ? data.message
                        : "Your account could not be updated.";
                throw new Error(message || "Your account could not be updated.");
            }

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: trimmedName }).catch(
                    () => undefined,
                );
            }

            hydrateAccount(data as AccountResponse);
            toast.success("Account updated.");
        } catch (error) {
            toast.error("Unable to update your account.", {
                description:
                    error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSaving(false);
        }
    }

    async function sendResetEmail() {
        if (!account?.user.email) return;
        setIsSendingReset(true);

        try {
            await sendPasswordResetEmail(auth, account.user.email);
            toast.success("Password reset email sent.", {
                description: `Check ${account.user.email}.`,
            });
        } catch (error) {
            toast.error("Unable to send password reset email.", {
                description:
                    error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSendingReset(false);
        }
    }

    async function handleSignOut() {
        setIsSigningOut(true);

        try {
            await Promise.allSettled([clearChefuAccountSession(), signOut(auth)]);
            window.location.replace("/login?returnTo=/account");
        } catch (error) {
            toast.error("Unable to sign out.", {
                description:
                    error instanceof Error ? error.message : "Please try again.",
            });
            setIsSigningOut(false);
        }
    }

    function handleProfilePictureSuccess(imageUrl: string) {
        setAccount((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                user: {
                    ...prev.user,
                    photoURL: imageUrl,
                },
                profile: {
                    ...prev.profile,
                    profilePicture: imageUrl,
                },
            };
        });
        if (auth.currentUser) {
            updateProfile(auth.currentUser, { photoURL: imageUrl }).catch(
                () => undefined,
            );
        }
    }

    function hydrateAccount(data: AccountResponse) {
        setAccount(data);
        setName(data.profile.name || data.user.displayName || "");
        setBio(data.profile.bio || "");
        setLanguage(data.profile.language || "en");
        setLearningGoal(data.profile.learningGoal || "");
        setSkillLevel(data.profile.skillLevel || "beginner");
        setWeeklyLearningGoal(String(data.profile.weeklyLearningGoal || 3));
        setLessonStyle(data.profile.lessonStyle || "example-heavy");
        setDefaultCourseDifficulty(data.profile.defaultCourseDifficulty || "beginner");
        setPreferredContentFormat(data.profile.preferredContentFormat || "examples");
        setAiTutorSuggestions(data.profile.aiTutorSuggestions !== false);
        setPrivacy({ ...defaultPrivacyPreferences, ...(data.profile.privacy || {}) });
        setEmailPreferences({
            ...defaultEmailPreferences,
            ...(data.profile.emailPreferences || {}),
        });
        setLearningInterestsInput((data.profile.learningInterests || []).join(", "));
        setSecurityEmailsEnabled(data.profile.securityEmailsEnabled);
    }

    function goToSection(id: string) {
        setActiveSection(id);
        setAccountSearch("");
    }

    return {
        account,
        accountSearch,
        activeSection,
        appId,
        aiTutorSuggestions,
        bio,
        defaultCourseDifficulty,
        emailPreferences,
        filteredSections,
        goToSection,
        handleProfilePictureSuccess,
        handleSignOut,
        initials,
        isLoading,
        isSaving,
        isSendingReset,
        isSigningOut,
        language,
        learningGoal,
        learningInterestsInput,
        lessonStyle,
        name,
        preferredContentFormat,
        privacy,
        saveProfile,
        securityEmailsEnabled,
        sendResetEmail,
        setAccountSearch,
        setAiTutorSuggestions,
        setBio,
        setDefaultCourseDifficulty,
        setEmailPreferences,
        setLanguage,
        setLearningGoal,
        setLearningInterestsInput,
        setLessonStyle,
        setName,
        setPreferredContentFormat,
        setPrivacy,
        setSecurityEmailsEnabled,
        setSkillLevel,
        setWeeklyLearningGoal,
        skillLevel,
        weeklyLearningGoal,
    };
}

function resolveAccountSection(value: string | null) {
    if (value === "profile") return "personal-info";
    return value && navItems.some((item) => item.id === value) ? value : "home";
}

function getCurrentAccountPath() {
    if (typeof window === "undefined") return "/account";
    return `${window.location.pathname}${window.location.search}`;
}
