export type SecuritySummary = {
    emailVerified: boolean;
    hasPasswordProvider: boolean;
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

export type PendingMfaAction =
    | "start-setup"
    | "disable"
    | "change-password"
    | "revoke-trusted-devices";

export function formatApiError(
    data: { error?: string; message?: string; requestId?: string } | null,
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
