"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
    defaultEmailPreferences,
    defaultPrivacyPreferences,
    navItems,
} from "./account-data";
import { mockAccount } from "./preview-account";
import { useAccountLoad } from "./useAccountLoad";
import { authMutationFetch } from "../../../lib/auth-reads";
import type {
    AccountProfile,
    AccountResponse,
    EmailPreferences,
    PrivacyPreferences,
} from "./account-types";
import {
    apiUrl,
    clearChefuAccountSession,
    requestPasswordResetEmail,
    resolveChefuApp,
} from "../../../lib/chefu-account";

const isDevPreview =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_PREVIEW === "true";

export function useAccountController() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const appId = resolveChefuApp(searchParams.get("app"));
    const sectionParam = searchParams.get("section");
    const [account, setAccount] = useState<AccountResponse | null>(null);
    const [name, setName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [website, setWebsite] = useState("");
    const [location, setLocation] = useState("");
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
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const isLoading = useAccountLoad(appId, hydrateAccount, getCurrentAccountPath, isDevPreview ? mockAccount : undefined);

    useEffect(() => {
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

        const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");
        const trimmedFirstName = normalizeName(firstName);
        const trimmedLastName = normalizeName(lastName);
        const trimmedDisplayName = normalizeName(name);
        const originalFirstName = normalizeName(readText(account.profile.firstName));
        const originalLastName = normalizeName(readText(account.profile.lastName));
        const originalDisplayName = normalizeName(
            readText(account.profile.fullname) || readText(account.user.displayName),
        );
        const firstNameChanged = trimmedFirstName !== originalFirstName;
        const lastNameChanged = trimmedLastName !== originalLastName;
        const displayNameChanged = trimmedDisplayName !== originalDisplayName;
        const phoneChanged = phone.trim() !== readText(account.profile.phone).trim();
        const bioChanged = bio.trim() !== readText(account.profile.bio).trim();
        const websiteChanged = website.trim() !== readText(account.profile.website).trim();
        const locationChanged = location.trim() !== readText(account.profile.location).trim();
        const privacyChanges = Object.fromEntries(
            (Object.keys(privacy) as Array<keyof PrivacyPreferences>)
                .filter((key) => privacy[key] !== account.profile.privacy[key])
                .map((key) => [key, privacy[key]]),
        ) as Partial<PrivacyPreferences>;
        const hasPrivacyChanges = Object.keys(privacyChanges).length > 0;

        if (
            activeSection === "personal-info" &&
            displayNameChanged &&
            trimmedDisplayName.length < 2
        ) {
            toast.error("Display name must contain at least 2 characters.");
            return;
        }

        if (
            activeSection === "personal-info" &&
            !displayNameChanged &&
            (firstNameChanged || lastNameChanged) &&
            (!trimmedFirstName || !trimmedLastName)
        ) {
            toast.error("First name and last name are both required.");
            return;
        }

        const hasPersonalInfoChanges =
            displayNameChanged || firstNameChanged || lastNameChanged || phoneChanged ||
            bioChanged || websiteChanged || locationChanged;
        if (
            (activeSection === "personal-info" && !hasPersonalInfoChanges) ||
            (activeSection === "privacy" && !hasPrivacyChanges)
        ) {
            toast.info("There are no profile changes to save.");
            return;
        }

        const profileUpdates: {
            fullname?: string;
            firstName?: string;
            lastName?: string;
            phone?: string;
            bio?: string;
            website?: string;
            location?: string;
            academyProfile?: {
                bio?: string;
                privacy?: Partial<PrivacyPreferences>;
            };
        } = {};
        if (activeSection === "personal-info") {
            if (displayNameChanged) {
                profileUpdates.fullname = trimmedDisplayName;
            } else if (firstNameChanged || lastNameChanged) {
                profileUpdates.firstName = trimmedFirstName;
                profileUpdates.lastName = trimmedLastName;
            }
            if (phoneChanged) profileUpdates.phone = phone.trim();
            if (bioChanged) profileUpdates.bio = bio.trim();
            if (websiteChanged) profileUpdates.website = website.trim();
            if (locationChanged) profileUpdates.location = location.trim();
        } else if (activeSection === "privacy" && hasPrivacyChanges) {
            profileUpdates.academyProfile = { privacy: privacyChanges };
        }

        setIsSaving(true);

        try {
            if (isDevPreview) {
                const previewProfileUpdates: Partial<AccountProfile> = {};
                if (activeSection === "personal-info" && displayNameChanged) {
                    previewProfileUpdates.fullname = trimmedDisplayName;
                    const nameParts = trimmedDisplayName.split(" ");
                    previewProfileUpdates.firstName = nameParts[0];
                    previewProfileUpdates.lastName = nameParts.slice(1).join(" ");
                } else if (activeSection === "personal-info") {
                    if (firstNameChanged) previewProfileUpdates.firstName = trimmedFirstName;
                    if (lastNameChanged) previewProfileUpdates.lastName = trimmedLastName;
                    if (firstNameChanged || lastNameChanged) {
                        previewProfileUpdates.fullname =
                            `${trimmedFirstName} ${trimmedLastName}`.trim();
                    }
                }
                if (activeSection === "personal-info" && phoneChanged) {
                    previewProfileUpdates.phone = phone.trim();
                }
                if (activeSection === "personal-info" && bioChanged) {
                    previewProfileUpdates.bio = bio.trim();
                }
                if (activeSection === "personal-info" && websiteChanged) {
                    previewProfileUpdates.website = website.trim();
                }
                if (activeSection === "personal-info" && locationChanged) {
                    previewProfileUpdates.location = location.trim();
                }
                if (activeSection === "privacy" && hasPrivacyChanges) {
                    previewProfileUpdates.privacy = {
                        ...account.profile.privacy,
                        ...privacyChanges,
                    };
                }

                hydrateAccount({
                    ...account,
                    user: {
                        ...account.user,
                        ...(activeSection === "personal-info" &&
                        (displayNameChanged || firstNameChanged || lastNameChanged)
                            ? {
                                  displayName:
                                      previewProfileUpdates.fullname ||
                                      account.user.displayName,
                              }
                            : {}),
                    },
                    profile: {
                        ...account.profile,
                        ...previewProfileUpdates,
                    },
                });
                toast.success("Preview profile updated locally.");
                return;
            }

            const response = await authMutationFetch(apiUrl("/auth/profile"), {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "x-chefu-app": appId,
                },
                body: JSON.stringify(profileUpdates),
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
        if (isDevPreview) {
            toast.success("Preview mode: password reset email skipped.");
            return;
        }
        setIsSendingReset(true);

        try {
            await requestPasswordResetEmail(
                account.user.email,
                appId,
                "/account",
            );
            try {
                const activityResponse = await fetch(apiUrl("/auth/security-activity"), {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "x-chefu-app": appId,
                    },
                    body: JSON.stringify({
                        eventType: "password_reset_email_sent",
                    }),
                });
                if (!activityResponse.ok) {
                    throw new Error("The reset email activity could not be recorded.");
                }
            } catch (error) {
                toast.warning("Reset email sent, but its activity could not be recorded.", {
                    description:
                        error instanceof Error ? error.message : "Please refresh and try again.",
                });
            }
            toast.success("Password reset request processed.", {
                description: `If a password reset is available for ${account.user.email}, an email is on its way. Check your inbox and spam folder.`,
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
        if (isDevPreview) {
            window.location.replace("/login");
            return;
        }

        setIsSigningOut(true);

        try {
            const [serverResult] = await Promise.allSettled([
                clearChefuAccountSession(),
            ]);
            if (serverResult.status === "rejected") {
                throw serverResult.reason;
            }
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
    }

    function hydrateAccount(data: AccountResponse) {
        setAccount(data);
        setFirstName(readText(data.profile.firstName));
        setLastName(readText(data.profile.lastName));
        setPhone(readText(data.profile.phone));
        setName(readText(data.profile.fullname) || readText(data.user.displayName));
        setBio(readText(data.profile.bio));
        setWebsite(readText(data.profile.website));
        setLocation(readText(data.profile.location));
        setLanguage(readText(data.profile.language) || "en");
        setLearningGoal(readText(data.profile.learningGoal));
        setSkillLevel(readText(data.profile.skillLevel) as AccountProfile["skillLevel"] || "beginner");
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

    function readText(value: unknown) {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") {
            const candidate = value as { message?: unknown; code?: unknown; name?: unknown };
            if (typeof candidate.message === "string") return candidate.message;
            if (typeof candidate.code === "string") return candidate.code;
            if (typeof candidate.name === "string") return candidate.name;
        }
        return "";
    }

    function goToSection(id: string) {
        const section = resolveAccountSection(id);
        setActiveSection(section);
        setAccountSearch("");

        const params = new URLSearchParams(searchParams.toString());
        if (section === "home") {
            params.delete("section");
        } else {
            params.set("section", section);
        }

        const query = params.toString();
        const nextUrl = query ? `${pathname}?${query}` : pathname;
        const currentUrl = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
        if (nextUrl !== currentUrl) {
            router.push(nextUrl, { scroll: false });
        }
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
        firstName,
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
        lastName,
        name,
        phone,
        website,
        location,
        preferredContentFormat,
        privacy,
        saveProfile,
        securityEmailsEnabled,
        sendResetEmail,
        setAccountSearch,
        setAiTutorSuggestions,
        setBio,
        setWebsite,
        setLocation,
        setDefaultCourseDifficulty,
        setEmailPreferences,
        setFirstName,
        setLanguage,
        setLearningGoal,
        setLastName,
        setLearningInterestsInput,
        setLessonStyle,
        setName,
        setPhone,
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
    if (value === "profile") return "home";
    if (value === "passkeys" || value === "passkey") return "security";
    return value && navItems.some((item) => item.id === value) ? value : "home";
}

function getCurrentAccountPath() {
    if (typeof window === "undefined") return "/account";
    return `${window.location.pathname}${window.location.search}`;
}
