"use client";

import { CheckCircle2, KeyRound, Loader2, Smartphone, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { ActionRow, SectionCard } from "../AccountControls";
import { usePasskeyManagement } from "./usePasskeyManagement";

export function PasskeySection() {
    const passkey = usePasskeyManagement();
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const handleDeleteClick = useCallback((credentialId: string) => {
        setDeleteConfirm(credentialId);
    }, []);

    const handleDeleteConfirm = useCallback(
        (credentialId: string) => {
            passkey.deleteCredential(credentialId);
            setDeleteConfirm(null);
        },
        [passkey],
    );

    return (
        <>
            <SectionCard
                icon={KeyRound}
                title="Passkeys"
                description="Fast, secure sign-in using biometric or device authentication."
                aside={
                    passkey.credentials.length > 0
                        ? `${passkey.credentials.length} passkey${passkey.credentials.length === 1 ? "" : "s"}`
                        : "None registered"
                }
            >
                <div className="divide-y divide-white/10">
                    {/* Add Passkey Button */}
                    <ActionRow
                        icon={Smartphone}
                        title="Add passkey"
                        description="Register a new passkey for secure sign-in without passwords."
                        action={
                            <button
                                type="button"
                                onClick={passkey.startPasskeyRegistration}
                                disabled={passkey.isRegistering}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e5ad5b] px-4 py-2.5 text-sm font-bold text-[#26190a] transition hover:bg-[#ffd18a] disabled:opacity-60"
                            >
                                {passkey.isRegistering ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <KeyRound className="size-4" />
                                )}
                                Add passkey
                            </button>
                        }
                    />

                    {/* Registered Passkeys */}
                    {passkey.isLoadingCredentials ? (
                        <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-[#9e968a]">
                            <Loader2 className="size-4 animate-spin" />
                            Loading passkeys...
                        </div>
                    ) : passkey.credentials.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-[#9e968a]">
                            No passkeys registered yet. Add one to get started.
                        </div>
                    ) : (
                        passkey.credentials.map((credential) => (
                            <div key={credential.credentialId} className="flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="size-5 text-[#e5ad5b]" />
                                    <div>
                                        <p className="font-medium text-[#f4f0e8]">{credential.email}</p>
                                        {credential.lastUsedAt && (
                                            <p className="text-xs text-[#9e968a]">
                                                Last used: {new Date(credential.lastUsedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {deleteConfirm === credential.credentialId ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteConfirm(credential.credentialId)}
                                                disabled={passkey.isDeleting[credential.credentialId]}
                                                className="inline-flex items-center justify-center gap-2 rounded-full border border-red-300/30 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-400/10 disabled:opacity-60"
                                            >
                                                {passkey.isDeleting[credential.credentialId] ? (
                                                    <Loader2 className="size-3 animate-spin" />
                                                ) : (
                                                    "Confirm"
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteConfirm(null)}
                                                className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/4 px-3 py-2 text-xs font-semibold text-[#d7d0c5] transition hover:bg-white/8"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteClick(credential.credentialId)}
                                            className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/4 px-3 py-2 text-xs font-semibold text-[#d7d0c5] transition hover:border-red-300/30 hover:bg-red-400/10 hover:text-red-100"
                                        >
                                            <Trash2 className="size-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {/* Error Message */}
                    {passkey.error && (
                        <div className="border-t border-white/10 bg-red-400/10 px-5 py-3 text-sm text-red-100">
                            {passkey.error}
                        </div>
                    )}
                </div>
            </SectionCard>
        </>
    );
}
