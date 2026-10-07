"use client";

import { CheckCircle2, Loader2, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { AccountButton, SectionHeader } from "../AccountPrimitives";
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
        <section className="account-passkey-section">
            <SectionHeader title="Passkeys" description="Fast, secure sign-in using biometric or device authentication." />
            <div className="account-passkey-toolbar">
                <div>
                    <p className="font-medium text-[var(--fg)]">Registered passkeys</p>
                    <p className="account-helper">
                        {passkey.credentials.length
                            ? `${passkey.credentials.length} passkey${passkey.credentials.length === 1 ? "" : "s"} registered`
                            : "No passkeys registered yet."}
                    </p>
                </div>
                <AccountButton variant="primary" onClick={passkey.startPasskeyRegistration}>
                    {passkey.isRegistering ? "Adding..." : "Add passkey"}
                </AccountButton>
            </div>
            <div className="account-passkey-list">
                    {/* Add Passkey Button */}
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
                                            <AccountButton
                                                variant="danger"
                                                onClick={() => handleDeleteConfirm(credential.credentialId)}
                                                disabled={passkey.isDeleting[credential.credentialId]}
                                                className="text-xs"
                                            >
                                                {passkey.isDeleting[credential.credentialId] ? (
                                                    <Loader2 className="size-3 animate-spin" />
                                                ) : (
                                                    "Confirm"
                                                )}
                                            </AccountButton>
                                            <AccountButton
                                                variant="secondary"
                                                onClick={() => setDeleteConfirm(null)}
                                                className="account-button-icon text-xs"
                                                aria-label="Cancel passkey deletion"
                                            >
                                                <X className="size-3" />
                                            </AccountButton>
                                        </>
                                    ) : (
                                        <AccountButton
                                            variant="secondary"
                                            onClick={() => handleDeleteClick(credential.credentialId)}
                                            className="account-button-icon text-xs"
                                            aria-label={`Delete passkey for ${credential.email}`}
                                        >
                                            <Trash2 className="size-3" />
                                        </AccountButton>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {passkey.error && (
                        <div className="account-inline-error">
                            {passkey.error}
                        </div>
                    )}
            </div>
        </section>
    );
}
