"use client";

import { Link2, Loader2, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { connectedApps } from "../account-data";
import { SaveButton, SectionCard, ToggleRow } from "../AccountControls";
import type { AccountSettingsFormProps } from "../account-form-types";
import { revokeChefuConnectedApp } from "../../../../lib/chefu-account";

export function PrivacySection({ account, isSaving, onPrivacyChange, privacy }: AccountSettingsFormProps) {
    const [revokingAppId, setRevokingAppId] = useState<string | null>(null);
    const [revokedAppIds, setRevokedAppIds] = useState<string[]>([]);
    const enabledApps = useMemo(
        () =>
            connectedApps.filter(
                (app) =>
                    account.profile.apps[app.id]?.enabled === true &&
                    !revokedAppIds.includes(app.id),
            ),
        [account.profile.apps, revokedAppIds],
    );

    async function revokeApp(appId: string) {
        setRevokingAppId(appId);
        try {
            await revokeChefuConnectedApp(appId);
            setRevokedAppIds((current) => [...current, appId]);
            toast.success("App access revoked.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to revoke app access.");
        } finally {
            setRevokingAppId(null);
        }
    }

    return (
        <SectionCard
            icon={ShieldCheck}
            title="Data & privacy"
            description="Choose what appears publicly and how personalization works."
            action={<SaveButton isSaving={isSaving} label="Save privacy" />}
        >
            <div className="divide-y divide-white/10">
                <ToggleRow
                    checked={privacy.publicProfile}
                    title="Public profile"
                    description="Allow your basic profile to be shown publicly."
                    onToggle={() =>
                        onPrivacyChange((current) => ({
                            ...current,
                            publicProfile: !current.publicProfile,
                        }))
                    }
                />
                <ToggleRow
                    checked={privacy.showCountry}
                    title="Show country"
                    description="Allow your verified country to appear where profiles are shown."
                    onToggle={() =>
                        onPrivacyChange((current) => ({
                            ...current,
                            showCountry: !current.showCountry,
                        }))
                    }
                />
            </div>
            <div className="mt-6 border-t border-[#e5e7eb] pt-5">
                <div className="mb-3 flex items-start gap-3">
                    <Link2 className="mt-0.5 size-4 text-[#6b7280]" aria-hidden="true" />
                    <div>
                        <h3 className="font-semibold text-[#111827]">Connected app access</h3>
                        <p className="mt-1 text-sm leading-6 text-[#6b7280]">
                            Review apps connected to your account and revoke access you no longer need.
                        </p>
                    </div>
                </div>
                {enabledApps.length ? (
                    <div className="divide-y divide-[#e5e7eb] rounded border border-[#e5e7eb]">
                        {enabledApps.map((app) => (
                            <div
                                key={app.id}
                                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-[#111827]">{app.name}</p>
                                    <p className="mt-1 text-xs text-[#6b7280]">{app.description}</p>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded border border-[#d1d5db] px-3 py-2 text-xs font-semibold text-[#374151] hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                    disabled={revokingAppId === app.id}
                                    onClick={() => void revokeApp(app.id)}
                                >
                                    {revokingAppId === app.id ? (
                                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                    ) : null}
                                    {revokingAppId === app.id ? "Revoking..." : "Revoke access"}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="rounded border border-dashed border-[#d1d5db] px-4 py-4 text-sm text-[#6b7280]">
                        No connected apps have access to your account.
                    </p>
                )}
            </div>
        </SectionCard>
    );
}
