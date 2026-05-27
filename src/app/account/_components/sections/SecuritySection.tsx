"use client";

import {
    CheckCircle2,
    Copy,
    KeyRound,
    Loader2,
    Mail,
    RotateCcw,
    ShieldCheck,
    Smartphone,
} from "lucide-react";
import { sendEmailVerification } from "firebase/auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ActionRow, SectionCard } from "../AccountControls";
import type { AccountSettingsFormProps } from "../account-form-types";
import { apiUrl } from "../../../../lib/chefu-account";
import { auth } from "../../../../lib/firebase";

type SecuritySummary = {
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

export function SecuritySection({
    account,
    isSendingReset,
    onSendResetEmail,
}: AccountSettingsFormProps) {
    const [summary, setSummary] = useState<SecuritySummary | null>(null);
    const [codes, setCodes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
    const [isSendingVerification, setIsSendingVerification] = useState(false);

    useEffect(() => {
        void loadSecuritySummary();
    }, []);

    async function loadSecuritySummary() {
        setIsLoading(true);
        try {
            const response = await fetch(apiUrl("/auth/security"), {
                credentials: "include",
                headers: { "x-chefu-app": "academy" },
            });

            if (!response.ok) throw new Error("Could not load security status.");
            setSummary((await response.json()) as SecuritySummary);
        } catch (error) {
            toast.error("Unable to load security status.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function generateBackupCodes() {
        setIsGeneratingCodes(true);
        try {
            const response = await fetch(apiUrl("/auth/mfa/backup-codes"), {
                method: "POST",
                credentials: "include",
                headers: { "x-chefu-app": "academy" },
            });
            const data = (await response.json().catch(() => null)) as
                | { codes?: string[]; remaining?: number }
                | { message?: string }
                | null;

            if (!response.ok || !data || !("codes" in data) || !data.codes) {
                throw new Error(
                    data && "message" in data
                        ? data.message
                        : "Could not generate recovery codes.",
                );
            }

            setCodes(data.codes);
            toast.success("Recovery codes generated.");
            await loadSecuritySummary();
        } catch (error) {
            toast.error("Unable to generate recovery codes.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsGeneratingCodes(false);
        }
    }

    async function sendVerificationEmail() {
        const user = auth.currentUser;
        if (!user) {
            toast.error("Please sign in again before sending verification email.");
            return;
        }

        setIsSendingVerification(true);
        try {
            await sendEmailVerification(user);
            toast.success("Verification email sent.", {
                description: `Check ${account.user.email}.`,
            });
        } catch (error) {
            toast.error("Unable to send verification email.", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSendingVerification(false);
        }
    }

    async function copyCodes() {
        if (!codes.length) return;
        await navigator.clipboard.writeText(codes.join("\n"));
        toast.success("Recovery codes copied.");
    }

    return (
        <SectionCard
            icon={ShieldCheck}
            title="Security & sign-in"
            description="Protect your account with verification, password recovery, and MFA recovery codes."
            aside={summary?.mfaEnabled ? "MFA enabled" : "MFA ready"}
        >
            <div className="divide-y divide-white/10">
                <ActionRow
                    icon={KeyRound}
                    title="Password reset"
                    description={`Send a secure reset link to ${account.user.email}.`}
                    action={
                        <button
                            type="button"
                            onClick={onSendResetEmail}
                            disabled={isSendingReset}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                        >
                            {isSendingReset ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                            Send reset
                        </button>
                    }
                />
                <ActionRow
                    icon={Mail}
                    title="Email verification"
                    description={
                        summary?.emailVerified
                            ? "Your email is verified."
                            : "Verify your email before enabling stronger recovery options."
                    }
                    action={
                        summary?.emailVerified ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-200">
                                <CheckCircle2 className="size-4" />
                                Verified
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={sendVerificationEmail}
                                disabled={isSendingVerification}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                            >
                                {isSendingVerification ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                                Send email
                            </button>
                        )
                    }
                />
                <ActionRow
                    icon={Smartphone}
                    title="MFA status"
                    description={
                        summary?.mfaEnabled
                            ? `${summary.enrolledFactors.length} second factor${summary.enrolledFactors.length === 1 ? "" : "s"} enrolled.`
                            : "No second factor is enrolled yet. Recovery codes are available for MFA recovery."
                    }
                    action={
                        <button
                            type="button"
                            onClick={loadSecuritySummary}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                        >
                            <RotateCcw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    }
                />
                <div className="py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="font-semibold text-white">Recovery codes</p>
                            <p className="mt-1 text-sm leading-6 text-slate-400">
                                Generate one-time codes for account recovery. We show them once and store only hashes.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={generateBackupCodes}
                            disabled={isGeneratingCodes}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-60"
                        >
                            {isGeneratingCodes ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                            Generate codes
                        </button>
                    </div>
                    {summary ? (
                        <p className="mt-3 text-xs text-slate-500">
                            {summary.backupCodesRemaining} unused codes
                            {summary.backupCodesGeneratedAt
                                ? `, generated ${new Date(summary.backupCodesGeneratedAt).toLocaleDateString()}`
                                : ""}
                        </p>
                    ) : null}
                    {codes.length ? (
                        <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/8 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-amber-100">
                                    Store these now. They will not be shown again.
                                </p>
                                <button
                                    type="button"
                                    onClick={copyCodes}
                                    className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/10"
                                >
                                    <Copy className="size-3.5" />
                                    Copy
                                </button>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {codes.map((code) => (
                                    <code
                                        key={code}
                                        className="rounded-md bg-black/25 px-3 py-2 text-sm font-semibold text-white"
                                    >
                                        {code}
                                    </code>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </SectionCard>
    );
}
