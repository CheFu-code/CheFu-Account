import { FirebaseError } from "firebase/app";
import { multiFactor, type MultiFactorError, type User } from "firebase/auth";

export type SecuritySummary = {
    emailVerified: boolean;
    mfaEnabled: boolean;
    enrolledFactors: Array<{
        uid: string;
        displayName: string | null;
        factorId: string;
        enrollmentTime: string | null;
    }>;
    backupCodesRemaining: number;
    backupCodesGeneratedAt: string | null;
    backupCodesLastUsedAt: string | null;
};

export type PendingMfaAction = "start-setup" | "verify-setup" | "disable";

export function isMfaRequiredError(error: unknown): error is MultiFactorError {
    return error instanceof FirebaseError && error.code === "auth/multi-factor-auth-required";
}

export function isRecentLoginRequiredError(error: unknown) {
    return error instanceof FirebaseError && error.code === "auth/requires-recent-login";
}

export function readFirebaseMfaError(error: unknown) {
    if (!(error instanceof FirebaseError)) {
        return error instanceof Error ? error.message : "Please try again.";
    }

    switch (error.code) {
        case "auth/requires-recent-login":
            return "Confirm your sign-in to continue.";
        case "auth/unverified-email":
            return "Verify your email before enabling 2FA.";
        case "auth/invalid-verification-code":
        case "auth/invalid-totp-code":
            return "The authenticator code is incorrect.";
        case "auth/code-expired":
            return "That code expired. Try the next code.";
        case "auth/second-factor-already-in-use":
            return "This authenticator is already enrolled.";
        case "auth/maximum-second-factor-count-exceeded":
            return "This account already has the maximum number of second factors.";
        case "auth/too-many-requests":
            return "Too many attempts. Please wait and try again.";
        default:
            return error.message || "Please try again.";
    }
}

export function readReauthenticationError(error: unknown) {
    if (!(error instanceof FirebaseError)) {
        return error instanceof Error ? error.message : "Please try again.";
    }

    switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
            return "That password was not correct.";
        case "auth/invalid-verification-code":
        case "auth/invalid-totp-code":
            return "The authenticator code is incorrect.";
        case "auth/code-expired":
            return "That code expired. Try the next code.";
        case "auth/too-many-requests":
            return "Too many attempts. Please wait and try again.";
        default:
            return error.message || "Please try again.";
    }
}

export function formatApiError(
    data:
        | { error?: string; message?: string; requestId?: string }
        | null,
    fallback: string,
) {
    const message = data?.message || data?.error || fallback;
    return data?.requestId ? `${message} Request ID: ${data.requestId}` : message;
}

export function accountLocationLabel(profile: {
    country?: string;
    countryCode?: string;
    detectedCountryCode?: string;
}) {
    return (
        profile.country?.trim() ||
        profile.countryCode?.trim().toUpperCase() ||
        profile.detectedCountryCode?.trim().toUpperCase() ||
        undefined
    );
}

export function securitySummaryFromFirebaseUser(
    user: User,
    currentSummary?: SecuritySummary | null,
): SecuritySummary {
    const enrolledFactors = multiFactor(user).enrolledFactors.map((factor) => ({
        uid: factor.uid,
        displayName: factor.displayName || null,
        factorId: factor.factorId,
        enrollmentTime: factor.enrollmentTime || null,
    }));

    return {
        emailVerified: user.emailVerified,
        mfaEnabled: enrolledFactors.length > 0,
        enrolledFactors,
        backupCodesRemaining: currentSummary?.backupCodesRemaining || 0,
        backupCodesGeneratedAt: currentSummary?.backupCodesGeneratedAt || null,
        backupCodesLastUsedAt: currentSummary?.backupCodesLastUsedAt || null,
    };
}
