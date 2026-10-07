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
import { mockAccount } from "./preview-account";
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

const isDevPreview =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_PREVIEW === "true";

export function useAccountController() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const appId = resolveChefuApp(searchParams.get("app"));
    const sectionParam = searchParams.get("section");
    const [account, setAccount] = useState<AccountResponse | null>(null);
    const [name, setName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
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
                if (isDevPreview) {
                    if (!cancelled) hydrateAccount(mockAccount);
                    return;
                }

                const response = await fetch(apiUrl("/auth/me"), {
                    credentials: "include",
                    headers: { "x-chefu-app": appId },
                });

                if (response.status === 401) {
                    router.replace(
                        `/login?returnTo=${encodeURIComponent(getCurrentAccountPath())}`,
                    );
                    return;
                }

                if (!response.ok) throw new Error("Could not load your account.");

                const data = (await response.json()) as AccountResponse;
                if (!cancelled) {
                    hydrateAccount(data);
                }
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
    // hydrateAccount only updates local state setters and is intentionally stable for this load effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appId, router]);

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
            displayNameChanged || firstNameChanged || lastNameChanged || phoneChanged || bioChanged;
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
            if (bioChanged) profileUpdates.academyProfile = { bio: bio.trim() };
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

            const response = await fetch(apiUrl("/auth/profile"), {
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

            const updatedDisplayName =
                activeSection === "personal-info"
                    ? profileUpdates.fullname ||
                      (profileUpdates.firstName !== undefined
                          ? `${profileUpdates.firstName} ${profileUpdates.lastName}`
                          : undefined)
                    : undefined;
            if (auth.currentUser && updatedDisplayName) {
                await updateProfile(auth.currentUser, {
                    displayName: updatedDisplayName,
                }).catch(() => undefined);
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
        if (isDevPreview) {
            window.location.replace("/login");
            return;
        }

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
        setFirstName(readText(data.profile.firstName));
        setLastName(readText(data.profile.lastName));
        setPhone(readText(data.profile.phone));
        setName(readText(data.profile.fullname) || readText(data.user.displayName));
        setBio(readText(data.profile.bio));
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
